import cron from "node-cron";
import { scrapeAndStoreLinkedInJobs } from "./linkedinScraper.js";
import { scrapeAndStoreHNHiringJobs } from "./hnhiringScraper.js";

export function startScraperScheduler() {
  console.log("Starting job scraper scheduler...");

  // LinkedIn scrape every 12 hours
  cron.schedule("5 0,12 * * *", async () => {
    console.log("Starting LinkedIn scrape...");

    try {
      await scrapeAndStoreLinkedInJobs(
        "https://www.linkedin.com/jobs/search/?keywords=software%20engineer&location=United%20States&f_TP=1%2C2",
        25,
      );
      console.log("LinkedIn scrape completed successfully");
    } catch (error) {
      console.error("LinkedIn scrape failed:", error);
    }
  });

  // HN Hiring scrape every 2 hours
  cron.schedule("0 */2 * * *", async () => {
    console.log("Starting HN Hiring scrape...");

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
        console.log("HN Hiring scrape completed successfully");
      } else {
        console.log("Skipping HN Hiring scrape");
      }
    } catch (error) {
      console.error("HN Hiring scrape failed:", error);
    }
  });
}

const shouldScrape = (hour: number, day: number) => {
  return (day >= 1 && day <= 5) || (day >= 6 && hour % 12 === 0);
};
