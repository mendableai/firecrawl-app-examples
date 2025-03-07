from supabase import create_client
import os
from typing import List
from .models import JobSource


class Database:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        self.client = create_client(url, key)

    def save_job_source(self, url: str) -> None:
        """Save a job source to the database"""
        self.client.table("job_sources").upsert(
            {"url": url, "last_checked": None}
        ).execute()

    def delete_job_source(self, url: str) -> None:
        """Delete a job source from the database"""
        self.client.table("job_sources").delete().eq("url", url).execute()

    def get_job_sources(self) -> List[JobSource]:
        """Get all job sources from the database"""
        response = self.client.table("job_sources").select("*").execute()
        return [JobSource(**source) for source in response.data]

    def update_last_checked(self, url: str) -> None:
        """Update the last checked timestamp for a job source"""
        self.client.table("job_sources").update({"last_checked": "now()"}).eq(
            "url", url
        ).execute()
