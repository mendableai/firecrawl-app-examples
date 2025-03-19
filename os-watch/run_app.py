#!/usr/bin/env python
import subprocess
import os
import sys


def main():
    """Run the Streamlit application"""
    print("Starting Open-source Watch application...")

    # Ensure we're in the right directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    # Run streamlit
    subprocess.run(
        [
            "streamlit",
            "run",
            "src/app.py",
            "--server.headless",
            "true",
            "--browser.serverAddress",
            "localhost",
            "--server.port",
            "8501",
        ]
    )


if __name__ == "__main__":
    main()
