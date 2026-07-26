"""Webshare proxy helpers for scraper samples."""

from __future__ import annotations

import os
from typing import Callable, Dict, List, Optional, Tuple

import requests

WEBSHARE_IP_CHECK_URL = "https://ipv4.webshare.io/"
ProxyCredentials = Tuple[str, str, str, str]


def parse_proxy_line(line: str) -> Optional[ProxyCredentials]:
    """Parse Webshare proxy line: host:port:username:password."""
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        return None
    parts = stripped.split(":", 3)
    if len(parts) != 4:
        return None
    return parts[0], parts[1], parts[2], parts[3]


def proxy_credentials_from_env() -> List[ProxyCredentials]:
    """Read primary PROXY plus optional PROXY_LIST entries."""
    lines: List[str] = []
    primary = os.getenv("PROXY", "").strip()
    if primary:
        lines.append(primary)

    proxy_list = os.getenv("PROXY_LIST", "").strip()
    if proxy_list:
        for entry in proxy_list.replace("\n", "|").split("|"):
            entry = entry.strip()
            if entry:
                lines.append(entry)

    host = os.getenv("PROXY_HOST", "").strip()
    port = os.getenv("PROXY_PORT", "").strip()
    username = os.getenv("PROXY_USERNAME", "").strip()
    password = os.getenv("PROXY_PASSWORD", "").strip()
    if host and port and username and password:
        lines.append(f"{host}:{port}:{username}:{password}")

    seen: set[ProxyCredentials] = set()
    creds_list: List[ProxyCredentials] = []
    for line in lines:
        creds = parse_proxy_line(line)
        if creds and creds not in seen:
            seen.add(creds)
            creds_list.append(creds)
    return creds_list


def _proxy_credentials_from_env() -> Optional[ProxyCredentials]:
    creds_list = proxy_credentials_from_env()
    return creds_list[0] if creds_list else None


def requests_proxy_dict(
    host: str, port: str, username: str, password: str
) -> Dict[str, str]:
    proxy_url = f"http://{username}:{password}@{host}:{port}/"
    return {"http": proxy_url, "https": proxy_url}


def playwright_proxy_config(
    host: str, port: str, username: str, password: str
) -> Dict[str, str]:
    return {
        "server": f"http://{host}:{port}",
        "username": username,
        "password": password,
    }


def byparr_proxy_headers(
    host: str, port: str, username: str, password: str
) -> Dict[str, str]:
    """HTTP headers for Byparr per-request proxy override."""
    return {
        "X-Proxy-Server": f"http://{host}:{port}",
        "X-Proxy-Username": username,
        "X-Proxy-Password": password,
    }


def verify_proxy_with_webshare(
    host: str,
    port: str,
    username: str,
    password: str,
    log: Optional[Callable[[str], None]] = None,
) -> bool:
    """Confirm the proxy works via Webshare's IPv4 echo endpoint."""
    try:
        response = requests.get(
            WEBSHARE_IP_CHECK_URL,
            proxies=requests_proxy_dict(host, port, username, password),
            timeout=30,
        )
        response.raise_for_status()
        exit_ip = response.text.strip()
        if log:
            log(f"Proxy check OK (exit IP: {exit_ip})")
        return True
    except requests.RequestException as exc:
        if log:
            log(f"Proxy check failed: {exc}")
        return False


def load_verified_proxy_pool(
    log: Optional[Callable[[str], None]] = None,
) -> List[Dict[str, str]]:
    """Load and verify all configured proxies for Playwright."""
    creds_list = proxy_credentials_from_env()
    if not creds_list:
        if log:
            log(
                "Proxy not configured "
                "(set PROXY and/or PROXY_LIST=host:port:user:pass|host:port:user:pass)"
            )
        return []

    pool: List[Dict[str, str]] = []
    for index, (host, port, username, password) in enumerate(creds_list, start=1):
        if log:
            log(f"Verifying proxy {index}/{len(creds_list)} ({host}:{port})...")
        if not verify_proxy_with_webshare(host, port, username, password, log=log):
            if log:
                log(f"Proxy {host}:{port} failed verification, skipping")
            continue
        config = playwright_proxy_config(host, port, username, password)
        pool.append(config)
        if log:
            log(f"Proxy pool +1: {config['server']}")

    return pool


def load_verified_proxy(
    log: Optional[Callable[[str], None]] = None,
) -> Optional[Dict[str, str]]:
    """Load the first working proxy from env."""
    pool = load_verified_proxy_pool(log=log)
    return pool[0] if pool else None


def load_verified_byparr_proxy_headers(
    log: Optional[Callable[[str], None]] = None,
) -> Optional[Dict[str, str]]:
    """Load the first working proxy from env for Byparr request headers."""
    for index, (host, port, username, password) in enumerate(
        proxy_credentials_from_env(), start=1
    ):
        if log:
            log(f"Verifying Byparr proxy {index} ({host}:{port})...")
        if not verify_proxy_with_webshare(host, port, username, password, log=log):
            continue
        headers = byparr_proxy_headers(host, port, username, password)
        if log:
            log(f"Using proxy via Byparr ({headers['X-Proxy-Server']})")
        return headers

    if log:
        log("No working proxy found for Byparr")
    return None
