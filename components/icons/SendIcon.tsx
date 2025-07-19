
import React from 'react';

const SendIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 20 20" 
      fill="currentColor" 
      className={className}
    >
      <path d="M3.105 3.105a1.5 1.5 0 011.995-.086L16.25 9.04l.01.004a1.5 1.5 0 01.84 1.39L17.082 12a1.5 1.5 0 01-1.568 1.448L6.833 15.19l-.005.001a1.5 1.5 0 01-1.436-2.59L9.5 10l-4.102-2.608a1.5 1.5 0 01-.293-2.287z" />
    </svg>
  );
};

export default SendIcon;
