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
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  footer,
  bordered = true,
  hoverable = false,
}) => {
  // Check if the card has a transparent background by looking for bg-white/60 or similar patterns
  const isTransparent =
    className?.includes("/") && !className?.includes("bg-white ");

  const cardClasses = twMerge(
    clsx(
      "rounded-xl overflow-hidden transition-all duration-300",
      {
        "bg-white": !isTransparent,
        "border border-gray-200": bordered && !isTransparent,
        "border border-white/20": bordered && isTransparent,
        "shadow-sm": !isTransparent,
        "shadow-lg backdrop-blur-sm": isTransparent,
        "hover:shadow-md transform hover:-translate-y-1": hoverable,
      },
      className,
    ),
  );

  return (
    <div className={cardClasses}>
      {(title || subtitle) && (
        <div className='px-6 pt-5 pb-3'>
          {title && (
            <h3 className='text-xl font-semibold text-[var(--foreground)]'>
              {title}
            </h3>
          )}
          {subtitle && <p className='text-sm text-gray-500 mt-1'>{subtitle}</p>}
        </div>
      )}
      <div className='px-6 py-4'>{children}</div>
      {footer && (
        <div
          className={`px-6 py-4 ${
            isTransparent ? "bg-gray-50/50" : "bg-gray-50"
          } border-t border-gray-100`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
