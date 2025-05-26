"""
API client management for Claude 4 Deep Research Assistant
"""

import os
import anthropic
from firecrawl import FirecrawlApp
from typing import Optional


class ClientManager:
    """Manages API clients for Anthropic and Firecrawl."""

    def __init__(self):
        self._anthropic_client: Optional[anthropic.Anthropic] = None
        self._firecrawl_client: Optional[FirecrawlApp] = None

    def get_anthropic_client(self) -> anthropic.Anthropic:
        """Get or create Anthropic client."""
        if self._anthropic_client is None:
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
            self._anthropic_client = anthropic.Anthropic(api_key=api_key)
        return self._anthropic_client

    def get_firecrawl_client(self) -> FirecrawlApp:
        """Get or create Firecrawl client."""
        if self._firecrawl_client is None:
            api_key = os.getenv("FIRECRAWL_API_KEY")
            if not api_key:
                raise ValueError("FIRECRAWL_API_KEY not found in environment variables")
            self._firecrawl_client = FirecrawlApp(api_key=api_key)
        return self._firecrawl_client

    def check_api_keys(self) -> dict:
        """Check if API keys are available."""
        return {
            "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
            "firecrawl": bool(os.getenv("FIRECRAWL_API_KEY")),
        }
