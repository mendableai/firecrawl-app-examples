from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import InMemorySaver
from langchain.chat_models import init_chat_model

from .tools import (
    research_market_landscape,
    analyze_community_sentiment,
    assess_technical_feasibility,
)


MODEL_NAME = "openai:o4-mini"

CONVERSATIONAL_VALIDATOR_PROMPT = (
    "You are a startup validation expert chatbot. Help users validate their business ideas through conversation.\n\n"
    "CONVERSATION STYLE:\n"
    "- Be conversational and helpful, like a knowledgeable consultant\n"
    "- Ask clarifying questions when ideas are vague\n"
    "- Reference previous research naturally in ongoing conversations\n"
    "- Build comprehensive understanding over multiple questions\n\n"
    "TOOL USAGE:\n"
    "Use tools strategically based on user questions:\n"
    "- research_market_landscape(): Market size, competitors, industry analysis\n"
    "- analyze_community_sentiment(): Developer/user sentiment and discussions\n"
    "- assess_technical_feasibility(): Implementation complexity, existing solutions\n\n"
    "FULL VALIDATION:\n"
    "When users ask for 'full validation' or comprehensive analysis:\n"
    "1. Use ALL THREE tools systematically\n"
    "2. Provide structured report with market, community, and technical insights\n"
    "3. End with clear VALIDATE/NEEDS_WORK/REJECT recommendation\n\n"
    "CONVERSATIONAL Q&A:\n"
    "For specific questions, use relevant tools and give focused answers\n"
    "Build on previous research when available\n"
    "Suggest related areas to explore\n\n"
    "RESPONSE STYLE:\n"
    "- Give direct, actionable answers\n"
    "- Use data from tools to support points\n"
    "- Be encouraging but realistic about challenges\n"
    "- Reference specific sources and metrics when available"
)


def create_startup_validator_agent():
    """
    Create a conversational startup validator agent with memory.

    The agent uses three diverse tools and maintains conversation history:
    - Firecrawl for web-based market research
    - Hacker News API for community sentiment analysis
    - GitHub API for technical feasibility assessment
    """
    # Add memory checkpointer for conversation persistence
    checkpointer = InMemorySaver()

    return create_react_agent(
        model=MODEL_NAME,
        tools=[
            research_market_landscape,
            analyze_community_sentiment,
            assess_technical_feasibility,
        ],
        prompt=CONVERSATIONAL_VALIDATOR_PROMPT,
        checkpointer=checkpointer,
        name="startup_validator",
    )
