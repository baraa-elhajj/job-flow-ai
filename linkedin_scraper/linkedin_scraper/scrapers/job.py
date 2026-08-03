"""
Job scraper for LinkedIn.

Extracts job posting information from LinkedIn job pages.
"""

import json
import logging
from typing import Any, Optional

from playwright.async_api import Page

from ..models.job import Job
from ..core.exceptions import ProfileNotFoundError
from ..callbacks import ProgressCallback, SilentCallback
from .base import BaseScraper
from ..core.utils import parse_date_posted

logger = logging.getLogger(__name__)


class JobScraper(BaseScraper):
    """
    Scraper for LinkedIn job postings.

    Example:
        async with BrowserManager() as browser:
            scraper = JobScraper(browser.page)
            job = await scraper.scrape("https://www.linkedin.com/jobs/view/123456/")
            print(job.to_json())
    """

    def __init__(self, page: Page, callback: Optional[ProgressCallback] = None):
        """
        Initialize job scraper.

        Args:
            page: Playwright page object
            callback: Optional progress callback
        """
        super().__init__(page, callback or SilentCallback())

    async def scrape(self, linkedin_url: str) -> Job:
        """
        Scrape a LinkedIn job posting.

        Args:
            linkedin_url: URL of the LinkedIn job posting

        Returns:
            Job object with scraped data

        Raises:
            ProfileNotFoundError: If job posting not found
        """
        logger.info(f"Starting job scraping: {linkedin_url}")
        await self.callback.on_start("Job", linkedin_url)

        # Navigate to job page
        await self.navigate_and_wait(linkedin_url)
        await self.callback.on_progress("Navigated to job page", 10)

        # Check if page exists
        await self.check_rate_limit()

        # Extract job details
        job_title = await self._get_job_title()
        await self.callback.on_progress(f"Got job title: {job_title}", 20)

        company = await self._get_company()
        await self.callback.on_progress("Got company name", 30)

        location = await self._get_location()
        await self.callback.on_progress("Got location", 40)

        posted_date = await self._get_posted_date()
        await self.callback.on_progress("Got posted date", 50)

        applicant_count = await self._get_applicant_count()
        await self.callback.on_progress("Got applicant count", 60)

        job_description = await self._get_description()
        await self.callback.on_progress("Got job description", 80)

        company_url = await self._get_company_url()
        await self.callback.on_progress("Got company URL", 90)

        # Create job object
        job = Job(
            url=linkedin_url,
            title=job_title,
            companyName=company,
            CompanyLinkedInUrl=company_url,
            location=location,
            datePosted=parse_date_posted(posted_date),
            applicantCount=applicant_count,
            text=job_description,
        )

        await self.callback.on_progress("Scraping complete", 100)
        await self.callback.on_complete("Job", job)

        logger.info(f"Successfully scraped job: {job_title}")
        return job

    async def _get_job_title(self) -> Optional[str]:
        """Extract job title from h1 heading."""
        try:
            title_elem = self.page.locator("h1").first
            await title_elem.wait_for(timeout=5000)
            title = await title_elem.inner_text()
            return title.strip()
        except:
            return None

    async def _get_company(self) -> Optional[str]:
        """Extract company name from company link."""
        try:
            # Find company links that have text (not just images)
            company_links = await self.page.locator('a[href*="/company/"]').all()
            for link in company_links:
                text = await link.inner_text()
                text = text.strip()
                # Skip empty or very short text (likely image-only links)
                if text and len(text) > 1 and not text.startswith("logo"):
                    return text
        except:
            pass
        return None

    async def _get_company_url(self) -> Optional[str]:
        """Extract company LinkedIn URL."""
        try:
            company_link = self.page.locator('a[href*="/company/"]').first
            if await company_link.count() > 0:
                href = await company_link.get_attribute("href")
                if href:
                    if "?" in href:
                        href = href.split("?")[0]
                    if not href.startswith("http"):
                        href = f"https://www.linkedin.com{href}"
                    return href
        except:
            pass
        return None

    async def _get_location(self) -> Optional[str]:
        """Extract job location from job details panel."""
        try:
            container = self.page.locator(
                ".job-details-jobs-unified-top-card__primary-description-container"
            ).first
            if await container.count() > 0:
                text = await container.inner_text()
                parts = text.split("·")
                if parts:
                    return parts[0].strip().split("\n")[0].strip()
        except:
            pass

        try:
            job_panel = self.page.locator("h1").first.locator("xpath=ancestor::*[5]")
            if await job_panel.count() > 0:
                text_elements = await job_panel.locator("span, div").all()
                for elem in text_elements:
                    text = await elem.inner_text()
                    if text and (
                        "," in text or "Remote" in text or "United States" in text
                    ):
                        text = text.strip()
                        # Avoid matching the job title if it contains a comma
                        title = await self._get_job_title()
                        if title and text == title:
                            continue
                        if (
                            len(text) > 3
                            and len(text) < 100
                            and not text.startswith("$")
                        ):
                            return text
        except:
            pass
        return None

    async def _get_posted_date(self) -> Optional[str]:
        """Extract posted date from job details."""
        # Public LinkedIn job pages expose the canonical date in JobPosting
        # JSON-LD. Prefer it over visible relative text when available.
        try:
            scripts = await self.page.locator(
                'script[type="application/ld+json"]'
            ).all()
            for script in scripts:
                content = await script.text_content()
                if not content:
                    continue
                try:
                    data = json.loads(content)
                except json.JSONDecodeError:
                    continue
                date_posted = self._find_date_posted_in_json(data)
                if date_posted and parse_date_posted(date_posted):
                    return date_posted
        except Exception as exc:
            logger.debug("Could not read LinkedIn JobPosting JSON-LD: %s", exc)

        # Both public and authenticated layouts may provide an exact date via
        # a semantic <time datetime="..."> element.
        try:
            time_elements = await self.page.locator(
                'time[datetime], main time, time[class*="listdate"]'
            ).all()
            for element in time_elements:
                date_time = await element.get_attribute("datetime")
                if date_time and parse_date_posted(date_time):
                    return date_time
                text = (await element.inner_text()).strip()
                if text and parse_date_posted(text):
                    return text
        except Exception as exc:
            logger.debug("Could not read LinkedIn time element: %s", exc)

        # Target the known visible date elements before inspecting larger
        # containers, where unrelated text may also contain words like "day".
        try:
            date_elements = await self.page.locator(
                ".posted-time-ago__text, "
                ".job-details-jobs-unified-top-card__posted-date, "
                '[class*="posted-date"], [class*="posted-time"]'
            ).all()
            for element in date_elements:
                text = (await element.inner_text()).strip()
                if text and parse_date_posted(text):
                    return text
        except Exception as exc:
            logger.debug("Could not read LinkedIn posted-date element: %s", exc)

        try:
            container = self.page.locator(
                ".job-details-jobs-unified-top-card__primary-description-container"
            ).first
            if await container.count() > 0:
                text = await container.inner_text()
                parts = text.split("·")
                if len(parts) > 1:
                    candidate = parts[1].strip().split("\n")[0].strip()
                    if parse_date_posted(candidate):
                        return candidate
        except Exception as exc:
            logger.debug("Could not read LinkedIn top-card date: %s", exc)

        try:
            text_elements = await self.page.locator("main span, main div").all()
            for elem in text_elements:
                text = (await elem.inner_text()).strip()
                if text and len(text) < 80 and parse_date_posted(text):
                    return text
        except Exception as exc:
            logger.debug("Could not find LinkedIn relative date text: %s", exc)
        return None

    @staticmethod
    def _find_date_posted_in_json(data: Any) -> Optional[str]:
        """Find a datePosted string in a JSON-LD object or graph."""
        if isinstance(data, dict):
            date_posted = data.get("datePosted")
            if isinstance(date_posted, str) and date_posted.strip():
                return date_posted.strip()
            for value in data.values():
                found = JobScraper._find_date_posted_in_json(value)
                if found:
                    return found
        elif isinstance(data, list):
            for value in data:
                found = JobScraper._find_date_posted_in_json(value)
                if found:
                    return found
        return None

    async def _get_applicant_count(self) -> Optional[str]:
        """Extract applicant count from job details."""
        try:
            container = self.page.locator(
                ".job-details-jobs-unified-top-card__primary-description-container"
            ).first
            if await container.count() > 0:
                text = await container.inner_text()
                parts = text.split("·")
                if len(parts) > 2:
                    return parts[2].strip().split("\n")[0].strip()
        except:
            pass

        try:
            main_content = self.page.locator("main").first
            if await main_content.count() > 0:
                text_elements = await main_content.locator("span, div").all()
                for elem in text_elements:
                    text = await elem.inner_text()
                    text = text.strip()
                    if text and len(text) < 50:
                        text_lower = text.lower()
                        if (
                            "applicant" in text_lower
                            or "people clicked" in text_lower
                            or "applied" in text_lower
                        ):
                            return text
        except:
            pass
        return None

    async def _get_description(self) -> Optional[str]:
        """Extract job description from article or about section."""
        try:
            description = self.page.locator(".description__text").first
            if await description.count() > 0:
                description = await description.inner_text()
                return description.strip()

            about_heading = self.page.locator('h2:has-text("About the job")').first
            if await about_heading.count() > 0:
                article = about_heading.locator("xpath=ancestor::article[1]")
                if await article.count() > 0:
                    description = await article.inner_text()
                    return description.strip()

            article = self.page.locator("article").first
            if await article.count() > 0:
                description = await article.inner_text()
                return description.strip()
        except:
            pass
        return None
