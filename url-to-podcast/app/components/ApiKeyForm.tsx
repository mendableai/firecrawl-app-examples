"use client";

import { useState, useEffect } from "react";
import { FiKey, FiInfo, FiCheck, FiEye, FiEyeOff } from "react-icons/fi";
import { Input } from "./Input";
import { Button } from "./Button";

interface ApiKeyFormProps {
  onApiKeySet: (key: string) => void;
}

export default function ApiKeyForm({ onApiKeySet }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Check localStorage for API key
    const storedApiKey = localStorage.getItem("firecrawl_api_key");
    if (storedApiKey) {
      setApiKey(storedApiKey);
      handleSubmit(null, storedApiKey); // Validate the stored key
    }
  }, []);

  const handleSubmit = async (
    e: React.FormEvent | null,
    keyOverride?: string,
  ) => {
    if (e) e.preventDefault();

    const keyToUse = keyOverride || apiKey;
    if (!keyToUse) {
      setError("Please enter your Firecrawl API key");
      return;
    }

    setIsValidating(true);
    setError("");

    try {
      // Validate the API key
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: keyToUse }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setIsSuccess(true);
        localStorage.setItem("firecrawl_api_key", keyToUse);
        onApiKeySet(keyToUse);
      } else {
        setError(data.message || "Invalid API key. Please try again.");
        setIsSuccess(false);
      }
    } catch (err) {
      setError("Error validating API key. Please try again.");
      setIsSuccess(false);
    } finally {
      setIsValidating(false);
    }
  };

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <div className='space-y-4'>
      <div className='mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2'>
        <FiInfo className='text-blue-500 mt-1 flex-shrink-0' size={14} />
        <p className='text-xs text-blue-700'>
          Get your Firecrawl API key at{" "}
          <a
            href='https://firecrawl.dev'
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-600 underline hover:text-blue-800'>
            firecrawl.dev
          </a>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className='relative'>
          <Input
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError("");
              setIsSuccess(false);
            }}
            placeholder='Your Firecrawl API key'
            fullWidth
            className='pr-12'
            error={error}
            inputSize='md'
            required
          />
          <button
            type='button'
            onClick={toggleShowApiKey}
            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
            aria-label={showApiKey ? "Hide API key" : "Show API key"}>
            {showApiKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>

        <div className='flex justify-end mt-4'>
          <Button
            type='submit'
            disabled={isValidating || isSuccess}
            isLoading={isValidating}
            variant='primary'
            className='w-full'>
            {isSuccess ? (
              <span className='flex items-center justify-center'>
                <FiCheck className='mr-2' /> Validated
              </span>
            ) : (
              "Save API Key"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
