import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from '../../config/db.js';
import { HNHiringJob } from '../../models/HNHiringJob.js';
import { HNHiringParser } from '../../utils/hnhiringParser.js';

async function runTest() {
    try {
        console.log("Connecting to database...");
        await connectDB();

        console.log("Fetching up to 10 jobs from the database...");
        const jobs = await HNHiringJob.find().limit(10);

        if (jobs.length === 0) {
            console.log("No jobs found in the database.");
            return;
        }

        const parser = new HNHiringParser();
        let i = 0;
        for (const job of jobs) {
            if (i == 10) break;
            console.log("\n--------------------------------------------------");
            console.log("Original Title:", job.title);
            console.log("Original Desc (preview):", job.text.substring(0, 100).replace(/\n/g, ' ') + "...");

            const parsedData = await parser.parseHnJob(job.title, job.text);

            console.log("Parsed Data:", JSON.stringify(parsedData, null, 2));
            console.log("--------------------------------------------------");
            i++;
        }

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
