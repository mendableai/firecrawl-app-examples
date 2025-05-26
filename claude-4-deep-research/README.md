# Claude 4 Deep Research Assistant

A powerful AI assistant that combines Claude 4's conversational abilities with Firecrawl's deep research capabilities to provide comprehensive, well-sourced answers on any topic.

## Features

- 🤖 **Claude 4 Integration**: Powered by Anthropic's latest Claude 3.5 Sonnet model
- 🔍 **Deep Research**: Automatic web research using Firecrawl's deep research endpoint
- 💬 **Streaming Chat UI**: Real-time typewriter effect built with Streamlit
- 📚 **Message History**: Persistent conversation history within sessions
- ⚙️ **Configurable Research**: Adjustable research depth, time limits, and URL analysis
- 🎯 **Smart Tool Usage**: Automatically detects when research is needed
- 📊 **Source Attribution**: Comprehensive analysis with source citations

## How It Works

1. **General Conversations**: Ask any question for immediate Claude responses
2. **Research Requests**: When you ask for research, analysis, or current information, the assistant automatically uses Firecrawl's deep research tool
3. **Comprehensive Analysis**: The tool searches the web, analyzes multiple sources, and synthesizes findings into detailed insights
4. **Source Attribution**: All research comes with proper source citations and references

## Setup Instructions

### Prerequisites

- Python 3.12+
- Anthropic API key ([Get one here](https://console.anthropic.com/))
- Firecrawl API key ([Get one here](https://firecrawl.dev/))

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd claude-4-deep-research
   ```

2. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   - Copy `env.example` to `.env`
   - Add your API keys:

   ```bash
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   FIRECRAWL_API_KEY=your_firecrawl_api_key_here
   ```

4. **Run the application**:

   ```bash
   streamlit run src/claude_deep_research_app.py
   ```

### Alternative Setup with UV (Recommended)

If you have [uv](https://docs.astral.sh/uv/) installed:

```bash
uv sync
uv run streamlit run src/claude_deep_research_app.py
```

## Usage Examples

### General Questions

- "What is quantum computing?"
- "Explain machine learning concepts"
- "Help me write a Python function"

### Research Requests

- "Research the latest developments in quantum computing"
- "What are the current trends in renewable energy?"
- "Analyze the impact of AI on healthcare"
- "Investigate recent breakthroughs in space exploration"

### Current Information

- "What are the latest news in artificial intelligence?"
- "Current state of electric vehicle adoption"
- "Recent developments in climate change research"

## Configuration

Use the sidebar controls to adjust research parameters:

- **Research Depth** (1-10): Number of research iterations
- **Time Limit** (30-300 seconds): Maximum research duration
- **Max URLs** (1-100): Maximum number of sources to analyze

## Architecture

- **Frontend**: Streamlit for the web interface
- **AI Model**: Anthropic Claude 3.5 Sonnet via official SDK
- **Research Engine**: Firecrawl Deep Research API
- **Tool Integration**: Anthropic's tool use framework
- **Streaming**: Custom typewriter effect for better UX

## API Documentation

- [Firecrawl Deep Research API](https://docs.firecrawl.dev/features/alpha/deep-research)
- [Anthropic Tool Use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)
- [Anthropic Streaming](https://docs.anthropic.com/en/docs/build-with-claude/streaming)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

- Check the [Firecrawl documentation](https://docs.firecrawl.dev/)
- Review [Anthropic's tool use guide](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
- Open an issue in this repository
