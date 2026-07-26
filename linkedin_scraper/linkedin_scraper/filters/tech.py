"""Tech job title filtering."""

import re

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
    """Return True if the job title likely refers to a tech role."""
    if not job_title:
        return False
    return bool(TECH_JOB_PATTERN.search(job_title.lower()))
