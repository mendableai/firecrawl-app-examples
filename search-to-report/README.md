# Search to Report

<div align="center">
  <img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDd1NzRqYjJmMHdkMXJvZDBwNWQwdjJjYWhxdHFtYThra2JxZWg2MyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LI231icxPLHW3e0D5y/giphy.gif" alt="Research Report Demo" width="600">
</div>

Generate professional research reports from search queries using Firecrawl's search endpoint.

## 🔍 This is a demonstration of search within Firecrawl

This example shows how Firecrawl's `/search` endpoint enables comprehensive research:
- **Search for any topic** and get the most relevant results
- **Scrape full content** from each result using `scrapeOptions: { formats: ["markdown"] }`
- **Synthesize information** from multiple sources into cohesive reports
- **Generate professional documents** with data from both search snippets and scraped content

## How it Works

```mermaid
flowchart LR
    A[Topic] --> B{Firecrawl<br/>Search}
    B --> C[Results +<br/>Content]
    C --> D[AI Synthesis]
    D --> E[Report]
    E --> F[MD/HTML]
    
    style B fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#4ecdc4,stroke:#333,stroke-width:2px
    style E fill:#95e1d3,stroke:#333,stroke-width:2px
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

Enter a search query when prompted to generate a research report.

## Get API Keys
- Firecrawl: https://firecrawl.dev
- OpenAI: https://platform.openai.com

## Features
- Professional research report generation
- Multi-source data synthesis
- Export to Markdown and HTML
- Executive summary generation