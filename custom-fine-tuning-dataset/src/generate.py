import json
from pathlib import Path
import asyncio
from typing import List, Dict
import logging
import time
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv
from asyncio import Semaphore
from system_prompt import SYSTEM_PROMPT

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Rate limiting settings
MAX_REQUESTS_PER_MINUTE = 300  # Keep slightly under 500 RPM limit
MAX_TOKENS_PER_MINUTE = 150_000  # Keep under 200k TPM limit
CONCURRENT_REQUESTS = 15  # Adjust based on performance


async def generate_pairs_for_chunk(
    chunk: Dict, chat: ChatOpenAI, semaphore: Semaphore, token_counter: Dict[str, int]
) -> List[Dict]:
    """Generate instruction-answer pairs with rate limiting."""
    try:
        async with semaphore:
            # Estimate tokens in request
            estimated_tokens = len(chunk["content"]) // 4 + 500  # Rough estimate

            # Check token limit
            current_minute = int(time.time() // 60)
            if current_minute not in token_counter:
                token_counter.clear()
                token_counter[current_minute] = 0

            if token_counter[current_minute] + estimated_tokens > MAX_TOKENS_PER_MINUTE:
                logger.info("Token limit approaching, waiting for next minute...")
                await asyncio.sleep(60 - time.time() % 60)
                token_counter.clear()

            token_counter[current_minute] = (
                token_counter.get(current_minute, 0) + estimated_tokens
            )

            # Process chunk
            logger.info(f"Processing chunk from: {chunk['metadata']['url']}")
            start_time = time.time()

            messages = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(
                    content=f"Generate instruction-answer pairs from this documentation:\n\n{chunk['content']}"
                ),
            ]

            response = await chat.ainvoke(messages)

            # Parse response into pairs with proper code block handling
            pairs = []
            current_pair = {}
            in_code_block = False
            code_content = []

            for line in response.content.split("\n"):
                # Handle code blocks
                if line.strip().startswith("```"):
                    if in_code_block:
                        # End of code block - add it to current answer
                        in_code_block = False
                        code_text = "\n".join(code_content)
                        if current_pair and "answer" in current_pair:
                            current_pair["answer"] += f"\n```{code_text}```\n"
                        code_content = []
                    else:
                        # Start of code block
                        in_code_block = True
                        # Preserve language identifier if present
                        code_content = (
                            [line.strip()[3:]] if len(line.strip()) > 3 else []
                        )
                    continue

                if in_code_block:
                    # Collect code content
                    code_content.append(line)
                    continue

                line = line.strip()
                if not line:
                    continue

                if line.startswith("Q: "):
                    if current_pair:
                        pairs.append(current_pair)
                    current_pair = {"instruction": line[3:], "answer": ""}
                elif line.startswith("A: ") and current_pair:
                    current_pair["answer"] = line[3:]
                elif current_pair and "answer" in current_pair:
                    # Append to existing answer
                    current_pair["answer"] += f"\n{line}"

            # Add the last pair if exists
            if current_pair:
                pairs.append(current_pair)

            # Log the pairs to verify code blocks are preserved
            for i, pair in enumerate(pairs, 1):
                logger.info(f"Pair {i}:")
                logger.info(f"Q: {pair['instruction']}")
                logger.info(
                    f"A: {pair['answer'][:500]}..."
                )  # Show more of the answer for debugging

            return pairs

    except Exception as e:
        logger.error(f"Error processing chunk {chunk['id']}: {str(e)}")
        return []


async def generate_dataset(
    input_file: Path, output_file: Path, chunk_limit: int = None
):
    """Generate dataset with parallel processing and rate limiting."""
    try:
        start_time = time.time()

        # Load chunks
        with open(input_file, "r") as f:
            data = json.load(f)
        chunks = data["data"][:chunk_limit] if chunk_limit else data["data"]

        logger.info(f"Processing {len(chunks)} chunks with rate limiting:")
        logger.info(f"- Max requests per minute: {MAX_REQUESTS_PER_MINUTE}")
        logger.info(f"- Max tokens per minute: {MAX_TOKENS_PER_MINUTE}")
        logger.info(f"- Concurrent requests: {CONCURRENT_REQUESTS}")

        # Initialize chat model
        chat = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)

        # Initialize rate limiting
        semaphore = Semaphore(CONCURRENT_REQUESTS)
        token_counter = {}

        # Process chunks in parallel with rate limiting
        tasks = []
        for chunk in chunks:
            task = generate_pairs_for_chunk(chunk, chat, semaphore, token_counter)
            tasks.append(task)

            # Add small delay between task creation to spread load
            await asyncio.sleep(0.1)

        # Gather results
        all_results = await asyncio.gather(*tasks)
        all_pairs = [pair for result in all_results for pair in result]

        # Save results
        output_data = {
            "train": all_pairs,
            "metadata": {
                "total_chunks_processed": len(chunks),
                "total_pairs_generated": len(all_pairs),
                "processing_time": time.time() - start_time,
            },
        }

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)

        logger.info(f"Processing completed in {time.time() - start_time:.2f}s")
        logger.info(f"Generated {len(all_pairs)} pairs from {len(chunks)} chunks")

    except Exception as e:
        logger.error(f"Error generating dataset: {str(e)}")
        raise


if __name__ == "__main__":
    input_file = Path("data/firecrawl_chunked_dataset.json")
    output_file = Path("data/firecrawl_instructions.json")
    asyncio.run(generate_dataset(input_file, output_file))
