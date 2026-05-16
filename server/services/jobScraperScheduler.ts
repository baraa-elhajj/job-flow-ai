import cron from "node-cron";
import { scrapeAndStoreLinkedInJobs } from "./linkedinScraper.js";
import { scrapeAndStoreHNHiringJobs } from "./hnhiringScraper.js";

export function startScraperScheduler() {
  const linkedInScrapeAllowed = false; // set to true (or remove) when TS LinkedIn Scraper is fixed.
  console.log("Starting job scraper scheduler...");

  // LinkedIn scraper at 12:05 & 00:05 daily
  cron.schedule("5 0,12 * * *", async () => {
    console.log("Starting LinkedIn scraper...");

    if (!linkedInScrapeAllowed) {
      console.warn("Skipping LinkedIn scraper until it is fixed");
      return;
    }

    try {
      await scrapeAndStoreLinkedInJobs(
        "https://www.linkedin.com/jobs/search/?keywords=software%20engineer&location=United%20States&f_TP=1%2C2",
        25,
      );
      console.log("LinkedIn scraper completed successfully");
    } catch (error) {
      console.error("LinkedIn scraper failed:", error);
    }
  });

  // HN Hiring scraper every 2 hours on the first 5 days of the month, then every 12 hours on the rest of the month
  cron.schedule("0 */2 * * *", async () => {
    console.log("Starting HN Hiring scraper...");

    try {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDate();
      const month = now
        .toLocaleString("en-US", { month: "long" })
        .toLowerCase();
      const year = now.getFullYear();

      if (shouldScrape(hour, day)) {
        await scrapeAndStoreHNHiringJobs(month, year);
        console.log("HN Hiring scraper completed successfully");
      } else {
        console.log("Skipping HN Hiring scraper in off hours");
      }
    } catch (error) {
      console.error("HN Hiring scraper failed:", error);
    }
  });
}

const shouldScrape = (hour: number, day: number) => {
  return (day >= 1 && day <= 5) || (day >= 6 && hour % 12 === 0);
};
