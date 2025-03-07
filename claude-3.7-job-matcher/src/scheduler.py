import asyncio
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from .scraper import JobScraper
from .matcher import JobMatcher
from .discord import DiscordNotifier
from .database import Database
import logging

logger = logging.getLogger(__name__)
load_dotenv()


class JobScheduler:
    def __init__(self):
        self.scraper = JobScraper()
        self.matcher = JobMatcher()
        self.notifier = DiscordNotifier()
        self.db = Database()
        self.resume_url = os.getenv("RESUME_URL")
        self.check_interval = int(os.getenv("CHECK_INTERVAL_MINUTES", "15"))
        self.processed_jobs = set()
        logger.info(f"Initialized scheduler with {self.check_interval} minute interval")

    async def process_source(self, source):
        """Process a single job source"""
        try:
            logger.info(f"Processing source: {source.url}")

            # Parse resume
            resume_content = await self.scraper.parse_resume(self.resume_url)

            # Get jobs from source
            jobs = await self.scraper.scrape_job_postings([source.url])
            logger.info(f"Found {len(jobs)} jobs from {source.url}")

            # Process new jobs
            for job in jobs:
                if job.url in self.processed_jobs:
                    logger.debug(f"Skipping already processed job: {job.url}")
                    continue

                job_content = await self.scraper.scrape_job_content(job.url)
                result = await self.matcher.evaluate_match(resume_content, job_content)

                if result["is_match"]:
                    logger.info(f"Found match: {job.title} at {job.company}")
                    await self.notifier.send_match(job, result["reason"])

                self.processed_jobs.add(job.url)

            # Update last checked timestamp
            self.db.update_last_checked(source.url)

        except Exception as e:
            logger.error(f"Error processing source {source.url}: {str(e)}")

    async def run(self):
        """Main scheduling loop"""
        logger.info("Starting job scheduler...")

        while True:
            try:
                sources = self.db.get_job_sources()
                logger.info(f"Found {len(sources)} job sources")

                for source in sources:
                    if not source.last_checked or (
                        datetime.utcnow() - source.last_checked
                        > timedelta(minutes=self.check_interval)
                    ):
                        logger.info(f"Processing source {source.url}")
                        await self.process_source(source)
                    else:
                        logger.debug(
                            f"Skipping {source.url}, next check in "
                            f"{(source.last_checked + timedelta(minutes=self.check_interval) - datetime.utcnow()).total_seconds() / 60:.1f} minutes"
                        )

                await asyncio.sleep(60)  # Check every minute

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
