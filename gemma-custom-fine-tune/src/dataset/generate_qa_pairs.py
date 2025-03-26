import json
import uuid
import logging
from typing import List, Dict, Any
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from tenacity import retry, stop_after_attempt, wait_exponential

from pydantic import BaseModel
from openai import OpenAI

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

PROMPT = """
    You are an expert at generating question-answer pairs from a given text. For each given text, you must generate 5 QA pairs. 
    
    Your generated questions-answer pairs will be fed into an LLM to train it on how to use the new OpenAI Agents SDK Python library. 

    In each question-answer pair, you must try to teach as much about the Agents SDK as possible to the LLM. Generate the pairs in a way that you would want be taught this new Agents SDK Python library.
    
    Additional instructions:
    - Your questions must not contain references to the text itself. 
    - Keep the difficulty of questions to hard. 
    - If the text contains code blocks, you must generate pairs that contain coding question-answers as we want the LLM to learn how to use the Agents SDK in Python.
    - Don't generate pairs about the specific variables, functions or classes in code examples in the given text. Instead, generate coding snippets that are generic and aid the LLM's understanding of the Agents SDK's Python syntax.
    - Wrap the code snippets in triple backticks with the programming language.
    
    Here is the text:
    
    {text}
"""


# Define Pydantic models for parsing the response
class Pair(BaseModel):
    question: str
    answer: str


class QAPairs(BaseModel):
    pairs: List[Pair]


# Simple retry decorator for rate limits (429 errors)
@retry(
    wait=wait_exponential(multiplier=1, min=4, max=60),
    stop=stop_after_attempt(5),
    reraise=True,
    before_sleep=lambda retry_state: logger.warning(
        f"Rate limit exceeded (429), retrying in {retry_state.next_action.sleep} seconds..."
    ),
)
def generate_qa(text: str, model: str = "gpt-4o") -> QAPairs:
    """
    Generate QA pairs from a text chunk using OpenAI's API with retry for rate limits

    Args:
        text: The text content to generate QA pairs from
        model: The OpenAI model to use

    Returns:
        Parsed QAPairs object with pairs of questions and answers
    """
    client = OpenAI()

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
            # Let the retry decorator handle this
            logger.warning("Rate limit (429) hit, retrying with backoff...")
            raise
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
    chunks: List[Dict[str, Any]], model: str = "gpt-4o", max_workers: int = 3
) -> List[Pair]:
    """
    Generate QA pairs from chunks in parallel

    Args:
        chunks: List of chunks with "content" key
        model: The OpenAI model to use
        max_workers: Maximum number of parallel workers

    Returns:
        List of Pair objects
    """
    logger.info(f"Generating QA pairs with {max_workers} workers")
    qa_pairs = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        chunk_contents = [chunk["content"] for chunk in chunks]
        # Use a lambda here so we can pass parameters to generate_qa
        results = list(executor.map(lambda x: generate_qa(x, model), chunk_contents))

        # Flatten the results
        for result in results:
            qa_pairs.extend(result.pairs)

    logger.info(f"Generated {len(qa_pairs)} QA pairs")
    return qa_pairs


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
) -> None:
    """
    Process chunks from a file and generate QA pairs

    Args:
        chunks_file: Path to the JSON file containing chunks
        output_file: Path to save the output QA dataset
        model: The OpenAI model to use
        max_workers: Maximum number of parallel workers
    """
    try:
        # Step 1: Load chunks from file
        chunks = load_chunks(chunks_file)

        # Step 2: Generate QA pairs
        qa_pairs = generate_qa_pairs_from_chunks(
            chunks=chunks, model=model, max_workers=max_workers
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
    chunks_file = "chunks.json"
    output_file = "qa_dataset.json"

    process_chunks(
        chunks_file=chunks_file,
        output_file=output_file,
        model="gpt-4o",
        max_workers=5,  # Reduced from 8 to 3 to prevent rate limits
    )
