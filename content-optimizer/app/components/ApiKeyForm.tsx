import React, { useState, useEffect } from "react";
import Button from "./Button";
import Input from "./Input";
import apiService from "../services/api";

interface ApiKeyFormProps {
  onApiKeySet: (firecrawlKey: string) => void;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onApiKeySet }) => {
  const [firecrawlApiKey, setFirecrawlApiKey] = useState("");
  const [isFirecrawlStored, setIsFirecrawlStored] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [anthropicKeyStatus, setAnthropicKeyStatus] = useState<
    "set" | "missing"
  >("missing");

  // Check if API keys exist on component mount
  useEffect(() => {
    const storedFirecrawlKey = apiService.getFirecrawlApiKey();
    const hasAnthropicKey = apiService.hasAnthropicApiKey();

    if (storedFirecrawlKey) {
      setFirecrawlApiKey(storedFirecrawlKey);
      setIsFirecrawlStored(true);
    }

    // Check Anthropic key status from environment variables
    setAnthropicKeyStatus(hasAnthropicKey ? "set" : "missing");

    // If Firecrawl key is set, notify parent
    if (storedFirecrawlKey) {
      onApiKeySet(storedFirecrawlKey);
    }
  }, [onApiKeySet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firecrawlApiKey.trim()) return;

    setIsLoading(true);

    // Store Firecrawl API key
    apiService.setFirecrawlApiKey(firecrawlApiKey);

    // Simulate API key validation
    setTimeout(() => {
      setIsLoading(false);
      setIsFirecrawlStored(true);
      onApiKeySet(firecrawlApiKey);
    }, 1000);
  };

  const handleClearFirecrawlKey = () => {
    apiService.setFirecrawlApiKey("");
    setFirecrawlApiKey("");
    setIsFirecrawlStored(false);
    localStorage.removeItem("firecrawl_api_key");
  };

  return (
    <div className='space-y-6'>
      {/* Firecrawl API Key Form */}
      <div className='bg-white rounded-md'>
        <h3 className='text-md font-medium text-gray-900 mb-2'>
          Firecrawl API Key
        </h3>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <Input
            value={firecrawlApiKey}
            onChange={(e) => setFirecrawlApiKey(e.target.value)}
            type='password'
            placeholder='Enter your Firecrawl API key'
            fullWidth
            disabled={isFirecrawlStored}
            required
            helperText='Required for website scraping'
          />

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

      {/* Anthropic API Key Status */}
      <div className='bg-gray-50 rounded-md p-4'>
        <h3 className='text-md font-medium text-gray-900 mb-2'>
          Anthropic API Key
        </h3>
        <div className='flex items-center justify-between mb-2'>
          <span className='text-sm'>Status:</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              anthropicKeyStatus === "set"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}>
            {anthropicKeyStatus === "set" ? "Set in Environment" : "Not Set"}
          </span>
        </div>

        {anthropicKeyStatus === "missing" && (
          <div className='mt-2 text-xs text-red-600 bg-red-50 p-3 rounded-md'>
            <p className='font-medium mb-1'>
              Anthropic API key missing in environment variables
            </p>
            <p>
              Add to your{" "}
              <code className='bg-red-100 px-1 py-0.5 rounded'>.env.local</code>{" "}
              file:
            </p>
            <pre className='mt-1 bg-gray-800 text-white p-2 rounded-md text-xs overflow-x-auto'>
              NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key
            </pre>
          </div>
        )}
      </div>

      {/* API Keys Status Summary */}
      <div className='pt-4 border-t border-gray-200'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Analysis Ready:</span>
          <div className='flex items-center gap-2'>
            <span
              className={`w-3 h-3 rounded-full ${
                isFirecrawlStored && anthropicKeyStatus === "set"
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}></span>
            <span className='text-sm font-medium'>
              {isFirecrawlStored && anthropicKeyStatus === "set" ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyForm;
