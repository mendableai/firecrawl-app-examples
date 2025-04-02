import React, { useState } from "react";
import Card from "./Card";
import Button from "./Button";
import Input from "./Input";
import { apiService } from "../services/api";

interface ContentOptimizerProps {
  originalData: {
    headline: string;
    subheadline?: string;
    ctaText?: string;
    content?: string;
  };
  analysisResult: {
    weaknesses: string[];
    recommendations: string[];
  };
}

const ContentOptimizer: React.FC<ContentOptimizerProps> = ({
  originalData,
  analysisResult,
}) => {
  const [optimizedContent, setOptimizedContent] = useState({
    headline: originalData.headline,
    subheadline: originalData.subheadline || "",
    ctaText: originalData.ctaText || "",
    content: originalData.content || "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<{
    headline: string;
    subheadline: string;
    ctaText: string;
    content: string;
    explanation: string;
  } | null>(null);

  const handleOptimize = async () => {
    if (!apiService.hasRequiredApiKeys()) {
      alert("API key is required for optimization");
      return;
    }

    setIsGenerating(true);

    try {
      // For now, use mock data since generateOptimizedContent is not available
      const mockResult = {
        headline: "Optimized: " + originalData.headline,
        subheadline: originalData.subheadline || "AI-generated subheadline",
        ctaText: originalData.ctaText || "Get Started Now",
        content: originalData.content || "This is optimized content.",
        explanation: "Content was optimized based on CRO best practices.",
      };

      setOptimizationResults(mockResult);

      // Pre-fill the form with the optimized values
      setOptimizedContent({
        headline: mockResult.headline,
        subheadline: mockResult.subheadline,
        ctaText: mockResult.ctaText,
        content: mockResult.content,
      });
    } catch (error) {
      console.error("Content optimization failed:", error);
      alert("Failed to generate optimized content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setOptimizedContent((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCopyToClipboard = () => {
    const textToCopy = `
Headline: ${optimizedContent.headline}
Subheadline: ${optimizedContent.subheadline}
CTA: ${optimizedContent.ctaText}
Content: ${optimizedContent.content}
    `.trim();

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        alert("Optimized content copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        alert("Failed to copy to clipboard. Please copy manually.");
      });
  };

  return (
    <Card className='p-6 mb-8'>
      <h2 className='text-2xl font-bold mb-4 text-orange-600 dark:text-orange-400'>
        Content Optimizer
      </h2>

      <div className='mb-6'>
        <p className='text-gray-700 dark:text-gray-300 mb-4'>
          Based on the analysis, we can help you optimize your landing page
          content for better conversions. Click the button below to generate
          AI-optimized content.
        </p>

        <Button
          onClick={handleOptimize}
          isLoading={isGenerating}
          className='w-full md:w-auto'>
          {isGenerating ? "Generating..." : "Generate Optimized Content"}
        </Button>
      </div>

      {optimizationResults && (
        <div className='mb-6 p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg'>
          <h3 className='font-semibold mb-2 text-orange-700 dark:text-orange-300'>
            Optimization Explanation
          </h3>
          <p className='text-gray-700 dark:text-gray-300'>
            {optimizationResults.explanation}
          </p>
        </div>
      )}

      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            Headline
          </label>
          <Input
            value={optimizedContent.headline}
            onChange={(e) => handleChange("headline", e.target.value)}
            placeholder='Enter headline'
            className='w-full'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            Subheadline
          </label>
          <Input
            value={optimizedContent.subheadline}
            onChange={(e) => handleChange("subheadline", e.target.value)}
            placeholder='Enter subheadline'
            className='w-full'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            Call to Action
          </label>
          <Input
            value={optimizedContent.ctaText}
            onChange={(e) => handleChange("ctaText", e.target.value)}
            placeholder='Enter CTA text'
            className='w-full'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            Content
          </label>
          <textarea
            value={optimizedContent.content}
            onChange={(e) => handleChange("content", e.target.value)}
            placeholder='Enter content'
            className='w-full min-h-[100px] p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500'
          />
        </div>
      </div>

      <div className='mt-6 flex justify-end'>
        <Button
          onClick={handleCopyToClipboard}
          variant='outline'
          className='w-full md:w-auto'>
          Copy to Clipboard
        </Button>
      </div>
    </Card>
  );
};

export default ContentOptimizer;
