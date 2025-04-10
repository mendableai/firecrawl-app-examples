import React, { useState, useEffect, ReactNode } from "react";
import { X, Settings } from "lucide-react";

interface SidebarProps {
  // Content to be displayed inside the sidebar
  children: ReactNode;

  // Configuration for the sidebar
  title?: string;
  subtitle?: string;

  // Configuration for the toggle button
  buttonIcon?: ReactNode;
  buttonLabel?: string;

  // Status indicators
  isConfigured?: boolean;
  statusText?: {
    configured: string;
    notConfigured: string;
  };

  // Custom styling
  headerClassName?: string;
}

const ReusableSidebar: React.FC<SidebarProps> = ({
  children,
  title = "Settings",
  subtitle = "Configure your settings",
  buttonIcon = <Settings size={24} />,
  buttonLabel = "Toggle settings",
  isConfigured = false,
  statusText = {
    configured: "Settings ✓",
    notConfigured: "Configure Settings",
  },
  headerClassName = "bg-gradient-to-r from-orange-500 to-orange-600",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("reusable-sidebar");
      const button = document.getElementById("toggle-sidebar-button");

      if (
        sidebar &&
        button &&
        !sidebar.contains(event.target as Node) &&
        !button.contains(event.target as Node) &&
        isOpen &&
        window.innerWidth < 768
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button with Floating Label */}
      <div className='fixed bottom-4 right-4 z-50 flex flex-col items-end'>
        {/* Show Status */}
        <div
          className={`mb-2 rounded-full px-3 py-1 text-sm font-medium shadow-lg text-white transition-all ${
            isConfigured ? "bg-green-500" : "bg-amber-500 animate-pulse"
          }`}>
          {isConfigured ? statusText.configured : statusText.notConfigured}
        </div>

        <button
          id='toggle-sidebar-button'
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg transition-all duration-300 ${
            isConfigured
              ? "bg-[var(--primary)] hover:bg-orange-700"
              : "bg-amber-500 animate-pulse-slow hover:bg-amber-600"
          }`}
          aria-label={buttonLabel}>
          {buttonIcon}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile only) */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden backdrop-blur-sm'
          aria-hidden='true'
        />
      )}

      {/* Sidebar */}
      <div
        id='reusable-sidebar'
        className={`fixed top-0 right-0 h-full bg-white shadow-xl z-[60] transition-all duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "w-full max-w-md translate-x-0" : "translate-x-full"
        }`}>
        {/* Sidebar Header */}
        <div className={`text-white p-5 ${headerClassName}`}>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-bold'>{title}</h2>
              <p className='text-sm text-orange-100 mt-1'>{subtitle}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className='p-2 rounded-full hover:bg-white/10 text-white'
              aria-label='Close sidebar'>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className='p-5'>{children}</div>
      </div>
    </>
  );
};

export default ReusableSidebar;
