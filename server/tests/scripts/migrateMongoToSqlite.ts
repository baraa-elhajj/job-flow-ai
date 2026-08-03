/**
 * Migrate all job documents from MongoDB into the local SQLite database.
 *
 * Usage (from server/):
 *   npx tsx tests/scripts/migrateMongoToSqlite.ts
 *
 * Required env (server/.env):
 *   MONGO_URI or MONGODB_URI
 *
 * Optional env:
 *   SQLITE_DB_PATH=./data/jobs.db
 *   MONGO_DB=jobflow                         # override DB name from URI
 *   MONGO_COLLECTIONS=jobs,Jobs              # collections in MONGO_DB (default)
 *   MONGO_EXTRA_SOURCES=test.jobs            # extra db.collection pairs, comma-separated
 */

import "dotenv/config";
import mongoose from "mongoose";
import path from "path";
import {
  getSqliteDb,
  getSqliteDbPath,
  initSqlite,
  insertJobsIntoSqlite,
} from "../../config/sqlite.js";

const BATCH_SIZE = 500;

interface CollectionTarget {
  db: string;
  collection: string;
}

function log(message: string): void {
  console.log(`[migrate] ${message}`);
}

function getMongoUri(): string {
  const uri = process.env.MONGO_URI?.trim() || process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error("Set MONGO_URI or MONGODB_URI in server/.env");
    process.exit(1);
  }
  return uri;
}

function dbNameFromUri(uri: string): string {
  const configured = process.env.MONGO_DB?.trim();
  if (configured) {
    return configured;
  }

  try {
    const pathname = new URL(uri.replace(/^mongodb(\+srv)?:/, "http:")).pathname;
    const name = pathname.replace(/^\//, "").split("/")[0];
    if (name) {
      return name;
    }
  } catch {
    // fall through
  }

  return "jobflow";
}

function parseCollectionTargets(uri: string): CollectionTarget[] {
  const primaryDb = dbNameFromUri(uri);
  const collections = (process.env.MONGO_COLLECTIONS ?? "jobs,Jobs")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const targets: CollectionTarget[] = collections.map((collection) => ({
    db: primaryDb,
    collection,
  }));

  const extra = process.env.MONGO_EXTRA_SOURCES?.trim();
  if (extra) {
    for (const source of extra.split(",")) {
      const trimmed = source.trim();
      if (!trimmed) continue;
      const [db, collection] = trimmed.includes(".")
        ? trimmed.split(".", 2)
        : ["test", trimmed];
      if (db && collection) {
        targets.push({ db, collection });
      }
    }
  }

  const seen = new Set<string>();
  return targets.filter(({ db, collection }) => {
    const key = `${db}.${collection}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeJobUrl(url: unknown): string | null {
  if (typeof url !== "string" || !url) {
    return null;
  }
  let clean = url.split("?")[0]?.replace(/\/+$/, "") ?? url;
  if (clean.startsWith("/")) {
    clean = `https://www.linkedin.com${clean}`;
  }
  return clean;
}

function extractUrl(document: Record<string, unknown>): string | null {
  const url = document.url ?? document.linkedin_url;
  if (typeof url === "string") {
    return normalizeJobUrl(url);
  }
  if (Array.isArray(url) && url.length > 0) {
    return normalizeJobUrl(String(url[0]));
  }
  return null;
}

function dedupeKey(document: Record<string, unknown>): string | null {
  const url = extractUrl(document);
  if (url) {
    return `url:${url}`;
  }

  const source = document.source ?? "unknown";
  const title = document.title;
  const by = document.by;
  const monthYear = document.monthYear;
  if (typeof title === "string" && title) {
    return `hn:${String(source)}|${String(by ?? "")}|${String(monthYear ?? "")}|${title}`;
  }

  return null;
}

function mongoDocToPayload(document: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(document)) {
    if (key === "_id") {
      payload.mongoId = String(value);
      continue;
    }
    if (value instanceof Date) {
      payload[key] = value.toISOString();
      continue;
    }
    if (
      value &&
      typeof value === "object" &&
      "toString" in value &&
      typeof (value as { toString: () => string }).toString === "function" &&
      (value as { _bsontype?: string })._bsontype === "ObjectID"
    ) {
      payload[key] = String(value);
      continue;
    }
    payload[key] = value;
  }

  return payload;
}

function loadExistingSqliteUrls(): Set<string> {
  const rows = getSqliteDb()
    .prepare("SELECT url FROM jobs WHERE url IS NOT NULL AND url != ''")
    .all() as Array<{ url: string }>;
  return new Set(rows.map((row) => row.url));
}

async function migrateCollection(
  target: CollectionTarget,
  existingKeys: Set<string>,
  existingUrls: Set<string>,
): Promise<{ inserted: number; skipped: number }> {
  const db = mongoose.connection.getClient().db(target.db);
  const collection = db.collection(target.collection);

  const total = await collection.countDocuments({});
  log(`Reading ${target.db}.${target.collection} (${total} document(s))`);

  let inserted = 0;
  let skipped = 0;
  let batch: Record<string, unknown>[] = [];

  const cursor = collection.find({});

  for await (const document of cursor) {
    const payload = mongoDocToPayload(document as Record<string, unknown>);
    const key = dedupeKey(payload);

    if (key && existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

    const url = extractUrl(payload);
    if (url && existingUrls.has(url)) {
      skipped += 1;
      if (key) {
        existingKeys.add(key);
      }
      continue;
    }

    batch.push(payload);
    if (key) {
      existingKeys.add(key);
    }
    if (url) {
      existingUrls.add(url);
    }

    if (batch.length >= BATCH_SIZE) {
      inserted += insertJobsIntoSqlite(batch).count;
      log(`  inserted ${inserted} so far from ${target.db}.${target.collection}...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    inserted += insertJobsIntoSqlite(batch).count;
  }

  log(`  done ${target.db}.${target.collection}: inserted ${inserted}, skipped ${skipped}`);
  return { inserted, skipped };
}

async function main(): Promise<void> {
  const uri = getMongoUri();
  const sqlitePath = path.resolve(getSqliteDbPath());
  const targets = parseCollectionTargets(uri);

  log(`MongoDB URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}`);
  log(`SQLite path: ${sqlitePath}`);
  log(`Collections: ${targets.map((t) => `${t.db}.${t.collection}`).join(", ")}`);

  initSqlite();

  await mongoose.connect(uri);
  log("Connected to MongoDB");

  const existingKeys = new Set<string>();
  const existingUrls = loadExistingSqliteUrls();
  log(`SQLite already has ${existingUrls.size} URL(s)`);

  let totalInserted = 0;
  let totalSkipped = 0;

  try {
    for (const target of targets) {
      const { inserted, skipped } = await migrateCollection(
        target,
        existingKeys,
        existingUrls,
      );
      totalInserted += inserted;
      totalSkipped += skipped;
    }
  } finally {
    await mongoose.disconnect();
  }

  log(`Migration complete. Inserted ${totalInserted}, skipped ${totalSkipped}.`);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
