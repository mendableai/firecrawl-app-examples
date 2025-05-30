import FirecrawlApp from '@mendable/firecrawl-js';
import { generateReport } from './generate-report.js';

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

const query = process.argv.slice(2).join(' ') || 'AI market analysis 2025';
console.log(`Searching for: "${query}"`);

const searchResults = await firecrawl.search(query, {
  limit: 5,
  scrapeOptions: {
    formats: ['markdown']
  }
});

generateReport(searchResults.data, query);