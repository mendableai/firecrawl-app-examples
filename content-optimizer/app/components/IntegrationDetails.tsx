import React from "react";

interface IntegrationDetailsProps {
  content?: string;
}

const IntegrationDetails: React.FC<IntegrationDetailsProps> = ({
  content = "Powered by Anthropic Claude 3.7",
}) => {
  return (
    <span className='inline-flex items-center text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 m-1 sm:m-2 max-w-[180px] sm:max-w-[200px] break-words'>
      <span className='w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 mr-1.5 sm:mr-2 flex-shrink-0'></span>
      {content}
    </span>
  );
};

export default IntegrationDetails;
