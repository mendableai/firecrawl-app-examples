import json
import uuid
import logging
import time
import threading
import os
from typing import List, Dict, Any, Optional
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

from pydantic import BaseModel
from openai import OpenAI

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


PROMPT = """
    You are an expert at generating question-answer pairs from a given text. For each given text, you must generate 3 QA pairs. 
    
    Your generated questions-answer pairs will be fed into an LLM to train it on how to answer questions about the Bullet Echo mobile game. 

    In each question-answer pair, you must try to teach as much about the Bullet Echo mobile game as possible to the LLM. Generate the pairs in a way that you would want be taught this new mobile game.
    
    - Your questions must not contain references to the text itself. 
    - Your questions must be about the Bullet Echo mobile game.
    - Your questions must be about the game's mechanics, features, and gameplay.
    - Your questions must be about the game's story, characters, and world.
    - Your questions must be about the game's settings and options.
    - Your questions must be about the game's secrets and Easter eggs.
    - Do not make up facts about the game, only use information from the text.
    
    Here is the text:
    
    {text}
"""


# Define Pydantic models for parsing the response
class Pair(BaseModel):
    question: str
    answer: str


class QAPairs(BaseModel):
    pairs: List[Pair]


def generate_qa(
    text: str, model: str = "gpt-4o", rate_limiter: Optional[SimpleRateLimiter] = None
) -> QAPairs:
    """
    Generate QA pairs from a text chunk using OpenAI's API with retry for rate limits

    Args:
        text: The text content to generate QA pairs from
        model: The OpenAI model to use
        rate_limiter: Optional rate limiter to control API request rate

    Returns:
        Parsed QAPairs object with pairs of questions and answers
    """
    client = OpenAI()

    # Apply rate limiting if provided
    if rate_limiter:
        rate_limiter.wait()

    try:
        response = client.beta.chat.completions.parse(
            model=model,
            messages=[
                {"role": "system", "content": PROMPT},
                {"role": "user", "content": text},
            ],
            response_format=QAPairs,
        )

        return response.choices[0].message.parsed
    except Exception as e:
        # Check if it's a rate limit error (429)
        if hasattr(e, "status_code") and e.status_code == 429:
            # Handle rate limit error
            logger.warning(f"Rate limit (429) hit, waiting longer before retry...")
            time.sleep(10)  # Wait 10 seconds before retry
            try:
                # Try again
                return generate_qa(text, model, rate_limiter)
            except Exception as retry_err:
                logger.error(f"Error retrying QA generation: {retry_err}")
                return QAPairs(pairs=[])
        else:
            logger.error(f"Error generating QA pairs: {e}")
            # Return an empty QAPairs object for other errors
            return QAPairs(pairs=[])


def load_chunks(chunks_file: str) -> List[Dict[str, Any]]:
    """
    Load chunks from a JSON file

    Args:
        chunks_file: Path to the JSON file containing chunks

    Returns:
        List of chunks
    """
    logger.info(f"Loading chunks from {chunks_file}")
    with open(chunks_file, "r") as f:
        chunks = json.load(f)

    logger.info(f"Loaded {len(chunks)} chunks")
    return chunks


def generate_qa_pairs_from_chunks(
    chunks: List[Dict[str, Any]],
    model: str = "gpt-4o",
    max_workers: int = 3,
    max_requests_per_minute: int = 450,
    save_interval: int = 10,
    output_file: str = "qa_dataset.json",
) -> List[Pair]:
    """
    Generate QA pairs from chunks in parallel

    Args:
        chunks: List of chunks with "content" key
        model: The OpenAI model to use
        max_workers: Maximum number of parallel workers
        max_requests_per_minute: Maximum API requests per minute
        save_interval: How often to save progress (number of chunks)
        output_file: Path to save intermediate results

    Returns:
        List of Pair objects
    """
    # Create rate limiter
    rate_limiter = SimpleRateLimiter(max_calls=max_requests_per_minute, per_seconds=60)
    logger.info(f"Rate limiting to {max_requests_per_minute} requests per minute")

    # Adjust worker count based on rate limit
    suggested_workers = min(max_workers, max(1, max_requests_per_minute // 60))
    logger.info(
        f"Generating QA pairs with {suggested_workers} workers (adjusted for rate limit)"
    )

    all_qa_pairs = []

    # Check if we have progress to resume from
    temp_output_file = output_file.replace(".json", "_temp.json")
    if os.path.exists(temp_output_file):
        try:
            with open(temp_output_file, "r") as f:
                existing_data = json.load(f)
                # Extract completed chunk IDs to skip them
                completed_chunk_ids = {
                    item.get("source_chunk_id")
                    for item in existing_data
                    if item.get("source_chunk_id")
                }
                logger.info(
                    f"Found existing progress with {len(completed_chunk_ids)} processed chunks"
                )

                # Add existing QA pairs to our results
                all_qa_pairs = [
                    Pair(question=item["question"], answer=item["answer"])
                    for item in existing_data
                ]
        except Exception as e:
            logger.warning(f"Could not load previous progress: {e}")
            completed_chunk_ids = set()
    else:
        completed_chunk_ids = set()

    # Filter out already processed chunks
    remaining_chunks = [
        chunk for chunk in chunks if chunk.get("chunk_id") not in completed_chunk_ids
    ]
    logger.info(
        f"Processing {len(remaining_chunks)} remaining chunks out of {len(chunks)} total"
    )

    # Process chunks in batches for periodic saving
    batch_size = save_interval
    processed_count = 0

    for i in range(0, len(remaining_chunks), batch_size):
        batch = remaining_chunks[i : i + batch_size]
        logger.info(
            f"Processing batch of {len(batch)} chunks ({processed_count + 1}-{processed_count + len(batch)} of {len(remaining_chunks)})"
        )

        batch_qa_pairs = []
        with ThreadPoolExecutor(max_workers=suggested_workers) as executor:
            # Create a list of tasks
            tasks = []
            for chunk in batch:
                tasks.append((chunk["content"], chunk.get("chunk_id", "unknown")))

            # Map function to process each chunk with its ID
            def process_chunk(task):
                content, chunk_id = task
                result = generate_qa(content, model, rate_limiter)
                # Add source chunk ID to each pair for tracking
                for pair in result.pairs:
                    pair_dict = pair.dict()
                    pair_dict["source_chunk_id"] = chunk_id
                    batch_qa_pairs.append(pair_dict)
                return result.pairs

            # Execute tasks
            list(executor.map(process_chunk, tasks))

        # Add the new pairs to our results
        for pair_dict in batch_qa_pairs:
            all_qa_pairs.append(
                Pair(question=pair_dict["question"], answer=pair_dict["answer"])
            )

        # Save intermediate progress
        processed_count += len(batch)
        save_intermediate_results(batch_qa_pairs, temp_output_file, append=bool(i > 0))
        logger.info(
            f"Saved intermediate progress ({processed_count}/{len(remaining_chunks)} chunks processed)"
        )

    # Delete temporary file when done
    if os.path.exists(temp_output_file):
        try:
            os.remove(temp_output_file)
            logger.info(f"Removed temporary progress file")
        except Exception as e:
            logger.warning(f"Could not remove temporary file: {e}")

    logger.info(f"Generated {len(all_qa_pairs)} QA pairs total")
    return all_qa_pairs


def save_intermediate_results(
    qa_pairs_dicts: List[Dict], output_file: str, append: bool = False
) -> None:
    """
    Save intermediate results to a temporary file

    Args:
        qa_pairs_dicts: List of QA pair dictionaries with source_chunk_id
        output_file: Path to save the output
        append: Whether to append to existing file or overwrite
    """
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Format pairs with IDs
    formatted_pairs = []
    for pair in qa_pairs_dicts:
        formatted_pairs.append(
            {
                "id": str(uuid.uuid4()),
                "question": pair["question"],
                "answer": pair["answer"],
                "source_chunk_id": pair.get("source_chunk_id", "unknown"),
            }
        )

    # If appending, load existing data first
    if append and os.path.exists(output_file):
        try:
            with open(output_file, "r") as f:
                existing_data = json.load(f)
            formatted_pairs = existing_data + formatted_pairs
        except Exception as e:
            logger.warning(f"Could not load existing data for append: {e}")

    # Save to file
    with open(output_path, "w") as f:
        json.dump(formatted_pairs, f, indent=2)


def format_qa_pairs(qa_pairs: List[Pair]) -> List[Dict[str, Any]]:
    """
    Format QA pairs with unique IDs

    Args:
        qa_pairs: List of Pair objects

    Returns:
        List of dictionaries with id, question, and answer
    """
    logger.info("Formatting QA dataset with unique IDs")
    qa_dataset = []

    for pair in qa_pairs:
        qa_dataset.append(
            {
                "id": str(uuid.uuid4()),
                "question": pair.question,
                "answer": pair.answer,
            }
        )

    return qa_dataset


def save_qa_dataset(qa_dataset: List[Dict[str, Any]], output_file: str) -> None:
    """
    Save the QA dataset to a JSON file

    Args:
        qa_dataset: List of QA pair dictionaries
        output_file: Path to save the output QA dataset
    """
    logger.info(f"Saving QA dataset to {output_file}")
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(qa_dataset, f, indent=2)

    logger.info(f"Successfully saved {len(qa_dataset)} QA pairs to {output_file}")


def process_chunks(
    chunks_file: str,
    output_file: str = "qa_dataset.json",
    model: str = "gpt-4o",
    max_workers: int = 3,
    max_requests_per_minute: int = 450,
    save_interval: int = 10,
) -> None:
    """
    Process chunks from a file and generate QA pairs

    Args:
        chunks_file: Path to the JSON file containing chunks
        output_file: Path to save the output QA dataset
        model: The OpenAI model to use
        max_workers: Maximum number of parallel workers
        max_requests_per_minute: Maximum API requests per minute
        save_interval: How often to save progress (number of chunks)
    """
    try:
        # Step 1: Load chunks from file
        chunks = load_chunks(chunks_file)

        # Step 2: Generate QA pairs with periodic saving
        qa_pairs = generate_qa_pairs_from_chunks(
            chunks=chunks,
            model=model,
            max_workers=max_workers,
            max_requests_per_minute=max_requests_per_minute,
            save_interval=save_interval,
            output_file=output_file,
        )

        # Step 3: Format QA pairs with unique IDs
        qa_dataset = format_qa_pairs(qa_pairs)

        # Step 4: Save the dataset to a JSON file
        save_qa_dataset(qa_dataset, output_file)

    except Exception as e:
        logger.error(f"Error processing chunks: {e}")
        raise


if __name__ == "__main__":
    # Example usage
    chunks_file = "data/processed/filtered_chunks.json"
    output_file = "data/output/qa_dataset.json"

    process_chunks(
        chunks_file=chunks_file,
        output_file=output_file,
        model="gpt-4.1",
        max_workers=3,
        max_requests_per_minute=300,
        save_interval=10,  # Save progress every 10 chunks
    )
