# src/chatgpt_clone/crew.py

from crewai import Crew, Process, Agent, Task, LLM
from crewai.project import CrewBase, agent, task, crew
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

# Tool imports
from crewai_chatgpt_clone.tools.firecrawl_search_tool import firecrawl_search_tool
from crewai_chatgpt_clone.tools.firecrawl_research_tool import firecrawl_research_tool
from crewai_chatgpt_clone.tools.firecrawl_extract_tool import firecrawl_extract_tool
from crewai_chatgpt_clone.tools.openai_image_tool import openai_image_tool


@CrewBase
class ChatgptCloneCrew:
    """ChatgptCloneCrew using CrewBase for structured agent and task definition."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    # Added type hints
    agents: List[BaseAgent]
    tasks: List[Task]

    @agent
    def chat_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["chat_agent"],  # type: ignore[index]
            tools=[],
            verbose=True,
            llm=LLM(model="gpt-4o", stream=True),
        )

    @agent
    def search_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["search_agent"],  # type: ignore[index]
            tools=[firecrawl_search_tool],
            verbose=True,
        )

    @agent
    def research_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["research_agent"],  # type: ignore[index]
            tools=[firecrawl_research_tool],
            verbose=True,
        )

    @agent
    def scraper_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["scraper_agent"],  # type: ignore[index]
            tools=[firecrawl_extract_tool],
            verbose=True,
        )

    @agent
    def image_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["image_agent"],  # type: ignore[index]
            tools=[openai_image_tool],
            verbose=True,
        )

    # --- TASKS ---
    @task
    def answer_user_query_task(self) -> Task:
        """Task to process the user's query, classify intent, delegate, and compile the final response."""
        return Task(
            config=self.tasks_config["answer_user_query_task"],  # type: ignore[index]
            agent=self.chat_agent(),  # This task is primarily handled by the chat_agent
        )

    @crew
    def crew(self) -> Crew:
        # This will collect all agents defined with @agent
        # and tasks defined with @task.
        # Ensure your @task methods are defined above for them to be included.
        return Crew(
            agents=self.agents,  # Populated by @agent decorators
            tasks=self.tasks,  # Populated by @task decorators - ADD YOURS!
            process=Process.sequential,
            verbose=True,
        )
