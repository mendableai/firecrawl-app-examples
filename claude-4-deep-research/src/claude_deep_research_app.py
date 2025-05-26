import streamlit as st
import anthropic
from firecrawl import FirecrawlApp
import json
import os
from dotenv import load_dotenv
import time
from typing import Dict, Any, List, Generator, Optional

# Load environment variables
load_dotenv()


# Initialize clients
@st.cache_resource
def get_anthropic_client():
    """Initialize Anthropic client with API key from environment."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        st.error(
            "Please set your ANTHROPIC_API_KEY in the environment variables or .env file"
        )
        st.stop()
    return anthropic.Anthropic(api_key=api_key)


@st.cache_resource
def get_firecrawl_client():
    """Initialize Firecrawl client with API key from environment."""
    api_key = os.getenv("FIRECRAWL_API_KEY")
    if not api_key:
        st.error(
            "Please set your FIRECRAWL_API_KEY in the environment variables or .env file"
        )
        st.stop()
    return FirecrawlApp(api_key=api_key)


# Tool definition for Firecrawl deep research
DEEP_RESEARCH_TOOL = {
    "name": "deep_research",
    "description": """Conduct comprehensive deep research on any topic using web crawling and AI analysis. 
    This tool searches the web, analyzes multiple sources, and synthesizes findings into detailed insights.
    Use this when the user asks for in-depth research, current information, or comprehensive analysis on a topic.
    The tool will return structured findings with source attribution and detailed analysis.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The research topic or question to investigate",
            },
            "max_depth": {
                "type": "integer",
                "description": "Maximum number of research iterations (1-10, default: 5)",
                "minimum": 1,
                "maximum": 10,
                "default": 5,
            },
            "time_limit": {
                "type": "integer",
                "description": "Time limit in seconds (30-300, default: 180)",
                "minimum": 30,
                "maximum": 300,
                "default": 180,
            },
            "max_urls": {
                "type": "integer",
                "description": "Maximum number of URLs to analyze (1-1000, default: 20)",
                "minimum": 1,
                "maximum": 1000,
                "default": 20,
            },
        },
        "required": ["query"],
    },
}


def execute_deep_research(
    query: str, max_depth: int = 5, time_limit: int = 180, max_urls: int = 20
) -> Dict[str, Any]:
    """Execute deep research using Firecrawl."""
    try:
        firecrawl = get_firecrawl_client()

        # Run deep research
        result = firecrawl.deep_research(
            query=query, max_depth=max_depth, time_limit=time_limit, max_urls=max_urls
        )

        return {"success": True, "data": result.get("data", {}), "query": query}

    except Exception as e:
        return {"success": False, "error": str(e), "query": query}


def get_claude_response_with_tools(
    messages: List[Dict], tools: List[Dict] = None
) -> str:
    """Get response from Claude with tool support (non-streaming for tool handling)."""
    client = get_anthropic_client()

    try:
        # Create the message request
        request_params = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 4000,
            "messages": messages,
        }

        if tools:
            request_params["tools"] = tools

        # Get response
        response = client.messages.create(**request_params)

        # Check if Claude wants to use a tool
        if response.content and len(response.content) > 0:
            for content_block in response.content:
                if content_block.type == "tool_use":
                    tool_name = content_block.name
                    tool_input = content_block.input
                    tool_id = content_block.id

                    if tool_name == "deep_research":
                        # Execute deep research
                        research_result = execute_deep_research(**tool_input)

                        # Create new messages with tool result
                        new_messages = messages + [
                            {"role": "assistant", "content": response.content},
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "tool_result",
                                        "tool_use_id": tool_id,
                                        "content": json.dumps(research_result),
                                    }
                                ],
                            },
                        ]

                        # Get final response with tool results
                        final_response = client.messages.create(
                            model="claude-3-5-sonnet-20241022",
                            max_tokens=4000,
                            messages=new_messages,
                        )

                        return (
                            final_response.content[0].text
                            if final_response.content
                            else "No response generated."
                        )

        # Return regular response if no tools used
        return (
            response.content[0].text if response.content else "No response generated."
        )

    except Exception as e:
        return f"❌ **Error:** {str(e)}"


def stream_text_response(text: str, delay: float = 0.02) -> Generator[str, None, None]:
    """Stream text character by character for typewriter effect."""
    for char in text:
        yield char
        time.sleep(delay)


def main():
    """Main Streamlit application."""
    st.set_page_config(
        page_title="Claude 4 Deep Research Assistant", page_icon="🔍", layout="wide"
    )

    # Custom CSS for better styling
    st.markdown(
        """
    <style>
    .main-header {
        text-align: center;
        padding: 1rem 0;
        border-bottom: 2px solid #f0f2f6;
        margin-bottom: 2rem;
    }
    .user-message {
        background-color: #e3f2fd;
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        border-left: 4px solid #2196f3;
    }
    .assistant-message {
        background-color: #f3e5f5;
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        border-left: 4px solid #9c27b0;
    }
    .research-status {
        background-color: #fff3e0;
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        border-left: 4px solid #ff9800;
        font-style: italic;
    }
    .footer {
        position: fixed;
        left: 0;
        bottom: 0;
        width: 100%;
        background-color: rgba(240, 242, 246, 0.9);
        color: #262730;
        text-align: center;
        padding: 3px;
        font-size: 12px;
        z-index: 999;
        border-top: 1px solid #e6e9ef;
    }
    </style>
    """,
        unsafe_allow_html=True,
    )

    # Header
    st.markdown(
        """
    <div class="main-header">
        <h1>🔍 Claude 4 Deep Research Assistant</h1>
        <p>AI Assistant with comprehensive web research capabilities powered by Firecrawl</p>
    </div>
    """,
        unsafe_allow_html=True,
    )

    # Sidebar with controls
    with st.sidebar:
        st.header("🛠️ Settings")

        # Research parameters
        st.subheader("Research Parameters")
        max_depth = st.slider(
            "Research Depth", 1, 10, 5, help="Maximum number of research iterations"
        )
        time_limit = st.slider(
            "Time Limit (seconds)", 30, 300, 180, help="Maximum time for research"
        )
        max_urls = st.slider(
            "Max URLs", 1, 100, 20, help="Maximum number of URLs to analyze"
        )

        st.divider()

        # Clear chat button
        if st.button("🗑️ Clear Chat History", use_container_width=True):
            st.session_state.messages = []
            st.rerun()

        st.divider()

        # Instructions
        st.subheader("💡 How to Use")
        st.markdown(
            """
        1. **General Questions**: Ask any question for immediate responses
        2. **Deep Research**: Request research on topics for comprehensive analysis
        3. **Current Information**: Ask about recent events or developments
        
        **Example prompts:**
        - "Research the latest developments in quantum computing"
        - "What are the current trends in renewable energy?"
        - "Analyze the impact of AI on healthcare"
        """
        )

        # API Status
        st.subheader("🔧 API Status")
        anthropic_key = (
            "✅ Connected" if os.getenv("ANTHROPIC_API_KEY") else "❌ Missing"
        )
        firecrawl_key = (
            "✅ Connected" if os.getenv("FIRECRAWL_API_KEY") else "❌ Missing"
        )
        st.write(f"Anthropic: {anthropic_key}")
        st.write(f"Firecrawl: {firecrawl_key}")

    # Initialize session state
    if "messages" not in st.session_state:
        st.session_state.messages = []
        # Add welcome message
        welcome_message = """👋 **Welcome to Claude 4 Deep Research Assistant!**

I can help you with:
- **General questions** and conversations
- **Deep research** on any topic using web crawling and analysis
- **Current information** and recent developments
- **Comprehensive analysis** with source attribution

What would you like to explore today?"""
        st.session_state.messages.append(
            {"role": "assistant", "content": welcome_message}
        )

    # Display chat history
    for message in st.session_state.messages:
        if message["role"] == "user":
            st.markdown(
                f"""
            <div class="user-message">
                <strong>You:</strong><br>
                {message["content"]}
            </div>
            """,
                unsafe_allow_html=True,
            )
        else:
            st.markdown(
                f"""
            <div class="assistant-message">
                <strong>Assistant:</strong><br>
                {message["content"]}
            </div>
            """,
                unsafe_allow_html=True,
            )

    # Chat input
    user_input = st.chat_input("Ask me anything or request deep research on a topic...")

    if user_input:
        # Add user message
        st.session_state.messages.append({"role": "user", "content": user_input})

        # Display user message
        st.markdown(
            f"""
        <div class="user-message">
            <strong>You:</strong><br>
            {user_input}
        </div>
        """,
            unsafe_allow_html=True,
        )

        # Prepare messages for Claude
        claude_messages = []
        for msg in st.session_state.messages[
            :-1
        ]:  # Exclude the welcome message for Claude
            if (
                msg["role"] in ["user", "assistant"]
                and msg.get("content") != st.session_state.messages[0]["content"]
            ):
                claude_messages.append({"role": msg["role"], "content": msg["content"]})

        # Add the current user message
        claude_messages.append({"role": "user", "content": user_input})

        # Show processing status
        with st.container():
            st.markdown(
                '<div class="research-status">🤔 <strong>Thinking...</strong></div>',
                unsafe_allow_html=True,
            )

            # Check if this might be a research request
            research_keywords = [
                "research",
                "analyze",
                "study",
                "investigate",
                "explore",
                "latest",
                "current",
                "trends",
                "developments",
            ]
            might_need_research = any(
                keyword in user_input.lower() for keyword in research_keywords
            )

            if might_need_research:
                st.markdown(
                    '<div class="research-status">🔍 <strong>This looks like a research request. I may use deep research tools...</strong></div>',
                    unsafe_allow_html=True,
                )

            # Get response from Claude
            with st.spinner("Generating response..."):
                response_text = get_claude_response_with_tools(
                    claude_messages, [DEEP_RESEARCH_TOOL]
                )

            # Clear status messages
            st.empty()

            # Stream the response
            st.markdown(
                '<div class="assistant-message"><strong>Assistant:</strong><br>',
                unsafe_allow_html=True,
            )

            # Create placeholder for streaming response
            response_placeholder = st.empty()
            full_response = ""

            # Stream the response with typewriter effect
            for chunk in stream_text_response(response_text, delay=0.01):
                full_response += chunk
                response_placeholder.markdown(full_response + "▌")

            # Final display without cursor
            response_placeholder.markdown(full_response)
            st.markdown("</div>", unsafe_allow_html=True)

            # Add assistant response to session state
            st.session_state.messages.append(
                {"role": "assistant", "content": full_response}
            )

            # Rerun to update the display
            st.rerun()

    # Footer
    st.markdown(
        """
    <div class="footer">
        <p style="margin: 0;">🔍 Powered by Claude 4 & Firecrawl Deep Research | 
        <a href="https://docs.firecrawl.dev/features/alpha/deep-research" target="_blank">Learn more about Deep Research</a></p>
    </div>
    """,
        unsafe_allow_html=True,
    )


if __name__ == "__main__":
    main()
