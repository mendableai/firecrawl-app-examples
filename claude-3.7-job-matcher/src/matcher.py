from langchain_anthropic import ChatAnthropic
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from langchain.prompts import ChatPromptTemplate
from typing import Dict


class JobMatcher:
    def __init__(self):
        self.llm = ChatAnthropic(model="claude-3-7-sonnet-20250219", temperature=0)

        self.response_schemas = [
            ResponseSchema(
                name="is_match",
                description="Whether the candidate is a good fit for the job (true/false)",
            ),
            ResponseSchema(
                name="reason",
                description="Brief explanation of why the candidate is or isn't a good fit",
            ),
            ResponseSchema(
                name="match_score",
                description="A score from 0-100 representing how well the candidate matches the job requirements",
            ),
            ResponseSchema(
                name="key_strengths",
                description="List of 2-3 key strengths the candidate has for this position",
            ),
            ResponseSchema(
                name="missing_skills",
                description="List of 1-2 important skills or qualifications the candidate is missing (if any)",
            ),
        ]

        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are an expert job recruiter and career advisor with decades of experience in talent acquisition and job matching.
                    
Your task is to carefully analyze a candidate's resume against a job posting to determine if they are a good match.

Guidelines for your analysis:
1. Be thorough but fair in your assessment
2. Consider both technical skills and soft skills
3. Evaluate experience level and relevance to the position
4. Look for alignment in industry background and domain knowledge
5. Consider education requirements only if they are explicitly mandatory
6. Weigh recent experience more heavily than older experience
7. Accept candidates that meet at least 70% of the core requirements
8. Recognize transferable skills that may not be explicitly mentioned

Provide a clear explanation for your decision that would be helpful to the job seeker.""",
                ),
                (
                    "human",
                    """
                Resume:
                {resume}
                
                Job Posting:
                {job_posting}
                
                Analyze if this candidate is a good match for this position.
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