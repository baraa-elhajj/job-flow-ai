import type { Request, Response } from "express";
import mongoose from "mongoose";

const JOBS_COLLECTION = "jobs";
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
 * GET /api/jobs?page=&limit=&source=&q=
 * Unified `jobs` collection. Optional `source`: `linkedin` | `hnhiring` (omit for all).
 * Optional `q`: search query to filter by title, company, and description.
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

    const sourceParam = parseJobSourceQuery(req.query.src);
    if (
      req.query.src !== undefined &&
      req.query.src !== "" &&
      sourceParam === null
    ) {
      return res.status(400).json({
        success: false,
        error: `Invalid source. Use one of: ${JOB_SOURCES.join(", ")}`,
      });
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string, 10) || 20),
    );
    const skip = (page - 1) * limit;
    const searchQuery = ((req.query.q as string) || "").trim();

    const filter: Record<string, any> =
      sourceParam !== "all" ? { source: sourceParam } : {};

    // Add search filter if query is provided
    if (searchQuery) {
      const searchRegex = { $regex: searchQuery, $options: "i" };
      filter.$or = [
        { title: searchRegex },
        { companyName: searchRegex },
        { skills: searchRegex },
      ];
    }

    const collection = db.collection(JOBS_COLLECTION);
    const [jobs, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
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
