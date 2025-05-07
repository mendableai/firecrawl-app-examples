from pathlib import Path

from firecrawl import FirecrawlApp
from dotenv import load_dotenv
from utils import save_markdown

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


def read_article_list():
    """Read the article list from the file."""
    if ARTICLES_LIST_FILE.exists():
        with open(ARTICLES_LIST_FILE, "r") as f:
            return [line.strip() for line in f.readlines()]
    else:
        return []


def scrape_and_monitor_articles(article_urls):
    """Scrape and monitor the articles."""
    for url in article_urls:
        print(f"Checking {url} for changes...")
        try:
            scrape_result = app.scrape_url(url, formats=["markdown", "changeTracking"])
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            continue

        if scrape_result.changeTracking.changeStatus == "changed":
            print(f"The article {url} has changed. Saving the new version...")
            title = (
                url.split("/")[-1]
                .replace("%27s", "'")
                .replace("_", "-")
                .replace(" ", "-")
            )
            save_markdown(scrape_result.markdown, OUTPUT_DIRECTORY / f"{title}.md")
        else:
            print(f"The article {url} has not changed.")
    print("All articles have been checked for changes.")


def main():
    article_urls = read_article_list()
    scrape_and_monitor_articles(article_urls)


if __name__ == "__main__":
    main()
