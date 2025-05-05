import React, { useEffect, useState } from 'react';

const LogoCarousel: React.FC = () => {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => (prev + 1) % 8); // 8 is the number of logos
    }, 3000); // Move every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      <p className="text-gray-600 mb-8">
        Built for Industry Leaders
      </p>
      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-1000 ease-in-out"
          style={{ transform: `translateX(-${position * 12.5}%)` }}
        >
          {/* Replace these divs with actual company logos */}
          <div className="flex-shrink-0 w-1/4 md:w-1/8 px-4">
            <div className="h-8 bg-gray-200"></div>
          </div>
          <div className="flex-shrink-0 w-1/4 md:w-1/8 px-4">
            <div className="h-8 bg-gray-200"></div>
          </div>
          <div className="flex-shrink-0 w-1/4 md:w-1/8 px-4">
            <div className="h-8 bg-gray-200"></div>
          </div>
          <div className="flex-shrink-0 w-1/4 md:w-1/8 px-4">
            <div className="h-8 bg-gray-200"></div>
          </div>
          <div className="flex-shrink-0 w-1/4 md:w-1/8 px-4">
            <div className="h-8 bg-gray-200"></div>
          </div>
          <div className="flex-shrink-0 w-1/4 md:w-1/8 px-4">
            <div className="h-8 bg-gray-200"></div>
          </div>
          <div className="flex-shrink-0 w-1/4 md:w-1/8 px-4">
            <div className="h-8 bg-gray-200"></div>
          </div>
          <div className="flex-shrink-0 w-1/4 md:w-1/8 px-4">
            <div className="h-8 bg-gray-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoCarousel;
