from langchain_anthropic import ChatAnthropic
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from langchain.prompts import ChatPromptTemplate
from typing import Dict


class JobMatcher:
    def __init__(self):
        self.llm = ChatAnthropic(model="claude-3-5-sonnet-20241022", temperature=0)

        self.response_schemas = [
            ResponseSchema(
                name="is_match",
                description="Whether the candidate is a good fit for the job (true/false)",
            ),
            ResponseSchema(
                name="reason",
                description="Brief explanation of why the candidate is or isn't a good fit",
            ),
        ]

        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are an expert job interviewer with decades of experience. Analyze the resume and job posting to determine if the candidate is a good fit. Be critical in your assessment and accept only applicants that meet at least 75% of the requirements.",
                ),
                (
                    "human",
                    """
                Resume:
                {resume}
                
                Job Posting:
                {job_posting}
                
                Determine if this candidate is a good fit and explain why briefly.
                {format_instructions}
                """,
                ),
            ]
        )

        self.output_parser = StructuredOutputParser.from_response_schemas(
            self.response_schemas
        )

    async def evaluate_match(self, resume: str, job_posting: str) -> Dict:
        """Evaluate if a candidate is a good fit for a job."""
        formatted_prompt = self.prompt.format(
            resume=resume,
            job_posting=job_posting,
            format_instructions=self.output_parser.get_format_instructions(),
        )

        response = await self.llm.ainvoke(formatted_prompt)
        return self.output_parser.parse(response.content)
