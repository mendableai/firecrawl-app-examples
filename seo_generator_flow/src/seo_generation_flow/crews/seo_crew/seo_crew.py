from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from pydantic import BaseModel, Field
from typing import List
import requests

@CrewBase
class SEOCrew:
    """SEO Generation Crew"""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def content_analyzer_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["content_analyzer_agent"],
        )

    @task
    def analyze_content_task(self) -> Task:
        return Task(
            config=self.tasks_config["analyze_content_task"],
        )

    @agent
    def seo_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["seo_agent"],

        )

    @task
    def generate_seo_report_task(self) -> Task:
        return Task(
            config=self.tasks_config["generate_seo_report_task"],        )


    @crew
    def crew_method(self) -> Crew:
        """Creates the SEO Generation Crew"""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        ) 