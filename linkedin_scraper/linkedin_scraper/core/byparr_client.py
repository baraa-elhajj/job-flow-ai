"""HTTP client for Byparr (FlareSolverr-compatible API)."""

from __future__ import annotations

import os
from typing import Callable, Optional

import requests

from .bayt_browser import is_cloudflare_html

LogFn = Callable[[str], None]


class ByparrError(RuntimeError):
    """Raised when Byparr fails to fetch a page."""


class ByparrClient:
    """Fetch pages through a running Byparr instance."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout_ms: Optional[int] = None,
        log_fn: Optional[LogFn] = None,
        proxy_headers: Optional[dict[str, str]] = None,
    ):
        self.base_url = (
            base_url or os.getenv("BYPARR_URL", "http://localhost:8191")
        ).rstrip("/")
        self.timeout_ms = int(
            timeout_ms or os.getenv("BYPARR_TIMEOUT_MS", "120000")
        )
        self.log_fn = log_fn
        self.proxy_headers = dict(proxy_headers or {})
        self._session = requests.Session()

    def fetch(self, url: str) -> str:
        """Return HTML for a URL after Byparr solves anti-bot challenges."""
        if self.log_fn:
            self.log_fn(f"Fetching via Byparr: {url}")

        try:
            response = self._session.post(
                f"{self.base_url}/v1",
                json={
                    "cmd": "request.get",
                    "url": url,
                    "maxTimeout": self.timeout_ms,
                },
                headers=self.proxy_headers,
                timeout=(self.timeout_ms / 1000) + 30,
            )
        except requests.RequestException as exc:
            raise ByparrError(
                f"Could not reach Byparr at {self.base_url}: {exc}"
            ) from exc

        payload: dict | None = None
        try:
            payload = response.json()
        except ValueError:
            payload = None

        if not response.ok:
            message = None
            if isinstance(payload, dict):
                message = payload.get("message")
            detail = message or response.text.strip() or response.reason
            raise ByparrError(
                f"Byparr HTTP {response.status_code} for {url}: {detail}"
            )

        if not isinstance(payload, dict):
            raise ByparrError(f"Byparr returned invalid JSON for {url}")

        if payload.get("status") != "ok":
            message = payload.get("message") or "Byparr request failed"
            raise ByparrError(message)

        solution = payload.get("solution") or {}
        html = solution.get("response") or ""
        final_url = solution.get("url") or url

        if not html.strip():
            raise ByparrError(f"Byparr returned empty HTML for {final_url}")

        if is_cloudflare_html(html):
            raise ByparrError(
                f"Byparr still returned a Cloudflare page for {final_url}"
            )

        return html

    def health_check(self) -> bool:
        """Return True when Byparr or FlareSolverr is reachable."""
        for path in ("/", "/docs"):
            try:
                response = self._session.get(
                    f"{self.base_url}{path}",
                    timeout=10,
                )
                if response.status_code == 200:
                    return True
            except requests.RequestException:
                continue
        return False
