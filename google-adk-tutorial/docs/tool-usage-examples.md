```python
from firecrawl import FirecrawlApp
from dotenv import load_dotenv

load_dotenv()

app = FirecrawlApp()
```

## Web extraction

```python
url = "https://github.com/trending"

# It is possible to pass a list of URLs to the extract method
result = app.extract([url], prompt="Extract the top 10 trending repositories")
```

```python
result.data
```

```
{'trending_repositories': [{'name': 'Deep-Live-Cam',
   'owner': 'hacksider',
   'stars': 55338,
   'language': 'Python',
   'description': 'real time face swap and one-click video deepfake with only a single image'},
  {'name': 'ai-engineering-hub',
   'owner': 'patchy631',
   'stars': 8753,
   'language': 'Jupyter Notebook',
   'description': 'In-depth tutorials on LLMs, RAGs and real-world AI agent applications.'},
  {'name': 'Qwen-Agent',
   'owner': 'QwenLM',
   'stars': 7444,
   'language': 'Python',
   'description': 'Agent framework and applications built upon Qwen>=2.0, featuring Function Calling, Code Interpreter, RAG, and Chrome extension.'},
  {'name': 'Qwen3',
   'owner': 'QwenLM',
   'stars': 19682,
   'language': 'Shell',
   'description': 'Qwen3 is the large language model series developed by Qwen team, Alibaba Cloud.'},
  {'name': 'hyperswitch',
   'owner': 'juspay',
   'stars': 17069,
   'language': 'Rust',
   'description': 'An open source payments switch written in Rust to make payments fast, reliable and affordable'},
  {'name': 'daytona',
   'owner': 'daytonaio',
   'stars': 17395,
   'language': 'TypeScript',
   'description': 'Daytona is a Secure and Elastic Infrastructure for Running AI-Generated Code'},
  {'name': 'vllm',
   'owner': 'vllm-project',
   'stars': 46340,
   'language': 'Python',
   'description': 'A high-throughput and memory-efficient inference and serving engine for LLMs'},
  {'name': 'Agent-S',
   'owner': 'simular-ai',
   'stars': 3619,
   'language': 'Python',
   'description': 'Agent S: an open agentic framework that uses computers like a human'},
  {'name': 'generative-ai-for-beginners',
   'owner': 'microsoft',
   'stars': 81829,
   'language': 'Jupyter Notebook',
   'description': '21 Lessons, Get Started Building with Generative AI 🔗 https://microsoft.github.io/generative-ai-for-beginners/'},
  {'name': 'ladybird',
   'owner': 'LadybirdBrowser',
   'stars': 38045,
   'language': 'C++',
   'description': 'Truly independent web browser'}]}
```

## Turning any webpage to either clean markdown or HTML or find the links

```python
result = app.scrape_url(url, formats=["markdown", "html", "links"])

result
```

```python
result.markdown[:100]
```

```
'[Skip to content](https://github.com/trending#start-of-content)\n\nYou signed in with another tab or w'
```

```python
result.html[:100]
```

```
'<!DOCTYPE html><html lang="en" data-color-mode="auto" data-light-theme="light" data-dark-theme="dark'
```

```python
result.links[:10]
```

```
['https://github.com/trending#start-of-content',
 'https://github.com/trending',
 'https://github.com/trending?spoken_language_code=ab',
 'https://github.com/trending?spoken_language_code=aa',
 'https://github.com/trending?spoken_language_code=af',
 'https://github.com/trending?spoken_language_code=ak',
 'https://github.com/trending?spoken_language_code=sq',
 'https://github.com/trending?spoken_language_code=am',
 'https://github.com/trending?spoken_language_code=ar',
 'https://github.com/trending?spoken_language_code=an']
```

```python
result.metadata
```

```
{'og:title': 'Build software better, together',
 'ogUrl': 'https://github.com',
 'request-id': '7217:1355EC:27020D:357687:68133B54',
 'release': 'c7cada2ceb24d5ad3fc39b2db01e5afedeed299c',
 'color-scheme': 'light dark',
 'og:description': 'GitHub is where people build software. More than 150 million people use GitHub to discover, fork, and contribute to over 420 million projects.',
 'ogImage': 'https://github.githubassets.com/assets/github-logo-55c5b9a1fe52.png',
 'current-catalog-service-hash': '047de2aa31687506697d59851c60a89162ffacfdbae2bc21df7cf2e253362bdb',
 'theme-color': '#1e2327',
 'title': 'Trending  repositories on GitHub today · GitHub',
 'fb:app_id': '1401488693436528',
 'twitter:card': 'summary_large_image',
 'twitter:title': 'GitHub',
 'twitter:creator': 'github',
 'turbo-cache-control': 'no-preview',
 'twitter:description': 'GitHub is where people build software. More than 150 million people use GitHub to discover, fork, and contribute to over 420 million projects.',
 'visitor-payload': 'eyJyZWZlcnJlciI6IiIsInJlcXVlc3RfaWQiOiI3MjE3OjEzNTVFQzoyNzAyMEQ6MzU3Njg3OjY4MTMzQjU0IiwidmlzaXRvcl9pZCI6IjE2NDY0NTcwODMwOTk1NjA3ODkiLCJyZWdpb25fZWRnZSI6ImlhZCIsInJlZ2lvbl9yZW5kZXIiOiJpYWQifQ==',
 'og:image': ['https://github.githubassets.com/assets/github-logo-55c5b9a1fe52.png',
  'https://github.githubassets.com/assets/github-mark-57519b92ca4e.png',
  'https://github.githubassets.com/assets/github-octocat-13c86b8b336d.png'],
 'og:image:width': ['1200', '1200', '1200'],
 'ogSiteName': 'GitHub',
 'route-action': 'index',
 'twitter:site:id': '13334762',
 'twitter:image': 'https://github.githubassets.com/assets/github-logo-55c5b9a1fe52.png',
 'og:url': 'https://github.com',
 'viewport': 'width=device-width',
 'visitor-hmac': '4203e43775ddf6423385b866d367d721235d751898ce686b210ec4cf206ca696',
 'expected-hostname': 'github.com',
 'turbo-body-classes': 'logged-out env-production page-responsive',
 'route-controller': 'trending',
 'github-keyboard-shortcuts': 'copilot',
 'language': 'en',
 'og:image:type': ['image/png', 'image/png', 'image/png'],
 'fetch-nonce': '67a22d1e-dde5-88ed-79d1-5c5802432b71',
 'google-site-verification': 'Apib7-x98H0j5cPqHWwSMm6dNU4GmODRoqxLiDzdx9I',
 'og:image:height': ['1200', '620', '620'],
 'twitter:site': 'github',
 'user-login': '',
 'og:site_name': 'GitHub',
 'twitter:image:height': '1200',
 'ogTitle': 'Build software better, together',
 'favicon': 'https://github.githubassets.com/favicons/favicon.svg',
 'browser-stats-url': 'https://api.github.com/_private/browser/stats',
 'octolytics-url': 'https://collector.github.com/github/collect',
 'browser-errors-url': 'https://api.github.com/_private/browser/errors',
 'ogDescription': 'GitHub is where people build software. More than 150 million people use GitHub to discover, fork, and contribute to over 420 million projects.',
 'apple-itunes-app': 'app-id=1477376905, app-argument=https://github.com/trending',
 'description': 'GitHub is where people build software. More than 150 million people use GitHub to discover, fork, and contribute to over 420 million projects.',
 'twitter:creator:id': '13334762',
 'twitter:image:width': '1200',
 'html-safe-nonce': 'a2c7d7386cdf05482f18b02218df8cdf1a88525dc1e7fa9228c157219c6e50e3',
 'hostname': 'github.com',
 'route-pattern': '/trending(/:language)(.:format)',
 'scrapeId': '3746f88c-5998-4c20-98ca-e91b85a67f74',
 'sourceURL': 'https://github.com/trending',
 'url': 'https://github.com/trending',
 'statusCode': 200}
```

## Performing web search

### Pure search

```python
result = app.search("Best open-source frameworks to build agents", limit=10)

result
```

```
SearchResponse(success=True, data=[{'url': 'https://medium.com/data-science-collective/agentic-ai-comparing-new-open-source-frameworks-21ec676732df', 'title': 'Agentic AI: Comparing New Open-Source Frameworks - Medium', 'description': "The ones we've all heard about are CrewAI and AutoGen. CrewAI is a very high-abstraction framework that lets you build agent systems quickly by ..."}, {'url': 'https://botpress.com/blog/ai-agent-frameworks', 'title': 'Top 5 Free AI Agent Frameworks - Botpress', 'description': 'Top 5 Free AI Agent Frameworks · 1. Botpress · 2. RASA · 3. LangGraph · 4. CrewAI · 5. LlamaIndex.'}, {'url': 'https://www.reddit.com/r/LLMDevs/comments/1io0gnz/top_5_open_source_frameworks_for_building_ai/', 'title': 'Top 5 Open Source Frameworks for building AI Agents - Reddit', 'description': 'We created a list of Open Source AI Agent Frameworks mostly used by people and built an AI Agent using each one of them.'}, {'url': 'https://getstream.io/blog/multiagent-ai-frameworks/', 'title': 'Best 5 Frameworks To Build Multi-Agent AI Applications - GetStream.io', 'description': 'Autogen is an open-source framework for building agentic systems. You can use this framework to construct multi-agent collaborations and LLM ...'}, {'url': 'https://langfuse.com/blog/2025-03-19-ai-agent-comparison', 'title': 'Comparing Open-Source AI Agent Frameworks - Langfuse Blog', 'description': 'Get an overview of the leading open-source AI agent frameworks—LangGraph, OpenAI Agents SDK, Smolagents, CrewAI, AutoGen, Semantic Kernel, ...'}, {'url': 'https://www.analyticsvidhya.com/blog/2024/07/ai-agent-frameworks/', 'title': 'Top 7 Frameworks for Building AI Agents in 2025 - Analytics Vidhya', 'description': 'Explore AI Agent Frameworks like Langchain, CrewAI, and Microsoft Semantic Kernel. Understand their key importance in AI development.'}, {'url': 'https://medium.com/data-science-collective/the-open-source-stack-for-ai-agents-8ab900e33676', 'title': 'The Open-Source Stack for AI Agents - Medium', 'description': '1. Frameworks for Building and Orchestrating Agents · CrewAI — Orchestrates multiple agents working together. · Agno — Focuses on memory, tool use ...'}, {'url': 'https://blog.dataiku.com/open-source-frameworks-for-llm-powered-agents', 'title': 'A Tour of Popular Open Source Frameworks for LLM-Powered Agents', 'description': 'The purpose of this blog post is to present some of the most popular open source Python frameworks used to implement LLM-powered agents.'}, {'url': 'https://budibase.com/blog/ai-agents/open-source-ai-agent-platforms/', 'title': '6 Open-Source AI Agent Platforms - Budibase', 'description': '1. LangChain. First up, we have LangChain, perhaps the best-known and most widely adopted framework for building agentic workflows with LLMs.'}, {'url': 'https://www.ibm.com/think/insights/top-ai-agent-frameworks', 'title': 'AI Agent Frameworks: Choosing the Right Foundation for Your ... - IBM', 'description': 'LlamaIndex is an open-source data orchestration framework for building generative AI (gen AI) and agentic AI solutions. It offers prepackaged ...'}], warning=None, error=None)
```

```python
result.data
```

```
[{'url': 'https://medium.com/data-science-collective/agentic-ai-comparing-new-open-source-frameworks-21ec676732df',
  'title': 'Agentic AI: Comparing New Open-Source Frameworks - Medium',
  'description': "The ones we've all heard about are CrewAI and AutoGen. CrewAI is a very high-abstraction framework that lets you build agent systems quickly by ..."},
 {'url': 'https://botpress.com/blog/ai-agent-frameworks',
  'title': 'Top 5 Free AI Agent Frameworks - Botpress',
  'description': 'Top 5 Free AI Agent Frameworks · 1. Botpress · 2. RASA · 3. LangGraph · 4. CrewAI · 5. LlamaIndex.'},
 {'url': 'https://www.reddit.com/r/LLMDevs/comments/1io0gnz/top_5_open_source_frameworks_for_building_ai/',
  'title': 'Top 5 Open Source Frameworks for building AI Agents - Reddit',
  'description': 'We created a list of Open Source AI Agent Frameworks mostly used by people and built an AI Agent using each one of them.'},
 {'url': 'https://getstream.io/blog/multiagent-ai-frameworks/',
  'title': 'Best 5 Frameworks To Build Multi-Agent AI Applications - GetStream.io',
  'description': 'Autogen is an open-source framework for building agentic systems. You can use this framework to construct multi-agent collaborations and LLM ...'},
 {'url': 'https://langfuse.com/blog/2025-03-19-ai-agent-comparison',
  'title': 'Comparing Open-Source AI Agent Frameworks - Langfuse Blog',
  'description': 'Get an overview of the leading open-source AI agent frameworks—LangGraph, OpenAI Agents SDK, Smolagents, CrewAI, AutoGen, Semantic Kernel, ...'},
 {'url': 'https://www.analyticsvidhya.com/blog/2024/07/ai-agent-frameworks/',
  'title': 'Top 7 Frameworks for Building AI Agents in 2025 - Analytics Vidhya',
  'description': 'Explore AI Agent Frameworks like Langchain, CrewAI, and Microsoft Semantic Kernel. Understand their key importance in AI development.'},
 {'url': 'https://medium.com/data-science-collective/the-open-source-stack-for-ai-agents-8ab900e33676',
  'title': 'The Open-Source Stack for AI Agents - Medium',
  'description': '1. Frameworks for Building and Orchestrating Agents · CrewAI — Orchestrates multiple agents working together. · Agno — Focuses on memory, tool use ...'},
 {'url': 'https://blog.dataiku.com/open-source-frameworks-for-llm-powered-agents',
  'title': 'A Tour of Popular Open Source Frameworks for LLM-Powered Agents',
  'description': 'The purpose of this blog post is to present some of the most popular open source Python frameworks used to implement LLM-powered agents.'},
 {'url': 'https://budibase.com/blog/ai-agents/open-source-ai-agent-platforms/',
  'title': '6 Open-Source AI Agent Platforms - Budibase',
  'description': '1. LangChain. First up, we have LangChain, perhaps the best-known and most widely adopted framework for building agentic workflows with LLMs.'},
 {'url': 'https://www.ibm.com/think/insights/top-ai-agent-frameworks',
  'title': 'AI Agent Frameworks: Choosing the Right Foundation for Your ... - IBM',
  'description': 'LlamaIndex is an open-source data orchestration framework for building generative AI (gen AI) and agentic AI solutions. It offers prepackaged ...'}]
```

## Doing deep research

```python
result = app.deep_research(
    "Best open-source frameworks to build agents",
    max_depth=5,
    time_limit=180,
    max_urls=20
)
```

```python
print(result['data']['finalAnalysis'][:1000])
```

```
# Comprehensive Analysis of Open-Source Frameworks for Building AI Agents in 2025

This report provides an in-depth comparative analysis of the leading open-source frameworks used to build AI agents in 2025. It covers the technical features, design philosophies, and real-world deployment outcomes, drawing on multiple sources and research data from platforms including Medium, Botpress, GetStream, Firecrawl, and Shakudo.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Research Methodology](#research-methodology)
3. [Overview of Agentic AI](#overview-of-agentic-ai)
4. [Framework-by-Framework Analysis](#framework-analysis)
    - [LangGraph](#langgraph)
    - [Agno (Phidata)](#agno)
    - [SmolAgents & Mastra](#smolagents--mastra)
    - [Pydantic AI](#pydantic-ai)
    - [Atomic Agents](#atomic-agents)
    - [CrewAI](#crewai)
    - [AutoGen](#autogen)
5. [Comparative Summary Table](#comparative-table)
6. [Best Practices for Enterprise Agent Implementation](#best-practices)
7
```

```python
result['data']['sources']
```

```[{'url': 'https://medium.com/data-science-collective/agentic-ai-comparing-new-open-source-frameworks-21ec676732df',
  'title': 'Agentic AI: Comparing New Open-Source Frameworks - Medium',
  'description': "The ones we've all heard about are CrewAI and AutoGen. CrewAI is a very high-abstraction framework that lets you build agent systems quickly by ...",
  'icon': 'https://miro.medium.com/v2/5d8de952517e8160e40ef9841c781cdc14a5db313057fa3c3de41c6f5b494b19'},
 {'url': 'https://botpress.com/blog/ai-agent-frameworks',
  'title': 'Top 5 Free AI Agent Frameworks - Botpress',
  'description': 'Top 5 Free AI Agent Frameworks · 1. Botpress · 2. RASA · 3. LangGraph · 4. CrewAI · 5. LlamaIndex.',
  'icon': 'https://cdn.prod.website-files.com/635c4eeb78332f7971255095/680fcae3aa877b0851eac0ce_Frame%203%20(1).png'},
 {'url': 'https://www.reddit.com/r/LLMDevs/comments/1io0gnz/top_5_open_source_frameworks_for_building_ai/',
  'title': 'Top 5 Open Source Frameworks for building AI Agents - Reddit',
  'description': 'We created a list of Open Source AI Agent Frameworks mostly used by people and built an AI Agent using each one of them.',
  'icon': ''},
 {'url': 'https://getstream.io/blog/multiagent-ai-frameworks/',
  'title': 'Best 5 Frameworks To Build Multi-Agent AI Applications - GetStream.io',
  'description': 'Autogen is an open-source framework for building agentic systems. You can use this framework to construct multi-agent collaborations and LLM ...',
  'icon': 'https://getstream.io/icon.png'},
 {'url': 'https://www.shakudo.io/blog/top-9-ai-agent-frameworks',
  'title': 'Top 9 AI Agent Frameworks as of April 2025 - Shakudo',
  'description': 'Top 9 AI Agent Frameworks as of April 2025 · 1. LangChain · 2. AutoGen · 3. Semantic Kernel · 4. Atomic Agents · 5. CrewAI · 6. RASA · 7. Hugging Face ...',
  'icon': 'https://cdn.prod.website-files.com/625447c67b621a2b13b7e3c7/6508b3b767dd5f4c4f5ceb5e_shakudo-icon-32.png'},
 {'url': 'https://medium.com/data-science-collective/agentic-ai-comparing-new-open-source-frameworks-21ec676732df',
  'title': 'Agentic AI: Comparing New Open-Source Frameworks - Medium',
  'description': "Frameworks differ in how much they abstract away, how much control they give agents, and how much coding you'll need to do to get something ...",
  'icon': 'https://miro.medium.com/v2/5d8de952517e8160e40ef9841c781cdc14a5db313057fa3c3de41c6f5b494b19'},
 {'url': 'https://langfuse.com/blog/2025-03-19-ai-agent-comparison',
  'title': 'Comparing Open-Source AI Agent Frameworks - Langfuse Blog',
  'description': 'This post offers an in-depth look at some of the leading open-source AI agent frameworks out there: LangGraph, the OpenAI Agents SDK, Smolagents ...',
  'icon': ''},
 {'url': 'https://www.reddit.com/r/LLMDevs/comments/1io0gnz/top_5_open_source_frameworks_for_building_ai/',
  'title': 'Top 5 Open Source Frameworks for building AI Agents - Reddit',
  'description': 'We created a list of Open Source AI Agent Frameworks mostly used by people and built an AI Agent using each one of them.',
  'icon': ''},
 {'url': 'https://www.analyticsvidhya.com/blog/2024/07/ai-agent-frameworks/',
  'title': 'Top 7 Frameworks for Building AI Agents in 2025 - Analytics Vidhya',
  'description': 'Explore AI Agent Frameworks like Langchain, CrewAI, and Microsoft Semantic Kernel. Understand their key importance in AI development.',
  'icon': ''},
 {'url': 'https://www.shakudo.io/blog/top-9-ai-agent-frameworks',
  'title': 'Top 9 AI Agent Frameworks as of April 2025 - Shakudo',
  'description': 'Langflow is an open-source, low-code framework designed to simplify the development of AI agents and workflows, particularly those involving RAG ...',
  'icon': 'https://cdn.prod.website-files.com/625447c67b621a2b13b7e3c7/6508b3b767dd5f4c4f5ceb5e_shakudo-icon-32.png'},
 {'url': 'https://medium.com/data-science-collective/agentic-ai-comparing-new-open-source-frameworks-21ec676732df',
  'title': 'Agentic AI: Comparing New Open-Source Frameworks - Medium',
  'description': 'Multi-agent systems allow you to build collaborative or hierarchical setups with teams of agents connected via supervisors. Most frameworks ...',
  'icon': 'https://miro.medium.com/v2/5d8de952517e8160e40ef9841c781cdc14a5db313057fa3c3de41c6f5b494b19'},
 {'url': 'https://www.reddit.com/r/LLMDevs/comments/1io0gnz/top_5_open_source_frameworks_for_building_ai/',
  'title': 'Top 5 Open Source Frameworks for building AI Agents - Reddit',
  'description': 'We created a list of Open Source AI Agent Frameworks mostly used by people and built an AI Agent using each one of them.',
  'icon': ''},
 {'url': 'https://getstream.io/blog/multiagent-ai-frameworks/',
  'title': 'Best 5 Frameworks To Build Multi-Agent AI Applications - GetStream.io',
  'description': 'This article aims to help you build AI agents powered by memory, knowledgebase, tools, and reasoning and chat with them using the command line and beautiful ...',
  'icon': 'https://getstream.io/icon.png'},
 {'url': 'https://www.firecrawl.dev/blog/best-open-source-agent-frameworks-2025',
  'title': 'The Best Open Source Frameworks For Building AI Agents in 2025',
  'description': 'In this article, we will examine the most powerful and widely adopted open source frameworks to build agents in 2025, analyzing their technical ...',
  'icon': 'https://www.firecrawl.dev/favicon.ico'},
 {'url': 'https://medium.com/data-science-collective/the-open-source-stack-for-ai-agents-8ab900e33676',
  'title': 'The Open-Source Stack for AI Agents - Medium',
  'description': "Building AI agents can be a mess of broken repos and outdated tools. Here's the real, tested open-source stack for building reliable, ...",
  'icon': 'https://miro.medium.com/v2/5d8de952517e8160e40ef9841c781cdc14a5db313057fa3c3de41c6f5b494b19'}]
```

## Generate an image with OpenAI

```python
from openai import OpenAI
import base64
from dotenv import load_dotenv

load_dotenv()

client = OpenAI()

prompt = """
A children's robot playing with a ball.
"""

result = client.images.generate(model="gpt-image-1", prompt=prompt)

image_base64 = result.data[0].b64_json
image_bytes = base64.b64decode(image_base64)

# Save the image to a file
# with open("otter.png", "wb") as f:
#     f.write(image_bytes)
```
