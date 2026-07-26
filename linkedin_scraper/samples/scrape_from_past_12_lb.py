import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Set

from dotenv import load_dotenv
from pymongo import MongoClient

from linkedin_scraper.scrapers.job_search import JobSearchScraper
from linkedin_scraper.scrapers.job import JobScraper
from linkedin_scraper.core.browser import BrowserManager
from linkedin_scraper.core.proxy import load_verified_proxy
from linkedin_scraper.filters.tech import is_tech_job
from linkedin_scraper.storage.sqlite_store import (
    get_existing_job_urls as get_existing_sqlite_job_urls,
    get_sqlite_db_path,
    insert_jobs_into_sqlite,
)


_repo_root = Path(__file__).resolve().parents[2]
load_dotenv(_repo_root / "server" / ".env")
load_dotenv()


def log(message: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{timestamp}] {message}", flush=True)

url = "https://www.linkedin.com/jobs/search?keywords=&location=Lebanon&geoId=101834488&f_TPR=r43200&position=1&pageNum=0"


def normalize_job_url(url: str) -> str:
    """Normalize job URL for consistent duplicate checks."""
    clean = url.split("?")[0].rstrip("/")
    if clean.startswith("/"):
        clean = f"https://www.linkedin.com{clean}"
    return clean


def get_existing_job_urls(collection, urls: List[str]) -> Set[str]:
    """Return normalized linkedin_urls already stored in the database."""
    if not urls:
        return set()

    normalized = {normalize_job_url(u) for u in urls}
    variants = set(urls) | normalized
    existing: Set[str] = set()
    for doc in collection.find(
        {"linkedin_url": {"$in": list(variants)}},
        {"linkedin_url": 1},
    ):
        existing.add(normalize_job_url(doc["linkedin_url"]))
    return existing


def filter_items_not_in_db(
    items: List[dict], existing_urls: Set[str]
) -> tuple[List[dict], List[dict]]:
    """Split items into new vs already stored (by normalized URL)."""
    new_items: List[dict] = []
    skipped_items: List[dict] = []
    for item in items:
        if normalize_job_url(item["url"]) in existing_urls:
            skipped_items.append(item)
        else:
            new_items.append(item)
    return new_items, skipped_items




async def main():
    """Search for jobs and scrape details"""
    log("Starting Lebanon tech job scraper")
    log(f"Search URL: {url}")

    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        log("❌ MONGODB_URI not found in .env file")
        return

    client = MongoClient(mongo_uri)
    collection = client["test"]["jobs"]
    sqlite_path = get_sqlite_db_path()
    if sqlite_path:
        log(f"SQLite storage enabled: {sqlite_path}")
    else:
        log("SQLITE_DB_PATH not set; skipping SQLite storage")

    proxy = load_verified_proxy(log=log)
    if not proxy:
        log("Continuing without proxy")

    log("Launching browser...")
    try:
        async with BrowserManager(
            headless=True,
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            proxy=proxy,
        ) as browser:
            search_scraper = JobSearchScraper(browser.page)
            log("Searching LinkedIn for jobs (limit=30)...")
            items = await search_scraper.search(url=url, limit=30)
            log(f"Found {len(items)} job listings from search")

            search_urls = [item["url"] for item in items]
            existing_urls = get_existing_job_urls(collection, search_urls)
            if sqlite_path:
                normalized_search_urls = [
                    normalize_job_url(url) for url in search_urls
                ]
                existing_urls |= get_existing_sqlite_job_urls(
                    sqlite_path, normalized_search_urls
                )
            new_items, skipped_items = filter_items_not_in_db(items, existing_urls)

            if skipped_items:
                log(
                    f"{len(skipped_items)} jobs already in database "
                    "(skipping before detail scrape)"
                )
                for item in skipped_items:
                    log(
                        f"  Already exists: {normalize_job_url(item['url'])} "
                        f"— {item.get('title', 'No title')}"
                    )

            if not new_items:
                log("All search results already exist in database. Exiting.")
                return

            log(f"{len(new_items)} new job URLs to process")

            filtered_items = []
            for item in new_items:
                title = item.get("title", "")
                if is_tech_job(title):
                    filtered_items.append(item)
                else:
                    log(f"  Skipped (non-tech): {title or item.get('url', 'unknown')}")

            log(f"Kept {len(filtered_items)} tech jobs after filtering")
            for i, item in enumerate(filtered_items, start=1):
                log(f"  [{i}] {item.get('title', 'No title')}")

            if not filtered_items:
                log("No new tech jobs to scrape. Exiting.")
                return

            log(f"Scraping details for {len(filtered_items)} new jobs")
            job_scraper = JobScraper(browser.page)
            jobs = []
            for i, item in enumerate(filtered_items, start=1):
                job_url = item["url"]
                log(f"Scraping job {i}/{len(filtered_items)}: {item.get('title', 'No title')}")
                log(f"  URL: {job_url}")
                job = await job_scraper.scrape(job_url)
                jobs.append(job)
                log(
                    f"  Done: {job.title or 'N/A'} @ {job.companyName or 'N/A'} "
                    f"({job.location or 'N/A'})"
                )

            documents = [job.to_dict() for job in jobs]
            for document in documents:
                document["source"] = "linkedin"

            if documents:
                log(f"Inserting {len(documents)} new job(s) into test.jobs...")
                result = collection.insert_many(documents)
                log(f"Inserted {len(result.inserted_ids)} jobs into test.jobs")

                if sqlite_path:
                    sqlite_count = insert_jobs_into_sqlite(sqlite_path, documents)
                    log(f"Inserted {sqlite_count} jobs into SQLite ({sqlite_path})")
            else:
                log("No documents to insert")
    finally:
        client.close()

    log("Scraper finished successfully")


if __name__ == "__main__":
    asyncio.run(main())
