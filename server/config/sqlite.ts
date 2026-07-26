import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

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
`;

let db: DatabaseSync | null = null;

export function getSqliteDbPath(): string | null {
  const configured = process.env.SQLITE_DB_PATH?.trim();
  return configured || null;
}

function ensureDbDir(dbPath: string): void {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getSqliteDb(): DatabaseSync | null {
  const dbPath = getSqliteDbPath();
  if (!dbPath) {
    return null;
  }

  if (!db) {
    const resolved = path.resolve(dbPath);
    ensureDbDir(resolved);
    db = new DatabaseSync(resolved);
    db.exec(SCHEMA);
  }

  return db;
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

export function insertJobsIntoSqlite(jobs: Record<string, unknown>[]): number {
  const database = getSqliteDb();
  if (!database || jobs.length === 0) {
    return 0;
  }

  const stmt = database.prepare(`
    INSERT INTO jobs (source, title, url, date_posted, payload, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  database.exec("BEGIN");
  try {
    for (const job of jobs) {
      stmt.run(
        typeof job.source === "string" ? job.source : "unknown",
        extractTitle(job),
        extractUrl(job),
        extractDatePosted(job),
        serializeJob(job),
      );
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return jobs.length;
}
