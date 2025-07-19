'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/hooks/useSettings';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  'aria-label'?: string;
  delay?: number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  'aria-label': ariaLabel,
  delay = 0
}: SkeletonProps) {
  const [isVisible, setIsVisible] = useState(delay === 0);
  const { settings } = useSettings();

  // Respect user's reduced motion preference
  const shouldAnimate = !settings?.accessibility?.reduceMotion && animation !== 'none';

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  const baseClasses = 'bg-gradient-to-r from-gray-700/50 via-gray-600/50 to-gray-700/50 backdrop-blur-sm';

  const variantClasses = {
    text: 'rounded-sm',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: shouldAnimate ? 'animate-pulse' : '',
    wave: shouldAnimate ? 'animate-shimmer' : '',
    none: ''
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldAnimate ? 0.3 : 0 }}
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      role="status"
      aria-label={ariaLabel || "Loading content"}
      aria-live="polite"
    />
  );
}

// Course Card Skeleton
export function CourseCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-4">
      {/* Course Image */}
      <Skeleton className="w-full h-48 rounded-lg" />
      
      {/* Course Title */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Course Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      {/* Course Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" className="w-6 h-6" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

// Lesson Content Skeleton
export function LessonContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      
      {/* Video Player */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
        <Skeleton className="w-full h-64 rounded-lg" />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Skeleton variant="circular" className="w-8 h-8" />
            <Skeleton variant="circular" className="w-8 h-8" />
            <Skeleton variant="circular" className="w-8 h-8" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      
      {/* Lesson Content */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Code Block */}
        <div className="bg-gray-900/50 rounded-lg p-4 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}

// User Profile Skeleton
export function UserProfileSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
      {/* Profile Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton variant="circular" className="w-20 h-20" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center space-y-2">
            <Skeleton className="h-8 w-16 mx-auto" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>
      
      {/* Bio */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

// Dashboard Grid Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton variant="circular" className="w-10 h-10" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Activity Feed */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <Skeleton className="h-6 w-24 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton variant="circular" className="w-8 h-8" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// List Skeleton (for course lists, etc.)
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-16 h-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/10">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Progressive Loading Component
export function ProgressiveLoader({
  isLoading,
  error,
  children,
  skeleton,
  onRetry,
  loadingText = "Loading...",
  errorText = "Failed to load content"
}: {
  isLoading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  onRetry?: () => void;
  loadingText?: string;
  errorText?: string;
}) {
  if (error) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-red-500/20 rounded-xl p-6 text-center">
        <div className="text-red-400 mb-2">{errorText}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-red-300 hover:text-red-200 underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return skeleton || (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
        <div className="text-gray-400 text-sm">{loadingText}</div>
      </div>
    );
  }

  return <>{children}</>;
}
