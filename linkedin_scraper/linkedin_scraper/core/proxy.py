"""Webshare proxy helpers for scraper samples."""

import os
from typing import Callable, Dict, Optional

import requests

WEBSHARE_IP_CHECK_URL = "https://ipv4.webshare.io/"


def _proxy_credentials_from_env() -> Optional[tuple[str, str, str, str]]:
    """Read Webshare proxy as host, port, username, password from env."""
    proxy_line = os.getenv("PROXY", "").strip()
    if proxy_line:
        parts = proxy_line.split(":", 3)
        if len(parts) == 4:
            return parts[0], parts[1], parts[2], parts[3]
        return None

    host = os.getenv("PROXY_HOST", "").strip()
    port = os.getenv("PROXY_PORT", "").strip()
    username = os.getenv("PROXY_USERNAME", "").strip()
    password = os.getenv("PROXY_PASSWORD", "").strip()
    if host and port and username and password:
        return host, port, username, password

    return None


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


def load_verified_proxy(
    log: Optional[Callable[[str], None]] = None,
) -> Optional[Dict[str, str]]:
    """Load proxy from env and verify it before use."""
    creds = _proxy_credentials_from_env()
    if not creds:
        if log:
            log(
                "Proxy not configured "
                "(set PROXY=host:port:username:password or PROXY_HOST/PORT/USERNAME/PASSWORD)"
            )
        return None

    host, port, username, password = creds
    if not verify_proxy_with_webshare(host, port, username, password, log=log):
        if log:
            log("Proxy verification failed")
        return None

    config = playwright_proxy_config(host, port, username, password)
    if log:
        log(f"Using proxy {config['server']}")
    return config


def load_verified_byparr_proxy_headers(
    log: Optional[Callable[[str], None]] = None,
) -> Optional[Dict[str, str]]:
    """Load proxy from env, verify it, and return Byparr request headers."""
    creds = _proxy_credentials_from_env()
    if not creds:
        if log:
            log(
                "Proxy not configured "
                "(set PROXY=host:port:username:password or PROXY_HOST/PORT/USERNAME/PASSWORD)"
            )
        return None

    host, port, username, password = creds
    if not verify_proxy_with_webshare(host, port, username, password, log=log):
        if log:
            log("Proxy verification failed")
        return None

    headers = byparr_proxy_headers(host, port, username, password)
    if log:
        log(f"Using proxy via Byparr ({headers['X-Proxy-Server']})")
    return headers
