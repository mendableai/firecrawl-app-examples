from typing import Type, List, Dict, Any
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
import os
import ssl
import time
import requests
from dotenv import load_dotenv
from firecrawl import FirecrawlApp
load_dotenv()

def scrape_google_queries(input_queries: list[str]) -> List[Dict[str, str]]:
    """
    Process a list of search results which inlcude link, title, description using the Firecrawl search endpoint and return deduplicated results.
    
    Args:
        input_queries (list[str]): List of search queries to process
        
    Returns:
        List[Dict[str, str]]: List of unique search results with title, link, and description
    """
    url = "https://api.firecrawl.dev/v1/search"
    headers = {
        "Authorization": f"Bearer {os.getenv('FIRECRAWL_API_KEY')}",
        "Content-Type": "application/json"
    }
    
    all_results = []
    
    for query in input_queries:
        print(query)
        payload = {
            "query": query,
            "limit": 3,
            "lang": "en",
            "country": "us",
            "timeout": 60000,
            "scrapeOptions": {}
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            time.sleep(5)
            response.raise_for_status()
            results = response.json().get("data", [])
            for result in results:
                search_result = {
                    "title": result.get("title", ""),
                    "link": result.get("url", ""), 
                    "description": result.get("description", "")
                }
                all_results.append(search_result)
                
        except requests.exceptions.RequestException as e:
            print(f"Error processing query '{query}': {e}")
            continue
    
    # Convert list of dictionaries to list of tuples for set operations
    results_tuples = [(result["title"], result["link"], result["description"]) for result in all_results]
    
    # Use set to deduplicate based on the link (second element in tuple)
    unique_tuples = list(set(results_tuples))
    
    # Convert back to list of dictionaries
    unique_webPages = [
        {"title": title, "link": link, "description": description}
        for title, link, description in unique_tuples
    ]
    
    return unique_webPages


def scrape_web_pages(input_web_pages: List[Dict[str, str]] ) -> list[str]:
    """
    Scrape content from a list of web pages using the Firecrawl scrape endpoint.
    
    Args:
        input_web_pages (list[str]): List of URLs to scrape
        
    Returns:
        List[Dict[str, str]]: List of scraped content with URL and markdown content
    """
    url = "https://api.firecrawl.dev/v1/scrape"
    headers = {
        "Authorization": f"Bearer {os.getenv('FIRECRAWL_API_KEY')}",
        "Content-Type": "application/json"
    }
    
    scraped_content = []
    print('input_web_pages',input_web_pages)
    for page_info in input_web_pages:
        page_url = page_info.get('link', '')  # Extract URL from the dictionary
        if not page_url:
            print(f"Skipping page with missing URL: {page_info}")
            continue
        payload = {
            "url": page_url,
            "formats": ["markdown"],
            "onlyMainContent": True,
            "timeout": 30000,
            "location": {
                "country": "US",
                "languages": ["en-US"]
            },
            "removeBase64Images": True,
            "blockAds": True,
            "proxy": "basic"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            results = response.json().get("data", [])
            # Parse the response and extract content
            
            scraped_content.append(results.get("markdown", ""))
            
        except requests.exceptions.RequestException as e:
            print(f"Error scraping page '{page_url}': {e}")
            continue
    return "\n\n-----------------\n\n".join(scraped_content)

