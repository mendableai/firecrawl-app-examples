import time
import logging
from typing import Dict, Any

from firecrawl import FirecrawlApp
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def setup_environment() -> None:
    """Load environment variables from .env file"""
    load_result = load_dotenv()
    if not load_result:
        logger.warning("No .env file found or failed to load environment variables")


def initialize_app() -> FirecrawlApp:
    """Initialize and return a FirecrawlApp instance"""
    logger.info("Initializing FirecrawlApp")
    return FirecrawlApp()


def start_scraping_job(
    app: FirecrawlApp, url: str, max_urls: int = 10, show_full_text: bool = True
) -> Dict[str, Any]:
    """
    Start an asynchronous job to scrape and generate text from the specified URL

    Args:
        app: FirecrawlApp instance
        url: URL to scrape
        max_urls: Maximum number of URLs to analyze
        show_full_text: Whether to include full text in results

    Returns:
        Job information dictionary
    """
    params = {
        "maxUrls": max_urls,
        "showFullText": show_full_text,
    }

    logger.info(f"Starting scraping job for {url} with max_urls={max_urls}")
    job = app.async_generate_llms_text(
        url=url,
        params=params,
    )

    return job


def monitor_job_completion(
    app: FirecrawlApp, job_id: str, poll_interval: int = 10
) -> Dict[str, Any]:
    """
    Monitor job completion by polling at specified intervals

    Args:
        app: FirecrawlApp instance
        job_id: ID of the job to monitor
        poll_interval: Time in seconds between status checks

    Returns:
        Final job status
    """
    logger.info(f"Monitoring job {job_id} for completion")
    while True:
        status = app.check_generate_llms_text_status(job_id)
        if status["success"]:
            logger.info(f"Job {job_id} completed successfully")
            return status
        logger.debug(f"Job {job_id} still in progress, waiting {poll_interval} seconds")
        time.sleep(poll_interval)


def save_content_to_file(content: str, filepath: str) -> None:
    """
    Save content to a file

    Args:
        content: Text content to save
        filepath: Path to save the file
    """
    try:
        with open(filepath, "w") as f:
            f.write(content)
        logger.info(f"Content saved to {filepath}")
    except Exception as e:
        logger.error(f"Failed to save content to {filepath}: {e}")
        raise


def scrape_website(
    url: str,
    save_to_file: bool = False,
    output_file: str = "full_text.md",
    max_urls: int = 10,
) -> Dict[str, Any]:
    """
    Main function to scrape a website and save the results

    Args:
        url: URL to scrape
        output_file: Path to save the output
        max_urls: Maximum number of URLs to analyze

    Returns:
        Job status and data
    """
    setup_environment()
    app = initialize_app()

    # Start the scraping job
    job = start_scraping_job(app, url, max_urls=max_urls)

    # Monitor job completion
    status = monitor_job_completion(app, job["id"])

    # Save full text if available
    if "data" in status and "llmsfulltxt" in status["data"]:
        if save_to_file:
            save_content_to_file(status["data"]["llmsfulltxt"], output_file)
        else:
            return status["data"]["llmsfulltxt"]
    else:
        logger.warning("No full text content found in job results")
        return None


if __name__ == "__main__":
    # Example usage
    url = "https://openai.github.io/openai-agents-python/"
    output_file = "full_text.md"
    result = scrape_website(url, output_file, max_urls=100)
