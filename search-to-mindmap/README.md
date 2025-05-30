# Search to Mindmap

<div align="center">
  <img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNDR2ZXRtOWhoZXJiMTM2amdrOG5sMWptd2VqbnNjaWVkemY1MXYyNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TOuQcX0PlM4x6m7YU3/giphy.gif" alt="Mindmap Generation Demo" width="600">
</div>

Create interactive mind maps from search results using Firecrawl's search endpoint.

## 🔍 This is a demonstration of search within Firecrawl

This example demonstrates how Firecrawl's `/search` endpoint enables rich visualizations:
- **Search any topic** and get relevant web results
- **Automatically scrape full content** from each result with `scrapeOptions`
- **Extract key concepts** from the scraped markdown content
- **Build hierarchical mindmaps** from the comprehensive data

## How it Works

```mermaid
flowchart LR
    A[Topic] --> B{Firecrawl<br/>Search}
    B --> C[Results +<br/>Content]
    C --> D[Extract<br/>Concepts]
    D --> E[Build<br/>Hierarchy]
    E --> F[Mindmap]
    
    style B fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#4ecdc4,stroke:#333,stroke-width:2px
    style F fill:#95e1d3,stroke:#333,stroke-width:2px
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

Enter a search query when prompted to generate an interactive mindmap.

## Get API Keys
- Firecrawl: https://firecrawl.dev
- OpenAI: https://platform.openai.com

## Features
- Search-powered mindmap generation
- Interactive HTML visualization
- Auto-generated hierarchical structure
- Export to JSON format