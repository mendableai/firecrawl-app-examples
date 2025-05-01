import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Deep Research Job Matcher",
  description:
    "Deep Job Researcher helps you find perfect job matches based on your professional profile using AI-powered deep research.",
  keywords: [
    "job matching",
    "career research",
    "AI job search",
    "firecrawl",
    "job researcher",
    "resume analyzer",
  ],
  authors: [{ name: "Firecrawl" }],
  creator: "Firecrawl",
  publisher: "Firecrawl",
  applicationName: "Deep Job Researcher",
  metadataBase: new URL("https://your-production-domain.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Deep Research Job Matcher",
    description: "Find your perfect job match with AI-powered deep research",
    url: "https://your-production-domain.com",
    siteName: "Deep Job Researcher",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg", // Create this image in your public folder
        width: 1200,
        height: 630,
        alt: "Deep Job Researcher Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deep Research Job Matcher",
    description: "Find your perfect job match with AI-powered deep research",
    images: ["/twitter-image.jpg"], // Create this image in your public folder
  },
  verification: {
    // Add verification tokens for search engines
    google: "google-site-verification-token",
    // yandex: "yandex-verification-token",
    // bing: "bing-verification-token",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <link rel='icon' href='/favicon.ico' sizes='any' />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Deep Research Job Matcher",
              description:
                "Find your perfect job match with AI-powered deep research",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Organization",
                name: "Firecrawl",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
