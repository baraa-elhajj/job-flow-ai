"""Pydantic model for Bayt.com job data."""

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, field_validator


class BaytJob(BaseModel):
    """Bayt.com job posting."""

    url: str
    title: Optional[str] = None
    companyName: Optional[str] = None
    location: Optional[str] = None
    datePosted: Optional[datetime] = None
    text: Optional[str] = None

    @field_validator("url")
    @classmethod
    def validate_bayt_url(cls, value: str) -> str:
        if "bayt.com" not in value or "/jobs/" not in value:
            raise ValueError("Must be a valid Bayt.com job URL")
        return value

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()
