"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import UrlInput from "./components/MainForm";
import ProgressBar from "./components/ProgressBar";
import PodcastPlayer from "./components/PodcastPlayer";
import Navbar from "./components/Navbar";
import { FiRotateCcw } from "react-icons/fi";
import ApiKeySidebar from "./components/ApiKeySidebar";
import BgGradient from "./components/BgGradient";
import MainForm from "./components/MainForm";
import Button from "./components/Button";
import Header from "./components/Header";
import SubHeader from "./components/SubHeader";
import IntegrationDetailsGroup from "./components/IntegrationDetailsGroup";
import OutputSection from "./components/OutputSection";

export default function Home() {
  const [urls, setUrls] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedContent, setExtractedContent] = useState(null);
  const [podcastScript, setPodcastScript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");
  const [firecrawlApiKey, setFirecrawlApiKey] = useState<string | null>(null);
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const outputSectionRef = useRef<HTMLDivElement>(null);
  const handleUrlChange = (url: string) => {
    setUrlInput(url);
  };

  // const handleFormSubmit = () => {
  //   console.log("Form submitted with URL:", urlInput);
  //   if (urlInput.trim()) {
  //     setShowOutput(true);
  //   }
  // };

  const handleApiKeySet = (firecrawlKey: string) => {
    console.log("API Key set:", firecrawlKey.substring(0, 5) + "...");
    setApiKeysConfigured(true);
    setFirecrawlApiKey(firecrawlKey);
  };

  const steps = [
    "URL Input",
    "Extract Content",
    "Generate Script",
    "Create Podcast",
  ];

  const handleFormSubmit = async (submittedUrls: string[]) => {
    if (!firecrawlApiKey) {
      toast.error("Please enter your Firecrawl API key first");
      return;
    }

    setUrls(submittedUrls);
    setIsProcessing(true);
    setCurrentStep(1);
    setError("");

    // Define toast references outside try block so they can be accessed in catch
    let loadingToast: string | null = null;
    let scriptToast: string | null = null;
    let audioToast: string | null = null;

    try {
      // Step 1: Extract content from URLs
      loadingToast = toast.loading("Extracting content from URLs...");

      const extractResponse = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Firecrawl-API-Key": firecrawlApiKey,
        },
        body: JSON.stringify({ urls: submittedUrls }),
      });

      // Get response text first, then try to parse as JSON
      const responseText = await extractResponse.text();
      let extractData;

      try {
        extractData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("Error parsing JSON:", responseText);
        toast.dismiss(loadingToast);
        toast.error("Server returned an invalid response. Please try again.");
        throw new Error(
          "Failed to parse server response. The server may be experiencing issues with multiple URLs.",
        );
      }

      if (!extractResponse.ok) {
        toast.dismiss(loadingToast);

        if (extractResponse.status === 429) {
          toast.error("Rate limit exceeded. Please try again in a minute.");
          throw new Error("Rate limit exceeded");
        } else if (extractResponse.status === 403) {
          toast.error(
            "Access to this URL is forbidden. The website may block content extraction.",
          );
          throw new Error(
            "URL access forbidden: Content extraction not allowed by the website",
          );
        } else if (extractResponse.status === 404) {
          toast.error(
            "The URL content could not be found. Please check if the URL is correct.",
          );
          throw new Error("URL content not found");
        } else if (extractResponse.status === 400) {
          toast.error(
            "Invalid URL or extraction request. " + (extractData.error || ""),
          );
          throw new Error(
            extractData.error || "Invalid URL or extraction request",
          );
        } else if (extractResponse.status === 401) {
          toast.error(
            "Invalid or expired API key. Please update your Firecrawl API key.",
          );
          throw new Error("Authentication failed: Invalid API key");
        } else {
          toast.error(
            extractData.error || "Failed to extract content from URL",
          );
          throw new Error(extractData.error || "Failed to extract content");
        }
      }

      toast.dismiss(loadingToast);
      toast.success("Content extracted successfully!");
      setExtractedContent(extractData.data);
      setCurrentStep(2);

      // Step 2: Generate podcast script
      scriptToast = toast.loading("Generating podcast script...");

      // Similar JSON parsing protection for script generation
      const scriptResponse = await fetch("/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extractedContent: extractData.data,
          sourceUrls: submittedUrls,
        }),
      });

      const scriptResponseText = await scriptResponse.text();
      let scriptData;

      try {
        scriptData = JSON.parse(scriptResponseText);
      } catch (jsonError) {
        console.error("Error parsing script JSON:", scriptResponseText);
        toast.dismiss(scriptToast);
        toast.error(
          "Server returned an invalid response for script generation.",
        );
        throw new Error("Failed to parse script generation response.");
      }

      if (!scriptResponse.ok) {
        toast.dismiss(scriptToast);

        if (scriptResponse.status === 429) {
          toast.error("Rate limit exceeded. Please try again in a minute.");
          throw new Error("Rate limit exceeded");
        } else {
          toast.error(scriptData.error || "Failed to generate script");
          throw new Error(scriptData.error || "Failed to generate script");
        }
      }

      toast.dismiss(scriptToast);
      toast.success("Podcast script generated!");
      setPodcastScript(scriptData.script);
      setCurrentStep(3);

      // Step 3: Generate audio
      audioToast = toast.loading("Creating podcast audio with Firo...");

      // Truncate script if it's too long for the audio API (5000 char limit)
      const MAX_SCRIPT_LENGTH = 4800; // Setting slightly below 5000 to be safe
      let processedScript = scriptData.script;

      if (processedScript.length > MAX_SCRIPT_LENGTH) {
        // Find a good truncation point (end of a sentence)
        const truncationPoint = processedScript.lastIndexOf(
          ".",
          MAX_SCRIPT_LENGTH,
        );
        if (truncationPoint > 0) {
          processedScript = processedScript.substring(0, truncationPoint + 1);
          toast.custom(
            (t) => (
              <div className='bg-blue-50 border-l-4 border-blue-400 p-4'>
                <div className='flex'>
                  <div className='ml-3'>
                    <p className='text-sm text-blue-700'>
                      Script was truncated to fit audio generation limits.
                    </p>
                  </div>
                </div>
              </div>
            ),
            { duration: 4000 },
          );
        }
      }

      const audioResponse = await fetch("/api/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ script: processedScript }),
      });

      const audioResponseText = await audioResponse.text();
      let audioData;

      try {
        audioData = JSON.parse(audioResponseText);
      } catch (jsonError) {
        console.error("Error parsing audio JSON:", audioResponseText);
        toast.dismiss(audioToast);
        toast.error(
          "Server returned an invalid response for audio generation.",
        );
        throw new Error("Failed to parse audio generation response.");
      }

      if (!audioResponse.ok) {
        // If we have a 429 (rate limit) with partial audio segments
        if (
          audioResponse.status === 429 &&
          audioData.partialAudioSegments &&
          audioData.partialAudioSegments.length > 0
        ) {
          toast.dismiss(audioToast);
          toast.custom(
            (t) => (
              <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4'>
                <div className='flex'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='h-5 w-5 text-yellow-400'
                      viewBox='0 0 20 20'
                      fill='currentColor'>
                      <path
                        fillRule='evenodd'
                        d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm text-yellow-700'>
                      Rate limit reached. Using partial audio results.
                    </p>
                  </div>
                </div>
              </div>
            ),
            { duration: 4000 },
          );

          // Use the partial segments we received
          if (audioData.partialAudioSegments[0].audio) {
            const audioBlob = base64ToBlob(
              audioData.partialAudioSegments[0].audio,
              "audio/mpeg",
            );
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            setCurrentStep(4);
          } else {
            throw new Error("Partial audio data was invalid");
          }
        } else if (audioResponse.status === 429) {
          toast.dismiss(audioToast);
          toast.error("Rate limit exceeded. Please try again in a minute.");
          throw new Error("Rate limit exceeded");
        } else {
          throw new Error(audioData.error || "Failed to generate audio");
        }
      } else {
        toast.dismiss(audioToast);
        toast.success("Podcast created successfully!");

        // Create a data URL from the audio segments - now it's a single full audio file
        if (audioData.audioSegments && audioData.audioSegments.length > 0) {
          const audioBlob = base64ToBlob(
            audioData.audioSegments[0].audio,
            "audio/mpeg",
          );
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
        }

        setCurrentStep(4);
      }
    } catch (err: any) {
      console.error("Error in podcast generation:", err);

      // Dismiss any active toasts to prevent them from persisting
      if (loadingToast) toast.dismiss(loadingToast);
      if (scriptToast) toast.dismiss(scriptToast);
      if (audioToast) toast.dismiss(audioToast);

      setError(err.message || "An error occurred");
      toast.error(err.message || "Failed to create podcast");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcess = () => {
    setUrls([]);
    setCurrentStep(0);
    setExtractedContent(null);
    setPodcastScript("");
    setAudioUrl("");
    setError("");
  };

  // Helper function to convert base64 to Blob
  const base64ToBlob = (base64: string, type: string) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  };

  return (
    <>
      <Navbar appName='URL to Podcast' appNameColor='black' />
      <ApiKeySidebar
        onApiKeySet={handleApiKeySet}
        apiKeysConfigured={apiKeysConfigured}
      />
      <BgGradient>
        <div className='min-h-screen flex flex-col'>
          <div className='flex-1'>
            <Header content='URL to Podcast' />
            <SubHeader content='Convert any URL to a realistic podcast with Firecrawl!' />

            <IntegrationDetailsGroup
              items={["🔥 Firecrawl", "Claude 3.7", "ElevenLabs"]}
            />

            <MainForm
              areApiKeysSet={apiKeysConfigured}
              onUrlChange={handleUrlChange}
              onFormSubmit={(submittedUrls) => {
                if (submittedUrls && submittedUrls.length > 0) {
                  handleFormSubmit(submittedUrls);
                }
              }}
              customButton={
                <Button
                  type='submit'
                  size='lg'
                  variant='primary'
                  buttonContent={
                    !apiKeysConfigured
                      ? "Please Configure Your API Keys"
                      : isProcessing
                      ? "Generating Podcast..."
                      : "Generate Podcast"
                  }
                  fullWidth
                  className='h-16 text-lg'
                  disabled={
                    !apiKeysConfigured || !urlInput.trim() || isProcessing
                  }
                />
              }
              outputSectionRef={outputSectionRef}
            />

            {/* Output Section for Results */}
            {(isProcessing || currentStep > 0) && (
              <OutputSection
                ref={outputSectionRef}
                title={
                  currentStep === 4
                    ? "Your Podcast is Ready!"
                    : "Generating Podcast..."
                }>
                {/* Progress Bar */}
                {isProcessing && (
                  <div className='my-10 mx-auto max-w-xl'>
                    <ProgressBar
                      steps={steps}
                      currentStep={currentStep}
                      isProcessing={isProcessing}
                    />
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className='bg-red-50 border-l-4 border-red-500 p-4 mb-6'>
                    <div className='flex'>
                      <div className='ml-3'>
                        <p className='text-sm font-medium text-red-800 mb-1'>
                          Error:
                        </p>
                        <p className='text-sm text-red-700 mb-2'>{error}</p>

                        {/* Show tips based on error type */}
                        {error.includes("forbidden") && (
                          <div className='text-xs text-gray-700 mt-2'>
                            <p className='font-medium mb-1'>
                              Possible solutions:
                            </p>
                            <ul className='list-disc pl-4 space-y-1'>
                              <li>Try a different URL from the same website</li>
                              <li>
                                Some websites block automated content extraction
                              </li>
                              <li>
                                Consider using a public website or one that
                                allows content scraping
                              </li>
                            </ul>
                          </div>
                        )}

                        {error.includes("not found") && (
                          <div className='text-xs text-gray-700 mt-2'>
                            <p className='font-medium mb-1'>
                              Possible solutions:
                            </p>
                            <ul className='list-disc pl-4 space-y-1'>
                              <li>
                                Check if the URL is correct and accessible in a
                                browser
                              </li>
                              <li>
                                Ensure the page is publicly available (not
                                behind a login)
                              </li>
                              <li>
                                Try using the homepage URL instead of a deep
                                link
                              </li>
                            </ul>
                          </div>
                        )}

                        {error.includes("Invalid") && (
                          <div className='text-xs text-gray-700 mt-2'>
                            <p className='font-medium mb-1'>
                              Possible solutions:
                            </p>
                            <ul className='list-disc pl-4 space-y-1'>
                              <li>
                                Make sure the URL includes http:// or https://
                              </li>
                              <li>Check for typos in the domain name</li>
                              <li>
                                Try a different URL from a public, accessible
                                website
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Podcast Player */}
                {audioUrl && currentStep === 4 && (
                  <div className='mt-4'>
                    <PodcastPlayer
                      audioUrl={audioUrl}
                      title={
                        urls.length > 0
                          ? `Podcast from ${urls[0]}`
                          : "Generated Podcast"
                      }
                      sourceUrls={urls}
                    />

                    {/* Display the podcast script */}
                    {podcastScript && (
                      <div className='mt-8 mb-4'>
                        <h3 className='text-xl font-semibold mb-4'>
                          Podcast Script
                        </h3>
                        <div className='bg-white/70 backdrop-blur-sm rounded-xl p-4 text-gray-700 whitespace-pre-wrap text-left'>
                          {podcastScript}
                        </div>
                      </div>
                    )}

                    <div className='mt-6 text-center'>
                      <Button
                        variant='outline'
                        onClick={resetProcess}
                        className='flex items-center mx-auto'>
                        <FiRotateCcw className='mr-2' /> Generate Another
                        Podcast
                      </Button>
                    </div>
                  </div>
                )}
              </OutputSection>
            )}
          </div>
        </div>
      </BgGradient>
      <Toaster position='top-center' />
    </>
  );
}
