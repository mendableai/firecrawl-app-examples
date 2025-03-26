"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiTrash2, FiHeadphones, FiLink } from "react-icons/fi";
import Card from "./Card";
import { Input } from "./Input";
import { Button } from "./Button";

interface UrlInputProps {
  onSubmit: (urls: string[]) => void;
  isProcessing: boolean;
}

export default function UrlInput({ onSubmit, isProcessing }: UrlInputProps) {
  const [urls, setUrls] = useState<string[]>([""]);

  const handleChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const addUrlField = () => {
    setUrls([...urls, ""]);
  };

  const removeUrlField = (index: number) => {
    if (urls.length === 1) return;
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validUrls = urls.filter((url) => url.trim() !== "");
    if (validUrls.length > 0) {
      onSubmit(validUrls);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>
      <Card className='w-full max-w-3xl mx-auto' hoverable>
        <form onSubmit={handleSubmit}>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-2 rounded-full bg-slate-100'>
              <FiHeadphones className='text-[var(--primary)] h-5 w-5' />
            </div>
            <h2 className='text-2xl font-bold text-slate-800'>
              Convert Web Content to Podcast
            </h2>
          </div>

          <p className='text-gray-600 mb-6'>
            Enter the URLs of articles, blog posts, or web pages you'd like to
            convert into podcast episodes.
            {urls.length > 1 && (
              <span className='ml-1 text-[var(--primary-dark)]'>
                Multiple URLs will be merged into a single podcast.
              </span>
            )}
          </p>

          <div className='space-y-4'>
            {urls.map((url, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className='flex items-center gap-2 group'>
                <div className='relative flex-1'>
                  <FiLink className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--primary)]' />
                  <Input
                    type='url'
                    value={url}
                    onChange={(e) => handleChange(index, e.target.value)}
                    placeholder='https://example.com/article'
                    fullWidth
                    className='pl-10 border-[var(--input-border)] focus:border-[var(--primary)] transition-all'
                    required
                  />
                </div>
                <button
                  type='button'
                  onClick={() => removeUrlField(index)}
                  className='p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50'
                  disabled={urls.length === 1}
                  aria-label='Remove URL'>
                  <FiTrash2 />
                </button>
              </motion.div>
            ))}
          </div>

          <motion.div
            className='flex justify-between mt-6'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}>
            <button
              type='button'
              onClick={addUrlField}
              className='flex items-center gap-2 text-gray-600 hover:text-[var(--primary)] text-sm py-1.5 px-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] focus:ring-opacity-40'>
              <FiPlus /> Add another URL
            </button>

            <Button
              type='submit'
              disabled={isProcessing}
              isLoading={isProcessing}
              variant='primary'
              className='px-6'>
              Generate Podcast
            </Button>
          </motion.div>
        </form>
      </Card>
    </motion.div>
  );
}
