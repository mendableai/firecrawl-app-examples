import openai
import json
import logging
import time
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
from chunk import create_openai_client

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Simple rate limiter using a semaphore
class SimpleRateLimiter:
    def __init__(self, max_calls: int = 500, per_seconds: int = 60):
        # Calculate seconds per request to stay under the limit
        self.seconds_per_request = per_seconds / max_calls
        self.lock = threading.Lock()
        self.last_request_time = time.time()

    def wait(self):
        with self.lock:
            # Calculate time since last request
            current_time = time.time()
            elapsed = current_time - self.last_request_time

            # If not enough time has passed, sleep
            if elapsed < self.seconds_per_request:
                sleep_time = self.seconds_per_request - elapsed
                time.sleep(sleep_time)

            # Update last request time
            self.last_request_time = time.time()


def is_chunk_relevant(
    chunk: Dict[str, Any],
    client: Optional[openai.OpenAI] = None,
    model: str = "gpt-4.1-mini",
    rate_limiter: Optional[SimpleRateLimiter] = None,
) -> bool:
    """
    Determine if a chunk is relevant to Bullet Echo game and contains useful content.

    Args:
        chunk: The chunk dictionary containing content and metadata
        client: Optional OpenAI client
        model: Model to use for classification
        rate_limiter: Optional rate limiter

    Returns:
        Boolean indicating if the chunk is relevant
    """
    if client is None:
        client = create_openai_client()

    content = chunk.get("content", "")

    # Skip empty chunks
    if not content or len(content.strip()) < 20:
        return False

    # Apply rate limiting if provided
    if rate_limiter:
        rate_limiter.wait()

    prompt = f"""
    You are a content filter for a Bullet Echo game dataset. Analyze this text and determine if it's relevant. 
    
    Text: {content}
    
    Rules:
    1. KEEP content if it contains useful information about Bullet Echo game (characters, gameplay, mechanics, strategies, etc.)
    2. REJECT content if it's just navigation links, table of contents, calls to action, or generic website components
    3. REJECT content if it's completely unrelated to Bullet Echo
    4. REJECT content that's just advertisements or promotional material
    
    Respond with ONLY:
    - "KEEP" if the content is relevant and useful about Bullet Echo
    - "REJECT" if the content should be filtered out
    """

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=10,
        )
        result = response.choices[0].message.content.strip().upper()
        return result == "KEEP"
    except Exception as e:
        logger.error(f"Error classifying chunk: {e}")
        # Default to keeping in case of errors
        return True


def filter_chunks(
    input_file: str,
    output_file: str,
    max_workers: int = 6,
    model: str = "gpt-4.1-mini",
    max_requests_per_minute: int = 450,  # Slightly below 500 for safety
) -> List[Dict[str, Any]]:
    """
    Filter chunks from a JSON file to keep only relevant Bullet Echo game content

    Args:
        input_file: Path to input JSON file with all chunks
        output_file: Path to save filtered chunks
        max_workers: Maximum number of parallel workers
        model: Model to use for classification
        max_requests_per_minute: Maximum API requests per minute

    Returns:
        List of filtered chunk dictionaries
    """
    logger.info(f"Loading chunks from {input_file}")

    try:
        with open(input_file, "r", encoding="utf-8") as f:
            all_chunks = json.load(f)

        logger.info(f"Loaded {len(all_chunks)} chunks for filtering")

        # Create OpenAI client to reuse
        client = create_openai_client()

        # Create simple rate limiter
        rate_limiter = SimpleRateLimiter(
            max_calls=max_requests_per_minute, per_seconds=60
        )
        logger.info(f"Rate limiting to {max_requests_per_minute} requests per minute")

        # Function to determine if each chunk is relevant
        def process_chunk(chunk):
            is_relevant = is_chunk_relevant(chunk, client, model, rate_limiter)
            if is_relevant:
                return chunk
            return None

        # Adjust worker count based on rate limit
        # Using fewer workers makes rate limiting more effective
        suggested_workers = min(max_workers, max(1, max_requests_per_minute // 60))
        logger.info(
            f"Filtering chunks with {suggested_workers} workers (adjusted for rate limit)"
        )

        with ThreadPoolExecutor(max_workers=suggested_workers) as executor:
            filtered_chunks = list(executor.map(process_chunk, all_chunks))

        # Remove None values (filtered out chunks)
        filtered_chunks = [chunk for chunk in filtered_chunks if chunk is not None]

        logger.info(
            f"Kept {len(filtered_chunks)} chunks out of {len(all_chunks)} total"
        )

        # Save filtered chunks
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(filtered_chunks, f)

        logger.info(f"Saved filtered chunks to {output_file}")

        return filtered_chunks

    except Exception as e:
        logger.error(f"Error filtering chunks: {e}")
        raise


if __name__ == "__main__":
    # Filter chunks from the all_chunks.json file
    input_file = "src/data/all_chunks.json"
    output_file = "src/data/filtered_chunks.json"

    filtered_chunks = filter_chunks(
        input_file=input_file,
        output_file=output_file,
        max_workers=6,
        model="gpt-4.1-mini",
        max_requests_per_minute=450,  # Setting slightly below 500 for safety
    )

    logger.info(f"Filtered dataset contains {len(filtered_chunks)} chunks")
