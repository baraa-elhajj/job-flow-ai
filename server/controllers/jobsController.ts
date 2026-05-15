import type { Request, Response } from "express";
import mongoose from "mongoose";
import { LinkedInJob } from "../models/LinkedInJob.js";
// import { scrapeHNHiring } from "../services/hnhiringScraper.js";

const JOBS_COLLECTION = "Jobs";
const JOB_SOURCES = ["linkedin", "hnhiring", "all"] as const;
type JobSource = (typeof JOB_SOURCES)[number];

function parseJobSourceQuery(raw: unknown): JobSource | null {
    if (raw === undefined || raw === null || raw === "") {
        return null;
    }
    if (typeof raw !== "string") {
        return null;
    }
    const s = raw.trim().toLowerCase();
    if (s === "") {
        return null;
    }
    if ((JOB_SOURCES as readonly string[]).includes(s)) {
        return s as JobSource;
    }
    return null;
}

/**
 * GET /api/jobs?page=&limit=&source=
 * Unified `Jobs` collection. Optional `source`: `linkedin` | `hnhiring` (omit for all).
 */
export async function fetchJobs(req: Request, res: Response) {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({
                success: false,
                error: "Database connection not established",
            });
        }

        console.log("req.query", req.query);

        const sourceParam = parseJobSourceQuery(req.query.src);
        if (req.query.source !== undefined && req.query.src !== "" && sourceParam === null) {
            return res.status(400).json({
                success: false,
                error: `Invalid source. Use one of: ${JOB_SOURCES.join(", ")}`,
            });
        }

        const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
        const skip = (page - 1) * limit;

        const filter = sourceParam !== "all" ? { source: sourceParam } : {};

        const collection = db.collection(JOBS_COLLECTION);
        const [jobs, total] = await Promise.all([
            collection.find(filter).sort({ _id: -1 }).skip(skip).limit(limit).toArray(),
            collection.countDocuments(filter),
        ]);

        res.json({
            success: true,
            count: jobs.length,
            total,
            page,
            totalPages: Math.ceil(total / limit) || 1,
            jobs,
        });
    } catch (error) {
        console.error("Error fetching Jobs:", error);
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
}

// GET /api/jobs/hnhiring?month=?&year=?
// export async function fetchHNHiringJobs(req: Request, res: Response) {
//     const { month, year } = req.query;
//     if (!month || !year) {
//         return res.status(400).json({
//             success: false,
//             error: "month and year query parameters are required",
//         });
//     }

//     try {
//         const jobs = await scrapeHNHiring(month as string, parseInt(year as string, 10));

//         if (jobs.length === 0) {
//             console.log("No jobs found.");
//         }

//         res.json({
//             success: true,
//             count: jobs.length,
//             jobs,
//         });
//     } catch (error) {
//         console.error("Error scraping HNHiring jobs:", error);
//         res.status(500).json({
//             success: false,
//             error: String(error),
//         });
//     }
// }

// GET /api/jobs/parsed
// export async function fetchParsedJobs(req: Request, res: Response) {
//     try {
//         const db = mongoose.connection.db;
//         if (!db) {
//             return res.status(500).json({
//                 success: false,
//                 error: 'Database connection not established',
//             });
//         }

//         const page = Math.max(1, parseInt(req.query.page as string) || 1);
//         const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
//         const skip = (page - 1) * limit;

//         const collection = db.collection('parsedHNJobs');
//         const [jobs, total] = await Promise.all([
//             collection.find().sort({ datePosted: -1 }).skip(skip).limit(limit).toArray(),
//             collection.countDocuments(),
//         ]);

//         res.json({
//             success: true,
//             count: jobs.length,
//             total,
//             page,
//             totalPages: Math.ceil(total / limit),
//             jobs,
//         });
//     } catch (error) {
//         console.error('Error fetching parsed jobs:', error);
//         res.status(500).json({
//             success: false,
//             error: String(error),
//         });
//     }
// }

// GET /api/jobs/parsed/:id
export async function fetchParsedJobById(req: Request<{ id: string }>, res: Response) {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({
                success: false,
                error: 'Database connection not established',
            });
        }

        const { ObjectId } = mongoose.Types;
        let objectId;
        try {
            objectId = new ObjectId(req.params.id);
        } catch {
            return res.status(400).json({
                success: false,
                error: 'Invalid job ID format',
            });
        }

        const collection = db.collection(JOBS_COLLECTION);
        const job = await collection.findOne({
            _id: objectId,
            source: 'hnhiring',
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Job not found',
            });
        }

        res.json({
            success: true,
            job,
        });
    } catch (error) {
        console.error('Error fetching job by ID:', error);
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
}

// GET /api/jobs/linkedin
// export async function fetchLinkedInJobs(req: Request, res: Response) {
//     try {
//         const page = Math.max(1, parseInt(req.query.page as string) || 1);
//         const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
//         const skip = (page - 1) * limit;

//         const [jobs, total] = await Promise.all([
//             LinkedInJob.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
//             LinkedInJob.countDocuments(),
//         ]);

//         res.json({
//             success: true,
//             count: jobs.length,
//             total,
//             page,
//             totalPages: Math.ceil(total / limit),
//             jobs,
//         });
//     } catch (error) {
//         console.error('Error fetching LinkedIn jobs:', error);
//         res.status(500).json({
//             success: false,
//             error: String(error),
//         });
//     }
// }

// GET /api/jobs/linkedin/:id
// export async function fetchLinkedInJobById(req: Request<{ id: string }>, res: Response) {
//     try {
//         const { id } = req.params;
//         const job = await LinkedInJob.findById(id);

//         if (!job) {
//             return res.status(404).json({
//                 success: false,
//                 error: 'LinkedIn job not found',
//             });
//         }

//         res.json({
//             success: true,
//             job,
//         });
//     } catch (error) {
//         console.error('Error fetching LinkedIn job by ID:', error);
//         res.status(500).json({
//             success: false,
//             error: String(error),
//         });
//     }
// }
