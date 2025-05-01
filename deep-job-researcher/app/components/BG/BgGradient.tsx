import React from "react";

interface BgGradientProps {
  children: React.ReactNode;
}

const BgGradient: React.FC<BgGradientProps> = ({ children }) => {
  return (
    <div className='relative bg-gradient-to-b from-white to-orange-50 dark:from-gray-900 dark:to-gray-800 min-h-screen flex flex-col justify-start pt-24 pb-20 overflow-hidden'>
      {/* Blurred Gradient Circles - responsive sizing */}
      <div className='fixed top-[-10%] left-[-5%] w-[50%] h-[50vh] md:w-[600px] md:h-[600px] rounded-full bg-orange-300/40 blur-[150px] dark:bg-orange-400/30 z-0'></div>
      <div className='fixed bottom-[-10%] right-[-5%] w-[50%] h-[50vh] md:w-[600px] md:h-[600px] rounded-full bg-orange-200/40 blur-[150px] dark:bg-orange-300/30 z-0'></div>
      <div className='fixed top-[40%] right-[10%] w-[40%] h-[40vh] md:w-[400px] md:h-[400px] rounded-full bg-orange-100/30 blur-[120px] dark:bg-orange-200/20 z-0'></div>

      {/* Additional gradient effects for form area - responsive sizing */}
      <div className='fixed top-[65%] left-[30%] w-[45%] h-[45vh] md:w-[500px] md:h-[500px] rounded-full bg-white/30 blur-[100px] dark:bg-white/10 z-0'></div>
      <div className='fixed top-[60%] right-[20%] w-[40%] h-[40vh] md:w-[450px] md:h-[450px] rounded-full bg-orange-100/40 blur-[120px] dark:bg-orange-300/20 z-0'></div>

      <div className='container px-4 mx-auto relative z-10 flex justify-center items-center h-full text-center'>
        {children}
      </div>
    </div>
  );
};

export default BgGradient;
