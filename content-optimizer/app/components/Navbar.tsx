"use client";

import React, { useState, useEffect } from "react";
import { Key, Settings } from "lucide-react";
import ApiKeyForm from "./ApiKeyForm";
import { apiService } from "../services/api";

const Navbar = () => {
  const [isApiMenuOpen, setIsApiMenuOpen] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);

  // Check if API key is set on component mount
  useEffect(() => {
    const storedFirecrawlKey = apiService.getFirecrawlApiKey();
    setIsApiKeySet(!!storedFirecrawlKey);
  }, []);

  const handleApiKeySet = (firecrawlKey: string) => {
    setIsApiKeySet(!!firecrawlKey);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById("api-key-menu");
      const button = document.getElementById("api-key-button");

      if (
        menu &&
        button &&
        !menu.contains(event.target as Node) &&
        !button.contains(event.target as Node) &&
        isApiMenuOpen
      ) {
        setIsApiMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isApiMenuOpen]);

  return (
    <header className='relative top-0 left-0 right-0 z-50'>
      <div className='w-full py-3 backdrop-blur-sm bg-white/40'>
        <div className='container mx-auto px-4 flex justify-between items-center'>
          <h1 className='text-xl font-bold text-[var(--primary)]'>
            🔥 Content Optimizer
          </h1>
          <nav className='flex items-center gap-4'>
            <button
              id='api-key-button'
              onClick={() => setIsApiMenuOpen(!isApiMenuOpen)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                isApiKeySet
                  ? "bg-green-50 hover:bg-green-100 text-green-700"
                  : "bg-orange-50 hover:bg-orange-100 text-orange-700 animate-pulse"
              }`}>
              <Settings
                size={16}
                className={isApiKeySet ? "text-green-500" : "text-orange-500"}
              />
              {isApiKeySet ? "API Key ✓" : "Set API Key"}
            </button>
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
      </div>

      {/* API Key Menu */}
      {isApiMenuOpen && (
        <div
          id='api-key-menu'
          className='absolute right-4 top-14 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4'>
          <div className='flex justify-between items-center mb-2'>
            <h3 className='font-medium text-gray-900'>API Key Settings</h3>
            <button
              onClick={() => setIsApiMenuOpen(false)}
              className='text-gray-500 hover:text-gray-700'>
              ✕
            </button>
          </div>
          <ApiKeyForm
            onApiKeySet={(key) => {
              handleApiKeySet(key);
              // Optionally close the menu after setting the key
              // setIsApiMenuOpen(false);
            }}
          />
        </div>
      )}
    </header>
  );
};

export default Navbar;
