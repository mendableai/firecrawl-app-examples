"use client";

import React from "react";
import { Key } from "lucide-react";

interface NavbarProps {
  appName?: string;
  appNameColor?: string;
}

const Navbar: React.FC<NavbarProps> = ({
  appName = "Deep Job Researcher",
  appNameColor = "text-[var(--primary)]",
}) => {
  return (
    <header className='relative top-0 left-0 right-0 z-50'>
      <div className='w-full py-6 backdrop-blur-sm bg-white/40'>
        <div className='container mx-auto px-4 flex justify-between items-center'>
          <h1 className={`text-xl font-semibold ${appNameColor}`}>
            {appName}{" "}
            <span className='text-orange-500'>
              <a href='https://firecrawl.dev' target='_blank'>
                by Firecrawl 🔥
              </a>
            </span>
          </h1>
          <nav className='flex items-center gap-4'>
            <a
              href='https://firecrawl.dev'
              target='_blank'
              rel='noopener noreferrer'
              className='text-[var(--foreground)] hover:text-[var(--primary)] transition-colors flex items-center gap-2'>
              <Key size={16} className='text-orange-500' />
              Get Your Firecrawl API Keys
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
