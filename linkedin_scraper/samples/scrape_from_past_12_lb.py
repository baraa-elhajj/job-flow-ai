import re
import asyncio
import os
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set

from dotenv import load_dotenv
from pymongo import MongoClient

from linkedin_scraper.scrapers.job_search import JobSearchScraper
from linkedin_scraper.scrapers.job import JobScraper
from linkedin_scraper.core.browser import BrowserManager


LINKEDIN_SCRAPER_DIR = Path(__file__).resolve().parent.parent
load_dotenv()


def log(message: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{timestamp}] {message}", flush=True)

DEFAULT_PROXY_FILE = LINKEDIN_SCRAPER_DIR / "proxies.txt"

url = "https://www.linkedin.com/jobs/search?keywords=&location=Lebanon&geoId=101834488&f_TPR=r43200&position=1&pageNum=0"


TECH_JOB_PATTERN = re.compile(
    r"\b(engineer|developer|programmer|architect|analyst|technician|"
    r"devops|sre|qa|tester|scrum|agile|backend|frontend|fullstack|"
    r"data|machine learning|ai|artificial intelligence|cloud|network|security|"
    r"cybersecurity|it|tech|software|hardware|ui|ux|web|mobile|ios|android|"
    r"systems|database|admin|administrator|designer|web3|blockchain|data scientist|"
    r"data analyst|data engineer|system administrator|web)\b",
    re.IGNORECASE,
)


def is_tech_job(job_title: str) -> bool:
    """
    Checks if a given job title is related to a tech job.

    Args:
        job_title (str): The job title to check.

    Returns:
        bool: True if the title matches the tech job regex, False otherwise.
    """
    if not job_title:
        return False
    return bool(TECH_JOB_PATTERN.search(job_title.lower()))


def _parse_proxy_lines(lines: List[str]) -> List[Dict[str, str]]:
    """Parse host:port lines into Playwright proxy configs. Auth from .env."""
    username = os.getenv("PROXY_USERNAME")
    password = os.getenv("PROXY_PASSWORD")
    if not username or not password:
        log("⚠️ PROXY_USERNAME and PROXY_PASSWORD must be set in .env or secrets")
        return []

    proxies: List[Dict[str, str]] = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split(":")
        if len(parts) != 2:
            log(f"⚠️ Skipping invalid proxy line (expected host:port): {line}")
            continue
        host, port = parts
        proxies.append(
            {
                "server": f"http://{host}:{port}",
                "username": username,
                "password": password,
            }
        )
    return proxies


def load_proxies() -> tuple[List[Dict[str, str]], str]:
    """Load proxies from PROXY_FILE, default proxies.txt, or PROXY_LIST env."""
    proxy_file = Path(os.getenv("PROXY_FILE", DEFAULT_PROXY_FILE))
    if proxy_file.exists():
        lines = proxy_file.read_text(encoding="utf-8").splitlines()
        return _parse_proxy_lines(lines), str(proxy_file)

    proxy_list = os.getenv("PROXY_LIST", "").strip()
    if proxy_list:
        return _parse_proxy_lines(proxy_list.splitlines()), "PROXY_LIST env"

    return [], str(proxy_file)


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


def pick_random_proxy() -> Optional[Dict[str, str]]:
    """Pick a random proxy from file or PROXY_LIST env."""
    proxies, source = load_proxies()
    if not proxies:
        log(f"⚠️ No proxies found (checked {source})")
        return None
    proxy = random.choice(proxies)
    log(f"Loaded {len(proxies)} proxies from {source}")
    log(f"Using proxy {proxy['server']}")
    return proxy


async def main():
    """Search for jobs and scrape details"""
    log("Starting Lebanon tech job scraper")
    log(f"Search URL: {url}")

    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        log("❌ MONGODB_URI not found in .env file")
        return

    client = MongoClient(mongo_uri)
    collection = client["test"]["Jobs"]

    proxy = pick_random_proxy()
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
                    f"  Done: {job.job_title or 'N/A'} @ {job.company or 'N/A'} "
                    f"({job.location or 'N/A'})"
                )

            documents = [job.to_dict() for job in jobs]
            for document in documents:
                document["source"] = "linkedin"

            if documents:
                log(f"Inserting {len(documents)} new job(s) into test.Jobs...")
                result = collection.insert_many(documents)
                log(f"Inserted {len(result.inserted_ids)} jobs into test.Jobs")
            else:
                log("No documents to insert")
    finally:
        client.close()

    log("Scraper finished successfully")


if __name__ == "__main__":
    asyncio.run(main())
