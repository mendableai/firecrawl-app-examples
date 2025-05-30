import FirecrawlApp from '@mendable/firecrawl-js';
import { generateSlides } from './generate-slideshow.js';

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

const query = process.argv.slice(2).join(' ') || 'AI trends 2025';
console.log(`Searching for: "${query}"`);

const searchResults = await firecrawl.search(query, {
  limit: 5,
  scrapeOptions: {
    formats: ['markdown']
  }
});

generateSlides(searchResults.data, query);