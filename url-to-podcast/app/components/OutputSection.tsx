import React, { forwardRef } from "react";
import Card from "./Card";

interface OutputSectionProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

const OutputSection = forwardRef<HTMLDivElement, OutputSectionProps>(
  (
    {
      title = "Analysis Results",
      children,
      className = "",
      id = "output-section",
    },
    ref,
  ) => {
    return (
      <section ref={ref} id={id} className={`pt-12 pb-24 px-4 ${className}`}>
        <div className='w-full max-w-4xl mx-auto'>
          <h2 className='text-2xl md:text-3xl font-bold mb-6 text-center text-orange-600 font-sans'>
            {title}
          </h2>

          <Card className='shadow-lg border-orange-100/70 overflow-hidden bg-white/40'>
            <div className='p-4 md:p-6'>{children}</div>
          </Card>
        </div>
      </section>
    );
  },
);

OutputSection.displayName = "OutputSection";

export default OutputSection;
