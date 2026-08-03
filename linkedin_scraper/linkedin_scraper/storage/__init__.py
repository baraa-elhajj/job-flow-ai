"""Local storage backends for scraped job data."""

from linkedin_scraper.storage.api_client import (
    get_existing_job_urls as get_existing_api_job_urls,
    get_scraper_api_key,
    get_scraper_api_url,
    ingest_jobs as ingest_jobs_via_api,
    is_api_storage_enabled,
)
from linkedin_scraper.storage.sqlite_store import (
    get_existing_job_urls as get_existing_sqlite_job_urls,
    get_sqlite_db_path,
    insert_jobs_into_sqlite,
)

__all__ = [
    "get_sqlite_db_path",
    "get_existing_sqlite_job_urls",
    "insert_jobs_into_sqlite",
    "get_scraper_api_url",
    "get_scraper_api_key",
    "is_api_storage_enabled",
    "get_existing_api_job_urls",
    "ingest_jobs_via_api",
]
