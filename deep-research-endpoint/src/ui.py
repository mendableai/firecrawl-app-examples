import streamlit as st
from typing import Dict, Any, Tuple
import time
import random


def setup_sidebar() -> Dict[str, Any]:
    """Set up the sidebar with input fields.

    Returns:
        Dict[str, Any]: Dictionary containing user inputs from the sidebar
    """
    st.sidebar.title("Configuration")

    api_key = st.sidebar.text_input(
        "Enter your Firecrawl API Key",
        type="password",
        help="Your Firecrawl API key for authentication. You can obtain this from the Firecrawl dashboard.",
    )

    st.sidebar.markdown("### Research Parameters")

    max_depth = st.sidebar.number_input(
        "Maximum Depth",
        min_value=1,
        max_value=10,
        value=3,
        help="The maximum depth of exploration in the research process. Higher values lead to more thorough but slower research.",
    )

    timeout_limit = st.sidebar.number_input(
        "Timeout Limit (seconds)",
        min_value=30,
        max_value=600,
        value=120,
        help="Maximum time allowed for the research process in seconds. Longer timeouts allow for more comprehensive research.",
    )

    max_urls = st.sidebar.number_input(
        "Maximum URLs to Explore",
        min_value=5,
        max_value=100,
        value=20,
        help="Maximum number of URLs to explore during research. Higher values may provide more information but take longer.",
    )

    st.sidebar.markdown("---")
    st.sidebar.markdown(
        """
        ### About
        This application uses Firecrawl's deep research endpoint to perform 
        intelligent web research on your behalf. It explores the web, analyzes 
        content, and provides comprehensive answers to your questions.
        
        [Firecrawl Documentation](https://docs.firecrawl.dev/features/alpha/deep-research)
        """
    )

    return {
        "api_key": api_key,
        "max_depth": max_depth,
        "timeout_limit": timeout_limit,
        "max_urls": max_urls,
    }


def setup_main_ui() -> Tuple[bool, str]:
    """Set up the main UI components.

    Returns:
        Tuple[bool, str]: A tuple containing (is_query_submitted, query_text)
    """
    st.title("Deep Research Chatbot")

    st.markdown(
        """
        Use this chatbot to perform in-depth research using Firecrawl. 
        Enter your research question below, and the system will search the web, 
        analyze multiple sources, and provide a comprehensive answer.
        
        ✨ **Tips for effective research:**
        - Be specific with your query
        - Ask open-ended questions
        - Include any specific aspects you're interested in
        """
    )

    # Chat input
    query = st.chat_input("What would you like to research?")

    return (query is not None, query or "")


def display_chat_history():
    """Display the chat history from session state."""
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])


def show_activity_update(activity_data: Dict[str, Any]):
    """Display an activity update based on the activity data.

    Args:
        activity_data (Dict[str, Any]): Activity data from the API
    """
    # Handle activity displays based on Firecrawl API structure
    activity_type = activity_data.get("type", "")
    message = activity_data.get("message", "")

    # Map activity types to appropriate icons
    icon_map = {
        "search": "🔍",
        "extract": "📄",
        "analyze": "🧠",
        "reasoning": "⚖️",
        "synthesis": "✨",
        "thought": "💭",
        # Default icon for unknown types
        "default": "🔄",
    }

    # Get the appropriate icon
    icon = icon_map.get(activity_type, icon_map["default"])

    if message:
        st.markdown(f"{icon} **{message}**")


def show_error(message: str):
    """Display an error message.

    Args:
        message (str): The error message to display
    """
    st.error(f"Error: {message}")


def simulate_streaming_response(response_text: str):
    """Simulate a streaming response for a more interactive feel.

    Args:
        response_text (str): The complete response text to stream
    """
    # Create a single placeholder that will be updated
    message_placeholder = st.empty()

    # First, detect and preserve markdown headers and formatting
    lines = response_text.split("\n")
    formatted_lines = []

    for line in lines:
        # Preserve header formatting (# Headers)
        if line.strip().startswith("#"):
            formatted_lines.append(line)
        else:
            # For non-header lines, we can split by words
            formatted_lines.append(line)

    # Now reconstruct the text with proper formatting
    full_response = ""
    all_words = []

    # Split each line into words while preserving formatting
    for line in formatted_lines:
        if line.strip().startswith("#"):
            # For headers, keep the # prefix with the first word
            parts = line.strip().split(" ", 1)
            if len(parts) > 1:
                prefix, rest = parts
                words = rest.split()
                all_words.append(prefix + " " + words[0])
                all_words.extend(words[1:])
                all_words.append("\n")
            else:
                all_words.append(line)
                all_words.append("\n")
        else:
            words = line.split()
            all_words.extend(words)
            all_words.append("\n")

    current_text = ""

    # Stream the words with formatting preserved
    for i, word in enumerate(all_words):
        if word == "\n":
            current_text += "\n"
        else:
            # Add space before word except at beginning of line
            if current_text and not current_text.endswith("\n"):
                current_text += " "
            current_text += word

        # Update the display
        message_placeholder.markdown(current_text)

        # Random delay for typing effect
        time.sleep(random.uniform(0.007, 0.02))

    # Ensure final display is correctly formatted
    message_placeholder.markdown(response_text)
