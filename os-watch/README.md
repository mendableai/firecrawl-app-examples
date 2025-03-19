# Open-source Watch

Monitor trending GitHub repositories and receive notifications via Slack. This application helps teams and individuals stay informed about the latest open-source projects that match specific criteria.

## Features

- Search GitHub trending repositories by keywords
- Filter by programming language and time period (daily, weekly, monthly)
- Schedule automated monitoring and notifications
- Receive detailed notifications via Slack webhooks
- Simple and intuitive UI built with Streamlit

## Demo

![Open-source Watch Demo](docs/demo.gif)

## Setup instructions

### Prerequisites

- Python 3.10 or higher
- Poetry (for dependency management)
- Firecrawl API key (for web scraping)
- Slack workspace with permission to create webhooks

### Step 1: Clone the repository

```bash
git clone https://github.com/yourusername/open-source-watch.git
cd open-source-watch
```

### Step 2: Install dependencies

The project uses Poetry for dependency management. Install Poetry if you haven't already:

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

Then install project dependencies:

```bash
poetry install
```

### Step 3: Set up Firecrawl API key

1. Visit [Firecrawl](https://firecrawl.dev/) and create an account
2. Navigate to your account settings or API dashboard
3. Generate a new API key
4. Copy the API key for the next step

### Step 4: Set up Slack webhook

1. Log in to your Slack workspace
2. Go to [Slack API Apps](https://api.slack.com/apps)
3. Click "Create New App" and select "From scratch"
4. Give your app a name (e.g., "Open-source Watch") and select your workspace
5. In the left sidebar, click on "Incoming Webhooks"
6. Toggle "Activate Incoming Webhooks" to on
7. Click "Add New Webhook to Workspace"
8. Select the channel where you want to receive notifications
9. Click "Allow" to authorize the webhook
10. Copy the webhook URL (it should look like `https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXX`)

### Step 5: Configure environment variables

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Edit the `.env` file and fill in your Firecrawl API key and Slack webhook URL:

```yaml
FIRECRAWL_API_KEY=fc-your_api_key_here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXX
NOTIFICATION_FREQUENCY=daily
NOTIFICATION_TIME=09:00
SEARCH_KEYWORDS=python,ml,ai
SEARCH_LANGUAGE=
SEARCH_PERIOD=daily
```

### Step 6: Run the application

To start the application:

```bash
cd src
streamlit run app.py
```

This will start the Streamlit server and open the application in your browser, typically at `http://localhost:8501`.

## Usage guide

### Searching repositories

1. In the "Search" tab, enter keywords to search for in trending repositories (comma-separated)
2. Select a programming language from the dropdown menu
3. Choose a time period (daily, weekly, monthly)
4. Click "Search Now" to see results immediately

### Configuring notifications

1. Navigate to the "Configure" tab
2. Confirm or update your Slack webhook URL
3. Set notification frequency (hourly, daily, weekly)
4. Specify the time of day for notifications (in 24-hour format, e.g., "09:00")
5. Click "Save Configuration" to store your settings

### Setting up automatic notifications

1. After configuring your search and notification preferences
2. Click "Start Scheduler" in the Configure tab
3. The application will now send notifications based on your schedule
4. You can stop the scheduler at any time by clicking "Stop Scheduler"

### Viewing results

The "Results" tab shows the most recent search results, including:

- Repository name and description
- Star count and new stars today
- Programming language
- Rank among trending repositories

## Configuration options

The application can be configured through the UI or by editing the `.env` file:

- `FIRECRAWL_API_KEY`: Your Firecrawl API key for web scraping
- `SLACK_WEBHOOK_URL`: Your Slack webhook URL for notifications
- `NOTIFICATION_FREQUENCY`: How often to send notifications (hourly, daily, weekly)
- `NOTIFICATION_TIME`: Time of day for notifications (HH:MM format in 24-hour time)
- `SEARCH_KEYWORDS`: Comma-separated list of keywords to search for
- `SEARCH_LANGUAGE`: Programming language to filter by (leave empty for all)
- `SEARCH_PERIOD`: Trending period (daily, weekly, monthly)

## Troubleshooting

### Common issues

1. **Slack webhook not working**
   - Ensure the webhook URL is correct
   - Check that the Slack app is properly installed in your workspace
   - Verify the channel still exists and the bot has access

2. **No repositories found**
   - Try broadening your search keywords
   - Check if the language filter is too restrictive
   - Verify your Firecrawl API key is valid

3. **Scheduler not running**
   - Ensure the application is running continuously
   - Check that the notification time is in the correct format
   - Verify that your environment variables are correctly set

### Getting help

If you encounter any issues or have questions, please file an issue on the GitHub repository.

## Technology

- [Streamlit](https://streamlit.io/): UI framework
- [Firecrawl](https://firecrawl.dev/): Web scraping
- [Pydantic](https://pydantic-docs.helpmanual.io/): Data validation and settings management
- [Python-dotenv](https://github.com/theskumar/python-dotenv): Environment variable management

## License

MIT
