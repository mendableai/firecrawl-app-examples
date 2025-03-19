import os
from pydantic import BaseModel, Field
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class GitHubRepository(BaseModel):
    """Model for a GitHub repository extracted from trending page"""

    name: str = Field(description="Full name of the repository (owner/repo)")
    description: Optional[str] = Field(None, description="Repository description")
    language: Optional[str] = Field(None, description="Main programming language")
    stars_count: Optional[str] = Field(None, description="Total number of stars")
    stars_today: Optional[str] = Field(None, description="Stars gained today")
    forks_count: Optional[str] = Field(None, description="Total number of forks")
    repo_owner: Optional[str] = Field(None, description="Repository owner")
    repo_url: Optional[str] = Field(None, description="Repository URL")


class Repositories(BaseModel):
    """Wrapper model for a list of GitHub repositories"""

    repositories: List[GitHubRepository]


class NotificationConfig(BaseModel):
    """Configuration for notifications"""

    webhook_url: str
    frequency: str  # "hourly", "daily", "weekly"
    time_of_day: Optional[str] = "09:00"  # For daily/weekly notifications


class SearchConfig(BaseModel):
    """Configuration for GitHub trend searches"""

    keywords: List[str]
    language: Optional[str] = None
    time_period: str = "daily"  # "daily", "weekly", "monthly"


class AppConfig(BaseModel):
    """Main application configuration"""

    notification: NotificationConfig
    search: SearchConfig

    @classmethod
    def load_from_env(cls):
        """Load configuration from environment variables"""
        return cls(
            notification=NotificationConfig(
                webhook_url=os.environ.get("SLACK_WEBHOOK_URL", ""),
                frequency=os.environ.get("NOTIFICATION_FREQUENCY", "daily"),
                time_of_day=os.environ.get("NOTIFICATION_TIME", "09:00"),
            ),
            search=SearchConfig(
                keywords=os.environ.get("SEARCH_KEYWORDS", "python,ml,ai").split(","),
                language=os.environ.get("SEARCH_LANGUAGE", None),
                time_period=os.environ.get("SEARCH_PERIOD", "daily"),
            ),
        )


# Default configuration
DEFAULT_CONFIG = AppConfig(
    notification=NotificationConfig(
        webhook_url="",
        frequency="daily",
    ),
    search=SearchConfig(
        keywords=["python", "ml", "ai"],
        time_period="daily",
    ),
)
