import sys
import os

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))

# Import the ClientTreeApp
from ui.app import ClientTreeApp

# Create and run the app
if __name__ == "__main__":
    app = ClientTreeApp()
    app.run()
