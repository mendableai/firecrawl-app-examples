import streamlit as st
import asyncio
from pyvis.network import Network

from src.config import DEFAULT_MAX_URLS, DEFAULT_USE_FULL_TEXT
from src.llms_text import extract_website_content
from src.agents import extract_domain_knowledge, create_domain_agent
from src.models import DomainKnowledge
from agents import Runner

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

def run_app():
    # Initialize session state
    init_session_state()
    
    # App title and description
    st.title("KnowledgeForge")
    st.subheader("Transform websites into intelligent agents")
    st.write("Extract domain knowledge from any website and create specialized AI agents.")
    
    # Input form for website URL
    with st.form("website_form"):
        website_url = st.text_input("Enter website URL", placeholder="https://example.com")
        col1, col2 = st.columns(2)
        with col1:
            max_pages = st.slider("Maximum pages to analyze", 1, 30, DEFAULT_MAX_URLS)
        with col2:
            use_full_text = st.checkbox("Use comprehensive text extraction", value=DEFAULT_USE_FULL_TEXT)
        submit_button = st.form_submit_button("Create Agent")
    
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
                    st.success("Agent created successfully!")
        
        except Exception as e:
            st.error(f"Error: {str(e)}")
            st.session_state.extraction_status = "failed"
    
    # Display knowledge visualization if available
    if st.session_state.domain_knowledge:
        display_knowledge_visualization(st.session_state.domain_knowledge)
    
    # Chat interface
    if st.session_state.domain_agent:
        display_chat_interface()

def display_knowledge_visualization(domain_knowledge: DomainKnowledge):
    """Display visualization of the domain knowledge."""
    st.subheader("Domain Knowledge Map")
    
    # Create network graph visualization
    net = Network(height="500px", width="100%", bgcolor="#222222", font_color="white")
    
    # Add concept nodes
    for concept in domain_knowledge.core_concepts:
        net.add_node(concept.name, title=concept.description, size=30*concept.importance_score)
        
        # Add edges between related concepts
        for related in concept.related_concepts:
            net.add_edge(concept.name, related, color="lightblue")
    
    # Add terminology nodes
    for term_info in domain_knowledge.terminology:
        net.add_node(term_info.term, title=term_info.definition, size=20, color="#75E6DA")
    
    # Generate and display the graph
    net.save_graph("temp_graph.html")
    with open("temp_graph.html", "r", encoding="utf-8") as f:
        graph_html = f.read()
    st.components.v1.html(graph_html, height=550)
    
    # Display key terminology
    with st.expander("Key Terminology"):
        for term_info in domain_knowledge.terminology:
            st.markdown(f"**{term_info.term}**: {term_info.definition}")
            if term_info.examples:
                st.markdown("Examples: " + ", ".join(term_info.examples))
            st.markdown("---")
    
    # Display key insights
    with st.expander("Key Insights"):
        for insight in domain_knowledge.key_insights:
            st.markdown(f"- {insight.content}")

def display_chat_interface():
    """Display chat interface for interacting with the domain agent."""
    st.subheader("Chat with your domain expert")
    
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
        
        # Get agent response
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            full_response = ""
            
            # Process with agent
            with st.spinner("Thinking..."):
                result = asyncio.run(Runner.run(st.session_state.domain_agent, prompt))
                full_response = result.final_output
            
            message_placeholder.markdown(full_response)
            
        # Add assistant response to chat history
        st.session_state.messages.append({"role": "assistant", "content": full_response})

if __name__ == "__main__":
    run_app()
