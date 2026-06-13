/**
 * Migration script to convert datePosted from string to Date (timestamp)
 * Handles various date string formats:
 * - ISO date: "2026-06-14"
 * - Relative dates: "about 2 hours ago"
 * - Other formats: attempts to parse with new Date()
 */

import mongoose from "mongoose";
import "dotenv/config";
import { connectDB } from "../../config/db.js";

const BATCH_SIZE = 100;

function parseDateString(dateString: string): Date {
  if (!dateString || typeof dateString !== "string") {
    console.warn(`Invalid date string: ${dateString}, using current date`);
    return new Date();
  }

  // Try to match ISO date format: YYYY-MM-DD
  const isoMatch = dateString.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    return new Date(isoMatch[0]);
  }

  // Try to match relative date: "about X [minute|hour|day|month]s? ago"
  const relativeMatch = dateString.match(
    /about\s+(\d+)\s+(minute|hour|day|month)s?\s+ago/i,
  );
  if (relativeMatch && relativeMatch[1] && relativeMatch[2]) {
    const value = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2].toLowerCase();
    const date = new Date();

    if (unit === "minute") {
      date.setMinutes(date.getMinutes() - value);
    } else if (unit === "hour") {
      date.setHours(date.getHours() - value);
    } else if (unit === "day") {
      date.setDate(date.getDate() - value);
    } else if (unit === "month") {
      date.setMonth(date.getMonth() - value);
    }

    return date;
  }

  // Try generic date parsing
  const parsed = new Date(dateString);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Fallback to current date if parsing fails
  console.warn(`Could not parse date: "${dateString}", using current date`);
  return new Date();
}

async function migrateJobs() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database not connected");
  }

  const collection = db.collection("jobs");

  // Find all documents where datePosted is a string (not a Date)
  const stringDateJobs = await collection
    .find({
      datePosted: { $type: "string" },
    })
    .toArray();

  console.log(
    `\nFound ${stringDateJobs.length} documents with string datePosted`,
  );

  if (stringDateJobs.length === 0) {
    console.log("✓ No migration needed - all documents have Date objects");
    return;
  }

  let processed = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < stringDateJobs.length; i += BATCH_SIZE) {
    const batch = stringDateJobs.slice(i, i + BATCH_SIZE);
    const bulkOps = batch.map((doc) => {
      try {
        const newDate = parseDateString(doc.datePosted);
        return {
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { datePosted: newDate } },
          },
        };
      } catch (err) {
        errors++;
        console.error(`Error processing doc ${doc._id}: ${err}`);
        return null;
      }
    });

    const validOps = bulkOps.filter((op) => op !== null);

    if (validOps.length > 0) {
      await collection.bulkWrite(validOps as any);
      processed += validOps.length;
      console.log(
        `Processed ${Math.min(processed, stringDateJobs.length)}/${stringDateJobs.length} documents...`,
      );
    }
  }

  console.log(`\n✓ Migration complete`);
  console.log(`  - Successfully migrated: ${processed}`);
  console.log(`  - Errors: ${errors}`);
}

async function main() {
  try {
    console.log("Running migrateDatePosted script...");

    console.log("Connecting to database...");
    await connectDB();

    await migrateJobs();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
  }
}

main();
