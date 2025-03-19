# Hero Optimizer

A powerful web application that analyzes SaaS hero sections and provides actionable Conversion Rate Optimization (CRO) insights. This tool leverages Firecrawl for web scraping and Claude 3.7 for intelligent analysis.

## Features

- **Instant Hero Section Analysis**: Upload any URL and get immediate analysis of its hero section
- **AI-Powered Insights**: Leverages Claude 3.7 to compare against best CRO practices
- **Actionable Recommendations**: Receive specific suggestions to improve your conversion rates
- **Beautiful UI**: Sleek, orange-themed UI with smooth GSAP animations
- **Responsive Design**: Works on all devices
- **Secure API Key Management**: Firecrawl key can be entered in UI, Claude key requires environment variables

## Technology Stack

- **Next.js**: React framework for server-rendered applications
- **TypeScript**: For type-safe code
- **TailwindCSS**: For modern, utility-first styling
- **GSAP**: For smooth animations and transitions
- **Firecrawl API**: For web scraping functionality
- **Claude 3.7**: For AI-powered analysis

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- Firecrawl API key
- Claude API key (must be set in environment variables)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/hero-optimizer.git
   cd hero-optimizer
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   - Create a `.env.local` file in the root directory based on `.env.local.example`
   - Add your API keys:
     ```
     NEXT_PUBLIC_FIRECRAWL_API_KEY=your_firecrawl_api_key
     NEXT_PUBLIC_CLAUDE_API_KEY=your_claude_api_key
     ```
   - **Note**: The Claude API key must be set in environment variables for security reasons and cannot be entered through the UI

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter your Firecrawl API key in the provided form (or set it in `.env.local`)
2. Ensure your Claude API key is set in `.env.local`
3. Input the URL of the SaaS website you want to analyze
4. Review the comprehensive analysis report which includes:
   - Overall CRO score
   - Strengths of the current hero section
   - Areas for improvement
   - Specific recommendations
   - Extracted content analysis

## API Integration

### Firecrawl API

This tool uses the Firecrawl API to scrape and extract content from the hero section of SaaS websites. You'll need a valid Firecrawl API key, which you can obtain from [https://firecrawl.dev](https://firecrawl.dev). This can be entered in the UI or set in environment variables.

### Claude API

The analysis is powered by Claude 3.7, which provides AI-driven insights on CRO best practices. You'll need a Claude API key from Anthropic, which you can get at [https://console.anthropic.com](https://console.anthropic.com). **For security reasons, the Claude API key must be set in environment variables and cannot be entered through the UI.**

## License

MIT

## Acknowledgements

- [Firecrawl](https://firecrawl.dev) for providing the web scraping functionality
- [Claude](https://claude.ai) for the AI analysis capabilities
- [GSAP](https://greensock.com/gsap/) for powerful animations
- [Next.js](https://nextjs.org/) for the React framework
