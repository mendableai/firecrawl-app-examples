import streamlit as st
from crewai_chatgpt_clone.crew import ChatgptCloneCrew
import time
import gc
import base64

# Apply custom CSS to fix styling issues
st.markdown(
    """
<style>
    /* Footer styling */
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
    .footer a {
        color: #0068c9;
        text-decoration: none;
    }
    .footer a:hover {
        text-decoration: underline;
    }
</style>
""",
    unsafe_allow_html=True,
)


# --- Helper Functions ---
def reset_chat():
    st.session_state.messages = [st.session_state.messages[0]]
    gc.collect()


# Create a header with title on left and reset button on right
col1, col2 = st.columns([7, 1])  # Adjust ratio as needed
with col1:
    st.markdown(
        """
        # ChatGPT Clone powered by <img src="data:image/png;base64,{}" width="120" style="vertical-align: -3px;"> and 🔥Firecrawl
    """.format(
            base64.b64encode(
                open("src/crewai_chatgpt_clone/assets/crewai.png", "rb").read()
            ).decode()
        ),
        unsafe_allow_html=True,
    )
    st.markdown("AI Assistant with specialized agents for various tasks")

with col2:
    # Create a reset button with trash can icon
    if st.button("🗑️", help="Clear chat history"):
        reset_chat()
        st.rerun()

# --- Session State Initialization ---
if "messages" not in st.session_state:
    st.session_state.messages = []

    # Add initial welcome message
    welcome_message = """
Hello! I can assist you with a variety of tasks using specialized agents:

1. **General Questions** - I can answer general knowledge questions
2. **Web Search** - I can search the web for real-time information
3. **In-depth Research** - I can conduct comprehensive research on topics
4. **Web Scraping** - I can extract specific data from websites
5. **Image Generation** - I can create images based on descriptions

What would you like help with today?
"""
    st.session_state.messages.append({"role": "assistant", "content": welcome_message})


# --- Main Chat Interface ---

# Display existing chat messages
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Get user input
user_query = st.chat_input("Enter your query:")

if user_query:
    # Add user message to chat history and display it
    st.session_state.messages.append({"role": "user", "content": user_query})
    with st.chat_message("user"):
        st.markdown(user_query)

    # Force a rerun to render the user message before proceeding
    # This helps create a clean separation between user input and AI processing
    st.rerun()

# Check if we need to generate a response (if the last message was from the user)
if st.session_state.messages and st.session_state.messages[-1]["role"] == "user":
    user_query = st.session_state.messages[-1]["content"]

    # Create a container for processing spinner and assistant response
    response_container = st.container()

    with response_container:
        with st.chat_message("assistant"):
            with st.spinner("Processing your query..."):
                crew_instance = ChatgptCloneCrew()
                inputs = {"user_input": user_query}

                try:
                    result_obj = crew_instance.crew().kickoff(inputs=inputs)

                    response_text = ""
                    if hasattr(result_obj, "raw") and isinstance(result_obj.raw, str):
                        response_text = result_obj.raw
                    elif isinstance(result_obj, str):
                        response_text = result_obj
                    else:
                        # Fallback if the structure is unexpected
                        response_text = str(result_obj)

                    # Typewriter effect
                    message_placeholder = st.empty()
                    full_response = ""

                    for char in response_text:
                        full_response += char
                        message_placeholder.markdown(full_response + "▌")
                        time.sleep(0.01)

                    # Final display without cursor
                    message_placeholder.markdown(full_response)

                    # Add to session state after completing display
                    st.session_state.messages.append(
                        {"role": "assistant", "content": full_response}
                    )

                except Exception as e:
                    st.error(f"An error occurred: {e}")
                    st.session_state.messages.append(
                        {
                            "role": "assistant",
                            "content": f"Sorry, an error occurred: {e}",
                        }
                    )

# Add footer with documentation link
st.markdown(
    """
    <div class="footer">
        <p style="margin: 0;">📚 <a href="https://firecrawl.dev/blog/crewai-multi-agent-systems-tutorial" target="_blank">Read the article on our blog</a> to learn more about this app</p>
    </div>
    """,
    unsafe_allow_html=True,
)
