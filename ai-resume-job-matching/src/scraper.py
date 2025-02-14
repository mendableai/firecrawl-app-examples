from firecrawl import FirecrawlApp
from .models import Job, JobListings
import streamlit as st


@st.cache_data(show_spinner=False)
def _cached_parse_resume(pdf_link: str) -> str:
    """Cached version of resume parsing"""
    app = FirecrawlApp()
    response = app.scrape_url(url=pdf_link)
    return response["markdown"]


class JobScraper:
    def __init__(self):
        self.app = FirecrawlApp()

    async def parse_resume(self, pdf_link: str) -> str:
        """Parse a resume from a PDF link."""
        return _cached_parse_resume(pdf_link)

    async def scrape_job_postings(self, source_urls: list[str]) -> list[Job]:
        """Scrape job postings from source URLs."""
        response = self.app.batch_scrape_urls(
            urls=source_urls,
            params={
                "formats": ["extract"],
                "extract": {
                    "schema": JobListings.model_json_schema(),
                    "prompt": "Extract information based on the schema provided",
                },
            },
        )

        jobs = []
        for job in response["data"]:
            jobs.extend(job["extract"]["jobs"])

        return [Job(**job) for job in jobs]

    async def scrape_job_content(self, job_url: str) -> str:
        """Scrape the content of a specific job posting."""
        response = self.app.scrape_url(url=job_url)
        return response["markdown"]
