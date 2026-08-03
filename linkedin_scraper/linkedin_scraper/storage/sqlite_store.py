"""SQLite storage for scraped LinkedIn jobs."""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Set

DEFAULT_DB_PATH = "./data/jobs.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  title TEXT,
  url TEXT,
  date_posted TEXT,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_url ON jobs(url);
"""


def get_sqlite_db_path() -> str:
    configured = os.getenv("SQLITE_DB_PATH", "").strip()
    return configured or DEFAULT_DB_PATH


def _ensure_db_dir(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)


def _connect(db_path: str) -> sqlite3.Connection:
    resolved = Path(db_path).resolve()
    _ensure_db_dir(resolved)
    conn = sqlite3.connect(resolved)
    conn.executescript(SCHEMA)
    return conn


def _serialize_job(document: Dict[str, Any]) -> str:
    def default(value: Any) -> Any:
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)

    return json.dumps(document, default=default)


def _extract_url(document: Dict[str, Any]) -> str | None:
    url = document.get("url") or document.get("linkedin_url")
    if isinstance(url, str):
        return url
    if isinstance(url, list) and url:
        return str(url[0])
    return None


def _extract_title(document: Dict[str, Any]) -> str | None:
    title = document.get("title")
    return title if isinstance(title, str) else None


def _extract_date_posted(document: Dict[str, Any]) -> str | None:
    date_posted = document.get("datePosted") or document.get("date_posted")
    if isinstance(date_posted, datetime):
        return date_posted.isoformat()
    if isinstance(date_posted, str):
        return date_posted
    return None


def get_existing_job_urls(db_path: str, urls: List[str]) -> Set[str]:
    """Return normalized URLs already stored in SQLite."""
    if not urls:
        return set()

    conn = _connect(db_path)
    try:
        placeholders = ",".join("?" for _ in urls)
        rows = conn.execute(
            f"SELECT url FROM jobs WHERE url IN ({placeholders})",
            urls,
        ).fetchall()
        return {row[0] for row in rows if row[0]}
    finally:
        conn.close()


def insert_jobs_into_sqlite(db_path: str, documents: List[Dict[str, Any]]) -> int:
    """Insert job documents into SQLite. Returns number of rows inserted."""
    if not documents:
        return 0

    conn = _connect(db_path)
    try:
        conn.executemany(
            """
            INSERT INTO jobs (source, title, url, date_posted, payload, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
            """,
            [
                (
                    document.get("source") or "linkedin",
                    _extract_title(document),
                    _extract_url(document),
                    _extract_date_posted(document),
                    _serialize_job(document),
                )
                for document in documents
            ],
        )
        conn.commit()
        return len(documents)
    finally:
        conn.close()
