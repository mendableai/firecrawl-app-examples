import json
import requests
import os
import sys
from typing import List, Dict, Any
from datetime import datetime
from dotenv import load_dotenv

# Handle running the file directly
if __name__ == "__main__":
    # Add the project root to the path for imports
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from src.config import (
        NotificationConfig,
        SearchConfig,
        GitHubRepository,
        Repositories,
    )
    from src.scraper import GitHubTrendScraper
else:
    # Normal import when used as a module
    from .config import NotificationConfig


class SlackNotifier:
    """Notifier for sending repository updates to Slack"""

    def __init__(self, config: NotificationConfig):
        self.config = config

    def send_notification(
        self, repositories: List[Dict[str, Any]], search_terms: List[str]
    ) -> bool:
        """Send a notification with trending repositories to Slack"""
        if not repositories:
            return False

        if not self.config.webhook_url:
            print("No webhook URL configured")
            return False

        # Create the message payload
        payload = self._create_message_payload(repositories, search_terms)

        try:
            # Send the message to Slack
            response = requests.post(
                self.config.webhook_url,
                data=json.dumps(payload),
                headers={"Content-Type": "application/json"},
            )

            if response.status_code != 200:
                print(
                    f"Failed to send notification: {response.status_code} {response.text}"
                )
                return False

            return True

        except Exception as e:
            print(f"Error sending notification: {str(e)}")
            return False

    def _create_message_payload(
        self, repositories: List[Dict[str, Any]], search_terms: List[str]
    ) -> Dict[str, Any]:
        """Create a formatted Slack message with repository information"""
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Create the message blocks
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🔍 GitHub Trending Update: {', '.join(search_terms)}",
                },
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "plain_text",
                        "text": f"Found {len(repositories)} trending repositories • {now}",
                    }
                ],
            },
            {"type": "divider"},
        ]

        # Add repository information
        for repo in repositories:
            star_info = f"⭐ {repo.get('stars', 'N/A')}"
            if repo.get("today_stars"):
                star_info += f" (+{repo.get('today_stars')} today)"

            blocks.extend(
                [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*<{repo['url']}|{repo['name']}>*\n{repo.get('description', 'No description')}",
                        },
                    },
                    {
                        "type": "context",
                        "elements": [
                            {
                                "type": "mrkdwn",
                                "text": f"{star_info} • Rank: #{repo.get('rank', 'N/A')} • Language: {repo.get('language', 'Unknown')}",
                            }
                        ],
                    },
                    {"type": "divider"},
                ]
            )

        # Add footer
        blocks.append(
            {
                "type": "context",
                "elements": [
                    {"type": "mrkdwn", "text": "Powered by Open-source Watch"}
                ],
            }
        )

        return {"blocks": blocks}


if __name__ == "__main__":
    print("Running GitHub Trending Scraper with Slack Notification...")

    # Load environment variables
    load_dotenv()
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL", "")
    api_key = os.environ.get("FIRECRAWL_API_KEY", "")

    if not webhook_url:
        print("Error: No webhook URL found in environment variables.")
        print("Please add SLACK_WEBHOOK_URL to your .env file.")
        exit(1)

    if not api_key:
        print("Error: No FIRECRAWL_API_KEY found in environment variables.")
        print("Please add FIRECRAWL_API_KEY to your .env file.")
        exit(1)

    # Configure the search parameters
    search_config = SearchConfig(
        keywords=["python", "ai", "ml"],  # Filter for these keywords
        language="Python",  # Only Python repositories
        time_period="daily",  # Daily trending repos
    )

    # Create notification config
    notification_config = NotificationConfig(
        webhook_url=webhook_url, frequency="daily", time_of_day="09:00"
    )

    # Create the scraper and notifier
    print("\nInitializing scraper and notifier...")
    scraper = GitHubTrendScraper(search_config)
    notifier = SlackNotifier(notification_config)

    # Scrape trending repositories
    print("Scraping GitHub trending repositories...")
    try:
        repositories = scraper.scrape()

        if repositories:
            repo_count = len(repositories)
            print(f"✅ Successfully scraped {repo_count} trending repositories.")

            # Print the first few repos for verification
            for i, repo in enumerate(repositories[:3]):
                if i == 0:
                    print("\nSample repositories:")
                print(
                    f"  {i+1}. {repo.get('name')} - ⭐ {repo.get('stars')} (+{repo.get('today_stars', 'N/A')} today)"
                )
                print(f"     {repo.get('description', '')[:80]}...")

            if repo_count > 3:
                print(f"     ... and {repo_count - 3} more")

            # Send notification
            print("\nSending notification to Slack...")
            success = notifier.send_notification(repositories, search_config.keywords)

            if success:
                print("✅ Notification sent successfully!")
            else:
                print("❌ Failed to send notification.")
        else:
            print("⚠️ No repositories found matching the search criteria.")

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback

        traceback.print_exc()

    print("\nDone!")
