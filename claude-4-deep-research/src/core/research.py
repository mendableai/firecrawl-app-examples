"""
Deep research functionality using Firecrawl
"""

from typing import Dict, Any
from .clients import ClientManager


class ResearchEngine:
    """Handles deep research operations using Firecrawl."""

    def __init__(self, client_manager: ClientManager):
        self.client_manager = client_manager

    def get_tool_definition(self) -> Dict[str, Any]:
        """Get the tool definition for Firecrawl deep research."""
        return {
            "name": "deep_research",
            "description": """Conduct comprehensive deep research on any topic using web crawling and AI analysis. 
            This tool searches the web, analyzes multiple sources, and synthesizes findings into detailed insights.
            Use this when the user asks for in-depth research, current information, or comprehensive analysis on a topic.
            The tool will return structured findings with source attribution and detailed analysis.""",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The research topic or question to investigate",
                    },
                },
                "required": ["query"],
            },
        }

    def execute_research(
        self, query: str, max_depth: int = 5, time_limit: int = 180, max_urls: int = 20
    ) -> Dict[str, Any]:
        """Execute deep research using Firecrawl."""
        try:
            firecrawl = self.client_manager.get_firecrawl_client()

            # Run deep research
            result = firecrawl.deep_research(
                query=query,
                max_depth=max_depth,
                time_limit=time_limit,
                max_urls=max_urls,
            )

            return {"success": True, "data": result.get("data", {}), "query": query}

        except Exception as e:
            return {"success": False, "error": str(e), "query": query}
