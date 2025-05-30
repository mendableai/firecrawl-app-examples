import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { marked } from 'marked';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate company intelligence report
async function generateCompanyIntelReport(companyData, myCompanyProfile) {
  const spinner = ora('Generating company intelligence report...').start();
  
  try {
    const systemPrompt = `You are a business intelligence analyst creating a comprehensive company report for partnership/sales evaluation.
    
    STRUCTURE YOUR REPORT AS FOLLOWS:
    
    # Company Intelligence Report: ${companyData.companyName}
    
    ## Executive Summary
    - Company overview in 2-3 sentences
    - Alignment score and recommendation
    - Top 3 opportunities or concerns
    - Recommended next steps
    
    ## Company Profile
    ### Overview
    - Company description
    - Products/services
    - Industry and market position
    - Company stage and size
    
    ### Recent Developments
    - Latest news and announcements
    - Product launches
    - Strategic initiatives
    - Market moves
    
    ### Financial Status
    - Funding information or public status
    - Growth indicators
    - Financial health signals
    
    ## Partnership Alignment Analysis
    ### Alignment Score: X/10
    - Type of alignment (customer/partner/integration/competitor/not_aligned)
    - Strategic fit assessment
    
    ### Synergies
    - Specific integration opportunities
    - Complementary capabilities
    - Market expansion potential
    - Technology alignment
    
    ### Concerns & Risks
    - Competitive overlap (if any)
    - Potential conflicts
    - Resource requirements
    - Market overlap issues
    - Implementation challenges
    
    ## Recommended Approach
    ### Engagement Strategy
    - Primary value proposition
    - Key talking points
    - Decision maker targets
    - Timing considerations
    
    ### Next Steps
    1. Immediate actions
    2. Short-term goals
    3. Long-term opportunities
    
    ## Appendix
    ### Sources
    - List all sources used
    ### Data Quality Note
    - Confidence level in findings
    - Data gaps identified
    
    STYLE GUIDELINES:
    - Use clear, actionable language
    - Include specific examples
    - Quantify opportunities where possible
    - Be honest about limitations
    - Focus on practical insights
    - If companies are competitors, clearly state this`;

    const userPrompt = `Create a company intelligence report based on:
    
    TARGET COMPANY DATA:
    ${JSON.stringify(companyData, null, 2)}
    
    ${myCompanyProfile ? `MY COMPANY PROFILE:\n${myCompanyProfile}` : 'No company profile provided - create generic analysis'}
    
    CRITICAL: If analyzing the alignment data, pay special attention to:
    - If alignment_type is "competitor" or score is low (1-3), emphasize competitive overlap
    - If companies offer similar products/services, they are likely competitors
    - Be realistic about partnership potential between competitors
    
    Focus on actionable intelligence for business development.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3
    });

    spinner.succeed('Report generated successfully');
    return response.choices[0].message.content;
  } catch (error) {
    spinner.fail('Failed to generate report');
    throw error;
  }
}

// Convert markdown to HTML
async function generateHTML(markdownContent, companyName) {
  const html = marked(markdownContent);
  
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Company Intelligence Report: ${companyName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        h2 {
            color: #34495e;
            margin-top: 40px;
            margin-bottom: 20px;
        }
        h3 {
            color: #7f8c8d;
            margin-top: 25px;
        }
        .alignment-score {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px 0;
        }
        .score-high { background: #2ecc71; color: white; }
        .score-medium { background: #f39c12; color: white; }
        .score-low { background: #e74c3c; color: white; }
        .competitor-warning {
            background: #fee;
            border: 2px solid #e74c3c;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .executive-summary {
            background: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        ul li {
            margin: 10px 0;
        }
        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 20px;
            margin: 20px 0;
            color: #555;
        }
        .metadata {
            text-align: center;
            color: #7f8c8d;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #f8f9fa;
            font-weight: bold;
        }
        .synergy { color: #27ae60; }
        .concern { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        ${html}
        <div class="metadata">
            <p>Generated on ${new Date().toLocaleDateString()} | Powered by Firecrawl & OpenAI</p>
        </div>
    </div>
</body>
</html>`;

  return htmlTemplate;
}

// Save report files
export async function saveCompanyReport(companyData, myCompanyProfile) {
  const spinner = ora('Saving report files...').start();
  
  try {
    // Generate the report
    const markdownReport = await generateCompanyIntelReport(companyData, myCompanyProfile);
    const htmlReport = await generateHTML(markdownReport, companyData.companyName);
    
    // Create output directory
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate filename based on company name
    const safeCompanyName = companyData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `${safeCompanyName}-intel-${timestamp}`;
    
    // Save files
    const mdPath = path.join(outputDir, `${baseFilename}.md`);
    const htmlPath = path.join(outputDir, `${baseFilename}.html`);
    const jsonPath = path.join(outputDir, `${baseFilename}.json`);
    
    await Promise.all([
      fs.writeFile(mdPath, markdownReport),
      fs.writeFile(htmlPath, htmlReport),
      fs.writeFile(jsonPath, JSON.stringify(companyData, null, 2))
    ]);
    
    spinner.succeed('Report saved successfully');
    
    console.log(chalk.green('\n✅ Report generated successfully!'));
    console.log(chalk.blue(`📄 Markdown: ${mdPath}`));
    console.log(chalk.blue(`🌐 HTML: ${htmlPath}`));
    console.log(chalk.blue(`📊 Data: ${jsonPath}`));
    
    return {
      markdown: markdownReport,
      paths: { mdPath, htmlPath, jsonPath }
    };
  } catch (error) {
    spinner.fail('Failed to save report');
    throw error;
  }
}