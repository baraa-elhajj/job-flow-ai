"""Local storage backends for scraped job data."""

from linkedin_scraper.storage.sqlite_store import (
    get_existing_job_urls as get_existing_sqlite_job_urls,
    get_sqlite_db_path,
    insert_jobs_into_sqlite,
)

__all__ = [
    "get_sqlite_db_path",
    "get_existing_sqlite_job_urls",
    "insert_jobs_into_sqlite",
]
