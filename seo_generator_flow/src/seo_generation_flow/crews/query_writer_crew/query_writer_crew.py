from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from pydantic import BaseModel, Field  


# a crew that accepts a topic and returns a list of search queries

class SearchQueries(BaseModel):
    queries: list[str] = Field(description="The list of search queries")


@CrewBase
class QueryWriterCrew:
    """Query Writer Crew"""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def query_writer_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["query_writer_agent"],
        )
        
    @task
    def generate_queries_task(self) -> Task:
        return Task(
            config=self.tasks_config["generate_queries_task"],
            output_pydantic=SearchQueries,
        )
    
    @crew
    def crew_method(self) -> Crew:
        """Creates the X Analysis Crew"""

        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
