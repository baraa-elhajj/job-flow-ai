"""HTML parsing helpers for Bayt.com pages."""

from __future__ import annotations

import re
from typing import Dict, List, Optional
from urllib.parse import urljoin

from lxml import html as lxml_html

JOB_DETAIL_PATTERN = re.compile(
    r"^https?://(?:www\.)?bayt\.com/en/[^/]+/jobs/[^/?#]+-\d+/?$",
    re.IGNORECASE,
)

DATE_PATTERN = re.compile(
    r"\b(\d+\s+(?:minute|hour|day|week|month)s?\s+ago|\d{4}-\d{2}-\d{2})\b",
    re.IGNORECASE,
)

BASE_URL = "https://www.bayt.com"


def normalize_bayt_job_url(url: str) -> str:
    clean = url.split("?")[0].rstrip("/")
    if clean.startswith("/"):
        clean = f"{BASE_URL}{clean}"
    if not clean.endswith("/"):
        clean = f"{clean}/"
    return clean


def _is_job_detail_href(href: str) -> bool:
    if not href or "/register-j/" in href or "/company/" in href:
        return False
    if not re.search(r"-\d+/?(?:\?|$)", href.split("?")[0]):
        return False
    absolute = urljoin(BASE_URL, href.split("?")[0].rstrip("/") + "/")
    return bool(JOB_DETAIL_PATTERN.match(absolute))


def extract_job_links(html: str) -> List[Dict[str, str]]:
    tree = lxml_html.fromstring(html)
    results: List[Dict[str, str]] = []
    seen: set[str] = set()

    for anchor in tree.xpath('//a[contains(@href, "/jobs/")]'):
        href = anchor.get("href") or ""
        if not _is_job_detail_href(href):
            continue

        title = " ".join(anchor.itertext()).strip()
        if not title:
            parent = anchor.getparent()
            if parent is not None:
                title = " ".join(parent.itertext()).strip().split("\n")[0].strip()
        if len(title) < 2:
            continue

        absolute = normalize_bayt_job_url(urljoin(BASE_URL, href))
        if absolute in seen:
            continue
        seen.add(absolute)
        results.append({"url": absolute, "title": title})

    return results


def _first_text(tree, xpaths: tuple[str, ...]) -> Optional[str]:
    for xpath in xpaths:
        nodes = tree.xpath(xpath)
        if nodes:
            node = nodes[0]
            text = " ".join(node.itertext()).strip()
            if text:
                return text
    return None


def parse_job_detail(html: str, job_url: str) -> Dict[str, Optional[str]]:
    tree = lxml_html.fromstring(html)
    body_text = " ".join(tree.xpath("//body//text()"))

    title = _first_text(
        tree,
        (
            "//h1",
            "//*[contains(@class, 'job-title')]",
            "//*[@data-automation='jobTitle']",
        ),
    )
    company = _first_text(
        tree,
        (
            "//a[contains(@href, '/company/')]",
            "//*[@data-automation='companyName']",
            "//*[contains(@class, 'company-name')]",
        ),
    )
    location = _first_text(
        tree,
        (
            "//*[@data-automation='jobLocation']",
            "//*[contains(@class, 'location')]",
            "//*[contains(@class, 'job-location')]",
        ),
    )
    description = _first_text(
        tree,
        (
            "//*[@id='job_description']",
            "//*[@data-automation='jobDescription']",
            "//*[contains(@class, 'job-description')]",
            "//*[contains(@class, 'card-content')]",
            "//article",
        ),
    )

    posted_raw = None
    match = DATE_PATTERN.search(body_text)
    if match:
        posted_raw = match.group(1)
    else:
        for xpath in (
            "//*[@data-automation='jobPostedDate']",
            "//*[contains(@class, 'date')]",
            "//*[contains(@class, 'job-date')]",
        ):
            text = _first_text(tree, (xpath,))
            if text and "ago" in text.lower():
                posted_raw = text
                break

    return {
        "url": job_url,
        "title": title,
        "companyName": company,
        "location": location,
        "text": description if description and len(description) > 80 else description,
        "posted_raw": posted_raw,
    }
