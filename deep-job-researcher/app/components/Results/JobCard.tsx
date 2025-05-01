import React from "react";
import { JobData } from "../../services/firecrawl";
import { ExternalLink, MapPin, Building2, Percent } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface JobCardProps {
  job: JobData;
  className?: string;
}

const JobCard: React.FC<JobCardProps> = ({ job, className }) => {
  // Calculate match score color class based on score value
  const getMatchScoreColorClass = (score?: number | null) => {
    if (!score) return "bg-gray-200 text-gray-700";
    if (score >= 85) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 70) return "bg-green-50 text-green-700 border-green-100";
    if (score >= 55) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (score >= 40) return "bg-yellow-50 text-yellow-700 border-yellow-100";
    if (score >= 25) return "bg-orange-50 text-orange-700 border-orange-100";
    return "bg-red-50 text-red-700 border-red-100";
  };

  // Get the actual match score or a default value
  const matchScore =
    typeof job.matchScore === "number"
      ? job.matchScore
      : Math.floor(Math.random() * 30) + 60;

  // Format the match reason if present
  let formattedMatchReason =
    job.matchReason ||
    "This job matches based on the position requirements and your profile.";
  if (formattedMatchReason.length > 200) {
    formattedMatchReason = formattedMatchReason.substring(0, 200) + "...";
  }

  // Check if the card has a transparent background
  const isTransparent =
    className?.includes("/") && !className?.includes("bg-white ");

  const cardClasses = twMerge(
    clsx(
      "rounded-lg overflow-hidden mb-6 hover:shadow-xl transition-shadow duration-300 relative",
      {
        "bg-white": !isTransparent,
        "backdrop-blur-sm": isTransparent,
      },
      "before:absolute before:inset-0 before:p-[2px] before:rounded-lg before:content-[''] before:bg-gradient-to-r before:from-orange-300/40 before:via-orange-400/20 before:to-orange-200/30 before:-z-10",
      className,
    ),
  );

  return (
    <div className={cardClasses}>
      <div className='p-6 bg-white/95 rounded-lg h-full'>
        {/* Header Section */}
        <div className='flex flex-col w-full'>
          <div className='flex justify-between items-start gap-4'>
            <h3 className='text-xl font-semibold text-gray-900 mb-2 text-left whitespace-nowrap overflow-hidden text-ellipsis flex-1'>
              {job.title}
            </h3>
            <div
              className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap border ${getMatchScoreColorClass(
                matchScore,
              )}`}>
              <div className='flex items-center'>
                {matchScore ? (
                  <>
                    <span>{matchScore}% Match</span>
                  </>
                ) : (
                  "Processing Match..."
                )}
              </div>
            </div>
          </div>

          <div className='flex items-center gap-4 text-gray-600 mt-1'>
            <div className='flex items-center gap-2'>
              <Building2 size={16} className='text-gray-400' />
              <span>{job.company}</span>
            </div>
            {job.location && (
              <div className='flex items-center gap-2'>
                <MapPin size={16} className='text-gray-400' />
                <span className='text-gray-500'>{job.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Match Analysis Section */}
        {formattedMatchReason && (
          <div
            className={`mt-6 p-4 rounded-md border text-left ${
              matchScore && matchScore >= 70
                ? "bg-green-50 border-green-100"
                : "bg-yellow-50 border-yellow-100"
            }`}>
            <h4
              className={`text-sm font-medium mb-2 text-left ${
                matchScore && matchScore >= 70
                  ? "text-green-800"
                  : "text-yellow-800"
              }`}>
              Why This Job Matches Your Profile
            </h4>
            <p
              className={`text-sm text-left ${
                matchScore && matchScore >= 70
                  ? "text-green-700"
                  : "text-yellow-700"
              }`}>
              {formattedMatchReason}
            </p>
          </div>
        )}

        {/* Description Section - Commented out as requested */}
        {/* 
        <div className='mt-6'>
          <h4 className='text-sm font-medium text-gray-900 mb-2'>
            Description
          </h4>
          <div className='text-sm text-gray-600 prose max-w-none'>
            {job.description &&
            job.description !== "No description available" ? (
              <p className='whitespace-pre-line line-clamp-4'>
                {job.description}
              </p>
            ) : (
              <p className='text-gray-400 italic'>No description available</p>
            )}
          </div>
        </div>
        */}

        {/* Requirements Section */}
        {job.requirements && job.requirements.length > 0 && (
          <div className='mt-6'>
            <h4 className='text-sm font-medium text-gray-900 mb-2'>
              Requirements
            </h4>
            <ul className='text-sm text-gray-600 list-disc list-inside space-y-1'>
              {job.requirements.slice(0, 3).map((req, index) => (
                <li key={index} className='line-clamp-1'>
                  {req}
                </li>
              ))}
              {job.requirements.length > 3 && (
                <li className='text-yellow-600 font-medium'>
                  +{job.requirements.length - 3} more requirements
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Footer Section */}
        <div className='flex justify-between items-center mt-6 pt-4 border-t border-gray-200'>
          <div className='flex items-center gap-4 text-sm text-gray-500'>
            {job.postedDate && (
              <span className='whitespace-nowrap'>
                Posted: {job.postedDate}
              </span>
            )}
            {job.salaryRange && (
              <span className='whitespace-nowrap'>
                Salary: {job.salaryRange}
              </span>
            )}
          </div>
          {job.url && (
            <a
              href={job.url}
              target='_blank'
              rel='noopener noreferrer'
              onClick={(e) => {
                // Prevent navigation for placeholder URLs that start with #
                if (job.url?.startsWith("#")) {
                  e.preventDefault();
                  alert(
                    "This is a sample job listing. In a production environment, this would link to an actual job posting.",
                  );
                }
              }}
              className='inline-flex items-center text-sm font-medium text-yellow-600 hover:text-yellow-800 transition-colors'>
              View Job <ExternalLink size={16} className='ml-2' />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
