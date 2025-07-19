'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Base skeleton component with glassmorphism styling
interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'glass' | 'rounded' | 'circle';
  animate?: boolean;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'default',
  animate = true,
  children,
}) => {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200';
  
  const variantClasses = {
    default: 'rounded',
    glass: 'glass border border-white/10 bg-white/5',
    rounded: 'rounded-lg',
    circle: 'rounded-full',
  };

  if (animate) {
    return (
      <motion.div
        className={cn(
          baseClasses,
          variantClasses[variant],
          className
        )}
        animate={{
          backgroundPosition: ['200% 0', '-200% 0'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundSize: '200% 100%',
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
};

// Monaco Editor loading skeleton
export const MonacoEditorSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={cn('w-full h-96 glass border border-white/10 rounded-lg p-4', className)}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex space-x-2">
        <Skeleton className="w-16 h-6 rounded" />
        <Skeleton className="w-12 h-6 rounded" />
        <Skeleton className="w-14 h-6 rounded" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="w-8 h-6 rounded" />
        <Skeleton className="w-8 h-6 rounded" />
        <Skeleton className="w-8 h-6 rounded" />
      </div>
    </div>
    <div className="space-y-2">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="flex space-x-2">
          <Skeleton className="w-6 h-4 rounded" />
          <Skeleton className={`h-4 rounded ${i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-1/2' : 'w-2/3'}`} />
        </div>
      ))}
    </div>
  </div>
);

// Dashboard card skeleton
export const DashboardCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={cn('glass border border-white/10 rounded-xl p-6', className)}>
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="w-24 h-6 rounded" />
      <Skeleton className="w-8 h-8 rounded-full" />
    </div>
    <Skeleton className="w-16 h-8 rounded mb-2" />
    <Skeleton className="w-full h-4 rounded mb-4" />
    <div className="flex justify-between items-center">
      <Skeleton className="w-20 h-4 rounded" />
      <Skeleton className="w-12 h-4 rounded" />
    </div>
  </div>
);

// Lesson card skeleton
export const LessonCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={cn('glass border border-white/10 rounded-xl p-6', className)}>
    <div className="flex items-start space-x-4 mb-4">
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="w-3/4 h-6 rounded mb-2" />
        <Skeleton className="w-1/2 h-4 rounded" />
      </div>
    </div>
    <Skeleton className="w-full h-20 rounded mb-4" />
    <div className="flex items-center justify-between">
      <div className="flex space-x-2">
        <Skeleton className="w-16 h-6 rounded-full" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <Skeleton className="w-24 h-8 rounded" />
    </div>
  </div>
);

// User profile skeleton
export const UserProfileSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={cn('glass border border-white/10 rounded-xl p-6', className)}>
    <div className="flex items-center space-x-4 mb-6">
      <Skeleton className="w-16 h-16 rounded-full" />
      <div className="flex-1">
        <Skeleton className="w-32 h-6 rounded mb-2" />
        <Skeleton className="w-24 h-4 rounded" />
      </div>
    </div>
    <div className="space-y-4">
      <div>
        <Skeleton className="w-20 h-4 rounded mb-2" />
        <Skeleton className="w-full h-2 rounded" />
      </div>
      <div>
        <Skeleton className="w-24 h-4 rounded mb-2" />
        <Skeleton className="w-3/4 h-2 rounded" />
      </div>
      <div>
        <Skeleton className="w-28 h-4 rounded mb-2" />
        <Skeleton className="w-1/2 h-2 rounded" />
      </div>
    </div>
  </div>
);

// Chat message skeleton
export const ChatMessageSkeleton: React.FC<{ isUser?: boolean; className?: string }> = ({ 
  isUser = false, 
  className = '' 
}) => (
  <div className={cn('flex space-x-3 mb-4', isUser && 'flex-row-reverse space-x-reverse', className)}>
    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
    <div className={cn('flex-1 max-w-xs', isUser && 'flex flex-col items-end')}>
      <Skeleton className={cn('h-4 rounded mb-1', isUser ? 'w-16 ml-auto' : 'w-20')} />
      <div className={cn('glass border border-white/10 rounded-lg p-3', isUser && 'bg-blue-600/20')}>
        <Skeleton className="w-full h-4 rounded mb-2" />
        <Skeleton className="w-3/4 h-4 rounded" />
      </div>
    </div>
  </div>
);

// Achievement card skeleton
export const AchievementCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={cn('glass border border-white/10 rounded-xl p-4', className)}>
    <div className="flex items-center space-x-3 mb-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="w-24 h-5 rounded mb-1" />
        <Skeleton className="w-16 h-3 rounded" />
      </div>
    </div>
    <Skeleton className="w-full h-3 rounded mb-2" />
    <div className="flex justify-between items-center">
      <Skeleton className="w-12 h-4 rounded" />
      <Skeleton className="w-8 h-4 rounded" />
    </div>
  </div>
);

// Navigation skeleton
export const NavigationSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <nav className={cn('glass border-b border-white/10 h-16', className)}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
      <div className="flex justify-between items-center h-full">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-32 h-6 rounded" />
        </div>
        <div className="hidden md:flex items-center space-x-6">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="w-16 h-6 rounded" />
          ))}
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-24 h-8 rounded" />
        </div>
      </div>
    </div>
  </nav>
);

// Table skeleton
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string; 
}> = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => (
  <div className={cn('glass border border-white/10 rounded-lg overflow-hidden', className)}>
    <div className="p-4 border-b border-white/10">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-5 rounded" />
        ))}
      </div>
    </div>
    <div className="divide-y divide-white/10">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Page skeleton with layout
export const PageSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={cn('min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900', className)}>
    <NavigationSkeleton />
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Skeleton className="w-64 h-8 rounded mb-4" />
        <Skeleton className="w-96 h-5 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>
    </main>
  </div>
);

export default Skeleton;
