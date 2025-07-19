import React from 'react';

interface MenuIconProps {
  className?: string;
  isOpen?: boolean;
}

const MenuIcon: React.FC<MenuIconProps> = ({ className = "w-6 h-6", isOpen = false }) => {
  return (
    <svg 
      className={`${className} transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {isOpen ? (
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M6 18L18 6M6 6l12 12" 
        />
      ) : (
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 6h16M4 12h16M4 18h16" 
        />
      )}
    </svg>
  );
};

export default MenuIcon;
