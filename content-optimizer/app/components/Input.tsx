import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error = false,
      fullWidth = false,
      icon,
      className,
      ...props
    },
    ref,
  ) => {
    // Check if the input should have a transparent background
    const hasTransparentBg =
      className?.includes("bg-white/") || className?.includes("dark:bg-");

    const inputClasses = twMerge(
      clsx(
        "px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2",
        {
          "border-gray-300 focus:border-[var(--primary)] focus:ring-[var(--primary-light)] focus:ring-opacity-50":
            !error,
          "border-red-500 focus:border-red-500 focus:ring-red-200": error,
          "w-full": fullWidth,
          "pl-10": icon,
          "bg-white dark:bg-gray-800": !hasTransparentBg,
          "backdrop-blur-[2px]": hasTransparentBg,
        },
        className,
      ),
    );

    return (
      <div className={clsx("flex flex-col gap-1", { "w-full": fullWidth })}>
        {label && (
          <label className='font-medium text-sm text-gray-700 dark:text-gray-300'>
            {label}
          </label>
        )}
        <div className='relative'>
          {icon && (
            <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
              {icon}
            </div>
          )}
          <input ref={ref} className={inputClasses} {...props} />
        </div>
        {helperText && (
          <p
            className={clsx(
              "text-xs",
              error ? "text-red-500" : "text-gray-500 dark:text-gray-400",
            )}>
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
