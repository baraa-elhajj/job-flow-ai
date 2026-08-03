import type { Request, Response } from "express";
// import mongoose from "mongoose";
// import { Job } from "../models/Job.js";
import {
  fetchJobByIdFromSqlite,
  fetchJobsByIds,
  fetchJobsFromSqlite,
} from "../config/sqlite.js";
import { searchJobs } from "../services/meilisearch.js";

const JOB_SOURCES = ["linkedin", "hnhiring", "bayt", "all"] as const;
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

interface ParsedDateFilter {
  iso: string;
  timestamp: number;
}

function parseDateFilter(
  raw: unknown,
  endOfDay = false,
): ParsedDateFilter | null {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return null;
  }

  const suffix = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
  const timestamp = Date.parse(`${raw}${suffix}`);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  const date = new Date(timestamp);
  if (date.toISOString().slice(0, 10) !== raw) {
    return null;
  }

  return { iso: date.toISOString(), timestamp };
}

/**
 * GET /api/jobs?page=&limit=&source=&q=&after=&before=
 * Unified jobs table in SQLite. Optional `source`: `linkedin` | `hnhiring` | `bayt` (omit for all).
 * Optional `q`: search query to filter by title, company, and description.
 * Optional `after` / `before`: inclusive posting-date bounds (YYYY-MM-DD).
 */
export async function fetchJobs(req: Request, res: Response) {
  try {
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
    const searchQuery = ((req.query.q as string) || "").trim();
    const sourceFilter = sourceParam !== "all" ? sourceParam : null;
    const postedAfter = parseDateFilter(req.query.after);
    const postedBefore = parseDateFilter(req.query.before, true);

    if (req.query.after !== undefined && !postedAfter) {
      return res.status(400).json({
        success: false,
        error: "Invalid after date. Use YYYY-MM-DD.",
      });
    }
    if (req.query.before !== undefined && !postedBefore) {
      return res.status(400).json({
        success: false,
        error: "Invalid before date. Use YYYY-MM-DD.",
      });
    }
    if (
      postedAfter &&
      postedBefore &&
      postedAfter.timestamp > postedBefore.timestamp
    ) {
      return res.status(400).json({
        success: false,
        error: "The after date must be on or before the before date.",
      });
    }

    let jobs: Record<string, unknown>[];
    let total: number;
    let searchEngine: "meilisearch" | "sqlite" = "sqlite";

    if (searchQuery) {
      try {
        const searchResult = await searchJobs({
          q: searchQuery,
          source: sourceFilter,
          postedAfter: postedAfter?.timestamp,
          postedBefore: postedBefore?.timestamp,
          page,
          limit,
        });
        jobs = fetchJobsByIds(searchResult.ids);
        total = searchResult.total;
        searchEngine = "meilisearch";
      } catch (searchError) {
        console.warn(
          "Meilisearch search failed, falling back to SQLite:",
          searchError,
        );
        const fallback = fetchJobsFromSqlite({
          source: sourceFilter,
          search: searchQuery,
          postedAfter: postedAfter?.iso,
          postedBefore: postedBefore?.iso,
          page,
          limit,
        });
        jobs = fallback.jobs;
        total = fallback.total;
      }
    } else {
      const result = fetchJobsFromSqlite({
        source: sourceFilter,
        search: searchQuery || undefined,
        postedAfter: postedAfter?.iso,
        postedBefore: postedBefore?.iso,
        page,
        limit,
      });
      jobs = result.jobs;
      total = result.total;
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      searchEngine,
      jobs,
    });

    /* MongoDB implementation (commented out):
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database connection not established",
      });
    }

    const filter: Record<string, any> =
      sourceParam !== "all" ? { source: sourceParam } : {};

    if (searchQuery) {
      const searchRegex = { $regex: searchQuery, $options: "i" };
      filter.$or = [
        { title: searchRegex },
        { companyName: searchRegex },
        { skills: searchRegex },
      ];
    }

    const collection = db.collection("jobs");
    const [jobs, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);
    */
  } catch (error) {
    console.error("Error fetching Jobs:", error);
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
}

export async function fetchJobById(req: Request, res: Response) {
  try {
    const jobId = req.params.id;
    if (!jobId || Array.isArray(jobId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid job ID",
      });
    }

    const job = fetchJobByIdFromSqlite(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job not found`,
      });
    }

    res.status(200).json({
      success: true,
      job,
    });

    /* MongoDB implementation (commented out):
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database connection not established",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job not found`,
      });
    }
    */
  } catch (error) {
    console.error("Error fetching Jobs:", error);
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
}
