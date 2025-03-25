import React, { useState, useEffect } from "react";
import { X, Settings } from "lucide-react";
import ApiKeyForm from "./ApiKeyForm";

interface SidebarProps {
  onApiKeySet: (firecrawlKey: string) => void;
  apiKeysConfigured: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onApiKeySet,
  apiKeysConfigured,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("api-settings-sidebar");
      const button = document.getElementById("toggle-sidebar-button");

      if (
        sidebar &&
        button &&
        !sidebar.contains(event.target as Node) &&
        !button.contains(event.target as Node) &&
        isOpen &&
        window.innerWidth < 768
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button with Floating Label */}
      <div className='fixed bottom-4 right-4 z-30 flex flex-col items-end'>
        {/* Show API Status */}
        <div
          className={`mb-2 rounded-full px-3 py-1 text-sm font-medium shadow-lg text-white transition-all ${
            apiKeysConfigured ? "bg-green-500" : "bg-amber-500 animate-pulse"
          }`}>
          {apiKeysConfigured ? "API Keys ✓" : "Configure API Keys"}
        </div>

        <button
          id='toggle-sidebar-button'
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg transition-all duration-300 ${
            apiKeysConfigured
              ? "bg-[var(--primary)] hover:bg-orange-700"
              : "bg-amber-500 animate-pulse-slow hover:bg-amber-600"
          }`}
          aria-label='Toggle API Settings'>
          <Settings size={24} />
        </button>
      </div>

      {/* Sidebar Overlay (Mobile only) */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden backdrop-blur-sm'
          aria-hidden='true'
        />
      )}

      {/* Sidebar */}
      <div
        id='api-settings-sidebar'
        className={`fixed top-0 right-0 h-full bg-white shadow-xl z-40 transition-all duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "w-full max-w-md translate-x-0" : "translate-x-full"
        }`}>
        {/* Sidebar Header */}
        <div className='bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-bold'>API Settings</h2>
              <p className='text-sm text-orange-100 mt-1'>
                Configure your API keys
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className='p-2 rounded-full hover:bg-white/10 text-white'
              aria-label='Close sidebar'>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className='p-5'>
          <ApiKeyForm onApiKeySet={onApiKeySet} />

          {/* Help Text */}
          <div className='mt-8 pt-4 border-t border-gray-200'>
            <h3 className='text-sm font-medium text-gray-700 mb-2'>
              About API Keys
            </h3>
            <p className='text-xs text-gray-600'>
              The Firecrawl API key can be entered here or set in your
              .env.local file. The Claude API key must be set in your
              environment variables for security reasons.
            </p>
            <p className='text-xs text-gray-600 mt-2'>
              Restart the server after updating environment variables.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
