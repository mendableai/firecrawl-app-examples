# DeepSeek RAG Documentation Assistant

Transform any documentation into an intelligent chatbot! This Streamlit-based RAG (Retrieval-Augmented Generation) application allows you to convert any documentation website or local documents into an interactive AI assistant. Powered by DeepSeek and Ollama, it provides intelligent, context-aware responses to your documentation queries.

## Key Features

- **Documentation to Chatbot**: Convert any documentation into an interactive AI assistant
- **Multiple Scraping Options**:
  - **Firecrawl Scraper**: Specialized scraper for structured documentation sites
  - **Web Scraper**: Flexible scraper for general websites with configurable crawling
- **Smart Document Processing**:
  - Automatic content extraction and structuring
  - Intelligent chunking for optimal context retrieval
  - Vector-based semantic search
- **Interactive Chat Interface**:
  - Natural language querying
  - Chain-of-thought reasoning
  - Context-aware responses
- **Documentation Management**:
  - Support for multiple documentation sets
  - Easy switching between different docs
  - Automatic content indexing

## Prerequisites

- Python 3.10 or higher
- [Ollama](https://ollama.ai/) installed and running locally
- Required Ollama models:
  - `deepseek-r1:14b` (for chat)
  - `nomic-embed-text` (for embeddings)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd deepseek-rag
```

2. Create and activate a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install the required dependencies:
```bash
pip install -r requirements.txt
```

4. Pull required Ollama models:
```bash
ollama pull deepseek-r1:14b
ollama pull nomic-embed-text
```

## Dependencies

The application uses the following key dependencies:
- `streamlit`: For the web interface
- `langchain-core>=0.3.34`: Core LangChain functionality
- `langchain-ollama>=0.0.3`: Ollama integration
- `langchain-chroma>=0.1.4`: Vector store integration
- `chromadb>=0.4.22`: Vector database
- `langchain-community`: Document loaders and utilities
- `langchain-text-splitters`: Text chunking utilities
- `beautifulsoup4`: For web scraping
- `requests`: For HTTP requests

## Usage

### 1. Convert Documentation to Chatbot

#### Using the Web Interface

1. Start the application:
```bash
streamlit run src/app.py
```

2. Open your browser at http://localhost:8501

3. In the sidebar:
   - Choose your preferred scraper (Firecrawl or Web Scraper)
   - Enter the documentation URL
   - Set a name for your documentation (must end with '-docs')
   - Configure scraper-specific settings
   - Click "Start Scraping"

4. Once scraping is complete:
   - Select your documentation from the dropdown
   - Start chatting with your AI assistant!

#### Using the Command Line

For advanced users, you can use the web scraper directly:

```bash
python src/web_scraper.py https://docs.example.com --output docs --max-pages 20 --delay 1.5
```

### 2. Interacting with Your Documentation Bot

- **Ask Questions**: Type natural language questions about the documentation
- **View Reasoning**: Click "View reasoning" to see how the AI arrived at its answer
- **Switch Context**: Use the sidebar to switch between different documentation sets
- **Real-time Processing**: The bot processes and indexes new documentation automatically

## Supported Documentation Types

- **Web Documentation**:
  - Documentation websites
  - Technical blogs
  - API documentation
  - Product manuals
- **Local Documentation**:
  - Markdown files
  - Text documents
  - Documentation directories

## Project Structure

```
deepseek-rag/
├── src/
│   ├── app.py           # Streamlit application
│   ├── rag.py           # RAG implementation
│   ├── scraper.py       # Firecrawl scraper
│   └── web_scraper.py   # Web scraping utility
├── requirements.txt     # Project dependencies
└── README.md           # This file
```

## Troubleshooting

1. **Model Not Found Errors**:
   - Ensure Ollama is running (`ollama serve`)
   - Verify required models are pulled (`ollama list`)
   - Pull missing models using `ollama pull <model-name>`

2. **ChromaDB Issues**:
   - If you encounter database errors, try removing the `./chroma_db` directory and restarting the application
   - Ensure you have sufficient disk space for the vector store

3. **Performance Issues**:
   - The application requires significant RAM for the language models
   - Consider using a machine with at least 16GB RAM
   - Adjust chunk sizes in `rag.py` if needed

4. **Web Scraping Issues**:
   - If scraping fails, check your internet connection
   - Some websites may block automated scraping
   - Adjust the delay parameter if you're getting rate-limited
   - Ensure you have permission to scrape the target website

## Best Practices

1. **Documentation Preparation**:
   - Use clear, well-structured documentation
   - Ensure proper HTML formatting for web docs
   - Include relevant metadata and titles

2. **Scraping Configuration**:
   - Start with a small number of pages for testing
   - Adjust delay settings based on the target website
   - Use appropriate scraper for your documentation type

3. **Chat Interaction**:
   - Ask specific, clear questions
   - Use natural language
   - Check the reasoning for complex queries

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Add your license information here]
