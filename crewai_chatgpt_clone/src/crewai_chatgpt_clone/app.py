import streamlit as st
from crewai_chatgpt_clone.crew import ChatgptCloneCrew
import time
import gc
import base64

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

    # Create a placeholder for the assistant's message
    assistant_placeholder = st.chat_message("assistant")

    with assistant_placeholder:
        # Show a spinner while processing
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

                # Implement the typewriter streaming effect - using an empty container inside the message
                message_placeholder = st.empty()
                full_response_streamed = ""

                for char in response_text:
                    full_response_streamed += char
                    message_placeholder.markdown(full_response_streamed + "▌")
                    time.sleep(0.01)  # Adjust for desired speed

                # Final display without cursor
                message_placeholder.markdown(full_response_streamed)

                # Only add to session state after the typewriter effect is complete
                st.session_state.messages.append(
                    {"role": "assistant", "content": full_response_streamed}
                )

            except Exception as e:
                st.error(f"An error occurred: {e}")
                # Optionally add error to chat history
                # st.session_state.messages.append({"role": "assistant", "content": f"Error: {e}"})
