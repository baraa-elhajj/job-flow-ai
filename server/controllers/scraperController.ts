import type { Response } from "express";
import {
  getExistingJobUrls,
  insertJobsIntoSqliteWithDedup,
  normalizeJobUrl,
} from "../config/sqlite.js";
import type { ScraperRequest } from "../middleware/scraperAuthMiddleware.js";

function parseUrlList(body: unknown): string[] | null {
  if (!body || typeof body !== "object" || !("urls" in body)) {
    return null;
  }

  const urls = (body as { urls: unknown }).urls;
  if (!Array.isArray(urls)) {
    return null;
  }

  const parsed = urls
    .filter((url): url is string => typeof url === "string" && url.trim() !== "")
    .map((url) => normalizeJobUrl(url));

  return [...new Set(parsed)];
}

function parseJobList(body: unknown): Record<string, unknown>[] | null {
  if (!body || typeof body !== "object" || !("jobs" in body)) {
    return null;
  }

  const jobs = (body as { jobs: unknown }).jobs;
  if (!Array.isArray(jobs)) {
    return null;
  }

  const parsed = jobs.filter(
    (job): job is Record<string, unknown> =>
      typeof job === "object" && job !== null && !Array.isArray(job),
  );

  return parsed;
}

/**
 * POST /api/scraper/existing-urls
 * Body: { urls: string[] }
 * Returns URLs from the request that already exist in SQLite.
 */
export function checkExistingUrls(req: ScraperRequest, res: Response): void {
  const urls = parseUrlList(req.body);
  if (urls === null) {
    res.status(400).json({
      success: false,
      error: "Request body must include urls: string[]",
    });
    return;
  }

  const existing = getExistingJobUrls(urls);
  res.status(200).json({
    success: true,
    count: existing.length,
    existing,
  });
}

/**
 * POST /api/scraper/jobs
 * Body: { jobs: Record<string, unknown>[] }
 * Inserts scraped jobs into SQLite, skipping duplicates by URL.
 */
export function ingestJobs(req: ScraperRequest, res: Response): void {
  const jobs = parseJobList(req.body);
  if (jobs === null) {
    res.status(400).json({
      success: false,
      error: "Request body must include jobs: object[]",
    });
    return;
  }

  if (jobs.length === 0) {
    res.status(200).json({
      success: true,
      inserted: 0,
      skipped: 0,
    });
    return;
  }

  try {
    const { inserted, skipped } = insertJobsIntoSqliteWithDedup(jobs);
    res.status(200).json({
      success: true,
      inserted,
      skipped,
    });
  } catch (error) {
    console.error("Error ingesting scraped jobs:", error);
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
}
