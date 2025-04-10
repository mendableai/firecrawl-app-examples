# URL to Podcast Converter

This Next.js application converts web content from URLs into engaging podcasts using AI. It extracts content from websites using Firecrawl, transforms it into a conversational podcast script with Anthropic's Claude, and converts the script to audio using ElevenLabs.

## Features

- 🌐 Extract content from any URL or multiple URLs
- 📝 Generate engaging podcast scripts from web content
- 🎙️ Convert scripts to natural-sounding audio using text-to-speech
- 🎨 Beautiful UI with smooth animations and progress tracking
- 🔄 Real-time status updates and error handling

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Firecrawl](https://firecrawl.dev/) - Web content extraction
- [Anthropic Claude](https://www.anthropic.com/) - AI script generation
- [ElevenLabs](https://elevenlabs.io/) - Text-to-speech conversion

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- API keys for:
  - Firecrawl
  - Anthropic
  - ElevenLabs

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/url-podcast-converter.git
   cd url-podcast-converter
   ```

2. Install dependencies

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```
   FIRECRAWL_API_KEY=your_firecrawl_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

4. Run the development server

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. **URL Input**: Enter one or more URLs to extract content from
2. **Content Extraction**: The app uses Firecrawl to extract meaningful content from the URLs
3. **Script Generation**: Anthropic's Claude AI creates a conversational podcast script
4. **Audio Generation**: ElevenLabs converts the script to natural-sounding audio
5. **Playback**: Listen to your generated podcast and download the audio

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── extract/         # Firecrawl content extraction API
│   │   ├── generate-script/ # Anthropic script generation API
│   │   └── generate-audio/  # ElevenLabs audio generation API
│   ├── components/
│   │   ├── UrlInput.tsx     # URL input form component
│   │   ├── ProgressBar.tsx  # Process progress tracking
│   │   └── PodcastPlayer.tsx # Audio player component
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # App layout
│   └── page.tsx             # Main application page
├── public/                  # Static assets
├── .env.example             # Example environment variables
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies and scripts
└── README.md                # Project documentation
```

## Environment Variables

- `FIRECRAWL_API_KEY`: API key for Firecrawl (get from [firecrawl.dev](https://firecrawl.dev))
- `ANTHROPIC_API_KEY`: API key for Anthropic Claude (get from [Anthropic Console](https://console.anthropic.com/))
- `ELEVENLABS_API_KEY`: API key for ElevenLabs (get from [ElevenLabs](https://elevenlabs.io/))

## Limitations

- Audio segments are currently not stitched together automatically
- There are rate limits on the API services based on your subscription tier
- Long articles may be truncated based on token limits

## Future Improvements

- Server-side audio stitching for seamless podcasts
- Multiple voice options
- Background music and sound effects
- Transcript generation and download options
- User accounts to save generated podcasts

## License

MIT

## Acknowledgements

- [Firecrawl](https://firecrawl.dev/) for web extraction capabilities
- [Anthropic](https://www.anthropic.com/) for AI script generation
- [ElevenLabs](https://elevenlabs.io/) for voice synthesis technology
