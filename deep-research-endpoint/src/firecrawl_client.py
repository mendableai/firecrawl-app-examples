from typing import Dict, Any, Callable, Optional


class FirecrawlClient:
    """Client for interacting with the Firecrawl API."""

    def __init__(self, api_key: str):
        """Initialize the Firecrawl client with an API key.

        Args:
            api_key (str): The Firecrawl API key
        """
        from firecrawl import FirecrawlApp

        self.client = FirecrawlApp(api_key=api_key)

    def deep_research(
        self,
        query: str,
        max_depth: int = 3,
        timeout_limit: int = 120,
        max_urls: int = 20,
        on_activity: Optional[Callable[[Dict[str, Any]], None]] = None,
    ) -> Dict[str, Any]:
        """Perform deep research using Firecrawl.

        Args:
            query (str): The research query to investigate
            max_depth (int, optional): Maximum depth of exploration. Defaults to 3.
            timeout_limit (int, optional): Timeout limit in seconds. Defaults to 120.
            max_urls (int, optional): Maximum number of URLs to explore. Defaults to 20.
            on_activity (Optional[Callable], optional): Callback function for activity updates.
                Defaults to None.

        Returns:
            Dict[str, Any]: The research results
        """
        # Define research parameters
        params = {
            "maxDepth": max_depth,
            "timeLimit": timeout_limit,
            "maxUrls": max_urls,
        }

        # Run deep research
        results = self.client.deep_research(
            query=query, params=params, on_activity=on_activity
        )

        # Format the results into a consistent structure for our application
        formatted_results = {
            "analysis": results.get("data", {}).get("finalAnalysis", ""),
            "sources": [],
        }

        # Extract sources if available
        if "data" in results and "sources" in results["data"]:
            formatted_results["sources"] = results["data"]["sources"]

        return formatted_results

    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get the status of a task.

        Args:
            task_id (str): The task ID to check

        Returns:
            Dict[str, Any]: The task status data
        """
        return self.client.check_task_status(task_id)
