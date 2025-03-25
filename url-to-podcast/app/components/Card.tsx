import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  bordered?: boolean;
  hoverable?: boolean;
  accent?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  footer,
  bordered = true,
  hoverable = true,
  accent = false,
}) => {
  // Check if the card has a transparent background by looking for bg-white/60 or similar patterns
  const isTransparent =
    className?.includes("/") && !className?.includes("bg-white ");

  const cardClasses = twMerge(
    clsx(
      "rounded-xl overflow-hidden transition-all duration-300",
      {
        "bg-[var(--card-bg)]": !isTransparent,
        "border border-[var(--card-border)]": bordered && !isTransparent,
        "border border-white/20": bordered && isTransparent,
        "shadow-md": !isTransparent,
        "shadow-lg backdrop-blur-sm": isTransparent,
        "hover:shadow-xl hover:-translate-y-1": hoverable,
        "border-l-4 border-l-[var(--primary)]": accent,
      },
      className,
    ),
  );

  return (
    <div className={cardClasses}>
      {(title || subtitle) && (
        <div className={`p-6 ${subtitle ? "pb-3" : ""}`}>
          {title && (
            <h3 className='text-xl font-semibold orange-gradient-text'>
              {title}
            </h3>
          )}
          {subtitle && <p className='text-sm text-gray-500 mt-1'>{subtitle}</p>}
        </div>
      )}
      <div className={`px-6 py-4 ${!title && !subtitle ? "pt-6" : ""}`}>
        {children}
      </div>
      {footer && (
        <div
          className={`px-6 py-4 ${
            isTransparent ? "bg-gray-50/50" : "bg-gray-50/80"
          } border-t border-[var(--card-border)]`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
