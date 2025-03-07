from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Job(BaseModel):
    title: str = Field(description="Job title")
    url: str = Field(description="URL of the job posting")
    company: str = Field(description="Company name")


class JobSource(BaseModel):
    url: str = Field(description="URL of the job board")
    last_checked: Optional[datetime] = Field(description="Last check timestamp")


class JobListings(BaseModel):
    jobs: List[Job] = Field(description="List of job postings")
