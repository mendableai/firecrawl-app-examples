import { motion, MotionProps } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedSectionProps extends MotionProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  distance?: number;
}

export default function AnimatedSection({
  children,
  delay = 0,
  className = "",
  direction = "up",
  duration = 0.5,
  distance = 20,
  ...props
}: AnimatedSectionProps) {
  // Calculate initial animation values based on direction
  const getInitialValues = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: distance };
      case "down":
        return { opacity: 0, y: -distance };
      case "left":
        return { opacity: 0, x: distance };
      case "right":
        return { opacity: 0, x: -distance };
      case "none":
        return { opacity: 0 };
      default:
        return { opacity: 0, y: distance };
    }
  };

  // Calculate animate values based on direction
  const getAnimateValues = () => {
    switch (direction) {
      case "up":
      case "down":
        return { opacity: 1, y: 0 };
      case "left":
      case "right":
        return { opacity: 1, x: 0 };
      case "none":
        return { opacity: 1 };
      default:
        return { opacity: 1, y: 0 };
    }
  };

  // Combine with any other props passed to the component
  return (
    <motion.div
      initial={getInitialValues()}
      animate={getAnimateValues()}
      transition={{ 
        duration: duration, 
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1.0] // Improved easing curve
      }}
      className={className}
      {...props}>
      {children}
    </motion.div>
  );
}
