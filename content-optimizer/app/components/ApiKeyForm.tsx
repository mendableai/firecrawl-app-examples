import React, { useState, useEffect } from "react";
import Button from "./Button";
import Input from "./Input";
import { apiService } from "../services/api";
import { Eye, EyeOff } from "lucide-react";

interface ApiKeyFormProps {
  onApiKeySet: (firecrawlKey: string) => void;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onApiKeySet }) => {
  const [firecrawlApiKey, setFirecrawlApiKey] = useState("");
  const [isFirecrawlStored, setIsFirecrawlStored] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Check if API keys exist on component mount
  useEffect(() => {
    const storedFirecrawlKey = apiService.getFirecrawlApiKey();

    if (storedFirecrawlKey) {
      setFirecrawlApiKey(storedFirecrawlKey);
      setIsFirecrawlStored(true);
      onApiKeySet(storedFirecrawlKey);
    }
  }, [onApiKeySet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Remove all whitespace from the key
    const cleanKey = firecrawlApiKey.trim().replace(/\s+/g, "");

    if (!cleanKey) {
      setError("API key is required");
      return;
    }

    // Validate key format
    if (!cleanKey.startsWith("fc-")) {
      setError(
        'API key must start with "fc-". Please enter the complete key as provided.',
      );
      return;
    }

    setIsLoading(true);

    try {
      // Store Firecrawl API key
      apiService.setFirecrawlApiKey(cleanKey);
      setIsFirecrawlStored(true);
      onApiKeySet(cleanKey);
    } catch (error: any) {
      console.error("Failed to set API key:", error);
      setError(
        error.message ||
          "Failed to set API key. Please check the format and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFirecrawlKey = () => {
    apiService.clearFirecrawlApiKey();
    setFirecrawlApiKey("");
    setIsFirecrawlStored(false);
    setError(null);
  };

  return (
    <div className='space-y-6'>
      {/* Firecrawl API Key Form */}
      <div className='bg-white rounded-md'>
        <h3 className='text-md font-medium text-gray-900 mb-2'>
          Firecrawl API Key
        </h3>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='relative'>
            <Input
              value={firecrawlApiKey}
              onChange={(e) => {
                setFirecrawlApiKey(e.target.value);
                setError(null);
              }}
              type={showPassword ? "text" : "password"}
              placeholder='Enter your Firecrawl API key (must start with fc-)'
              fullWidth
              disabled={isFirecrawlStored}
              required
              error={!!error}
              helperText={
                error ||
                'Required for website scraping. Must start with "fc-". Enter the key exactly as provided.'
              }
              className='pr-10'
            />
            <button
              type='button'
              className='absolute right-4 top-[14px] text-gray-500 hover:text-gray-700 focus:outline-none p-1'
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className='flex gap-2'>
            {!isFirecrawlStored ? (
              <Button
                type='submit'
                isLoading={isLoading}
                fullWidth
                size='sm'
                squared>
                Save Key
              </Button>
            ) : (
              <>
                <Button
                  variant='outline'
                  onClick={handleClearFirecrawlKey}
                  size='sm'
                  squared>
                  Change
                </Button>
                <Button disabled size='sm' className='flex-1' squared>
                  Key Saved ✓
                </Button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Help Text */}
      <div className='mt-8 pt-4 border-t border-gray-200'>
        <h3 className='text-sm font-medium text-gray-700 mb-2'>
          About API Keys
        </h3>
        <p className='text-xs text-gray-600'>
          Enter your Firecrawl API key here. Get your API key from{" "}
          <a
            href='https://firecrawl.dev'
            target='_blank'
            rel='noopener noreferrer'
            className='text-orange-500 hover:text-orange-600'>
            firecrawl.dev
          </a>
          . The key must start with 'fc-'. Enter the key exactly as provided.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyForm;
