#!/usr/bin/env python
from pydantic import BaseModel

from crewai.flow import Flow, listen, start
import requests
import asyncio
import time
import os

from dotenv import load_dotenv

load_dotenv()

from seo_generation_flow.crews.seo_crew.seo_crew import SEOCrew
from seo_generation_flow.crews.query_writer_crew.query_writer_crew import QueryWriterCrew

from seo_generation_flow.tools.custom_tool import scrape_google_queries, scrape_web_pages

class SeoGenerationState(BaseModel):
    topic: str = "Web Scraping"
    search_queries: list[str] = []
    search_response: list[dict] = []
    scrape_response: str = ""
    total_search_queries: int = 2
    seo_report: str = ""

class SeoGenerationFlow(Flow[SeoGenerationState]):

    @start()
    def generate_search_queries(self):
        print(f"Generating search queries for {self.state.topic}")
        query_writer_crew_class = QueryWriterCrew()
        query_writer_crew_object = query_writer_crew_class.crew_method()

        crew_output = query_writer_crew_object.kickoff(
            inputs={
                "topic": self.state.topic,
                "total_search_queries": self.state.total_search_queries
            }
        )
        self.state.search_queries = crew_output.pydantic.queries

    @listen(generate_search_queries)
    def search_queries(self):
        print(self.state.search_queries)
        self.state.search_response = scrape_google_queries(self.state.search_queries)

    @listen(search_queries)
    def scrape_data(self):
        print(self.state.search_response[0:10])
        self.state.scrape_response = scrape_web_pages(self.state.search_response)

    @listen(scrape_data)
    def analyse_scraped_data(self):
        print(self.state.scrape_response[0:100])
        seo_crew_class = SEOCrew()
        seo_crew_object = seo_crew_class.crew_method()

        crew_output = seo_crew_object.kickoff(
            inputs={
                "topic": self.state.topic,
                "scraped_content": self.state.scrape_response
            }
        )
        self.state.seo_report = crew_output.raw


def kickoff():
    seo_generation_flow = SeoGenerationFlow()
    seo_generation_flow.kickoff()


def plot():
    seo_generation_flow = SeoGenerationFlow()
    seo_generation_flow.plot()


if __name__ == "__main__":
    kickoff()
