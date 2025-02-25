import re
import os
from pathlib import Path
import json
import asyncio
import uuid
import logging
from dataclasses import dataclass
from typing import List, Dict, Optional
from langchain.text_splitter import (
    MarkdownHeaderTextSplitter,
    RecursiveCharacterTextSplitter,
)
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("process_dataset.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


@dataclass
class Config:
    """Configuration for dataset processing"""

    input_dir: Path
    output_file: Path
    blog_keywords: List[str]
    min_chunk_length: int = 50
    model_name: str = "mistral:7b"
    temperature: float = 0.7
    batch_size: int = 10
    max_retries: int = 3


@dataclass
class Metadata:
    """Metadata structure for all markdown files"""

    title: str
    url: str


def load_config() -> Config:
    """Load configuration from environment or defaults"""
    return Config(
        input_dir=Path(os.getenv("INPUT_DIR", "data/test")),
        output_file=Path(
            os.getenv("OUTPUT_FILE", "data/firecrawl_chunked_dataset.json")
        ),
        blog_keywords=[
            "firecrawl",
            "api",
            "scraping",
            "web scraping",
            "automation",
            "tutorial",
            "guide",
            "example",
            "documentation",
            "pydantic",
            "endpoint",
            "extract",
            "scrape",
            "crawl",
            "url",
            "link",
            "page",
            "html",
            "json",
            "api",
            "sdk",
            "markdown",
            "html",
            "css",
            "javascript",
            "basemodel",
            "field",
            "page",
            "website",
            "webpage",
            "web",
            "scraping",
            "web scraping",
        ],
    )


def clean_markdown(content: str) -> str:
    """Clean markdown content while preserving important information."""
    try:
        # Remove empty markdown links
        content = re.sub(r"\[\]\([^)]+\)", "", content)

        # Unescape common escaped characters
        content = (
            content.replace("\\[", "[")
            .replace("\\]", "]")
            .replace("\\.", ".")
            .replace("\\*", "*")
        )

        # Remove excessive whitespace and newlines while preserving paragraph structure
        content = re.sub(r"\s*\n\s*\n\s*", "\n\n", content)
        content = re.sub(r" +", " ", content)

        # Remove any remaining backslash escapes
        content = re.sub(r"\\([^\s])", r"\1", content)

        return content.strip()

    except Exception as e:
        logger.error(f"Error cleaning markdown: {str(e)}")
        raise


def process_directory(input_dir: Path, output_dir: Path):
    """Process all markdown files in a directory."""
    output_dir.mkdir(parents=True, exist_ok=True)

    for file_path in input_dir.glob("**/*.md"):
        relative_path = file_path.relative_to(input_dir)
        output_path = output_dir / relative_path
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        cleaned_content = clean_markdown(content)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(cleaned_content)


def contains_keywords(text: str, keywords: List[str]) -> bool:
    """Check if text contains any of the specified keywords (case-insensitive)."""
    text_lower = text.lower()
    return any(keyword.lower() in text_lower for keyword in keywords)


def chunk_markdown(
    content: str, is_blog: bool = False, keywords: List[str] = None
) -> List[str]:
    """
    Split markdown content into chunks based on headers.
    For blog content, optionally filter chunks based on keywords.
    """
    # Define headers to split on
    headers_to_split_on = [
        ("##", "h2"),
        ("###", "h3"),
        ("####", "h4"),
    ]

    # Split by headers
    header_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on
    )
    header_chunks = header_splitter.split_text(content)

    final_chunks = []
    for chunk in header_chunks:
        # Combine headers with content
        chunk_text = chunk.page_content
        if hasattr(chunk, "metadata") and chunk.metadata:
            headers = []
            for level in ["h2", "h3", "h4"]:
                if level in chunk.metadata and chunk.metadata[level]:
                    headers.append(chunk.metadata[level])
            if headers:
                chunk_text = " > ".join(headers) + "\n\n" + chunk_text

        # For blog content, apply keyword filtering
        if is_blog:
            if keywords and not contains_keywords(chunk_text, keywords):
                continue

        final_chunks.append(chunk_text)

    return final_chunks


def extract_frontmatter(content: str) -> Optional[Metadata]:
    """Extract title and url from markdown frontmatter"""
    try:
        frontmatter_match = re.match(r"---\n(.*?)\n---", content, re.DOTALL)
        if frontmatter_match:
            frontmatter = frontmatter_match.group(1)
            title = ""
            url = ""

            for line in frontmatter.split("\n"):
                if line.startswith("title:"):
                    title = line.split(":", 1)[1].strip()
                elif line.startswith("url:"):
                    url = line.split(":", 1)[1].strip()

            if title and url:
                return Metadata(title=title, url=url)

        logger.warning(f"Missing or incomplete frontmatter")
        return None

    except Exception as e:
        logger.warning(f"Error extracting frontmatter: {str(e)}")
        return None


def is_chunk_informative(chunk: str, config: Config) -> bool:
    """
    Filter chunks based on length and keywords only.
    Returns True if the chunk is deemed informative.
    """
    # Skip if too short
    if len(chunk.strip()) < config.min_chunk_length:
        return False

    # Use keywords from config
    return contains_keywords(chunk, config.blog_keywords)


async def process_chunks_in_batches(
    chunks: List[str],
    file_path: Path,
    input_dir: Path,
    metadata: Optional[Metadata],
    config: Config,
) -> List[Dict]:
    """Process chunks in batches using keyword filtering"""
    all_results = []

    logger.info(f"Processing {len(chunks)} chunks from {file_path.name}")

    # Process all chunks at once since we're not using async AI calls anymore
    informative_chunks = [
        {
            "id": str(uuid.uuid4()),
            "source": str(file_path.relative_to(input_dir)),
            "content": chunk.strip(),
            "metadata": {
                "title": metadata.title if metadata else "Unknown",
                "url": metadata.url if metadata else "",
            },
        }
        for chunk in chunks
        if is_chunk_informative(chunk, config)
    ]

    logger.info(f"Found {len(informative_chunks)} informative chunks")
    return informative_chunks


async def create_dataset(config: Config):
    """Process markdown files into a dataset of chunks."""
    try:
        dataset = []
        files = list(config.input_dir.glob("**/*.md"))

        logger.info(f"Found {len(files)} markdown files to process")

        for file_path in files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                # Extract metadata before cleaning
                metadata = extract_frontmatter(content)
                if not metadata:
                    logger.warning(f"No valid frontmatter found in {file_path}")
                    continue

                # Clean and chunk content
                cleaned_content = clean_markdown(content)
                chunks = chunk_markdown(
                    cleaned_content,
                    is_blog="blog"
                    in str(file_path),  # Determine if blog by path instead
                    keywords=config.blog_keywords if "blog" in str(file_path) else None,
                )

                # Process chunks in batches
                informative_chunks = await process_chunks_in_batches(
                    chunks, file_path, config.input_dir, metadata, config
                )
                dataset.extend(informative_chunks)

            except Exception as e:
                logger.error(f"Error processing file {file_path}: {str(e)}")
                continue

        # Save dataset
        config.output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(config.output_file, "w", encoding="utf-8") as f:
            json.dump({"data": dataset}, f, indent=2, ensure_ascii=False)

        logger.info(f"Successfully created dataset with {len(dataset)} chunks")

    except Exception as e:
        logger.error(f"Fatal error in create_dataset: {str(e)}")
        raise


if __name__ == "__main__":
    try:
        config = load_config()
        asyncio.run(create_dataset(config))
    except Exception as e:
        logger.error(f"Script failed: {str(e)}")
        raise
