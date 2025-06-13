#!/usr/bin/env python3
"""
Startup Idea Validator Chatbot with LangGraph

A conversational startup validation system that combines Firecrawl web scraping,
Hacker News community insights, and GitHub technical research to provide
comprehensive startup idea assessment through interactive chat.
"""

import streamlit as st
from langchain_core.messages import ToolMessage, AIMessageChunk, HumanMessage
from .validator import create_startup_validator_agent


def setup_streamlit_page():
    """Configure Streamlit page settings"""
    st.set_page_config(
        page_title="Startup Validator Chatbot", page_icon="🤖", layout="wide"
    )


def show_welcome_sidebar():
    """Display welcome message and capabilities in sidebar"""
    with st.sidebar:
        st.header("🤖 STARTUP VALIDATOR CHATBOT")
        st.markdown("💬 Ask me anything about validating your startup ideas!")

        st.subheader("🌟 I can help you:")
        st.markdown(
            """
        - Get a **FULL VALIDATION** report (market + community + technical)
        - Answer specific questions about market, competitors, feasibility
        - Research particular aspects in detail
        - Compare your idea to existing solutions
        """
        )

        st.subheader("💡 Try saying:")
        st.markdown(
            """
        - *"Do a full validation of my AI tutoring app"*
        - *"What's the market like for productivity tools?"*
        - *"How technically complex would a blockchain app be?"*
        """
        )

        st.divider()

        # Clear chat button
        if st.button("🗑️ Clear Chat History", use_container_width=True):
            st.session_state.messages = []
            st.session_state.chat_history = []
            st.rerun()


def stream_agent_response(
    agent, chat_history, response_placeholder, thinking_placeholder
):
    """Stream the agent response with thinking UI pattern"""
    # Configure conversation thread for memory persistence
    config = {"configurable": {"thread_id": "startup_session"}}

    full_response = ""
    tool_in_progress = False

    # The input to the stream should be the new messages
    user_input = chat_history[-1].content

    try:
        # Stream the response using the existing agent logic
        for stream_mode, chunk in agent.stream(
            {"messages": [HumanMessage(content=user_input)]},
            config=config,
            stream_mode=["messages", "custom"],
        ):
            if stream_mode == "custom":
                # Handle custom stream mode (thinking/tool use indicators)
                if chunk:
                    tool_in_progress = True
                    chunk_str = str(chunk).lower()

                    # Update thinking indicator based on tool activity
                    if "market" in chunk_str or "research" in chunk_str:
                        thinking_placeholder.info("🔍 **Researching market data...**")
                    elif "community" in chunk_str or "hacker news" in chunk_str:
                        thinking_placeholder.info(
                            "📊 **Analyzing community sentiment...**"
                        )
                    elif "technical" in chunk_str or "github" in chunk_str:
                        thinking_placeholder.info(
                            "⚙️ **Assessing technical feasibility...**"
                        )
                    elif "tool" in chunk_str:
                        thinking_placeholder.info("🔧 **Using validation tools...**")
                    else:
                        thinking_placeholder.info("🤔 **Processing...**")

            elif stream_mode == "messages":
                # Append all message objects to the history
                st.session_state.chat_history.extend(chunk)

                if isinstance(chunk[0], AIMessageChunk):
                    # This is actual AI response content - clear thinking and start streaming
                    if tool_in_progress and chunk[0].content:
                        thinking_placeholder.empty()
                        tool_in_progress = False

                    # Stream AI message content
                    if chunk[0].content:
                        full_response += chunk[0].content
                        response_placeholder.markdown(full_response + "▌")
                elif isinstance(chunk[0], ToolMessage):
                    # Skip tool messages from display but continue processing
                    continue

    except Exception as e:
        error_msg = f"❌ **Error:** {str(e)}\nPlease try asking your question again."
        full_response = error_msg
        thinking_placeholder.empty()
        response_placeholder.markdown(error_msg)

    # Ensure thinking indicator is cleared
    if tool_in_progress:
        thinking_placeholder.empty()

    # Remove cursor and return final response
    response_placeholder.markdown(full_response)
    return full_response


@st.cache_resource
def get_startup_validator_agent():
    """Initialize and cache the startup validator agent"""
    try:
        return create_startup_validator_agent()
    except Exception as e:
        st.error(f"Failed to initialize agent: {str(e)}")
        st.stop()


def run_streamlit_app():
    """Main Streamlit application"""
    setup_streamlit_page()

    # Header
    st.markdown(
        "<h1 style='text-align: center;'>🤖 Startup Idea Validator</h1>",
        unsafe_allow_html=True,
    )

    # Show sidebar with welcome and instructions
    show_welcome_sidebar()

    # Initialize the agent
    with st.spinner("🔄 Initializing chatbot..."):
        agent = get_startup_validator_agent()

    # Initialize session state
    if "messages" not in st.session_state:
        st.session_state.messages = []
        st.session_state.chat_history = []
        # Add welcome message
        welcome_msg = "👋 **Welcome!** I'm your startup validation assistant. Ask me anything about validating your startup ideas!"
        st.session_state.messages.append({"role": "assistant", "content": welcome_msg})

    # Display chat history
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # Chat input
    user_input = st.chat_input("Ask me about your startup idea...")

    if user_input:
        # Add user message to session state
        st.session_state.messages.append({"role": "user", "content": user_input})
        st.session_state.chat_history.append(HumanMessage(content=user_input))

        # Display user message
        with st.chat_message("user"):
            st.markdown(user_input)

        # Show thinking indicator
        with st.container():
            thinking_placeholder = st.info("🤔 **Thinking...**")

            # Stream the response
            with st.chat_message("assistant"):
                # Create placeholder for streaming response
                response_placeholder = st.empty()

                # Stream the agent response
                full_response = stream_agent_response(
                    agent,
                    st.session_state.chat_history,
                    response_placeholder,
                    thinking_placeholder,
                )

            # Remove thinking indicator
            thinking_placeholder.empty()

        # Add assistant response to session state
        st.session_state.messages.append(
            {"role": "assistant", "content": full_response}
        )

        # Rerun to update the display
        st.rerun()
