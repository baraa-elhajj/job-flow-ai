"""Pydantic models for LinkedIn Job data."""

from typing import Optional, Dict, Any
from pydantic import BaseModel, field_validator


class Job(BaseModel):
    """
    LinkedIn Job posting model with validation.
    
    Represents a job posting on LinkedIn with all scraped data.
    """
    url: str
    title: Optional[str] = None
    companyName: Optional[str] = None
    CompanyLinkedInUrl: Optional[str] = None
    location: Optional[str] = None
    datePosted: Optional[str] = None
    applicantCount: Optional[str] = None
    text: Optional[str] = None
    benefits: Optional[str] = None
    
    @field_validator('url')
    @classmethod
    def validate_linkedin_url(cls, v: str) -> str:
        """Validate that URL is a LinkedIn job URL."""
        if 'linkedin.com/jobs' not in v:
            raise ValueError('Must be a valid LinkedIn job URL (contains /jobs)')
        return v
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert to dictionary.
        
        Returns:
            Dictionary representation of the job
        """
        return self.model_dump()
    
    def to_json(self, **kwargs) -> str:
        """
        Convert to JSON string.
        
        Args:
            **kwargs: Additional arguments for model_dump_json (e.g., indent=2)
        
        Returns:
            JSON string representation
        """
        return self.model_dump_json(**kwargs)
    
    def __repr__(self) -> str:
        """String representation."""
        return (
            f"<Job {self.title} at {self.companyName}\n"
            f"  Location: {self.location}\n"
            f"  Posted: {self.datePosted}\n"
            f"  Applicants: {self.applicantCount}>"
        )
