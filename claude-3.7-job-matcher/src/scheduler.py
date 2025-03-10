import asyncio
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from .scraper import JobScraper
from .matcher import JobMatcher
import logging

logger = logging.getLogger(__name__)
load_dotenv()


class JobScheduler:
    def __init__(self):
        self.scraper = JobScraper()
        self.matcher = JobMatcher()
        self.resume_url = os.getenv("RESUME_URL")
        self.check_interval = int(os.getenv("CHECK_INTERVAL_MINUTES", "15"))
        self.processed_jobs = set()
        self.job_urls = []
        
        # Add job URLs here or load from a file
        # Example: self.job_urls = ["https://example.com/job1", "https://example.com/job2"]
        
        logger.info(f"Initialized scheduler with {self.check_interval} minute interval")

    async def process_job_url(self, job_url):
        """Process a single job URL"""
        try:
            logger.info(f"Processing job URL: {job_url}")

            # Parse resume
            resume_content = await self.scraper.parse_resume(self.resume_url)

            # Get jobs from URL
            jobs = await self.scraper.scrape_job_postings([job_url])
            logger.info(f"Found {len(jobs)} jobs from {job_url}")

            # Process new jobs
            for job in jobs:
                if job.url in self.processed_jobs:
                    logger.debug(f"Skipping already processed job: {job.url}")
                    continue

                job_content = await self.scraper.scrape_job_content(job.url)
                result = await self.matcher.evaluate_match(resume_content, job_content)

                if result["is_match"]:
                    logger.info(f"Found match: {job.title} at {job.company}")
                    # Match found, but no notification sent (Discord removed)

                self.processed_jobs.add(job.url)

        except Exception as e:
            logger.error(f"Error processing job URL {job_url}: {str(e)}")

    async def run(self):
        """Main scheduling loop"""
        logger.info("Starting job scheduler...")
        
        if not self.job_urls:
            logger.warning("No job URLs configured. Please add some job URLs to the scheduler.")
            return

        while True:
            try:
                logger.info(f"Found {len(self.job_urls)} job URLs to process")

                for job_url in self.job_urls:
                    logger.info(f"Processing job URL {job_url}")
                    await self.process_job_url(job_url)

                logger.info(f"Sleeping for {self.check_interval} minutes")
                await asyncio.sleep(self.check_interval * 60)  # Sleep for the configured interval

            except Exception as e:
                logger.error(f"Scheduler error: {str(e)}")
                await asyncio.sleep(60)


async def main():
    scheduler = JobScheduler()
    await scheduler.run()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    asyncio.run(main())
