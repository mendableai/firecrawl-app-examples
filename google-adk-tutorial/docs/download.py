from firecrawl import FirecrawlApp
from dotenv import load_dotenv

load_dotenv()

app = FirecrawlApp()
streaming_tutorial = (
    "https://google.github.io/adk-docs/get-started/quickstart-streaming/"
)
multi_agent_tutorial = "https://google.github.io/adk-docs/tutorials/agent-team/"

links = [streaming_tutorial, multi_agent_tutorial]


def save_markdown(markdown: str, filename: str):
    with open(filename, "w") as f:
        f.write(markdown)


for link in links:
    result = app.scrape_url(link)
    save_markdown(result.markdown, f"docs/{link.split('/')[-2]}.md")
