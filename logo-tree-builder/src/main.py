import sys
import os

# Add the src directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from ui.app import ClientTreeApp


def main():
    """Main entry point for the client tree builder application."""
    app = ClientTreeApp()
    app.run()


if __name__ == "__main__":
    main()
