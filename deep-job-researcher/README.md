This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Inter, a custom font.

## Environment Variables

This application requires the following environment variables:

```
# API Keys (DO NOT commit actual keys to version control)
OPENAI_API_KEY=your_openai_api_key_here

# Environment
NODE_ENV=development

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production deployment, create a `.env.production` file with the appropriate values.

## Deployment

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket)
2. Import your project to Vercel
3. Vercel will detect Next.js automatically and use optimal build settings
4. Set up environment variables in the Vercel dashboard
5. Your app will be deployed to a production URL

### Deploy on Netlify

To deploy on Netlify:

1. Push your code to a Git repository
2. Log in to Netlify and click "New site from Git"
3. Select your repository
4. Netlify will detect Next.js and use the settings from your `netlify.toml` file
5. Configure environment variables in the Netlify dashboard
6. Deploy your site

### CI/CD with GitHub Actions

This project includes GitHub Actions workflows in the `.github/workflows` directory:

1. The workflow runs on push to main and on pull requests
2. It lints and builds the application
3. On merge to main, it automatically deploys to Vercel
4. To enable automatic deployment:
   - Generate a Vercel token in your Vercel account settings
   - Add it as a GitHub secret named `VERCEL_TOKEN`

## Security Headers

Both Vercel and Netlify configurations include security headers:

- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
