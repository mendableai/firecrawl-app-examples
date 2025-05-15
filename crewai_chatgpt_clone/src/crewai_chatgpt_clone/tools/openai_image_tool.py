# src/chatgpt_clone/tools/openai_image_tool.py

from crewai.tools import tool
from openai import OpenAI
import base64

client = OpenAI()


@tool("Image Generator using OpenAI")
def openai_image_tool(prompt: str) -> str:
    """Generates an image from a text prompt using OpenAI's image generation API and returns base64 string."""
    result = client.images.generate(model="gpt-image-1", prompt=prompt)

    image_base64 = result.data[0].b64_json
    image_bytes = base64.b64decode(image_base64)

    output_path = "/tmp/generated_image.png"
    with open(output_path, "wb") as f:
        f.write(image_bytes)

    return f"Image successfully generated at: {output_path}"
