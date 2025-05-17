# src/chatgpt_clone/test_tools.py

from dotenv import load_dotenv
from tools.firecrawl_search_tool import firecrawl_search_tool
from tools.firecrawl_research_tool import firecrawl_research_tool
from tools.firecrawl_extract_tool import firecrawl_extract_tool
from tools.openai_image_tool import openai_image_tool

load_dotenv()


def test_firecrawl_search():
    print("\n🔥 Testing Firecrawl Search...")
    print(firecrawl_search_tool.run("What is the capital of France?"))


def test_firecrawl_research():
    print("\n📚 Testing Firecrawl Deep Research...")
    print(
        firecrawl_research_tool.run(
            "Best Android tablets for seniors to read ebooks and watch videos"
        )
    )


def test_firecrawl_extract():
    print("\n🧹 Testing Firecrawl Web Extraction...")
    input_data = "https://github.com/trending|Extract the top 5 trending repositories"
    print(firecrawl_extract_tool.run(input_data))


def test_openai_image_generation():
    print("\n🎨 Testing OpenAI Image Generation...")
    prompt = "A futuristic cityscape at sunset, with flying cars and neon lights"
    print(openai_image_tool.run(prompt))


if __name__ == "__main__":
    test_firecrawl_search()
    test_firecrawl_research()
    test_firecrawl_extract()
    test_openai_image_generation()
