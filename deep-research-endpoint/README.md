# Deep Research Chatbot

A Streamlit application that uses Firecrawl's deep research capabilities to perform intelligent web research and provide comprehensive answers to complex queries.

## Features

- Conduct in-depth research on any topic using Firecrawl's AI-powered web exploration
- View real-time updates as the research progresses
- Get comprehensive answers with source citations
- Customize research parameters like depth, timeout, and URL limits

## Installation

### Prerequisites

- Python 3.7+
- Firecrawl API Key (obtain from [Firecrawl](https://firecrawl.dev))

### Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/mendableai/firecrawl-app-examples.git
   cd firecrawl-app-examples/deep-research-endpoint
   ```

2. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Run the Streamlit application:

   ```bash
   cd src
   streamlit run app.py
   ```

   Or use the provided run script:

   ```bash
   python run.py
   ```

2. Open your web browser and navigate to the URL displayed in the console (typically <http://localhost:8501>)

3. Enter your Firecrawl API key in the sidebar

4. Configure research parameters as needed

5. Enter your research query in the chat input and press Enter

6. View real-time updates as the research progresses and receive a comprehensive answer when complete

## Configuration Options

- **API Key**: Your Firecrawl API key for authentication
- **Maximum Depth**: Controls how deep the research process will explore (1-10)
- **Timeout Limit**: Maximum time allowed for research in seconds (30-600)
- **Maximum URLs**: Maximum number of URLs to explore during research (5-100)

## Project Structure

```python
deep-research/
├── src/
│   ├── app.py                # Main Streamlit application
│   ├── firecrawl_client.py   # Firecrawl API client wrapper
│   ├── ui.py                 # UI components
│   └── utils.py              # Utility functions
├── requirements.txt          # Dependencies
├── run.py                    # Simple launcher script
└── README.md                 # Documentation
```

## Requirements

The application requires the following dependencies:

```python
streamlit>=1.24.0
requests>=2.28.0
firecrawl-py>=0.1.0
```

## License

[MIT License](LICENSE)
