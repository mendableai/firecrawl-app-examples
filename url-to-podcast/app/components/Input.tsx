import React, { useState, useEffect, KeyboardEvent } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "motion/react";
import { CornerDownLeft } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  typewriterEffect?: boolean;
  isUrl?: boolean;
  onEnterSubmit?: (value: string) => void;
  showEnterIcon?: boolean;
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
      typewriterEffect = false,
      placeholder = "",
      isUrl = false,
      onEnterSubmit,
      onChange,
      showEnterIcon = false,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [displayPlaceholder, setDisplayPlaceholder] = useState("");
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [isFocused, setIsFocused] = useState(false);

    // Typewriter effect for placeholder
    useEffect(() => {
      if (!typewriterEffect || !placeholder) return;

      // Initial reset when component mounts
      setDisplayPlaceholder("");
      setPlaceholderIndex(0);

      // Create the typing animation with appropriate timing
      const typingAnimation = () => {
        let currentIndex = 0;

        const intervalId = setInterval(() => {
          if (currentIndex <= placeholder.toString().length) {
            setDisplayPlaceholder(
              placeholder.toString().substring(0, currentIndex),
            );
            setPlaceholderIndex(currentIndex);
            currentIndex++;
          } else {
            clearInterval(intervalId);
          }
        }, 70); // Changed from 100ms to 70ms for faster typing

        return intervalId;
      };

      const intervalId = typingAnimation();

      // Cleanup the interval on component unmount
      return () => clearInterval(intervalId);
    }, [placeholder, typewriterEffect]);

    // Handle URL normalization and onChange
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
    };

    // Handle focus event
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) {
        onFocus(e);
      }
    };

    // Normalize URL when blurring the input
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      if (isUrl && e.target.value && !e.target.value.match(/^https?:\/\//)) {
        const normalizedUrl = `https://${e.target.value}`;
        // Update the input value with the normalized URL
        e.target.value = normalizedUrl;
        // Create a synthetic event to trigger onChange
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: normalizedUrl,
          },
        } as React.ChangeEvent<HTMLInputElement>;

        if (onChange) {
          onChange(syntheticEvent);
        }
      }

      if (onBlur) {
        onBlur(e);
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onEnterSubmit) {
        e.preventDefault(); // Prevent default form submission
        let value = e.currentTarget.value;

        // Normalize URL if needed before submitting
        if (isUrl && value && !value.match(/^https?:\/\//)) {
          value = `https://${value}`;
          // Update the input value with the normalized URL
          e.currentTarget.value = value;
        }

        onEnterSubmit(value);
      }

      if (props.onKeyDown) {
        props.onKeyDown(e as any);
      }
    };

    // Handle Enter icon click
    const handleEnterIconClick = () => {
      if (onEnterSubmit && ref && "current" in ref && ref.current) {
        let value = ref.current.value;

        // Normalize URL if needed before submitting
        if (isUrl && value && !value.match(/^https?:\/\//)) {
          value = `https://${value}`;
          // Update the input value with the normalized URL
          ref.current.value = value;
        }

        // Call the onEnterSubmit directly - form submission will be handled by the parent
        onEnterSubmit(value);
      }
    };

    // Check if the input should have a transparent background
    const hasTransparentBg =
      className?.includes("bg-white/") || className?.includes("dark:bg-");

    const inputClasses = twMerge(
      clsx(
        "px-4 py-2 rounded-xl border transition-all duration-200 focus:outline-none",
        {
          "border-gray-300 focus:border-[var(--primary)]": !error,
          "border-red-500 focus:border-orange -500 focus:border-grey-100":
            error,
          "w-full": fullWidth,
          "pl-10": icon,
          "pr-10": showEnterIcon,
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
          <input
            ref={ref}
            className={inputClasses}
            placeholder={typewriterEffect ? displayPlaceholder : placeholder}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            {...props}
          />

          {showEnterIcon && onEnterSubmit && (
            <div
              className='absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-transparent text-black cursor-pointer hover:text-gray-700 transition-colors'
              onClick={handleEnterIconClick}
              title='Press Enter to Submit'>
              <CornerDownLeft size={14} />
            </div>
          )}

          {typewriterEffect && props.value === "" && !isFocused && (
            <motion.span
              className='absolute left-[calc(3.5rem+0.69ch*var(--char-count)-1px)] top-1/2 transform -translate-y-[calc(50%-1px)] h-5 w-0.5 bg-amber-500 opacity-80'
              style={
                {
                  "--char-count": displayPlaceholder.length,
                } as React.CSSProperties
              }
              animate={{
                opacity: [0, 1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.7,
              }}
              initial={{ opacity: 1 }}
            />
          )}
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
