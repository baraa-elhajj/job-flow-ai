import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { indexInsertedJobs } from "../services/meilisearch.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  title TEXT,
  url TEXT,
  date_posted TEXT,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_url ON jobs(url);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  picture TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
`;

const DEFAULT_DB_PATH = "./data/jobs.db";

let db: DatabaseSync | null = null;

export function getSqliteDbPath(): string {
  const configured = process.env.SQLITE_DB_PATH?.trim();
  return configured || DEFAULT_DB_PATH;
}

function ensureDbDir(dbPath: string): void {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getSqliteDb(): DatabaseSync {
  if (!db) {
    const resolved = path.resolve(getSqliteDbPath());
    ensureDbDir(resolved);
    db = new DatabaseSync(resolved);
    db.exec(SCHEMA);
  }

  return db;
}

export function initSqlite(): void {
  getSqliteDb();
  console.log(`SQLite database ready: ${path.resolve(getSqliteDbPath())}`);
}

export function closeSqliteDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function serializeJob(job: Record<string, unknown>): string {
  return JSON.stringify(job, (_key, value) =>
    value instanceof Date ? value.toISOString() : value,
  );
}

function extractUrl(job: Record<string, unknown>): string | null {
  const url = job.url ?? job.linkedin_url;
  if (typeof url === "string") {
    return url;
  }
  if (Array.isArray(url) && url.length > 0) {
    return String(url[0]);
  }
  return null;
}

export function normalizeJobUrl(url: string): string {
  let clean = url.split("?")[0]?.replace(/\/+$/, "") ?? url;
  if (clean.startsWith("/")) {
    clean = `https://www.linkedin.com${clean}`;
  }
  return clean;
}

function extractTitle(job: Record<string, unknown>): string | null {
  return typeof job.title === "string" ? job.title : null;
}

function extractDatePosted(job: Record<string, unknown>): string | null {
  const datePosted = job.datePosted ?? job.date_posted;
  if (datePosted instanceof Date) {
    return datePosted.toISOString();
  }
  if (typeof datePosted === "string") {
    return datePosted;
  }
  return null;
}

function rowToJob(row: { id: number; payload: string }): Record<string, unknown> {
  const job = JSON.parse(row.payload) as Record<string, unknown>;
  job._id = String(row.id);
  return job;
}

export interface InsertJobsResult {
  count: number;
  inserted: Array<{ id: number; job: Record<string, unknown> }>;
}

export function insertJobsIntoSqlite(
  jobs: Record<string, unknown>[],
): InsertJobsResult {
  const database = getSqliteDb();
  if (jobs.length === 0) {
    return { count: 0, inserted: [] };
  }

  const stmt = database.prepare(`
    INSERT INTO jobs (source, title, url, date_posted, payload, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  const inserted: Array<{ id: number; job: Record<string, unknown> }> = [];

  database.exec("BEGIN");
  try {
    for (const job of jobs) {
      const result = stmt.run(
        typeof job.source === "string" ? job.source : "unknown",
        extractTitle(job),
        extractUrl(job),
        extractDatePosted(job),
        serializeJob(job),
      );
      const id = Number(result.lastInsertRowid);
      inserted.push({ id, job });
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  if (inserted.length > 0) {
    void indexInsertedJobs(inserted).catch((err) =>
      console.warn(
        "Meilisearch indexing failed (SQLite insert succeeded):",
        err,
      ),
    );
  }

  return { count: inserted.length, inserted };
}

export function getExistingJobUrls(urls: string[]): string[] {
  if (urls.length === 0) {
    return [];
  }

  const normalized = urls.map(normalizeJobUrl);
  const lookup = [...new Set([...urls, ...normalized])];
  const placeholders = lookup.map(() => "?").join(", ");

  const rows = getSqliteDb()
    .prepare(`SELECT url FROM jobs WHERE url IN (${placeholders})`)
    .all(...lookup) as Array<{ url: string }>;

  const existing = new Set<string>();
  for (const row of rows) {
    if (row.url) {
      existing.add(row.url);
      existing.add(normalizeJobUrl(row.url));
    }
  }

  return normalized.filter((url) => existing.has(url));
}

export function insertJobsIntoSqliteWithDedup(
  jobs: Record<string, unknown>[],
): { inserted: number; skipped: number } {
  if (jobs.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  const urls = jobs
    .map((job) => extractUrl(job))
    .filter((url): url is string => typeof url === "string");
  const existing = new Set(getExistingJobUrls(urls));

  const toInsert: Record<string, unknown>[] = [];
  let skipped = 0;

  for (const job of jobs) {
    const url = extractUrl(job);
    if (url) {
      const normalized = normalizeJobUrl(url);
      if (existing.has(normalized) || existing.has(url)) {
        skipped += 1;
        continue;
      }
      existing.add(normalized);
    }
    toInsert.push(job);
  }

  const { count: inserted } = insertJobsIntoSqlite(toInsert);
  return { inserted, skipped };
}

export interface SqliteJobQuery {
  source?: string | null;
  search?: string | undefined;
  postedAfter?: string | undefined;
  postedBefore?: string | undefined;
  page: number;
  limit: number;
}

export function fetchJobsFromSqlite(query: SqliteJobQuery): {
  jobs: Record<string, unknown>[];
  total: number;
} {
  const database = getSqliteDb();
  const conditions: string[] = [];
  const params: Array<string | number | null> = [];

  if (query.source) {
    conditions.push("source = ?");
    params.push(query.source);
  }

  if (query.search) {
    const pattern = `%${query.search}%`;
    conditions.push("(title LIKE ? OR payload LIKE ?)");
    params.push(pattern, pattern);
  }

  if (query.postedAfter) {
    conditions.push("date_posted IS NOT NULL AND date_posted >= ?");
    params.push(query.postedAfter);
  }

  if (query.postedBefore) {
    conditions.push("date_posted IS NOT NULL AND date_posted <= ?");
    params.push(query.postedBefore);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = database
    .prepare(`SELECT COUNT(*) AS total FROM jobs ${whereClause}`)
    .get(...params) as { total: number };
  const total = countRow.total;

  const offset = (query.page - 1) * query.limit;
  const rows = database
    .prepare(
      `SELECT id, payload FROM jobs ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, query.limit, offset) as Array<{ id: number; payload: string }>;

  return {
    jobs: rows.map(rowToJob),
    total,
  };
}

export function fetchJobByIdFromSqlite(
  jobId: string,
): Record<string, unknown> | null {
  const id = Number.parseInt(jobId, 10);
  if (!Number.isFinite(id)) {
    return null;
  }

  const row = getSqliteDb()
    .prepare("SELECT id, payload FROM jobs WHERE id = ?")
    .get(id) as { id: number; payload: string } | undefined;

  return row ? rowToJob(row) : null;
}

export function fetchJobsByIds(ids: string[]): Record<string, unknown>[] {
  if (ids.length === 0) {
    return [];
  }

  const numericIds = ids
    .map((id) => Number.parseInt(id, 10))
    .filter((id) => Number.isFinite(id));

  if (numericIds.length === 0) {
    return [];
  }

  const placeholders = numericIds.map(() => "?").join(", ");
  const rows = getSqliteDb()
    .prepare(`SELECT id, payload FROM jobs WHERE id IN (${placeholders})`)
    .all(...numericIds) as Array<{ id: number; payload: string }>;

  const byId = new Map(rows.map((row) => [String(row.id), rowToJob(row)]));

  return ids
    .map((id) => byId.get(id))
    .filter((job): job is Record<string, unknown> => job !== undefined);
}

export interface SqliteUser {
  id: number;
  googleId: string;
  email: string;
  name: string;
  picture?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

function rowToUser(row: {
  id: number;
  google_id: string;
  email: string;
  name: string;
  picture: string | null;
  created_at: string;
  updated_at: string;
}): SqliteUser {
  return {
    id: row.id,
    googleId: row.google_id,
    email: row.email,
    name: row.name,
    picture: row.picture ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findUserById(userId: string): SqliteUser | null {
  const id = Number.parseInt(userId, 10);
  if (!Number.isFinite(id)) {
    return null;
  }

  const row = getSqliteDb()
    .prepare(
      "SELECT id, google_id, email, name, picture, created_at, updated_at FROM users WHERE id = ?",
    )
    .get(id) as
    | {
        id: number;
        google_id: string;
        email: string;
        name: string;
        picture: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  return row ? rowToUser(row) : null;
}

export function findUserByGoogleId(googleId: string): SqliteUser | null {
  const row = getSqliteDb()
    .prepare(
      "SELECT id, google_id, email, name, picture, created_at, updated_at FROM users WHERE google_id = ?",
    )
    .get(googleId) as
    | {
        id: number;
        google_id: string;
        email: string;
        name: string;
        picture: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  return row ? rowToUser(row) : null;
}

export function createUser(user: {
  googleId: string;
  email: string;
  name: string;
  picture?: string | undefined;
}): SqliteUser {
  const result = getSqliteDb()
    .prepare(
      `
      INSERT INTO users (google_id, email, name, picture, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      `,
    )
    .run(user.googleId, user.email, user.name, user.picture ?? null);

  const created = findUserById(String(result.lastInsertRowid));
  if (!created) {
    throw new Error("Failed to create user");
  }
  return created;
}

export function updateUser(
  userId: number,
  updates: { email: string; name: string; picture?: string | undefined },
): SqliteUser {
  getSqliteDb()
    .prepare(
      `
      UPDATE users
      SET email = ?, name = ?, picture = ?, updated_at = datetime('now')
      WHERE id = ?
      `,
    )
    .run(updates.email, updates.name, updates.picture ?? null, userId);

  const updated = findUserById(String(userId));
  if (!updated) {
    throw new Error("Failed to update user");
  }
  return updated;
}
