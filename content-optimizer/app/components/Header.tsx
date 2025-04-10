import React from "react";
import { ExternalLink } from "lucide-react";

interface HeaderProps {
  content?: string;
}

const Header: React.FC<HeaderProps> = ({ content = "Content Optimizer" }) => {
  return (
    <h2 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-4 text-orange-600 dark:text-orange-400'>
      {content}
    </h2>
  );
};

export default Header;
