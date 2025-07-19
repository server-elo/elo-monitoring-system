'use client';

import React, { Suspense, lazy, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Video, Cube, FileText, Settings, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/hooks/useSettings';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { LoadingSpinner } from './LoadingStates';

// Lazy loaded components
const CodeEditor = lazy(() => import('@/components/editor/EnhancedCodeEditor'));
// const VideoPlayer = lazy(() => import('@/components/media/VideoPlayer'));
// const ThreeVisualization = lazy(() => import('@/components/3d/ThreeVisualization'));
const AdvancedSettings = lazy(() => import('@/components/settings/SettingsPage'));
const CollaborationPanel = lazy(() => import('@/components/collaboration/CollaborationHub'));
const AnalyticsDashboard = lazy(() => import('@/components/curriculum/LearningAnalytics'));

// Enhanced Lazy Loading Wrapper
interface LazyLoadingWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  error?: React.ReactNode;
  onError?: (error: Error) => void;
  componentName?: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  estimatedLoadTime?: number;
}

export function LazyLoadingWrapper({
  children,
  fallback,
  error: _error,
  onError: _onError,
  componentName = 'Component',
  icon: Icon = FileText,
  description,
  estimatedLoadTime = 2000
}: LazyLoadingWrapperProps) {
  const { settings } = useSettings();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const shouldAnimate = !settings?.accessibility?.reduceMotion;

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, estimatedLoadTime / 10);

    return () => clearInterval(interval);
  }, [estimatedLoadTime]);

  const defaultFallback = (
    <GlassContainer intensity="light" className="p-8">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Icon className={cn(
            "w-12 h-12 text-purple-500",
            shouldAnimate && "animate-pulse"
          )} />
          <div className="absolute -bottom-1 -right-1">
            <LoadingSpinner size="sm" variant="dots" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-white font-medium">Loading {componentName}</h3>
          {description && (
            <p className="text-gray-400 text-sm max-w-md">{description}</p>
          )}
        </div>
        
        <div className="w-64 bg-gray-700 rounded-full h-2">
          <motion.div
            className="h-2 rounded-full bg-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${loadingProgress}%` }}
            transition={{ duration: shouldAnimate ? 0.3 : 0 }}
          />
        </div>
        
        <div className="text-xs text-gray-400">
          {Math.round(loadingProgress)}% loaded
        </div>
      </div>
    </GlassContainer>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

// Specific Lazy Loading Components
export function LazyCodeEditor(props: any) {
  return (
    <LazyLoadingWrapper
      componentName="Code Editor"
      icon={Code}
      description="Loading the advanced Solidity code editor with syntax highlighting and IntelliSense"
      estimatedLoadTime={3000}
    >
      <CodeEditor {...props} />
    </LazyLoadingWrapper>
  );
}

export function LazyVideoPlayer(props: any) {
  return (
    <LazyLoadingWrapper
      componentName="Video Player"
      icon={Video}
      description="Loading the interactive video player with progress tracking"
      estimatedLoadTime={2000}
    >
      <VideoPlayer {...props} />
    </LazyLoadingWrapper>
  );
}

export function LazyThreeVisualization(props: any) {
  return (
    <LazyLoadingWrapper
      componentName="3D Visualization"
      icon={Cube}
      description="Loading the interactive 3D blockchain visualization"
      estimatedLoadTime={4000}
    >
      <ThreeVisualization {...props} />
    </LazyLoadingWrapper>
  );
}

export function LazyAdvancedSettings(props: any) {
  return (
    <LazyLoadingWrapper
      componentName="Advanced Settings"
      icon={Settings}
      description="Loading the comprehensive settings panel"
      estimatedLoadTime={1500}
    >
      <AdvancedSettings {...props} />
    </LazyLoadingWrapper>
  );
}

export function LazyCollaborationPanel(props: any) {
  return (
    <LazyLoadingWrapper
      componentName="Collaboration Panel"
      icon={Users}
      description="Loading the real-time collaboration features"
      estimatedLoadTime={2500}
    >
      <CollaborationPanel {...props} />
    </LazyLoadingWrapper>
  );
}

export function LazyAnalyticsDashboard(props: any) {
  return (
    <LazyLoadingWrapper
      componentName="Analytics Dashboard"
      icon={BarChart3}
      description="Loading the comprehensive analytics and metrics dashboard"
      estimatedLoadTime={3500}
    >
      <AnalyticsDashboard {...props} />
    </LazyLoadingWrapper>
  );
}

// Debounced Loading Hook
export function useDebouncedLoading(isLoading: boolean, delay: number = 300) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoading) {
      timer = setTimeout(() => setShowLoading(true), delay);
    } else {
      setShowLoading(false);
    }
    
    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return showLoading;
}

// Debounced Loading Component
interface DebouncedLoadingProps {
  isLoading: boolean;
  delay?: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function DebouncedLoading({
  isLoading,
  delay = 300,
  children,
  fallback,
  className
}: DebouncedLoadingProps) {
  const showLoading = useDebouncedLoading(isLoading, delay);
  const { settings } = useSettings();
  const shouldAnimate = !settings?.accessibility?.reduceMotion;

  if (showLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: shouldAnimate ? 0.2 : 0 }}
        className={className}
      >
        {fallback || <LoadingSpinner />}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldAnimate ? 0.2 : 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Progressive Loading Component
interface ProgressiveLoadingProps {
  stages: Array<{
    name: string;
    component: React.ReactNode;
    delay: number;
  }>;
  className?: string;
}

export function ProgressiveLoading({ stages, className }: ProgressiveLoadingProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const { settings } = useSettings();
  const shouldAnimate = !settings?.accessibility?.reduceMotion;

  useEffect(() => {
    if (currentStage < stages.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStage(prev => prev + 1);
      }, stages[currentStage].delay);
      
      return () => clearTimeout(timer);
    }
  }, [currentStage, stages]);

  return (
    <div className={className}>
      {stages.map((stage, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: index <= currentStage ? 1 : 0,
            y: index <= currentStage ? 0 : 20
          }}
          transition={{ 
            duration: shouldAnimate ? 0.3 : 0,
            delay: shouldAnimate ? index * 0.1 : 0
          }}
          className={index <= currentStage ? 'block' : 'hidden'}
        >
          {stage.component}
        </motion.div>
      ))}
    </div>
  );
}

// Intersection Observer Loading
interface IntersectionLoadingProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function IntersectionLoading({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  className
}: IntersectionLoadingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, hasLoaded]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback || <div className="h-32" />)}
    </div>
  );
}

// Network-Aware Loading
interface NetworkAwareLoadingProps {
  children: React.ReactNode;
  lowQualityFallback?: React.ReactNode;
  className?: string;
}

export function NetworkAwareLoading({
  children,
  lowQualityFallback,
  className
}: NetworkAwareLoadingProps) {
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'fast'>('fast');

  useEffect(() => {
    // Check connection speed
    const connection = (navigator as any).connection;
    if (connection) {
      const updateConnectionSpeed = () => {
        const effectiveType = connection.effectiveType;
        setConnectionSpeed(
          effectiveType === 'slow-2g' || effectiveType === '2g' ? 'slow' : 'fast'
        );
      };

      updateConnectionSpeed();
      connection.addEventListener('change', updateConnectionSpeed);
      
      return () => connection.removeEventListener('change', updateConnectionSpeed);
    }
  }, []);

  return (
    <div className={className}>
      {connectionSpeed === 'slow' && lowQualityFallback ? lowQualityFallback : children}
    </div>
  );
}
