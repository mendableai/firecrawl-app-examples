# KnowledgeForge: specification document

## 1. overview

KnowledgeForge is an application that transforms websites into intelligent, specialized AI agents by extracting and processing website content. The system uses Firecrawl's LLMs.txt API to extract clean text from websites and OpenAI's Agents SDK to create custom agents with domain-specific knowledge.

## 2. problem statement

Current challenges with domain knowledge acquisition:

- Domain knowledge is often scattered across multiple pages of websites
- Understanding specialized fields requires extensive reading and synthesis
- General-purpose LLMs lack depth in specific domains
- Documentation and knowledge bases are static and non-interactive
- Information updates require manual tracking and integration

## 3. solution architecture

### 3.1 high-level architecture

```plaintext
┌────────────┐    ┌───────────────┐    ┌───────────────────┐
│ Streamlit  │    │  Firecrawl    │    │ Knowledge         │
│ Interface  │───▶│  LLMs.txt API │───▶│ Extraction &      │
└────────────┘    └───────────────┘    │ Processing        │
                                        └─────────┬─────────┘
                                                  │
                  ┌───────────────┐    ┌─────────▼─────────┐
                  │ User          │    │ OpenAI Agent      │
                  │ Chat          │◀───│ Creation          │
                  │ Interface     │    │ & Configuration   │
                  └───────────────┘    └───────────────────┘
```

### 3.2 core components

#### 3.2.1 website content acquisition

- Leverages Firecrawl's LLMs.txt API to extract clean, structured text from websites
- Configurable depth with maxUrls parameter (default: 10, range: 1-100)
- Extracts both concise (llms.txt) and comprehensive (llms-full.txt) content versions
- Handles URL validation and error management

#### 3.2.2 knowledge extraction engine

- Uses OpenAI's GPT models to analyze and structure extracted content
- Identifies core concepts, terminology, relationships, and insights
- Creates a structured knowledge representation using Pydantic models
- Augments extracted content with semantic connections

#### 3.2.3 agent creation and configuration

- Generates domain-specific instructions based on extracted knowledge
- Configures OpenAI agent parameters for optimal performance
- Sets up appropriate model settings (temperature, response length)
- Creates specialized agents with domain expertise

#### 3.2.4 user interface

- Streamlit-based UI with intuitive workflow
- Website URL input with configuration options
- Visual representation of extracted knowledge
- Interactive chat interface for querying the agent
- Session state management for persistent agents

## 4. technical implementation

### 4.1 dependencies and environment

```plaintext
streamlit==1.36.0
firecrawl==0.5.0
openai-agents==0.1.0
pydantic==2.5.2
python-dotenv==1.0.0
pyvis==0.3.2
```

Environment variables:

- OPENAI_API_KEY: Required for OpenAI Agents SDK
- FIRECRAWL_API_KEY: Required for Firecrawl API

### 4.2 data models

#### 4.2.1 domain knowledge representation

```python
from pydantic import BaseModel
from typing import List, Dict, Optional

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
```

#### 4.2.2 agent configuration

```python
from agents import ModelSettings

class AgentConfig(BaseModel):
    name: str
    instructions: str
    model: str = "gpt-4o"
    temperature: float = 0.3
    max_tokens: int = 1024
    tools: List[Any] = []
```

### 4.3 website content acquisition module

```python
def extract_website_content(url: str, max_urls: int = 10, show_full_text: bool = True) -> Dict:
    """
    Extract website content using Firecrawl's LLMs.txt API.
    
    Args:
        url: Website URL to extract content from
        max_urls: Maximum number of pages to crawl (1-100)
        show_full_text: Whether to include comprehensive text
        
    Returns:
        Dictionary containing extracted content and metadata
    """
    firecrawl = FirecrawlApp(api_key=os.getenv("FIRECRAWL_API_KEY"))
    
    # Generate LLMs.txt with async processing and polling
    job = firecrawl.async_generate_llms_text(
        url=url,
        params={
            "maxUrls": max_urls,
            "showFullText": show_full_text
        }
    )
    
    if not job['success']:
        raise Exception(f"Failed to start extraction: {job.get('error', 'Unknown error')}")
        
    job_id = job['id']
    status = None
    
    # Poll for job completion
    while status != 'completed':
        status_response = firecrawl.check_generate_llms_text_status(job_id)
        status = status_response['status']
        
        if status == 'failed':
            raise Exception(f"Extraction failed: {status_response.get('error', 'Unknown error')}")
            
        if status != 'completed':
            time.sleep(2)  # Polling interval
    
    # Return the completed extraction results
    return {
        'llmstxt': status_response['data']['llmstxt'],
        'llmsfulltxt': status_response['data'].get('llmsfulltxt'),
        'processed_urls': status_response['data'].get('processedUrls', []),
        'extraction_timestamp': datetime.now().isoformat()
    }
```

### 4.4 knowledge extraction module

```python
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
        model="gpt-4o",
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
```

### 4.5 agent creation module

```python
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
        model="gpt-4o",
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

def _format_terminology(terminology: Dict[str, Terminology]) -> str:
    """Format terminology for agent instructions."""
    formatted = ""
    for term, info in terminology.items():
        formatted += f"- {term}: {info.definition}\n"
        if info.examples:
            formatted += f"  Examples: {'; '.join(info.examples)}\n"
    return formatted

def _format_insights(insights: List[Insight]) -> str:
    """Format insights for agent instructions."""
    formatted = ""
    for insight in insights:
        formatted += f"- {insight.content}\n"
    return formatted
```

### 4.6 streamlit interface implementation

```python
import streamlit as st
import asyncio
import time
from datetime import datetime
from pyvis.network import Network
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize session state
if 'domain_agent' not in st.session_state:
    st.session_state.domain_agent = None
if 'domain_knowledge' not in st.session_state:
    st.session_state.domain_knowledge = None
if 'messages' not in st.session_state:
    st.session_state.messages = []
if 'extraction_status' not in st.session_state:
    st.session_state.extraction_status = None

# App title and description
st.title("KnowledgeForge")
st.subheader("Transform websites into intelligent agents")
st.write("Extract domain knowledge from any website and create specialized AI agents.")

# Input form for website URL
with st.form("website_form"):
    website_url = st.text_input("Enter website URL", placeholder="https://example.com")
    col1, col2 = st.columns(2)
    with col1:
        max_pages = st.slider("Maximum pages to analyze", 1, 30, 10)
    with col2:
        use_full_text = st.checkbox("Use comprehensive text extraction", value=True)
    submit_button = st.form_submit_button("Create Agent")

# Process form submission
if submit_button and website_url:
    st.session_state.extraction_status = "extracting"
    
    try:
        with st.spinner("Extracting website content with Firecrawl..."):
            content = extract_website_content(
                url=website_url, 
                max_urls=max_pages,
                show_full_text=use_full_text
            )
            
            # Show content sample
            with st.expander("View extracted content sample"):
                st.text(content['llmstxt'][:1000] + "...")
            
            # Process content to extract knowledge
            with st.spinner("Analyzing content and generating knowledge model..."):
                domain_knowledge = asyncio.run(extract_domain_knowledge(
                    content['llmstxt'] if not use_full_text else content['llmsfulltxt'],
                    website_url
                ))
                
                # Store in session state
                st.session_state.domain_knowledge = domain_knowledge
            
            # Create specialized agent
            with st.spinner("Creating specialized agent..."):
                domain_agent = create_domain_agent(domain_knowledge)
                
                # Store in session state
                st.session_state.domain_agent = domain_agent
                
                st.session_state.extraction_status = "complete"
                st.success("Agent created successfully!")
    
    except Exception as e:
        st.error(f"Error: {str(e)}")
        st.session_state.extraction_status = "failed"

# Display knowledge visualization if available
if st.session_state.domain_knowledge:
    st.subheader("Domain Knowledge Map")
    
    # Create knowledge graph visualization
    domain_knowledge = st.session_state.domain_knowledge
    
    # Create network graph
    net = Network(height="500px", width="100%", bgcolor="#222222", font_color="white")
    
    # Add concept nodes
    for concept in domain_knowledge.core_concepts:
        net.add_node(concept.name, title=concept.description, size=30*concept.importance_score)
        
        # Add edges between related concepts
        for related in concept.related_concepts:
            net.add_edge(concept.name, related, color="lightblue")
    
    # Add terminology nodes
    for term, info in domain_knowledge.terminology.items():
        net.add_node(term, title=info.definition, size=20, color="#75E6DA")
    
    # Generate and display the graph
    net.save_graph("temp_graph.html")
    with open("temp_graph.html", "r", encoding="utf-8") as f:
        graph_html = f.read()
    st.components.v1.html(graph_html, height=550)
    
    # Display key terminology
    with st.expander("Key Terminology"):
        for term, info in domain_knowledge.terminology.items():
            st.markdown(f"**{term}**: {info.definition}")
            if info.examples:
                st.markdown("Examples: " + ", ".join(info.examples))
            st.markdown("---")
    
    # Display key insights
    with st.expander("Key Insights"):
        for insight in domain_knowledge.key_insights:
            st.markdown(f"- {insight.content}")

# Chat interface
if st.session_state.domain_agent:
    st.subheader("Chat with your domain expert")
    
    # Display chat history
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # Chat input
    if prompt := st.chat_input("Ask a question about this domain..."):
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Display user message
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Get agent response
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            full_response = ""
            
            # Process with agent
            with st.spinner("Thinking..."):
                result = asyncio.run(Runner.run(st.session_state.domain_agent, prompt))
                full_response = result.final_output
            
            message_placeholder.markdown(full_response)
            
        # Add assistant response to chat history
        st.session_state.messages.append({"role": "assistant", "content": full_response})
```

## 5. user flows

### 5.1 website analysis flow

1. User enters a website URL in the input field
2. User configures extraction parameters:
   - Maximum pages to analyze (1-30)
   - Whether to use comprehensive text extraction
3. User clicks "Create Agent" to initiate extraction
4. System performs sequential processing:
   - Extracts website content through Firecrawl
   - Analyzes content to identify knowledge structures
   - Generates a specialized agent with domain expertise
5. System displays visual knowledge representation and concepts
6. Chat interface becomes available for interaction

### 5.2 agent interaction flow

1. User interacts with the specialized agent through chat interface
2. User submits questions related to the domain
3. Agent processes the question using domain knowledge
4. Agent formulates a response drawing from the extracted knowledge
5. System displays the response in the chat interface
6. Conversation history is maintained throughout the session

## 6. api integration details

### 6.1 firecrawl llms.txt integration

The application integrates with Firecrawl's LLMs.txt API to extract website content:

```python
# Asynchronous job creation
job = firecrawl.async_generate_llms_text(
    url=url,
    params={
        "maxUrls": max_urls,  # Control crawl depth
        "showFullText": show_full_text  # Toggle between concise and comprehensive extraction
    }
)

# Job status polling
status_response = firecrawl.check_generate_llms_text_status(job_id)
```

API response structure:

```json
{
  "success": true,
  "data": {
    "llmstxt": "# http://example.com llms.txt\n\n- [Example Page](http://example.com): This is an example website...",
    "llmsfulltxt": "# http://example.com llms-full.txt\n\n## Example Page\nThis is a more detailed extraction of the example website...",
    "processedUrls": ["http://example.com", "http://example.com/about", "..."]
  },
  "status": "completed",
  "expiresAt": "2025-04-15T12:00:00.000Z"
}
```

### 6.2 openai agents sdk integration

The application leverages OpenAI's Agents SDK for:

1. Knowledge extraction from website content:

```python
knowledge_extractor = Agent(
    name="Knowledge Extractor",
    instructions="Extract comprehensive domain knowledge...",
    output_type=DomainKnowledge,
    model="gpt-4o"
)
```

2. Domain expert agent creation:

```python
domain_agent = Agent(
    name=f"Domain Expert: {domain_knowledge.source_url}",
    instructions=instructions,  # Generated from domain knowledge
    model="gpt-4o",
    model_settings=ModelSettings(
        temperature=0.3,
        max_tokens=2048,
    )
)
```

3. Chat interaction handling:

```python
result = await Runner.run(st.session_state.domain_agent, prompt)
```

## 7. use cases

### 7.1 research use cases

- **Literature review acceleration**: Create agents from academic websites to query complex interconnections between papers and findings
- **Domain-specific knowledge exploration**: Quickly grasp the foundations and terminology of a new field
- **Research paper comprehension**: Transform challenging papers into interactive agents that explain complex concepts

### 7.2 developer use cases

- **API documentation navigation**: Convert documentation into queryable agents that can answer implementation questions
- **Framework comparison**: Create agents from multiple framework docs to compare approaches objectively
- **Legacy codebase understanding**: Make institutional knowledge more accessible through interactive querying

### 7.3 business use cases

- **Competitor analysis**: Create agents from competitor websites to analyze positioning and features
- **Industry intelligence**: Transform industry publications into agents tracking trends and innovations
- **Employee onboarding**: Create agents from internal documentation to accelerate knowledge transfer

### 7.4 educational use cases

- **Course materials digestion**: Students can create agents from course websites for personalized tutoring
- **Interactive textbooks**: Transform static content into interactive agents that adapt explanations
- **Expert interviews**: Create agents from expert content to simulate Q&A with domain authorities

## 8. performance considerations

### 8.1 extraction performance

- Firecrawl processing time increases with the number of pages
- Complex websites may require longer processing times
- Rate limits apply: maximum 100 URLs per extraction

### 8.2 agent performance

- Initial knowledge extraction typically takes 30-60 seconds
- Agent creation takes 5-15 seconds depending on knowledge complexity
- Chat responses typically generated in 2-8 seconds
- Model costs vary based on token usage

### 8.3 storage considerations

- Session state may grow large with extensive chat history
- Knowledge graphs may become complex with large websites
- Consider implementing vector storage for large-scale deployments

## 9. limitations

- Only publicly accessible websites can be processed
- Maximum 5000 URLs during alpha stage of Firecrawl
- Knowledge extraction quality depends on content quality
- Agents cannot browse the live web for updated information
- Some specialized terminology may not be fully captured
- Complex relationships between concepts may be simplified

## 10. future enhancements

### 10.1 short-term enhancements

- **Multi-source agents**: Create agents from multiple website sources
- **Content comparison**: Compare and contrast content from different sources
- **Custom knowledge editing**: Allow users to refine extracted knowledge
- **Persistent agents**: Save and reload agents across sessions

### 10.2 long-term vision

- **Real-time updates**: Periodically refresh content to keep agents current
- **Collaborative learning**: Agents that learn from user interactions
- **Multi-agent collaboration**: Multiple specialized agents working together
- **Domain-specific tools**: Equip agents with tools relevant to their domain
- **Vector search integration**: Enhance retrieval with embedding-based search

## 11. conclusion

KnowledgeForge represents a powerful approach to knowledge acquisition and utilization, leveraging the strengths of Firecrawl's content extraction and OpenAI's agent capabilities. By transforming static website content into interactive, intelligent agents, it creates a more accessible and engaging way to explore domain knowledge.

The system demonstrates the potential of AI to not just process but understand and represent specialized knowledge, making expertise more accessible and interactive than ever before.
