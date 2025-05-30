# Email to Company Intel (with LangGraph)

<div align="center">
  <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmdkdzZ3NG43N29sbDNoZng1eXlyODVoazV2dDF0ZHhmYWNqdjJpaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XKCIlHNQtZmh17zYnG/giphy.gif" alt="Company Intelligence Demo" width="600">
</div>

Extract company intelligence from email addresses using Firecrawl's search endpoint and LangGraph for workflow orchestration.

## 🔍 This is a demonstration of search within Firecrawl

This example showcases how Firecrawl's `/search` endpoint combines web search with content scraping:
- **Search the web** for recent news, funding info, and company updates
- **Automatically scrape** the full content from search results in one API call
- **Extract structured data** from both search results and scraped content
- **Orchestrate with LangGraph** for structured, multi-step workflows

## How it Works

```mermaid
flowchart TD
    A[Email Input] --> B[Extract Domain]
    B --> C[Scrape Site]
    C --> D{Firecrawl<br/>Search API}
    
    D --> E[News Search]
    D --> F[Funding Search]
    
    E --> G[News +<br/>Content]
    F --> H[Funding +<br/>Content]
    
    G --> I[AI Analysis]
    H --> I
    C --> I
    
    I --> J[Intel Report]
    
    style D fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff
    style G fill:#4ecdc4,stroke:#333,stroke-width:2px
    style H fill:#4ecdc4,stroke:#333,stroke-width:2px
    style J fill:#95e1d3,stroke:#333,stroke-width:2px
```

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up API keys in `.env`:
```
FIRECRAWL_API_KEY=your_firecrawl_api_key
OPENAI_API_KEY=your_openai_api_key
```

3. Run:
```bash
npm start
```

Enter an email address when prompted and get company intelligence report.

## Get API Keys
- Firecrawl: https://firecrawl.dev
- OpenAI: https://platform.openai.com