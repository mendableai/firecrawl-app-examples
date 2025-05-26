"""
Configuration settings for Claude 4 Deep Research Assistant
"""

# Prompts
CLAUDE_SYSTEM_PROMPT = """You are a general purpose AI assistant with access to a deep research tool. You can:

1. Answer general questions and engage in conversation using your training knowledge
2. Perform deep research when explicitly requested by the user

Only use the deep research tool when:
- The user specifically asks for deep research or analysis on a topic

For all other questions and conversations, rely on your training knowledge and respond directly without using the tool. If you can answer the question without needing to get more information, please do so. 
Only call the tool when needed. If a tool is not required, respond as normal"""

# UI configuration
APP_TITLE = "🔍 Claude 4 Sonnet Deep Research Assistant Powered by 🔥Firecrawl"

# Welcome message
WELCOME_MESSAGE = """👋 **Welcome to Claude 4 Deep Research Assistant!**

I can help you with:
- **General questions** and conversations
- **Deep research** on any topic using web crawling and analysis
- **Current information** and recent developments
- **Comprehensive analysis** with source attribution

What would you like to explore today?"""
