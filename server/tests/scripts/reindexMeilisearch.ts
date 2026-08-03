import "dotenv/config";
import { initSqlite, getSqliteDb } from "../../config/sqlite.js";
import {
  initMeilisearch,
  isMeilisearchEnabled,
  indexJobs,
  jobToSearchDocument,
} from "../../services/meilisearch.js";

const BATCH_SIZE = 500;

async function main(): Promise<void> {
  initSqlite();
  await initMeilisearch();

  if (!isMeilisearchEnabled()) {
    console.error(
      "Meilisearch is not available. Start it with `npm run meili` and set MEILI_HOST / MEILI_API_KEY.",
    );
    process.exit(1);
  }

  const database = getSqliteDb();
  const countRow = database
    .prepare("SELECT COUNT(*) AS total FROM jobs")
    .get() as { total: number };
  const totalJobs = countRow.total;

  if (totalJobs === 0) {
    console.log("No jobs in SQLite. Nothing to index.");
    return;
  }

  console.log(`Reindexing ${totalJobs} job(s) into Meilisearch...`);

  let offset = 0;
  let indexed = 0;

  while (offset < totalJobs) {
    const rows = database
      .prepare(
        "SELECT id, payload FROM jobs ORDER BY id ASC LIMIT ? OFFSET ?",
      )
      .all(BATCH_SIZE, offset) as Array<{ id: number; payload: string }>;

    if (rows.length === 0) {
      break;
    }

    const docs = rows.map((row) => {
      const job = JSON.parse(row.payload) as Record<string, unknown>;
      return jobToSearchDocument(String(row.id), job);
    });

    await indexJobs(docs);
    indexed += docs.length;
    offset += rows.length;

    console.log(`Indexed ${indexed}/${totalJobs}...`);
  }

  console.log(`Done. ${indexed} job(s) indexed.`);
}

main().catch((error) => {
  console.error("Reindex failed:", error);
  process.exit(1);
});
