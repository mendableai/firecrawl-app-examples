# src/chatgpt_clone/tools/firecrawl_research_tool.py

from crewai.tools import tool
from firecrawl import FirecrawlApp


@tool("Deep Research with Firecrawl")
def firecrawl_research_tool(query: str) -> str:
    """Performs comprehensive multi-source research with Firecrawl."""
    app = FirecrawlApp()
    result = app.deep_research(query=query, max_depth=5, time_limit=180, max_urls=15)

    if not result["data"]:
        return "Research failed or returned no data."

    return f"{result['data']['finalAnalysis']}\n\nSources: {len(result['data']['sources'])} references"
