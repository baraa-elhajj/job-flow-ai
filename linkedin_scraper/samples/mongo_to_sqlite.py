#!/usr/bin/env python3
"""Copy job documents from MongoDB into the local SQLite jobs database."""

from __future__ import annotations

import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional
from urllib.parse import urlparse

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient

from linkedin_scraper.storage.sqlite_store import (
    SCHEMA,
    get_sqlite_db_path,
    insert_jobs_into_sqlite,
)

_repo_root = Path(__file__).resolve().parents[2]
load_dotenv(_repo_root / "server" / ".env")
load_dotenv()

BATCH_SIZE = 500


def log(message: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{timestamp}] {message}", flush=True)


def mongo_uri() -> str:
    uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
    if not uri:
        log("Set MONGO_URI or MONGODB_URI in server/.env")
        sys.exit(1)
    return uri


def mongo_db_name(uri: str) -> str:
    configured = os.getenv("MONGO_DB", "").strip()
    if configured:
        return configured

    parsed = urlparse(uri)
    if parsed.path and parsed.path != "/":
        return parsed.path.lstrip("/").split("/")[0]

    return "jobflow"


def mongo_collection_name() -> str:
    return os.getenv("MONGO_COLLECTION", "jobs").strip() or "jobs"


def normalize_job_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    clean = url.split("?")[0].rstrip("/")
    if clean.startswith("/"):
        clean = f"https://www.linkedin.com{clean}"
    return clean


def extract_url(document: Dict[str, Any]) -> Optional[str]:
    url = document.get("url") or document.get("linkedin_url")
    if isinstance(url, str):
        return normalize_job_url(url)
    if isinstance(url, list) and url:
        return normalize_job_url(str(url[0]))
    return None


def mongo_doc_to_payload(document: Dict[str, Any]) -> Dict[str, Any]:
    payload: Dict[str, Any] = {}
    for key, value in document.items():
        if isinstance(value, ObjectId):
            payload[key] = str(value)
        else:
            payload[key] = value
    return payload


def dedupe_key(document: Dict[str, Any]) -> Optional[str]:
    url = extract_url(document)
    if url:
        return f"url:{url}"

    source = document.get("source") or "unknown"
    title = document.get("title")
    by = document.get("by")
    month_year = document.get("monthYear")
    if isinstance(title, str) and title:
        parts = [source, by or "", month_year or "", title]
        return "hn:" + "|".join(parts)
    return None


def chunked(items: List[Dict[str, Any]], size: int) -> Iterable[List[Dict[str, Any]]]:
    for start in range(0, len(items), size):
        yield items[start : start + size]


def load_existing_sqlite_urls(db_path: str) -> set[str]:
    conn = sqlite3.connect(str(Path(db_path).resolve()))
    try:
        rows = conn.execute(
            "SELECT url FROM jobs WHERE url IS NOT NULL AND url != ''"
        ).fetchall()
        return {row[0] for row in rows}
    finally:
        conn.close()


def main() -> None:
    sqlite_path = get_sqlite_db_path()
    if not sqlite_path:
        log("Set SQLITE_DB_PATH in server/.env")
        sys.exit(1)

    uri = mongo_uri()
    db_name = mongo_db_name(uri)
    collection_name = mongo_collection_name()

    log(f"Reading from MongoDB: {db_name}.{collection_name}")
    log(f"Writing to SQLite: {sqlite_path}")

    resolved_sqlite = Path(sqlite_path).resolve()
    resolved_sqlite.parent.mkdir(parents=True, exist_ok=True)
    bootstrap = sqlite3.connect(resolved_sqlite)
    bootstrap.executescript(SCHEMA)
    bootstrap.close()

    client = MongoClient(uri)
    collection = client[db_name][collection_name]

    try:
        total = collection.count_documents({})
        log(f"Found {total} MongoDB document(s)")

        migrated = 0
        skipped = 0
        existing_keys: set[str] = set()
        existing_sqlite_urls = load_existing_sqlite_urls(sqlite_path)
        log(f"SQLite already has {len(existing_sqlite_urls)} URL(s)")

        cursor = collection.find({})
        batch: List[Dict[str, Any]] = []

        for document in cursor:
            payload = mongo_doc_to_payload(document)
            key = dedupe_key(payload)

            if key and key in existing_keys:
                skipped += 1
                continue

            url = extract_url(payload)
            if url and url in existing_sqlite_urls:
                skipped += 1
                if key:
                    existing_keys.add(key)
                continue

            batch.append(payload)
            if key:
                existing_keys.add(key)
            if url:
                existing_sqlite_urls.add(url)

            if len(batch) >= BATCH_SIZE:
                migrated += insert_jobs_into_sqlite(sqlite_path, batch)
                log(f"Migrated {migrated} job(s) so far...")
                batch.clear()

        if batch:
            migrated += insert_jobs_into_sqlite(sqlite_path, batch)

        log(f"Done. Inserted {migrated} job(s), skipped {skipped} duplicate(s).")
    finally:
        client.close()


if __name__ == "__main__":
    main()
