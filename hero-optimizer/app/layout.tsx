import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Key } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hero Optimizer| Improve Your Hero Section",
  description:
    "Analyze your website's hero section and get actionable insights based on top CRO practices",
  keywords:
    "Hero,SaaS, CRO, Conversion Rate Optimization, Hero Section, Web Analysis",
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
          <header className='bg-[var(--tertiary)] border-b border-gray-200 py-3'>
            <div className='container mx-auto px-4 flex justify-between items-center'>
              <h1 className='text-xl font-bold text-[var(--primary)]'>
                SaaS CRO Analyzer
              </h1>
              <nav>
                <a
                  href='https://firecrawl.dev'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-[var(--foreground)] hover:text-[var(--primary)] transition-colors flex items-center gap-2'>
                  <Key size={16} className='text-orange-500' />
                  Get Your Firecrawl API Keys
                </a>
              </nav>
            </div>
          </header>
          <main className='flex-grow'>{children}</main>
          <footer className='bg-[var(--tertiary)] py-3'>
            <div className='container mx-auto px-4 text-center'>
              {/* Empty footer */}
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
