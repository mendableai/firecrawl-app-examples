import streamlit as st
import asyncio
from dotenv import load_dotenv
import os
from src.scraper import JobScraper
from src.matcher import JobMatcher
from src.discord import DiscordNotifier
from src.database import Database
from firecrawl import FirecrawlApp

# Load environment variables but we'll override FIRECRAWL_API_KEY with user input
load_dotenv()

# Set page configuration and theme
st.set_page_config(
    page_title="Resume Job Matcher",
    page_icon="🔥",
    layout="wide",
)

# Custom CSS for light mode with orange theme
st.markdown("""
<style>
    /* Light mode with subtle orange accent */
    :root {
        --background-color: #ffffff;
        --text-color: #333333;
        --accent-color: #FF7D00;
        --secondary-color: #FFA559;
        --light-accent: #FFF1E6;
        --border-color: #E8E8E8;
        --sidebar-bg: #FAFAFA;
        --sidebar-accent: #FFF8F3;
    }
    
    /* Main background and text */
    .stApp {
        background-color: var(--background-color);
        color: var(--text-color);
    }
    
    /* Headers */
    h1, h2, h3, h4, h5, h6 {
        color: #333333 !important;
        font-weight: 600 !important;
    }
    
    h1 {
        font-size: 1.8rem !important;
    }
    
    /* Buttons */
    .stButton button {
        background-color: var(--accent-color) !important;
        color: white !important;
        border: none !important;
        border-radius: 4px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
    }
    
    .stButton button:hover {
        background-color: var(--secondary-color) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }
    
    /* Disabled button styles */
    .stButton button:disabled {
        background-color: #cccccc !important;
        color: #666666 !important;
        cursor: not-allowed !important;
        box-shadow: none !important;
    }
    
    /* Input fields - extremely specific selectors */
    .stTextInput input, .stTextArea textarea, 
    div[data-baseweb="input"] input, div[data-baseweb="textarea"] textarea,
    .st-emotion-cache-6qob1r, .st-emotion-cache-1vbkxwb, .st-emotion-cache-75dxx0,
    .st-bq .st-emotion-cache-q8sbsg p,
    [data-testid="stForm"] input, [data-testid="stFormSubmitButton"] input,
    .st-emotion-cache-q8sbsg p {
        border: 1px solid var(--border-color) !important;
        border-radius: 4px !important;
        color: var(--text-color) !important;
        transition: border 0.2s ease !important;
        background-color: white !important;
    }
    
    /* Input containers */
    .st-emotion-cache-1x8cf1d, .st-emotion-cache-1qg05tj, .st-emotion-cache-keje6w {
        background-color: white !important;
    }
    
    /* Input focus states */
    .stTextInput input:focus, .stTextArea textarea:focus,
    div[data-baseweb="input"] input:focus, div[data-baseweb="textarea"] textarea:focus,
    [data-testid="stForm"] input:focus, [data-testid="stFormSubmitButton"] input:focus {
        border-color: var(--border-color) !important;
        box-shadow: none !important;
        outline: none !important;
    }
    
    /* Input labels - make backgrounds transparent */
    .stTextInput label, .stTextArea label,
    div[data-baseweb="input"] label, div[data-baseweb="textarea"] label,
    .st-emotion-cache-16txtl3, .st-emotion-cache-eczf16,
    .st-emotion-cache-16idsys label, .st-emotion-cache-ue6h4q label,
    section[data-testid="stSidebar"] label, 
    .st-emotion-cache-16idsys p, .st-emotion-cache-16idsys label, 
    .st-emotion-cache-ue6h4q, .st-emotion-cache-10trblm,
    section[data-testid="stSidebar"] p, section[data-testid="stSidebar"] label,
    .st-emotion-cache-16idsys, .st-emotion-cache-ue6h4q {
        color: var(--accent-color) !important;
        font-weight: 500 !important;
        background-color: transparent !important;
    }
    
    /* Fix for top bar icons */
    button[kind="icon"] {
        background-color: var(--accent-color) !important;
        color: var(--text-color) !important;
    }
    
    button[kind="icon"] svg {
        fill: var(--text-color) !important;
        stroke: var(--text-color) !important;
    }
    
    /* Fix for top bar buttons */
    .stDeployButton, [data-testid="stToolbar"] button {
        background-color: transparent !important;
        color: var(--text-color) !important;
    }
    
    /* Fix for sidebar label backgrounds */
    section[data-testid="stSidebar"] .st-emotion-cache-16idsys,
    section[data-testid="stSidebar"] .st-emotion-cache-ue6h4q,
    section[data-testid="stSidebar"] .st-emotion-cache-10trblm,
    section[data-testid="stSidebar"] .st-emotion-cache-16idsys p,
    section[data-testid="stSidebar"] .st-emotion-cache-16idsys label {
        background-color: transparent !important;
    }
    
    /* Sidebar - extremely specific selectors */
    .css-1d391kg, .css-12oz5g7, .st-emotion-cache-1cypcdb, .st-emotion-cache-18ni7ap,
    section[data-testid="stSidebar"], .st-emotion-cache-1wrcr25,
    .st-emotion-cache-6qob1r, .st-emotion-cache-aw63z9 {
        background-color: var(--sidebar-bg) !important;
    }
    
    /* Sidebar input fields */
    section[data-testid="stSidebar"] input,
    section[data-testid="stSidebar"] .st-emotion-cache-6qob1r,
    section[data-testid="stSidebar"] .st-emotion-cache-1vbkxwb,
    section[data-testid="stSidebar"] .st-emotion-cache-75dxx0,
    section[data-testid="stSidebar"] .st-emotion-cache-q8sbsg p,
    section[data-testid="stSidebar"] [data-testid="stForm"] input {
        background-color: white !important;
        color: var(--text-color) !important;
        border: 1px solid var(--border-color) !important;
    }
    
    /* Sidebar input containers */
    section[data-testid="stSidebar"] .st-emotion-cache-1x8cf1d,
    section[data-testid="stSidebar"] .st-emotion-cache-1qg05tj,
    section[data-testid="stSidebar"] .st-emotion-cache-keje6w {
        background-color: white !important;
    }
    
    /* Sidebar header */
    section[data-testid="stSidebar"] .block-container {
        padding-top: 0.5rem !important;
        padding-bottom: 0.5rem !important;
    }
    
    /* Sidebar divider */
    section[data-testid="stSidebar"] hr {
        margin-top: 0.3rem !important;
        margin-bottom: 0.3rem !important;
    }
    
    /* Sidebar section headers */
    section[data-testid="stSidebar"] h3 {
        color: var(--accent-color) !important;
        font-size: 1.1rem !important;
        margin-top: 0.3rem !important;
        margin-bottom: 0.3rem !important;
    }
    
    section[data-testid="stSidebar"] h4 {
        font-size: 0.95rem !important;
        margin-top: 0.3rem !important;
        margin-bottom: 0.3rem !important;
        color: var(--accent-color) !important;
    }
    
    /* Sidebar buttons */
    section[data-testid="stSidebar"] .stButton button {
        font-size: 0.85rem !important;
        padding: 0.3rem 0.8rem !important;
    }
    
    /* Sidebar delete button */
    section[data-testid="stSidebar"] .stButton button[key$="delete"] {
        background-color: #f8f9fa !important;
        color: #dc3545 !important;
        border: 1px solid #dc3545 !important;
    }
    
    section[data-testid="stSidebar"] .stButton button[key$="delete"]:hover {
        background-color: #dc3545 !important;
        color: white !important;
    }
    
    /* Dividers */
    .stDivider {
        border-color: var(--border-color) !important;
    }
    
    /* Fix for sidebar and top bar */
    .st-emotion-cache-1dp5vir, .st-emotion-cache-z5fcl4,
    .st-emotion-cache-6qob1r, .st-emotion-cache-aw63z9 {
        background-color: var(--sidebar-bg) !important;
    }
    
    /* Fix for placeholder text */
    ::placeholder {
        color: #888888 !important;
        opacity: 0.8 !important;
    }
    
    /* Card styling */
    .card {
        background-color: white !important;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 1.2rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        transition: all 0.2s ease;
    }
    
    .card:hover {
        box-shadow: 0 3px 8px rgba(0,0,0,0.08);
    }
    
    /* Card text styling for better visibility */
    .card h3 {
        color: var(--accent-color) !important;
        font-weight: 600 !important;
        margin-bottom: 0.8rem !important;
    }
    
    .card p {
        color: #333333 !important;
        margin-bottom: 0.5rem !important;
        font-size: 1rem !important;
    }
    
    .card strong {
        color: #111111 !important;
        font-weight: 600 !important;
    }
    
    .card .match-status {
        font-weight: 600 !important;
    }
    
    .card .good-match {
        color: #28a745 !important;
    }
    
    .card .poor-match {
        color: #dc3545 !important;
    }
    
    /* Card links */
    .card a {
        color: #0066cc !important;
        text-decoration: none !important;
    }
    
    .card a:hover {
        text-decoration: underline !important;
    }
    
    /* Success message styling */
    .success-message {
        color: #28a745; 
        background-color: #e8f5e9; 
        padding: 8px; 
        border-radius: 4px; 
        font-size: 14px;
    }
    
    /* Info box styling */
    .info-box { 
        background-color: var(--light-accent);
        padding: 1.2rem;
        border-radius: 6px;
        margin-bottom: 1.2rem;
        border-left: 3px solid var(--accent-color);
    }
    
    /* Sidebar source item */
    .source-item {
        background-color: var(--sidebar-accent);
        padding: 0.5rem;
        border-radius: 4px;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        word-break: break-all;
        border-left: 2px solid var(--accent-color);
    }
    
    /* Override any dark mode or black text */
    .st-emotion-cache-183lzff, .st-emotion-cache-q8sbsg {
        color: var(--text-color) !important;
    }
    
    /* Force white background on inputs */
    .st-emotion-cache-1x8cf1d, .st-emotion-cache-1qg05tj, .st-emotion-cache-keje6w {
        background-color: white !important;
    }
    
    [data-baseweb="base-input"]:focus-within,
    [data-baseweb="input"]:focus-within,
    [data-baseweb="textarea"]:focus-within {
        border-color: var(--accent-color) !important;
   
    }
    
    /* Additional overrides for dark text */
    .st-emotion-cache-q8sbsg, .st-emotion-cache-q8sbsg p {
        color: var(--text-color) !important;
    }
    
    /* Additional overrides for input backgrounds */
    .st-emotion-cache-1qg05tj, .st-emotion-cache-keje6w {
        background-color: white !important;
    }
    
    /* Direct style overrides for specific elements */
    div[data-testid="stFormSubmitButton"] button {
        background-color: var(--accent-color) !important;
        color: white !important;
    }
    
    /* Force all inputs to have white background and dark text */
    input, textarea, [role="textbox"] {
        background-color: white !important;
        color: var(--text-color) !important;
    }
    
    /* Match score progress bar */
    .match-score-bar {
        height: 8px;
        background-color: #e9ecef;
        border-radius: 4px;
        margin-top: 5px;
        overflow: hidden;
    }
    
    /* Sidebar spacing adjustments */
    section[data-testid="stSidebar"] {
        
    }
    
    section[data-testid="stSidebar"] h3 {
        margin-top: 0.3rem !important;
        margin-bottom: 0.3rem !important;
        font-size: 1.1rem !important;
    }
    
    section[data-testid="stSidebar"] h4 {
        margin-top: 0.3rem !important;
        margin-bottom: 0.3rem !important;
        font-size: 1rem !important;
    }
    
    section[data-testid="stSidebar"] .stButton {
        margin-bottom: 0.3rem !important;
    }
    
    section[data-testid="stSidebar"] .stTextInput {
        margin-bottom: 0.3rem !important;
    }
    
    section[data-testid="stSidebar"] hr {
        margin-top: 0.3rem !important;
        margin-bottom: 0.3rem !important;
    }
    
    section[data-testid="stSidebar"] p {
        margin-bottom: 0.2rem !important;
    }
    
    section[data-testid="stSidebar"] .source-item {
        padding: 0.2rem !important;
        margin-bottom: 0.2rem !important;
    }
    
    /* Reduce top margin of first h3 in sidebar */
    section[data-testid="stSidebar"] > div:first-child h3:first-of-type {
        margin-top: 0 !important;
    }
    
    /* Reduce space between sidebar elements */
    section[data-testid="stSidebar"] > div > div {
        margin-bottom: 0.2rem !important;
    }
    
    /* Match score fill */
    .match-score-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;
    }
    
    .match-score-low {
        background-color: #dc3545;
    }
    
    .match-score-medium {
        background-color: #ffc107;
    }
    
    .match-score-high {
        background-color: #28a745;
    }
    
    /* Fix for top bar */
    header, .st-emotion-cache-18ni7ap, .st-emotion-cache-aw63z9 {
        background-color: var(--sidebar-bg) !important;
    }
    
    /* Fix for hamburger menu */
    .st-emotion-cache-1egp7eo {
        color: var(--text-color) !important;
    }
    
    /* Comprehensive fix for collapsed sidebar button */
    [data-testid="collapsedControl"] {
        background-color: var(--accent-color) !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 999 !important;
        border-radius: 0 4px 4px 0 !important;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
        position: relative !important;
        width: 36px !important;
        height: 36px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border: 2px solid white !important;
        color: white !important; /* Ensure text color is white */
    }
    
    /* Style all possible SVG elements with !important on every property */
    [data-testid="collapsedControl"] svg,
    [data-testid="collapsedControl"] svg path,
    [data-testid="collapsedControl"] svg rect,
    [data-testid="collapsedControl"] svg circle,
    [data-testid="collapsedControl"] svg line,
    [data-testid="collapsedControl"] svg polyline,
    [data-testid="collapsedControl"] svg polygon {
        fill: white !important;
        stroke: white !important;
        color: white !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important; /* Ensure SVG is displayed */
    }
    
    /* Add a backup icon using ::after with !important on every property */
    [data-testid="collapsedControl"]::after {
        content: "≡" !important;
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        font-size: 24px !important;
        color: white !important;
        z-index: 1000 !important;
        pointer-events: none !important;
        display: block !important;
    }
    
    /* Mobile-specific styles */
    @media (max-width: 768px) {
        /* Ensure hamburger menu is visible on mobile */
        button[data-testid="baseButton-header"] {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 1000 !important;
        }
        
        /* Ensure sidebar toggle is visible */
        [data-testid="collapsedControl"] {
            display: flex !important;
            position: fixed !important;
            top: 60px !important;
            left: 0 !important;
            width: 36px !important;
            height: 36px !important;
            padding: 0.5rem !important;
            align-items: center !important;
            justify-content: center !important;
            background-color: #FF7D00 !important; /* Explicit orange color for mobile */
        }
        
        /* Fix for Streamlit's mobile sidebar behavior */
        section[data-testid="stSidebar"] {
            width: 80vw !important;
            max-width: 300px !important;
        }
    }
    
    /* Fix for sidebar text */
    .st-emotion-cache-16idsys p, .st-emotion-cache-16idsys label, 
    .st-emotion-cache-ue6h4q, .st-emotion-cache-10trblm,
    section[data-testid="stSidebar"] p, section[data-testid="stSidebar"] label,
    .st-emotion-cache-16idsys, .st-emotion-cache-ue6h4q {
        color: var(--text-color) !important;
    }
    
    /* Make input cursors visible */
    input, textarea, [contenteditable="true"] {
        caret-color: black !important; /* Use black instead of accent color for better visibility */
    }
    
    /* Ensure text inputs have visible cursors */
    .stTextInput input, .stTextArea textarea, 
    div[data-baseweb="input"] input, div[data-baseweb="textarea"] textarea,
    section[data-testid="stSidebar"] input,
    section[data-testid="stSidebar"] textarea,
    input[type="text"], input[type="password"], textarea {
        caret-color: black !important;
        color: #333333 !important;
        background-color: white !important;
    }
    
    /* Error message styling */
    .error-message {
        color: #721c24;
        background-color: #f8d7da;
        padding: 10px;
        border-radius: 4px;
        font-size: 14px;
        border: 1px solid #f5c6cb;
    }
    
    /* Link styling */
    a {
        color: var(--accent-color) !important;
        text-decoration: none !important;
    }
    
    a:hover {
        text-decoration: underline !important;
    }
</style>
""", unsafe_allow_html=True)


async def process_job(scraper, matcher, notifier, job, resume_content):
    """Process a single job posting"""
    job_content = await scraper.scrape_job_content(job.url)
    result = await matcher.evaluate_match(resume_content, job_content)
    
    # Update is_match based on match_score threshold (50%)
    result["is_match"] = result["is_match"] and int(result["match_score"]) >= 50
    
    if result["is_match"]:
        await notifier.send_match(job, result["reason"])

    return job, result


async def main():
    """Main function to run the resume parser application."""
    st.title("Resume Job Matcher")
    
    # API Key input in the sidebar
    with st.sidebar:
        st.markdown("<h3>Configuration</h3>", unsafe_allow_html=True)
        
        # API Key input
        firecrawl_api_key = st.text_input(
            "Firecrawl API Key", 
            value=os.getenv("FIRECRAWL_API_KEY", ""),
            type="password",
            placeholder="Enter your Firecrawl API key",
            help="Your Firecrawl API key is required to parse resumes and job listings"
        )
        
        # Save API key to environment
        if firecrawl_api_key:
            os.environ["FIRECRAWL_API_KEY"] = firecrawl_api_key
            # Create a container for API key validation messages
            api_key_message = st.empty()
            
            # Validate the API key
            try:
                # Try to create a FirecrawlApp instance to validate the key
                test_app = FirecrawlApp(api_key=firecrawl_api_key)
                # If no exception is raised, the key is valid
                api_key_message.markdown('<p class="success-message">✅ API key successfully set</p>', unsafe_allow_html=True)
            except Exception as e:
                # If an exception is raised, the key is invalid
                api_key_message.markdown('<p style="color: #721c24; background-color: #f8d7da; padding: 8px; border-radius: 4px; font-size: 14px; border: 1px solid #f5c6cb;">❌ Invalid API key. Please check and try again.</p>', unsafe_allow_html=True)
                # Clear the environment variable to prevent further errors
                os.environ.pop("FIRECRAWL_API_KEY", None)
        
        st.divider()
        
        st.markdown("<h3>Manage Job Sources</h3>", unsafe_allow_html=True)

        # Add new job source
        new_source = st.text_input(
            "Add Job Source URL", 
            placeholder="https://www.company.com/jobs",
            key="new_source_input"
        )

        col1, col2 = st.columns([2, 1])
        with col1:
            # Add JavaScript to disable the button when input is empty
            st.markdown("""
            <script>
            // Function to check input and disable/enable button
            function checkInput() {
                const input = document.querySelector('input[aria-label="Add Job Source URL"]');
                const button = document.querySelector('button[kind="primary"][data-testid="baseButton-primary"]');
                
                if (input && button) {
                    if (input.value.trim() === '') {
                        button.disabled = true;
                        button.style.backgroundColor = '#cccccc';
                        button.style.color = '#666666';
                        button.style.cursor = 'not-allowed';
                    } else {
                        button.disabled = false;
                        button.style.backgroundColor = '#FF7D00';
                        button.style.color = 'white';
                        button.style.cursor = 'pointer';
                    }
                }
            }
            
            // Set initial state
            document.addEventListener('DOMContentLoaded', function() {
                checkInput();
                
                // Add event listener to input
                const input = document.querySelector('input[aria-label="Add Job Source URL"]');
                if (input) {
                    input.addEventListener('input', checkInput);
                }
            });
            </script>
            """, unsafe_allow_html=True)
            
            if st.button("Add Source", key="add_source_btn", help="Add this URL to your job sources", use_container_width=True, disabled=(not new_source)):
                db = Database()
                db.save_job_source(new_source)
                st.success("Job source added!")

        # List and delete existing sources
        st.markdown("<h4>Current Sources</h4>", unsafe_allow_html=True)
        db = Database()
        sources = db.get_job_sources()
        
        if not sources:
            st.markdown('<p style="font-style: italic; font-size: 0.9rem;">No sources added yet. Add a job source URL above.</p>', unsafe_allow_html=True)
        
        for source in sources:
            col1, col2 = st.columns([3, 1])
            with col1:
                st.markdown(f'<div class="source-item">{source.url}</div>', unsafe_allow_html=True)
            with col2:
                if st.button("Delete", key=f"{source.url}_delete", help="Remove this job source"):
                    db.delete_job_source(source.url)
                    st.rerun()
        
        st.divider()
        
        # Resume PDF URL input in sidebar
        st.markdown("<h3>Resume Analysis</h3>", unsafe_allow_html=True)
        st.markdown('<p style="font-weight: 500; margin-bottom: 5px;">Enter Resume PDF URL</p>', unsafe_allow_html=True)
        resume_url = st.text_input(
            label="Resume URL",
            placeholder="https://www.website.com/resume.pdf",
            label_visibility="collapsed",
            key="resume_url_input"
        )
        
        # Add JavaScript to disable the Analyze Resume button when input is empty
        st.markdown("""
        <script>
        // Function to check resume URL input and disable/enable button
        function checkResumeInput() {
            const input = document.querySelector('input[aria-label="Resume URL"]');
            const button = document.querySelector('button:contains("Analyze Resume")');
            
            if (input && button) {
                if (input.value.trim() === '') {
                    button.disabled = true;
                    button.style.backgroundColor = '#cccccc';
                    button.style.color = '#666666';
                    button.style.cursor = 'not-allowed';
                } else {
                    button.disabled = false;
                    button.style.backgroundColor = '#FF7D00';
                    button.style.color = 'white';
                    button.style.cursor = 'pointer';
                }
            }
        }
        
        // Set initial state
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                checkResumeInput();
                
                // Add event listener to input
                const input = document.querySelector('input[aria-label="Resume URL"]');
                if (input) {
                    input.addEventListener('input', checkResumeInput);
                }
                
                // Fix for button selector
                if (!document.querySelector('button:contains("Analyze Resume")')) {
                    const allButtons = document.querySelectorAll('button');
                    allButtons.forEach(function(btn) {
                        if (btn.textContent.includes('Analyze Resume')) {
                            if (document.querySelector('input[aria-label="Resume URL"]').value.trim() === '') {
                                btn.disabled = true;
                                btn.style.backgroundColor = '#cccccc';
                                btn.style.color = '#666666';
                                btn.style.cursor = 'not-allowed';
                            }
                            
                            document.querySelector('input[aria-label="Resume URL"]').addEventListener('input', function() {
                                if (this.value.trim() === '') {
                                    btn.disabled = true;
                                    btn.style.backgroundColor = '#cccccc';
                                    btn.style.color = '#666666';
                                    btn.style.cursor = 'not-allowed';
                                } else {
                                    btn.disabled = false;
                                    btn.style.backgroundColor = '#FF7D00';
                                    btn.style.color = 'white';
                                    btn.style.cursor = 'pointer';
                                }
                            });
                        }
                    });
                }
            }, 1000); // Small delay to ensure DOM is fully loaded
        });
        </script>
        """, unsafe_allow_html=True)
        
        # Create analyze button in sidebar
        analyze_button = st.button("Analyze Resume", use_container_width=True, disabled=(not resume_url))
        
    # Main content
    st.markdown(
        """
    <div class="info-box">
        <h3 style="margin-top: 0;">How It Works</h3>
        <p>This app helps you find matching jobs by:</p>
        <ul>
            <li>Analyzing your resume from a PDF URL</li>
            <li>Scraping job postings from your saved job sources</li>
            <li>Using AI to evaluate if you're a good fit for each position</li>
        </ul>
        <p>Simply paste your resume URL in the sidebar to get started!</p>
    </div>
    """,
        unsafe_allow_html=True
    )

    # Check if API key is provided
    if not os.getenv("FIRECRAWL_API_KEY"):
        st.warning("Please enter your Firecrawl API key in the sidebar to continue.")
        return

    if analyze_button and resume_url:
        try:
            # Initialize services
            scraper = JobScraper()
            matcher = JobMatcher()
            notifier = DiscordNotifier()
            db = Database()
            
            with st.spinner("Parsing resume..."):
                resume_content = await scraper.parse_resume(resume_url)

            # Get job sources from database
            sources = db.get_job_sources()
            if not sources:
                st.warning("No job sources configured. Add some in the sidebar!")
                return

            with st.spinner("Scraping job postings..."):
                jobs = await scraper.scrape_job_postings([s.url for s in sources])

            if not jobs:
                st.warning("No jobs found in the configured sources.")
                return

            with st.spinner(f"Analyzing {len(jobs)} jobs..."):
                tasks = []
                for job in jobs:
                    task = process_job(scraper, matcher, notifier, job, resume_content)
                    tasks.append(task)

                # Create a container for results with custom styling
                results_container = st.container()
                with results_container:
                    st.markdown("<h2>Job Matches</h2>", unsafe_allow_html=True)
                    
                    # Collect all results first
                    job_results = []
                    for coro in asyncio.as_completed(tasks):
                        job, result = await coro
                        job_results.append((job, result))
                    
                    # Sort job results by match score (high to low)
                    job_results.sort(key=lambda x: int(x[1]["match_score"]), reverse=True)
                    
                    # Display sorted results
                    for job, result in job_results:
                        # Create a card-like container for each job
                        with st.container():
                            st.markdown(f"""
                            <div class="card">
                                <h3 style="margin-top: 0;">{job.title}</h3>
                                <p><strong>URL:</strong> <a href="{job.url}" target="_blank">{job.url}</a></p>
                                <p><strong>Match:</strong> <span class="match-status {
                                    'good-match' if result["is_match"] else 'poor-match'
                                }">{"✅ Good Match" if result["is_match"] else "❌ Not a Match"}</span></p>
                                <p><strong>Reason:</strong> {result["reason"]}</p>
                                <p><strong>Match Score:</strong> <span style="font-weight: 600;">{result["match_score"]}%</span></p>
                                <div class="match-score-bar">
                                    <div class="match-score-fill {
                                        'match-score-low' if int(result["match_score"]) < 50 else 
                                        'match-score-medium' if int(result["match_score"]) < 75 else 
                                        'match-score-high'
                                    }" style="width: {result["match_score"]}%;"></div>
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
        except Exception as e:
            if "API key" in str(e) or "authentication" in str(e).lower() or "unauthorized" in str(e).lower():
                st.markdown('<div class="error-message" style="padding: 10px; margin-bottom: 16px;">❌ Invalid API key. Please check your Firecrawl API key in the sidebar and try again.</div>', unsafe_allow_html=True)
            else:
                st.markdown(f'<div class="error-message" style="padding: 10px; margin-bottom: 16px;">❌ An error occurred: {str(e)}</div>', unsafe_allow_html=True)

        st.success(f"Analysis complete! Processed {len(jobs)} jobs.")


if __name__ == "__main__":
    asyncio.run(main())