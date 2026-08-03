/**
 * Migration script to convert datePosted from string to Date (timestamp)
 * Handles various date string formats:
 * - ISO date: "2026-06-14"
 * - Relative dates: "about 2 hours ago"
 * - Other formats: attempts to parse with new Date()
 *
 * NOTE: This script was written for MongoDB and is no longer active.
 * SQLite stores datePosted as text in the payload column.
 */

/*
import mongoose from "mongoose";
import "dotenv/config";
import { connectDB } from "../../config/db.js";

const BATCH_SIZE = 100;

function parseDateString(dateString: string): Date {
  ...
}

async function migrateJobs() {
  const db = mongoose.connection.db;
  ...
}

async function main() {
  try {
    console.log("Running migrateDatePosted script...");
    await connectDB();
    await migrateJobs();
  } finally {
    await mongoose.disconnect();
  }
}

main();
*/

console.log(
  "migrateDatePosted is disabled — MongoDB has been replaced by SQLite.",
);
