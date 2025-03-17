import streamlit as st
import asyncio
import threading
import queue

from src.config import DEFAULT_MAX_URLS, DEFAULT_USE_FULL_TEXT
from src.llms_text import extract_website_content
from src.agents import extract_domain_knowledge, create_domain_agent
from agents import Runner
from openai.types.responses import ResponseTextDeltaEvent

# Initialize session state
def init_session_state():
    if 'domain_agent' not in st.session_state:
        st.session_state.domain_agent = None
    if 'domain_knowledge' not in st.session_state:
        st.session_state.domain_knowledge = None
    if 'messages' not in st.session_state:
        st.session_state.messages = []
    if 'extraction_status' not in st.session_state:
        st.session_state.extraction_status = None
    if 'pending_response' not in st.session_state:
        st.session_state.pending_response = None

def run_app():
    # Initialize session state
    init_session_state()
    
    # Check if we have a pending response to add to the message history
    if st.session_state.pending_response is not None:
        st.session_state.messages.append({"role": "assistant", "content": st.session_state.pending_response})
        st.session_state.pending_response = None
    
    # App title and description in main content area
    st.title("WebToAgent")
    st.subheader("Extract domain knowledge from any website and create specialized AI agents.")
    
    # Display welcome message using AI chat message component
    if not st.session_state.domain_agent:
        with st.chat_message("assistant"):
            st.markdown("👋 Welcome! Enter a website URL in the sidebar, and I'll transform it into an AI agent you can chat with.")
    
    # Form elements in sidebar
    st.sidebar.title("Create your agent")
    
    website_url = st.sidebar.text_input("Enter website URL", placeholder="https://example.com")
    
    max_pages = st.sidebar.slider("Maximum pages to analyze", 1, 25, DEFAULT_MAX_URLS, 
                         help="More pages means more comprehensive knowledge but longer processing time. Capped at 25 pages to respect rate limits.")
    
    use_full_text = st.sidebar.checkbox("Use comprehensive text extraction", value=DEFAULT_USE_FULL_TEXT,
                                help="Extract full contents of each page (may increase processing time)")
    
    submit_button = st.sidebar.button("Create agent", type="primary")
    
    # Process form submission
    if submit_button and website_url:
        st.session_state.extraction_status = "extracting"
        
        try:
            with st.spinner("Extracting website content with Firecrawl..."):
                content = extract_website_content(
                    url=website_url, 
                    max_urls=max_pages,
                    show_full_text=use_full_text
                )
                
                # Show content sample
                with st.expander("View extracted content sample"):
                    st.text(content['llmstxt'][:1000] + "...")
                
                # Process content to extract knowledge
                with st.spinner("Analyzing content and generating knowledge model..."):
                    domain_knowledge = asyncio.run(extract_domain_knowledge(
                        content['llmstxt'] if not use_full_text else content['llmsfulltxt'],
                        website_url
                    ))
                    
                    # Store in session state
                    st.session_state.domain_knowledge = domain_knowledge
                
                # Create specialized agent
                with st.spinner("Creating specialized agent..."):
                    domain_agent = create_domain_agent(domain_knowledge)
                    
                    # Store in session state
                    st.session_state.domain_agent = domain_agent
                    
                    st.session_state.extraction_status = "complete"
                    st.success("Agent created successfully! You can now chat with the agent.")
        
        except Exception as e:
            st.error(f"Error: {str(e)}")
            st.session_state.extraction_status = "failed"
    
    # Chat interface
    if st.session_state.domain_agent:
        display_chat_interface()

def stream_agent_response(agent, prompt):
    """Stream agent response using a background thread and a queue for real-time token streaming."""
    # Create a queue to transfer tokens from async thread to main thread
    token_queue = queue.Queue()
    
    # Flag to signal when the async function is complete
    done_event = threading.Event()
    
    # Create a shared variable to collect the complete response
    # Do NOT use session state in the background thread
    response_collector = []
    
    # The thread function to run the async event loop
    def run_async_loop():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def process_stream():
            token_count = 0
            try:
                result = Runner.run_streamed(agent, prompt)
                
                # Process all stream events
                async for event in result.stream_events():
                    # Only handle text delta events
                    if (event.type == "raw_response_event" and 
                        isinstance(event.data, ResponseTextDeltaEvent) and 
                        event.data.delta):
                        # Put the token in the queue
                        token = event.data.delta
                        token_queue.put(token)
                        
                        # Safely append to collector (no session state access)
                        response_collector.append(token)
                        token_count += 1
                
                # If no tokens were yielded, use the final output
                if token_count == 0 and hasattr(result, 'final_output') and result.final_output:
                    token_queue.put(result.final_output)
                    response_collector.append(result.final_output)
            except Exception as e:
                # Put the exception in the queue to be raised in the main thread
                print(f"Error in streaming process: {str(e)}")
                token_queue.put(e)
            finally:
                # Build the complete response
                complete_response = ''.join(response_collector)
                
                # Store the complete response in a global place where the main thread can find it
                global _last_complete_response
                _last_complete_response = complete_response
                
                # Signal that we're done processing
                done_event.set()
                # Always put a None to indicate end of stream
                token_queue.put(None)
        
        try:
            loop.run_until_complete(process_stream())
        finally:
            loop.close()
    
    # Start the background thread
    thread = threading.Thread(target=run_async_loop)
    thread.daemon = True
    thread.start()
    
    # Generator function to yield tokens from the queue
    def token_generator():
        token_count = 0
        
        while not done_event.is_set() or not token_queue.empty():
            try:
                token = token_queue.get(timeout=0.1)
                if token is None:
                    # End of stream
                    # After streaming is complete, set the pending response in session state
                    # This needs to be done from the main thread
                    global _last_complete_response
                    if '_last_complete_response' in globals() and _last_complete_response:
                        st.session_state.pending_response = _last_complete_response
                    break
                elif isinstance(token, Exception):
                    # Re-raise exceptions from the background thread
                    raise token
                else:
                    token_count += 1
                    yield token
            except queue.Empty:
                # Queue timeout, just continue waiting
                continue
    
    return token_generator()

# Global variable to store the last complete response
_last_complete_response = None

def get_non_streaming_response(agent, prompt):
    """Fallback function for non-streaming response."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(Runner.run(agent, prompt))
        response_text = result.final_output or ""
        
        # Store for the next Streamlit run to pick up
        st.session_state.pending_response = response_text
        
        return response_text
    finally:
        loop.close()

def display_chat_interface():
    """Display chat interface for interacting with the domain agent."""
    # Display chat history
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # Chat input
    if prompt := st.chat_input("Ask a question about this domain..."):
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Display user message
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Reset any pending response
        st.session_state.pending_response = None
        
        # Get agent response with streaming
        with st.chat_message("assistant"):
            try:
                # Stream the response tokens
                token_stream = stream_agent_response(st.session_state.domain_agent, prompt)
                st.write_stream(token_stream)
                
            except Exception as e:
                # Fallback to non-streaming response if streaming fails
                st.warning(f"Streaming failed ({str(e)}), using standard response method.")
                try:
                    full_response = get_non_streaming_response(st.session_state.domain_agent, prompt)
                    st.markdown(full_response)
                except Exception as e2:
                    st.error(f"Error generating response: {str(e2)}")

if __name__ == "__main__":
    run_app()
