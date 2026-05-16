import re
import asyncio
import os
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from dotenv import load_dotenv
from pymongo import MongoClient

from linkedin_scraper.scrapers.job_search import JobSearchScraper
from linkedin_scraper.scrapers.job import JobScraper
from linkedin_scraper.core.browser import BrowserManager

LINKEDIN_SCRAPER_DIR = Path(__file__).resolve().parent.parent
load_dotenv(LINKEDIN_SCRAPER_DIR / ".env")


def log(message: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{timestamp}] {message}", flush=True)

DEFAULT_PROXY_FILE = LINKEDIN_SCRAPER_DIR / "Webshare 10 proxies.txt"

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


def load_proxies(filepath: Path) -> List[Dict[str, str]]:
    """Parse proxies from file (host:port per line). Auth from .env."""
    if not filepath.exists():
        return []

    username = os.getenv("PROXY_USERNAME")
    password = os.getenv("PROXY_PASSWORD")
    if not username or not password:
        log("⚠️ PROXY_USERNAME and PROXY_PASSWORD must be set in .env")
        return []

    proxies: List[Dict[str, str]] = []
    for line in filepath.read_text(encoding="utf-8").splitlines():
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


def pick_random_proxy(filepath: Optional[Path] = None) -> Optional[Dict[str, str]]:
    """Pick a random proxy from file. Override path with PROXY_FILE env var."""
    path = filepath or Path(os.getenv("PROXY_FILE", DEFAULT_PROXY_FILE))
    proxies = load_proxies(path)
    if not proxies:
        log(f"⚠️ No proxies found in {path}")
        return None
    proxy = random.choice(proxies)
    log(f"Loaded {len(proxies)} proxies from {path}")
    log(f"Using proxy {proxy['server']}")
    return proxy


async def main():
    """Search for jobs and scrape details"""
    log("Starting Lebanon tech job scraper")
    log(f"Search URL: {url}")

    proxy = pick_random_proxy()
    if not proxy:
        log("Continuing without proxy")

    log("Launching browser...")
    async with BrowserManager(
        headless=True,
        # slow_mo=1000,
        user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        proxy=proxy,
    ) as browser:
        search_scraper = JobSearchScraper(browser.page)
        log("Searching LinkedIn for jobs (limit=30)...")
        items = await search_scraper.search(url=url, limit=30)
        log(f"Found {len(items)} job listings from search")

        filtered_items = []
        for item in items:
            title = item.get("title", "")
            if is_tech_job(title):
                filtered_items.append(item)
            else:
                log(f"  Skipped (non-tech): {title or item.get('url', 'unknown')}")

        log(f"Kept {len(filtered_items)} tech jobs after filtering")
        for i, item in enumerate(filtered_items, start=1):
            log(f"  [{i}] {item.get('title', 'No title')}")

        if not filtered_items:
            log("No tech jobs to scrape. Exiting.")
            return

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

        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            log("❌ MONGODB_URI not found in .env file")
            return

        log(f"Connecting to MongoDB ({len(documents)} documents to insert)...")
        client = MongoClient(mongo_uri)
        db = client["test"]
        collection = db["Jobs"]
        if documents:
            result = collection.insert_many(documents)
            log(f"Inserted {len(result.inserted_ids)} jobs into test.Jobs")
        else:
            log("No documents to insert")

        client.close()
        log("Scraper finished successfully")


if __name__ == "__main__":
    asyncio.run(main())
