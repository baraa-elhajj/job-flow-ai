import re
import asyncio
from linkedin_scraper.scrapers.job_search import JobSearchScraper
from linkedin_scraper.scrapers.job import JobScraper
from linkedin_scraper.core.browser import BrowserManager
import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

url = "https://www.linkedin.com/jobs/search?keywords=&location=Lebanon&geoId=101834488&f_TPR=r43200&position=1&pageNum=0"


TECH_JOB_PATTERN = re.compile(
    r"\b(engineer|developer|programmer|architect|analyst|technician|"
    r"devops|sre|qa|tester|scrum|agile|backend|frontend|fullstack|"
    r"data|machine learning|ai|artificial intelligence|cloud|network|security|"
    r"cybersecurity|it|tech|software|hardware|ui|ux|web|mobile|ios|android|"
    r"systems|database|admin|administrator|designer|web3|blockchain|data scientist|"
    r"data analyst|data engineer|system administrator|web)\b",
    re.IGNORECASE,
)


def is_tech_job(job_title: str) -> bool:
    """
    Checks if a given job title is related to a tech job.

    Args:
        job_title (str): The job title to check.

    Returns:
        bool: True if the title matches the tech job regex, False otherwise.
    """
    if not job_title:
        return False
    return bool(TECH_JOB_PATTERN.search(job_title.lower()))


async def main():
    """Search for jobs and scrape details"""

    async with BrowserManager(
        headless=True,
        # slow_mo=1000,
        user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ) as browser:
        search_scraper = JobSearchScraper(browser.page)
        print("🔍 Searching for jobs...")
        items = await search_scraper.search(url=url, limit=30)

        filtered_items = []
        for item in items:
            if is_tech_job(item["title"]):
                filtered_items.append(item)

        job_scraper = JobScraper(browser.page)

        jobs = []
        for item in filtered_items:
            job = await job_scraper.scrape(item["url"])

            jobs.append(job)

        documents = [job.to_dict() for job in jobs]

        # connect to mongodb
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            print("❌ MONGODB_URI not found in .env file")
            return

        client = MongoClient(mongo_uri)
        db = client["test"]
        collection = db["linkedin_jobs"]
        if len(documents) > 0:
            collection.insert_many(documents)


if __name__ == "__main__":
    asyncio.run(main())
