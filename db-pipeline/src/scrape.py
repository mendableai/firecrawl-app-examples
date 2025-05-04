import time
from pathlib import Path
from typing import List

from firecrawl import FirecrawlApp
from pydantic import BaseModel
from dotenv import load_dotenv

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


# Define data models
class Article(BaseModel):
    url: str
    title: str


class ArticleList(BaseModel):
    articles: List[Article]


def is_changed(url):
    result = app.scrape_url(url, formats=["changeTracking", "markdown"])
    return result.changeTracking.changeStatus == "changed"


def save_articles(status_data, path):
    """
    Save each article to markdown file
    Args:
        status_data: Data returned from the batch scrape status
        path: Directory path to save the markdown files
    """
    # Create the directory if it doesn't exist
    Path(path).mkdir(parents=True, exist_ok=True)

    for s in status_data.data:
        url = s.metadata.get("url")
        title = s.metadata.get("og:title")

        if url and title:
            # Get a clean title
            title = title.replace(" ", "-").replace("/", "-").replace("|", "-")

            filename = Path(path) / f"{title}.md"
            # Check if the file already exists
            if not filename.exists():
                with open(filename, "w") as f:
                    f.write(s.markdown)


def main():
    # Ensure data directory exists
    DATA_DIR.mkdir(exist_ok=True, parents=True)

    if is_changed(BASE_URL) or not ARTICLES_LIST_FILE.exists():
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
    else:
        print("The wiki pages list has not changed. Scraping from existing list...")
        with open(ARTICLES_LIST_FILE, "r") as f:
            all_articles = f.readlines()

    print(f"Scraping the found articles...")
    # Batch scrape the article contents
    job = app.async_batch_scrape_urls(all_articles)

    # Monitor the job status and save results
    start_time = time.time()

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
        save_articles(status, OUTPUT_DIRECTORY)

        print("Waiting for batch scrape to complete...")
        time.sleep(POLLING_INTERVAL)


if __name__ == "__main__":
    main()
