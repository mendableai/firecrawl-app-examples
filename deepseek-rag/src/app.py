import glob
import logging
from pathlib import Path

import streamlit as st
from dotenv import load_dotenv
from rag import DocumentationRAG
from scraper import DocumentationScraper

load_dotenv()

# Configure logging with a stream handler to output to terminal
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)

# Get logger for the application
logger = logging.getLogger(__name__)


def get_existing_docs():
    """Get all documentation directories with -docs suffix"""
    docs_dirs = glob.glob("*-docs")
    return [Path(dir_path).name for dir_path in docs_dirs]


def get_doc_page_count(docs_dir: str) -> int:
    """Get number of markdown files in a documentation directory"""
    return len(list(Path(docs_dir).glob("*.md")))


def scraping_config_section():
    """Create the documentation scraping configuration section"""
    st.markdown("### Configure Scraping")
    base_url = st.text_input(
        "Documentation URL",
        placeholder="https://docs.firecrawl.dev",
        help="The base URL of the documentation to scrape",
    )

    docs_name = st.text_input(
        "Documentation Name",
        placeholder="Firecrawl-docs",
        help="Name of the directory to store documentation",
    )

    n_pages = st.number_input(
        "Number of Pages",
        min_value=0,
        value=0,
        help="Limit the number of pages to scrape (0 for all pages)",
    )

    st.info(
        "💡 Add '-docs' suffix to the documentation name. "
        "Set pages to 0 to scrape all available pages."
    )

    # Add scrape button
    if st.button("Start Scraping"):
        if not base_url or not docs_name:
            st.error("Please provide both URL and documentation name")
        elif not docs_name.endswith("-docs"):
            st.error("Documentation name must end with '-docs'")
        else:
            with st.spinner("Scraping documentation..."):
                try:
                    scraper = DocumentationScraper()
                    n_pages = None if n_pages == 0 else n_pages
                    scraper.pull_docs(base_url, docs_name, n_pages=n_pages)
                    st.success("Documentation scraped successfully!")
                except Exception as e:
                    st.error(f"Error scraping documentation: {str(e)}")


def documentation_select_section():
    """Create the documentation selection section"""
    st.markdown("### Select Documentation")
    existing_docs = get_existing_docs()

    if not existing_docs:
        st.caption("No documentation found yet")
        return None

    # Create options with page counts
    doc_options = [f"{doc} ({get_doc_page_count(doc)} pages)" for doc in existing_docs]

    selected_doc = st.selectbox(
        "Choose documentation to use as context",
        options=doc_options,
        help="Select which documentation to use for answering questions",
    )

    if selected_doc:
        # Extract the actual doc name without page count
        st.session_state.current_doc = selected_doc.split(" (")[0]
        return st.session_state.current_doc
    return None


def sidebar():
    """Create the sidebar UI components"""
    with st.sidebar:
        st.title("Documentation Scraper")

        # Scraping configuration section
        scraping_config_section()

        # Documentation selection section
        documentation_select_section()


def initialize_chat_state():
    """Initialize session state for chat"""
    if "messages" not in st.session_state:
        st.session_state.messages = [
            {
                "role": "assistant",
                "content": "👋 Hi! I'm your documentation assistant. I can help you understand any documentation you've scraped and chosen from the sidebar.",
            }
        ]
    if "rag" not in st.session_state:
        st.session_state.rag = DocumentationRAG()


def chat_interface():
    """Create the chat interface"""
    st.title("Documentation Assistant")

    # Check if documentation is selected
    if "current_doc" not in st.session_state:
        st.info("Please select a documentation from the sidebar to start chatting.")
        return

    # Process documentation if not already processed
    if (
        "docs_processed" not in st.session_state
        or st.session_state.docs_processed != st.session_state.current_doc
    ):
        with st.spinner("Processing documentation..."):
            st.session_state.rag.process_documents(st.session_state.current_doc)
            st.session_state.docs_processed = st.session_state.current_doc

    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if "chain_of_thought" in message:
                with st.expander("View reasoning"):
                    st.markdown(message["chain_of_thought"])

    # Chat input
    if prompt := st.chat_input("Ask a question about the documentation"):
        # Add user message
        st.session_state.messages.append({"role": "user", "content": prompt})

        # Get response from RAG
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                response, chain_of_thought = st.session_state.rag.query(prompt)
                st.markdown(response)
                with st.expander("View reasoning"):
                    st.markdown(chain_of_thought)

        # Add assistant message
        st.session_state.messages.append(
            {
                "role": "assistant",
                "content": response,
                "chain_of_thought": chain_of_thought,
            }
        )


def main():
    initialize_chat_state()
    sidebar()
    chat_interface()


if __name__ == "__main__":
    main()
