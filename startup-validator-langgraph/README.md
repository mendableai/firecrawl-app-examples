# Startup Idea Validator with LangGraph

A streamlined startup idea validation system built with LangGraph that combines web scraping, developer community insights, and technical research to provide comprehensive startup idea assessment.

## 🎯 Overview

This system demonstrates how to integrate multiple data sources with LangGraph agents to validate startup ideas through:

- **🌐 Web Research**: Uses Firecrawl to scrape market data, competitor analysis, and industry reports
- **💬 Community Insights**: Leverages Hacker News API to gather tech community sentiment and discussions  
- **⚙️ Technical Validation**: Uses GitHub API to assess existing solutions and technical feasibility

## 🚀 Key Features

- **Single Agent Architecture**: One intelligent agent that coordinates multiple research tools
- **Diverse Data Sources**: Web content, developer discussions, and code repositories
- **Real-Time Research**: Live data gathering from multiple APIs and web sources
- **Structured Validation**: Clear VALIDATE/NEEDS_WORK/REJECT recommendations with reasoning
- **Interactive Interface**: Clean command-line experience with real-time feedback

## 🛠️ Tech Stack

- **LangGraph**: Agent orchestration and workflow management
- **Firecrawl**: Web scraping and content extraction
- **Hacker News API**: Developer community sentiment analysis
- **GitHub API**: Technical landscape and existing solutions research
- **OpenAI**: Language model for analysis and decision-making
- **Python**: Core application development

## 🔧 Agent Architecture

### Single Validation Agent

The system uses one intelligent agent that coordinates three specialized research tools:

```
Startup Validator Agent
    ├── research_market_landscape()    # Firecrawl web scraping
    ├── analyze_community_sentiment()  # Hacker News API
    └── assess_technical_feasibility() # GitHub API
```

### Tool Coordination Flow

1. **Market Research Phase**
   - Agent calls `research_market_landscape()`
   - Firecrawl scrapes competitor websites, market reports, and industry analysis
   - Returns comprehensive market data and competitive landscape

2. **Community Validation Phase**
   - Agent calls `analyze_community_sentiment()`
   - Hacker News API searches for discussions about the problem space
   - Returns developer opinions, similar product discussions, and market reception

3. **Technical Assessment Phase**
   - Agent calls `assess_technical_feasibility()`
   - GitHub API searches for existing implementations and technical approaches
   - Returns complexity assessment, available tools, and development insights

4. **Final Decision**
   - Agent synthesizes data from all three sources
   - Provides VALIDATE/NEEDS_WORK/REJECT recommendation with detailed reasoning
   - Highlights key opportunities, risks, and next steps

## 📁 Project Structure

```plaintext
startup-idea-validator/
├── src/
│   ├── __init__.py          # Package marker
│   ├── config.py            # Agent prompts and API configuration
│   ├── tools.py             # Research tools (Firecrawl, HN, GitHub)
│   ├── utils.py             # Message formatting utilities
│   └── agents.py            # Agent creation and orchestration
├── main.py                  # Command-line interface
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This documentation
```

## 🛠️ Installation

1. **Clone and navigate to the project**

   ```bash
   git clone <repository-url>
   cd startup-idea-validator
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env and add your API keys:
   # OPENAI_API_KEY=your-openai-api-key
   # FIRECRAWL_API_KEY=your-firecrawl-api-key
   # GITHUB_TOKEN=your-github-personal-access-token
   ```

4. **Run the application**

   ```bash
   python main.py
   ```

## 💡 Usage

1. Start the application: `python main.py`
2. Enter your startup idea (e.g., "AI-powered code review assistant")
3. Watch the agent gather data from multiple sources:
   - Web research for market data
   - Hacker News for community sentiment
   - GitHub for technical landscape
4. Review the comprehensive validation report
5. Get actionable recommendations for next steps

### Example Validation Flow

```
Input: "AI-powered meal planning app"

🌐 Researching market landscape...
   → Found 15 competitors, $2.3B market size

💬 Analyzing community sentiment...
   → 23 HN discussions, positive reception for personalization

⚙️ Assessing technical feasibility...
   → 156 related repositories, moderate complexity

✅ VALIDATION RESULT: VALIDATE
   Strong market with clear differentiation opportunities
```

## 🎓 Educational Value

This project demonstrates:

- **Multi-API Integration**: Combining Firecrawl, Hacker News, and GitHub APIs
- **LangGraph Agent Design**: Single agent coordinating multiple tools effectively
- **Real-World Data Sources**: Live market research using diverse platforms
- **Practical Business Application**: Actual startup validation methodology
- **Clean Architecture**: Modular, maintainable code structure

## 🔄 Future Enhancements

- **Visual Dashboard**: Streamlit UI for better user experience
- **Persistent Storage**: Save validation reports and track idea evolution
- **Additional Data Sources**: Product Hunt, Twitter, patent databases
- **Export Capabilities**: PDF reports and presentation formats
- **Batch Processing**: Validate multiple ideas simultaneously

---

**Perfect for**: Entrepreneurs validating ideas, developers learning LangGraph, technical content creators, and anyone interested in AI-powered market research.
