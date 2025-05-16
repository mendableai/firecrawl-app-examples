import streamlit as st
from crewai_chatgpt_clone.crew import ChatgptCloneCrew
import time
import gc
import base64

# Apply custom CSS to fix styling issues
st.markdown(
    """
<style>
    /* Ensure clean rendering of messages */
    .stChatMessage {
        overflow: hidden;
    }
    /* Hide any ghost/duplicate messages */
    .stChatMessage div[data-testid="stChatMessageContent"] > div:nth-child(n+2) {
        display: none !important;
    }
</style>
""",
    unsafe_allow_html=True,
)

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


# --- Session State Initialization ---
if "messages" not in st.session_state:
    st.session_state.messages = []


# --- Helper Functions ---
def reset_chat():
    st.session_state.messages = []
    gc.collect()


# --- Sidebar ---
with st.sidebar:
    st.header("Chat Controls")
    if st.button("Clear Chat History"):
        reset_chat()
        st.rerun()

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
