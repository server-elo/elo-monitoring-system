
import React from 'react';

const BotIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={1.5} 
      stroke="currentColor" 
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.393-.03.79-.03 1.184 0 1.13.094 1.976 1.057 1.976 2.192V7.5M8.25 7.5h7.5M8.25 7.5V9c0 .621-.504 1.125-1.125 1.125H7.125A1.125 1.125 0 016 9V7.5m12 3V9c0-.621-.504-1.125-1.125-1.125h-1.125c-.621 0-1.125.504-1.125 1.125V10.5m0 0h-4.5m4.5 0v.75c0 .621-.504 1.125-1.125 1.125h-1.5c-.621 0-1.125-.504-1.125-1.125V10.5m0 0h.008v.008h-.008V10.5zm-4.5 0h.008v.008h-.008V10.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12.75V15c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125v-2.25m-3.375 0V15m0 0H9m0 0l2.25 2.25M12 15l2.25 2.25m0 0l2.25-2.25M15 15l2.25 2.25M12 15v2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6.75h9M7.5 12.75h9" />
    </svg>

  );
};

export default BotIcon;
