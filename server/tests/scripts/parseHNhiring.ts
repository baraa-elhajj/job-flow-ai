import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from '../../config/db.js';
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

function docDedupKey(doc: { by?: unknown; title?: unknown }): string {
    return `${String(doc.by ?? '')}\0${String(doc.title ?? '')}`;
}

/**
 * Scrapes hnhiring.com directly, parses titles with {@link HNHiringParser},
 * inserts only jobs that are not already in `parsedHNJobs` (matched by by + title).
 *
 * Usage: npx tsx server/tests/scripts/parseHNhiring.ts [month] [year]
 * Example: npx tsx server/tests/scripts/parseHNhiring.ts may 2026
 */
async function runTest() {
   
    const month = process.argv[2] ?? 'may';
    const year = parseInt(process.argv[3] ?? String(new Date().getFullYear()), 10);

    try {
        console.log("Connecting to database...");
        await connectDB();

        console.log(`Scraping hnhiring.com (${month} ${year})...`);
        const scraped = await scrapeAndStoreHNHiringJobs(month, year) ?? [];
        console.log(`Scraper returned ${scraped.length} job(s).`);

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error("Database connection not established");
        }

        const parsedHNJobs = db.collection('Jobs');
        // await parsedHNJobs.updateMany(
        //     {},
        //     { $set: { source: "hnhiring" } }
        //   )
        // const existing = await parsedHNJobs
        //     .find({}, { projection: { by: 1, title: 1, _id: 0 } })
        //     .toArray();
        // const existingKeys = new Set(
        //     existing.map((j) => docDedupKey(j as { by?: unknown; title?: unknown })),
        // );

        // const novel = scraped.filter((j) => !existingKeys.has(docDedupKey(j)));
        // console.log(`New jobs (not already in parsedHNJobs): ${novel.length}`);

        // if (novel.length === 0) {
        //     console.log("Nothing to parse or insert.");
        //     await mongoose.disconnect();
        //     process.exit(0);
        // }

        // console.log(`Parsing ${novel.length} new job(s)...`);
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

        if (enrichedJobs.length > 0) {
            const insertResult = await parsedHNJobs.insertMany(enrichedJobs);
            console.log(`Inserted ${insertResult.insertedCount} job(s) into 'parsedHNJobs'.`);
        } else {
            console.log('No new jobs to insert.');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        await mongoose.disconnect().catch(() => {});
        process.exit(1);
    }
}

runTest();
