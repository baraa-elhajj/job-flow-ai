"""HTML parsing helpers for Bayt.com pages."""

from __future__ import annotations

import json
import re
from html import escape
from typing import Any, Dict, List, Optional
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
BAD_COMPANY_NAMES = {"companies", "company", "employers"}
BAD_DESCRIPTION_PREFIXES = (
    "get contacted by recruiters directly",
    "create a job alert",
    "register now",
    "sign up",
)
DESCRIPTION_TAGS = {
    "a",
    "b",
    "blockquote",
    "br",
    "code",
    "em",
    "h2",
    "h3",
    "h4",
    "i",
    "li",
    "ol",
    "p",
    "pre",
    "strong",
    "u",
    "ul",
}


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


def _inner_html(node) -> str:
    parts: List[str] = []
    if node.text:
        parts.append(escape(node.text))
    parts.extend(
        lxml_html.tostring(child, encoding="unicode") for child in node
    )
    return "".join(parts).strip()


def _first_html(tree, xpaths: tuple[str, ...]) -> Optional[str]:
    for xpath in xpaths:
        nodes = tree.xpath(xpath)
        if nodes:
            value = _inner_html(nodes[0])
            if value:
                return value
    return None


def _find_job_posting(value: Any) -> Optional[Dict[str, Any]]:
    if isinstance(value, dict):
        item_type = value.get("@type")
        types = item_type if isinstance(item_type, list) else [item_type]
        if any(
            isinstance(current, str) and current.lower() == "jobposting"
            for current in types
        ):
            return value
        for child in value.values():
            found = _find_job_posting(child)
            if found:
                return found
    elif isinstance(value, list):
        for child in value:
            found = _find_job_posting(child)
            if found:
                return found
    return None


def _extract_job_posting_json(tree) -> Optional[Dict[str, Any]]:
    for script in tree.xpath('//script[@type="application/ld+json"]'):
        content = script.text or script.text_content()
        if not content or not content.strip():
            continue
        try:
            data = json.loads(content)
        except (json.JSONDecodeError, TypeError):
            continue
        posting = _find_job_posting(data)
        if posting:
            return posting
    return None


def _plain_text(value: Any) -> Optional[str]:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        fragments = lxml_html.fragments_fromstring(value)
        parts: List[str] = []
        for fragment in fragments:
            if isinstance(fragment, str):
                parts.append(fragment)
            else:
                parts.extend(fragment.itertext())
        text = " ".join(parts)
    except (ValueError, TypeError):
        text = value
    return " ".join(text.split()) or None


def _company_from_json(posting: Dict[str, Any]) -> Optional[str]:
    organization = posting.get("hiringOrganization")
    if isinstance(organization, dict):
        name = _plain_text(organization.get("name"))
        if name and name.casefold() not in BAD_COMPANY_NAMES:
            return name
    return None


def _location_from_json(posting: Dict[str, Any]) -> Optional[str]:
    locations = posting.get("jobLocation")
    if not isinstance(locations, list):
        locations = [locations]

    results: List[str] = []
    for location in locations:
        if not isinstance(location, dict):
            continue
        address = location.get("address")
        if not isinstance(address, dict):
            continue
        parts = [
            _plain_text(address.get("addressLocality")),
            _plain_text(address.get("addressRegion")),
            _plain_text(address.get("addressCountry")),
        ]
        rendered = ", ".join(dict.fromkeys(part for part in parts if part))
        if rendered and rendered not in results:
            results.append(rendered)
    return " · ".join(results) or None


def _valid_company(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    normalized = " ".join(value.split())
    return (
        normalized
        if normalized.casefold() not in BAD_COMPANY_NAMES
        else None
    )


def _valid_description(value: Optional[str]) -> Optional[str]:
    text = _plain_text(value)
    if not text or len(text) < 80:
        return None
    if text.casefold().startswith(BAD_DESCRIPTION_PREFIXES):
        return None

    try:
        root = lxml_html.fragment_fromstring(value, create_parent="div")
    except (ValueError, TypeError):
        return f"<p>{escape(text)}</p>"

    for element in list(root.iterdescendants()):
        if not isinstance(element.tag, str):
            element.drop_tree()
            continue

        tag = element.tag.lower()
        if tag in {"script", "style", "iframe", "object", "embed"}:
            element.drop_tree()
            continue
        if tag not in DESCRIPTION_TAGS:
            element.drop_tag()
            continue

        href = element.get("href") if tag == "a" else None
        element.attrib.clear()
        if href:
            absolute = urljoin(BASE_URL, href)
            if absolute.startswith(("http://", "https://", "mailto:")):
                element.set("href", absolute)
                element.set("rel", "noopener noreferrer")

    structured = _inner_html(root)
    return structured or f"<p>{escape(text)}</p>"


def parse_job_detail(html: str, job_url: str) -> Dict[str, Optional[str]]:
    tree = lxml_html.fromstring(html)
    body_text = " ".join(tree.xpath("//body//text()"))
    posting = _extract_job_posting_json(tree) or {}

    title = _plain_text(posting.get("title")) or _first_text(
        tree,
        (
            "//*[@id='job_card']//h1",
            "//*[@data-automation-id='jobTitle']",
            "//*[@data-automation='jobTitle']",
            "//*[contains(@class, 'job-title')]",
            "//main//h1",
        ),
    )
    company = _company_from_json(posting) or _valid_company(
        _first_text(
            tree,
            (
                "//*[@id='job_card']//*[@data-automation-id='companyName']",
                "//*[@id='job_card']//*[@data-automation='companyName']",
                "//*[@id='job_card']//a[contains(@href, '/company/')]",
                "//*[@id='job_card']//*[contains(@class, 'company-name')]",
                "//main//*[@data-automation-id='companyName']",
                "//main//div[contains(@class, 't-nowrap') and "
                "contains(@class, 'p10l')]//span",
            ),
        )
    )
    location = _location_from_json(posting) or _first_text(
        tree,
        (
            "//*[@id='job_card']//*[@data-automation-id='jobLocation']",
            "//*[@id='job_card']//*[@data-automation='jobLocation']",
            "//*[@id='job_card']//*[contains(@class, 'job-location')]",
            "//main//*[@data-automation-id='jobLocation']",
            "//main//div[contains(@class, 't-mute') and "
            "contains(@class, 't-small')]",
        ),
    )
    description = _valid_description(posting.get("description")) or (
        _valid_description(
            _first_html(
                tree,
                (
                    "//*[@id='job_description']",
                    "//*[@data-automation-id='jobDescription']",
                    "//*[@data-automation='jobDescription']",
                    "//*[contains(@class, 'job-description')]",
                    "//h2[contains(translate(normalize-space(.), "
                    "'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "
                    "'job description')]/following-sibling::*[1]",
                    "//h2[contains(translate(normalize-space(.), "
                    "'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "
                    "'job description')]/ancestor::*"
                    "[contains(@class, 'card')][1]"
                    "//*[contains(@class, 'card-content')]",
                ),
            )
        )
    )

    posted_raw = _plain_text(posting.get("datePosted"))
    if not posted_raw:
        for xpath in (
            "//*[@id='job_card']//*[@data-automation-id='jobPostedDate']",
            "//*[@data-automation='jobPostedDate']",
            "//*[@id='job_card']//*[contains(@class, 'job-date')]",
        ):
            text = _first_text(tree, (xpath,))
            match = DATE_PATTERN.search(text or "")
            if match:
                posted_raw = match.group(1)
                break
    if not posted_raw:
        match = DATE_PATTERN.search(body_text)
        if match:
            posted_raw = match.group(1)

    return {
        "url": job_url,
        "title": title,
        "companyName": company,
        "location": location,
        "text": description,
        "posted_raw": posted_raw,
    }
