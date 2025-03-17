import time
from datetime import datetime
from typing import Dict

from firecrawl import FirecrawlApp
from src.config import FIRECRAWL_API_KEY

def extract_website_content(url: str, max_urls: int = 10, show_full_text: bool = True) -> Dict:
    """
    Extract website content using Firecrawl's LLMs.txt API.
    
    Args:
        url: Website URL to extract content from
        max_urls: Maximum number of pages to crawl (1-100)
        show_full_text: Whether to include comprehensive text
        
    Returns:
        Dictionary containing extracted content and metadata
    """
    # Initialize the client
    firecrawl = FirecrawlApp(api_key=FIRECRAWL_API_KEY)
    
    # Define generation parameters
    params = {
        "maxUrls": max_urls,
        "showFullText": show_full_text
    }
    
    # Generate LLMs.txt with async processing and polling
    job = firecrawl.async_generate_llms_text(
        url=url,
        params=params
    )
    
    if not job.get('success'):
        raise Exception(f"Failed to start extraction: {job.get('error', 'Unknown error')}")
        
    job_id = job['id']
    status = None
    
    # Poll for job completion
    while status != 'completed':
        status_response = firecrawl.check_generate_llms_text_status(job_id)
        status = status_response.get('status')
        
        if status == 'failed':
            raise Exception(f"Extraction failed: {status_response.get('error', 'Unknown error')}")
            
        if status != 'completed':
            time.sleep(2)  # Polling interval
    
    # Return the completed extraction results
    return {
        'llmstxt': status_response['data']['llmstxt'],
        'llmsfulltxt': status_response['data'].get('llmsfulltxt'),
        'processed_urls': status_response['data'].get('processedUrls', []),
        'extraction_timestamp': datetime.now().isoformat()
    }

if __name__ == "__main__":
    print(extract_website_content("https://www.firecrawl.dev"))