import "dotenv/config";
// import mongoose from "mongoose";
// import { connectDB } from '../../config/db.js';
import { initSqlite } from '../../config/sqlite.js';
import { scrapeAndStoreHNHiringJobs } from '../../services/hnhiringScraper.js';
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
 * Scrapes hnhiring.com directly, parses titles with {@link HNHiringParser},
 * and stores enriched jobs in SQLite.
 *
 * Usage: npx tsx server/tests/scripts/parseHNhiring.ts [month] [year]
 * Example: npx tsx server/tests/scripts/parseHNhiring.ts may 2026
 */
async function runTest() {
   
    const month = process.argv[2] ?? 'may';
    const year = parseInt(process.argv[3] ?? String(new Date().getFullYear()), 10);

    try {
        console.log("Initializing SQLite database...");
        initSqlite();

        console.log(`Scraping hnhiring.com (${month} ${year})...`);
        const scraped = await scrapeAndStoreHNHiringJobs(month, year) ?? [];
        console.log(`Scraper returned ${scraped.length} job(s).`);

        console.log(`Parsing ${scraped.length} job(s)...`);
        const parser = new HNHiringParser();
        const enrichedJobs = await Promise.all(
            scraped.map(async (job) => {
                const parsed = await parser.parseHnJob(job.title, job.text);
                const enrichedFields = initializeEnrichedFields(parsed);

                return {
                    by: job.by,
                    datePosted: job.datePosted,
                    title: job.title,
                    text: job.text,
                    links: job.links,
                    monthYear: job.monthYear,
                    source: 'hnhiring' as const,
                    ...enrichedFields,
                };
            }),
        );

        console.log(`Parsed ${enrichedJobs.length} enriched job(s).`);
        console.log('Enriched jobs are stored via scrapeAndStoreHNHiringJobs in SQLite.');

        /* MongoDB implementation (commented out):
        console.log("Connecting to database...");
        await connectDB();

        const db = mongoose.connection.db;
        const parsedHNJobs = db.collection('Jobs');
        if (enrichedJobs.length > 0) {
            const insertResult = await parsedHNJobs.insertMany(enrichedJobs);
            console.log(`Inserted ${insertResult.insertedCount} job(s) into 'parsedHNJobs'.`);
        }
        await mongoose.disconnect();
        */

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

runTest();
