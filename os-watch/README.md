# Open-source Watch

Monitor trending GitHub repositories and receive notifications via Slack.

## Features

- Search GitHub trending repositories by keywords
- Filter by programming language and time period (daily, weekly, monthly)
- Schedule automated monitoring and notifications
- Receive notifications via Slack webhooks
- Simple and intuitive UI built with Streamlit

## Setup

### Prerequisites

- Python 3.10 or higher
- Poetry (for dependency management)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
poetry install
```

3. Copy `.env.example` to `.env` and update with your Slack webhook URL:

```bash
cp .env.example .env
```

### Running the application

```bash
cd src
streamlit run app.py
```

This will start the Streamlit server and open the application in your browser.

## Usage

1. In the "Search" tab, enter keywords to search for in trending repositories
2. Select a programming language and time period
3. Click "Search Now" to see results immediately
4. Configure Slack webhook URL in the "Configure" tab
5. Set notification frequency and time of day
6. Start the scheduler to receive regular updates

## Configuration

The application uses environment variables for configuration. These can be set in the `.env` file or through the UI:

- `SLACK_WEBHOOK_URL`: Your Slack webhook URL
- `NOTIFICATION_FREQUENCY`: How often to send notifications (hourly, daily, weekly)
- `NOTIFICATION_TIME`: Time of day for notifications (HH:MM format)
- `SEARCH_KEYWORDS`: Comma-separated list of keywords to search for
- `SEARCH_LANGUAGE`: Programming language to filter by (leave empty for all)
- `SEARCH_PERIOD`: Trending period (daily, weekly, monthly)

## Technology

- Streamlit: UI framework
- Firecrawl: Web scraping
- Pydantic: Data validation and settings management
- Python-dotenv: Environment variable management
