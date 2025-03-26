"use client";

import { useState, useEffect } from "react";
import Hero from "./components/Hero";
import Sidebar from "./components/Sidebar";
import AnalysisResults from "./components/AnalysisResults";
import AnimatedSection from "./components/AnimatedSection";
import apiService, { AnalysisResult, ScrapedData } from "./services/api";

// Add client-side environment variable access
const initializeEnv = () => {
  if (typeof window !== "undefined") {
    window.ENV = {
      FIRECRAWL_API_KEY: process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY,
      ANTHROPIC_API_KEY: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    };
  }
};

export default function Home() {
  const [areApiKeysSet, setAreApiKeysSet] = useState(false);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [showKeyboardTip, setShowKeyboardTip] = useState(false);

  // Initialize environment variables
  useEffect(() => {
    initializeEnv();
    // Check if API keys are already set
    setAreApiKeysSet(apiService.hasRequiredApiKeys());

    // Show keyboard tip after a short delay
    const timer = setTimeout(() => {
      if (!areApiKeysSet) {
        setShowKeyboardTip(true);
      }
    }, 3000);

    // Listen for keyboard "s" key to toggle the sidebar
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s" && e.altKey) {
        const toggleButton = document.getElementById("toggle-sidebar-button");
        if (toggleButton) toggleButton.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [areApiKeysSet]);

  const handleApiKeySet = (firecrawlKey: string) => {
    // Need to also check Anthropic API key from env
    const apiKeysConfigured = !!firecrawlKey && apiService.hasAnthropicApiKey();
    setAreApiKeysSet(apiKeysConfigured);
    setShowKeyboardTip(false);
  };

  const handleAnalyze = async (url: string) => {
    setIsAnalyzing(true);
    setIsAnalysisComplete(false);

    try {
      // Step 1: Scrape the website using Firecrawl
      const data = await apiService.scrapeWebsite(url);
      setScrapedData(data);

      // Step 2: Analyze the scraped content with Anthropic
      const result = await apiService.analyzeCRO(data);
      setAnalysisResult(result);

      // Step 3: Show the results
      setIsAnalysisComplete(true);

      // Scroll to results after a brief delay
      setTimeout(() => {
        document.getElementById("results-section")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 500);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(
        "Failed to analyze the website. Please check the API keys and URL and try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className='flex flex-col min-h-screen bg-gradient-to-b from-white to-orange-50 dark:from-gray-900 dark:to-gray-800'>
      {/* Hero section with integrated form */}
      <Hero onAnalyze={handleAnalyze} areApiKeysSet={areApiKeysSet} />

      {/* API Key Settings Sidebar */}
      <Sidebar
        onApiKeySet={handleApiKeySet}
        apiKeysConfigured={areApiKeysSet}
      />

      {/* Keyboard shortcut tooltip */}
      {showKeyboardTip && (
        <div className='fixed bottom-20 right-4 bg-gray-800 text-white text-xs p-3 rounded-lg shadow-lg z-20 max-w-[200px] animate-fade-in'>
          <p>
            Press <kbd className='px-2 py-1 bg-gray-700 rounded'>Alt+S</kbd> to
            open API settings
          </p>
          <div className='absolute -bottom-2 right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-800'></div>
        </div>
      )}

      {/* Analysis results */}
      {isAnalysisComplete && analysisResult && scrapedData ? (
        <div id='results-section' className='py-12 px-4'>
          <div className='container mx-auto'>
            <AnimatedSection delay={0.2}>
              <AnalysisResults
                result={analysisResult}
                scrapedData={scrapedData}
                isVisible={isAnalysisComplete}
              />
            </AnimatedSection>
          </div>
        </div>
      ) : (
        /* Loading indicator */
        isAnalyzing && (
          <div className='flex justify-center py-12'>
            <div className='flex flex-col items-center'>
              <div className='w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin'></div>
              <p className='mt-4 text-gray-600'>Analyzing website...</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
