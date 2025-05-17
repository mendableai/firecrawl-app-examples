# src/chatgpt_clone/tools/firecrawl_search_tool.py

from crewai.tools import tool
from firecrawl import FirecrawlApp


@tool("Quick Web Search with Firecrawl")
def firecrawl_search_tool(query: str) -> str:
    """Performs a quick real-time search using Firecrawl and returns summarized results."""
    app = FirecrawlApp()
    result = app.search(query)
    if not result.success:
        return "Search failed."

    summary = "\n\n".join(
        [
            f"{item['title']}\n{item['url']}\n{item['description']}"
            for item in result.data[:5]
        ]
    )
    return f"Top Search Results:\n\n{summary}"
