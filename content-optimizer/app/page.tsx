"use client";

import { useState, useEffect, useRef } from "react";
import AnalysisResults from "./components/AnalysisResults";
import {
  apiService,
  type AnalysisResult,
  type ScrapedData,
} from "./services/api";
import Navbar from "./components/Navbar";
import ApiKeySidebar from "./components/ApiKeySidebar";
import BgGradient from "./components/BgGradient";
import Header from "./components/Header";
import SubHeader from "./components/SubHeader";
import IntegrationDetailsGroup from "./components/IntegrationDetailsGroup";
import Button from "./components/Button";
import MainForm from "./components/MainForm";

export default function Home() {
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const outputSectionRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const loadingInterval = useRef<NodeJS.Timeout | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApiKeySet = (firecrawlKey: string) => {
    console.log("API Key set:", firecrawlKey.substring(0, 5) + "...");
    setApiKeysConfigured(true);
  };

  // Track URL input changes
  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    // Clear error message when user changes the URL
    if (errorMessage) setErrorMessage(null);
  };

  const startLoadingAnimation = () => {
    setLoadingProgress(0);

    loadingInterval.current = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev < 20) return prev + 1.5;
        if (prev < 45) return prev + 1.0;
        if (prev < 70) return prev + 0.6;
        if (prev < 85) return prev + 0.3;
        // Slow down at the end to create anticipation
        return prev < 92 ? prev + 0.1 : 92;
      });
    }, 50);
  };

  const stopLoadingAnimation = () => {
    if (loadingInterval.current) {
      clearInterval(loadingInterval.current);
      loadingInterval.current = null;
    }
    setLoadingProgress(93);
    setTimeout(() => setLoadingProgress(96), 100);
    setTimeout(() => setLoadingProgress(98), 200);
    setTimeout(() => setLoadingProgress(100), 300);
  };

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (loadingInterval.current) {
        clearInterval(loadingInterval.current);
      }
    };
  }, []);

  // Analyze the website content when form is submitted
  const handleFormSubmit = async () => {
    if (!urlInput.trim() || !apiKeysConfigured) return;

    // Clear any previous error
    setErrorMessage(null);
    setIsAnalyzing(true);
    startLoadingAnimation();

    try {
      // Fetch website data
      const websiteData = await apiService.scrapeWebsite(urlInput);
      setScrapedData(websiteData);

      // Analyze the website for CRO
      const result = await apiService.analyzeCRO(websiteData);
      setAnalysisResult(result);

      // Show analysis results
      setShowOutput(true);

      // Complete loading animation
      stopLoadingAnimation();

      // More reliable scrolling approach
      setTimeout(() => {
        const resultsSection = document.getElementById("results-section");
        if (resultsSection) {
          // Use window.scrollTo for better browser support
          window.scrollTo({
            top: resultsSection.offsetTop - 20, // Small offset to avoid being right at the edge
            behavior: "smooth",
          });
        }
      }, 300);
    } catch (error) {
      // Use console.debug for technical logs that won't alarm users
      console.debug("[Developer] Website analysis error:", error);

      // Handle specific error types with friendly messages
      let message = "Failed to analyze the website. Please try again.";

      // Handle empty error objects (common with some Firecrawl errors)
      if (
        !error ||
        (error instanceof Object && Object.keys(error).length === 0)
      ) {
        message =
          "This website may be blocking access. Please try a different website.";
      } else if (error instanceof Error) {
        // Check error name first for more specific errors we've classified
        if (
          error.name === "WebsiteAccessDeniedError" ||
          error.name === "FirecrawlAccessError"
        ) {
          message =
            error.message ||
            "This website blocks web scraping. Please try a different site.";
        } else {
          const errorString = error.toString().toLowerCase();

          if (
            errorString.includes("status code 400") ||
            errorString.includes("request failed with status code 400") ||
            errorString.includes("permission") ||
            errorString.includes("403") ||
            errorString.includes("forbidden") ||
            errorString.includes("blocked") ||
            errorString.includes("robots.txt") ||
            errorString.includes("access denied")
          ) {
            message =
              "This website doesn't allow scraping. Try another site that permits crawlers or doesn't have strict robot restrictions.";
          } else if (
            errorString.includes("invalid url") ||
            errorString.includes("unable to resolve") ||
            errorString.includes("fetch failed") ||
            errorString.includes("cannot access") ||
            errorString.includes("network error")
          ) {
            message =
              "We couldn't access that URL. Please check the website address and try again.";
          } else if (errorString.includes("timeout")) {
            message =
              "The website took too long to respond. Please try again or try a different URL.";
          } else if (
            errorString.includes("captcha") ||
            errorString.includes("cloudflare")
          ) {
            message =
              "This site uses security measures that prevent automated access. Please try a different website.";
          }
        }
      }

      // Set error message state to display in the UI
      setErrorMessage(message);
      setShowOutput(false);
      stopLoadingAnimation();
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className='min-h-screen flex flex-col'>
      <Navbar appName='Content Optimizer' appNameColor='black' />
      <ApiKeySidebar
        onApiKeySet={handleApiKeySet}
        apiKeysConfigured={apiKeysConfigured}
      />
      <main className='flex-1'>
        <BgGradient>
          <div className='min-h-screen flex flex-col'>
            <div className='flex-1'>
              <Header content='Content Optimizer' />
              <SubHeader content='Optimize your hero, headlines, and CTAs with content from the best sites.' />
              <IntegrationDetailsGroup items={["🔥 Firecrawl", "Claude 3.7"]} />

              <MainForm
                areApiKeysSet={apiKeysConfigured}
                onUrlChange={handleUrlChange}
                onFormSubmit={handleFormSubmit}
                customButton={
                  <Button
                    type='submit'
                    size='lg'
                    variant='primary'
                    buttonContent={
                      isAnalyzing
                        ? "Analyzing..."
                        : apiKeysConfigured
                        ? "Analyze Website"
                        : "Please Configure Your API Keys"
                    }
                    fullWidth
                    className='h-16 text-lg'
                    disabled={
                      !apiKeysConfigured || !urlInput.trim() || isAnalyzing
                    }
                  />
                }
                outputSectionRef={outputSectionRef}
              />

              {/* Error Message */}
              {errorMessage && (
                <div className='max-w-xl mx-auto mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 shadow-sm animate-fade-in'>
                  <div className='flex items-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='18'
                      height='18'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='mr-2 flex-shrink-0'>
                      <circle cx='12' cy='12' r='10'></circle>
                      <line x1='12' y1='8' x2='12' y2='12'></line>
                      <line x1='12' y1='16' x2='12.01' y2='16'></line>
                    </svg>
                    <span className='font-medium'>{errorMessage}</span>
                  </div>

                  {/* Suggestions for alternative URLs when scraping is blocked */}
                  {errorMessage.includes("doesn't allow scraping") ||
                  errorMessage.includes("blocks web scraping") ||
                  errorMessage.includes("restricted access") ||
                  errorMessage.includes("security measures") ||
                  errorMessage.includes("blocking access") ? (
                    <div className='mt-3 text-sm border-t border-red-200 pt-3'>
                      <p className='font-medium mb-2'>
                        Try these websites instead:
                      </p>
                      <ul className='grid grid-cols-2 gap-2'>
                        <li>
                          <button
                            onClick={() => {
                              setUrlInput("https://firecrawl.dev");
                              setErrorMessage(null);
                            }}
                            className='text-left text-blue-600 hover:underline'>
                            firecrawl.dev
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => {
                              setUrlInput("https://example.com");
                              setErrorMessage(null);
                            }}
                            className='text-left text-blue-600 hover:underline'>
                            example.com
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => {
                              setUrlInput("https://hubspot.com");
                              setErrorMessage(null);
                            }}
                            className='text-left text-blue-600 hover:underline'>
                            hubspot.com
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => {
                              setUrlInput("https://vercel.com");
                              setErrorMessage(null);
                            }}
                            className='text-left text-blue-600 hover:underline'>
                            vercel.com
                          </button>
                        </li>
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Loading Progress Bar */}
              {isAnalyzing && (
                <div className='max-w-xl mx-auto mt-8 mb-8'>
                  <div className='w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner relative'>
                    {/* Main progress fill */}
                    <div
                      className='h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300 ease-out origin-left shadow-lg relative'
                      style={{
                        width: `${loadingProgress}%`,
                        transition: "width 0.4s cubic-bezier(0.3, 0.1, 0.3, 1)",
                      }}>
                      {/* Subtle pulse animation within the progress bar */}
                      <div className='h-full w-full bg-white/20 animate-pulse-subtle'></div>

                      {/* Shine effect that moves across the progress bar */}
                      <div className='absolute top-0 left-0 h-full w-full overflow-hidden'>
                        <div className='h-full w-1/3 absolute top-0 left-0 animate-shine'></div>
                      </div>
                    </div>

                    {/* Small dot at the edge of progress for additional visual feedback */}
                    {loadingProgress < 100 && (
                      <div
                        className='absolute h-4 w-4 bg-orange-500 rounded-full shadow-lg top-1/2 -translate-y-1/2'
                        style={{
                          left: `calc(${loadingProgress}% - 6px)`,
                          transition:
                            "left 0.4s cubic-bezier(0.3, 0.1, 0.3, 1)",
                        }}>
                        <div className='absolute inset-0 bg-orange-500 rounded-full animate-pulse-slow opacity-50'></div>
                      </div>
                    )}
                  </div>
                  <div className='text-center mt-3 text-sm text-gray-600 dark:text-gray-400 font-medium'>
                    {loadingProgress < 100
                      ? "Analyzing website content..."
                      : "Analysis complete!"}
                  </div>
                </div>
              )}

              {/* Analysis Results Section */}
              {showOutput && scrapedData && analysisResult && (
                <div
                  id='results-section'
                  ref={outputSectionRef}
                  className='pt-4'>
                  <AnalysisResults
                    result={analysisResult}
                    scrapedData={scrapedData}
                    isVisible={showOutput}
                  />
                </div>
              )}
            </div>
          </div>
        </BgGradient>
      </main>
    </div>
  );
}
