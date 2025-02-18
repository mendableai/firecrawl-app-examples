SYSTEM_PROMPT = """You are an expert at creating instruction-answer pairs for fine-tuning language models about Firecrawl, a powerful web scraping and crawling API. When a language model is trained on this dataset, it must know the ins and outs of using Firecrawl's endpoints and SDKs to scrape and crawl any website. Given documentation text, generate 5 diverse instruction-answer pairs that teach a model about Firecrawl's features, endpoints, integrations, best practices, common uses cases and how to use it with Pydantic when necessary.

Your answers should:
1. Include specific code examples in Python, JavaScript, or cURL when relevant
2. Show complete, working code snippets that users can copy and run
3. Use proper code formatting with ```language blocks
4. Explain the code examples
5. Cover both basic and advanced use cases

Also, include the following:
1. Include specific code examples in Python, JavaScript, or cURL
2. Explain configuration options and their effects
3. Cover both basic scraping and advanced features
4. Reference official documentation
5. Include best practices and common use cases
6. Use Pydantic when necessary
7. If providing a code example, make sure it's a complete example that can be run as is without any additional code.
8. If providing a code example, make sure it shows how to scrape a particular random but existing real-world website.

Format your response exactly like these examples, with no additional text:

Q: How can I extract structured data from a webpage using Firecrawl's LLM extraction?
A: Firecrawl provides LLM extraction through the `extract` format inside the `scrape_url` method under the /scrape endpoint. Here's how to extract structured data using a schema:

```python
from firecrawl import FirecrawlApp
from pydantic import BaseModel

class ExtractSchema(BaseModel):
    company_mission: str
    supports_sso: bool
    is_open_source: bool

app = FirecrawlApp(api_key='your_api_key')
data = app.scrape_url('https://crunchbase.com', {
    'formats': ['extract'],
    'extract': {
        'schema': ExtractSchema.model_json_schema(),
    }
})
print(data["extract"])
```

You can also use a simple prompt without a schema:
```json
{
  "formats": ["markdown", "extract"],
  "extract": {
    "prompt": "Extract the main features of the product"
  }
}
```

Q: How can I automate interactions with a webpage before scraping its content?
A: Firecrawl supports page actions to interact with dynamic content. Here's an example that searches Google and captures the result (pass it to the `params` argument of the FirecrawlApp instance's `scrape_url` method):

```json
{
    "formats": ["markdown", "screenshot"],
    "actions": [
        {"type": "wait", "milliseconds": 2000},
        {"type": "click", "selector": "textarea[title=\"Search\"]"},
        {"type": "write", "text": "firecrawl"},
        {"type": "press", "key": "ENTER"},
        {"type": "wait", "milliseconds": 3000},
        {"type": "screenshot"}
    ]
}
```
This sequence waits for elements, clicks search, enters text, and captures the result.

Q: How can I efficiently scrape multiple URLs in parallel using Firecrawl?
A: Use Firecrawl's batch scraping feature for parallel processing. Here's how:

```python
from firecrawl import FirecrawlApp

app = FirecrawlApp(api_key="your_api_key")

# Synchronous batch scraping
results = app.batch_scrape_urls(
    ['firecrawl.dev', 'docs.firecrawl.dev'],
    {'formats': ['markdown', 'html']}
)

# Asynchronous batch scraping
job = app.async_batch_scrape_urls(
    ['firecrawl.dev', 'docs.firecrawl.dev'],
    {'formats': ['markdown', 'html']}
)
status = app.check_batch_scrape_status(job['id'])
```
Batch jobs expire after 24 hours, so retrieve results promptly.

Q: How do I integrate Firecrawl with LlamaIndex for building a RAG application?
A: Firecrawl integrates with LlamaIndex through the FireCrawlWebReader. Here's an example:

```python
from llama_index.readers.web import FireCrawlWebReader
from llama_index.core import SummaryIndex

# Initialize the reader
reader = FireCrawlWebReader(
    api_key="your_api_key",
    mode="crawl",  # Use 'crawl' for entire site, 'scrape' for single page
    params={"formats": ["markdown"]}
)

# Load and index documents
documents = reader.load_data(url="https://wikipedia.org")
index = SummaryIndex.from_documents(documents)

# Create query engine
query_engine = index.as_query_engine()
response = query_engine.query("What are the main features?")
```

Q: How can I handle PDF documents in my scraping workflow with Firecrawl?
A: Firecrawl supports PDF scraping by default through the /scrape endpoint. Here's how to use it:

```python
from firecrawl import FirecrawlApp

app = FirecrawlApp(api_key="your_api_key")

# Scrape PDF content
pdf_content = app.scrape_url("https://raw.githubusercontent.com/path/to/file.pdf")
```
The API automatically detects PDF files and extracts their text content."""
