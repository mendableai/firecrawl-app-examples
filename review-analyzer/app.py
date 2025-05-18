import streamlit as st
import re
import asyncio
from src.scraper import ReviewScraper
from src.review_analyzer import ReviewAnalyzer

# Future Enhancement: Auto-detect platform from URL (e.g. amazon, ebay, etc.)

def is_valid_amazon_url(url):
    # Check if the URL is a valid amazon.com product page (basic check)
    if not url:
        return False
    # Simple regex to check if the URL is from amazon.com (e.g. amazon.com/dp/... or amazon.com/product/...)
    # amazon_pattern = r'https?://(?:www\.)?amazon\.com/(?:dp|product)/[A-Za-z0-9]+(?:/.*)?'
    return True

st.title('Review Analyzer')
st.write('Upload your review data and get instant analysis!')

# Product URL Input (initially Amazon)
product_url = st.text_input("Enter Product URL (Amazon):", placeholder="https://www.amazon.com/dp/...")

if product_url:
    if is_valid_amazon_url(product_url):
         st.success("Valid Amazon URL.")
         # Instantiate the ReviewScraper and scrape reviews (using asyncio.run) if the URL is valid.
         scraper = ReviewScraper()
         analyzer = ReviewAnalyzer()
         
         with st.spinner("Scraping and analyzing reviews..."):
             try:
                 # Scrape reviews
                 reviews = asyncio.run(scraper.scrape_reviews(product_url))
                 
                 # Analyze reviews
                 analysis = analyzer.analyze_reviews(reviews)
                 
                 # Display results
                 st.subheader("Analysis Results")
                 
                 col1, col2 = st.columns(2)
                 
                 with col1:
                     st.markdown("### 👍 Pros")
                     for pro in analysis["pros"]:
                         st.markdown(f"- {pro}")
                 
                 with col2:
                     st.markdown("### 👎 Cons")
                     for con in analysis["cons"]:
                         st.markdown(f"- {con}")
                 
                 # Show raw reviews in an expander
                 with st.expander("View Raw Reviews"):
                     st.write(reviews)
                     
             except Exception as e:
                 st.error("An error occurred while processing reviews: " + str(e))
    else:
         st.error("Unsupported or malformed URL. Please enter a valid Amazon product URL (e.g. https://www.amazon.com/dp/...).") 