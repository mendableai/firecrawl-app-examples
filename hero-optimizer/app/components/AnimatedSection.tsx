import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger with GSAP
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  triggerPosition?: string;
  duration?: number;
  from?: any;
}

const defaultFrom = {
  y: 30,
  opacity: 0,
};

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  delay = 0,
  className = "",
  triggerPosition = "top 80%",
  duration = 0.8,
  from = defaultFrom,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const element = sectionRef.current;

    // Create animation on component mount
    const anim = gsap.fromTo(element, from, {
      y: 0,
      opacity: 1,
      duration: duration,
      delay: delay,
      ease: "power2.out",
      scrollTrigger: {
        trigger: element,
        start: triggerPosition,
        toggleActions: "play none none none",
      },
    });

    // Clean up animation on component unmount
    return () => {
      anim.kill();
      if (anim.scrollTrigger) {
        anim.scrollTrigger.kill();
      }
    };
  }, [delay, triggerPosition, duration, from]);

  return (
    <div ref={sectionRef} className={className}>
      {children}
    </div>
  );
};

export default AnimatedSection;
