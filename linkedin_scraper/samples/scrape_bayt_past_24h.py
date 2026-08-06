import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Set

from dotenv import load_dotenv
# from pymongo import MongoClient

from linkedin_scraper.core.bayt_browser import get_bayt_search_url
from linkedin_scraper.core.byparr_client import ByparrClient, ByparrError
from linkedin_scraper.core.proxy import load_verified_byparr_proxy_headers
from linkedin_scraper.filters.tech import is_tech_job
from linkedin_scraper.scrapers.bayt_job import BaytJobScraper
from linkedin_scraper.scrapers.bayt_search import BaytSearchScraper
from linkedin_scraper.scrapers.bayt_html import normalize_bayt_job_url
from linkedin_scraper.storage.api_client import (
    get_existing_job_urls as get_existing_api_job_urls,
    ingest_jobs as ingest_jobs_via_api,
    is_api_storage_enabled,
)
from linkedin_scraper.storage.sqlite_store import (
    get_existing_job_urls as get_existing_sqlite_job_urls,
    get_sqlite_db_path,
    insert_jobs_into_sqlite,
)


_repo_root = Path(__file__).resolve().parents[2]
load_dotenv(_repo_root / "server" / ".env")
load_dotenv()

SEARCH_URL = get_bayt_search_url()
SCRAPE_LIMIT = int(os.getenv("SCRAPE_LIMIT", "50"))
BYPARR_URL = os.getenv("BYPARR_URL", "http://localhost:8191")


def log(message: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{timestamp}] {message}", flush=True)


def wait_for_byparr(client: ByparrClient, attempts: int = 30) -> bool:
    for attempt in range(1, attempts + 1):
        if client.health_check():
            return True
        log(f"Waiting for Byparr at {client.base_url} ({attempt}/{attempts})...")
        time.sleep(2)
    return False


# MongoDB dedup (commented out — SQLite is now the primary database):
# def get_existing_job_urls(collection, urls: List[str]) -> Set[str]:
#     if not urls:
#         return set()
#
#     normalized = {normalize_bayt_job_url(url) for url in urls}
#     variants = set(urls) | normalized
#     existing: Set[str] = set()
#
#     for doc in collection.find({"url": {"$in": list(variants)}}, {"url": 1}):
#         url = doc.get("url")
#         if isinstance(url, str):
#             existing.add(normalize_bayt_job_url(url))
#         elif isinstance(url, list):
#             for item in url:
#                 if isinstance(item, str):
#                     existing.add(normalize_bayt_job_url(item))
#
#     return existing


def filter_items_not_in_db(
    items: List[dict], existing_urls: Set[str]
) -> tuple[List[dict], List[dict]]:
    new_items: List[dict] = []
    skipped_items: List[dict] = []
    for item in items:
        if normalize_bayt_job_url(item["url"]) in existing_urls:
            skipped_items.append(item)
        else:
            new_items.append(item)
    return new_items, skipped_items


def get_existing_urls(urls: List[str]) -> Set[str]:
    normalized = [normalize_bayt_job_url(url) for url in urls]
    if is_api_storage_enabled():
        return get_existing_api_job_urls(normalized)
    return get_existing_sqlite_job_urls(get_sqlite_db_path(), normalized)


def save_jobs(documents: List[dict]) -> None:
    if not documents:
        log("No documents to insert")
        return

    if is_api_storage_enabled():
        log(f"Sending {len(documents)} job(s) to backend API...")
        result = ingest_jobs_via_api(documents)
        log(
            f"API ingest complete: inserted {result['inserted']}, "
            f"skipped {result['skipped']}"
        )
        return

    sqlite_path = get_sqlite_db_path()
    log(f"Inserting {len(documents)} job(s) into SQLite ({sqlite_path})...")
    sqlite_count = insert_jobs_into_sqlite(sqlite_path, documents)
    log(f"Inserted {sqlite_count} jobs into SQLite")


def main() -> None:
    log("Starting Bayt international tech job scraper (past 24 hours)")
    log(f"Search URL: {SEARCH_URL}")
    log(f"Scrape limit: {SCRAPE_LIMIT}")
    log(f"Byparr URL: {BYPARR_URL}")

    if is_api_storage_enabled():
        log("Storage mode: backend API (SCRAPER_API_URL)")
    else:
        sqlite_path = get_sqlite_db_path()
        log(f"Storage mode: local SQLite ({sqlite_path})")
        if sqlite_path == "./data/jobs.db":
            log(
                "WARNING: SQLITE_DB_PATH is not set; using ./data/jobs.db. "
                "Set SCRAPER_API_URL + SCRAPER_API_KEY or SQLITE_DB_PATH for production."
            )

    # MongoDB connection (commented out):
    # mongo_uri = os.getenv("MONGODB_URI")
    # if not mongo_uri:
    #     log("MONGODB_URI not found in environment")
    #     sys.exit(1)
    # client = MongoClient(mongo_uri)
    # collection = client["test"]["jobs"]

    proxy_headers = load_verified_byparr_proxy_headers(log=log)
    if not proxy_headers:
        log("Continuing without proxy")

    byparr = ByparrClient(
        base_url=BYPARR_URL,
        log_fn=log,
        proxy_headers=proxy_headers,
    )
    if not wait_for_byparr(byparr):
        log(
            f"Byparr is not reachable at {BYPARR_URL}. "
            "Start it with: docker run -p 8191:8191 ghcr.io/thephaseless/byparr:latest"
        )
        sys.exit(1)

    try:
        search_scraper = BaytSearchScraper(byparr, log_fn=log)
        log(f"Searching Bayt for jobs (limit={SCRAPE_LIMIT})...")
        try:
            items = search_scraper.search(url=SEARCH_URL, limit=SCRAPE_LIMIT)
        except ByparrError as exc:
            log(f"Byparr failed during search: {exc}")
            log(
                "Check Byparr logs: docker logs byparr "
                "(browser launch / proxy / shm issues are common causes of HTTP 500)"
            )
            sys.exit(1)
        log(f"Found {len(items)} job listings from search")

        search_urls = [item["url"] for item in items]
        existing_urls = get_existing_urls(search_urls)
        new_items, skipped_items = filter_items_not_in_db(items, existing_urls)

        if skipped_items:
            log(
                f"{len(skipped_items)} jobs already in database "
                "(skipping before detail scrape)"
            )
            for item in skipped_items:
                log(
                    f"  Already exists: {normalize_bayt_job_url(item['url'])} "
                    f"- {item.get('title', 'No title')}"
                )

        if not items:
            log("No job listings found on Bayt. Exiting.")
            return

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
        for index, item in enumerate(filtered_items, start=1):
            log(f"  [{index}] {item.get('title', 'No title')}")

        if not filtered_items:
            log("No new tech jobs to scrape. Exiting.")
            return

        log(f"Scraping details for {len(filtered_items)} new jobs")
        job_scraper = BaytJobScraper(byparr, log_fn=log)
        jobs = []
        for index, item in enumerate(filtered_items, start=1):
            job_url = item["url"]
            log(
                f"Scraping job {index}/{len(filtered_items)}: "
                f"{item.get('title', 'No title')}"
            )
            log(f"  URL: {job_url}")
            try:
                job = job_scraper.scrape(job_url)
            except ByparrError as exc:
                log(f"  Failed: {exc}")
                continue
            jobs.append(job)
            log(
                f"  Done: {job.title or 'N/A'} @ {job.companyName or 'N/A'} "
                f"({job.location or 'N/A'})"
            )

        documents = [job.to_dict() for job in jobs]
        for document in documents:
            document["source"] = "bayt"

        if documents:
            save_jobs(documents)
        else:
            log("No documents to insert")
    finally:
        pass
        # client.close()

    log("Scraper finished successfully")


if __name__ == "__main__":
    main()
