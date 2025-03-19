import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import AnimatedSection from "./AnimatedSection";
import AnalyzerForm from "./AnalyzerForm";

interface HeroProps {
  onAnalyze: (url: string) => Promise<void>;
  areApiKeysSet: boolean;
}

const Hero: React.FC<HeroProps> = ({ onAnalyze, areApiKeysSet }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });

    if (titleRef.current && subtitleRef.current) {
      // Animate title
      timeline.fromTo(
        titleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
      );

      // Animate subtitle
      timeline.fromTo(
        subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.5", // Start 0.5s before previous animation finishes
      );
    }

    // Animate form
    if (formRef.current) {
      timeline.fromTo(
        formRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.4",
      );
    }

    return () => {
      timeline.kill();
    };
  }, []);

  return (
    <div className='relative bg-gradient-to-b from-white to-orange-50 dark:from-gray-900 dark:to-gray-800 min-h-screen flex flex-col justify-start pt-24 pb-10 overflow-hidden'>
      {/* Blurred Gradient Circles - more blurred and orangish */}
      <div className='absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-orange-300/40 blur-[150px] dark:bg-orange-400/30'></div>
      <div className='absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-orange-200/40 blur-[150px] dark:bg-orange-300/30'></div>
      <div className='absolute top-[40%] right-[20%] w-[400px] h-[400px] rounded-full bg-orange-100/30 blur-[120px] dark:bg-orange-200/20'></div>

      {/* Additional gradient effects for form area */}
      <div className='absolute top-[65%] left-[40%] w-[500px] h-[500px] rounded-full bg-white/30 blur-[100px] dark:bg-white/10'></div>
      <div className='absolute top-[60%] right-[30%] w-[450px] h-[450px] rounded-full bg-orange-100/40 blur-[120px] dark:bg-orange-300/20'></div>

      <div className='container px-4 mx-auto relative z-10'>
        <div className='max-w-4xl mx-auto text-center'>
          {/* Hero Content */}
          <h1
            ref={titleRef}
            className='text-5xl md:text-6xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-400'>
           Hero Optimizer
          </h1>
          <p
            ref={subtitleRef}
            className='text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-5 max-w-3xl mx-auto'>
            Analyze your website's hero section for conversion rate optimization with
            AI-powered insights
          </p>
          <div className='flex flex-wrap justify-center gap-4 mb-10'>
            <span className='inline-flex items-center text-sm font-medium px-4 py-2 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'>
              <span className='w-2 h-2 rounded-full bg-orange-500 mr-2'></span>
              Powered by Anthropic Claude 3.7
            </span>
            <span className='inline-flex items-center text-sm font-medium px-4 py-2 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'>
              <span className='w-2 h-2 rounded-full bg-orange-500 mr-2'></span>
              Firecrawl Integration
            </span>
          </div>

          {/* Form Section - Directly integrated with the hero content */}
          <div ref={formRef} className='max-w-md mx-auto mt-8'>
            <AnalyzerForm
              onAnalyze={onAnalyze}
              areApiKeysSet={areApiKeysSet}
              transparent={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
