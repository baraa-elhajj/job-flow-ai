"""Bayt.com job detail scraper via Byparr."""

from __future__ import annotations

import logging
from collections.abc import Callable

from ..core.byparr_client import ByparrClient, ByparrError
from ..core.utils import parse_date_posted
from ..models.bayt_job import BaytJob
from .bayt_html import parse_job_detail

logger = logging.getLogger(__name__)


class BaytJobScraper:
    """Scraper for individual Bayt.com job postings."""

    def __init__(
        self,
        client: ByparrClient,
        log_fn: Callable[[str], None] | None = None,
    ):
        self.client = client
        self.log_fn = log_fn

    def scrape(self, job_url: str) -> BaytJob:
        logger.info("Scraping Bayt job: %s", job_url)
        html = self.client.fetch(job_url)
        parsed = parse_job_detail(html, job_url)

        if not parsed.get("title") or not parsed.get("text"):
            raise ByparrError(
                "Bayt job detail page did not contain a valid title and "
                "description; refusing to store navigation or promotional text"
            )

        job = BaytJob(
            url=job_url,
            title=parsed.get("title"),
            companyName=parsed.get("companyName"),
            location=parsed.get("location"),
            datePosted=parse_date_posted(parsed.get("posted_raw")),
            text=parsed.get("text"),
        )

        logger.info("Scraped Bayt job: %s", job.title)
        return job
