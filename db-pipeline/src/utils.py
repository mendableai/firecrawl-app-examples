from pathlib import Path


def is_changed(firecrawl_app, url):
    result = firecrawl_app.scrape_url(url, formats=["changeTracking", "markdown"])
    return result.changeTracking.changeStatus == "changed"


def save_articles(status_data, path):
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
