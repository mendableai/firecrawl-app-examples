"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSettings, FiX, FiKey } from "react-icons/fi";
import ApiKeyForm from "./ApiKeyForm";

interface SidebarProps {
  apiKey: string | null;
  onApiKeySet: (key: string) => void;
}

export default function Sidebar({ apiKey, onApiKeySet }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when clicking escape key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [isOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Settings button in bottom right */}
      <div className='fixed bottom-6 right-6 z-50'>
        <button
          onClick={toggleSidebar}
          className={`p-4 rounded-full shadow-lg text-[var(--primary)] hover:text-[var(--primary-dark)] transition-all ${
            !apiKey ? "animate-pulse-slow" : ""
          }`}
          aria-label='Settings'
          style={{
            background: "linear-gradient(135deg, white, #fff8f2)",
          }}>
          <FiSettings size={24} />

          {apiKey ? (
            <div className='absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] rounded-full flex items-center justify-center shadow-sm'>
              <FiKey className='text-white' size={10} />
            </div>
          ) : (
            <div className='absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-sm'>
              <FiKey className='text-white' size={10} />
            </div>
          )}
        </button>
      </div>

      {/* Sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 bg-black/30 backdrop-blur-sm z-40'
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className='fixed right-0 top-0 bottom-0 w-full max-w-md shadow-xl z-50 overflow-y-auto'
            style={{
              background: "linear-gradient(160deg, white 0%, #fff8f2 100%)",
              borderLeft: "1px solid rgba(248, 118, 33, 0.1)",
            }}>
            <div className='p-4 border-b border-[var(--card-border)] flex justify-between items-center'>
              <h2 className='text-xl font-semibold text-slate-800'>Settings</h2>
              <button
                onClick={toggleSidebar}
                className='p-2 rounded-full hover:bg-[var(--surface-hover)] text-gray-500'
                aria-label='Close settings'>
                <FiX size={20} />
              </button>
            </div>

            <div className='p-6'>
              <div className='flex items-center gap-2 mb-6'>
                <div className='p-1.5 rounded-md bg-[var(--primary)] bg-opacity-10'>
                  <FiKey className='text-[var(--primary)]' size={16} />
                </div>
                <h3 className='text-lg font-medium text-slate-700'>
                  API Key Configuration
                </h3>
              </div>

              <ApiKeyForm onApiKeySet={onApiKeySet} />

              {apiKey && (
                <div className='mt-6 p-4 bg-orange-50 rounded-lg border border-orange-100'>
                  <div className='flex items-center gap-2'>
                    <div className='p-1 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] rounded-full'>
                      <FiKey size={12} className='text-white' />
                    </div>
                    <p className='text-[var(--primary-dark)] text-sm font-medium'>
                      API Key is configured and ready to use
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
