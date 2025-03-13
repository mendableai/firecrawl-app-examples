import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { useEffect, useState } from "react";
import Head from "next/head";

const meta = {
  title: "PostPredictor",
  description:
    "Welcome to PostPredictor, your AI-powered tool for predicting tweet performance! Get instant predictions on your tweet's potential virality, trendiness, and engagement based on content analysis and current news trends. Make your tweets count! 📈",
  cardImage: "/og.png",
  robots: "follow, index",
  favicon: "/favicon.ico",
  url: "https://www.postpredictor.ai/",
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: meta.title,
    description: meta.description,
    referrer: "origin-when-cross-origin",
    keywords: ["PostPredictor", "Tweet Analytics", "Social Media", "Twitter", "Viral Prediction"],
    authors: [
      { name: "PostPredictor", url: "https://www.postpredictor.ai/" },
    ],
    creator: "PostPredictor",
    publisher: "PostPredictor",
    robots: meta.robots,
    icons: { icon: meta.favicon },
    metadataBase: new URL(meta.url),
    openGraph: {
      url: meta.url,
      title: meta.title,
      description: meta.description,
      images: [meta.cardImage],
      type: "website",
      siteName: meta.title,
    },
    twitter: {
      card: "summary_large_image",
      site: "@Vercel",
      creator: "@Vercel",
      title: meta.title,
      description: meta.description,
      images: [meta.cardImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Helvetica, sans-serif' }}>{children}</body>
      <Analytics />
      <Toaster />
    </html>
  );
}
