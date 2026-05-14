/**
 * LinkedIn Job Scraper
 * Scrapes job listings from LinkedIn search results using Playwright
 */

import { chromium, type Page } from "playwright";
import { LinkedInJob } from "../models/LinkedInJob.js";

export interface LinkedInJobData {
  url?: string;
  title: string;
  company?: string;
  location?: string;
  jobDescription?: string;
}

/**
 * Scrapes job listings from a LinkedIn search URL
 * @param searchUrl - LinkedIn jobs search URL
 * @param limit - Maximum number of jobs to scrape (default: 25)
 * @returns Array of job objects
 */
export async function scrapeLinkedInJobs(
  searchUrl: string,
  limit: number = 25,
): Promise<LinkedInJobData[]> {
  console.log(`Scraping LinkedIn jobs from: ${searchUrl}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    console.log("Page loaded, extracting job listings...");

    // Wait for job cards to load
    console.log("Waiting for job cards to load...");
    await page
      .waitForSelector(".job-search-card", { timeout: 10000 })
      .catch(() => {
        console.warn("No job listings found on page");
      });
    console.log("Job Cards loaded");

    // Scroll to load more
    console.log("Scrolling to load more jobs...");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    // Extract jobs
    console.log("Procceeding with extraction...");
    const jobs = await extractJobsFromPage(page, limit);
    console.log(`Extracted ${jobs.length} jobs from LinkedIn`);

    return jobs;
  } catch (error) {
    console.error("Error scraping LinkedIn:", error);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Extracts job URLs and titles from the current page
 */
async function extractJobsFromPage(
  page: Page,
  limit: number,
): Promise<LinkedInJobData[]> {
  const jobs: LinkedInJobData[] = [];
  const seenUrls = new Set<string>();

  try {
    // First pass: collect all basic job data without clicking
    const jobCards = await page.locator(".job-search-card").all();

    console.log(`Found ${jobCards.length} cards to extract jobs from.`);
    let jobCount = 0;

    // Collect basic data from all cards first
    const basicJobs: LinkedInJobData[] = [];

    for (const card of jobCards) {
      if (basicJobs.length >= limit) break;

      console.log("Collecting job #", ++jobCount);
      try {
        // Extract title
        const titleElement = card.locator(".base-search-card__title").first();
        const title = await titleElement.innerText().catch(() => "N/A");
        console.log("Title ✓");

        // Extract URL
        const linkElement = card.locator('a[href*="/jobs/view/"]').first();
        const href = await linkElement.getAttribute("href").catch(() => null);

        if (!href || !href.includes("/jobs/view/")) continue;

        // Clean URL (remove query params)
        let url = href.includes("?") ? href.split("?")[0] : href;

        // Ensure full URL
        if (!url?.startsWith("http")) {
          url = `https://www.linkedin.com${url}`;
        }
        console.log("URL ✓");

        // Avoid duplicates
        if (seenUrls.has(url)) continue;

        // Extract company
        const companyElement = card
          .locator(".base-search-card__subtitle")
          .first();
        const company = await companyElement.innerText().catch(() => "N/A");
        console.log("Company ✓");

        // Extract location
        const locationElement = card
          .locator(".job-search-card__location, .base-search-card__metadata")
          .first();
        const location = await locationElement.innerText().catch(() => "N/A");
        console.log("Location ✓");

        basicJobs.push({
          url: url?.trim(),
          title: title.trim(),
          company: company?.trim(),
          location: location?.split("\n")[0]?.trim() || "N/A",
        });

        seenUrls.add(url);
      } catch (e) {
        console.debug(`Error extracting basic job data: ${e}`);
        continue;
      }
    }

    // Second pass: get descriptions from each job by navigating to its URL
    console.log(
      `\nCollected ${basicJobs.length} jobs. Now fetching descriptions...`,
    );

    for (let i = 0; i < basicJobs.length; i++) {
      const job = basicJobs[i];
      console.log(`Fetching description for job #${i + 1}...`);

      try {
        await page.goto(job.url!, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        await page.waitForTimeout(1000); // Wait for page to fully load

        const descriptionElement = page
          .locator(".show-more-less-html__markup, .description")
          .first();
        const jobDescription = await descriptionElement
          .innerText()
          .catch(() => "N/A");

        job.jobDescription = jobDescription?.trim() || "N/A";
        console.log("Description ✓");
      } catch (e) {
        console.debug(`Error fetching description for job ${i + 1}: ${e}`);
        job.jobDescription = "N/A";
      }

      jobs.push(job);
    }
  } catch (error) {
    console.error("Error extracting jobs from page:", error);
  }

  return jobs;
}

/**
 * Scrapes LinkedIn jobs from a search URL and batch inserts into MongoDB.
 * @param searchUrl - LinkedIn jobs search URL
 * @param limit - Maximum number of jobs to scrape (default: 25)
 */
export async function scrapeAndStoreLinkedInJobs(
  searchUrl: string,
  limit: number = 25,
) {
  console.log(`Starting LinkedIn scrape: ${searchUrl}`);
  try {
    const jobs = await scrapeLinkedInJobs(searchUrl, limit);

    if (jobs.length === 0) {
      console.log("No jobs found to store.");
      return;
    }

    await LinkedInJob.insertMany(jobs, { ordered: false }).catch((error) => {
      // Handle duplicate key errors gracefully (unique constraint on url)
      if (error.code === 11000) {
        console.log(
          "Some jobs already exist in database, skipping duplicates.",
        );
      } else {
        throw error;
      }
    });
  } catch (error) {
    console.error("Error scraping/storing LinkedIn jobs:", error);
  }
}
