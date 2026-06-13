import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../config/db.js";
import { scrapeAndStoreHNHiringJobs } from "../../services/hnhiringScraper.js";

async function run() {
  try {
    console.log("Running manual HN scrape...");

    console.log("Connecting to database...");
    await connectDB();

    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "long" }).toLowerCase();
    const year = now.getFullYear();

    await scrapeAndStoreHNHiringJobs(month, year);

    process.exit(0);
  } catch (error) {
    console.error("HN scrape failed:", error);
    process.exit(1);
  } finally {
    console.log("Disconnecting from database...");
    await mongoose.disconnect();
  }
}

run();
