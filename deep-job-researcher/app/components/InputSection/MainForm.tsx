"use client";
import React, { useState, useRef } from "react";
import Button from "../Button/Button";
import Input from "./Input";
import Card from "./Card";
import { JobSearchFilters } from "../../services/firecrawl";

import {
  Settings,
  Globe,
  FileText,
  ToggleLeft,
  ToggleRight,
  Filter,
  ChevronDown,
} from "lucide-react";

interface MainFormProps {
  // onAnalyze: (url: string) => Promise<void>;
  areApiKeysSet: boolean;
  transparent?: boolean;
  label?: string;
  placeholder?: string;
  subText?: string;
  apiRequiredText?: string;
  submitButtonText?: string;
  warningTitle?: string;
  customButton?: React.ReactNode;
  outputSectionRef?: React.RefObject<HTMLDivElement | null>;
  onUrlChange?: (url: string) => void;
  onFormSubmit?: () => void;
  onToggleMode?: (mode: boolean) => void;
  onResumeChange?: (file: File | null) => void;
  onFiltersChange?: (filters: JobSearchFilters) => void;
}

const MainForm: React.FC<MainFormProps> = ({
  // onAnalyze,
  areApiKeysSet,
  transparent = false,
  label,
  placeholder = "https://example.dev",
  subText = "Enter your Portfolio URL or Upload your Resume",
  apiRequiredText = "Click the settings button in the bottom right corner to configure your API keys before analyzing.",
  submitButtonText = "Analyze Content",
  warningTitle = "API Keys Required",
  customButton,
  outputSectionRef,
  onUrlChange,
  onFormSubmit,
  onToggleMode,
  onResumeChange,
  onFiltersChange,
}) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUrlMode, setIsUrlMode] = useState(true);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Job filters
  const [workType, setWorkType] = useState<string[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [salaryRange, setSalaryRange] = useState<string | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null);

  // Apply filters when they change
  React.useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        workType,
        location,
        salaryRange,
        experienceLevel,
      });
    }
  }, [workType, location, salaryRange, experienceLevel, onFiltersChange]);

  // Handler for URL input changes
  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (onUrlChange) {
      onUrlChange(value);
    }
    setError(""); // Clear error when user types
  };

  // Handler for resume file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setResumeFile(file);
    if (onResumeChange) {
      onResumeChange(file);
    }
    setError("");
  };

  // Handler for toggling between URL and resume upload
  const toggleInputMode = () => {
    const newMode = !isUrlMode;
    setIsUrlMode(newMode);
    // Reset form data when toggling
    setUrl("");
    setResumeFile(null);
    setError("");

    // Notify parent component of mode change
    if (onToggleMode) {
      onToggleMode(newMode);
    }

    // Notify parent about cleared resume
    if (onResumeChange) {
      onResumeChange(null);
    }
  };

  // Handler for toggling work type
  const toggleWorkType = (type: string) => {
    if (workType.includes(type)) {
      setWorkType(workType.filter((t) => t !== type));
    } else {
      setWorkType([...workType, type]);
    }
  };

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

  // Function to scroll to output section
  const scrollToOutput = () => {
    // Only scroll if the ref exists and points to a DOM element
    if (outputSectionRef?.current) {
      // Set a slight delay to ensure analysis results are rendered before scrolling
      setTimeout(() => {
        const navbarHeight = 80; // Approximate navbar height

        // Use scrollIntoView with a specific offset
        outputSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Add a small additional offset to prevent getting stuck under the navbar
        setTimeout(() => {
          window.scrollBy({
            top: -navbarHeight,
            behavior: "smooth",
          });
        }, 100);
      }, 200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error state
    setError("");

    // Check if API keys are configured
    if (!areApiKeysSet) {
      setError("Please configure your API keys first");
      return;
    }

    if (isUrlMode) {
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
      handleUrlChange(formattedUrl);
    } else {
      // Validate Resume file
      if (!resumeFile) {
        setError("Please upload a resume PDF");
        return;
      }

      if (resumeFile.type !== "application/pdf") {
        setError("Please upload a PDF file");
        return;
      }
    }

    setIsLoading(true);

    try {
      // await onAnalyze(formattedUrl);
      // Scroll to output section after successful analysis
      if (onFormSubmit) {
        onFormSubmit();
      }
    } catch (err: any) {
      console.error("Analysis error:", err);

      // Handle specific error cases
      if (err?.response?.status === 401) {
        setError(
          "Invalid API key. Please check your Firecrawl API key and try again.",
        );
      } else if (err?.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError("Failed to analyze the website. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const displayLabel = isUrlMode
    ? label || (transparent ? "Enter Website URL" : "Portfolio URL")
    : "Upload Resume PDF";

  return (
    <div className='max-w-xl mx-auto pt-10'>
      <Card
        className={`${
          transparent
            ? "bg-white/30 backdrop-blur-md dark:bg-gray-800/30 border-white/20 shadow-xl"
            : "shadow-lg border border-orange-100/50 bg-white/40"
        }`}>
        <form
          onSubmit={handleSubmit}
          className={`${transparent ? "py-4" : "py-6"} space-y-6`}>
          {/* Toggle switch between URL and Resume upload */}
          <div className='flex items-center justify-center mb-4'>
            <div
              className='flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300'
              onClick={toggleInputMode}>
              <span
                className={`text-sm font-medium ${
                  isUrlMode ? "text-orange-500" : "text-gray-500"
                }`}>
                Portfolio URL
              </span>
              {isUrlMode ? (
                <ToggleLeft size={24} className='text-orange-500' />
              ) : (
                <ToggleRight size={24} className='text-orange-500' />
              )}
              <span
                className={`text-sm font-medium ${
                  !isUrlMode ? "text-orange-500" : "text-gray-500"
                }`}>
                Resume PDF
              </span>
            </div>
          </div>

          <div className='relative'>
            {isUrlMode ? (
              <Input
                label={displayLabel}
                value={url}
                onChange={(e) => {
                  handleUrlChange(e.target.value);
                }}
                placeholder={placeholder}
                fullWidth
                required
                error={!!error}
                helperText={error || subText}
                icon={<Globe size={22} className='text-orange-500' />}
                className={`text-lg py-4 h-16 ${
                  transparent
                    ? "bg-white/60 dark:bg-gray-700/50"
                    : "bg-white/80"
                }`}
                typewriterEffect={true}
                isUrl={true}
                showEnterIcon={true}
                onEnterSubmit={(value) => {
                  handleUrlChange(value);

                  if (areApiKeysSet && value.trim()) {
                    // Create a synthetic form event and call handleSubmit directly
                    const syntheticEvent = {
                      preventDefault: () => {},
                    } as React.FormEvent;

                    handleSubmit(syntheticEvent);
                  }
                }}
              />
            ) : (
              <div className='space-y-1'>
                <label className='font-medium text-sm text-gray-700 dark:text-gray-300'>
                  {displayLabel}
                </label>
                <div
                  className={`relative border rounded-xl overflow-hidden transition-all duration-200 ${
                    !!error
                      ? "border-red-500"
                      : "border-gray-300 focus-within:border-[var(--primary)]"
                  }`}>
                  <div
                    className={`flex items-center px-4 py-2 ${
                      transparent
                        ? "bg-white/60 dark:bg-gray-700/50"
                        : "bg-white/80"
                    }`}>
                    <FileText size={22} className='text-orange-500 mr-2' />
                    <div className='flex-1 truncate'>
                      {resumeFile ? resumeFile.name : "No file selected"}
                    </div>
                    <Button
                      type='button'
                      onClick={() => fileInputRef.current?.click()}
                      className='ml-2 px-4 py-2 text-sm'>
                      Browse
                    </Button>
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='.pdf'
                      onChange={handleFileChange}
                      className='hidden'
                    />
                  </div>
                </div>
                {(error || subText) && (
                  <p
                    className={`text-xs ${
                      error
                        ? "text-red-500"
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                    {error || subText}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Job Filters Accordion */}
          <div className='mt-6'>
            <button
              type='button'
              onClick={() => setShowFilters(!showFilters)}
              className='w-full flex items-center justify-between text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors'>
              <div className='flex items-center'>
                <Filter size={16} className='mr-2 text-orange-500' />
                <span>Job Search Filters</span>
                {(workType.length > 0 ||
                  location ||
                  salaryRange ||
                  experienceLevel) && (
                  <span className='ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full'>
                    {[
                      workType.length > 0 ? 1 : 0,
                      location ? 1 : 0,
                      salaryRange ? 1 : 0,
                      experienceLevel ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </div>
              <ChevronDown
                size={16}
                className={`transform transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {showFilters && (
              <div className='mt-4 p-4 bg-white/80 rounded-md border border-gray-200 space-y-4'>
                {/* Work Type Filter */}
                <div>
                  <h4 className='text-sm font-medium text-gray-700 mb-2'>
                    Work Type
                  </h4>
                  <div className='flex flex-wrap gap-2'>
                    {[
                      { id: "remote", label: "Remote" },
                      { id: "hybrid", label: "Hybrid" },
                      { id: "onsite", label: "On-site" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type='button'
                        onClick={() => toggleWorkType(option.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          workType.includes(option.id)
                            ? "bg-orange-100 border-orange-300 text-orange-800"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <h4 className='text-sm font-medium text-gray-700 mb-2'>
                    Location
                  </h4>
                  <select
                    value={location || ""}
                    onChange={(e) =>
                      setLocation(e.target.value === "" ? null : e.target.value)
                    }
                    className='w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500'>
                    <option value=''>Any Location</option>
                    <option value='USA'>United States</option>
                    <option value='europe'>Europe</option>
                    <option value='asia'>Asia</option>
                    <option value='other'>Other</option>
                  </select>
                </div>

                {/* Salary Range Filter */}
                <div>
                  <h4 className='text-sm font-medium text-gray-700 mb-2'>
                    Salary Range
                  </h4>
                  <select
                    value={salaryRange || ""}
                    onChange={(e) =>
                      setSalaryRange(
                        e.target.value === "" ? null : e.target.value,
                      )
                    }
                    className='w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500'>
                    <option value=''>Any Salary</option>
                    <option value='0-50k'>$0 - $50K</option>
                    <option value='50k-100k'>$50K - $100K</option>
                    <option value='100k-150k'>$100K - $150K</option>
                    <option value='150k+'>$150K+</option>
                  </select>
                </div>

                {/* Experience Level Filter */}
                <div>
                  <h4 className='text-sm font-medium text-gray-700 mb-2'>
                    Experience Level
                  </h4>
                  <select
                    value={experienceLevel || ""}
                    onChange={(e) =>
                      setExperienceLevel(
                        e.target.value === "" ? null : e.target.value,
                      )
                    }
                    className='w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500'>
                    <option value=''>Any Experience</option>
                    <option value='entry'>Entry Level</option>
                    <option value='mid'>Mid Level</option>
                    <option value='senior'>Senior Level</option>
                    <option value='lead'>Lead/Manager</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {customButton ? (
            customButton
          ) : (
            <Button
              type='submit'
              isLoading={isLoading}
              fullWidth
              size='lg'
              squared={transparent}
              className={
                transparent
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-16 text-lg mt-2"
                  : "h-16 text-lg mt-2"
              }
              disabled={!areApiKeysSet}
              buttonContent={
                !areApiKeysSet
                  ? "Configure API Keys First"
                  : isLoading
                  ? "Loading..."
                  : submitButtonText
              }
            />
          )}

          {!areApiKeysSet && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                transparent
                  ? "bg-amber-50/70 border border-amber-200/60"
                  : "bg-amber-50/90 border border-amber-200/70"
              }`}>
              <div className='flex items-start'>
                <div className='flex-shrink-0 mt-0.5'>
                  <Settings size={18} className='text-amber-500' />
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-amber-800'>
                    {warningTitle}
                  </h3>
                  <div className='mt-1 text-sm text-amber-700'>
                    <p>{apiRequiredText}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default MainForm;
