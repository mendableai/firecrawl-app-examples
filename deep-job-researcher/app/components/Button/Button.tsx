import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "default";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  squared?: boolean;
  buttonContent?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      squared = false,
      buttonContent,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "font-medium transition-all transform hover:scale-[1.03] active:scale-[0.98] focus:outline-none inline-flex justify-center items-center";

    const roundedStyle = squared ? "rounded-md" : "rounded-md";

    const variantStyles = {
      primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]",
      secondary: "bg-[var(--secondary)] text-white hover:bg-opacity-90",
      outline:
        "border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:bg-opacity-10",
      ghost:
        "text-[var(--primary)] hover:bg-[var(--primary)] hover:bg-opacity-10",
    };

    const sizeStyles = {
      sm: "text-sm py-1.5 px-3",
      md: "text-base py-2 px-5",
      lg: "text-lg py-2.5 px-6",
      default: "py-3 px-5 text-base",
    };

    const loadingStyles = isLoading && "opacity-80 cursor-not-allowed";
    const disabledStyles = disabled && "opacity-60 cursor-not-allowed";
    const widthStyles = fullWidth ? "w-full" : "";

    const buttonClasses = twMerge(
      clsx(
        baseStyles,
        roundedStyle,
        variantStyles[variant],
        sizeStyles[size],
        loadingStyles,
        disabledStyles,
        widthStyles,
        className,
      ),
    );

    // Use buttonContent prop if provided, otherwise use children
    const displayContent = buttonContent || children;

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={isLoading || disabled}
        {...props}>
        {isLoading ? (
          <span className='flex items-center justify-center'>
            <svg
              className='animate-spin -ml-1 mr-2 h-4 w-4 text-current'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'>
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
            </svg>
            Loading...
          </span>
        ) : (
          displayContent
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
