# ChatGPT Agentic Clone

This project demonstrates a versatile agentic AI assistant built using Google's Agent Development Kit (ADK). It implements a ChatGPT-like clone with additional capabilities:

- Answer general knowledge questions using the LLM's training
- Search the web for real-time information using Firecrawl
- Extract and analyze content from web pages
- Perform deep research on complex topics with source citations
- Generate images based on text descriptions via Gemini's image generation models

## Project Structure

```
app/
├── .env                       # API key configuration
├── main.py                    # Runner application
├── requirements.txt           # Dependencies
└── chatgpt_agentic_clone/     # Agent package
    ├── __init__.py            # Package marker
    └── agent.py               # Agent definitions and tools
```

## Prerequisites

- Python 3.9+
- [Google AI Studio API Key](https://aistudio.google.com/app/apikey) for both Gemini models and image generation
- [Firecrawl API Key](https://www.firecrawl.dev) for web search, extraction, and research

## Setup Instructions

1. Create a virtual environment (recommended):

   ```
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install the required packages:

   ```
   pip install -r requirements.txt
   ```

3. Configure your API keys:
   - Edit the `.env` file and add your actual API keys:

     ```
     # Gemini API Key
     GOOGLE_API_KEY=your_google_api_key_here
     
     # Firecrawl API Key (if required)
     FIRECRAWL_API_KEY=your_firecrawl_api_key_here
     ```

## Running the Agent

### Using the CLI

Run the main application to start an interactive CLI session:

```
python main.py
```

You can specify custom session and user IDs:

```
python main.py --session-id custom_session --user-id custom_user
```

### Using the ADK Web UI

Alternatively, you can run the agent using ADK's built-in web UI:

```
cd ..  # Move to parent directory
adk web
```

Then open the URL (typically <http://localhost:8000>) in your browser and select "chatgpt_agentic_clone" from the dropdown.

## Testing the Agent

Try the following types of queries:

- **General knowledge**: "Who was Marie Curie?", "How does photosynthesis work?"
- **Web search**: "What's the weather in London right now?", "Latest news about AI"
- **Web extraction**: "Extract content from <https://github.com/trending>"
- **Structured extraction**: "Extract the trending repositories from <https://github.com/trending>"
- **Deep research**: "Do deep research on quantum computing advances"
- **Image generation**: "Generate an image of a cat playing piano"

## Agent Components

The system is composed of multiple specialized agents:

1. **Root Agent**: Coordinates everything and handles general knowledge queries
2. **Search Agent**: Searches the web for real-time information
3. **Web Extraction Agent**: Extracts content from web pages
4. **Research Agent**: Conducts deep research with multiple sources
5. **Image Generation Agent**: Creates images from text descriptions

## Tools & Capabilities

- **web_search**: Searches the web using Firecrawl
- **scrape_webpage**: Extracts content from a URL in various formats (markdown, HTML, links)
- **extract_structured_data**: Extracts specific structured data from a webpage
- **deep_research**: Researches a topic in-depth using multiple sources
- **generate_image**: Creates images using Gemini's image generation model

## Safety Features

The agent includes content filtering via the `content_filter_callback` to prevent harmful requests.

## License

This project is for educational purposes.
