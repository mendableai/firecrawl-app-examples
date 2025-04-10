"use client";

import React from "react";
import { Key } from "lucide-react";

interface NavbarProps {
  appName?: string;
  appNameColor?: string;
}

const Navbar: React.FC<NavbarProps> = ({
  appName = "Content Optimizer",
  appNameColor = "text-[var(--primary)]",
}) => {
  return (
    <header className='w-full z-10'>
      <div className='w-full py-6 bg-white/70 shadow-sm'>
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
