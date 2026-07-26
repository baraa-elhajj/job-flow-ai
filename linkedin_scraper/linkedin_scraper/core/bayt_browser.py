"""Bayt.com search URL helpers and HTML checks."""

from __future__ import annotations

import os
from urllib.parse import urlencode

BAYT_TECH_SEARCH_PATH = "international/jobs/information-technology-jobs/"
BAYT_24H_FILTERS = {
    "filters[jb_last_modification_date_interval][]": "3",
    "options[sort][]": "d",
}


def build_bayt_search_url(
    path: str = BAYT_TECH_SEARCH_PATH,
    extra_query: dict[str, str] | None = None,
) -> str:
    """Build a Bayt search URL with the past-24-hours filter."""
    query = dict(BAYT_24H_FILTERS)
    if extra_query:
        query.update(extra_query)
    normalized_path = path.strip("/")
    return f"https://www.bayt.com/en/{normalized_path}/?{urlencode(query, doseq=True)}"


def get_bayt_search_url() -> str:
    """Resolve search URL from env or default to international IT jobs."""
    configured = os.getenv("BAYT_SEARCH_URL", "").strip()
    if configured:
        return configured
    return build_bayt_search_url()


def is_cloudflare_html(html: str) -> bool:
    lowered = html.lower()
    return (
        "just a moment" in lowered
        or "performing security verification" in lowered
        or "verify you are human" in lowered
        or "checking your browser" in lowered
    )
