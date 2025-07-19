import React, { useState } from 'react';

// Simple Check icon for "Copied" state
const CheckIconMini: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// Simple Clipboard icon for "Copy" state
const ClipboardIconMini: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);


interface CopyButtonProps {
  textToCopy: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // You could add more user-friendly error handling here if needed
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-50
                  ${isCopied 
                    ? 'bg-brand-success/80 text-white' 
                    : 'bg-brand-surface-1 hover:bg-brand-bg-medium text-brand-text-muted hover:text-brand-text-secondary'}`}
      aria-label={isCopied ? 'Copied to clipboard' : 'Copy code to clipboard'}
      title={isCopied ? 'Copied!' : 'Copy code'}
    >
      {isCopied ? <CheckIconMini /> : <ClipboardIconMini />}
    </button>
  );
};

export default CopyButton;
