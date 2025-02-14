import streamlit as st
import pandas as pd
import anthropic
from typing import List
from scraper import CrunchbaseScraper
from dotenv import load_dotenv

load_dotenv()


def load_companies(file) -> List[str]:
    """Load company names from uploaded file"""
    companies = []
    for line in file:
        company = line.decode("utf-8").strip()
        if company:  # Skip empty lines
            companies.append(company)
    return companies


def generate_company_summary(company_data: dict) -> str:
    """Generate a summary of the company data"""
    client = anthropic.Anthropic()

    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1000,
        system="You are a company & funding data expert. Summarize the given company data by the user in a few sentences.",
        messages=[
            {"role": "user", "content": [{"type": "text", "text": str(company_data)}]}
        ],
    )

    return message.content[0].text


def main():
    st.title("Crunchbase Company Data Scraper")
    st.write(
        """
        Extract detailed company information from Crunchbase including funding data, 
        employee counts, industries, and more. Upload a file with company names or 
        enter them manually below.
        """
    )

    # File upload option
    uploaded_file = st.file_uploader(
        "Upload a text file with company names (one per line)", type=["txt"]
    )

    # Manual input option
    st.write("### Or Enter Companies Manually")
    manual_input = st.text_area(
        "Enter company names (one per line)",
        height=150,
        help="Enter each company name on a new line",
    )

    companies = []

    if uploaded_file:
        companies = load_companies(uploaded_file)
        st.write(f"Loaded {len(companies)} companies from file")
    elif manual_input:
        companies = [line.strip() for line in manual_input.split("\n") if line.strip()]
        st.write(f"Found {len(companies)} companies in input")

    if companies and st.button("Start Scraping"):
        scraper = CrunchbaseScraper()

        with st.spinner("Scraping company data from Crunchbase..."):
            try:
                # Convert company names to Crunchbase URLs
                urls = [
                    f"https://www.crunchbase.com/organization/{name.lower().replace(' ', '-')}"
                    for name in companies
                ]

                results = scraper.scrape_companies(urls)

                df = pd.DataFrame(results)
                csv = df.to_csv(index=False)

                # Create download button
                st.download_button(
                    "Download Results (CSV)",
                    csv,
                    "crunchbase_data.csv",
                    "text/csv",
                    key="download-csv",
                )

                # Give summary of each company
                for company in results:
                    summary = generate_company_summary(company)
                    st.write(f"### Summary of {company['name']}")
                    st.write(summary)

            except Exception as e:
                st.error(f"An error occurred: {str(e)}")


if __name__ == "__main__":
    main()
