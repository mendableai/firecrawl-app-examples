import os
import datetime
import json
import base64
from typing import Optional, Dict, Any, List
from zoneinfo import ZoneInfo
from io import BytesIO

from google.adk.agents import Agent
from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.genai import types
from google import genai
from google.adk.tools.tool_context import ToolContext
from google.adk.tools.base_tool import BaseTool

# Third-party imports for tools
from firecrawl import FirecrawlApp

# Constants for model names
MODEL_GEMINI_2_0_FLASH = "gemini-2.0-flash"
GEMINI_IMAGE_GEN_MODEL = "gemini-2.0-flash-exp-image-generation"

# -------------------- TOOLS --------------------


def web_search(query: str) -> Dict:
    """Searches the web for current information using Firecrawl.

    Args:
        query (str): The search query to look up recent information.

    Returns:
        Dict: A dictionary containing the search results.
              Includes a 'status' key ('success' or 'error').
              If 'success', includes a 'results' list with search results.
              If 'error', includes an 'error_message' key.
    """
    print(f"--- Tool: web_search called for query: {query} ---")

    try:
        app = FirecrawlApp()
        result = app.search(query, limit=10)

        if result.success:
            formatted_results = []
            for item in result.data:
                formatted_results.append(
                    {
                        "title": item.get("title", "No title"),
                        "url": item.get("url", "No URL"),
                        "description": item.get("description", "No description"),
                    }
                )

            return {"status": "success", "results": formatted_results}
        else:
            return {
                "status": "error",
                "error_message": f"Search failed: {result.error or 'Unknown error'}",
            }

    except Exception as e:
        return {
            "status": "error",
            "error_message": f"Error during web search: {str(e)}",
        }


def scrape_webpage(url: str, extract_format: str = "markdown") -> Dict:
    """Scrapes content from a webpage in various formats using Firecrawl.

    Args:
        url (str): The URL of the webpage to scrape.
        extract_format (str, optional): Format to extract ('markdown', 'html', or 'links'). Defaults to "markdown".

    Returns:
        Dict: A dictionary containing the scraped content.
              Includes a 'status' key ('success' or 'error').
              If 'success', includes relevant content in the specified format.
              If 'error', includes an 'error_message' key.
    """
    print(
        f"--- Tool: scrape_webpage called for URL: {url}, format: {extract_format} ---"
    )

    valid_formats = ["markdown", "html", "links"]
    formats = [extract_format] if extract_format in valid_formats else ["markdown"]

    try:
        app = FirecrawlApp()
        result = app.scrape_url(url, formats=formats)

        content_key = extract_format
        if extract_format == "markdown" and hasattr(result, "markdown"):
            content = result.markdown
        elif extract_format == "html" and hasattr(result, "html"):
            content = result.html
        elif extract_format == "links" and hasattr(result, "links"):
            content = result.links
        else:
            content = f"Content not available in '{extract_format}' format"

        return {
            "status": "success",
            "url": url,
            "format": extract_format,
            "content": content,
            "metadata": getattr(result, "metadata", {}),
        }
    except Exception as e:
        return {"status": "error", "error_message": f"Error scraping webpage: {str(e)}"}


def extract_structured_data(url: str, extraction_prompt: str) -> Dict:
    """Extracts structured data from a webpage using Firecrawl with a specific prompt.

    Args:
        url (str): The URL of the webpage to extract data from.
        extraction_prompt (str): Instructions for what data to extract and how to structure it.

    Returns:
        Dict: A dictionary containing the extracted structured data.
              Includes a 'status' key ('success' or 'error').
              If 'success', includes a 'data' key with the structured result.
              If 'error', includes an 'error_message' key.
    """
    print(f"--- Tool: extract_structured_data called for URL: {url} ---")
    print(f"--- Extraction prompt: {extraction_prompt} ---")

    try:
        app = FirecrawlApp()
        result = app.extract([url], prompt=extraction_prompt)

        if hasattr(result, "data") and result.data:
            return {"status": "success", "url": url, "data": result.data}
        else:
            return {
                "status": "error",
                "error_message": "No structured data could be extracted",
            }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"Error extracting structured data: {str(e)}",
        }


def deep_research(
    topic: str, max_depth: int = 5, time_limit: int = 180, max_urls: int = 15
) -> Dict:
    """Performs comprehensive research on a topic, analyzing multiple sources and providing a detailed report.

    Args:
        topic (str): The research topic or question.
        max_depth (int, optional): Maximum research depth. Defaults to 5.
        time_limit (int, optional): Time limit in seconds. Defaults to 180.
        max_urls (int, optional): Maximum number of URLs to analyze. Defaults to 15.

    Returns:
        Dict: A dictionary containing the research results.
              Includes 'status' key ('success' or 'error').
              If 'success', includes 'report' and 'sources' keys.
              If 'error', includes an 'error_message' key.
    """
    print(f"--- Tool: deep_research called for topic: {topic} ---")
    print(
        f"--- Parameters: max_depth={max_depth}, time_limit={time_limit}, max_urls={max_urls} ---"
    )

    try:
        app = FirecrawlApp()
        result = app.deep_research(
            topic, max_depth=max_depth, time_limit=time_limit, max_urls=max_urls
        )

        if "data" in result and "finalAnalysis" in result["data"]:
            return {
                "status": "success",
                "report": result["data"]["finalAnalysis"],
                "sources": result["data"].get("sources", []),
            }
        else:
            return {
                "status": "error",
                "error_message": "Research completed but no analysis was produced",
            }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"Error during deep research: {str(e)}",
        }


def generate_image(prompt: str, model: str = GEMINI_IMAGE_GEN_MODEL) -> Dict:
    """Generates an image using Gemini's image generation models.

    Args:
        prompt (str): A description of the image to generate.
        model (str, optional): The model to use for image generation.
                              Defaults to Gemini's image generation model.

    Returns:
        Dict: A dictionary containing the image generation results.
              Includes a 'status' key ('success' or 'error').
              If 'success', includes an 'image_data' key with base64-encoded image.
              If 'error', includes an 'error_message' key.
    """
    print(f"--- Tool: generate_image called with prompt: {prompt} ---")

    try:
        # Initialize Gemini client
        client = genai.Client()

        # Generate content with image response
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"]),
        )

        # Process the response
        image_data = None
        text_response = ""

        for part in response.candidates[0].content.parts:
            if part.text is not None:
                text_response += part.text
            elif part.inline_data is not None:
                # Convert binary data to base64 string
                image_data = base64.b64encode(part.inline_data.data).decode("utf-8")

        if image_data:
            return {
                "status": "success",
                "prompt": prompt,
                "text_response": text_response,
                "image_data": image_data,
            }
        else:
            return {
                "status": "error",
                "error_message": "Image generation completed but no image was produced",
            }
    except Exception as e:
        return {"status": "error", "error_message": f"Error generating image: {str(e)}"}


# -------------------- CALLBACKS --------------------


def content_filter_callback(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> Optional[LlmResponse]:
    """
    A basic content filter that checks user messages for prohibited content.
    Returns None to allow the request, or an LlmResponse to block it.
    """
    agent_name = callback_context.agent_name
    print(f"--- Callback: content_filter_callback running for agent: {agent_name} ---")

    # Extract the latest user message
    last_user_message_text = ""
    if llm_request.contents:
        for content in reversed(llm_request.contents):
            if content.role == "user" and content.parts:
                if content.parts[0].text:
                    last_user_message_text = content.parts[0].text
                    break

    # Simple example: block messages with explicit harmful content requests
    # In a real application, this would be more sophisticated
    prohibited_terms = ["harm someone", "illegal activity", "make a bomb"]

    for term in prohibited_terms:
        if term.lower() in last_user_message_text.lower():
            print(
                f"--- Callback: Found prohibited term '{term}'. Blocking request! ---"
            )

            return LlmResponse(
                content=types.Content(
                    role="model",
                    parts=[
                        types.Part(
                            text="I cannot assist with that request as it appears to violate content policies."
                        )
                    ],
                )
            )

    # Allow the request to proceed
    return None


# -------------------- AGENTS --------------------

# Create the specialized agents

search_agent = Agent(
    model=MODEL_GEMINI_2_0_FLASH,
    name="search_agent",
    instruction="You are a web search specialist. Your role is to search for current information on the web "
    "when users ask about recent events, current facts, or real-time data. "
    "Use the 'web_search' tool to find relevant information, then synthesize and present it clearly. "
    "Always cite your sources by including the URLs. "
    "If the search returns an error, explain the issue to the user and suggest alternatives.",
    description="Searches the web for current information and recent events using the web_search tool.",
    tools=[web_search],
)

web_extraction_agent = Agent(
    model=MODEL_GEMINI_2_0_FLASH,
    name="web_extraction_agent",
    instruction="You are a web content extraction specialist. Your role is to extract and analyze content from web pages. "
    "You have two tools at your disposal: "
    "1. 'scrape_webpage': Use this to retrieve raw content from a URL in various formats (markdown, HTML, or link list). "
    "2. 'extract_structured_data': Use this to extract specific structured data from a URL based on user needs. "
    "When a user provides a URL, ask clarifying questions about what they want to extract if needed. "
    "Present the extracted information in a clear, organized manner. For structured data, format it nicely.",
    description="Extracts and analyzes content from web pages using scrape_webpage and extract_structured_data tools.",
    tools=[scrape_webpage, extract_structured_data],
)

research_agent = Agent(
    model=MODEL_GEMINI_2_0_FLASH,
    name="research_agent",
    instruction="You are a deep research specialist. Your role is to conduct comprehensive research on complex topics. "
    "Use the 'deep_research' tool to analyze multiple sources and provide in-depth reports on user queries. "
    "Always present your findings in a structured format with clear sections, emphasizing key insights. "
    "IMPORTANT: Always cite your sources by including all the reference URLs at the end of your response. "
    "If the research takes time, inform the user and set appropriate expectations. "
    "If the research fails, explain why and suggest narrowing or rephrasing the topic.",
    description="Conducts deep, comprehensive research on topics using multiple sources with the deep_research tool.",
    tools=[deep_research],
)

image_generation_agent = Agent(
    model=MODEL_GEMINI_2_0_FLASH,
    name="image_generation_agent",
    instruction="You are an image generation specialist. Your role is to create images based on user descriptions. "
    "Use the 'generate_image' tool when users request visual content. "
    "Ask clarifying questions if the image description is vague or ambiguous. "
    "Emphasize that image generation is performed by AI and may not perfectly match expectations. "
    "If image generation fails, apologize and suggest modifications to the prompt that might work better. "
    "NEVER generate images that could be harmful, explicit, or violate ethical guidelines.",
    description="Generates images based on text descriptions using Gemini's image generation model.",
    tools=[generate_image],
)

# Create the root agent with all capabilities
root_agent = Agent(
    name="chatgpt_agentic_clone",
    model=MODEL_GEMINI_2_0_FLASH,
    description="A versatile AI assistant that can answer questions, search the web, extract web content, conduct research, and generate images.",
    instruction="You are a versatile AI assistant similar to ChatGPT. Your primary job is to be helpful, harmless, and honest. "
    "You have several specialized capabilities through your sub-agents: "
    "1. 'search_agent': Use for current events, facts, weather, sports scores, or any real-time information. "
    "2. 'web_extraction_agent': Use when asked to extract or analyze content from specific URLs. "
    "3. 'research_agent': Use for in-depth research on complex topics requiring analysis of multiple sources. "
    "4. 'image_generation_agent': Use when asked to create or generate images. "
    "Important guidelines: "
    "- For general knowledge queries, respond directly using your built-in knowledge. "
    "- For current events or real-time information, delegate to 'search_agent'. "
    "- If asked to get content from a specific URL, delegate to 'web_extraction_agent'. "
    "- If asked for deep research with multiple sources, delegate to 'research_agent'. "
    "- If asked to create or generate an image, delegate to 'image_generation_agent'. "
    "- Be conversational, helpful, and concise. "
    "- Avoid harmful, unethical, or illegal content. "
    "- Admit when you don't know something rather than making up information.",
    sub_agents=[
        search_agent,
        web_extraction_agent,
        research_agent,
        image_generation_agent,
    ],
    before_model_callback=content_filter_callback,
)
