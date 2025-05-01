"use client";
import Image from "next/image";
import Navbar from "./components/Navbar/Navbar";
import BgGradient from "./components/BG/BgGradient";
import MainForm from "./components/InputSection/MainForm";
import Header from "./components/header/Header";
import SubHeader from "./components/header/SubHeader";
import IntegrationDetailsGroup from "./components/IntegrationMenu/IntegrationDetailsGroup";
import Button from "./components/Button/Button";
import { useRef, useState, useEffect, useCallback } from "react";
import ApiKeySidebar from "./components/SideBar/ApiKeySidebar";
import ResultsSection from "./components/Results/ResultsSection";
import { apiService } from "./services/api";
import { JobData, ResumeData, JobSearchFilters } from "./services/firecrawl";

export default function Home() {
  const handleApiKeySet = (firecrawlKey: string) => {
    console.log("API Key set:", firecrawlKey.substring(0, 5) + "...");
    setApiKeysConfigured(true);
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
  };

  const setProgressMessage = (message: string) => {
    setProgressStatus((prevStatus) => [...prevStatus, message]);
  };

  const handleFormSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setProgressStatus(["Starting analysis process..."]);

      let result;

      if (isUrlMode) {
        // Process URL input
        setProgressMessage("Extracting profile information from URL...");
        setTimeout(
          () => setProgressMessage("Analyzing your professional profile..."),
          1500,
        );
        result = await apiService.analyzeProfileUrl(
          urlInput.trim(),
          setProgressMessage,
          initialFilters,
        );
      } else if (resumeFile) {
        // Process resume file
        setProgressMessage("Processing your resume file...");
        setTimeout(
          () => setProgressMessage("Extracting professional information..."),
          1500,
        );
        result = await apiService.analyzeResumeFile(
          resumeFile,
          setProgressMessage,
          initialFilters,
        );
      } else {
        throw new Error("No URL or resume file provided");
      }

      // Update state with results
      setProgressMessage("Analysis complete! Preparing results...");
      setProfile(result.profile);
      setJobs(result.jobs);
      setAnalysis(result.analysis);

      // Show output section
      setShowOutput(true);

      // Scroll to output section
      if (outputSectionRef.current) {
        outputSectionRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: any) {
      console.error("Error analyzing profile:", err);
      setError(err.message || "An error occurred while analyzing your profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = async (filters: JobSearchFilters) => {
    if (!profile) return;

    try {
      setIsFiltering(true);
      setProgressStatus(["Applying job filters..."]);

      // Check if we have active filters
      const hasActiveFilters =
        (filters.workType && filters.workType.length > 0) ||
        filters.location ||
        filters.salaryRange ||
        filters.experienceLevel;

      if (hasActiveFilters) {
        setProgressMessage("Running deep research with your filters...");

        // Run a new search with filters
        const result = await apiService.findJobsWithFilters(
          profile,
          filters,
          setProgressMessage,
        );

        // Update state with filtered results
        setJobs(result.jobs);
        setAnalysis(result.analysis);
        setProgressMessage("Filter applied successfully!");
      }
    } catch (err: any) {
      console.error("Error applying filters:", err);
      setError(err.message || "An error occurred while applying filters");
    } finally {
      setIsFiltering(false);
    }
  };

  const [apiKeysConfigured, setApiKeysConfigured] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUrlMode, setIsUrlMode] = useState(true);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const outputSectionRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressStatus, setProgressStatus] = useState<string[]>([]);

  // Results state
  const [profile, setProfile] = useState<ResumeData | null>(null);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [analysis, setAnalysis] = useState("");

  // Initial filters that can be set before analysis
  const [initialFilters, setInitialFilters] = useState<JobSearchFilters>({
    workType: [],
    location: null,
    salaryRange: null,
    experienceLevel: null,
  });

  // Function to handle toggle mode changes in the form
  const handleToggleMode = (mode: boolean) => {
    setIsUrlMode(mode);
    // Reset URL input when toggling modes
    setUrlInput("");
  };

  // Function to handle resume file changes
  const handleResumeChange = (file: File | null) => {
    setResumeFile(file);
  };

  // Handler for initial filter changes
  const handleFiltersChange = useCallback((filters: JobSearchFilters) => {
    setInitialFilters(filters);

    // Log filters for debugging
    console.log("Filters updated:", filters);
  }, []); // Empty dependency array means this function never changes

  return (
    <>
      <Navbar appNameColor='black' />
      <ApiKeySidebar
        onApiKeySet={handleApiKeySet}
        apiKeysConfigured={apiKeysConfigured}
      />
      <BgGradient>
        <div className='min-h-screen flex flex-col'>
          <div className='flex-1'>
            <Header content='Deep Job Researcher' />
            <SubHeader content='Firecrawl analyzes your profile and does deep research to match you with high-fit jobs.' />
            <IntegrationDetailsGroup
              items={["OpenAI o3", "🔥 Firecrawl", "Deep-Research"]}
            />
            <MainForm
              areApiKeysSet={apiKeysConfigured}
              onUrlChange={handleUrlChange}
              onFormSubmit={handleFormSubmit}
              onToggleMode={handleToggleMode}
              onResumeChange={handleResumeChange}
              onFiltersChange={handleFiltersChange}
              customButton={
                <Button
                  type='submit'
                  size='lg'
                  variant='primary'
                  buttonContent={
                    apiKeysConfigured
                      ? isLoading
                        ? "Analyzing..."
                        : "Analyze Profile"
                      : "Please Configure Your API Keys"
                  }
                  fullWidth
                  className='h-16 text-lg'
                  disabled={
                    !apiKeysConfigured ||
                    isLoading ||
                    (isUrlMode ? !urlInput.trim() : !resumeFile)
                  }
                  isLoading={isLoading}
                />
              }
              outputSectionRef={outputSectionRef}
            />

            {(isLoading || isFiltering) && (
              <div className='mt-6 p-4 bg-orange-50 border border-orange-200 rounded-md mx-auto max-w-xl'>
                <div className='flex items-center mb-3'>
                  <div className='animate-spin h-5 w-5 mr-3 border-t-2 border-orange-500 rounded-full'></div>
                  <p className='font-medium text-orange-700'>
                    {isFiltering ? "Filtering jobs" : "Analysis in progress"}
                  </p>
                </div>
                <div className='space-y-2 pl-8'>
                  {progressStatus.map((message, index) => (
                    <div key={index} className='flex items-start'>
                      <span className='text-orange-600 mr-2'>
                        {index === progressStatus.length - 1 ? "→" : "✓"}
                      </span>
                      <p
                        className={`text-sm ${
                          index === progressStatus.length - 1
                            ? "text-orange-800 font-medium"
                            : "text-orange-600"
                        }`}>
                        {message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mx-auto max-w-xl'>
                <p className='font-medium'>Error</p>
                <p className='text-sm'>{error}</p>
              </div>
            )}

            {showOutput && (
              <div ref={outputSectionRef} className='mt-8 pt-8 w-full'>
                <ResultsSection
                  profile={profile!}
                  jobs={jobs}
                  analysis={analysis}
                  isLoading={isLoading || isFiltering}
                  onApplyFilters={handleApplyFilters}
                />
              </div>
            )}
          </div>
        </div>
      </BgGradient>
    </>
  );
}
