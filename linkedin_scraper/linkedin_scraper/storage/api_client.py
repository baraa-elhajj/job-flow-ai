"""HTTP client for posting scraped jobs to the backend API."""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Set

import requests

DEFAULT_TIMEOUT_SECONDS = 60


def get_scraper_api_url() -> Optional[str]:
    configured = os.getenv("SCRAPER_API_URL", "").strip().rstrip("/")
    return configured or None


def get_scraper_api_key() -> Optional[str]:
    configured = os.getenv("SCRAPER_API_KEY", "").strip()
    return configured or None


def is_api_storage_enabled() -> bool:
    return bool(get_scraper_api_url() and get_scraper_api_key())


def _serialize_document(document: Dict[str, Any]) -> Dict[str, Any]:
    def default(value: Any) -> Any:
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)

    return json.loads(json.dumps(document, default=default))


def _headers() -> Dict[str, str]:
    api_key = get_scraper_api_key()
    if not api_key:
        raise ValueError("SCRAPER_API_KEY is not set")
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def _request(method: str, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    base_url = get_scraper_api_url()
    if not base_url:
        raise ValueError("SCRAPER_API_URL is not set")

    response = requests.request(
        method,
        f"{base_url}{path}",
        json=payload,
        headers=_headers(),
        timeout=DEFAULT_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, dict):
        raise ValueError("Unexpected API response format")
    return data


def get_existing_job_urls(urls: List[str]) -> Set[str]:
    """Return URLs from the request that already exist in the backend database."""
    if not urls:
        return set()

    data = _request("POST", "/existing-urls", {"urls": urls})
    existing = data.get("existing", [])
    if not isinstance(existing, list):
        raise ValueError("Unexpected existing-urls response")
    return {str(url) for url in existing}


def ingest_jobs(documents: List[Dict[str, Any]]) -> Dict[str, int]:
    """Send scraped jobs to the backend for SQLite storage."""
    if not documents:
        return {"inserted": 0, "skipped": 0}

    payload = [_serialize_document(document) for document in documents]
    data = _request("POST", "/jobs", {"jobs": payload})
    inserted = int(data.get("inserted", 0))
    skipped = int(data.get("skipped", 0))
    return {"inserted": inserted, "skipped": skipped}
