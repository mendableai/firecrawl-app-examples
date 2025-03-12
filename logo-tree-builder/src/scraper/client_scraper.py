import sys
import os
import asyncio
import re
from urllib.parse import urlparse
from firecrawl import FirecrawlApp
import requests.exceptions

# Add the src directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.company import Company, ClientsSchema


class ClientScraper:
    """Scrapes client information using Firecrawl."""

    def __init__(self, api_key=None):
        """Initialize the scraper with Firecrawl API key."""
        self.app = FirecrawlApp(api_key=api_key)
        # Track URLs we've already processed to avoid repeated requests
        self.processed_urls = set()
        self.results_cache = {}  # Cache for successful results

    def extract_domain_name(self, url):
        """Extract the domain name from a URL."""
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        # Remove www. if present
        if domain.startswith("www."):
            domain = domain[4:]
        return domain

    def normalize_url(self, url):
        """
        Normalize a URL to ensure consistent comparison.

        Handles variations like:
        - Adding scheme if missing
        - Normalizes domain with or without www
        - Removes trailing slash
        """
        if not url:
            return url

        # Add scheme if missing
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        # Parse the URL
        parsed_url = urlparse(url)

        # Normalize domain (remove www. if present)
        netloc = parsed_url.netloc
        if netloc.startswith("www."):
            netloc = netloc[4:]

        # Rebuild the URL with normalized domain and without trailing slash
        path = parsed_url.path
        if path.endswith("/"):
            path = path[:-1]

        # Rebuild the URL
        normalized = f"{parsed_url.scheme}://{netloc}{path}"

        # Add query and fragment if they exist
        if parsed_url.query:
            normalized += f"?{parsed_url.query}"
        if parsed_url.fragment:
            normalized += f"#{parsed_url.fragment}"

        return normalized

    def get_company_name(self, url):
        """Get company name from domain."""
        domain = self.extract_domain_name(url)
        if not domain:  # Handle empty domain case
            return "Unknown Company"

        # Remove TLD and split by dots or hyphens
        name_parts = re.split(r"\.|-", domain)[0]
        # Capitalize words
        return (
            " ".join(
                word.capitalize() for word in re.split(r"(?=[A-Z])", name_parts) if word
            )
            or "Unknown Company"
        )  # Fallback if we can't extract a name

    def _create_company_from_data(self, client_data, fallback_url=None):
        """Create a Company object from client data."""
        url = client_data.get("website_url", fallback_url)
        if not url:
            return None

        # Ensure URL has proper scheme
        url = self.normalize_url(url)

        return Company(
            name=client_data.get("name") or self.get_company_name(url),
            website_url=url,
        )

    def _get_scrape_params(self, prompt=None):
        """Get parameters for the Firecrawl scrape task."""
        default_prompt = (
            "Find all client companies mentioned on this website and their information"
        )

        return {
            "formats": ["extract"],
            "extract": {
                "schema": ClientsSchema.model_json_schema(),
                "prompt": prompt or default_prompt,
            },
        }

    async def scrape_clients(self, url):
        """
        Scrape the clients from a company website.

        Args:
            url: The URL of the company website

        Returns:
            A Company object with its clients
        """
        # Normalize URL
        normalized_url = self.normalize_url(url)

        # Check cache first
        if normalized_url in self.results_cache:
            print(f"Using cached result for {normalized_url}")
            return self.results_cache[normalized_url]

        # Create basic company object (will be populated with clients if scraping succeeds)
        company = Company(
            name=self.get_company_name(normalized_url),
            website_url=normalized_url,
        )

        try:
            # Scrape the clients from this URL using the Firecrawl API
            params = self._get_scrape_params()
            result = self.app.scrape_url(normalized_url, params=params)

            # Process results
            if result and "extract" in result and "clients" in result["extract"]:
                for client_data in result["extract"]["clients"]:
                    client = self._create_company_from_data(client_data)
                    if client:
                        company.add_client(client)

                # Cache successful result
                self.results_cache[normalized_url] = company

        except Exception as e:
            print(f"Error scraping {normalized_url}: {str(e)}")
            # Continue with empty client list

        return company

    async def batch_scrape_clients(self, urls):
        """
        Batch scrape clients from multiple company websites.

        Args:
            urls: List of URLs to scrape

        Returns:
            Dictionary mapping URLs to Company objects
        """
        if not urls:
            return {}

        results = {}

        # Normalize all URLs
        normalized_urls = [self.normalize_url(url) for url in urls]

        # Remove URLs we've already cached
        uncached_urls = []
        uncached_indices = []

        for i, normalized_url in enumerate(normalized_urls):
            if normalized_url in self.results_cache:
                # Use cached result
                results[urls[i]] = self.results_cache[normalized_url]
            else:
                uncached_urls.append(normalized_url)
                uncached_indices.append(i)

        # If we have any uncached URLs, process them
        if uncached_urls:
            try:
                # Use Firecrawl batch API
                params = self._get_scrape_params()
                batch_result = self.app.batch_scrape_urls(uncached_urls, params=params)

                # Process batch results
                if (
                    batch_result.get("success")
                    and batch_result.get("status") == "completed"
                    and "data" in batch_result
                ):
                    for i, data_item in enumerate(batch_result["data"]):
                        if i < len(uncached_urls):
                            normalized_url = uncached_urls[i]
                            original_url = urls[uncached_indices[i]]

                            # Create company
                            company = Company(
                                name=self.get_company_name(normalized_url),
                                website_url=normalized_url,
                            )

                            # Add clients if available
                            if (
                                "extract" in data_item
                                and "clients" in data_item["extract"]
                            ):
                                for client_data in data_item["extract"]["clients"]:
                                    client = self._create_company_from_data(client_data)
                                    if client:
                                        company.add_client(client)

                            # Cache and add to results
                            self.results_cache[normalized_url] = company
                            results[original_url] = company

            except Exception as e:
                print(f"Error in batch scrape: {str(e)}")
                # Fall back to individual scraping for any URLs we couldn't process

        # Create company objects for any URLs that haven't been processed yet
        for i, url in enumerate(urls):
            if url not in results:
                normalized_url = normalized_urls[i]
                company = Company(
                    name=self.get_company_name(normalized_url),
                    website_url=normalized_url,
                )
                results[url] = company

        return results
