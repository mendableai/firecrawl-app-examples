from dotenv import load_dotenv
import os
import requests
from firecrawl import FirecrawlApp, ScrapeOptions
from langgraph.config import get_stream_writer


load_dotenv()


def research_market_landscape(startup_idea: str) -> str:
    """
    Research market data using Firecrawl web scraping.
    Gathers competitor analysis, market size data, and industry reports.
    """
    try:
        # Initialize Firecrawl client
        api_key = os.getenv("FIRECRAWL_API_KEY")
        if not api_key:
            return "❌ Error: FIRECRAWL_API_KEY environment variable is required"

        app = FirecrawlApp(api_key=api_key)

        writer = get_stream_writer()
        writer(
            f"TOOL USE: Researching the web for market landscape data for {startup_idea}..."
        )
        # Search for market and competitive data
        search_result = app.search(
            f"{startup_idea} market size competitors industry analysis",
            limit=5,
            scrape_options=ScrapeOptions(formats=["markdown"]),
        )

        if not search_result.data:
            writer(f"TOOL OUTPUT: No market data found for: {startup_idea}")
            return f"No market data found for: {startup_idea}"

        writer(f"TOOL OUTPUT: Submitting the market data back to the agent...")

        # Format results
        results = []
        results.append("🌐 MARKET LANDSCAPE RESEARCH:")
        results.append("=" * 60)

        for i, result in enumerate(search_result.data[:3], 1):
            results.append(f"\n{i}. **{result['title']}**")
            results.append(f"URL: {result['url']}")

            # Add full content if available
            if "markdown" in result and result["markdown"]:
                content = result["markdown"].strip()
                if content:
                    results.append(f"\nCONTENT:")
                    results.append("-" * 40)
                    results.append(content)
                    results.append("-" * 40)

            results.append("")

        return "\n".join(results)

    except Exception as e:
        return f"❌ Error researching market landscape: {str(e)}"


def analyze_community_sentiment(startup_idea: str) -> str:
    """
    Analyze developer community sentiment using Hacker News API.
    Searches for discussions related to the startup idea and problem space.
    """
    try:
        writer = get_stream_writer()
        writer(
            f"TOOL USE: Analyzing community sentiment for {startup_idea} using Hacker News API..."
        )
        # Search Hacker News using Algolia API (no auth required)
        search_url = "https://hn.algolia.com/api/v1/search"
        params = {"query": startup_idea, "tags": "story", "hitsPerPage": 10}

        response = requests.get(search_url, params=params)
        response.raise_for_status()
        data = response.json()

        if not data.get("hits"):
            writer(f"TOOL OUTPUT: No Hacker News discussions found for: {startup_idea}")
            return f"No Hacker News discussions found for: {startup_idea}"

        # Format results
        results = []
        results.append("💬 HACKER NEWS COMMUNITY SENTIMENT:")
        results.append("=" * 60)

        for i, hit in enumerate(data["hits"][:5], 1):
            results.append(f"\n{i}. **{hit.get('title', 'No title')}**")
            results.append(
                f"URL: https://news.ycombinator.com/item?id={hit['objectID']}"
            )
            results.append(
                f"Points: {hit.get('points', 0)} | Comments: {hit.get('num_comments', 0)}"
            )

            if hit.get("url"):
                results.append(f"Original URL: {hit['url']}")

            results.append("")

        writer(
            f"TOOL OUTPUT: Submitting the community sentiment data back to the agent..."
        )

        return "\n".join(results)

    except Exception as e:
        return f"❌ Error analyzing community sentiment: {str(e)}"


def assess_technical_feasibility(startup_idea: str) -> str:
    """
    Assess technical feasibility using GitHub API.
    Searches for existing implementations and analyzes technical complexity.
    """
    try:
        writer = get_stream_writer()
        writer(
            f"TOOL USE: Assessing technical feasibility for {startup_idea} using GitHub API..."
        )
        # Get GitHub token
        github_token = os.getenv("GITHUB_TOKEN")
        if not github_token:
            return "❌ Error: GITHUB_TOKEN environment variable is required"

        # Search GitHub repositories
        search_url = "https://api.github.com/search/repositories"
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        params = {
            "q": startup_idea.replace(" ", "+"),
            "sort": "stars",
            "order": "desc",
            "per_page": 10,
        }

        response = requests.get(search_url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

        if not data.get("items"):
            writer(f"TOOL OUTPUT: No GitHub repositories found for: {startup_idea}")
            return f"No GitHub repositories found for: {startup_idea}"

        # Format results
        results = []
        results.append("⚙️ TECHNICAL FEASIBILITY ASSESSMENT:")
        results.append("=" * 60)

        for i, repo in enumerate(data["items"][:5], 1):
            results.append(f"\n{i}. **{repo['name']}**")
            results.append(f"URL: {repo['html_url']}")
            results.append(f"Description: {repo.get('description', 'No description')}")
            results.append(f"Language: {repo.get('language', 'Not specified')}")
            results.append(
                f"Stars: {repo['stargazers_count']} | Forks: {repo['forks_count']}"
            )
            results.append(f"Last Updated: {repo['updated_at'][:10]}")
            results.append("")

        writer(
            f"TOOL OUTPUT: Submitting the technical feasibility data back to the agent..."
        )

        return "\n".join(results)

    except Exception as e:
        return f"❌ Error assessing technical feasibility: {str(e)}"
