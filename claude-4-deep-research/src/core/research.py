"""
Deep research functionality using Firecrawl
"""

import json
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
                    "max_depth": {
                        "type": "integer",
                        "description": "Maximum number of research iterations (1-10, default: 5)",
                        "minimum": 1,
                        "maximum": 10,
                        "default": 5,
                    },
                    "time_limit": {
                        "type": "integer",
                        "description": "Time limit in seconds (30-300, default: 180)",
                        "minimum": 30,
                        "maximum": 300,
                        "default": 180,
                    },
                    "max_urls": {
                        "type": "integer",
                        "description": "Maximum number of URLs to analyze (1-1000, default: 20)",
                        "minimum": 1,
                        "maximum": 1000,
                        "default": 20,
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

    def is_research_request(self, user_input: str) -> bool:
        """Check if user input looks like a research request."""
        research_keywords = [
            "research",
            "analyze",
            "study",
            "investigate",
            "explore",
            "latest",
            "current",
            "trends",
            "developments",
        ]
        return any(keyword in user_input.lower() for keyword in research_keywords)
