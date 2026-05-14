import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../config/db.js";
import { scrapeAndStoreLinkedInJobs } from "../../services/linkedinScraper.js";

async function runTest() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    // LinkedIn search URL for Software Engineer jobs
    const searchUrl =
      "https://www.linkedin.com/jobs/search/?keywords=software%20engineer";
    const limit = 25;

    console.log(
      `Running scrapeAndStoreLinkedInJobs('${searchUrl}', ${limit})...`,
    );
    await scrapeAndStoreLinkedInJobs(searchUrl, limit);

    console.log("Scraping completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    console.log("Disconnecting from database...");
    await mongoose.disconnect();
  }
}

runTest();
