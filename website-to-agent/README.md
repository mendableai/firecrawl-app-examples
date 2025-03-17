# WebToAgent

WebToAgent is a Streamlit application that extracts domain knowledge from websites and creates specialized AI agents capable of answering questions about that domain. By leveraging web crawling and advanced language models, WebToAgent transforms website content into interactive, conversational agents.

![WebToAgent Screenshot](https://placeholder-for-screenshot.png)

## Features

- **Website content extraction**: Crawl websites using Firecrawl to extract relevant content
- **Knowledge model generation**: Process extracted content to build domain-specific knowledge models
- **AI agent creation**: Create conversational agents specialized in the crawled domain
- **Interactive chat interface**: Engage with your domain agent through a real-time chat interface
- **Streaming responses**: Get real-time streaming responses from the agent as it generates them

## Prerequisites

Before installing WebToAgent, make sure you have:

- Python 3.9+ installed
- Pip (Python package installer)
- Access to Firecrawl API credentials
- Access to language model API credentials (like OpenAI)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/mendableai/firecrawl-app-examples.git
   cd firecrawl-app-examples/website-to-agent
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   # On Windows
   .venv\Scripts\activate
   # On macOS/Linux
   source .venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Configure your API credentials (see Configuration section)

## Configuration

1. Create a `.env` file in the project root with your API credentials:

   ```bash
   FIRECRAWL_API_KEY=your_firecrawl_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

2. You can customize default settings in the `src/config.py` file, including:
   - `DEFAULT_MAX_URLS`: Maximum number of URLs to crawl (default: 10)
   - `DEFAULT_USE_FULL_TEXT`: Whether to use comprehensive text extraction (default: False)

## Usage

1. Start the Streamlit application:

   ```bash
   streamlit run src/ui.py
   ```

2. Open your browser and navigate to `http://localhost:8501`

3. Enter a website URL in the sidebar

4. Configure crawling options:
   - Adjust the maximum pages to analyze
   - Toggle comprehensive text extraction

5. Click "Create agent" to start the process

6. Once the agent is created, you can ask questions about the website's domain in the chat interface

## How it works

WebToAgent operates in three main phases:

1. **Content extraction**: Using Firecrawl, the application crawls the specified website, gathering content from pages within the domain. The depth and breadth of crawling can be adjusted through the UI.

2. **Knowledge model creation**: The extracted content is processed to build a domain-specific knowledge representation. This phase identifies key concepts, relationships, and information from the website.

3. **Agent creation**: The domain knowledge is used to create a specialized AI agent. The agent uses a language model to provide conversational responses to questions about the website's domain.

## Deployment

To deploy WebToAgent to a production environment:

### Using Streamlit Cloud

1. Push your code to a GitHub repository
2. Go to [Streamlit Cloud](https://streamlit.io/cloud)
3. Connect your GitHub account
4. Select your repository and the `src/ui.py` file
5. Configure your secrets (API keys) in the Streamlit Cloud dashboard
6. Deploy

### On a server

1. Set up a server with Python 3.9+
2. Clone the repository and install dependencies
3. Configure environment variables for API keys
4. Use a process manager like Supervisor to run:

   ```bash
   streamlit run src/ui.py --server.port=80 --server.address=0.0.0.0
   ```

5. (Optional) Set up Nginx as a reverse proxy for better security and performance

## Troubleshooting

### Common issues

- **Streaming responses disappearing**: If streaming responses disappear when submitting a new message, restart the application. The app utilizes a mechanism to maintain streaming state across Streamlit reruns.

- **API rate limiting**: If you encounter rate limit errors, reduce the maximum pages to analyze or add delays between requests in the configuration.

- **Memory issues**: For large websites, consider increasing the available memory for the Python process or reducing the scope of crawling.

## Technical details

### Stream handling in Streamlit

WebToAgent implements a solution for maintaining streaming responses when the Streamlit app reruns. Key approaches:

1. **Global state management**: Uses a global variable to maintain the streaming state outside of Streamlit's session state.

2. **Thread-safe implementation**: Separates UI and streaming concerns:
   - Background threads handle API calls and collect tokens
   - Main thread manages UI and session state

3. **Cross-rerun state transfer**: Stores completed responses in the session state to be added to the chat history on the next Streamlit run.

This architecture ensures that even if a user submits a new message while a response is still streaming, the full text of the previous response will be properly saved.

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

## Acknowledgments

- [Firecrawl](https://firecrawl.dev) for web crawling capabilities
- [Streamlit](https://streamlit.io) for the web application framework
- [OpenAI](https://openai.com) for language model capabilities
