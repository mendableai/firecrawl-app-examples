# src/chatgpt_clone/tools/firecrawl_extract_tool.py

from crewai.tools import tool
from firecrawl import FirecrawlApp


@tool("Web Data Extractor with Firecrawl")
def firecrawl_extract_tool(url_and_prompt: str) -> str:
    """
    Scrapes structured data from a webpage using Firecrawl.

    Expected input format: "<url>|<custom extraction prompt>"
    Example: "https://github.com/trending|Extract the top 5 trending repositories"
    """
    try:
        url, prompt = url_and_prompt.split("|", 1)
    except ValueError:
        return "Invalid input format. Use: <url>|<prompt>"

    app = FirecrawlApp()
    result = app.extract([url.strip()], prompt=prompt.strip())

    if not result.success:
        return "Extraction failed."

    return f"Extracted Data:\n\n{result.data}"
