import React from "react";
import { gsap } from "gsap";
import AnimatedSection from "./AnimatedSection";
import Card from "./Card";
import { AnalysisResult, ScrapedData } from "../services/api";

interface AnalysisResultsProps {
  result: AnalysisResult;
  scrapedData: ScrapedData;
  isVisible: boolean;
}

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const scoreRef = React.useRef<HTMLDivElement>(null);
  const scoreTextRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (scoreRef.current && scoreTextRef.current) {
      // Animate the score number counting up
      gsap.fromTo(
        scoreTextRef.current,
        { innerText: 0 },
        {
          innerText: score,
          duration: 2,
          ease: "power2.out",
          snap: { innerText: 1 },
          delay: 0.5,
        },
      );

      // Animate the gauge fill
      gsap.fromTo(
        scoreRef.current,
        { width: 0 },
        {
          width: `${score}%`,
          duration: 2,
          ease: "power2.out",
          delay: 0.5,
        },
      );
    }
  }, [score]);

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-[var(--primary)]";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className='my-6'>
      <div className='flex justify-between mb-2'>
        <span className='font-semibold'>CRO Score</span>
        <span ref={scoreTextRef} className='font-bold'>
          0
        </span>
      </div>
      <div className='w-full h-4 bg-gray-200 rounded-full overflow-hidden'>
        <div
          ref={scoreRef}
          className={`h-full ${getScoreColor(score)} rounded-full`}
          style={{ width: "0%" }}></div>
      </div>
    </div>
  );
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  scrapedData,
  isVisible,
}) => {
  if (!isVisible) return null;

  const { score, strengths, weaknesses, recommendations, insights } = result;

  return (
    <div className='relative w-full max-w-6xl mx-auto mt-10 px-4 mb-16'>
      {/* Enhanced gradient background effects - more blurred and orange */}
      <div className='absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full bg-orange-300/30 blur-[150px] dark:bg-orange-400/20 z-0'></div>
      <div className='absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-orange-200/30 blur-[150px] dark:bg-orange-300/20 z-0'></div>
      <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-orange-100/20 blur-[130px] dark:bg-orange-200/10 z-0'></div>

      <AnimatedSection delay={0.1} immediate={true}>
        <h2 className='text-2xl font-bold text-center mb-8'>
          Analysis Results for{" "}
          <span className='text-[var(--primary)]'>{scrapedData.title}</span>
        </h2>
      </AnimatedSection>

      <div className='relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6'>
        {/* Left Column: Score, Strengths, Weaknesses */}
        <div className='col-span-1 lg:col-span-5'>
          <AnimatedSection delay={0.2} immediate={true}>
            <Card
              title='CRO Score'
              className='relative overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-gray-800/70 shadow-xl border-white/30'>
              <div className='absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 bg-orange-400 opacity-10 rounded-full blur-[30px]'></div>
              <ScoreGauge score={score} />
              <p className='text-gray-700 dark:text-gray-300'>{insights}</p>
            </Card>
          </AnimatedSection>

          <div className='grid grid-cols-1 gap-6 mt-6'>
            <AnimatedSection delay={0.3} immediate={true}>
              <Card
                title='Strengths'
                className='h-full bg-white/80 backdrop-blur-sm dark:bg-gray-800/70 shadow-xl border-white/30'>
                <ul className='space-y-2'>
                  {strengths.map((strength, idx) => (
                    <li key={idx} className='flex items-center gap-2'>
                      <span className='text-green-500 flex-shrink-0'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          width='18'
                          height='18'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'></path>
                          <polyline points='22 4 12 14.01 9 11.01'></polyline>
                        </svg>
                      </span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={0.4} immediate={true}>
              <Card
                title='Areas to Improve'
                className='h-full bg-white/80 backdrop-blur-sm dark:bg-gray-800/70 shadow-xl border-white/30'>
                <ul className='space-y-2'>
                  {weaknesses.map((weakness, idx) => (
                    <li key={idx} className='flex items-center gap-2'>
                      <span className='text-red-500 flex-shrink-0'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          width='18'
                          height='18'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <circle cx='12' cy='12' r='10'></circle>
                          <line x1='12' y1='8' x2='12' y2='12'></line>
                          <line x1='12' y1='16' x2='12.01' y2='16'></line>
                        </svg>
                      </span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </AnimatedSection>
          </div>
        </div>

        {/* Right Column: Recommendations */}
        <div className='col-span-1 lg:col-span-7'>
          <AnimatedSection delay={0.3} immediate={true}>
            <Card
              title='Recommendations'
              className='overflow-hidden relative bg-white/80 backdrop-blur-sm dark:bg-gray-800/70 shadow-xl border-white/30'>
              <div className='absolute bottom-0 right-0 w-40 h-40 -mb-10 -mr-10 bg-orange-400 opacity-10 rounded-full blur-[30px]'></div>
              <ul className='space-y-6'>
                {recommendations.map((recommendation, idx) => (
                  <li
                    key={idx}
                    className='flex items-start gap-4 p-4 bg-white/50 dark:bg-gray-700/40 rounded-lg shadow-sm'>
                    <span className='bg-[var(--primary)] text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-lg font-medium'>
                      {idx + 1}
                    </span>
                    <span className='py-1 flex-1'>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={0.5} immediate={true}>
            <div className='text-center mt-6'>
              <h3 className='text-lg font-medium mb-2'>Extracted Content</h3>
              <div className='text-sm text-gray-600 p-4 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50'>
                <p className='font-bold'>{scrapedData.headline}</p>
                {scrapedData.subheadline && (
                  <p className='mt-2'>{scrapedData.subheadline}</p>
                )}
                {scrapedData.ctaText && (
                  <p className='mt-2 text-[var(--primary)]'>
                    CTA: {scrapedData.ctaText}
                  </p>
                )}
                {scrapedData.content && (
                  <p className='mt-4 text-left text-xs'>
                    <strong>Content Summary:</strong>{" "}
                    {scrapedData.content.substring(0, 200)}...
                  </p>
                )}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
