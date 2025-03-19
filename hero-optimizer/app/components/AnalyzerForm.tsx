import React, { useState } from "react";
import Button from "./Button";
import Input from "./Input";
import Card from "./Card";
import AnimatedSection from "./AnimatedSection";
import apiService from "../services/api";
import { Settings, Globe } from "lucide-react";

interface AnalyzerFormProps {
  onAnalyze: (url: string) => Promise<void>;
  areApiKeysSet: boolean;
  transparent?: boolean;
}

const AnalyzerForm: React.FC<AnalyzerFormProps> = ({
  onAnalyze,
  areApiKeysSet,
  transparent = false,
}) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validateAndFormatUrl = (
    input: string,
  ): { isValid: boolean; formattedUrl: string } => {
    // Trim whitespace
    let formattedUrl = input.trim();

    // Check if URL has a protocol, if not add https://
    if (!/^(?:f|ht)tps?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Now validate the URL
    try {
      new URL(formattedUrl);
      return { isValid: true, formattedUrl };
    } catch (e) {
      return { isValid: false, formattedUrl };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error state
    setError("");

    // Validate URL
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    const { isValid, formattedUrl } = validateAndFormatUrl(url);

    if (!isValid) {
      setError("Please enter a valid URL");
      return;
    }

    // Update the input field with the formatted URL (with protocol)
    setUrl(formattedUrl);

    setIsLoading(true);

    try {
      await onAnalyze(formattedUrl);
    } catch (err) {
      setError("Failed to analyze the website. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedSection delay={0.3} className='w-full max-w-xl mx-auto'>
      <Card
        title={transparent ? "" : "Analyze Your SaaS Website"}
        subtitle={
          transparent
            ? ""
            : "Enter the URL of your SaaS website to get AI-powered CRO insights"
        }
        className={`${
          transparent
            ? "bg-white/60 backdrop-blur-md dark:bg-gray-800/60 border-white/30 shadow-xl"
            : "shadow-lg border border-orange-100"
        }`}>
        <form
          onSubmit={handleSubmit}
          className={`${transparent ? "py-4" : ""} space-y-5`}>
          <div className='relative'>
            <Input
              label={transparent ? "Enter Website URL" : "Website URL"}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder='firecrawl.dev or https://firecrawl.dev'
              fullWidth
              required
              error={!!error}
              helperText={
                error || "We'll analyze the hero section of this website"
              }
              icon={<Globe size={20} className='text-orange-500' />}
              className={`pr-12 text-lg py-3 h-14 ${
                transparent ? "bg-white/80 dark:bg-gray-700/70" : ""
              }`}
            />
          </div>

          <Button
            type='submit'
            isLoading={isLoading}
            fullWidth
            size='lg'
            squared={transparent}
            className={
              transparent
                ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-14 text-lg"
                : "h-14 text-lg"
            }
            disabled={!areApiKeysSet}>
            {areApiKeysSet
              ? "Analyze Hero Section"
              : "Configure API Keys First"}
          </Button>

          {!areApiKeysSet && (
            <div
              className={`mt-3 p-4 rounded-lg ${
                transparent
                  ? "bg-amber-50/90 border border-amber-200/80"
                  : "bg-amber-50 border border-amber-200"
              }`}>
              <div className='flex items-start'>
                <div className='flex-shrink-0 mt-0.5'>
                  <Settings size={18} className='text-amber-500' />
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-amber-800'>
                    API Keys Required
                  </h3>
                  <div className='mt-1 text-sm text-amber-700'>
                    <p>
                      Click the settings button in the bottom right corner to
                      configure your API keys before analyzing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </Card>
    </AnimatedSection>
  );
};

export default AnalyzerForm;
