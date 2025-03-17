from datetime import datetime
from typing import List

from agents import Agent, Runner, ModelSettings

from src.models import Concept, Terminology, Insight, DomainKnowledge

async def extract_domain_knowledge(content: str, url: str) -> DomainKnowledge:
    """
    Extract structured domain knowledge from website content.
    
    Args:
        content: The extracted website content (llmstxt or llmsfulltxt)
        url: Source URL for reference
        
    Returns:
        Structured DomainKnowledge object
    """
    # Create knowledge extraction agent
    knowledge_extractor = Agent(
        name="Knowledge Extractor",
        instructions="""Extract comprehensive domain knowledge from the provided website content.
        Identify:
        1. Core concepts and their relationships
        2. Specialized terminology and definitions
        3. Key insights and principles
        
        For each concept, assess its centrality/importance to the domain.
        For terminology, provide clear definitions and examples when available.
        For insights, evaluate confidence based on how explicitly they're stated.
        
        Structure everything according to the output schema.
        """,
        output_type=DomainKnowledge,
        model="gpt-4o-mini",
        model_settings=ModelSettings(
            temperature=0.2,  # Low temperature for more deterministic extraction
            max_tokens=4096,  # Allow space for comprehensive knowledge extraction
        )
    )
    
    # Run the extraction agent
    result = await Runner.run(
        knowledge_extractor, 
        f"Extract domain knowledge from this website content:\n\n{content}\n\nSource: {url}"
    )
    
    # Return the structured knowledge
    domain_knowledge = result.final_output
    domain_knowledge.source_url = url
    domain_knowledge.extraction_timestamp = datetime.now().isoformat()
    
    return domain_knowledge

def create_domain_agent(domain_knowledge: DomainKnowledge) -> Agent:
    """
    Create a specialized agent based on extracted domain knowledge.
    
    Args:
        domain_knowledge: Structured domain knowledge
        
    Returns:
        Configured OpenAI Agent with domain expertise
    """
    # Generate agent instructions from domain knowledge
    instructions = f"""You are an expert on {domain_knowledge.core_concepts[0].name if domain_knowledge.core_concepts else "this domain"} 
    with specialized knowledge based on content from {domain_knowledge.source_url}.
    
    DOMAIN CONCEPTS:
    {_format_concepts(domain_knowledge.core_concepts)}
    
    TERMINOLOGY:
    {_format_terminology(domain_knowledge.terminology)}
    
    KEY INSIGHTS:
    {_format_insights(domain_knowledge.key_insights)}
    
    When answering questions:
    1. Draw on this specialized knowledge first
    2. Clearly indicate when you're using information from the source material
    3. If asked something outside this domain knowledge, acknowledge the limitations
    4. Structure complex answers with headings and bullet points for clarity
    5. Refer to the source URL when appropriate
    
    Provide accurate, insightful responses based on this domain knowledge.
    """
    
    # Create domain-specific agent
    domain_agent = Agent(
        name=f"Domain Expert: {domain_knowledge.source_url}",
        instructions=instructions,
        model="gpt-4o-mini",
        model_settings=ModelSettings(
            temperature=0.3,
            max_tokens=2048,
        )
    )
    
    return domain_agent

def _format_concepts(concepts: List[Concept]) -> str:
    """Format concepts for agent instructions."""
    formatted = ""
    for concept in concepts:
        formatted += f"- {concept.name}: {concept.description}\n"
        if concept.related_concepts:
            formatted += f"  Related: {', '.join(concept.related_concepts)}\n"
    return formatted

def _format_terminology(terminology: List[Terminology]) -> str:
    """Format terminology for agent instructions."""
    formatted = ""
    for term_info in terminology:
        formatted += f"- {term_info.term}: {term_info.definition}\n"
        if term_info.examples:
            formatted += f"  Examples: {'; '.join(term_info.examples)}\n"
    return formatted

def _format_insights(insights: List[Insight]) -> str:
    """Format insights for agent instructions."""
    formatted = ""
    for insight in insights:
        formatted += f"- {insight.content}\n"
    return formatted
