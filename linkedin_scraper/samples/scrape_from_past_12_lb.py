import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set

from dotenv import load_dotenv

from linkedin_scraper.core.exceptions import LinkedInScraperException
from linkedin_scraper.scrapers.job_search import JobSearchScraper
from linkedin_scraper.scrapers.job import JobScraper
from linkedin_scraper.core.browser import BrowserManager
from linkedin_scraper.core.proxy import load_verified_proxy_pool
from linkedin_scraper.filters.tech import is_tech_job
from linkedin_scraper.models.job import Job
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

SEARCH_URL = (
    "https://www.linkedin.com/jobs/search?"
    "keywords=&location=Lebanon&geoId=101834488&f_TPR=r43200&position=1&pageNum=0"
)
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)
SCRAPE_LIMIT = int(os.getenv("SCRAPE_LIMIT", "30"))


def log(message: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{timestamp}] {message}", flush=True)


def proxy_label(proxy: Optional[Dict[str, str]]) -> str:
    if not proxy:
        return "direct (no proxy)"
    return proxy.get("server", "unknown proxy")


def normalize_job_url(url: str) -> str:
    clean = url.split("?")[0].rstrip("/")
    if clean.startswith("/"):
        clean = f"https://www.linkedin.com{clean}"
    return clean


def get_existing_urls(urls: List[str]) -> Set[str]:
    normalized = [normalize_job_url(url) for url in urls]
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


def filter_items_not_in_db(
    items: List[dict], existing_urls: Set[str]
) -> tuple[List[dict], List[dict]]:
    new_items: List[dict] = []
    skipped_items: List[dict] = []
    for item in items:
        if normalize_job_url(item["url"]) in existing_urls:
            skipped_items.append(item)
        else:
            new_items.append(item)
    return new_items, skipped_items


async def scrape_job_with_proxy_rotation(
    job_url: str,
    proxy_pool: List[Optional[Dict[str, str]]],
    start_index: int = 0,
) -> Optional[Job]:
    """Scrape one job, rotating through proxies on failure."""
    pool_size = len(proxy_pool)
    for offset in range(pool_size):
        proxy = proxy_pool[(start_index + offset) % pool_size]
        label = proxy_label(proxy)
        try:
            async with BrowserManager(
                headless=True,
                user_agent=USER_AGENT,
                proxy=proxy,
            ) as browser:
                return await JobScraper(browser.page).scrape(job_url)
        except LinkedInScraperException as exc:
            log(f"  Job scrape failed via {label}: {exc}")
        except Exception as exc:
            log(f"  Job scrape failed via {label}: {exc}")
    return None


async def search_with_proxy_rotation(
    proxy_pool: List[Optional[Dict[str, str]]],
) -> tuple[List[dict], int]:
    """Run LinkedIn search, rotating proxies until listings are found."""
    for index, proxy in enumerate(proxy_pool):
        label = proxy_label(proxy)
        log(f"Search attempt {index + 1}/{len(proxy_pool)} via {label}")
        try:
            async with BrowserManager(
                headless=True,
                user_agent=USER_AGENT,
                proxy=proxy,
            ) as browser:
                items = await JobSearchScraper(browser.page).search(
                    url=SEARCH_URL,
                    limit=SCRAPE_LIMIT,
                )
                if items:
                    log(f"Found {len(items)} listings via {label}")
                    return items, index
                log(f"No listings via {label}, trying next proxy...")
        except LinkedInScraperException as exc:
            log(f"Search failed via {label}: {exc}")
        except Exception as exc:
            log(f"Search failed via {label}: {exc}")
    return [], 0


async def scrape_details_with_proxy_rotation(
    items: List[dict],
    proxy_pool: List[Optional[Dict[str, str]]],
    start_index: int = 0,
) -> List[Job]:
    jobs: List[Job] = []
    for index, item in enumerate(items, start=1):
        job_url = item["url"]
        log(
            f"Scraping job {index}/{len(items)}: "
            f"{item.get('title', 'No title')}"
        )
        log(f"  URL: {job_url}")
        job = await scrape_job_with_proxy_rotation(
            job_url,
            proxy_pool,
            start_index=(start_index + index - 1) % len(proxy_pool),
        )
        if job:
            jobs.append(job)
            log(
                f"  Done: {job.title or 'N/A'} @ {job.companyName or 'N/A'} "
                f"({job.location or 'N/A'})"
            )
        else:
            log("  Skipped after all proxy attempts failed")
    return jobs


async def main() -> None:
    log("Starting Lebanon tech job scraper")
    log(f"Search URL: {SEARCH_URL}")

    if is_api_storage_enabled():
        log("Storage mode: backend API")
    else:
        log(f"Storage mode: local SQLite ({get_sqlite_db_path()})")

    verified_proxies = load_verified_proxy_pool(log=log)
    proxy_pool: List[Optional[Dict[str, str]]] = (
        verified_proxies if verified_proxies else [None]
    )
    log(f"Proxy pool size: {len(proxy_pool)}")

    items, proxy_start = await search_with_proxy_rotation(proxy_pool)
    if not items:
        log("Search failed on all proxies")
        return

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
                f"  Already exists: {normalize_job_url(item['url'])} "
                f"- {item.get('title', 'No title')}"
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
    for index, item in enumerate(filtered_items, start=1):
        log(f"  [{index}] {item.get('title', 'No title')}")

    if not filtered_items:
        log("No new tech jobs to scrape. Exiting.")
        return

    log(f"Scraping details for {len(filtered_items)} new jobs")
    jobs = await scrape_details_with_proxy_rotation(
        filtered_items,
        proxy_pool,
        start_index=proxy_start,
    )

    documents = [job.to_dict() for job in jobs]
    for document in documents:
        document["source"] = "linkedin"

    save_jobs(documents)
    log("Scraper finished successfully")


if __name__ == "__main__":
    asyncio.run(main())
