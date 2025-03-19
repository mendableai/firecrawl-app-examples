import json
import requests
from typing import List, Dict, Any
from datetime import datetime
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
