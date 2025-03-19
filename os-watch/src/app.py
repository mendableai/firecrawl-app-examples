import streamlit as st
import json
import os
import sys
from datetime import datetime
from typing import List, Dict, Any, Optional

# Add project root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import our modules with absolute imports instead of relative imports
from src.config import AppConfig, NotificationConfig, SearchConfig, DEFAULT_CONFIG
from src.scraper import GitHubTrendScraper
from src.notifier import SlackNotifier
from src.scheduler import Scheduler

# Set page config
st.set_page_config(page_title="Open-source Watch", page_icon="🔍", layout="wide")

# Initialize session state
if "config" not in st.session_state:
    st.session_state.config = DEFAULT_CONFIG

if "scheduler" not in st.session_state:
    st.session_state.scheduler = Scheduler()

if "last_results" not in st.session_state:
    st.session_state.last_results = []

if "is_scheduled" not in st.session_state:
    st.session_state.is_scheduled = False

if "firecrawl_api_key" not in st.session_state:
    st.session_state.firecrawl_api_key = os.environ.get("FIRECRAWL_API_KEY", "")


def run_scrape_task():
    """Run the scraping task and send notification"""
    config = st.session_state.config

    # Set the API key in environment for the scraper to use
    if st.session_state.firecrawl_api_key:
        os.environ["FIRECRAWL_API_KEY"] = st.session_state.firecrawl_api_key

    # Create scraper
    scraper = GitHubTrendScraper(config.search)

    # Run the scrape
    repositories = scraper.scrape()

    # Store results for display
    st.session_state.last_results = repositories

    # Send notification if webhook URL is configured
    if config.notification.webhook_url:
        notifier = SlackNotifier(config.notification)
        notifier.send_notification(repositories, config.search.keywords)

    return repositories


def start_scheduler():
    """Start the scheduler with the current configuration"""
    config = st.session_state.config

    if st.session_state.scheduler.running:
        st.session_state.scheduler.stop()

    # Start the scheduler
    success = st.session_state.scheduler.start(
        task=run_scrape_task,
        frequency=config.notification.frequency,
        time_of_day=config.notification.time_of_day,
    )

    st.session_state.is_scheduled = success
    return success


def stop_scheduler():
    """Stop the scheduler"""
    success = st.session_state.scheduler.stop()
    st.session_state.is_scheduled = False
    return success


def save_config():
    """Save the current configuration to environment variables"""
    config = st.session_state.config

    # Update environment variables
    os.environ["SLACK_WEBHOOK_URL"] = config.notification.webhook_url
    os.environ["NOTIFICATION_FREQUENCY"] = config.notification.frequency
    os.environ["NOTIFICATION_TIME"] = config.notification.time_of_day
    os.environ["SEARCH_KEYWORDS"] = ",".join(config.search.keywords)
    os.environ["SEARCH_LANGUAGE"] = config.search.language or ""
    os.environ["SEARCH_PERIOD"] = config.search.time_period

    # Save Firecrawl API key if it exists in session state
    if "firecrawl_api_key" in st.session_state and st.session_state.firecrawl_api_key:
        os.environ["FIRECRAWL_API_KEY"] = st.session_state.firecrawl_api_key

    # Save to .env file
    with open(".env", "w") as f:
        f.write(f"SLACK_WEBHOOK_URL={config.notification.webhook_url}\n")
        f.write(f"NOTIFICATION_FREQUENCY={config.notification.frequency}\n")
        f.write(f"NOTIFICATION_TIME={config.notification.time_of_day}\n")
        f.write(f"SEARCH_KEYWORDS={','.join(config.search.keywords)}\n")
        f.write(f"SEARCH_LANGUAGE={config.search.language or ''}\n")
        f.write(f"SEARCH_PERIOD={config.search.time_period}\n")
        # Add Firecrawl API key if it exists
        if (
            "firecrawl_api_key" in st.session_state
            and st.session_state.firecrawl_api_key
        ):
            f.write(f"FIRECRAWL_API_KEY={st.session_state.firecrawl_api_key}\n")


def main():
    """Main Streamlit application"""
    st.title("🔍 Open-source Watch")
    st.subheader(
        "Monitor trending GitHub repositories on schedule and get Slack notifications when new repositories are trending."
    )

    # Create tabs for different sections
    tab1, tab2, tab3 = st.tabs(["Search", "Configure", "Results"])

    with tab1:
        st.header("Search for trending repositories")

        # Create a form for the search options
        with st.form("search_form"):
            col1, col2 = st.columns(2)

            with col1:
                # Keywords input
                keywords = st.text_input(
                    "Keywords (comma separated)",
                    value=",".join(st.session_state.config.search.keywords),
                )

                # Language selection
                language = st.selectbox(
                    "Programming language",
                    [
                        "All",
                        "Python",
                        "JavaScript",
                        "TypeScript",
                        "Go",
                        "Rust",
                        "Java",
                        "C++",
                        "C#",
                        "PHP",
                    ],
                    index=(
                        0
                        if not st.session_state.config.search.language
                        else [
                            "All",
                            "Python",
                            "JavaScript",
                            "TypeScript",
                            "Go",
                            "Rust",
                            "Java",
                            "C++",
                            "C#",
                            "PHP",
                        ].index(st.session_state.config.search.language)
                    ),
                )

            with col2:
                # Time period selection
                time_period = st.selectbox(
                    "Trending period",
                    ["daily", "weekly", "monthly"],
                    index=["daily", "weekly", "monthly"].index(
                        st.session_state.config.search.time_period
                    ),
                )

            # Submit button
            submitted = st.form_submit_button("Search Now")

            if submitted:
                # Update the configuration
                keywords_list = [k.strip() for k in keywords.split(",") if k.strip()]
                lang = None if language == "All" else language

                st.session_state.config.search = SearchConfig(
                    keywords=keywords_list, language=lang, time_period=time_period
                )

                # Run the search
                with st.spinner("Searching for trending repositories..."):
                    results = run_scrape_task()

                # Save the configuration
                save_config()

                # Restart the scheduler if it's running
                if st.session_state.is_scheduled:
                    stop_scheduler()
                    start_scheduler()

                # Show success message
                if results:
                    st.success(
                        f"Found {len(results)} trending repositories matching your keywords!"
                    )
                else:
                    st.warning("No trending repositories found matching your keywords.")

        # Show the scheduler status
        st.subheader("Scheduler status")

        if st.session_state.is_scheduled:
            next_run_info = st.session_state.scheduler.get_next_run_info()

            if next_run_info["scheduled"]:
                st.info(
                    f"Next scheduled run: {next_run_info['next_run']} (in {next_run_info['time_until']})"
                )

                if next_run_info["last_run"]:
                    st.text(f"Last run: {next_run_info['last_run']}")
            else:
                st.text("Scheduler is running but no task is scheduled yet.")

            if st.button("Stop Scheduler"):
                if stop_scheduler():
                    st.success("Scheduler stopped")
                else:
                    st.error("Failed to stop scheduler")
        else:
            if st.button("Start Scheduler"):
                if start_scheduler():
                    st.success("Scheduler started")
                else:
                    st.error("Failed to start scheduler")

    with tab2:
        st.header("Configure notifications")

        # Create a form for the notification settings
        with st.form("notification_form"):
            # Firecrawl API Key input
            firecrawl_api_key = st.text_input(
                "Firecrawl API Key",
                value=os.environ.get("FIRECRAWL_API_KEY", ""),
                type="password",
                help="Required for scraping GitHub trending repositories. Get your API key from Firecrawl.",
            )

            # Webhook URL input
            webhook_url = st.text_input(
                "Slack Webhook URL",
                value=st.session_state.config.notification.webhook_url,
            )

            col1, col2 = st.columns(2)

            with col1:
                # Frequency selection
                frequency = st.selectbox(
                    "Notification frequency",
                    ["hourly", "daily", "weekly"],
                    index=["hourly", "daily", "weekly"].index(
                        st.session_state.config.notification.frequency
                    ),
                )

            with col2:
                # Time of day input (for daily/weekly)
                time_of_day = st.text_input(
                    "Time of day (HH:MM, for daily/weekly)",
                    value=st.session_state.config.notification.time_of_day,
                )

            # Submit button
            submitted = st.form_submit_button("Save Configuration")

            if submitted:
                # Update the notification settings
                st.session_state.config.notification = NotificationConfig(
                    webhook_url=webhook_url,
                    frequency=frequency,
                    time_of_day=time_of_day,
                )

                # Store the Firecrawl API key in session state
                st.session_state.firecrawl_api_key = firecrawl_api_key

                # Save the configuration
                save_config()

                # Restart the scheduler if it's running
                if st.session_state.is_scheduled:
                    stop_scheduler()
                    start_scheduler()

                # Show success message
                st.success("Configuration saved successfully!")

        # Test notification
        st.subheader("Test notification")

        if st.button("Send Test Notification"):
            if not st.session_state.config.notification.webhook_url:
                st.error("Please configure a webhook URL first")
            else:
                # Run the search and send notification
                with st.spinner("Sending test notification..."):
                    results = run_scrape_task()

                if results:
                    st.success(
                        f"Test notification sent with {len(results)} repositories"
                    )
                else:
                    st.warning(
                        "No repositories found to include in the test notification"
                    )

    with tab3:
        st.header("Latest results")

        # Check if we have results to display
        if not st.session_state.last_results:
            st.info("No results yet. Run a search to see trending repositories.")
        else:
            # Display the results
            st.write(
                f"Found {len(st.session_state.last_results)} trending repositories"
            )

            for repo in st.session_state.last_results:
                with st.expander(
                    f"#{repo.get('rank', 'N/A')} - {repo.get('name', 'Unknown')}"
                ):
                    st.write(
                        f"**Description:** {repo.get('description', 'No description')}"
                    )
                    st.write(f"**URL:** {repo.get('url', '#')}")

                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("Stars", repo.get("stars", "N/A"))
                    with col2:
                        st.metric("Today", repo.get("today_stars", "N/A"))
                    with col3:
                        st.metric("Language", repo.get("language", "Unknown"))


if __name__ == "__main__":
    main()
