import FirecrawlApp from '@mendable/firecrawl-js';
import OpenAI from 'openai';
import { StateGraph, END } from '@langchain/langgraph';
import dotenv from 'dotenv';
import { saveCompanyReport } from './generate-report.js';

dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define the state schema
const State = {
  email: '',
  domain: '',
  companyName: '',
  companyUrl: '',
  companyData: {},
  recentNews: [],
  teamInfo: [],
  fundingInfo: {},
  businessModel: {},
  summary: '',
  myCompanyProfile: '', // Our company profile for alignment analysis
  alignmentAnalysis: {} // How well companies align
};

// LangGraph workflow definition
const workflow = new StateGraph({
  channels: State
});

// Node 1: Extract domain from email and load company profile
async function extractDomain(state) {
  const email = state.email;
  const domain = email.split('@')[1];
  console.log(`📧 Extracted domain: ${domain}`);
  
  // Load our company profile
  let myCompanyProfile = '';
  try {
    const fs = await import('fs/promises');
    const profilePath = new URL('./company-profile.md', import.meta.url).pathname;
    myCompanyProfile = await fs.readFile(profilePath, 'utf-8');
    console.log(`   📋 Loaded company profile (${myCompanyProfile.length} chars)`);
  } catch (error) {
    console.log(`   ℹ️  No company profile found, using generic analysis`);
  }
  
  return {
    ...state,
    domain: domain,
    companyUrl: `https://${domain}`,
    myCompanyProfile: myCompanyProfile
  };
}

// Node 2: Scrape company website
async function scrapeCompanyWebsite(state) {
  console.log(`🔍 Scraping company website: ${state.companyUrl}`);
  
  try {
    const scrapeResult = await firecrawl.scrapeUrl(state.companyUrl, {
      formats: ['markdown']
    });
    
    console.log(`   ✅ Scraped ${scrapeResult.markdown?.length || 0} characters`);
    
    // Extract company info using GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "system",
        content: "Extract company information from the website content. Return as JSON."
      }, {
        role: "user",
        content: `Extract the following from this company website and return as JSON:
        - Company name
        - What they do (brief description)
        - Main products/services
        - Industry/sector
        - Company size indicators
        - Any visible contact info
        
        Website content:
        ${scrapeResult.markdown?.substring(0, 8000)}`
      }],
      response_format: { type: "json_object" }
    });
    
    const companyData = JSON.parse(completion.choices[0].message.content);
    
    console.log(`   🏢 Identified: ${companyData.company_name || companyData.companyName || state.domain}`);
    
    return {
      ...state,
      companyName: companyData.company_name || companyData.companyName || state.domain,
      companyData: companyData
    };
  } catch (error) {
    console.error('   ❌ Error scraping company website:', error.message);
    // Fallback to domain name if scraping fails
    return {
      ...state,
      companyName: state.domain.split('.')[0], // Extract company name from domain
      companyData: {
        note: "Unable to scrape company website directly"
      }
    };
  }
}

// Node 3: Search for recent company news
async function searchRecentNews(state) {
  console.log(`📰 Searching for recent news about ${state.companyName}`);
  
  try {
    const newsQuery = `"${state.companyName}" announcement news update`;
    console.log(`   🔎 Query: "${newsQuery}"`);
    
    const searchResults = await firecrawl.search(newsQuery, {
      limit: 5,
      scrapeOptions: {
        formats: ['markdown']
      }
    });
    
    console.log(`   ✅ Found ${searchResults.data.length} results:`);
    searchResults.data.forEach((result, i) => {
      console.log(`      ${i + 1}. ${result.title?.substring(0, 60)}...`);
    });
    
    const recentNews = searchResults.data.map(result => ({
      title: result.title,
      url: result.url,
      description: result.description,
      date: result.metadata?.date || 'Unknown'
    }));
    
    return {
      ...state,
      recentNews: recentNews
    };
  } catch (error) {
    console.error('   ❌ Error searching news:', error.message);
    return state;
  }
}

// Node 4: Search for funding information
async function searchFundingInfo(state) {
  console.log(`💰 Searching for funding information about ${state.companyName}`);
  
  try {
    // First check if it's a public company
    const publicQuery = `"${state.companyName}" NYSE NASDAQ "publicly traded" "stock symbol"`;
    console.log(`   🔎 Checking if public company...`);
    
    const publicResults = await firecrawl.search(publicQuery, {
      limit: 2,
      scrapeOptions: {
        formats: ['markdown']
      }
    });
    
    // Check if company is public
    const isPublicCheck = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "system",
        content: "Determine if this company is publicly traded based on the search results. Return as JSON: {\"isPublic\": true/false, \"stockSymbol\": \"SYMBOL\" or null}"
      }, {
        role: "user",
        content: `Analyze this content and determine if the company is publicly traded. Return as JSON format:
        ${publicResults.data.map(r => r.markdown?.substring(0, 1000)).join('\n')}`
      }],
      response_format: { type: "json_object" }
    });
    
    const publicStatus = JSON.parse(isPublicCheck.choices[0].message.content);
    
    if (publicStatus.isPublic) {
      console.log(`   📈 Company is publicly traded (${publicStatus.stockSymbol})`);
      return {
        ...state,
        fundingInfo: {
          status: "Public Company",
          stockSymbol: publicStatus.stockSymbol,
          note: "This is a publicly traded company. Funding rounds are not applicable."
        }
      };
    }
    
    // If not public, search for funding
    const fundingQuery = `"${state.companyName}" "raised" "funding" "series" "investment"`;
    console.log(`   🔎 Searching for funding rounds...`);
    console.log(`   🔎 Query: "${fundingQuery}"`);
    
    const searchResults = await firecrawl.search(fundingQuery, {
      limit: 3,
      scrapeOptions: {
        formats: ['markdown']
      }
    });
    
    console.log(`   ✅ Found ${searchResults.data.length} funding-related results`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "system",
        content: "Extract ONLY real funding information that is explicitly mentioned in the search results. Return as JSON format: {\"funding_rounds\": [], \"note\": \"No funding information found\"}. Do NOT make up or hallucinate any data."
      }, {
        role: "user",
        content: `Extract ONLY actual funding rounds mentioned in these search results. Do not invent or guess any information. Return as JSON:
        ${searchResults.data.map(r => r.markdown?.substring(0, 2000)).join('\n')}
        
        Important: Only include funding rounds that are explicitly stated with amounts and dates. If the company is public or no funding info is found, say so in the JSON response.`
      }],
      response_format: { type: "json_object" }
    });
    
    const fundingInfo = JSON.parse(completion.choices[0].message.content);
    
    if (fundingInfo.funding_rounds && fundingInfo.funding_rounds.length > 0) {
      console.log(`   💸 Found ${fundingInfo.funding_rounds.length} funding rounds`);
    } else {
      console.log(`   ℹ️  No funding information found`);
    }
    
    return {
      ...state,
      fundingInfo: fundingInfo
    };
  } catch (error) {
    console.error('   ❌ Error searching funding:', error.message);
    return state;
  }
}

// Node 5: Generate executive summary with alignment analysis
async function generateSummary(state) {
  console.log(`📊 Generating executive summary for ${state.companyName}`);
  
  // First, analyze alignment if we have a company profile
  let alignmentAnalysis = {};
  if (state.myCompanyProfile) {
    console.log(`   🤝 Analyzing partnership alignment...`);
    
    const alignmentCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "system",
        content: "Analyze how well these two companies align for potential partnership or sales. Be very careful to identify competitors. Return as JSON."
      }, {
        role: "user",
        content: `Analyze alignment between these companies and return as JSON:
        
        MY COMPANY PROFILE:
        ${state.myCompanyProfile}
        
        TARGET COMPANY DATA:
        Company: ${state.companyName}
        ${JSON.stringify(state.companyData, null, 2)}
        Recent News: ${JSON.stringify(state.recentNews, null, 2)}
        Funding: ${JSON.stringify(state.fundingInfo, null, 2)}
        
        CRITICAL ALIGNMENT RULES:
        1. If both companies offer the same core product/service to the same customers = COMPETITORS (score 1-3)
        2. If companies solve the same problem with similar solutions = COMPETITORS (score 1-3)
        3. If there's significant market overlap = COMPETITORS (score 1-3)
        4. Only score 7+ if there's clear complementary value with no competitive overlap
        
        Examples:
        - Two web scraping APIs = COMPETITORS (score 2, type: competitor, recommendation: pass)
        - Web scraping API + AI framework = PARTNERS (score 8, type: integration, recommendation: pursue)
        - Two payment processors = COMPETITORS (score 2, type: competitor, recommendation: pass)
        - Payment processor + E-commerce platform = PARTNERS (score 7, type: partner, recommendation: explore)
        
        Return JSON with:
        - alignment_score (1-10)
        - alignment_type (customer, partner, integration, competitor, not_aligned)
        - synergies (array of specific synergy points)
        - concerns (array of potential issues)
        - recommendation (pursue, explore, pass)
        - talking_points (array of specific points to mention)
        - competitive_analysis (brief explanation if they compete)`
      }],
      response_format: { type: "json_object" }
    });
    
    alignmentAnalysis = JSON.parse(alignmentCompletion.choices[0].message.content);
    console.log(`   ✅ Alignment score: ${alignmentAnalysis.alignment_score}/10 (${alignmentAnalysis.recommendation})`);
  }
  
  // Generate the main summary with alignment context
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{
      role: "system",
      content: state.myCompanyProfile 
        ? "You are a business intelligence analyst. Create a partnership-focused executive summary."
        : "You are a business intelligence analyst. Create a concise executive summary."
    }, {
      role: "user",
      content: `Create an executive summary for outreach to ${state.email} at ${state.companyName}:
      
      Company Data: ${JSON.stringify(state.companyData, null, 2)}
      Recent News: ${JSON.stringify(state.recentNews, null, 2)}
      Funding: ${JSON.stringify(state.fundingInfo, null, 2)}
      ${state.myCompanyProfile ? `\nAlignment Analysis: ${JSON.stringify(alignmentAnalysis, null, 2)}` : ''}
      
      Include:
      1. Company overview
      2. Recent developments
      3. ${state.myCompanyProfile ? 'Partnership/collaboration opportunities' : 'Potential pain points/needs'}
      4. ${state.myCompanyProfile ? 'Specific integration or synergy points' : 'General talking points'}
      5. ${state.myCompanyProfile ? 'Recommended approach and timing' : 'Best timing considerations'}`
    }]
  });
  
  return {
    ...state,
    alignmentAnalysis: alignmentAnalysis,
    summary: completion.choices[0].message.content
  };
}

// Build the workflow
workflow.addNode("extract_domain", extractDomain);
workflow.addNode("scrape_website", scrapeCompanyWebsite);
workflow.addNode("search_news", searchRecentNews);
workflow.addNode("search_funding", searchFundingInfo);
workflow.addNode("generate_summary", generateSummary);

// Define the flow
workflow.setEntryPoint("extract_domain");
workflow.addEdge("extract_domain", "scrape_website");
workflow.addEdge("scrape_website", "search_news");
workflow.addEdge("search_news", "search_funding");
workflow.addEdge("search_funding", "generate_summary");
workflow.addEdge("generate_summary", END);

const app = workflow.compile();

// Main function
async function researchCompanyFromEmail(email) {
  console.log(`\n🔍 This is a demonstration of search within Firecrawl`);
  console.log(`🚀 Starting company research for: ${email}\n`);
  
  const initialState = {
    email: email,
    domain: '',
    companyName: '',
    companyUrl: '',
    companyData: {},
    recentNews: [],
    techStack: [],
    teamInfo: [],
    fundingInfo: {},
    businessModel: {},
    summary: ''
  };
  
  const result = await app.invoke(initialState);
  
  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('📋 COMPANY INTELLIGENCE REPORT');
  console.log('='.repeat(80));
  console.log(`\n📧 Contact: ${result.email}`);
  console.log(`🏢 Company: ${result.companyName}`);
  console.log(`🌐 Website: ${result.companyUrl}`);
  
  // Show alignment analysis if available
  if (result.alignmentAnalysis && result.alignmentAnalysis.alignment_score) {
    console.log('\n🤝 PARTNERSHIP ALIGNMENT:');
    console.log(`   Score: ${result.alignmentAnalysis.alignment_score}/10`);
    console.log(`   Type: ${result.alignmentAnalysis.alignment_type}`);
    console.log(`   Recommendation: ${result.alignmentAnalysis.recommendation?.toUpperCase()}`);
    
    if (result.alignmentAnalysis.synergies?.length > 0) {
      console.log('\n   ✅ Synergies:');
      result.alignmentAnalysis.synergies.forEach(s => console.log(`      - ${s}`));
    }
    
    if (result.alignmentAnalysis.concerns?.length > 0) {
      console.log('\n   ⚠️  Concerns:');
      result.alignmentAnalysis.concerns.forEach(c => console.log(`      - ${c}`));
    }
    
    if (result.alignmentAnalysis.competitive_analysis) {
      console.log('\n   🏁 Competitive Analysis:');
      console.log(`      ${result.alignmentAnalysis.competitive_analysis}`);
    }
  }
  
  console.log('\n📊 Company Overview:');
  console.log(JSON.stringify(result.companyData, null, 2));
  
  console.log('\n📰 Recent News:');
  result.recentNews.forEach(news => {
    console.log(`  - ${news.title}`);
    console.log(`    ${news.url}`);
  });
  
  
  console.log('\n💰 Funding Information:');
  console.log(JSON.stringify(result.fundingInfo, null, 2));
  
  console.log('\n📝 EXECUTIVE SUMMARY:');
  console.log('='.repeat(80));
  console.log(result.summary);
  console.log('='.repeat(80));
  
  // Save the report
  await saveCompanyReport(result, result.myCompanyProfile);
  
  return result;
}

// Main entry point following search-to-report convention
async function main() {
  const email = process.argv.slice(2).join(' ') || 'johnsmith@firecrawl.com';
  
  if (!email.includes('@')) {
    console.error('❌ Please provide a valid email address');
    console.log('Usage: node index.js <email@company.com>');
    console.log('Example: node index.js jeff@amazon.com');
    process.exit(1);
  }
  
  console.log(`\n🔍 Researching company from email: ${email}\n`);
  
  try {
    await researchCompanyFromEmail(email);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}