import React, { useState, useEffect } from "react";
import ProfileCard from "./ProfileCard";
import JobCard from "./JobCard";
import {
  ResumeData,
  JobData,
  JobSearchFilters,
} from "../../services/firecrawl";
import { Briefcase, User, BarChart } from "lucide-react";

interface ResultsSectionProps {
  profile: ResumeData;
  jobs: JobData[];
  analysis: string;
  isLoading?: boolean;
  onApplyFilters?: (filters: JobSearchFilters) => void;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({
  profile,
  jobs,
  analysis,
  isLoading = false,
  onApplyFilters,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "jobs" | "analysis">(
    "profile",
  );
  const [filteredJobs, setFilteredJobs] = useState<JobData[]>(jobs);

  // Update filtered jobs when jobs change
  useEffect(() => {
    setFilteredJobs(jobs);
  }, [jobs]);

  // if (isLoading) {
  //   return (
  //     <div className='flex justify-center items-center py-20'>
  //       <div className='animate-pulse flex flex-col items-center'>
  //         <div className='h-8 w-8 bg-orange-500 rounded-full animate-spin mb-4'></div>
  //         <p className='text-orange-600 font-medium'>
  //           Analyzing your profile...
  //         </p>
  //         <p className='text-gray-500 text-sm mt-2'>
  //           This may take a few moments
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  if (!profile) return null;

  return (
    <div className='container mx-auto px-4 py-8'>
      <h2 className='text-2xl font-bold text-center mb-8'>
        Your Job Match Results
      </h2>

      {/* Tabs */}
      <div className='flex justify-center mb-8'>
        <div className='bg-white rounded-lg shadow-md flex p-1 w-full max-w-md'>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center justify-center flex-1 py-2 px-4 rounded-md text-sm font-medium ${
              activeTab === "profile"
                ? "bg-orange-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}>
            <User size={16} className='mr-2' />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`flex items-center justify-center flex-1 py-2 px-4 rounded-md text-sm font-medium ${
              activeTab === "jobs"
                ? "bg-orange-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}>
            <Briefcase size={16} className='mr-2' />
            Matches ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`flex items-center justify-center flex-1 py-2 px-4 rounded-md text-sm font-medium ${
              activeTab === "analysis"
                ? "bg-orange-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}>
            <BarChart size={16} className='mr-2' />
            Analysis
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className='max-w-xl mx-auto'>
        {activeTab === "profile" && (
          <div>
            <ProfileCard profile={profile} />
          </div>
        )}

        {activeTab === "jobs" && (
          <div>
            {filteredJobs.length === 0 ? (
              <div className='text-center py-10 bg-white rounded-lg shadow-md'>
                <Briefcase size={48} className='mx-auto text-gray-400 mb-4' />
                <h3 className='text-xl font-medium text-gray-800 mb-2'>
                  No Job Matches Found
                </h3>
                <p className='text-gray-600'>
                  We couldn't find any job matches for your profile at this
                  time. Try adding more details to your profile or try again
                  later.
                </p>
              </div>
            ) : (
              <div className='space-y-6'>
                {filteredJobs.map((job, index) => (
                  <JobCard key={index} job={job} className='bg-white/60' />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "analysis" && (
          <div className='bg-white rounded-lg shadow-md p-6'>
            <h3 className='text-xl font-medium text-orange-800 mb-4 border-b border-orange-100 pb-3'>
              Deep Research Analysis
            </h3>
            {analysis ? (
              <div className='prose prose-orange max-w-none'>
                {analysis.split("\n").map((paragraph, index) => {
                  // Check if paragraph is a heading (starts with # or ##)
                  if (paragraph.startsWith("# ")) {
                    return (
                      <h2
                        key={index}
                        className='text-xl font-bold text-orange-700 mt-6 mb-3'>
                        {paragraph.substring(2)}
                      </h2>
                    );
                  } else if (paragraph.startsWith("## ")) {
                    return (
                      <h3
                        key={index}
                        className='text-lg font-semibold text-orange-600 mt-5 mb-2'>
                        {paragraph.substring(3)}
                      </h3>
                    );
                  } else if (paragraph.startsWith("### ")) {
                    return (
                      <h4
                        key={index}
                        className='text-base font-medium text-orange-500 mt-4 mb-2'>
                        {paragraph.substring(4)}
                      </h4>
                    );
                  } else if (paragraph === "---") {
                    return (
                      <hr key={index} className='my-4 border-orange-100' />
                    );
                  } else {
                    return (
                      <p key={index} className='mb-4 text-gray-700'>
                        {paragraph}
                      </p>
                    );
                  }
                })}
              </div>
            ) : (
              <p className='text-gray-600'>No detailed analysis available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsSection;
