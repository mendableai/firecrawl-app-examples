from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime

class Concept(BaseModel):
    name: str
    description: str
    related_concepts: List[str] = []
    importance_score: float  # 0.0-1.0 indicating centrality

class Terminology(BaseModel):
    term: str
    definition: str
    context: Optional[str] = None
    examples: List[str] = []

class Insight(BaseModel):
    content: str
    topics: List[str] = []
    confidence: float  # 0.0-1.0 indicating confidence

class DomainKnowledge(BaseModel):
    core_concepts: List[Concept]
    terminology: Dict[str, Terminology]
    key_insights: List[Insight]
    source_url: str
    extraction_timestamp: str

class AgentConfig(BaseModel):
    name: str
    instructions: str
    model: str = "gpt-4o"
    temperature: float = 0.3
    max_tokens: int = 1024
    tools: List[Any] = []
