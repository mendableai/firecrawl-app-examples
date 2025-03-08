import sys
import os
import asyncio
import time
from urllib.parse import urlparse

# Add the src directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.company import Company
from scraper.client_scraper import ClientScraper


class ClientTreeBuilder:
    """Builds a tree of companies and their clients recursively."""

    def __init__(self, api_key=None, max_clients_per_company=10):
        """Initialize the tree builder with an API key."""
        self.scraper = ClientScraper(api_key=api_key)
        self.processed_urls = set()  # Track already processed URLs to avoid loops
        self.max_clients_per_company = (
            max_clients_per_company  # Limit clients per company
        )
        self.start_time = None

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

    async def build_tree(self, root_url, max_depth=2):
        """
        Build a tree of companies and their clients up to max_depth.

        Args:
            root_url: The URL of the root company
            max_depth: Maximum depth to crawl

        Returns:
            A Company object representing the root with all its clients
        """
        # Normalize the root URL
        root_url = self.normalize_url(root_url)

        self.processed_urls.clear()  # Reset processed URLs for a new tree
        self.start_time = time.time()

        # Start the recursive tree building
        result = await self._build_tree_recursive(
            root_url, current_depth=0, max_depth=max_depth
        )

        end_time = time.time()
        elapsed_time = end_time - self.start_time
        print(f"Tree building completed in {elapsed_time:.2f} seconds")

        return result

    async def _build_tree_recursive(self, url, current_depth, max_depth):
        """
        Recursively build the client tree.

        Args:
            url: Current company URL to process
            current_depth: Current depth in the tree
            max_depth: Maximum depth to crawl

        Returns:
            A Company object for the current URL with all its clients
        """
        # Track time at current depth level for more detailed logging
        level_start_time = time.time()

        # Normalize URL
        url = self.normalize_url(url)

        # Avoid processing the same URL twice (prevents cycles)
        if url in self.processed_urls:
            return None

        # Mark this URL as processed
        self.processed_urls.add(url)

        # Scrape the current company and its clients
        company = await self.scraper.scrape_clients(url)

        # Limit the number of clients to prevent exponential growth
        if len(company.clients) > self.max_clients_per_company:
            print(
                f"Limiting clients from {len(company.clients)} to {self.max_clients_per_company} for {url}"
            )
            company.clients = company.clients[: self.max_clients_per_company]

        # Base case: reached maximum depth
        if current_depth >= max_depth:
            return company

        # Get all client URLs at this level that haven't been processed yet
        client_urls = []
        for client in company.clients:
            # Normalize client URL
            client_url = self.normalize_url(client.website_url)
            # Update the client's URL to the normalized version
            client.website_url = client_url
            # Add to list if not already processed
            if client_url not in self.processed_urls:
                client_urls.append(client_url)

        # Mark these URLs as processed before batch scraping
        self.processed_urls.update(client_urls)

        # Process clients in batches (only if we have clients to process)
        if client_urls:
            # Batch scrape all clients at this level
            client_companies = await self.scraper.batch_scrape_clients(client_urls)

            # Process the next level recursively (if not at max depth)
            if current_depth + 1 < max_depth:
                next_level_tasks = []

                # For each client company, create tasks for processing their clients
                for client_url, client_company in client_companies.items():
                    # Limit the number of clients for the next level
                    if len(client_company.clients) > self.max_clients_per_company:
                        client_company.clients = client_company.clients[
                            : self.max_clients_per_company
                        ]

                    # Get all clients of this client that haven't been processed
                    next_level_urls = []
                    for c in client_company.clients:
                        # Normalize URL
                        next_url = self.normalize_url(c.website_url)
                        # Update client's URL to normalized version
                        c.website_url = next_url
                        # Add to list if not already processed
                        if next_url not in self.processed_urls:
                            next_level_urls.append(next_url)

                    # Create tasks for processing each next-level URL
                    for next_url in next_level_urls:
                        next_level_tasks.append(
                            (
                                client_url,
                                self._build_tree_recursive(
                                    next_url, current_depth + 1, max_depth
                                ),
                            )
                        )

                # Process all next-level tasks and update the company tree
                for client_url, task in next_level_tasks:
                    try:
                        result = await task
                        if result is not None:
                            # Find the client in the client_companies dictionary
                            client_company = client_companies[client_url]
                            # Update the client's clients with the processed result
                            for i, c in enumerate(client_company.clients):
                                if c.website_url == result.website_url:
                                    client_company.clients[i] = result
                    except Exception as e:
                        print(f"Error processing client {client_url}: {str(e)}")

            # Update the company's clients with the fully processed client companies
            for i, client in enumerate(company.clients):
                normalized_client_url = self.normalize_url(client.website_url)
                if normalized_client_url in client_companies:
                    company.clients[i] = client_companies[normalized_client_url]

        # Log timing for the current level
        level_end_time = time.time()
        level_elapsed = level_end_time - level_start_time
        elapsed_so_far = level_end_time - self.start_time
        if (
            current_depth == 0
        ):  # Only log timing for the root URL to avoid too much output
            print(
                f"Processed depth {current_depth} for {url} in {level_elapsed:.2f} seconds (total: {elapsed_so_far:.2f}s)"
            )

        return company
