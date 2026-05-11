import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from '../../config/db.js';
import { HNHiringJob } from '../../models/HNHiringJob.js';
import { HNHiringParser } from '../../utils/hnhiringParser.js';

// Ensure all enriched fields are present in every document
function initializeEnrichedFields(parsed: any) {
    return {
        companyName: parsed.companyName || null,
        jobTitle: parsed.jobTitle || [],
        jobType: parsed.jobType || [],
        employmentType: parsed.employmentType || [],
        location: parsed.location || [],
        skills: parsed.skills || [],
        seniority: parsed.seniority || [],
        salary: parsed.salary || [],
        visaSponsorship: parsed.visaSponsorship || [],
        url: parsed.url || [],
    };
}

/**
 * Fetches raw HN hiring jobs from MongoDB, enriches them by parsing titles,
 * and saves the enriched data to a new collection.
 */
async function runTest() {
    try {
        console.log("Connecting to database...");
        await connectDB();

        console.log("Fetching raw HN hiring jobs from 'hnhiringjobs' collection...");
        const rawJobs = await HNHiringJob.find().lean();

        if (rawJobs.length === 0) {
            console.log("No jobs found in hnhiringjobs collection.");
            process.exit(0);
        }

        console.log(`Found ${rawJobs.length} raw jobs. Starting enrichment...`);

        const parser = new HNHiringParser();
        const enrichedJobs = rawJobs.map((job) => {
            const parsed = parser.parseHnTitle(job.title || '');
            const enrichedFields = initializeEnrichedFields(parsed);

            return {
                ...job,
                ...enrichedFields,
            };
        });

        // Switch to parsedHNJobs collection
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error("Database connection not established");
        }

        const parsedHNJobs = db.collection('parsedHNJobs');

        // Clear old entries
        await parsedHNJobs.deleteMany({});

        // Insert enriched jobs
        const insertResult = await parsedHNJobs.insertMany(enrichedJobs);
        console.log(`Added ${insertResult.insertedCount} jobs into 'parsedHNJobs' collection.`);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    } finally {
        console.log("\nClosing database connection...");
        await mongoose.connection.close();
    }
}

runTest();
