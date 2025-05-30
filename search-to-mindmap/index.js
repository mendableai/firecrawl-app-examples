import dotenv from 'dotenv';
dotenv.config();

import FirecrawlApp from '@mendable/firecrawl-js';
import { generateMindMap } from './generate-mindmap.js';

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

const query = process.argv.slice(2).join(' ') || 'artificial intelligence applications';
console.log(`Searching for: "${query}"`);

const searchResults = await firecrawl.search(query, {
  limit: 10,
  scrapeOptions: {
    formats: ['markdown', 'html']
  }
});

generateMindMap(searchResults.data, query);