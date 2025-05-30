import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";
import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { marked } from 'marked';
import dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';

dotenv.config();

// Check for required API keys
if (!process.env.OPENAI_API_KEY) {
  console.error(chalk.red('\n❌ Missing OPENAI_API_KEY in .env file'));
  console.log(chalk.yellow('Please create a .env file with:'));
  console.log(chalk.gray('OPENAI_API_KEY=your-key-here'));
  console.log(chalk.gray('FIRECRAWL_API_KEY=your-key-here\n'));
  process.exit(1);
}

if (!process.env.FIRECRAWL_API_KEY) {
  console.error(chalk.red('\n❌ Missing FIRECRAWL_API_KEY in .env file'));
  console.log(chalk.yellow('Please get your API key at https://firecrawl.dev'));
  process.exit(1);
}

// Ensure output directory exists
if (!existsSync('output')) {
  mkdirSync('output');
}

// Initialize Firecrawl and OpenAI
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o",
  temperature: 0,
});

// Define the state schema for LangGraph
const StateChannels = {
  query: null,
  currentNode: null,
  competitors: null,
  competitorData: null,
  report: null,
  error: null,
  reasoning: null,
  searchAttempts: null,
  searchStrategies: null
};

// Helper function to log graph transitions
function logGraphTransition(fromNode, toNode, state) {
  console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.blue('🔄 Graph Transition:'), chalk.yellow(fromNode), '→', chalk.green(toNode));
  if (state.competitors) {
    console.log(chalk.gray(`   State: ${state.competitors.length} competitors found`));
  }
  if (state.competitorData) {
    console.log(chalk.gray(`   State: ${state.competitorData.length} competitors analyzed`));
  }
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

// Helper function to add reasoning
function addReasoning(state, reasoning) {
  return {
    ...state,
    reasoning: [...(state.reasoning || []), reasoning]
  };
}

// Node 1: Search for competitors with retry strategies
async function discoverCompetitors(state) {
  console.log(chalk.magenta('\n📍 Node: DISCOVER COMPETITORS'));
  console.log(chalk.gray('Purpose: Search for competitors using Firecrawl\n'));
  
  if (!state.query) {
    return {
      ...state,
      error: 'No query provided',
      currentNode: 'discover'
    };
  }
  
  const spinner = ora('Searching for competitors...').start();
  
  try {
    const searchAttempts = state.searchAttempts || 0;
    const maxAttempts = 3;
    
    // Define search strategies
    const searchStrategies = [
      {
        name: 'standard',
        query: `${state.query} alternatives competitors comparison versus`
      },
      {
        name: 'vs_search', 
        query: `"${state.query} vs" "compare ${state.query}" best`
      },
      {
        name: 'specific_year',
        query: `best ${state.query} alternatives 2024 competitors`
      }
    ];
    
    let currentStrategy = searchStrategies[searchAttempts];
    
    if (!currentStrategy) {
      spinner.fail('Exhausted all search strategies');
      state = addReasoning(state, 'Could not find competitors after trying all search strategies');
      return {
        ...state,
        competitors: [],
        currentNode: 'discover'
      };
    }
    
    console.log(chalk.blue(`\n🔍 Attempt ${searchAttempts + 1}/${maxAttempts}: Using ${currentStrategy.name} strategy`));
    spinner.text = `Searching with: "${currentStrategy.query}"`;
    
    const searchResults = await firecrawl.search(currentStrategy.query, {
      limit: 3,
      scrapeOptions: {
        formats: ['markdown']
      }
    });
    
    if (!searchResults.success || !searchResults.data || searchResults.data.length === 0) {
      throw new Error('No results from search');
    }
    
    spinner.text = 'Analyzing search results with AI...';
    
    // Extract competitors from results
    const prompt = `Based on these search results for "${state.query}", identify direct competitors.
    
Search results:
${JSON.stringify(searchResults.data.map(r => ({
  title: r.title,
  url: r.url,
  description: r.description,
  snippet: r.markdown?.substring(0, 300)
})), null, 2)}

Return a JSON array of actual competitor products/services (not review sites):
[{
  "name": "Company Name",
  "url": "https://example.com",
  "description": "What they offer",
  "confidence": "high|medium|low"
}]`;

    const response = await model.invoke(prompt);
    let competitors = [];
    
    try {
      let content = response.content;
      
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        content = jsonMatch[1].trim();
      } else {
        // If no code blocks, try to find JSON array
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          content = arrayMatch[0];
        }
      }
      
      competitors = JSON.parse(content);
    } catch (parseErr) {
      console.log(chalk.yellow('   Failed to parse AI response:'));
      console.log(chalk.gray('   Parse error:', parseErr.message));
      console.log(chalk.gray('   Raw response:', response.content.substring(0, 200)));
      throw new Error('Failed to extract competitors');
    }
    
    // Filter for quality
    const validCompetitors = competitors.filter(comp => {
      return comp.name && comp.url && 
        !comp.url.includes('reddit.com') &&
        !comp.url.includes('stackoverflow.com') &&
        comp.confidence !== 'low';
    });
    
    if (validCompetitors.length === 0) {
      throw new Error('No valid competitors found');
    }
    
    spinner.succeed(`Found ${validCompetitors.length} competitors!`);
    
    console.log(chalk.green('\n✅ Discovered Competitors:'));
    validCompetitors.slice(0, 3).forEach((comp, i) => {
      console.log(chalk.white(`   ${i + 1}. ${comp.name}`), chalk.gray(`- ${comp.url} (${comp.confidence})`));
    });
    
    state = addReasoning(state, `Successfully found ${validCompetitors.length} competitors using ${currentStrategy.name} strategy`);
    
    return {
      ...state,
      competitors: validCompetitors.slice(0, 3), // Only take top 3 competitors
      searchAttempts: searchAttempts + 1,
      searchStrategies: [...(state.searchStrategies || []), currentStrategy.name],
      currentNode: 'discover'
    };
    
  } catch (error) {
    spinner.fail(`Search failed: ${error.message}`);
    console.log(chalk.yellow(`   Will retry with different strategy...`));
    state = addReasoning(state, `Search attempt ${(state.searchAttempts || 0) + 1} failed: ${error.message}`);
    
    return {
      ...state,
      searchAttempts: (state.searchAttempts || 0) + 1,
      currentNode: 'discover'
    };
  }
}

// Decision node: Should we retry search?
function shouldRetrySearch(state) {
  const hasCompetitors = state.competitors && state.competitors.length > 0;
  const reachedMaxAttempts = state.searchAttempts >= 3;
  
  if (!hasCompetitors && !reachedMaxAttempts) {
    console.log(chalk.yellow('⚡ Decision: Retrying with new search strategy'));
    return "discover";
  }
  
  if (!hasCompetitors && reachedMaxAttempts) {
    console.log(chalk.red('⚡ Decision: No competitors found after all attempts'));
    return "end";
  }
  
  console.log(chalk.green('⚡ Decision: Proceeding to gather competitor data'));
  return "gather";
}

// Node 2: Gather detailed data about competitors
async function gatherCompetitorData(state) {
  console.log(chalk.magenta('\n📍 Node: GATHER COMPETITOR DATA'));
  console.log(chalk.gray('Purpose: Scrape and analyze competitor websites\n'));
  
  if (!state.competitors || state.competitors.length === 0) {
    console.log(chalk.yellow('⚠️  No competitors to analyze'));
    return state;
  }

  const spinner = ora('Gathering competitor data...').start();
  const competitorData = [];
  
  state = addReasoning(state, `Starting analysis of ${state.competitors.length} competitors`);

  for (let i = 0; i < state.competitors.length; i++) {
    const competitor = state.competitors[i];
    console.log(chalk.blue(`\n🔍 Analyzing ${i + 1}/${state.competitors.length}: ${competitor.name}`));
    spinner.text = `Scraping ${competitor.name} website...`;
    
    let data = {
      name: competitor.name,
      url: competitor.url,
      description: competitor.description,
      features: [],
      pricing: 'Not found',
      targetAudience: 'Not specified',
      pros: [],
      cons: [],
      dataCompleteness: 'minimal'
    };
    
    try {
      // Scrape the competitor's website
      const scrapeResult = await firecrawl.scrapeUrl(competitor.url, {
        formats: ['markdown']
      });
      
      if (scrapeResult.success && scrapeResult.markdown) {
        // Extract data with AI
        const analysisPrompt = `Analyze this competitor website content and extract:
1. Key features (3-5)
2. Pricing information
3. Target audience
4. Pros and cons

Content: ${scrapeResult.markdown.substring(0, 4000)}

Return JSON with all fields. Mark dataCompleteness as "complete", "partial", or "minimal".`;

        const response = await model.invoke(analysisPrompt);
        try {
          const extracted = JSON.parse(response.content.replace(/```json\n?|\n?```/g, '').trim());
          data = { ...data, ...extracted };
          console.log(chalk.green(`   ✓ Extracted data successfully`));
        } catch (e) {
          console.log(chalk.yellow('   ⚠️  Could not extract all data'));
        }
      }
    } catch (err) {
      console.log(chalk.yellow(`   ⚠️  Scraping failed: ${err.message}`));
    }
    
    competitorData.push(data);
  }
  
  spinner.succeed(`Analyzed ${competitorData.length} competitors`);
  
  console.log(chalk.green('\n📊 Data Quality Summary:'));
  competitorData.forEach((comp) => {
    const status = comp.dataCompleteness === 'complete' ? '✅' : 
                  comp.dataCompleteness === 'partial' ? '⚠️' : '❌';
    console.log(`   ${status} ${comp.name}: ${comp.dataCompleteness}`);
  });
  
  state = addReasoning(state, `Completed analysis of ${competitorData.length} competitors`);
  
  return {
    ...state,
    competitorData,
    currentNode: 'gather'
  };
}

// Node 3: Generate comprehensive report
async function generateReport(state) {
  console.log(chalk.magenta('\n📍 Node: GENERATE REPORT'));
  console.log(chalk.gray('Purpose: Create analysis report from gathered data\n'));
  
  if (!state.competitorData || state.competitorData.length === 0) {
    console.log(chalk.yellow('⚠️  No competitor data to generate report'));
    return state;
  }

  const spinner = ora('Generating report...').start();
  state = addReasoning(state, `Generating report from ${state.competitorData.length} competitor analyses`);

  try {
    const reportPrompt = `Create a detailed competitor analysis report for "${state.query}" based on this data:

${JSON.stringify(state.competitorData, null, 2)}

Generate a comprehensive markdown report with:

# Competitor Analysis: ${state.query}

## Executive Summary
Brief overview of the competitive landscape

## Detailed Competitor Analysis
For each competitor, create a section with all available information

## Comparison Table
Create a feature/pricing comparison table

## Recommendations
Best options for different use cases and key differentiators

Make it detailed and actionable.`;

    const response = await model.invoke(reportPrompt);
    const report = response.content;

    spinner.text = 'Saving report files...';

    // Save report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save markdown
    const mdFile = `output/competitor-analysis-${timestamp}.md`;
    writeFileSync(mdFile, report);
    
    // Save HTML
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${state.query} - Competitor Analysis</title>
    <style>
        body { 
            font-family: -apple-system, system-ui, sans-serif; 
            max-width: 900px; 
            margin: 40px auto; 
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #3498db; color: white; font-weight: bold; }
        tr:nth-child(even) { background: #f8f9fa; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        blockquote { border-left: 4px solid #3498db; margin-left: 0; padding-left: 20px; color: #555; }
    </style>
</head>
<body>
    ${marked.parse(report)}
    
    <hr>
    <p style="text-align: right; color: #666; margin-top: 40px;">
        Generated with LangGraph + Firecrawl on ${new Date().toLocaleString()}
    </p>
</body>
</html>`;
    
    const htmlFile = `output/competitor-analysis-${timestamp}.html`;
    writeFileSync(htmlFile, html);
    
    // Save raw data as JSON
    const jsonFile = `output/competitor-analysis-${timestamp}.json`;
    writeFileSync(jsonFile, JSON.stringify({
      query: state.query,
      competitors: state.competitors,
      analysis: state.competitorData,
      searchStrategies: state.searchStrategies,
      searchAttempts: state.searchAttempts,
      reasoning: state.reasoning,
      generatedAt: new Date().toISOString()
    }, null, 2));

    spinner.succeed('Report generated successfully!');
    
    console.log(chalk.green('\n✅ Files created:'));
    console.log(`   • Markdown: ${chalk.cyan(mdFile)}`);
    console.log(`   • HTML: ${chalk.cyan(htmlFile)}`);
    console.log(`   • JSON: ${chalk.cyan(jsonFile)}`);
    
    state = addReasoning(state, `Successfully generated report files`);
    
    return {
      ...state,
      report,
      currentNode: 'report'
    };
  } catch (error) {
    spinner.fail('Failed to generate report');
    console.error(chalk.red('   Error:'), error.message);
    
    return {
      ...state,
      error: error.message,
      currentNode: 'report'
    };
  }
}

// Create the workflow
const workflow = new StateGraph({
  channels: StateChannels
});

// Add nodes
workflow.addNode("discover", discoverCompetitors);
workflow.addNode("gather", gatherCompetitorData);
workflow.addNode("generateReport", generateReport);

// Define edges
workflow.setEntryPoint("discover");

// Conditional edge from discover
workflow.addConditionalEdges(
  "discover",
  shouldRetrySearch,
  {
    "discover": "discover",  // Retry search
    "gather": "gather",      // Proceed to gathering
    "end": END              // Give up
  }
);

workflow.addEdge("gather", "generateReport");
workflow.addEdge("generateReport", END);

// Compile the graph
const app = workflow.compile();

// Run the workflow
async function runWorkflow(query) {
  console.log(chalk.bold.green('\n🚀 Starting LangGraph Workflow'));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  
  const initialState = {
    query,
    reasoning: [`Starting competitor analysis for: "${query}"`],
    searchAttempts: 0,
    searchStrategies: []
  };
  
  try {
    console.log(chalk.blue('📊 Initial State:'));
    console.log(chalk.gray(`   • Query: "${query}"`));
    console.log(chalk.gray(`   • Nodes: discover → gather → generateReport → END\n`));
    
    let previousNode = 'START';
    let finalState = initialState;
    
    // Run the graph with streaming
    const stream = await app.stream(initialState);
    
    for await (const chunk of stream) {
      const [node, state] = Object.entries(chunk)[0];
      if (node !== previousNode) {
        logGraphTransition(previousNode, node, state);
        previousNode = node;
      }
      finalState = { ...finalState, ...state };
    }
    
    if (finalState.error) {
      console.error(chalk.red('\n❌ Workflow failed:'), finalState.error);
    } else if (!finalState.competitors || finalState.competitors.length === 0) {
      console.error(chalk.red('\n❌ No competitors found'));
      console.log(chalk.yellow('This could be due to:'));
      console.log(chalk.gray('   • Firecrawl API issues'));
      console.log(chalk.gray('   • No results for your query'));
      console.log(chalk.gray('   • Rate limiting'));
    } else {
      console.log(chalk.green('\n✨ Workflow completed successfully!'));
      console.log(chalk.blue('\n📊 Summary:'));
      console.log(chalk.gray(`   • Competitors found: ${finalState.competitors?.length || 0}`));
      console.log(chalk.gray(`   • Data gathered: ${finalState.competitorData?.length || 0}`));
      console.log(chalk.gray(`   • Search attempts: ${finalState.searchAttempts || 0}`));
    }
    
    return finalState;
  } catch (error) {
    console.error(chalk.red('\n❌ Unexpected error:'), error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const query = args.length > 0 ? args.join(' ') : 'alternatives to vercel';
  
  console.log(chalk.bold.blue(`\n🔍 Competitor Analysis: "${query}"`));
  console.log(chalk.gray('Using LangGraph + Firecrawl'));
  
  if (args.length === 0) {
    console.log(chalk.yellow('\n💡 Tip: You can specify a custom query:'));
    console.log(chalk.gray('   npm start "alternatives to notion"'));
    console.log(chalk.gray('   npm start "slack competitors"\n'));
  }

  try {
    await runWorkflow(query);
  } catch (error) {
    console.error(chalk.red('\n💀 Fatal error:'), error.message);
    process.exit(1);
  }
}

main();