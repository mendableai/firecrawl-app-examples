"use client";

import { motion } from "framer-motion";
import { FiCheck, FiLoader } from "react-icons/fi";
import Card from "./Card";

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
  isProcessing: boolean;
}

export default function ProgressBar({
  steps,
  currentStep,
  isProcessing,
}: ProgressBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='w-full max-w-3xl mx-auto mb-8'>
      <Card>
        <div className='flex flex-wrap justify-between mb-2 relative'>
          {/* Progress line */}
          <div className='absolute left-0 right-0 top-5 h-1 bg-gray-200 -z-10'></div>
          <div
            className='absolute left-0 top-5 h-1 bg-[var(--primary)] -z-10 transition-all duration-500'
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
              opacity: 0.8,
            }}
          />

          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div
                key={index}
                className={`flex flex-col items-center ${
                  index === 0 ? "pl-0" : ""
                } ${index === steps.length - 1 ? "pr-0" : ""}`}>
                {/* Step indicator */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 z-10 transition-all duration-300 ${
                    isCompleted
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                      : isActive
                      ? "border-[var(--primary)] text-[var(--primary)] bg-white"
                      : "border-gray-300 text-gray-300 bg-white"
                  }`}>
                  {isCompleted ? (
                    <FiCheck className='w-5 h-5' />
                  ) : isActive && isProcessing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}>
                      <FiLoader className='w-5 h-5' />
                    </motion.div>
                  ) : (
                    <span className='text-sm font-semibold'>{index + 1}</span>
                  )}
                </div>
                {/* Step label */}
                <span
                  className={`mt-2 text-xs whitespace-nowrap font-medium ${
                    isCompleted
                      ? "text-gray-700"
                      : isActive
                      ? "text-[var(--primary)]"
                      : "text-gray-400"
                  }`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
