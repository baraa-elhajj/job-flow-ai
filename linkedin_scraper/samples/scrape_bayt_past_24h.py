import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Set

from dotenv import load_dotenv
from pymongo import MongoClient

from linkedin_scraper.core.bayt_browser import get_bayt_search_url
from linkedin_scraper.core.byparr_client import ByparrClient, ByparrError
from linkedin_scraper.core.proxy import load_verified_byparr_proxy_headers
from linkedin_scraper.filters.tech import is_tech_job
from linkedin_scraper.scrapers.bayt_job import BaytJobScraper
from linkedin_scraper.scrapers.bayt_search import BaytSearchScraper
from linkedin_scraper.scrapers.bayt_html import normalize_bayt_job_url
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


def get_existing_job_urls(collection, urls: List[str]) -> Set[str]:
    if not urls:
        return set()

    normalized = {normalize_bayt_job_url(url) for url in urls}
    variants = set(urls) | normalized
    existing: Set[str] = set()

    for doc in collection.find({"url": {"$in": list(variants)}}, {"url": 1}):
        url = doc.get("url")
        if isinstance(url, str):
            existing.add(normalize_bayt_job_url(url))
        elif isinstance(url, list):
            for item in url:
                if isinstance(item, str):
                    existing.add(normalize_bayt_job_url(item))

    return existing


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


def main() -> None:
    log("Starting Bayt international tech job scraper (past 24 hours)")
    log(f"Search URL: {SEARCH_URL}")
    log(f"Scrape limit: {SCRAPE_LIMIT}")
    log(f"Byparr URL: {BYPARR_URL}")

    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        log("MONGODB_URI not found in environment")
        sys.exit(1)

    client = MongoClient(mongo_uri)
    collection = client["test"]["jobs"]
    sqlite_path = get_sqlite_db_path()
    if sqlite_path:
        log(f"SQLite storage enabled: {sqlite_path}")
    else:
        log("SQLITE_DB_PATH not set; skipping SQLite storage")

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
        client.close()
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
            client.close()
            sys.exit(1)
        log(f"Found {len(items)} job listings from search")

        search_urls = [item["url"] for item in items]
        existing_urls = get_existing_job_urls(collection, search_urls)
        if sqlite_path:
            normalized_search_urls = [
                normalize_bayt_job_url(url) for url in search_urls
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
    main()
