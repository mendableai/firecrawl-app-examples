import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
  label?: string;
  error?: string;
  helpText?: string;
  inputSize?: "sm" | "md" | "lg";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      fullWidth = false,
      label,
      error,
      helpText,
      inputSize = "md",
      ...props
    },
    ref,
  ) => {
    const inputStyles = {
      base: "border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-30 focus:border-slate-400 transition-all bg-white dark:bg-gray-900",
      sizes: {
        sm: "py-1.5 px-3 text-sm",
        md: "py-2.5 px-4",
        lg: "py-3 px-5 text-lg",
      },
      state: {
        error:
          "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20",
        disabled: "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800",
      },
      width: fullWidth ? "w-full" : "w-auto",
    };

    const inputClasses = twMerge(
      clsx(
        inputStyles.base,
        inputStyles.sizes[inputSize],
        inputStyles.width,
        {
          [inputStyles.state.error]: error,
          [inputStyles.state.disabled]: props.disabled,
        },
        className,
      ),
    );

    return (
      <div className={fullWidth ? "w-full" : "w-auto"}>
        {label && (
          <label
            htmlFor={props.id}
            className='block mb-2 text-sm font-medium text-slate-700'>
            {label}
          </label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {helpText && !error && (
          <p className='mt-1 text-sm text-gray-500'>{helpText}</p>
        )}
        {error && <p className='mt-1 text-sm text-red-500'>{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
