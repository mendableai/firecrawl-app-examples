#!/usr/bin/env python3
"""
Launcher script for Claude 4 Deep Research Assistant
"""

import subprocess
import sys
import os
from pathlib import Path


def main():
    """Launch the Streamlit application."""
    # Get the directory where this script is located
    script_dir = Path(__file__).parent
    app_path = script_dir / "src" / "app.py"

    # Check if the app file exists
    if not app_path.exists():
        print(f"❌ Error: Application file not found at {app_path}")
        sys.exit(1)

    # Check for environment variables
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("⚠️  Warning: ANTHROPIC_API_KEY not found in environment variables")
        print("   Please set your API key in a .env file or environment variables")

    if not os.getenv("FIRECRAWL_API_KEY"):
        print("⚠️  Warning: FIRECRAWL_API_KEY not found in environment variables")
        print("   Please set your API key in a .env file or environment variables")

    print("🚀 Starting Claude 4 Deep Research Assistant...")
    print(f"📁 App location: {app_path}")
    print("🌐 The app will open in your default browser")
    print("🛑 Press Ctrl+C to stop the application")
    print("-" * 50)

    try:
        # Run the Streamlit app
        subprocess.run(
            [
                sys.executable,
                "-m",
                "streamlit",
                "run",
                str(app_path),
                "--server.headless",
                "false",
                "--server.port",
                "8501",
                "--browser.gatherUsageStats",
                "false",
            ],
            check=True,
        )
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running application: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print(
            "❌ Error: Streamlit not found. Please install it with: pip install streamlit"
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
