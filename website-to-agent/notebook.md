# Comprehensive Tutorial on OpenAI's New Agents SDK

## Introduction

The field of artificial intelligence is shifting from systems that simply respond to queries toward those that can act independently. OpenAI's new Agents SDK is at the forefront of this trend, providing developers with a practical framework for building AI applications that make decisions and perform actions on their own. This toolkit represents the next evolution in AI development, where systems don't just answer questions but actively solve problems.

The [Agents SDK](https://openai.github.io/openai-agents-python/) combines large language models with the ability to use tools and coordinate between specialized agents. Built with Python, it offers a balance between simplicity and power - using just a few core concepts like agents, tools, handoffs, and guardrails. This approach makes it accessible to developers who want to create sophisticated AI systems without managing the complex underlying mechanics of agent behavior.

In this tutorial, we'll explore how to build practical applications with the OpenAI Agents SDK. Starting with basic agent creation, we'll progress to implementing tools, coordinating multiple agents, and ensuring safety through guardrails. The knowledge gained will enable you to develop AI systems that can handle various tasks, providing you with skills relevant to current AI development approaches.

## Prerequisites for Working with OpenAI Agents SDK

Before diving into the OpenAI Agents SDK, it's important to understand several foundational concepts and set up your environment correctly. This section covers everything you need to know before writing your first agent.

### Required knowledge

To get the most out of this tutorial, you should be comfortable with:

- **Intermediate Python programming**: You should understand functions, classes, async/await patterns, and type hints
- **Basic OpenAI API usage**: Familiarity with sending requests to OpenAI models and handling responses
- **Large language models (LLMs)**: Understanding of how LLMs work conceptually and their capabilities/limitations
- **Pydantic**: Basic knowledge of using Pydantic for data validation will be helpful, as the Agents SDK uses it extensively
- **Asynchronous programming**: Familiarity with `async`/`await` patterns in Python, as the Agents SDK is built around asynchronous execution


If you need to strengthen your knowledge in some of these areas, DataCamp offers several excellent resources:

- [Working with the OpenAI API](https://www.datacamp.com/courses/working-with-the-openai-api) - Learn the fundamentals of interacting with OpenAI's models
- [OpenAI Fundamentals Track](https://www.datacamp.com/tracks/openai-fundamentals) - A comprehensive learning path for OpenAI technologies
- [GPT-4-5 overview](https://www.datacamp.com/blog/gpt-4-5) - Learn about the latest capabilities of GPT models
- [Function calling with GPT-4-5](https://www.datacamp.com/tutorial/gpt-4-5-function-calling) - Essential background for understanding tool usage in agents
- [Using the GPT-4-5 API](https://www.datacamp.com/tutorial/gpt-4-5-api) - Practical guide to working with advanced models

### Key concepts for agents

Before we start coding, let's clarify a few key concepts that are central to the Agents SDK:

1. **Agents**: AI systems that can use tools and make decisions to accomplish tasks
2. **Tools**: Functions that agents can call to perform actions like searching the web or accessing databases
3. **Handoffs**: Mechanisms for transferring control between specialized agents
4. **Guardrails**: Safety measures that validate inputs and outputs to ensure appropriate behavior

Understanding these concepts and their relationships will help you build more effective agent-based applications.

## Environment setup

Let's set up our development environment with everything needed to work with the OpenAI Agents SDK:

### Installing required packages

First, create and activate a virtual environment:

```python
# Create and activate a virtual environment (run in your terminal)
python -m venv agents-env
source agents-env/bin/activate  # On Windows: agents-env\Scripts\activate
```

Next, install the OpenAI Agents SDK and python-dotenv:

```python
pip install openai-agents python-dotenv
```

### Using python-dotenv for API key management

When working with API keys, it's a best practice to keep them out of your code. The `python-dotenv` package provides a secure way to manage environment variables:

1. Create a file named `.env` in your project directory
2. Add your OpenAI API key to this file:

```
OPENAI_API_KEY=your-api-key-here
```

3. Load and use the environment variables in your code:

```python
import os
from dotenv import load_dotenv
from agents import Agent, Runner

# Load environment variables from .env file
load_dotenv()

# Access your API key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in .env file")
```

This approach keeps sensitive information out of your code, which is especially important if you're sharing or publishing your work.

### Working with async functions

The OpenAI Agents SDK uses asynchronous programming extensively. Here's how to work with async functions in different environments:

#### In Python scripts (.py files)

In regular Python scripts, you'll need to use `asyncio.run()` to execute async functions:

```python
import asyncio
from agents import Agent, Runner

async def main():
    agent = Agent(
        name="Test Agent",
        instructions="You are a helpful assistant that provides concise responses."
    )
    result = await Runner.run(agent, "Hello! Are you working correctly?")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())  # Run the async function
```

#### In Jupyter notebooks

Jupyter notebooks already have an event loop running, so you should NOT use `asyncio.run()`. Instead, you can await async functions directly:

```python
from agents import Agent, Runner

# No need for asyncio.run() in notebooks
agent = Agent(
    name="Test Agent",
    instructions="You are a helpful assistant that provides concise responses."
)
result = await Runner.run(agent, "Hello! Are you working correctly?")
print(result.final_output)
```

If you try to use `asyncio.run()` in a notebook, you'll encounter errors like:

```plaintext
RuntimeError: asyncio.run() cannot be called from a running event loop
```

This is one of the most common adjustments you'll need to make when copying code between scripts and notebooks. Throughout this tutorial, I'll primarily use the notebook-friendly syntax since most readers will be using Jupyter.

### Testing your installation

Let's make sure everything is set up correctly:


```python
from agents import Agent, Runner
from dotenv import load_dotenv

load_dotenv()

# For Jupyter notebooks:
agent = Agent(
    name="Test Agent",
    instructions="You are a helpful assistant that provides concise responses."
)
result = await Runner.run(agent, "Hello! Are you working correctly?")
print(result.final_output)

# For Python scripts, you'd use:
# async def test_installation():
#     agent = Agent(
#         name="Test Agent",
#         instructions="You are a helpful assistant that provides concise responses."
#     )
#     result = await Runner.run(agent, "Hello! Are you working correctly?")
#     print(result.final_output)
#
# if __name__ == "__main__":
#     asyncio.run(test_installation())
```

    Hello! Yes, I'm here and ready to help. How can I assist you today?


With this setup complete, you're ready to begin building applications with the OpenAI Agents SDK.

## Getting Started with Agents

At the heart of the OpenAI Agents SDK is the `Agent` class, which serves as your primary interface for creating AI systems that can understand and act upon instructions. Let's explore how to create and configure agents for different scenarios.

An agent in this SDK represents an AI system capable of following instructions and, optionally, using tools to accomplish tasks. Creating a basic agent requires just a few essential parameters:


```python
from agents import Agent

basic_agent = Agent(
    name="My First Agent",
    instructions="You are a helpful assistant that provides factual information.",
    model="gpt-4o"  # Optional: defaults to "gpt-4o" if not specified
)
```

The three primary components of an agent are:

1. **Name**: An identifier for your agent that helps with logging and debugging
2. **Instructions**: The core "system prompt" that defines the agent's behavior and purpose
3. **Model**: The underlying language model powering the agent (defaults to GPT-4o)

While this basic setup is enough to get started, the `Agent` class offers several additional model configuration options that give you more control over LLM's behavior:


```python
from agents import ModelSettings


advanced_agent = Agent(
    name="Advanced Assistant",
    instructions="""You are a professional, concise assistant who always provides 
    accurate information. When you don't know something, clearly state that. 
    Focus on giving actionable insights when answering questions.""",
    model="gpt-4o",
    model_settings=ModelSettings(
        temperature=0.3,  # Lower for more deterministic outputs (0.0-2.0)
        max_tokens=1024,  # Maximum length of response
    ),
    tools=[]  # We'll cover tools in a later section
)
```

### Instructions and Configuration

The instructions parameter is perhaps the most important aspect of agent design. It functions as a "system prompt" that guides the agent's behavior, tone, and capabilities. Writing effective instructions is both an art and a science:

#### Best practices for writing instructions

1. **Be specific**: Clearly define the agent's role, personality, and limitations
2. **Set boundaries**: Explicitly state what topics or actions the agent should avoid
3. **Define interaction patterns**: Explain how the agent should handle various types of inputs
4. **Establish knowledge boundaries**: Clarify what the agent should know and when it should acknowledge uncertainty

The `Agent` also includes a `description` parameter, which is a human-readable description of the agent, used when the agent is used inside tools/handoffs.

#### Configuration Options

Beyond instructions, you can fine-tune agent behavior using several configuration parameters:

- **temperature**: Controls randomness in responses (0.0-2.0)
  - Lower values (0.1-0.4) produce more deterministic, focused responses
  - Higher values (0.7-1.0) create more creative, varied outputs
  
- **max_tokens**: Limits the length of agent responses
  - Useful for ensuring concise outputs or controlling costs
  - The default varies by model but is typically high enough for most use cases
  
- **model**: Selects the underlying LLM
  - "gpt-4o" offers the best performance for most use cases
  - "gpt-4o-mini" provides a good balance of performance and cost
  - "gpt-3.5-turbo" is available for less complex tasks where speed and cost are priorities

These configuration options provide a powerful framework for customizing agent behavior to suit a wide range of applications. We encourage you to experiment with different settings to discover how they affect your agent's responses and find the optimal configuration for your specific use case.

### Building a Specialized Weather Assistant

Now let's bring these concepts together by building a practical example: a specialized weather information assistant. This example demonstrates how to create an agent with well-defined expertise, capabilities, and limitations:


```python
from agents import Agent, Runner
from dotenv import load_dotenv

# Load environment variables (API key)
load_dotenv()

# Define detailed instructions for our weather assistant
weather_instructions = """
You are a weather information assistant who helps users understand weather patterns and phenomena.

YOUR EXPERTISE:
- Explaining weather concepts and terminology
- Describing how different weather systems work
- Answering questions about climate and seasonal patterns
- Explaining the science behind weather events

LIMITATIONS:
- You cannot provide real-time weather forecasts for specific locations
- You don't have access to current weather data
- You should not make predictions about future weather events

STYLE:
- Use clear, accessible language that non-meteorologists can understand
- Include interesting weather facts when relevant
- Be enthusiastic about meteorology and climate science
"""

# Create our specialized weather assistant
weather_assistant = Agent(
    name="WeatherWise",
    instructions=weather_instructions,
    model="gpt-3.5-turbo",
    model_settings=ModelSettings(
        temperature=0.5,  # Balanced temperature for natural but focused responses
        max_tokens=256,  # Maximum length of response
    )
)
```

### Running Your First Agent

Once you've created an agent, you can run it using the `Runner` class. This class handles the execution of agent tasks and manages the conversation flow:


```python
# For Jupyter notebooks:
result = await Runner.run(
    weather_assistant, "Can you tell me about the relationship between climate change and extreme weather events?"
)

print(result.final_output)
```

    Absolutely! Climate change is closely linked to the increase in frequency and intensity of extreme weather events. As the Earth's climate warms due to the buildup of greenhouse gases in the atmosphere, it disrupts the balance of our planet's climate systems.
    
    Here's how climate change influences extreme weather events:
    1. **Heatwaves**: Rising global temperatures lead to more frequent and severe heatwaves. These events can have serious impacts on human health, agriculture, and ecosystems.
    
    2. **Intense Storms**: Warmer oceans provide more energy to fuel hurricanes, typhoons, and other tropical storms, leading to stronger and more destructive events.
    
    3. **Heavy Rainfall**: A warmer atmosphere can hold more moisture, resulting in heavier rainfall during storms. This can lead to flooding and landslides.
    
    4. **Droughts**: Climate change can exacerbate drought conditions in certain regions, impacting water resources, agriculture, and ecosystems.
    
    5. **Wildfires**: Higher temperatures and drier conditions increase the likelihood of wildfires, which can be more frequent and intense.
    
    It's important to note that while climate change doesn't directly cause specific weather events, it can increase the likelihood and severity of extreme weather occurrences. Scientists continue to study these connections to better understand and prepare for the impacts of


For Python scripts, you would need to use the `asyncio` approach:

```python
# For Python scripts:
import asyncio

async def run_agent_example():
    result = await Runner.run(weather_assistant, "Can you tell me about the relationship between climate change and extreme weather events?")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(run_agent_example())
```

In this section, we've covered the fundamentals of creating and running agents with the OpenAI Agents SDK. In the next section, we'll expand on these concepts by adding tools to our agents, which will significantly enhance their capabilities.

## Working with Tools

The real power of the OpenAI Agents SDK emerges when you equip your agents with tools. Tools enable agents to interact with external systems, access data, and perform actions that extend beyond simple text generation. The Agents SDK supports three main types of tools: hosted tools, function tools, and agents as tools.

### Hosted tools

Hosted tools run on OpenAI's servers alongside the language models. These tools provide built-in capabilities without requiring you to implement complex functionality.



#### WebSearchTool: Building a research assistant

The `WebSearchTool` gives your agent the ability to search the web for up-to-date information. This is particularly valuable for tasks requiring current knowledge beyond the model's training data.




```python
from agents import Agent, Runner, WebSearchTool
from dotenv import load_dotenv

load_dotenv()

# Create a research assistant with web search capability
research_assistant = Agent(
    name="Research Assistant",
    instructions="""You are a research assistant that helps users find and summarize information.
    When asked about a topic:
    1. Search the web for relevant, up-to-date information
    2. Synthesize the information into a clear, concise summary
    3. Structure your response with headings and bullet points when appropriate
    4. Always cite your sources at the end of your response
    
    If the information might be time-sensitive or rapidly changing, mention when the search was performed.
    """,
    tools=[WebSearchTool()]
)

async def research_topic(topic):
    result = await Runner.run(research_assistant, f"Please research and summarize: {topic}. Only return the found links with very minimal text.")
    return result.final_output

# Usage example (in Jupyter notebook)
summary = await research_topic("Latest developments in personal productivity apps.")
print(summary[:512])

```

    OPENAI_API_KEY is not set, skipping trace export
    OPENAI_API_KEY is not set, skipping trace export
    OPENAI_API_KEY is not set, skipping trace export
    OPENAI_API_KEY is not set, skipping trace export
    OPENAI_API_KEY is not set, skipping trace export
    OPENAI_API_KEY is not set, skipping trace export
    OPENAI_API_KEY is not set, skipping trace export


    Here are some recent developments in personal productivity apps:
    
    - **AI Integration in Productivity Tools**: Startups like Anthropic are developing AI agents capable of performing routine tasks across different applications, aiming to streamline workflows and reduce the need for multiple apps. ([ft.com](https://www.ft.com/content/a0e54dd5-b270-42cc-8c4c-18a0b8b3e6cc?utm_source=openai))
    
    - **Read AI's Expansion**: Read AI, a productivity startup, secured $50 million in funding, valuing the company at $450 m


In this example, we've created a research assistant that can search the web and synthesize information into a coherent summary. The `WebSearchTool` doesn't require any parameters to function, but you can customize its behavior as needed:




```python
# Customized search tool with location context
location_aware_search = WebSearchTool(
    user_location="San Francisco, CA",  # Provides geographic context for local search queries
    search_context_size=3  # Number of search results to consider in the response
)
```

The `user_location` parameter is particularly useful for queries that benefit from geographic context, such as local services or regional information. The `search_context_size` parameter helps control how many search results the model considers when formulating its response.

### Function tools

Function tools allow you to extend your agent with any Python function. This is where the real flexibility of the Agents SDK shines, enabling integration with any API, database, or local service.

#### Weather forecast tool

Let's create a practical example that integrates with a third-party weather API:



```python
import os
import requests
from datetime import datetime
from typing import Optional, List
from dataclasses import dataclass

from agents import Agent, Runner, function_tool
from dotenv import load_dotenv

load_dotenv()


@dataclass
class WeatherInfo:
    temperature: float
    feels_like: float
    humidity: int
    description: str
    wind_speed: float
    pressure: int
    location_name: str
    rain_1h: Optional[float] = None
    visibility: Optional[int] = None


@function_tool
def get_weather(lat: float, lon: float) -> str:
    """Get the current weather for a specified location using OpenWeatherMap API.

    Args:
        lat: Latitude of the location (-90 to 90)
        lon: Longitude of the location (-180 to 180)
    """
    # Get API key from environment variables
    WEATHER_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")

    # Build URL with parameters
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        # Extract weather data from the response
        weather_info = WeatherInfo(
            temperature=data["main"]["temp"],
            feels_like=data["main"]["feels_like"],
            humidity=data["main"]["humidity"],
            description=data["weather"][0]["description"],
            wind_speed=data["wind"]["speed"],
            pressure=data["main"]["pressure"],
            location_name=data["name"],
            visibility=data.get("visibility"),
            rain_1h=data.get("rain", {}).get("1h"),
        )

        # Build the response string
        weather_report = f"""
        Weather in {weather_info.location_name}:
        - Temperature: {weather_info.temperature}°C (feels like {weather_info.feels_like}°C)
        - Conditions: {weather_info.description}
        - Humidity: {weather_info.humidity}%
        - Wind speed: {weather_info.wind_speed} m/s
        - Pressure: {weather_info.pressure} hPa
        """
        return weather_report

    except requests.exceptions.RequestException as e:
        return f"Error fetching weather data: {str(e)}"
```

This weather API function tool serves as a bridge between the OpenWeatherMap API and our agent. It fetches real-time weather data by geographic coordinates and formats it into a readable report. The code defines a `WeatherInfo` dataclass to structure the data with typed fields (temperature, humidity, etc.), making it organized and maintainable. The `@function_tool` decorator transforms our Python function into a tool the agent can use, automatically creating a schema from the function's signature and docstring.

When called, the function securely retrieves an API key from environment variables, makes an HTTP request to OpenWeatherMap, and processes the JSON response. It handles optional data fields like rainfall safely and formats everything into a clear weather report, including error handling if the API request fails. This allows our agent to provide current weather information in a consistent, human-readable format without needing to understand API details.


```python
# Create a weather assistant
weather_assistant = Agent(
    name="Weather Assistant",
    instructions="""You are a weather assistant that can provide current weather information.
    
    When asked about weather, use the get_weather tool to fetch accurate data.
    If the user doesn't specify a country code and there might be ambiguity, 
    ask for clarification (e.g., Paris, France vs. Paris, Texas).
    
    Provide friendly commentary along with the weather data, such as clothing suggestions
    or activity recommendations based on the conditions.
    """,
    tools=[get_weather]
)
```

To run the weather assistant:


```python
async def main():
    runner = Runner()
    
    simple_request = await runner.run(weather_assistant, "What are your capabilities?")
    
    request_with_location = await runner.run(weather_assistant, "What's the weather like in Tashkent right now?")
    
    print(simple_request.final_output)
    print("-"*70)
    print(request_with_location.final_output)

await main()
```

    I can provide you with the current weather conditions for any location around the world. Just give me the location details, and I'll fetch the weather data for you. I can also offer tips on activities or clothing based on the weather. If you have a specific city in mind, let me know, and I'll get to work!
    ----------------------------------------------------------------------
    The weather in Tashkent is currently lovely with a clear sky. It's around 19.8°C, but it might feel slightly cooler at 18.6°C. The humidity is quite low at 26%, making it a pleasant day to be outdoors. A gentle breeze is blowing at 3.09 m/s, and the air pressure is steady at 1023 hPa.
    
    It's a great time for a picnic in the park or a leisurely walk. Light clothing should be perfect for this weather. Enjoy your day in Tashkent!


The response proves that the agent used the weather tool successfully. It isolated the city name from the prompt, used its own knowledge base to get its coordinates and passed them as `lat` and `lon` to the tool. 

### Agents as tools

The Agents SDK allows you to use agents themselves as tools, enabling a hierarchical structure where specialist agents work under a coordinator. This is a powerful pattern for complex workflows.


```python
from agents import Agent, Runner
from dotenv import load_dotenv

load_dotenv()

# Specialist agents
note_taking_agent = Agent(
    name="Note Manager",
    instructions="You help users take and organize notes efficiently.",
    # In a real application, this agent would have note-taking tools
)

task_management_agent = Agent(
    name="Task Manager",
    instructions="You help users manage tasks, deadlines, and priorities.",
    # In a real application, this agent would have task management tools
)

# Coordinator agent that uses specialists as tools
productivity_assistant = Agent(
    name="Productivity Assistant",
    instructions="""You are a productivity assistant that helps users organize their work and personal life.
    
    For note-taking questions or requests, use the note_taking tool.
    For task and deadline management, use the task_management tool.
    
    Help the user decide which tool is appropriate based on their request,
    and coordinate between different aspects of productivity.
    """,
    tools=[
        note_taking_agent.as_tool(
            tool_name="note_taking",
            tool_description="For taking, organizing, and retrieving notes and information"
        ),
        task_management_agent.as_tool(
            tool_name="task_management",
            tool_description="For managing tasks, setting deadlines, and tracking priorities"
        )
    ]
)

```

In this example:

1. We create two specialist agents, each with a focused domain of expertise
2. We then create a coordinator agent that can delegate to these specialists
3. We convert each specialist agent into a tool using the `.as_tool()` method, specifying:
   - A `tool_name` that the coordinator will use to reference the tool
   - A `tool_description` that helps the coordinator understand when to use this tool

This pattern allows you to create complex agent systems while maintaining separation of concerns. Each specialist agent can have its own set of tools and expertise, while the coordinator manages the user interaction and delegates to the appropriate specialist.

To use the productivity assistant:




```python
async def main():
    runner = Runner()
    
    result = await runner.run(productivity_assistant, "I need to keep track of my project deadlines")
    print(result.final_output)

await main()
```

Tools transform agents from simple conversational assistants into powerful systems capable of taking meaningful actions in the world. While we've covered the basics of creating and using tools, this is just the beginning of what's possible. For more advanced usage, including error handling in function tools, refer to the [official documentation](https://openai.github.io/openai-agents-python/tools/#handling-errors-in-function-tools).

Now that we understand how to equip our agents with tools, the next challenge is handling and structuring their outputs. In the next section, we'll explore techniques for processing agent responses, from basic text outputs to complex structured data, ensuring we get the exact information format our applications need.


## Understanding Agent Outputs

When working with agents, getting structured information rather than free-form text can make your applications more reliable. The OpenAI Agents SDK provides a clean, built-in way to receive structured outputs directly from agents.

### Structured outputs with Pydantic models

The SDK allows you to define exactly what data structure you want your agent to return by specifying an `output_type` parameter when creating an agent:


```python
from pydantic import BaseModel
from typing import List, Optional
from agents import Agent, Runner
from dotenv import load_dotenv

load_dotenv()

```




    True



First, we define our data models using Pydantic:


```python
# Define person data model
class Person(BaseModel):
    name: str
    role: Optional[str]
    contact: Optional[str]


# Define meeting data model
class Meeting(BaseModel):
    date: str
    time: str
    location: Optional[str]
    duration: Optional[str]


# Define task data model
class Task(BaseModel):
    description: str
    assignee: Optional[str]
    deadline: Optional[str]
    priority: Optional[str]


# Define the complete email data model
class EmailData(BaseModel):
    subject: str
    sender: Person
    recipients: List[Person]
    main_points: List[str]
    meetings: List[Meeting] 
    tasks: List[Task] 
    next_steps: Optional[str]
```

These models define the structure we want our extracted data to follow. Each class represents a specific type of information we want to extract from an email.

Now, we create an agent that will output data in our structured format by setting the `output_type` parameter:


```python
# Create an email extraction agent with structured output
email_extractor = Agent(
    name="Email Extractor",
    instructions="""You are an assistant that extracts structured information from emails.
    
    When given an email, carefully identify:
    - Subject and main points
    - People mentioned (names, roles, contact info)
    - Meetings (dates, times, locations)
    - Tasks or action items (with assignees and deadlines)
    - Next steps or follow-ups
    
    Extract this information as structured data. If something is unclear or not mentioned,
    leave those fields empty rather than making assumptions.
    """,
    output_type=EmailData,  # This tells the agent to return data in EmailData format
)
```

When you specify the `output_type`, the agent will automatically produce structured data instead of plain text responses. This eliminates the need for manual JSON parsing or regex extraction.

Let's use this extractor with a sample email:


```python
sample_email = """
From: Alex Johnson <alex.j@techcorp.com>
To: Team Development <team-dev@techcorp.com>
CC: Sarah Wong <sarah.w@techcorp.com>, Miguel Fernandez <miguel.f@techcorp.com>
Subject: Project Phoenix Update and Next Steps

Hi team,

I wanted to follow up on yesterday's discussion about Project Phoenix and outline our next steps.

Key points from our discussion:
- The beta testing phase has shown promising results with 85% positive feedback
- We're still facing some performance issues on mobile devices
- The client has requested additional features for the dashboard

Let's schedule a follow-up meeting this Friday, June 15th at 2:00 PM in Conference Room B. The meeting should last about 1.5 hours, and we'll need to prepare the updated project timeline.

Action items:
1. Sarah to address the mobile performance issues by June 20th (High priority)
2. Miguel to create mock-ups for the new dashboard features by next Monday
3. Everyone to review the beta testing feedback document and add comments by EOD tomorrow

If you have any questions before Friday's meeting, feel free to reach out.

Best regards,
Alex Johnson
Senior Project Manager
(555) 123-4567
"""
```

Now processing the email becomes much simpler because the SDK handles the conversion:


```python
async def process_email(email_text):
    runner = Runner()
    result = await runner.run(
        email_extractor,
        f"Please extract information from this email:\n\n{email_text}"
    )

    # The result is already a structured EmailData object
    return result


# Process the sample email
result = await process_email(sample_email)

# Display the extracted information
result = result.final_output

print(f"Subject: {result.subject}")
print(f"From: {result.sender.name} ({result.sender.role})")
print("\nMain points:")
for point in result.main_points:
    print(f"- {point}")

print("\nMeetings:")
for meeting in result.meetings:
    print(f"- {meeting.date} at {meeting.time}, Location: {meeting.location}")

print("\nTasks:")
for task in result.tasks:
    print(f"- {task.description}")
    print(
        f"  Assignee: {task.assignee}, Deadline: {task.deadline}, Priority: {task.priority}"
    )
```

    Subject: Project Phoenix Update and Next Steps
    From: Alex Johnson (Senior Project Manager)
    
    Main points:
    - 85% positive feedback from beta testing
    - Performance issues on mobile devices
    - Client requested additional dashboard features
    
    Meetings:
    - June 15th at 2:00 PM, Location: Conference Room B
    
    Tasks:
    - Address mobile performance issues
      Assignee: Sarah, Deadline: June 20th, Priority: High
    - Create mock-ups for new dashboard features
      Assignee: Miguel, Deadline: Next Monday, Priority: None
    - Review beta testing feedback document and add comments
      Assignee: Everyone, Deadline: EOD tomorrow, Priority: None


This code is much cleaner than our earlier approach because:
1. We don't need to manually extract and parse JSON from the response
2. The SDK handles the conversion from the agent's output to our Pydantic model
3. We can directly access the structured data properties (like `result.final_output.subject`)
4. Type validation happens automatically, so we know the data matches our model

### Working with different output types
The `output_type` parameter works with any type that can be wrapped in a Pydantic `TypeAdapter`:


```python
# For simple lists
agent_with_list_output = Agent(
    name="List Generator",
    instructions="Generate lists of items based on the user's request.",
    output_type=list[str],  # Returns a list of strings
)

# For dictionaries
agent_with_dict_output = Agent(
    name="Dictionary Generator",
    instructions="Create key-value pairs based on the input.",
    output_type=dict[
        str, int
    ],  # Returns a dictionary with string keys and integer values
)

# For simple primitive types
agent_with_bool_output = Agent(
    name="Decision Maker",
    instructions="Answer yes/no questions with True or False.",
    output_type=bool,  # Returns a boolean
)
```

### Benefits of structured outputs

Using the `output_type` parameter offers several advantages:

1. Direct integration: Your agent outputs are automatically available as Python objects
2. Type safety: The SDK ensures that outputs match your defined structure
3. Simpler code: No need for manual JSON parsing or error handling
4. Better performance: The SDK handles the conversion efficiently
5. IDE support: Your IDE can provide autocompletion for the structured output properties

By defining clear data models and using the `output_type` parameter, your agents can produce exactly the data structures your application needs, making integration seamless and reducing the complexity of your code.

In the next section, we'll explore handoffs between agents, allowing you to create specialized agents that can work together on complex tasks. These handoffs can use structured outputs to pass information between agents in a consistent, type-safe manner.

## Handoffs: Delegating Between Agents

In complex applications, different tasks often require different areas of expertise. The OpenAI Agents SDK supports "handoffs," which allow one agent to delegate control to another specialized agent. This feature is particularly valuable when building systems that handle diverse user requests, such as customer support applications where different agents might handle billing inquiries, technical support, or account management.

### Creating basic handoffs

At its simplest, handoffs allow you to connect multiple agents so they can transfer control when appropriate. Let's create a simple customer service system with a triage agent that can hand off to specialists:

```python
from agents import Agent, handoff, Runner
from dotenv import load_dotenv

load_dotenv()

# Create specialist agents
billing_agent = Agent(
    name="Billing Agent",
    instructions="""You are a billing specialist who helps customers with payment issues.
    Focus on resolving billing inquiries, subscription changes, and refund requests.
    If asked about technical problems or account settings, explain that you specialize
    in billing and payment matters only.""",
)

technical_agent = Agent(
    name="Technical Agent",
    instructions="""You are a technical support specialist who helps with product issues.
    Assist users with troubleshooting, error messages, and how-to questions.
    Focus on resolving technical problems only.""",
)

# Create a triage agent that can hand off to specialists
triage_agent = Agent(
    name="Customer Service",
    instructions="""You are the initial customer service contact who helps direct
    customers to the right specialist.
    
    If the customer has billing or payment questions, hand off to the Billing Agent.
    If the customer has technical problems or how-to questions, hand off to the Technical Agent.
    For general inquiries or questions about products, you can answer directly.
    
    Always be polite and helpful, and ensure a smooth transition when handing off to specialists.""",
    handoffs=[billing_agent, technical_agent],  # Direct handoff to specialist agents
)
```

In this example, we've created a system with three agents:

- Two specialist agents with focused expertise
- One triage agent that can delegate to the specialists

Notice how we simply include the specialist agents in the `handoffs` parameter of the triage agent. The Agents SDK automatically creates appropriate handoff tools that the triage agent can use when needed.

Let's see the system in action:

```python
async def handle_customer_request(request):
    runner = Runner()
    result = await runner.run(triage_agent, request)
    return result


# Example customer inquiries
billing_inquiry = (
    "I was charged twice for my subscription last month. Can I get a refund?"
)
technical_inquiry = (
    "The app keeps crashing when I try to upload photos. How can I fix this? Give me the shortest solution possible."
)
general_inquiry = "What are your business hours?"

# Process the different types of inquiries
billing_response = await handle_customer_request(billing_inquiry)
print(f"Billing inquiry response:\n{billing_response.final_output}\n")

technical_response = await handle_customer_request(technical_inquiry)
print(f"Technical inquiry response:\n{technical_response.final_output}\n")

general_response = await handle_customer_request(general_inquiry)
print(f"General inquiry response:\n{general_response.final_output}")
```

When the triage agent receives a billing question, it will recognize that the Billing Agent is better suited to handle it and will invoke a handoff. For technical questions, it will hand off to the Technical Agent. For general questions within its capabilities, it will answer directly. Here is the output:

```plaintext
Billing inquiry response:
I can help with that. Could you please provide the transaction details or the date of the charges? This will help me locate the duplicate charge and process a refund for you.

Technical inquiry response:
Try these steps:

1. Restart the app.
2. Update to the latest app version.
3. Clear the app cache.
4. Restart your device.

If it persists, reinstall the app.

General inquiry response:
Our business hours are Monday to Friday, 9 AM to 5 PM. If you need assistance outside these hours, feel free to reach out and we'll get back to you as soon as possible. Is there anything else I can help you with?
```

### Customizing handoffs

For more control over handoffs, you can use the `handoff()` function instead of passing agents directly to the `handoffs` parameter:

```python
from agents import Agent, handoff, RunContextWrapper
from datetime import datetime

# Create an agent that handles account-related questions
account_agent = Agent(
    name="Account Management",
    instructions="""You help customers with account-related issues such as
    password resets, account settings, and profile updates.""",
)


# Custom handoff callback function
async def log_account_handoff(ctx: RunContextWrapper[None]):
    print(
        f"[LOG] Account handoff triggered at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    # In a real app, you might log to a database or alert a human supervisor


# Create a triage agent with customized handoffs
enhanced_triage_agent = Agent(
    name="Enhanced Customer Service",
    instructions="""You are the initial customer service contact who directs
    customers to the right specialist.
    
    If the customer has billing or payment questions, hand off to the Billing Agent.
    If the customer has technical problems, hand off to the Technical Agent.
    If the customer needs to change account settings, hand off to the Account Management agent.
    For general inquiries, you can answer directly.""",
    handoffs=[
        billing_agent,  # Basic handoff
        handoff(  # Customized handoff
            agent=account_agent,
            on_handoff=log_account_handoff,  # Callback function
            tool_name_override="escalate_to_account_team",  # Custom tool name
            tool_description_override="Transfer the customer to the account management team for help with account settings, password resets, etc.",
        ),
        technical_agent,  # Basic handoff
    ],
)

result = await Runner.run(
    enhanced_triage_agent, "I need to change my password."
)
```

Output:

```plaintext
[LOG] Account handoff triggered at 2025-03-16 17:45:48
```

The `handoff()` function allows you to:

- Specify a custom callback with `on_handoff`
- Override the default tool name (normally "transfer_to_[agent_name]")
- Provide a custom tool description
- Configure input handling (more on this below)

### Passing data during handoffs

Sometimes, you want the first agent to provide additional context or metadata when handing off to another agent. The Agents SDK supports this through the `input_type` parameter:

```python
from pydantic import BaseModel
from typing import Optional
from agents import Agent, handoff, RunContextWrapper


# Define the data structure to pass during handoff
class EscalationData(BaseModel):
    reason: str
    priority: Optional[str]
    customer_tier: Optional[str]


# Handoff callback that processes the escalation data
async def process_escalation(ctx: RunContextWrapper, input_data: EscalationData):
    print(f"[ESCALATION] Reason: {input_data.reason}")
    print(f"[ESCALATION] Priority: {input_data.priority}")
    print(f"[ESCALATION] Customer tier: {input_data.customer_tier}")

    # You might use this data to prioritize responses, alert human agents, etc.


# Create an escalation agent
escalation_agent = Agent(
    name="Escalation Agent",
    instructions="""You handle complex or sensitive customer issues that require
    special attention. Always address the customer's concerns with extra care and detail.""",
)

# Create a service agent that can escalate with context
service_agent = Agent(
    name="Service Agent",
    instructions="""You are a customer service agent who handles general inquiries.
    
    For complex issues, escalate to the Escalation Agent and provide:
    - The reason for escalation
    - Priority level (Low, Normal, High, Urgent)
    - Customer tier if mentioned (Standard, Premium, VIP)""",
    handoffs=[
        handoff(
            agent=escalation_agent,
            on_handoff=process_escalation,
            input_type=EscalationData,
        )
    ],
)
```

With this setup, when the service agent decides to hand off to the escalation agent, it will provide structured data about why the escalation is happening. The system will validate this data against the `EscalationData` model before passing it to the `process_escalation` callback.

### When to use handoffs vs. agent-as-tool

The Agents SDK offers two ways for agents to work together: handoffs and using agents as tools (as we saw in the previous section). Here's when to use each approach:

Use handoffs when:

- You want to completely transfer control to another agent
- The conversation needs to continue with a specialist
- You're building a workflow where different agents handle different stages

Use agents-as-tools when:

- The primary agent needs to consult a specialist but maintain control
- You want to incorporate a specialist's response as part of a larger answer
- You're building a hierarchical system where a coordinator delegates subtasks

Both approaches can be combined in sophisticated systems, with a main agent that sometimes consults specialists (using them as tools) and sometimes hands off control completely when appropriate.

Handoffs provide a powerful mechanism for building complex agent systems where responsibility transitions between different specialists. When designing your agent architecture, consider which approach best suits your specific use case to create the most effective user experience.

## Conclusion and Next Steps

In this tutorial, we've explored the core components of the OpenAI Agents SDK, from creating basic agents to implementing function tools and managing handoffs between specialist agents. We've seen how structured outputs using Pydantic models can make our applications more reliable and maintainable, and how to design agent systems that can handle complex tasks through delegation and specialization.

However, we've only scratched the surface of what's possible with this powerful framework. For developers ready to take their agent systems to the next level, several advanced topics await exploration: [streaming responses](https://openai.github.io/openai-agents-python/streaming/) for real-time updates, [tracing and observability](https://openai.github.io/openai-agents-python/tracing/) for debugging, [multi-agent orchestration](https://openai.github.io/openai-agents-python/multi_agent/) for complex workflows, [context management](https://openai.github.io/openai-agents-python/context/) for maintaining conversation state, and [guardrails](https://openai.github.io/openai-agents-python/guardrails/) for ensuring safe and appropriate agent behavior.

As AI agents become increasingly central to modern applications, the skills you've developed through this tutorial provide a solid foundation for creating sophisticated AI systems. Continue your learning journey with resources like [DataCamp's guide to learning AI](https://www.datacamp.com/blog/how-to-learn-ai), and remember that effective agent design is as much an art as it is a science—requiring iteration, testing, and a deep understanding of both user needs and AI capabilities.

