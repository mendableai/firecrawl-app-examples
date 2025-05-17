# src/chatgpt_clone/tools/openai_image_tool.py

from crewai.tools import tool
from openai import OpenAI

client = OpenAI()


@tool("Image Generator using OpenAI")
def openai_image_tool(prompt: str) -> str:
    """Generates an image from a text prompt using OpenAI's image generation API and returns base64 string."""
    result = client.images.generate(
        model="dall-e-3", prompt=prompt, response_format="url"
    )

    image_url = result.data[0].url

    return f"Here is the image URL: {image_url}"
