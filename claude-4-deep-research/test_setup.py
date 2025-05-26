#!/usr/bin/env python3
"""
Test script to verify Claude 4 Deep Research Assistant setup
"""

import os
import sys
from dotenv import load_dotenv


def test_imports():
    """Test if all required packages can be imported."""
    print("🔍 Testing package imports...")

    try:
        import streamlit

        print("✅ Streamlit imported successfully")
    except ImportError as e:
        print(f"❌ Streamlit import failed: {e}")
        return False

    try:
        import anthropic

        print("✅ Anthropic SDK imported successfully")
    except ImportError as e:
        print(f"❌ Anthropic SDK import failed: {e}")
        return False

    try:
        from firecrawl import FirecrawlApp

        print("✅ Firecrawl SDK imported successfully")
    except ImportError as e:
        print(f"❌ Firecrawl SDK import failed: {e}")
        return False

    return True


def test_environment():
    """Test if environment variables are set."""
    print("\n🔧 Testing environment variables...")

    # Load .env file if it exists
    load_dotenv()

    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    firecrawl_key = os.getenv("FIRECRAWL_API_KEY")

    if anthropic_key:
        print("✅ ANTHROPIC_API_KEY found")
    else:
        print("❌ ANTHROPIC_API_KEY not found")
        print("   Please set it in your .env file or environment variables")
        return False

    if firecrawl_key:
        print("✅ FIRECRAWL_API_KEY found")
    else:
        print("❌ FIRECRAWL_API_KEY not found")
        print("   Please set it in your .env file or environment variables")
        return False

    return True


def test_api_connections():
    """Test if API connections work."""
    print("\n🌐 Testing API connections...")

    # Test Anthropic connection
    try:
        import anthropic

        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        # Simple test - just create client, don't make actual API call to save credits
        print("✅ Anthropic client created successfully")
    except Exception as e:
        print(f"❌ Anthropic client creation failed: {e}")
        return False

    # Test Firecrawl connection
    try:
        from firecrawl import FirecrawlApp

        firecrawl = FirecrawlApp(api_key=os.getenv("FIRECRAWL_API_KEY"))
        print("✅ Firecrawl client created successfully")
    except Exception as e:
        print(f"❌ Firecrawl client creation failed: {e}")
        return False

    return True


def main():
    """Run all tests."""
    print("🧪 Claude 4 Deep Research Assistant - Setup Test")
    print("=" * 50)

    all_passed = True

    # Test imports
    if not test_imports():
        all_passed = False

    # Test environment
    if not test_environment():
        all_passed = False

    # Test API connections
    if not test_api_connections():
        all_passed = False

    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All tests passed! Your setup is ready.")
        print("🚀 Run the app with: python run.py")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        print("📚 Check the README.md for setup instructions.")
        sys.exit(1)


if __name__ == "__main__":
    main()
