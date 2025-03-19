import React, { useState } from "react";
import Card from "./Card";
import Button from "./Button";
import Input from "./Input";
import apiService from "../services/api";

interface HeroOptimizerProps {
  originalData: {
    headline: string;
    subheadline?: string;
    ctaText?: string;
  };
  analysisResult: {
    weaknesses: string[];
    recommendations: string[];
  };
}

const HeroOptimizer: React.FC<HeroOptimizerProps> = ({
  originalData,
  analysisResult,
}) => {
  const [optimizedHero, setOptimizedHero] = useState({
    headline: originalData.headline,
    subheadline: originalData.subheadline || "",
    ctaText: originalData.ctaText || "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<{
    headline: string;
    subheadline: string;
    ctaText: string;
    explanation: string;
  } | null>(null);

  const handleOptimize = async () => {
    if (!apiService.hasAnthropicApiKey()) {
      alert("Anthropic API key is required for optimization");
      return;
    }

    setIsGenerating(true);

    try {
      const result = await apiService.generateOptimizedHero({
        originalHero: originalData,
        weaknesses: analysisResult.weaknesses,
        recommendations: analysisResult.recommendations,
      });

      setOptimizationResults(result);

      // Pre-fill the form with the optimized values
      setOptimizedHero({
        headline: result.headline,
        subheadline: result.subheadline,
        ctaText: result.ctaText,
      });
    } catch (error) {
      console.error("Hero optimization failed:", error);
      alert("Failed to generate optimized hero. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setOptimizedHero((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCopyToClipboard = () => {
    const textToCopy = `
Headline: ${optimizedHero.headline}
Subheadline: ${optimizedHero.subheadline}
CTA: ${optimizedHero.ctaText}
    `.trim();

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        alert("Hero content copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        alert("Failed to copy to clipboard. Please copy manually.");
      });
  };

  return (
    <Card className='p-6 mb-8'>
      <h2 className='text-2xl font-bold mb-4 text-orange-600 dark:text-orange-400'>
        Hero Section Optimizer
      </h2>

      <div className='mb-6'>
        <p className='text-gray-700 dark:text-gray-300 mb-4'>
          Based on the analysis, we can help you optimize your hero section for
          better conversions. Click the button below to generate AI-optimized
          hero content.
        </p>

        <Button
          onClick={handleOptimize}
          isLoading={isGenerating}
          className='w-full md:w-auto'>
          {isGenerating ? "Generating..." : "Generate Optimized Hero Content"}
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
            value={optimizedHero.headline}
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
            value={optimizedHero.subheadline}
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
            value={optimizedHero.ctaText}
            onChange={(e) => handleChange("ctaText", e.target.value)}
            placeholder='Enter CTA text'
            className='w-full'
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

export default HeroOptimizer;
