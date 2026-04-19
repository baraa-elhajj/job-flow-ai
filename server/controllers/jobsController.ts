import type { Request, Response } from "express";
import { scrapeHNHiring } from "../services/hnhiringScraper.js";

// GET /api/jobs/hnhiring?month=?&year=?
export async function fetchHNHiringJobs(req: Request, res: Response) {
    // TODO: implement async handler with proper error handling and response formatting.
    
    const { month, year } = req.query;
    if (!month || !year) {
        return res.status(400).json({
            success: false,
            error: 'month and year query parameters are required',
        });
    }

    try {
        const jobs = await scrapeHNHiring(
            month as string,
            parseInt(year as string)
        );

        if (jobs.length === 0) {
            console.log('No jobs found.');
        }

        res.json({
            success: true,
            count: jobs.length,
            jobs,
        });
    } catch (error) {
        console.error('Error scraping HNHiring jobs:', error);
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
}
