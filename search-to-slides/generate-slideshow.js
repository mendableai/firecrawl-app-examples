import fs from 'fs/promises';
import OpenAI from 'openai';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSlides(searchPayload, query) {
  
  console.log(chalk.cyan(`\n📊 Search to Slides Generator\n`));
  
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
  
  const spinner = ora('Creating presentation structure...').start();
  
  try {
    const slideData = await generateSlideContent(query, searchPayload, 10);
    spinner.succeed(`Generated ${slideData.slides.length} slides`);
    
    spinner.start('Building presentation...');
    const html = generateHTML(slideData, 'gradient');
    
    // Ensure output directory exists
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Save presentation
    const presentationPath = path.join(outputDir, 'presentation.html');
    await fs.writeFile(presentationPath, html);
    spinner.succeed(`Presentation saved to ${chalk.green(path.join('output', 'presentation.html'))}`);
    
    // Save slide outline
    const outlinePath = path.join(outputDir, 'presentation_outline.json');
    await fs.writeFile(outlinePath, JSON.stringify(slideData, null, 2));
    console.log(chalk.gray(`  Outline saved to ${path.join('output', 'presentation_outline.json')}`));
    
    // Display slide titles
    console.log(chalk.cyan('\n📑 Slide overview:'));
    slideData.slides.forEach((slide, index) => {
      const icon = {
        title: '🎯',
        list: '📝',
        quote: '💬',
        stats: '📊',
        image: '🖼️',
        content: '📄'
      }[slide.type] || '📄';
      console.log(chalk.gray(`  ${index + 1}. ${icon} ${slide.title}`));
    });
    
    console.log(chalk.green('\n✨ Presentation complete!'));
    console.log(chalk.gray(`📁 Output saved to: ${outputDir}\n`));
    console.log(chalk.yellow('💡 Tips:'));
    console.log(chalk.gray('  - Open the HTML file in a browser'));
    console.log(chalk.gray('  - Use arrow keys to navigate'));
    console.log(chalk.gray('  - Press F for fullscreen'));
    console.log(chalk.gray('  - Press S for speaker notes'));
    console.log(chalk.gray('  - Press ESC for overview'));
    
  } catch (error) {
    spinner.fail('Error occurred');
    console.error(chalk.red('\n❌ Error:'), error.message);
    if (error.response?.data) {
      console.error(chalk.red('API Response:'), error.response.data);
    }
    throw error;
  }
}

// Generate slide content using OpenAI
async function generateSlideContent(query, searchResults, targetSlides) {
  const combinedContent = searchResults.map((result, index) => 
    `Source ${index + 1}: ${result.title}\nURL: ${result.url}\n\n${result.markdown || result.description || ''}\n`
  ).join('\n---\n\n');

  const systemPrompt = `You are a professional presentation designer creating engaging slide decks.
  Transform the search results into a structured presentation with approximately ${targetSlides} slides.
  
  Return a JSON object with this structure:
  {
    "title": "Presentation Title",
    "subtitle": "Engaging subtitle",
    "author": "Generated from search results",
    "date": "Current date",
    "slides": [
      {
        "type": "title/content/list/quote/image/stats",
        "title": "Slide Title",
        "content": "Main content for simple slides",
        "bullets": ["point 1", "point 2"] for list slides,
        "quote": "Quote text" for quote slides,
        "attribution": "Quote author" for quote slides,
        "stats": [{"number": "50%", "label": "Growth"}] for stats slides,
        "image": "suggested image description",
        "notes": "Speaker notes"
      }
    ]
  }
  
  Guidelines:
  1. Start with a title slide
  2. Include an agenda/overview slide
  3. Mix different slide types for variety
  4. Use concise, impactful text
  5. Include data and statistics where relevant
  6. Add a summary/conclusion slide
  7. End with a "Questions?" or "Thank You" slide
  8. Keep bullet points to 3-5 per slide
  9. Make titles action-oriented
  10. Include speaker notes with key talking points`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Topic: "${query}"\n\nTarget slides: ${targetSlides}\n\nSearch Results:\n${combinedContent}` }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7
  });

  return JSON.parse(response.choices[0].message.content);
}

// Generate HTML presentation
function generateHTML(slideData, theme) {
  const themes = {
    dark: {
      bg: '#0f172a',
      text: '#f1f5f9',
      accent: '#3b82f6',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    },
    light: {
      bg: '#ffffff',
      text: '#1e293b',
      accent: '#3b82f6',
      gradient: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)'
    },
    gradient: {
      bg: '#667eea',
      text: '#ffffff',
      accent: '#fbbf24',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  };

  const currentTheme = themes[theme] || themes.gradient;

  const slideHTML = slideData.slides.map((slide, index) => {
    let slideContent = '';
    
    switch(slide.type) {
      case 'title':
        slideContent = `
          <section data-background="${currentTheme.gradient}">
            <h1 style="font-size: 3em; margin-bottom: 0.5em;">${slideData.title}</h1>
            <h3 style="font-weight: 300; opacity: 0.9;">${slideData.subtitle}</h3>
            <p style="margin-top: 2em; opacity: 0.7;">
              <small>${slideData.author} | ${slideData.date}</small>
            </p>
            <aside class="notes">${slide.notes || ''}</aside>
          </section>`;
        break;
        
      case 'list':
        slideContent = `
          <section>
            <h2>${slide.title}</h2>
            <ul style="font-size: 1.2em; line-height: 1.8;">
              ${slide.bullets.map(bullet => `<li class="fragment">${bullet}</li>`).join('\n')}
            </ul>
            <aside class="notes">${slide.notes || ''}</aside>
          </section>`;
        break;
        
      case 'quote':
        slideContent = `
          <section data-background="${currentTheme.accent}">
            <blockquote style="font-size: 1.5em; border: none; box-shadow: none;">
              <p>"${slide.quote}"</p>
              <footer style="text-align: right; margin-top: 1em; opacity: 0.8;">
                — ${slide.attribution}
              </footer>
            </blockquote>
            <aside class="notes">${slide.notes || ''}</aside>
          </section>`;
        break;
        
      case 'stats':
        slideContent = `
          <section>
            <h2>${slide.title}</h2>
            <div style="display: flex; justify-content: space-around; margin-top: 2em;">
              ${slide.stats.map(stat => `
                <div class="fragment" style="text-align: center;">
                  <div style="font-size: 3em; font-weight: bold; color: ${currentTheme.accent};">
                    ${stat.number}
                  </div>
                  <div style="font-size: 1em; opacity: 0.8; margin-top: 0.5em;">
                    ${stat.label}
                  </div>
                </div>
              `).join('\n')}
            </div>
            <aside class="notes">${slide.notes || ''}</aside>
          </section>`;
        break;
        
      case 'image':
        slideContent = `
          <section>
            <h2>${slide.title}</h2>
            <div style="background: rgba(255,255,255,0.1); padding: 3em; border-radius: 10px; margin: 2em 0;">
              <p style="opacity: 0.7; font-style: italic;">
                [Image: ${slide.image}]
              </p>
            </div>
            ${slide.content ? `<p>${slide.content}</p>` : ''}
            <aside class="notes">${slide.notes || ''}</aside>
          </section>`;
        break;
        
      default: // content
        slideContent = `
          <section>
            <h2>${slide.title}</h2>
            <p style="font-size: 1.2em; line-height: 1.6;">
              ${slide.content}
            </p>
            <aside class="notes">${slide.notes || ''}</aside>
          </section>`;
    }
    
    return slideContent;
  }).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${slideData.title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/black.min.css">
    <style>
        .reveal {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .reveal h1, .reveal h2, .reveal h3 {
            color: ${currentTheme.text};
            text-transform: none;
            line-height: 1.2;
        }
        .reveal .slides section {
            color: ${currentTheme.text};
        }
        .reveal .progress {
            color: ${currentTheme.accent};
        }
        .reveal .controls {
            color: ${currentTheme.accent};
        }
        section[data-background] h1,
        section[data-background] h2,
        section[data-background] h3,
        section[data-background] p {
            color: white;
        }
        .reveal ul {
            display: block;
            margin-left: 1em;
        }
        .reveal blockquote {
            width: 90%;
            margin: 2em auto;
            padding: 1em;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="reveal">
        <div class="slides">
            ${slideHTML}
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.min.js"></script>
    <script>
        Reveal.initialize({
            hash: true,
            controls: true,
            progress: true,
            center: true,
            transition: 'slide',
            backgroundTransition: 'fade',
            plugins: []
        });
    </script>
</body>
</html>`;
} 