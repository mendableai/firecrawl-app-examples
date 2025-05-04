import time
from pathlib import Path

from firecrawl import FirecrawlApp
from dotenv import load_dotenv
from models import ArticleList
from utils import is_changed, save_status_data

# Load environment variables
load_dotenv()

# Configuration variables
# URLs
BASE_URL = "https://bullet-echo.fandom.com/wiki/Special:AllPages"

# Data directory
DATA_DIR = Path("data")

# Files and Paths
ARTICLES_LIST_FILE = DATA_DIR / "all_articles.txt"
OUTPUT_DIRECTORY = DATA_DIR / "bullet-echo-wiki"
OUTPUT_DIRECTORY.mkdir(exist_ok=True, parents=True)

# Job Parameters
TIMEOUT_SECONDS = 180  # 3 minutes timeout
POLLING_INTERVAL = 30  # Seconds between status checks

# Initialize Firecrawl app
app = FirecrawlApp()


def get_article_list():
    """Get the list of articles from the wiki or from the cached file."""
    if is_changed(app, BASE_URL) or not ARTICLES_LIST_FILE.exists():
        print("The wiki pages list has changed. Scraping the wiki pages list...")
        # Scrape the wiki pages list
        result = app.batch_scrape_urls(
            [BASE_URL],
            formats=["extract"],
            extract={"schema": ArticleList.model_json_schema()},
        )

        # Extract all article URLs
        all_articles = [a["url"] for a in result.data[0].extract["articles"]]
        print(f"Found {len(all_articles)} articles")

        # Write the links to a text file
        with open(ARTICLES_LIST_FILE, "w") as f:
            for article in all_articles:
                f.write(article + "\n")

        return all_articles
    else:
        print("The wiki pages list has not changed. Scraping from existing list...")
        with open(ARTICLES_LIST_FILE, "r") as f:
            return [line.strip() for line in f.readlines()]


def scrape_and_monitor_articles(article_urls):
    """Scrape articles and monitor the process until completion or timeout."""
    print(f"Scraping {len(article_urls)} articles...")

    # Start the batch scrape job
    job = app.async_batch_scrape_urls(article_urls)
    start_time = time.time()

    # Monitor the job status and save results
    while True:
        status = app.check_batch_scrape_status(job.id)
        if status.status == "completed":
            print("Batch scrape completed successfully!")
            break

        # Check if timeout has been reached
        if time.time() - start_time > TIMEOUT_SECONDS:
            print(f"Timeout of {TIMEOUT_SECONDS} seconds reached. Exiting.")
            break

        # Save the partial results
        save_status_data(status, OUTPUT_DIRECTORY)

        print("Waiting for batch scrape to complete...")
        time.sleep(POLLING_INTERVAL)


def main():
    # Ensure data directory exists
    DATA_DIR.mkdir(exist_ok=True, parents=True)

    # Get article list - either from the wiki or from cached file
    all_articles = get_article_list()

    # Scrape articles and monitor the process
    scrape_and_monitor_articles(all_articles)


if __name__ == "__main__":
    main()
