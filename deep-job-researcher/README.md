# Deep Job Researcher

A Next.js application that helps job seekers find relevant positions by analyzing their resume or portfolio. Powered by [Firecrawl](https://firecrawl.dev) for intelligent web crawling and OpenAI for resume analysis.

## Features

- **Resume Analysis**: Upload your PDF resume for AI-powered skill and experience extraction
- **Job Matching**: Automatically find job listings that match your skills and experience
- **Advanced Filtering**: Filter jobs by work type, location, salary range, and experience level
- **Match Scoring**: See how well each job matches your profile with detailed explanations

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Environment Variables

This application requires the following environment variables:

```
# API Keys 
OPENAI_API_KEY=your_openai_api_key_here

# Environment
NODE_ENV=development


```

For production deployment, create a `.env.production` file with the appropriate values.

## Using Firecrawl API

This application uses the Firecrawl API for web crawling and data extraction. To use your own Firecrawl API key:

1. Sign up for an account at [Firecrawl](https://firecrawl.dev)
2. Obtain your API key from the dashboard
3. Enter your API key in the application's settings page
4. The application will use your key for all future requests

## OpenAI Integration

The application uses OpenAI's GPT models for:

1. Resume parsing and skill extraction
2. Job matching and relevance scoring
3. Generating job match explanations

You must provide a valid OpenAI API key in the environment variables for these features to work.

## How It Works

1. **Upload Resume**: The system extracts your skills, experience, and qualifications
2. **Search Jobs**: The application uses Firecrawl to search the web for relevant job listings
3. **Match Analysis**: OpenAI analyzes the job postings against your resume
4. **Results**: See a ranked list of matching jobs with detailed match explanations

## Deployment

### Deploy on Vercel

The easiest way to deploy this app is to use the [Vercel Platform](https://vercel.com/new):

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket)
2. Import your project to Vercel
3. Set up environment variables in the Vercel dashboard
4. Your app will be deployed to a production URL

### Security Considerations

- Never commit API keys to your repository
- Set up proper CORS policies in production
- Consider rate limiting for API endpoints
- Ensure PDF processing is done securely

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firecrawl Documentation](https://firecrawl.dev/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
