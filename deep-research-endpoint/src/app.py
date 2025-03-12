import streamlit as st
import time
from typing import Dict, Any
import traceback

# Import local modules
from firecrawl_client import FirecrawlClient
from ui import (
    setup_sidebar,
    setup_main_ui,
    display_chat_history,
    show_activity_update,
    show_error,
    simulate_streaming_response,
)
from utils import format_research_results, validate_inputs, init_session_state


def handle_activity_update(activity_data: Dict[str, Any]):
    """Handle activity updates from the Firecrawl API.

    Args:
        activity_data (Dict[str, Any]): Activity data from the API
    """
    if st.session_state.activity_container is not None:
        with st.session_state.activity_container:
            # Display the activity update directly in the container
            # No need for placeholder management that's causing the error
            show_activity_update(activity_data)


def perform_research(query: str, config: Dict[str, Any]):
    """Perform deep research using Firecrawl.

    Args:
        query (str): The research query
        config (Dict[str, Any]): Configuration parameters
    """
    try:
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": query})

        # Create a fresh container for activity updates
        st.session_state.activity_container = st.container(border=True)

        with st.session_state.activity_container:
            st.markdown("### Initializing research process...")

        # Mark as processing
        st.session_state.processing = True

        # Initialize Firecrawl client
        client = FirecrawlClient(config["api_key"])

        # Perform deep research
        results = client.deep_research(
            query=query,
            max_depth=config["max_depth"],
            timeout_limit=config["timeout_limit"],
            max_urls=config["max_urls"],
            on_activity=handle_activity_update,
        )

        # Format research results for display
        formatted_analysis = format_research_results(results)

        # Extract just the analysis part (without sources) for the main display
        # This pattern looks for everything before "## Sources" heading
        analysis_only = formatted_analysis
        if "## Sources" in formatted_analysis:
            analysis_only = formatted_analysis.split("## Sources")[0].strip()

        # Extract sources if available for the toggle
        sources_text = ""
        if "## Sources" in formatted_analysis:
            sources_text = "## Sources" + formatted_analysis.split("## Sources")[1]

        # Store the sources in session state for the toggle
        st.session_state.current_sources = sources_text

        # Add the analysis to chat history
        st.session_state.messages.append(
            {"role": "assistant", "content": analysis_only}
        )

        # Display the assistant response with streaming effect
        with st.chat_message("assistant"):
            simulate_streaming_response(analysis_only)

            # Add sources toggle if we have sources
            if sources_text:
                with st.expander("View Sources", expanded=False):
                    st.markdown(sources_text)

    except Exception as e:
        error_message = str(e)
        show_error(f"An error occurred: {error_message}")
        st.session_state.messages.append(
            {"role": "assistant", "content": f"❌ Error: {error_message}"}
        )
        st.error(traceback.format_exc())
    finally:
        # Reset processing state
        st.session_state.processing = False


def main():
    """Main application entry point."""
    st.set_page_config(
        page_title="Deep Research Chatbot", page_icon="🔍", layout="wide"
    )

    # Initialize session state
    init_session_state()

    # Set up sidebar and get configuration
    config = setup_sidebar()

    # Set up main UI
    is_query_submitted, query = setup_main_ui()

    # Display chat history
    display_chat_history()

    # Handle query submission
    if is_query_submitted and not st.session_state.processing:
        # Validate inputs
        errors = validate_inputs(config)
        if errors:
            for error in errors:
                show_error(error)
        else:
            perform_research(query, config)


if __name__ == "__main__":
    main()
