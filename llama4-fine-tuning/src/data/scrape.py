import time
from pathlib import Path
from typing import List

from firecrawl import FirecrawlApp
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firecrawl app
app = FirecrawlApp()


# Define data models
class Article(BaseModel):
    url: str
    title: str


class ArticleList(BaseModel):
    articles: List[Article]


def save_article(status_data, path):
    """
    Save each article to markdown file

    Args:
        status_data: Data returned from the batch scrape status
        path: Directory path to save the markdown files
    """
    # Create the directory if it doesn't exist
    Path(path).mkdir(parents=True, exist_ok=True)

    for s in status_data["data"]:
        url = s["metadata"].get("url")
        title = s["metadata"].get("og:title")

        if url and title:
            filename = Path(path) / f"{title}.md"
            # Check if the file already exists
            if not filename.exists():
                with open(filename, "w") as f:
                    f.write(status_data["markdown"])


def main():
    # Scrape the wiki pages list
    base_url = "https://bullet-echo.fandom.com/wiki/Special:AllPages"

    result = app.scrape_url(
        base_url,
        params={
            "formats": ["extract"],
            "extract": {"schema": ArticleList.model_json_schema()},
        },
    )

    # Extract all article URLs
    all_articles = [a["url"] for a in result["extract"]["articles"]]
    print(f"Found {len(all_articles)} articles")

    # Write the links to a text file
    with open("all_articles.txt", "w") as f:
        for article in all_articles:
            f.write(article + "\n")

    # Batch scrape the article contents
    job = app.async_batch_scrape_urls(all_articles)
    job_id = job["id"]

    # Monitor the job status and save results
    while True:
        status = app.check_batch_scrape_status(job_id)
        if status["status"] == "completed":
            print("Batch scrape completed successfully!")
            break

        # Save the partial results
        save_article(status, "bullet-echo-wiki")

        print("Waiting for batch scrape to complete...")
        time.sleep(30)


if __name__ == "__main__":
    main()
