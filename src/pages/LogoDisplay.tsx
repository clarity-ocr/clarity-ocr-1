// src/pages/LogoDisplay.tsx
import React from 'react';

const LogoDisplay: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-4">
      <img 
        src="/logoback.png" 
        alt="Clarify OCR Logo" 
        className="max-w-full max-h-full"
      />
    </div>
  );
};

export default LogoDisplay;