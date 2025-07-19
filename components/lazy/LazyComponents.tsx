'use client';

import React, { Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useIntersectionObserver } from '@/lib/hooks/useLazyLoading';
import { 
  DashboardCardSkeleton, 
  ChatMessageSkeleton, 
  AchievementCardSkeleton,
  UserProfileSkeleton,
  TableSkeleton 
} from '@/components/ui/LoadingSkeletons';

// Lazy load heavy components
const GamificationDashboard = lazy(() => 
  import('@/components/learning/GamificationSystem').then(module => ({
    default: module.GamificationSystem
  }))
);

const AITutoringInterface = lazy(() => 
  import('@/components/ai/EnhancedAITutor').then(module => ({
    default: module.EnhancedAITutor
  }))
);

const RealTimeCollaboration = lazy(() => 
  import('@/components/collaboration/ComprehensiveCollaborationDashboard').then(module => ({
    default: module.ComprehensiveCollaborationDashboard
  }))
);

const AdvancedAnalytics = lazy(() => 
  import('@/components/curriculum/LearningAnalytics').then(module => ({
    default: module.LearningAnalytics
  }))
);

const UserManagement = lazy(() => 
  import('@/components/admin/UserManagement').then(module => ({
    default: module.UserManagement
  }))
);

// Generic error fallback
const ComponentErrorFallback: React.FC<{ 
  error: Error; 
  resetErrorBoundary: () => void;
  componentName: string;
}> = ({ error: _error, resetErrorBoundary, componentName }) => (
  <div className="glass border border-red-400/20 rounded-lg p-6 text-center">
    <div className="text-red-400 mb-4">
      <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{componentName} Failed to Load</h3>
    <p className="text-gray-400 mb-4">
      There was an error loading this component. Please try again.
    </p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
    >
      Retry
    </button>
  </div>
);

// Lazy Gamification Dashboard
interface LazyGamificationDashboardProps {
  userId?: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyGamificationDashboard: React.FC<LazyGamificationDashboardProps> = ({
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const { ref, isInView } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return (
    <div ref={ref}>
      {isInView ? (
        <ErrorBoundary
          FallbackComponent={(errorProps) => (
            <ComponentErrorFallback {...errorProps} componentName="Gamification Dashboard" />
          )}
        >
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <AchievementCardSkeleton key={i} />
              ))}
            </div>
          }>
            <GamificationDashboard {...props} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <AchievementCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
};

// Lazy AI Tutoring Interface
interface LazyAITutoringInterfaceProps {
  lessonId?: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyAITutoringInterface: React.FC<LazyAITutoringInterfaceProps> = ({
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const { ref, isInView } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return (
    <div ref={ref}>
      {isInView ? (
        <ErrorBoundary
          FallbackComponent={(errorProps) => (
            <ComponentErrorFallback {...errorProps} componentName="AI Tutoring Interface" />
          )}
        >
          <Suspense fallback={
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <ChatMessageSkeleton key={i} isUser={i % 2 === 0} />
              ))}
            </div>
          }>
            <AITutoringInterface {...props} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <ChatMessageSkeleton key={i} isUser={i % 2 === 0} />
          ))}
        </div>
      )}
    </div>
  );
};

// Lazy Real-Time Collaboration
interface LazyRealTimeCollaborationProps {
  roomId?: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyRealTimeCollaboration: React.FC<LazyRealTimeCollaborationProps> = ({
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const { ref, isInView } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return (
    <div ref={ref}>
      {isInView ? (
        <ErrorBoundary
          FallbackComponent={(errorProps) => (
            <ComponentErrorFallback {...errorProps} componentName="Real-Time Collaboration" />
          )}
        >
          <Suspense fallback={
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DashboardCardSkeleton className="h-96" />
              </div>
              <div>
                <UserProfileSkeleton />
              </div>
            </div>
          }>
            <RealTimeCollaboration sessionId="default-session" {...props} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DashboardCardSkeleton className="h-96" />
          </div>
          <div>
            <UserProfileSkeleton />
          </div>
        </div>
      )}
    </div>
  );
};

// Lazy Advanced Analytics
interface LazyAdvancedAnalyticsProps {
  timeRange?: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyAdvancedAnalytics: React.FC<LazyAdvancedAnalyticsProps> = ({
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const { ref, isInView } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return (
    <div ref={ref}>
      {isInView ? (
        <ErrorBoundary
          FallbackComponent={(errorProps) => (
            <ComponentErrorFallback {...errorProps} componentName="Advanced Analytics" />
          )}
        >
          <Suspense fallback={
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <DashboardCardSkeleton key={i} />
                ))}
              </div>
              <DashboardCardSkeleton className="h-64" />
              <TableSkeleton rows={5} columns={4} />
            </div>
          }>
            <AdvancedAnalytics userProgress={{} as any} {...props} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <DashboardCardSkeleton key={i} />
            ))}
          </div>
          <DashboardCardSkeleton className="h-64" />
          <TableSkeleton rows={5} columns={4} />
        </div>
      )}
    </div>
  );
};

// Lazy User Management
interface LazyUserManagementProps {
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyUserManagement: React.FC<LazyUserManagementProps> = ({
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const { ref, isInView } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return (
    <div ref={ref}>
      {isInView ? (
        <ErrorBoundary
          FallbackComponent={(errorProps) => (
            <ComponentErrorFallback {...errorProps} componentName="User Management" />
          )}
        >
          <Suspense fallback={<TableSkeleton rows={10} columns={5} />}>
            <UserManagement {...props} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <TableSkeleton rows={10} columns={5} />
      )}
    </div>
  );
};

// Preload functions for critical components
export const preloadGamificationDashboard = () => {
  if (typeof window !== 'undefined') {
    import('@/components/learning/GamificationSystem');
  }
};

export const preloadAITutoringInterface = () => {
  if (typeof window !== 'undefined') {
    import('@/components/ai/EnhancedAITutor');
  }
};

export const preloadRealTimeCollaboration = () => {
  if (typeof window !== 'undefined') {
    import('@/components/collaboration/ComprehensiveCollaborationDashboard');
  }
};

export const preloadAdvancedAnalytics = () => {
  if (typeof window !== 'undefined') {
    import('@/components/curriculum/LearningAnalytics');
  }
};

// Utility to preload all heavy components
export const preloadAllHeavyComponents = () => {
  preloadGamificationDashboard();
  preloadAITutoringInterface();
  preloadRealTimeCollaboration();
  preloadAdvancedAnalytics();
};

export default {
  LazyGamificationDashboard,
  LazyAITutoringInterface,
  LazyRealTimeCollaboration,
  LazyAdvancedAnalytics,
  LazyUserManagement,
};
