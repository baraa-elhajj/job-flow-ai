"""Bayt.com job search scraper via Byparr."""

from __future__ import annotations

import logging
from typing import Callable, Dict, List, Optional
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from ..core.byparr_client import ByparrClient
from .bayt_html import extract_job_links, normalize_bayt_job_url

logger = logging.getLogger(__name__)


def _with_page_param(base_url: str, page_num: int) -> str:
    if page_num <= 1:
        return base_url

    parsed = urlparse(base_url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query["page"] = str(page_num)
    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


class BaytSearchScraper:
    """Scraper for Bayt.com job search result pages."""

    def __init__(
        self,
        client: ByparrClient,
        log_fn: Optional[Callable[[str], None]] = None,
    ):
        self.client = client
        self.log_fn = log_fn

    def search(self, url: str, limit: int = 50) -> List[Dict[str, str]]:
        logger.info("Starting Bayt job search (limit=%s)", limit)

        results: List[Dict[str, str]] = []
        seen_urls: set[str] = set()
        page_num = 1

        while len(results) < limit:
            page_url = _with_page_param(url, page_num)
            html = self.client.fetch(page_url)
            page_items = extract_job_links(html)

            if not page_items:
                if self.log_fn:
                    self.log_fn(f"No job listings found on page {page_num}")
                break

            added = 0
            for item in page_items:
                normalized = normalize_bayt_job_url(item["url"])
                if normalized in seen_urls:
                    continue
                seen_urls.add(normalized)
                results.append({"url": normalized, "title": item["title"]})
                added += 1
                if len(results) >= limit:
                    break

            logger.info(
                "Page %s: extracted %s new jobs (%s total)",
                page_num,
                added,
                len(results),
            )
            if added == 0:
                break

            page_num += 1
            if page_num > 10:
                break

        return results
