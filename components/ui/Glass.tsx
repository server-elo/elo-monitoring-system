'use client';

import { ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassProps {
  children: ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg';
  opacity?: number;
}

export const Glass = ({ 
  children, 
  className = '', 
  blur = 'md',
  opacity = 0.1 
}: GlassProps): ReactElement => {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
  };

  return (
    <div
      className={cn(
        'bg-white/10 border border-white/20 rounded-lg',
        blurClasses[blur],
        className
      )}
      style={{ backgroundColor: `rgba(255, 255, 255, ${opacity})` }}
    >
      {children}
    </div>
  );
};

// Additional exports for compatibility
export const GlassCard = Glass;

export default Glass;