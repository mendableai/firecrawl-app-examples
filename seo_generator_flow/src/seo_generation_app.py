import streamlit as st
import base64
import gc
import seo_generation_flow.main

# ===========================
#   Streamlit Setup
# ===========================

if "response" not in st.session_state:
    st.session_state.response = None

if "flow" not in st.session_state:
    st.session_state.flow = None

def reset_analysis():
    st.session_state.response = None
    st.session_state.flow = None
    gc.collect()

def start_analysis():
    st.markdown("""
            # Multi-Agent SEO Keyword Research using Firecrawl and DeepSeek-R1
        """, unsafe_allow_html=True)
    
    # Create a placeholder for status updates
    status_placeholder = st.empty()
    
    with status_placeholder.container():
        if st.session_state.flow is None:
            status_placeholder.info('Initializing SEO generation flow...')
            st.session_state.flow = seo_generation_flow.main.SeoGenerationFlow()
        
            st.session_state.flow.state.topic = st.session_state.topic
            st.session_state.flow.state.total_search_queries = st.session_state.total_search_queries
            
            # You can update the status for different phases
            status_placeholder.info('Generating SEO content for topic: {}...'.format(st.session_state.topic))
            st.session_state.flow.kickoff()
            
            # Store the results
            status_placeholder.success('Analysis complete! Displaying results...')
            st.session_state.response = st.session_state.flow.state
        else:
            st.session_state.response = st.session_state.flow.state

    # Clear the status message after completion
    status_placeholder.empty()

# ===========================
#   Sidebar
# ===========================
with st.sidebar:
    st.header("SEO Generation Settings")
    
    # Topic input
    st.session_state.topic = st.text_input(
        "Topic",
        value="Web Scraping" if "topic" not in st.session_state else st.session_state.topic
    )
    
    # Number of search queries
    st.session_state.total_search_queries = st.number_input(
        "Total Search Queries",
        min_value=1,
        max_value=10,
        value=2,
        step=1
    )

    st.divider()
    
    # Analysis buttons
    col1, col2 = st.columns(2)
    with col1:
        st.button("Start Analysis 🚀", type="primary", on_click=start_analysis)
    with col2:
        st.button("Reset", on_click=reset_analysis)

# ===========================
#   Main Content Area
# ===========================

if st.session_state.response is None:
    header_container = st.container()
    with header_container:
        st.markdown("""
            # Multi-Agent SEO Keyword Research using Firecrawl and DeepSeek-R1
        """, unsafe_allow_html=True)

if st.session_state.response:
    try:
        response = st.session_state.response
        

        # Display Search Results
        if response.seo_report:
            st.markdown("## 📄 Keyword Research Report")
            st.markdown(response.seo_report)
        

    except Exception as e:
        st.error(f"An error occurred while displaying results: {str(e)}")

# Footer
st.markdown("---")
st.markdown("Built with Firecrawl, CrewAI and Streamlit") 