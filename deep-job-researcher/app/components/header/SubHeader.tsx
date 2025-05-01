import React from "react";
import { ExternalLink } from "lucide-react";

interface SubHeaderProps {
  content?: string;
}

const SubHeader: React.FC<SubHeaderProps> = ({
  content = "🔥 Deep Job Researcher",
}) => {
  return (
    <p className='text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-5 max-w-2xl mx-auto px-4'>
      {content}
    </p>
  );
};

export default SubHeader;
