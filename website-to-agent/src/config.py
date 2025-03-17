import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")

# Default settings
DEFAULT_MAX_URLS = 10
DEFAULT_USE_FULL_TEXT = True
DEFAULT_MODEL = "gpt-4o"
DEFAULT_TEMPERATURE = 0.3
DEFAULT_MAX_TOKENS = 1024

# Ensure API keys are available
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is not set in environment variables or .env file")
    
if not FIRECRAWL_API_KEY:
    raise ValueError("FIRECRAWL_API_KEY is not set in environment variables or .env file")
