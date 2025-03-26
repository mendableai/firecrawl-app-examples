import json
import uuid
import logging
from typing import List, Dict, Any, Optional, Callable, Union
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import OpenAI

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def create_text_splitter(
    chunk_size: int = 1024, chunk_overlap: int = 256
) -> RecursiveCharacterTextSplitter:
    """
    Create a text splitter with the specified parameters

    Args:
        chunk_size: Maximum size of each chunk
        chunk_overlap: Overlap between chunks

    Returns:
        Configured text splitter
    """
    logger.info(
        f"Creating text splitter with chunk_size={chunk_size}, chunk_overlap={chunk_overlap}"
    )
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )


def split_text(
    text: str,
    splitter: Optional[RecursiveCharacterTextSplitter] = None,
    chunk_size: int = 1024,
    chunk_overlap: int = 256,
) -> List[str]:
    """
    Split text into chunks

    Args:
        text: Text to split
        splitter: Optional pre-configured text splitter
        chunk_size: Size of each chunk if splitter not provided
        chunk_overlap: Overlap between chunks if splitter not provided

    Returns:
        List of text chunks
    """
    if splitter is None:
        splitter = create_text_splitter(chunk_size, chunk_overlap)

    logger.info(f"Splitting text into chunks (length={len(text)})")
    splits = splitter.split_text(text)
    logger.info(f"Created {len(splits)} chunks")
    return splits


def create_openai_client() -> OpenAI:
    """
    Create an OpenAI client instance

    Returns:
        Configured OpenAI client
    """
    logger.info("Creating OpenAI client")
    return OpenAI()


def improve_chunk_coherence(
    text: str, client: Optional[OpenAI] = None, model: str = "gpt-4o-mini"
) -> str:
    """
    Improve the coherence of a text chunk using OpenAI

    Args:
        text: Text chunk to improve
        client: Optional pre-configured OpenAI client
        model: Model to use for text improvement

    Returns:
        Improved text chunk
    """
    if client is None:
        client = create_openai_client()

    prompt = f"""
    You are a helpful assistant that improves the coherence of text.
    Please improve the coherence of the following text:
    {text}
    
    If the text contains code blocks, don't change the code. Wrap it in triple backticks
    along with the programming language. Don't make up facts or hallucinate. Your job is
    to make the text more coherent and easier to understand, only. 
    
    If the text contains URLs or hyperlinks, remove them while preserving their text. For example:
    [This is a link](https://www.example.com) -> This is a link
    
    Only return the improved text, no other text or commentary.
    """

    try:
        response = client.responses.create(
            model=model,
            input=prompt,
        )
        return response.output_text
    except Exception as e:
        logger.error(f"Error improving chunk coherence: {e}")
        # Return original text if improvement fails
        return text


def process_chunks_in_parallel(
    chunks: List[str], processing_function: Callable[[str], str], max_workers: int = 8
) -> List[str]:
    """
    Process chunks in parallel using a thread pool

    Args:
        chunks: List of text chunks to process
        processing_function: Function to apply to each chunk
        max_workers: Maximum number of parallel workers

    Returns:
        List of processed chunks
    """
    logger.info(
        f"Processing {len(chunks)} chunks in parallel with {max_workers} workers"
    )
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        processed_chunks = list(executor.map(processing_function, chunks))

    logger.info(f"Finished processing {len(processed_chunks)} chunks")
    return processed_chunks


def add_metadata_to_chunks(chunks: List[str]) -> List[Dict[str, Any]]:
    """
    Add metadata (like unique IDs) to each chunk

    Args:
        chunks: List of text chunks

    Returns:
        List of dictionaries containing chunks with metadata
    """
    logger.info(f"Adding metadata to {len(chunks)} chunks")
    result = []

    for chunk in chunks:
        chunk_dict = {"content": chunk, "chunk_id": str(uuid.uuid4())}
        result.append(chunk_dict)

    return result


def save_chunks_to_json(chunks: List[Dict[str, Any]], output_file: str) -> None:
    """
    Save chunks to a JSON file

    Args:
        chunks: List of chunk dictionaries
        output_file: Path to save the JSON file
    """
    try:
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w") as f:
            json.dump(chunks, f)

        logger.info(f"Saved {len(chunks)} chunks to {output_file}")
    except Exception as e:
        logger.error(f"Error saving chunks to {output_file}: {e}")
        raise


def process_text(
    text: str,
    output_file: Optional[str] = None,
    chunk_size: int = 1024,
    chunk_overlap: int = 256,
    improve_coherence: bool = True,
    max_workers: int = 8,
    model: str = "gpt-4o-mini",
    save_to_file: bool = False,
) -> List[Dict[str, Any]]:
    """
    Process text by splitting it into chunks, optionally improving coherence,
    adding metadata, and optionally saving to a JSON file

    This is the main entry point for processing text directly from scrape.py

    Args:
        text: Text to process
        output_file: Path to save the output JSON file (only used if save_to_file is True)
        chunk_size: Size of each chunk
        chunk_overlap: Overlap between chunks
        improve_coherence: Whether to improve chunk coherence using OpenAI
        max_workers: Maximum number of parallel workers for processing
        model: Model to use for improving coherence
        save_to_file: Whether to save the chunks to a file

    Returns:
        List of processed chunk dictionaries
    """
    # Split text into chunks
    splitter = create_text_splitter(chunk_size, chunk_overlap)
    chunks = split_text(text, splitter)

    # Improve coherence if requested
    if improve_coherence:
        client = create_openai_client()
        processing_fn = lambda chunk: improve_chunk_coherence(chunk, client, model)
        chunks = process_chunks_in_parallel(chunks, processing_fn, max_workers)

    # Add metadata to chunks
    chunks_with_metadata = add_metadata_to_chunks(chunks)

    # Save to JSON file if requested
    if save_to_file and output_file:
        save_chunks_to_json(chunks_with_metadata, output_file)

    return chunks_with_metadata


def process_file(
    input_file: str,
    output_file: Optional[str] = None,
    chunk_size: int = 1024,
    chunk_overlap: int = 256,
    improve_coherence: bool = True,
    max_workers: int = 8,
    model: str = "gpt-4o-mini",
    save_to_file: bool = False,
) -> List[Dict[str, Any]]:
    """
    Process a text file by reading it, splitting into chunks, improving coherence,
    adding metadata, and optionally saving to a JSON file

    Args:
        input_file: Path to input text file
        output_file: Path to save the output JSON file (only used if save_to_file is True)
        chunk_size: Size of each chunk
        chunk_overlap: Overlap between chunks
        improve_coherence: Whether to improve chunk coherence using OpenAI
        max_workers: Maximum number of parallel workers for processing
        model: Model to use for improving coherence
        save_to_file: Whether to save the chunks to a file

    Returns:
        List of processed chunk dictionaries
    """
    try:
        logger.info(f"Reading text from {input_file}")
        with open(input_file, "r") as f:
            text = f.read()

        return process_text(
            text=text,
            output_file=output_file,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            improve_coherence=improve_coherence,
            max_workers=max_workers,
            model=model,
            save_to_file=save_to_file,
        )
    except Exception as e:
        logger.error(f"Error processing file {input_file}: {e}")
        raise


def process_scrape_result(
    scrape_result: Union[str, Dict[str, Any]],
    output_file: Optional[str] = None,
    chunk_size: int = 1024,
    chunk_overlap: int = 256,
    improve_coherence: bool = True,
    max_workers: int = 8,
    model: str = "gpt-4o-mini",
    save_to_file: bool = False,
) -> List[Dict[str, Any]]:
    """
    Process text from a scrape_website result, which could be either the text directly
    or the status dictionary containing the text

    This function is designed to work directly with the output of scrape.py's scrape_website function

    Args:
        scrape_result: Either the text string or the status dictionary from scrape_website
        output_file: Path to save the output JSON file (only used if save_to_file is True)
        chunk_size: Size of each chunk
        chunk_overlap: Overlap between chunks
        improve_coherence: Whether to improve chunk coherence using OpenAI
        max_workers: Maximum number of parallel workers for processing
        model: Model to use for improving coherence
        save_to_file: Whether to save the chunks to a file

    Returns:
        List of processed chunk dictionaries
    """
    # Extract text from scrape result
    if isinstance(scrape_result, str):
        text = scrape_result
    elif (
        isinstance(scrape_result, dict)
        and "data" in scrape_result
        and "llmsfulltxt" in scrape_result["data"]
    ):
        text = scrape_result["data"]["llmsfulltxt"]
    else:
        logger.error("Invalid scrape result format")
        raise ValueError(
            "Scrape result must be either a text string or a dictionary with data.llmsfulltxt"
        )

    return process_text(
        text=text,
        output_file=output_file,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        improve_coherence=improve_coherence,
        max_workers=max_workers,
        model=model,
        save_to_file=save_to_file,
    )


if __name__ == "__main__":
    from scrape import scrape_website

    # Scrape the website
    url = "https://openai.github.io/openai-agents-python/"
    text = scrape_website(url)

    # Process the text
    output_file = "chunks.json"
    chunks = process_scrape_result(text, output_file, save_to_file=True)
