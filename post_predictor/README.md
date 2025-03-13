# Post Predictor 🔥

An AI-powered tool that predicts the performance of your Twitter/X posts before you publish them.

## Overview

Post Predictor uses advanced AI to analyze your draft tweets and predict their potential performance. Get insights on virality, trending potential, and expected engagement before you post.

## Features

- **Virality Score**: Measure how likely your post is to go viral (0-100)
- **Trending Potential**: Assess if your post aligns with current trends (0-100)
- **Content Quality**: Evaluate the overall quality of your content (0-100)
- **Engagement Forecast**: View a 24-hour prediction of expected likes
- **AI Analysis**: Receive personalized feedback and suggestions to improve your post
- **Trend Integration**: Optional Firecrawl API integration for enhanced trend analysis

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- OpenAI API key
- Supabase account and credentials
- (Optional) Firecrawl API key for enhanced trend analysis

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/postPredictor.git
   cd postPredictor
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file with the following variables:

   ```
   OPENAI_API_KEY=your_openai_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

4. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter your draft tweet in the text area
2. (Optional) Add your Firecrawl API key for enhanced trend analysis
3. Click "Predict" to analyze your tweet
4. Review the scores, analysis, and engagement forecast
5. Make adjustments based on the AI suggestions
6. Post with confidence!

## How It Works

Post Predictor uses a combination of:

- GPT-4o for content analysis and scoring
- Historical engagement data from Supabase
- Real-time trend analysis (with Firecrawl integration)
- Engagement pattern modeling for like prediction

The system evaluates your content against current trends and successful post patterns to generate accurate predictions.

## Technologies

- Next.js
- React
- TypeScript
- OpenAI API
- Supabase
- Chart.js
- Firecrawl API (optional)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


---

Built with ❤️ by Firecrawl
