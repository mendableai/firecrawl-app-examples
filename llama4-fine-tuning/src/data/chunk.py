import json
import uuid
import logging
from typing import List, Dict, Any, Optional, Callable
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
    chunk_size: int = 512, chunk_overlap: int = 128
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
    
    Don't make up facts or hallucinate. Your job is
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
    chunks: List[str], processing_function: Callable[[str], str], max_workers: int = 6
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


def add_metadata_to_chunks(
    chunks: List[str], source_file: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Add metadata (like unique IDs) to each chunk

    Args:
        chunks: List of text chunks
        source_file: Optional source file path to include in metadata

    Returns:
        List of dictionaries containing chunks with metadata
    """
    logger.info(f"Adding metadata to {len(chunks)} chunks")
    result = []

    for chunk in chunks:
        chunk_dict = {"content": chunk, "chunk_id": str(uuid.uuid4())}
        if source_file:
            chunk_dict["source_file"] = source_file
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

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(chunks, f)

        logger.info(f"Saved {len(chunks)} chunks to {output_file}")
    except Exception as e:
        logger.error(f"Error saving chunks to {output_file}: {e}")
        raise


def process_directory(
    directory_path: str,
    output_file: str,
    chunk_size: int = 512,
    chunk_overlap: int = 128,
    improve_coherence: bool = True,
    max_workers: int = 6,
    model: str = "gpt-4o-mini",
    file_extension: str = ".md",
) -> List[Dict[str, Any]]:
    """
    Process all markdown files in a directory, chunk them, and save all chunks to a single JSON file

    Args:
        directory_path: Path to the directory containing markdown files
        output_file: Path to save the combined output JSON file
        chunk_size: Size of each chunk
        chunk_overlap: Overlap between chunks
        improve_coherence: Whether to improve chunk coherence using OpenAI
        max_workers: Maximum number of parallel workers for processing
        model: Model to use for improving coherence
        file_extension: File extension to filter (default: .md for markdown)

    Returns:
        List of all processed chunk dictionaries from all files
    """
    directory = Path(directory_path)
    if not directory.exists() or not directory.is_dir():
        logger.error(f"Directory {directory_path} does not exist or is not a directory")
        raise ValueError(f"Invalid directory path: {directory_path}")

    logger.info(f"Processing all {file_extension} files in {directory_path}")

    # Get all markdown files in the directory
    markdown_files = [f for f in directory.glob(f"**/*{file_extension}")]
    logger.info(f"Found {len(markdown_files)} {file_extension} files")

    if not markdown_files:
        logger.warning(f"No {file_extension} files found in {directory_path}")
        return []

    # Create OpenAI client to reuse across files
    client = create_openai_client() if improve_coherence else None

    # Process each file and collect all chunks
    all_chunks = []

    for file_path in markdown_files:
        logger.info(f"Processing file: {file_path}")
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()

            # Add file information to the processing context
            file_relative_path = file_path.relative_to(directory).as_posix()

            # Split text into chunks
            splitter = create_text_splitter(chunk_size, chunk_overlap)
            chunks = split_text(text, splitter)

            # Improve coherence if requested
            if improve_coherence and client:
                processing_fn = lambda chunk: improve_chunk_coherence(
                    chunk, client, model
                )
                chunks = process_chunks_in_parallel(chunks, processing_fn, max_workers)

            # Add metadata to chunks, including file source information
            chunks_with_metadata = add_metadata_to_chunks(chunks, file_relative_path)

            all_chunks.extend(chunks_with_metadata)
            logger.info(
                f"Added {len(chunks_with_metadata)} chunks from {file_relative_path}"
            )

        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")
            # Continue with next file instead of failing completely

    # Save all chunks to a single JSON file
    if all_chunks:
        save_chunks_to_json(all_chunks, output_file)

    return all_chunks


if __name__ == "__main__":
    # Process the bullet-echo-wiki directory
    directory_path = "src/data/bullet-echo-wiki"
    output_file = "src/data/all_chunks.json"

    chunks = process_directory(
        directory_path=directory_path,
        output_file=output_file,
        chunk_size=512,
        chunk_overlap=128,
        improve_coherence=True,
        max_workers=6,
        model="gpt-4o-mini",
    )

    logger.info(
        f"Processed {len(chunks)} total chunks from markdown files in {directory_path}"
    )
