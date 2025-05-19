import os
import logging
from typing import List, Set
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re
from pathlib import Path
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class WebScraper:
    def __init__(self, base_url: str, output_dir: str = "docs", max_pages: int = 10, delay: float = 1.0):
        """
        Initialize the web scraper.
        
        Args:
            base_url (str): The base URL to start scraping from
            output_dir (str): Directory to save scraped content
            max_pages (int): Maximum number of pages to scrape
            delay (float): Delay between requests in seconds
        """
        self.base_url = base_url
        self.output_dir = output_dir
        self.max_pages = max_pages
        self.delay = delay
        self.visited_urls: Set[str] = set()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

    def is_valid_url(self, url: str) -> bool:
        """Check if URL is valid and belongs to the same domain."""
        try:
            result = urlparse(url)
            base_domain = urlparse(self.base_url).netloc
            return (
                result.netloc == base_domain and
                result.scheme in ('http', 'https') and
                not url.endswith(('.pdf', '.zip', '.png', '.jpg', '.jpeg', '.gif'))
            )
        except Exception:
            return False

    def get_page_content(self, url: str) -> str:
        """Fetch and parse page content."""
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.text
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return ""

    def extract_links(self, html_content: str, current_url: str) -> List[str]:
        """Extract valid links from HTML content."""
        soup = BeautifulSoup(html_content, 'html.parser')
        links = []
        
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            full_url = urljoin(current_url, href)
            if self.is_valid_url(full_url):
                links.append(full_url)
        
        return list(set(links))  # Remove duplicates

    def extract_main_content(self, html_content: str) -> str:
        """Extract main content from HTML and convert to markdown."""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove unwanted elements
        for element in soup.find_all(['script', 'style', 'nav', 'footer', 'header']):
            element.decompose()
        
        # Try to find main content
        main_content = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile(r'content|main|article'))
        
        if not main_content:
            main_content = soup.body
        
        if not main_content:
            return ""
        
        # Convert to markdown-like format
        content = []
        
        # Process headings
        for heading in main_content.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            level = int(heading.name[1])
            content.append(f"{'#' * level} {heading.get_text().strip()}\n")
        
        # Process paragraphs
        for p in main_content.find_all('p'):
            content.append(f"{p.get_text().strip()}\n")
        
        # Process code blocks
        for code in main_content.find_all('pre'):
            content.append(f"```\n{code.get_text().strip()}\n```\n")
        
        # Process lists
        for ul in main_content.find_all(['ul', 'ol']):
            for li in ul.find_all('li', recursive=False):
                content.append(f"- {li.get_text().strip()}\n")
        
        return "\n".join(content)

    def save_content(self, url: str, content: str) -> None:
        """Save content to a markdown file."""
        if not content.strip():
            return
        
        # Create filename from URL
        parsed_url = urlparse(url)
        path_parts = parsed_url.path.strip('/').split('/')
        filename = '_'.join(path_parts) or 'index'
        filename = f"{filename}.md"
        
        # Save file
        filepath = os.path.join(self.output_dir, filename)
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(f"# Content from {url}\n\n")
                f.write(content)
            logger.info(f"Saved content to {filepath}")
        except Exception as e:
            logger.error(f"Error saving content to {filepath}: {str(e)}")

    def scrape(self) -> None:
        """Main scraping method."""
        urls_to_visit = [self.base_url]
        pages_scraped = 0
        
        while urls_to_visit and pages_scraped < self.max_pages:
            current_url = urls_to_visit.pop(0)
            
            if current_url in self.visited_urls:
                continue
            
            logger.info(f"Scraping {current_url}")
            self.visited_urls.add(current_url)
            
            # Get and process page content
            html_content = self.get_page_content(current_url)
            if not html_content:
                continue
            
            # Extract and save main content
            main_content = self.extract_main_content(html_content)
            self.save_content(current_url, main_content)
            
            # Extract new links
            new_links = self.extract_links(html_content, current_url)
            urls_to_visit.extend([link for link in new_links if link not in self.visited_urls])
            
            pages_scraped += 1
            time.sleep(self.delay)  # Be nice to servers
        
        logger.info(f"Scraping completed. Scraped {pages_scraped} pages.")

def main():
    """Example usage of the WebScraper."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Web scraper for documentation pages')
    parser.add_argument('url', help='Base URL to start scraping from')
    parser.add_argument('--output', '-o', default='docs', help='Output directory for scraped content')
    parser.add_argument('--max-pages', '-m', type=int, default=10, help='Maximum number of pages to scrape')
    parser.add_argument('--delay', '-d', type=float, default=1.0, help='Delay between requests in seconds')
    
    args = parser.parse_args()
    
    scraper = WebScraper(
        base_url=args.url,
        output_dir=args.output,
        max_pages=args.max_pages,
        delay=args.delay
    )
    
    scraper.scrape()

if __name__ == "__main__":
    main() 