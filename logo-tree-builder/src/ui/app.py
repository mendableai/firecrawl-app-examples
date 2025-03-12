import sys
import os
import streamlit as st
import asyncio
import time
import json

# Add the src directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scraper.tree_builder import ClientTreeBuilder
from visualization.graph_renderer import ClientGraphRenderer


class ClientTreeApp:
    """Streamlit application for the Client Tree Builder."""

    def __init__(self):
        """Initialize the application."""
        self.tree_builder = None
        self.renderer = ClientGraphRenderer()

    def run(self):
        """Run the Streamlit application."""
        st.set_page_config(
            page_title="Client Relationship Tree Builder",
            page_icon="🌳",
            layout="centered",
        )

        st.title("🌳 Client Relationship Tree Builder")
        st.markdown(
            """
        This application builds a visual tree showing client relationships between companies by analyzing website content.
        
        ### How to use:
        1. Enter your Firecrawl API key below (sign up at firecrawl.dev if you don't have one)
        2. Enter the website URL of the company you want to analyze
        3. Adjust the crawl depth and maximum clients per level settings
        4. Click "Build client tree" to start the process
        5. View the interactive visualization and download data in your preferred format
        
        **Note:** Higher depth values will take longer to process but provide more comprehensive relationship mapping.
        """
        )

        st.warning(
            """
            **Disclaimer about URL structures:**  
            Different websites use different URL structures for client references. For example:
            - Platforms like Hugging Face use path-based URLs (huggingface.co/client)
            - Others use direct domain links (client.com)
            
            These differences may cause duplicate node labels or cyclical connections in the visualization.
            """
        )

        # Create side-by-side input fields for API key and website URL
        col1, col2 = st.columns([2, 1])  # 2/3 for API key, 1/3 for website URL

        # API Key input (with password masking)
        with col1:
            api_key = st.text_input(
                "Firecrawl API key",
                type="password",
                help="Your Firecrawl API key. Sign up at firecrawl.dev if you don't have one.",
            )

        # Company URL input
        with col2:
            company_url = st.text_input(
                "Company website URL",
                placeholder="https://firecrawl.dev",
                help="Enter the full URL of the company's website",
            )

        # Initialize tree builder when API key is provided
        if api_key:
            self.tree_builder = ClientTreeBuilder(api_key=api_key)

        # Set up columns for input controls
        col1, col2 = st.columns(2)

        # Crawl depth selection
        with col1:
            max_depth = st.number_input(
                "Maximum crawl depth",
                min_value=1,
                max_value=3,
                value=2,
                help="How many levels of clients to crawl (higher values will take longer)",
            )

        # Max clients per company
        with col2:
            max_clients = st.slider(
                "Maximum clients per level (excluding root)",
                min_value=3,
                max_value=20,
                value=10,
                help="Limit the number of clients per company to prevent exponential growth",
            )

        # After the existing input controls and before the "Build client tree" button
        with st.expander("Advanced Visualization Settings"):
            col1, col2 = st.columns(2)

            with col1:
                node_spacing = st.slider(
                    "Node spacing",
                    min_value=100,
                    max_value=500,
                    value=200,
                    help="Distance between connected nodes (higher = more spread out)",
                )

                repulsion_strength = st.slider(
                    "Repulsion strength",
                    min_value=300,
                    max_value=2000,
                    value=800,
                    help="Force of repulsion between nodes (higher = more space)",
                )

            with col2:
                canvas_padding = st.slider(
                    "Canvas padding",
                    min_value=50,
                    max_value=300,
                    value=150,
                    help="Padding around the graph (higher = more empty space at edges)",
                )

        # Update the renderer with the new spacing parameters
        self.renderer = ClientGraphRenderer(
            node_spacing=node_spacing,
            repulsion_strength=repulsion_strength,
            canvas_padding=canvas_padding,
        )

        # Start button
        start_button = st.button(
            "Build client tree", disabled=not (api_key and company_url)
        )

        # Process when button is clicked
        if start_button and self.tree_builder:
            # Update max clients setting
            self.tree_builder.max_clients_per_company = max_clients

            # Create a placeholder for status messages
            status_text = st.empty()
            status_text.info("Building client tree... Please wait.")

            # Create a placeholder for the log
            log_container = st.empty()
            log_messages = []

            # Timer for tracking execution time
            start_time = time.time()

            def update_log(message):
                """Update the log with a new message."""
                log_messages.append(message)
                log_container.code("\n".join(log_messages), language="")

            update_log(
                f"Starting client tree build for {company_url} with depth {max_depth}..."
            )

            try:
                # Redirect print statements to our log
                original_print = print

                def custom_print(*args, **kwargs):
                    message = " ".join(str(arg) for arg in args)
                    update_log(message)
                    original_print(*args, **kwargs)

                # Replace print function temporarily
                import builtins

                builtins.print = custom_print

                # Run the tree building process
                company_tree = asyncio.run(
                    self.tree_builder.build_tree(company_url, max_depth=max_depth)
                )

                # Restore original print function
                builtins.print = original_print

                # Calculate elapsed time
                end_time = time.time()
                elapsed_time = end_time - start_time

                # Update status
                status_text.success(
                    f"Client tree built successfully in {elapsed_time:.2f} seconds!"
                )

                # Clear the log to save space
                log_container.empty()

                # Render the graph
                output_path = self.renderer.render_graph(company_tree)

                # Display client counts
                total_companies = self._count_companies(company_tree)
                st.metric("Total companies", total_companies)

                # Create download options
                st.subheader("Download options")
                col1, col2 = st.columns(2)

                # JSON tree download
                with col1:
                    json_data = company_tree.to_json()
                    st.download_button(
                        label="Download tree data (JSON)",
                        data=json_data,
                        file_name="client_tree_data.json",
                        mime="application/json",
                    )

                # HTML Graph download
                with col2:
                    with open(output_path, "rb") as f:
                        st.download_button(
                            label="Download interactive graph (HTML)",
                            data=f,
                            file_name="client_tree.html",
                            mime="text/html",
                        )

                # Display the graph
                st.subheader("Interactive client relationship graph")
                st.info(
                    "Click and drag nodes to rearrange. Scroll to zoom. Hover over nodes for details."
                )

                # Load and display the HTML using components.html
                with open(output_path, "r", encoding="utf-8") as f:
                    html_content = f.read()

                # Use full width for the graph
                st.components.v1.html(html_content, height=800, scrolling=False)

            except Exception as e:
                # Calculate elapsed time even for errors
                end_time = time.time()
                elapsed_time = end_time - start_time

                # Update status for error
                status_text.error(f"Error after {elapsed_time:.2f} seconds: {str(e)}")
                log_container.empty()
                st.error("Check the log above for details.")

    def _count_companies(self, company):
        """Count total number of companies in the tree."""
        count = 1  # Count this company
        for client in company.clients:
            count += self._count_companies(client)
        return count
