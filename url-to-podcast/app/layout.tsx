import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Key, Headphones, Radio } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "URL to Podcast Converter",
  description: "Transform any web content into engaging podcasts with AI",
  keywords: [
    "podcast",
    "AI",
    "text-to-speech",
    "content converter",
    "URL",
    "audio",
  ],
  authors: [{ name: "URL Podcast Converter Team" }],
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f87621",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className='min-h-screen flex flex-col'>
          <header className='bg-white/80 backdrop-blur-md py-4 fixed top-0 left-0 right-0 w-full z-50 border-b border-[var(--card-border)]'>
            <div className='container mx-auto px-4 flex justify-between items-center'>
              <div className='flex items-center gap-2'>
                <h1 className='text-xl font-bold text-orange-500 flex items-center gap-2'>
                  <span>🔥 URL to Podcast</span>
                </h1>
              </div>
              <nav className='flex items-center'>
                <a
                  href='https://firecrawl.dev'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-[var(--foreground)] hover:text-[var(--primary)] transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-[var(--surface-hover)]'>
                  <Key size={16} className='text-[var(--primary)]' />
                  <span>Get Your Firecrawl API Key</span>
                </a>
              </nav>
            </div>
          </header>
          <main className='flex-grow py-8 pt-24 container mx-auto px-4'>
            {children}
          </main>
          <footer className='py-4 text-center text-sm text-gray-500 border-t border-[var(--card-border)]'>
            <div className='container mx-auto'>
              <p>Transform any web content into engaging podcasts with AI</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
