import os
from firecrawl import FirecrawlApp

# Removed resume parsing and job scraping functions (and st.cache_data decorator) for our review analyzer case.
# Removed import of models (Job, JobListings) as well.

class ReviewScraper:
    def __init__(self):
        self.app = FirecrawlApp(
            api_key=os.getenv("FIRECRAWL_API_KEY")
        )

    async def scrape_reviews(self, product_url: str) -> list[str]:
        response = self.app.scrape_url(url=product_url)
        # Extract the markdown content and split into individual reviews
        markdown_content = response.markdown
        # Split the markdown content into individual reviews (assuming each review is separated by newlines)
        reviews = [review.strip() for review in markdown_content.split('\n') if review.strip()]
        return reviews
