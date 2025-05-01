# ChatGPT Agentic Clone with Google ADK

This repository demonstrates how to build a ChatGPT-like agentic assistant using Google's [Agent Development Kit (ADK)](https://google.github.io/adk-docs/).

## About the Project

This project creates a powerful AI assistant that combines the capabilities of several specialized agents:

- **General Knowledge**: Answer questions using the LLM's native knowledge
- **Web Search**: Retrieve current information from the internet using Firecrawl
- **Web Extraction**: Extract and analyze content from specific URLs
- **Deep Research**: Conduct comprehensive research across multiple sources with citations
- **Image Generation**: Create images from text descriptions using OpenAI's API

The implementation follows the standard ADK package structure for local development, making it easy to extend and customize.

## Getting Started

Navigate to the app directory for complete setup instructions:

```bash
cd app
```

See the [app/README.md](app/README.md) file for detailed instructions on:

- Setting up your environment
- Configuring API keys
- Running the agent
- Testing different capabilities

## Features Demonstrated

- ✅ **Tool Integration**: Integration with external APIs (Firecrawl, OpenAI) to extend the agent's capabilities
- ✅ **Multi-Agent Architecture**: Specialized agents for different tasks coordinated by a root agent
- ✅ **Automatic Delegation**: Intelligent routing of requests to the appropriate specialized agent
- ✅ **Content Processing**: Handling of different content types (text, images) in responses
- ✅ **Safety Mechanisms**: Content filtering to prevent harmful requests

## Resources

- [ADK Documentation](https://google.github.io/adk-docs/)
- [ADK GitHub Repository](https://github.com/google/adk)
- [Firecrawl Documentation](https://www.firecrawl.dev)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Gemini API Documentation](https://ai.google.dev/gemini-api)
