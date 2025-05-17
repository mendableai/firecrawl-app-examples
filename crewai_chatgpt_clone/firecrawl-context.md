# Firecrawl Usage Docs

## Firecrawl basic search

```python
from firecrawl import FirecrawlApp
from dotenv import load_dotenv

load_dotenv()

app = FirecrawlApp()
```

```python
result = app.search("What is the capital of France?")
```

```python
result
```

    SearchResponse(success=True, data=[{'url': 'https://en.wikipedia.org/wiki/Paris', 'title': 'Paris - Wikipedia', 'description': 'Paris is the capital and largest city of France. With an estimated population of 2,048,472 residents in January 2025 in an area of more than 105 km2 (41 sq ...'}, {'url': 'https://www.coe.int/en/web/interculturalcities/paris', 'title': 'Paris, France - Intercultural City - The Council of Europe', 'description': 'Paris is the capital and most populous city of France. Situated on the Seine River, in the north of the country, it is in the centre of the Île-de-France ...'}, {'url': 'https://home.adelphi.edu/~ca19535/page%204.html', 'title': 'Paris facts: the capital of France in history', 'description': 'Paris is the capital of France, the largest country of Europe with 550 000 km2 (65 millions inhabitants). Paris has 2.234 million inhabitants end 2011.'}, {'url': 'https://www.britannica.com/place/Paris', 'title': 'Paris | Definition, Map, Population, Facts, & History | Britannica', 'description': "Paris, city and capital of France, located along the Seine River, in the north-central part of the country. Paris is one of the world's most important and ..."}, {'url': 'https://en.wikipedia.org/wiki/List_of_capitals_of_France', 'title': 'List of capitals of France - Wikipedia', 'description': 'The capital of France has been Paris since its liberation in 1944.'}], warning=None, error=None)

```python
result.data
```

    [{'url': 'https://en.wikipedia.org/wiki/Paris',
      'title': 'Paris - Wikipedia',
      'description': 'Paris is the capital and largest city of France. With an estimated population of 2,048,472 residents in January 2025 in an area of more than 105 km2 (41 sq ...'},
     {'url': 'https://www.coe.int/en/web/interculturalcities/paris',
      'title': 'Paris, France - Intercultural City - The Council of Europe',
      'description': 'Paris is the capital and most populous city of France. Situated on the Seine River, in the north of the country, it is in the centre of the Île-de-France ...'},
     {'url': 'https://home.adelphi.edu/~ca19535/page%204.html',
      'title': 'Paris facts: the capital of France in history',
      'description': 'Paris is the capital of France, the largest country of Europe with 550 000 km2 (65 millions inhabitants). Paris has 2.234 million inhabitants end 2011.'},
     {'url': 'https://www.britannica.com/place/Paris',
      'title': 'Paris | Definition, Map, Population, Facts, & History | Britannica',
      'description': "Paris, city and capital of France, located along the Seine River, in the north-central part of the country. Paris is one of the world's most important and ..."},
     {'url': 'https://en.wikipedia.org/wiki/List_of_capitals_of_France',
      'title': 'List of capitals of France - Wikipedia',
      'description': 'The capital of France has been Paris since its liberation in 1944.'}]

Search docs: <https://docs.firecrawl.dev/features/search>

## Firecrawl deep research

```python
query = "Find me the best android tablets for my mom. She is 60 years old and likes to read ebooks and watch courses. Categorize by price and battery life."

# Start research with real-time updates - this is optional
def on_activity(activity):
    print(f"[{activity['type']}] {activity['message']}")


# Run deep research
results = app.deep_research(
    query=query,
    max_depth=5,
    time_limit=180,
    max_urls=15,
    on_activity=on_activity,
)
```

    [search] Generating deeper search queries for "Find me the best android tablets for my mom. She is 60 years old and likes to read ebooks and watch courses. Categorize by price and battery life."
    [search] Starting 3 parallel searches for "Find me the best android tablets for my mom. She is 60 years old and likes to read ebooks and watch courses. Categorize by price and battery life."
    [search] Searching for "best android tablets for reading ebooks and watching courses" - Goal: To identify top-rated Android tablets suitable for reading ebooks and watching online courses, focusing on user reviews and expert recommendations.
    [search] Searching for "android tablets for seniors with long battery life" - Goal: To find Android tablets that are specifically designed for seniors, emphasizing those with extended battery life to support long reading and viewing sessions.
    [search] Searching for "compare android tablets by price for ebook reading" - Goal: To compare various Android tablets based on their price points, specifically highlighting those that excel in ebook reading features.
    [search] Found 15 new relevant results across 3 parallel queries
    [analyze] Analyzing findings and planning next steps
    [analyze] Analyzed findings
    [synthesis] Preparing final analysis
    [synthesis] Research completed

```python
# Access research findings.
print(f"Final Analysis: {results['data']['finalAnalysis']}")

print(f"Sources: {len(results['data']['sources'])} references")
```

    Final Analysis: # The Evolution and Impact of the C Programming Language
    
    The C programming language, first developed in the early 1970s, has played an instrumental role in shaping modern computing. Its efficiency, portability, and flexibility have ensured its longevity despite the rapid evolution of technology. This report examines the historical development, technical features, and lasting influence of C, highlighting why it continues to be a fundamental building block in both academic instruction and industry practices.
    
    ---
    
    ## 1. Historical Context
    
    ### 1.1 Origins and Development
    - **Birth at Bell Labs:** C was developed by Dennis Ritchie at Bell Labs in the early 1970s as a system programming language for writing operating systems, most notably Unix. Its design was influenced by the need for a language that combined the efficiency of assembly with the higher-level features found in languages such as B.
    - **From B to C:** The transition from the earlier language B to C marked an innovation that allowed for more expressive control structures and data management without sacrificing simplicity or performance [Kernighan & Ritchie, 1988].
    
    ### 1.2 Standardization
    - **ANSI C:** In the early 1980s, the American National Standards Institute (ANSI) standardized C, which helped cement its reliability and portability across various hardware architectures. This standardization also enabled widespread adoption in both academia and industry.
    - **ISO Standardization:** Later, international bodies adopted similar standards (ISO C), ensuring global acceptance and continued improvement in language features and compiler implementations.
    
    ---
    
    ## 2. Technical Features
    
    ### 2.1 Efficiency and Performance
    - **Low-Level Access:** C provides low-level memory manipulation through pointers, enabling fine-grained control over system resources. This, combined with its minimal runtime overhead, makes C highly efficient for system-level programming.
    - **Compiled Nature:** Being a compiled language, C converts code into optimized machine representations, allowing the development of fast and responsive applications.
    
    ### 2.2 Portability and Modularity
    - **Cross-Platform Compatibility:** C code can be compiled on a multitude of hardware platforms, often with little to no modifications. This portability is a key reason for its adoption in diverse environments ranging from embedded systems to large-scale server applications.
    - **Modular Programming:** The language promotes modular design through the use of header files and separate compilation units, making code maintenance and scalability more manageable.
    
    ### 2.3 Influence on Modern Languages
    - **Foundational Role:** C's syntax and semantics have served as a blueprint for several modern programming languages such as C++, C#, Java, and even scripting languages like JavaScript. The concepts of structured programming, data abstraction, and memory management introduced in C remain central to software development practices today [Stroustrup, 1997].
    - **Performance Focus:** Its emphasis on efficiency has influenced the design of new programming languages that prioritize performance, particularly in areas such as system programming and game development.
    
    ---
    
    ## 3. C in Modern Applications
    
    ### 3.1 Operating Systems and Embedded Systems
    - **Operating Systems:** Many operating systems, including Unix, Linux, and parts of Windows, are written in C due to its ability to interface directly with hardware.
    - **Embedded Systems:** The language’s efficiency and predictable performance make it ideal for developing firmware and embedded system applications where resource constraints are significant.
    
    ### 3.2 Education and Research
    - **Foundational Learning:** C is widely used as an introductory programming language in computer science education. Its simplicity in concept, combined with exposure to memory management, offers students a solid foundation in programming and software development.
    - **Ongoing Research:** Research in compiler optimization and high-performance computing often uses C as a benchmark, underscoring its continuing relevance in cutting-edge technological advancements [Aho, Sethi, & Ullman, 1986].
    
    ---
    
    ## 4. Challenges and Criticisms
    
    ### 4.1 Memory Safety Issues
    - **Manual Memory Management:** C leaves memory management entirely in the hands of the programmer. While this offers great control, it also leads to vulnerabilities such as buffer overflows and dangling pointers if not handled carefully.
      
    ### 4.2 Modern Alternatives
    - **Emergence of Safer Languages:** In response to the challenges of memory safety and security, languages like Rust have emerged, providing similar performance benefits while incorporating modern safeguards. However, C’s simplicity and established ecosystem continue to secure its niche in domains where performance is paramount.
    
    ---
    
    ## 5. Conclusion
    
    Nearly five decades after its creation, C remains a crucial component in both historical and contemporary computing landscapes. Its impact is evident not only in foundational operating systems and embedded applications but also in the design philosophies of modern programming languages. While newer languages address some of its shortcomings, the influence of C on software development is indelible, making it a vibrant subject of both academic study and practical application.
    
    ---
    
    ## References
    
    - Kernighan, B. W., & Ritchie, D. M. (1988). The C Programming Language (2nd ed.). Prentice Hall.
    - Stroustrup, B. (1997). The C++ Programming Language (3rd ed.). Addison-Wesley.
    - Aho, A. V., Sethi, R., & Ullman, J. D. (1986). Compilers: Principles, Techniques, and Tools. Addison-Wesley.
    
    The enduring legacy of C is a testament to its elegant design and robust functionality, illustrating why it remains invaluable even as the programming landscape continues to evolve.
    Sources: 15 references

Deep research docs: <https://docs.firecrawl.dev/features/alpha/deep-research>

## Firecrawl web data extraction

```python
results = app.extract(['https://github.com/trending'], prompt="Extract the top 5 trending repositories")
```

```python
app.extract?
```

    Extract structured information from URLs.
    
    Args:
        urls (Optional[List[str]]): URLs to extract from
        prompt (Optional[str]): Custom extraction prompt
        schema (Optional[Any]): JSON schema/Pydantic model
        system_prompt (Optional[str]): System context
        allow_external_links (Optional[bool]): Follow external links
        enable_web_search (Optional[bool]): Enable web search
        show_sources (Optional[bool]): Include source URLs
        agent (Optional[Dict[str, Any]]): Agent configuration
    
    Returns:
        ExtractResponse[Any] with:
        * success (bool): Whether request succeeded
        * data (Optional[Any]): Extracted data matching schema
        * error (Optional[str]): Error message if any
    
    Raises:
        ValueError: If prompt/schema missing or extraction fails

```python
results
```

    ExtractResponse(id=None, status='completed', expiresAt=datetime.datetime(2025, 5, 15, 16, 45, 5, tzinfo=TzInfo(UTC)), success=True, data={'trending_repositories': [{'url': 'https://github.com/TapXWorld/ChinaTextbook', 'name': 'ChinaTextbook', 'owner': 'TapXWorld', 'stars': 4103, 'description': '所有小初高、大学PDF教材。'}, {'url': 'https://github.com/microsoft/BitNet', 'name': 'BitNet', 'owner': 'microsoft', 'stars': 19392, 'description': 'Official inference framework for 1-bit LLMs'}, {'url': 'https://github.com/mem0ai/mem0', 'name': 'mem0', 'owner': 'mem0ai', 'stars': 30127, 'description': 'Memory for AI Agents; SOTA in AI Agent Memory; Announcing OpenMemory MCP - local and secure memory management.'}, {'url': 'https://github.com/airweave-ai/airweave', 'name': 'airweave', 'owner': 'airweave-ai', 'stars': 1795, 'description': 'Airweave lets agents search any app'}, {'url': 'https://github.com/alibaba/spring-ai-alibaba', 'name': 'spring-ai-alibaba', 'owner': 'alibaba', 'stars': 3133, 'description': 'Agentic AI Framework for Java Developers'}]}, error=None, warning=None, sources=None)

```python
results.data
```

    {'trending_repositories': [{'url': 'https://github.com/TapXWorld/ChinaTextbook',
       'name': 'ChinaTextbook',
       'owner': 'TapXWorld',
       'stars': 4103,
       'description': '所有小初高、大学PDF教材。'},
      {'url': 'https://github.com/microsoft/BitNet',
       'name': 'BitNet',
       'owner': 'microsoft',
       'stars': 19392,
       'description': 'Official inference framework for 1-bit LLMs'},
      {'url': 'https://github.com/mem0ai/mem0',
       'name': 'mem0',
       'owner': 'mem0ai',
       'stars': 30127,
       'description': 'Memory for AI Agents; SOTA in AI Agent Memory; Announcing OpenMemory MCP - local and secure memory management.'},
      {'url': 'https://github.com/airweave-ai/airweave',
       'name': 'airweave',
       'owner': 'airweave-ai',
       'stars': 1795,
       'description': 'Airweave lets agents search any app'},
      {'url': 'https://github.com/alibaba/spring-ai-alibaba',
       'name': 'spring-ai-alibaba',
       'owner': 'alibaba',
       'stars': 3133,
       'description': 'Agentic AI Framework for Java Developers'}]}

Extract docs: <https://docs.firecrawl.dev/features/extract>
