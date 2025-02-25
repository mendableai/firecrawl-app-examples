import logging
import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from firecrawl import FirecrawlApp
from pydantic import BaseModel, Field

# Get logger for the scraper module
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

BLOG_URL = "https://www.firecrawl.dev/blog"
DOCS_URL = "https://docs.firecrawl.dev"


class Page(BaseModel):
    title: str = Field(description="Page title")
    content: str = Field(description="Main content of the page")
    url: str = Field(description="Page URL")


class Scraper:
    def __init__(self, base_url: str = None):
        self.app = FirecrawlApp()
        self.base_url = base_url

    def get_sublinks(self, base_url: str) -> list[str]:
        """
        Get all sublinks from a given base URL.
        """
        logger.info(f"Getting sublinks from {base_url}")

        # First, get all links from the base URL
        initial_crawl = self.app.crawl_url(
            base_url,
            params={
                "scrapeOptions": {"formats": ["links"]},
            },
        )

        # Collect and filter links
        all_links = []
        for item in initial_crawl["data"]:
            all_links.extend(item["links"])

        filtered_links = set(
            [link.split("#")[0] for link in all_links if link.startswith(base_url)]
        )

        logger.info(f"Found {len(filtered_links)} unique sublinks")
        return list(filtered_links)

    def scrape_sublinks(self, base_url: str, limit: int = None) -> List[Page]:
        """
        Scrape subpages from a given base URL.
        """
        logger.info(f"Scraping subpages from {base_url}")

        # Get all sublinks
        filtered_links = self.get_sublinks(base_url)
        if limit:
            filtered_links = filtered_links[:limit]

        # Batch scrape the URLs
        try:
            logger.info(f"Scraping {len(filtered_links)} subpages")
            crawl_results = self.app.batch_scrape_urls(filtered_links)
        except Exception as e:
            logger.error(f"Error scraping subpages: {str(e)}")
            return []

        # Process results into Page objects
        pages = []
        for result in crawl_results["data"]:
            if result.get("markdown"):
                pages.append(
                    Page(
                        title=result.get("metadata", {}).get("title", "Untitled"),
                        content=result["markdown"],
                        url=result.get("metadata", {}).get("url", ""),
                    )
                )
            else:
                logger.warning(
                    f"Failed to scrape {result.get('metadata', {}).get('url', 'unknown URL')}"
                )

        logger.info(
            f"Successfully scraped {len(pages)} pages out of {len(filtered_links)} URLs"
        )

        return pages

    def save_pages(self, pages: List[Page], docs_dir: str):
        """Save scraped pages to markdown files."""
        # Create output directory if it doesn't exist
        Path(docs_dir).mkdir(parents=True, exist_ok=True)

        for page in pages:
            # Extract path from URL
            url_path = page.url.replace(self.base_url, "")

            # Create a safe filename from the URL path
            safe_filename = url_path.strip("/").replace("/", "-")

            # File path within docs_dir
            filepath = os.path.join(docs_dir, f"{safe_filename}.md")

            # Save the file with frontmatter
            with open(filepath, "w", encoding="utf-8") as f:
                f.write("---\n")
                f.write(f"title: {page.title}\n")
                f.write(f"url: {page.url}\n")
                f.write("---\n\n")
                f.write(page.content)

        logger.info(f"Saved {len(pages)} pages to {docs_dir}")

    def pull(self, base_url: str, docs_dir: str, n_pages: int = None):
        self.base_url = base_url
        pages = self.scrape_sublinks(base_url, n_pages)
        self.save_pages(pages, docs_dir)


if __name__ == "__main__":
    load_dotenv()

    scraper = Scraper(base_url=BLOG_URL)
    scraper.pull(BLOG_URL, "data/raw/firecrawl/blog")

    scraper = Scraper(base_url=DOCS_URL)
    scraper.pull(DOCS_URL, "data/raw/firecrawl/docs")
