"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import UrlInput from "./components/UrlInput";
import ProgressBar from "./components/ProgressBar";
import PodcastPlayer from "./components/PodcastPlayer";
import AnimatedSection from "./components/AnimatedSection";
import Sidebar from "./components/Sidebar";
import { FiRotateCcw } from "react-icons/fi";

export default function Home() {
  const [urls, setUrls] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedContent, setExtractedContent] = useState(null);
  const [podcastScript, setPodcastScript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");
  const [firecrawlApiKey, setFirecrawlApiKey] = useState<string | null>(null);

  // Load API key from localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem("firecrawl_api_key");
    if (storedApiKey) {
      setFirecrawlApiKey(storedApiKey);
    }
  }, []);

  const steps = [
    "URL Input",
    "Extract Content",
    "Generate Script",
    "Create Podcast",
  ];

  const handleApiKeySet = (key: string) => {
    setFirecrawlApiKey(key);
  };

  const handleSubmit = async (submittedUrls: string[]) => {
    if (!firecrawlApiKey) {
      toast.error("Please enter your Firecrawl API key first");
      return;
    }

    setUrls(submittedUrls);
    setIsProcessing(true);
    setCurrentStep(1);
    setError("");

    try {
      // Step 1: Extract content from URLs
      const loadingToast = toast.loading("Extracting content from URLs...");

      const extractResponse = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Firecrawl-API-Key": firecrawlApiKey,
        },
        body: JSON.stringify({ urls: submittedUrls }),
      });

      const extractData = await extractResponse.json();

      if (!extractResponse.ok) {
        if (extractResponse.status === 429) {
          toast.dismiss(loadingToast);
          toast.error("Rate limit exceeded. Please try again in a minute.");
          throw new Error("Rate limit exceeded");
        } else {
          throw new Error(extractData.error || "Failed to extract content");
        }
      }

      toast.dismiss(loadingToast);
      toast.success("Content extracted successfully!");
      setExtractedContent(extractData.data);
      setCurrentStep(2);

      // Step 2: Generate podcast script
      const scriptToast = toast.loading("Generating podcast script...");

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

      const scriptData = await scriptResponse.json();

      if (!scriptResponse.ok) {
        if (scriptResponse.status === 429) {
          toast.dismiss(scriptToast);
          toast.error("Rate limit exceeded. Please try again in a minute.");
          throw new Error("Rate limit exceeded");
        } else {
          throw new Error(scriptData.error || "Failed to generate script");
        }
      }

      toast.dismiss(scriptToast);
      toast.success("Podcast script generated!");
      setPodcastScript(scriptData.script);
      setCurrentStep(3);

      // Step 3: Generate audio
      const audioToast = toast.loading("Creating podcast audio with Firo...");

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

      const audioData = await audioResponse.json();

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
    <div className='min-h-screen py-8 px-4'>
      <Toaster position='top-center' />

      {/* Sidebar for API key configuration */}
      <Sidebar apiKey={firecrawlApiKey} onApiKeySet={handleApiKeySet} />

      <AnimatedSection className='text-center mb-12' delay={0.1}>
        <h1 className='text-5xl font-extrabold orange-gradient-text mb-2'>
          URL to Podcast Converter
        </h1>
        <p className='text-gray-600 max-w-lg mx-auto'>
          Transform any webpage content into an engaging podcast with just a few
          clicks!
        </p>
        <div className='flex flex-wrap justify-center gap-4 mb-10 mt-6'>
          <span className='inline-flex items-center text-sm font-medium px-4 py-2 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'>
            <span className='w-2 h-2 rounded-full bg-orange-500 mr-2'></span>
            Powered by Anthropic Claude 3.7
          </span>
          <span className='inline-flex items-center text-sm font-medium px-4 py-2 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'>
            <span className='w-2 h-2 rounded-full bg-orange-500 mr-2'></span>
            Firecrawl Integration
          </span>
        </div>
      </AnimatedSection>

      {/* API Key notification when not set */}
      {!firecrawlApiKey && (
        <AnimatedSection
          className='mb-8 p-4 bg-orange-50 border border-orange-100 rounded-lg max-w-3xl mx-auto flex items-center justify-center'
          delay={0.2}>
          <p className='text-[var(--primary-dark)]'>
            Please configure your API key in settings to get started
          </p>
        </AnimatedSection>
      )}

      {/* Progress Bar (show only when process started) */}
      {currentStep > 0 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}>
            <ProgressBar
              steps={steps}
              currentStep={currentStep - 1}
              isProcessing={isProcessing}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Main Content */}
      <AnimatePresence mode='wait'>
        {currentStep === 0 ? (
          <motion.div
            key='urlInput'
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}>
            <UrlInput onSubmit={handleSubmit} isProcessing={isProcessing} />
          </motion.div>
        ) : currentStep === 4 ? (
          <motion.div
            key='podcastPlayer'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}>
            {audioUrl && (
              <>
                <PodcastPlayer
                  audioUrl={audioUrl}
                  title={
                    urls.length > 1
                      ? `Combined Podcast from Multiple Sources`
                      : `Podcast from ${urls[0]}`
                  }
                  sourceUrls={urls}
                />
                {podcastScript && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className='mt-8 p-6 bg-white rounded-lg shadow-md max-w-3xl mx-auto'>
                    <h3 className='text-xl font-semibold mb-4'>
                      Podcast Script
                    </h3>
                    <div className='prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap'>
                      {podcastScript}
                    </div>
                  </motion.div>
                )}
                <div className='flex justify-center mt-8'>
                  <motion.button
                    onClick={resetProcess}
                    className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}>
                    <FiRotateCcw />
                    Convert Another URL
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key='processing'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='card p-8 max-w-3xl mx-auto text-center'>
            <div className='mb-6'>
              <div className='animate-pulse-slow'>
                <div className='w-16 h-16 bg-[var(--primary-light)] rounded-full mx-auto flex items-center justify-center'>
                  <div className='w-10 h-10 bg-[var(--primary)] rounded-full animate-ping'></div>
                </div>
              </div>
              <h3 className='text-2xl font-bold mt-4 orange-gradient-text'>
                {currentStep === 1
                  ? "Extracting Content..."
                  : currentStep === 2
                  ? "Generating Podcast Script..."
                  : "Creating Audio..."}
              </h3>
              <p className='text-gray-500 mt-2'>
                This may take a moment, please wait...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mt-8 p-4 bg-red-50 border border-red-200 rounded-lg max-w-3xl mx-auto'>
          <h3 className='text-red-700 font-medium'>Error</h3>
          <p className='text-red-600'>{error}</p>
          <button
            onClick={resetProcess}
            className='mt-2 text-red-700 underline'>
            Reset and try again
          </button>
        </motion.div>
      )}
    </div>
  );
}
