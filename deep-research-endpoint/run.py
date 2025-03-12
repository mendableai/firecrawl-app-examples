#!/usr/bin/env python3
"""
Simple script to run the Deep Research Chatbot application.
"""
import os
import subprocess
import sys


def main():
    """Run the Streamlit application."""
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Path to the Streamlit app
    app_path = os.path.join(script_dir, "src", "app.py")

    try:
        # Run the Streamlit app
        print("Starting Deep Research Chatbot...")
        subprocess.run([sys.executable, "-m", "streamlit", "run", app_path], check=True)
    except KeyboardInterrupt:
        print("\nApplication stopped by user.")
    except Exception as e:
        print(f"Error running application: {e}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
