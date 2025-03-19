import json
import os
from typing import List, Dict, Any, Optional
from firecrawl import FirecrawlApp
from dotenv import load_dotenv
from src.config import SearchConfig, GitHubRepository, Repositories

# Load environment variables for API key
load_dotenv()


class GitHubTrendScraper:
    """Scraper for GitHub trending repositories"""

    def __init__(self, config: SearchConfig):
        self.config = config
        # Get API key from environment variables
        self.api_key = os.environ.get("FIRECRAWL_API_KEY", "")
        # Initialize FirecrawlApp with API key
        self.firecrawl_app = FirecrawlApp(api_key=self.api_key)

    def build_url(self) -> str:
        """Build the GitHub trending URL based on configuration"""
        url = "https://github.com/trending"

        # Add language filter if specified
        if self.config.language and self.config.language.lower() != "all":
            url += f"/{self.config.language.lower()}"

        # Add time period
        url += f"?since={self.config.time_period}"

        return url

    def scrape(self) -> List[Dict[str, Any]]:
        """Scrape GitHub trending repositories using structured extraction"""
        url = self.build_url()

        # Use Firecrawl to scrape the trending page with structured extraction
        try:
            # Call Firecrawl with structured extraction as shown in the notebook
            result = self.firecrawl_app.scrape_url(
                url,
                params={
                    "formats": ["extract"],
                    "extract": {
                        "prompt": "Scrape the GitHub trending page and extract the repositories based on the schema provided.",
                        "schema": Repositories.model_json_schema(),
                    },
                },
            )

            # Check if we got structured data back
            if "extract" in result and "repositories" in result["extract"]:
                # Convert the extracted data to our standard dictionary format
                repositories = self._process_extracted_repos(
                    result["extract"]["repositories"]
                )

                # Filter repositories based on keywords
                filtered_repos = self._filter_by_keywords(repositories)

                return filtered_repos
            else:
                print("Structured extraction failed, no repository data found")
                return []

        except Exception as e:
            print(f"Error scraping GitHub trending page: {str(e)}")
            return []

    def _process_extracted_repos(
        self, extracted_repos: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Process the structured extracted repositories into our standard format"""
        processed_repos = []

        for i, repo in enumerate(extracted_repos):
            # Using the format from the notebook
            processed_repo = {
                "name": repo.get("name", ""),
                "display_name": (
                    repo.get("name", "").split("/")[-1]
                    if "/" in repo.get("name", "")
                    else repo.get("name", "")
                ),
                "url": repo.get(
                    "repo_url", f"https://github.com/{repo.get('name', '')}"
                ),
                "description": repo.get("description", ""),
                "stars": repo.get("stars_count", ""),
                "today_stars": repo.get("stars_today", ""),
                "language": repo.get("language", self.config.language or "Unknown"),
                "rank": i + 1,  # Assign rank based on position in the list
                "forks": repo.get("forks_count", ""),
                "owner": repo.get("repo_owner", ""),
            }

            processed_repos.append(processed_repo)

        return processed_repos

    def _filter_by_keywords(
        self, repositories: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Filter repositories based on configured keywords"""
        if not self.config.keywords:
            return repositories

        filtered = []
        for repo in repositories:
            # Check if any keyword matches in name or description
            if any(
                k.lower() in repo["name"].lower()
                or k.lower() in repo["description"].lower()
                for k in self.config.keywords
            ):
                filtered.append(repo)

        return filtered


if __name__ == "__main__":
    scraper = GitHubTrendScraper(SearchConfig(keywords=["ai", "ml", "llm"]))
    print(scraper.scrape())
