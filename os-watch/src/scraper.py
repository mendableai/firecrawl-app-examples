import json
from typing import List, Dict, Any, Optional
import firecrawl
from .config import SearchConfig


class GitHubTrendScraper:
    """Scraper for GitHub trending repositories"""

    def __init__(self, config: SearchConfig):
        self.config = config

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
        """Scrape GitHub trending repositories"""
        url = self.build_url()

        # Use Firecrawl to scrape the trending page
        result = firecrawl.scrape(
            url=url,
            formats=["markdown"],
            onlyMainContent=True,
            waitFor=2000,  # Wait 2 seconds for page to load
        )

        # Parse the content to extract repositories
        repositories = self._extract_repositories(result["markdown"])

        # Filter repositories based on keywords
        filtered_repos = self._filter_by_keywords(repositories)

        return filtered_repos

    def _extract_repositories(self, markdown_content: str) -> List[Dict[str, Any]]:
        """
        Parse the markdown content to extract repository information.

        This is a simplified version that would need to be refined based on
        the actual structure of the markdown returned by Firecrawl.
        """
        # In a real implementation, this would parse the markdown more carefully
        # For this MVP, we'll use a simple approach to extract repositories

        repositories = []
        lines = markdown_content.split("\n")

        # Simple parsing logic - this would need refinement
        current_repo = {}
        for line in lines:
            # Look for repository names
            if (
                "](https://github.com/" in line
                and "/tree/" not in line
                and "/blob/" not in line
            ):
                # If we were already processing a repo, add it to our list
                if current_repo:
                    repositories.append(current_repo)
                    current_repo = {}

                # Extract repository info
                try:
                    parts = line.split("](https://github.com/")
                    name_part = parts[0].strip("[")

                    # Extract full repository name
                    repo_path = parts[1].split(")")[0]

                    # Sometimes there's more text after the name
                    if " - " in name_part:
                        name = name_part.split(" - ")[0]
                    else:
                        name = name_part

                    current_repo = {
                        "name": repo_path,
                        "display_name": name,
                        "url": f"https://github.com/{repo_path}",
                        "description": "",
                        "stars": "",
                        "today_stars": "",
                        "language": self.config.language or "Unknown",
                    }
                except:
                    # Skip lines that don't match expected format
                    continue

            # Look for descriptions
            elif (
                current_repo
                and not current_repo["description"]
                and line.strip()
                and "![" not in line
                and "](https" not in line
            ):
                current_repo["description"] = line.strip()

            # Look for stars info
            elif current_repo and "★" in line:
                try:
                    stars_part = line.split("★")[1].strip()
                    current_repo["stars"] = stars_part

                    # Try to find today's stars if available
                    if "today" in line.lower() or "stars today" in line.lower():
                        today_part = line.lower().split("today")[0].strip()
                        if today_part[-1].isdigit():
                            current_repo["today_stars"] = today_part.split()[-1]
                except:
                    pass

        # Add the last repository if we were processing one
        if current_repo:
            repositories.append(current_repo)

        # Add rank information
        for i, repo in enumerate(repositories):
            repo["rank"] = i + 1

        return repositories

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
