# KnowledgeForge

KnowledgeForge is an application that transforms websites into intelligent, specialized AI agents by extracting and processing website content. The system uses Firecrawl's LLMs.txt API to extract clean text from websites and OpenAI's Agents SDK to create custom agents with domain-specific knowledge.

## Setup

1. Clone this repository
2. Make sure you have Python 3.10+ installed
3. Install Poetry if you haven't already:

   ```
   pip install poetry
   ```

4. Install dependencies:

   ```
   poetry install
   ```

5. Create a `.env` file in the root directory with your API keys:

   ```
   OPENAI_API_KEY=your_openai_api_key
   FIRECRAWL_API_KEY=your_firecrawl_api_key
   ```

## Running the application

```bash
# Using Poetry
poetry run streamlit run src/main.py

# Or activate the virtual environment first
poetry shell
streamlit run src/main.py
```

## Features

- Extract domain knowledge from any website
- Create specialized AI agents with domain expertise
- Visualize knowledge graphs of extracted concepts
- Chat with domain-specific agents to query information
- Support for comprehensive or concise text extraction

## Architecture

The application follows a modular architecture:

1. **Website content acquisition**: Extracts text from websites using Firecrawl's LLMs.txt API
2. **Knowledge extraction engine**: Analyzes content to identify concepts, terminology, and insights
3. **Agent creation**: Creates specialized OpenAI agents with domain expertise
4. **User interface**: Streamlit-based UI for website input and agent interaction

## Use cases

- Research acceleration and literature review
- Domain-specific knowledge exploration
- API documentation navigation
- Competitor analysis
- Educational material digestion

## Limitations

- Only publicly accessible websites can be processed
- Agents cannot browse the live web for updated information
- Knowledge extraction quality depends on content quality
