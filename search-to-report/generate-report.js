import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { marked } from 'marked';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Summarize individual pages with GPT-4o-mini
async function summarizePage(pageContent, title, url, maxParagraphs) {
  const systemPrompt = `You are a research analyst creating executive summaries. 
  Summarize the following content in ${maxParagraphs} paragraphs or less.
  Focus on:
  1. Key insights and findings
  2. Important data points and statistics
  3. Strategic implications
  4. Notable quotes or statements
  5. Unique perspectives or methodologies
  
  Write in a professional, analytical tone suitable for executive briefings.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Title: ${title}\nURL: ${url}\n\nContent:\n${pageContent}` }
    ],
    temperature: 0.3
  });

  return response.choices[0].message.content;
}

// Generate McKinsey-style report with o3-mini
async function generateMcKinseyReport(query, summaries) {
  const combinedSummaries = summaries.map((summary, index) => 
    `# Source ${index + 1}: ${summary.title}\n\n${summary.summary}\n\nSource: ${summary.url}`
  ).join('\n\n---\n\n');

  const systemPrompt = `You are a senior McKinsey consultant creating an executive research report.
  Transform the provided summaries into a comprehensive, McKinsey-style research report.
  
  STRUCTURE YOUR REPORT AS FOLLOWS:
  
  1. EXECUTIVE SUMMARY
     - 3-5 key takeaways in bullet points
     - One paragraph synthesis of findings
     - Clear recommendation or conclusion
  
  2. SITUATION OVERVIEW
     - Context and background
     - Why this topic matters now
     - Key stakeholders and implications
  
  3. KEY FINDINGS
     - 3-5 main insights with supporting evidence
     - Use data and statistics from sources
     - Include relevant quotes
     - Structure as distinct subsections
  
  4. ANALYSIS & IMPLICATIONS
     - Synthesize findings into strategic insights
     - Identify patterns and trends
     - Highlight opportunities and risks
     - Consider multiple perspectives
  
  5. RECOMMENDATIONS
     - 3-5 actionable recommendations
     - Prioritized by impact and feasibility
     - Include implementation considerations
  
  6. APPENDIX
     - Methodology note
     - Source list with brief descriptions
     - Areas for further research
  
  STYLE GUIDELINES:
  - Use clear, concise business language
  - Include data visualizations descriptions (e.g., "Figure 1 would show...")
  - Apply the MECE principle (Mutually Exclusive, Collectively Exhaustive)
  - Use the pyramid principle for arguments
  - Include specific examples and case studies
  - Bold key terms and important findings
  
  FORMAT:
  - Use markdown formatting
  - Create clear hierarchy with headers
  - Use bullet points for lists
  - Include blockquotes for important statements`;

  const response = await openai.chat.completions.create({
    model: "o3-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Research Topic: "${query}"\n\nSummarized Sources:\n\n${combinedSummaries}` }
    ]
  });

  return response.choices[0].message.content;
}

// Convert markdown to HTML with McKinsey styling
function generateHTML(markdown, query) {
  const html = marked.parse(markdown);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${query} - Research Report</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Open+Sans:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Open Sans', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 0;
        }
        
        .header {
            background: #003A70;
            color: white;
            padding: 40px;
            text-align: center;
            page-break-after: always;
        }
        
        .header h1 {
            font-family: 'Merriweather', serif;
            font-size: 36px;
            margin-bottom: 20px;
            font-weight: 300;
        }
        
        .header .subtitle {
            font-size: 18px;
            opacity: 0.9;
            margin-bottom: 30px;
        }
        
        .header .meta {
            font-size: 14px;
            opacity: 0.7;
        }
        
        .content {
            max-width: 800px;
            margin: 0 auto;
            padding: 60px 40px;
        }
        
        h1 {
            font-family: 'Merriweather', serif;
            color: #003A70;
            font-size: 32px;
            margin: 40px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #003A70;
            page-break-after: avoid;
        }
        
        h2 {
            font-family: 'Merriweather', serif;
            color: #003A70;
            font-size: 24px;
            margin: 30px 0 15px 0;
            page-break-after: avoid;
        }
        
        h3 {
            color: #003A70;
            font-size: 18px;
            margin: 20px 0 10px 0;
            font-weight: 600;
            page-break-after: avoid;
        }
        
        p {
            margin-bottom: 15px;
            text-align: justify;
            page-break-inside: avoid;
        }
        
        ul, ol {
            margin: 15px 0 15px 30px;
            page-break-inside: avoid;
        }
        
        li {
            margin-bottom: 8px;
        }
        
        blockquote {
            border-left: 4px solid #003A70;
            padding-left: 20px;
            margin: 20px 0;
            font-style: italic;
            color: #555;
            page-break-inside: avoid;
        }
        
        strong {
            color: #003A70;
            font-weight: 600;
        }
        
        .executive-summary {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 8px;
            margin: 30px 0;
            page-break-inside: avoid;
        }
        
        .key-finding {
            background: #e8f2ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #003A70;
            page-break-inside: avoid;
        }
        
        .recommendation {
            background: #fff3cd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #ffc107;
            page-break-inside: avoid;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background: #003A70;
            color: white;
            font-weight: 600;
        }
        
        .chart-placeholder {
            background: #f0f0f0;
            border: 2px dashed #999;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            color: #666;
            font-style: italic;
            page-break-inside: avoid;
        }
        
        .footer {
            text-align: center;
            padding: 40px;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            margin-top: 60px;
        }
        
        @media print {
            .header {
                position: relative;
                height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            
            .content {
                padding: 40px;
            }
            
            h1 {
                page-break-before: always;
            }
            
            h1:first-child {
                page-break-before: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${query}</h1>
        <div class="subtitle">Strategic Research Report</div>
        <div class="meta">
            Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
            Powered by AI-Driven Research Analysis
        </div>
    </div>
    
    <div class="content">
        ${html}
    </div>
    
    <div class="footer">
        <p>This report was generated using advanced AI analysis of multiple sources.<br>
        For the most current information, please verify with primary sources.</p>
    </div>
    
    <script>
        // Add special styling to specific sections
        document.addEventListener('DOMContentLoaded', function() {
            // Style executive summary
            const execSummary = document.querySelector('h1');
            if (execSummary && execSummary.textContent.includes('EXECUTIVE SUMMARY')) {
                const nextElements = [];
                let sibling = execSummary.nextElementSibling;
                while (sibling && sibling.tagName !== 'H1') {
                    nextElements.push(sibling);
                    sibling = sibling.nextElementSibling;
                }
                
                const wrapper = document.createElement('div');
                wrapper.className = 'executive-summary';
                execSummary.parentNode.insertBefore(wrapper, execSummary);
                wrapper.appendChild(execSummary);
                nextElements.forEach(el => wrapper.appendChild(el));
            }
            
            // Style key findings
            document.querySelectorAll('h3').forEach(h3 => {
                if (h3.textContent.includes('Finding') || h3.textContent.includes('Insight')) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'key-finding';
                    h3.parentNode.insertBefore(wrapper, h3);
                    wrapper.appendChild(h3);
                    
                    let sibling = wrapper.nextElementSibling;
                    while (sibling && sibling.tagName !== 'H3' && sibling.tagName !== 'H2' && sibling.tagName !== 'H1') {
                        const next = sibling.nextElementSibling;
                        wrapper.appendChild(sibling);
                        sibling = next;
                    }
                }
            });
            
            // Style recommendations
            document.querySelectorAll('h3').forEach(h3 => {
                if (h3.textContent.includes('Recommendation')) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'recommendation';
                    h3.parentNode.insertBefore(wrapper, h3);
                    wrapper.appendChild(h3);
                    
                    let sibling = wrapper.nextElementSibling;
                    while (sibling && sibling.tagName !== 'H3' && sibling.tagName !== 'H2' && sibling.tagName !== 'H1') {
                        const next = sibling.nextElementSibling;
                        wrapper.appendChild(sibling);
                        sibling = next;
                    }
                }
            });
            
            // Replace figure descriptions with placeholders
            document.querySelectorAll('p').forEach(p => {
                if (p.textContent.includes('Figure') && p.textContent.includes('would show')) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'chart-placeholder';
                    placeholder.textContent = p.textContent;
                    p.parentNode.replaceChild(placeholder, p);
                }
            });
        });
    </script>
</body>
</html>`;
}

// Main report generation function
export async function generateReport(searchPayload, query) {
  const spinner = ora('Processing search results...').start();
  
  try {
    // Create output directory
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    const output = 'research-report.html';
    const summarizeLimit = 10;
    
    if (searchPayload.length === 0) {
      console.log(chalk.yellow('\n⚠️  No results found for your query.'));
      process.exit(0);
    }
    
    // Display found sources
    console.log(chalk.cyan('\n📋 Sources found:'));
    searchPayload.forEach((result, index) => {
      console.log(chalk.gray(`  ${index + 1}. ${result.title}`));
      console.log(chalk.gray(`     ${result.url}`));
    });
    
    // Summarize each page
    spinner.text = 'Summarizing content from each source...';
    const summaries = [];
    
    for (let i = 0; i < searchPayload.length; i++) {
      const result = searchPayload[i];
      spinner.text = `Summarizing source ${i + 1} of ${searchPayload.length}...`;
      
      const summary = await summarizePage(
        result.markdown || result.description || '', 
        result.title, 
        result.url, 
        summarizeLimit
      );
      
      summaries.push({ title: result.title, url: result.url, summary });
    }
    
    spinner.succeed('Content summarization complete');
    
    // Generate McKinsey report
    spinner.start('Generating McKinsey-style research report...');
    const reportMarkdown = await generateMcKinseyReport(query, summaries);
    spinner.succeed('Report generation complete');
    
    // Convert to HTML
    spinner.start('Converting to HTML...');
    const reportHTML = generateHTML(reportMarkdown, query);
    
    // Save outputs
    const outputPath = path.join(outputDir, output);
    await fs.writeFile(outputPath, reportHTML);
    spinner.succeed(`Report saved to ${chalk.green(path.join('output', output))}`);
    
    // Also save markdown version
    const mdPath = outputPath.replace('.html', '.md');
    await fs.writeFile(mdPath, reportMarkdown);
    console.log(chalk.gray(`  Markdown version saved to ${path.join('output', path.basename(mdPath))}`));
    
    // Display summary
    console.log(chalk.yellow('\n📊 Report summary:'));
    const sections = reportMarkdown.split('\n##').length - 1;
    const wordCount = reportMarkdown.split(' ').length;
    console.log(chalk.gray(`  - Sections: ${sections}`));
    console.log(chalk.gray(`  - Word count: ~${wordCount}`));
    console.log(chalk.gray(`  - Sources analyzed: ${searchPayload.length}`));
    
    console.log(chalk.green('\n✨ Research report ready!'));
    console.log(chalk.blue(`\n💡 Open ${path.join('output', output)} to view your McKinsey-style report.`));
    console.log(chalk.gray(`📁 Output saved to: ${outputDir}`));
    
    // Print instructions
    console.log(chalk.yellow(`
📄 To save as PDF:
   1. Open the HTML file in your browser
   2. Press Ctrl/Cmd + P to print
   3. Select "Save as PDF"
   4. Ensure "Background graphics" is enabled
   5. Save the file

💡 For best results, use Chrome or Edge browser.
`));
    
  } catch (error) {
    spinner.fail('Error occurred');
    throw error;
  }
}