# Weather Agent Team

This project demonstrates a multi-agent system built using Google's Agent Development Kit (ADK). It implements a Weather Bot that can:

- Provide weather information for cities
- Display current time in supported cities
- Handle greetings and farewells through specialized sub-agents
- Remember user preferences (temperature unit: Celsius/Fahrenheit)
- Apply safety guardrails for both input messages and tool usage

## Project Structure

```
app/
├── .env                    # API key configuration
├── main.py                 # Runner application
└── weather_agent_team/     # Agent package
    ├── __init__.py         # Package marker
    └── agent.py            # Agent definitions and tools
```

## Prerequisites

- Python 3.9+
- [Google AI Studio API Key](https://aistudio.google.com/app/apikey) for Gemini models
- (Optional) API keys for OpenAI and/or Anthropic models

## Setup Instructions

1. Create a virtual environment (recommended):

   ```
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install the required packages:

   ```
   pip install google-adk litellm python-dotenv
   ```

3. Configure your API keys:
   - Edit the `.env` file and replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key
   - If you want to use OpenAI or Anthropic models, uncomment and configure those API keys as well

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

Then open the URL (typically <http://localhost:8000>) in your browser and select "weather_agent_team" from the dropdown.

## Testing the Agent

Try the following types of queries:

- **Weather queries**: "What's the weather in London?", "Weather in New York", etc.
- **Time queries**: "What time is it in New York?"
- **Greetings**: "Hello", "Hi there", etc. (will be delegated to greeting_agent)
- **Farewells**: "Goodbye", "Bye", etc. (will be delegated to farewell_agent)
- **Testing guardrails**:
  - Input blocking: Include "BLOCK" in your message
  - Tool argument blocking: Ask about weather in "Paris"

## Extending the Agent

Here are some ideas to extend this project:

- Connect to a real weather API
- Add more specialized sub-agents
- Implement additional safety guardrails
- Create a web interface using FastAPI
- Add streaming support

## License

This project is for educational purposes.
