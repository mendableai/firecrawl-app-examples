import json
from typing import Dict, Any, List
import streamlit as st


def format_research_results(research_results: Dict[str, Any]) -> str:
    """Format the research results into a readable markdown string.

    Args:
        research_results (Dict[str, Any]): The research results from Firecrawl

    Returns:
        str: Formatted markdown string
    """
    if not research_results:
        return "No research results were found."

    # Extract main components
    analysis = research_results.get("analysis", "No analysis available.")
    sources = research_results.get("sources", [])

    # Format the analysis part
    formatted_text = f"{analysis}\n\n"

    # Add sources if available
    if sources:
        formatted_text += "## Sources\n\n"
        for i, source in enumerate(sources, 1):
            url = source.get("url", "Unknown URL")
            title = source.get("title", "Untitled Source")
            description = source.get("description", "")

            formatted_text += f"{i}. [{title}]({url})\n"
            if description:
                formatted_text += f"   _{description}_\n\n"
            else:
                formatted_text += "\n"

    return formatted_text


def validate_inputs(config: Dict[str, Any]) -> List[str]:
    """Validate the user inputs and return any error messages.

    Args:
        config (Dict[str, Any]): The configuration dictionary

    Returns:
        List[str]: List of error messages, empty if no errors
    """
    errors = []

    if not config.get("api_key"):
        errors.append("Please enter your Firecrawl API key in the sidebar")

    return errors


def init_session_state():
    """Initialize session state variables if they don't exist."""
    if "messages" not in st.session_state:
        st.session_state.messages = []

    if "processing" not in st.session_state:
        st.session_state.processing = False

    if "activity_container" not in st.session_state:
        st.session_state.activity_container = None

    if "current_sources" not in st.session_state:
        st.session_state.current_sources = ""
