from firecrawl import FirecrawlApp
from models import CompanyData
from typing import List, Dict


class CrunchbaseScraper:
    def __init__(self):
        self.app = FirecrawlApp()

    def scrape_companies(self, urls: List[str]) -> List[Dict]:
        """Scrape multiple Crunchbase company profiles"""
        schema = CompanyData.model_json_schema()

        try:
            data = self.app.batch_scrape_urls(
                urls,
                params={
                    "formats": ["extract"],
                    "extract": {
                        "prompt": """Extract information from given pages based on the schema provided.""",
                        "schema": schema,
                    },
                },
            )

            return [res["extract"] for res in data["data"]]

        except Exception as e:
            print(f"Error while scraping companies: {str(e)}")
            return []
