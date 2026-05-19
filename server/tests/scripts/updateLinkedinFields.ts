import "dotenv/config";
import mongoose, { disconnect } from "mongoose";
import { connectDB } from "../../config/db.js";

// TODO: Remove later when we make sure python linkedin scraper is adding fields correctly.
async function renameDatabaseFields() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    const collection = db.collection("Jobs");
    // Execute the rename operation
    const result = await collection.updateMany(
      { source: "linkedin" }, // Filter to target only LinkedIn jobs
      {
        $rename: {
          linkedin_url: "url",
          job_title: "title",
          company: "companyName",
          company_linkedin_url: "companyLinkedInUrl",
          posted_date: "datePosted",
          applicant_count: "applicantCount",
          job_description: "text",
        },
      },
    );

    console.log(`Rename process was successful!`);
    console.log(`Matched documents: ${result.matchedCount}`);
    console.log(`Modified documents: ${result.modifiedCount}`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Clean up connection
    await disconnect();
  }
}

renameDatabaseFields();
