/**
 * Integration utilities for fallback systems with existing platform features
 */

import { UserSettings } from '@/types/settings';
import { FeatureState } from '@/lib/features/feature-flags';
import { errorTracker } from '@/lib/monitoring/error-tracking';

/**
 * Apply user accessibility settings to fallback components
 */
export function applyAccessibilitySettings(_settings: UserSettings['accessibility']) {
  if (_typeof document === 'undefined') return;

  const root = document.documentElement;

  // Apply font size
  if (_settings.fontSize) {
    root.style.setProperty( '--fallback-font-size', `${settings.fontSize}px`);
  }

  // Apply high contrast
  if (_settings.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  // Apply reduced motion
  if (_settings.reducedMotion) {
    root.style.setProperty( '--fallback-animation-duration', '0.01ms');
    root.classList.add('reduce-motion');
  } else {
    root.style.setProperty( '--fallback-animation-duration', '');
    root.classList.remove('reduce-motion');
  }

  // Apply large click targets
  if (_settings.largeClickTargets) {
    root.classList.add('large-click-targets');
  } else {
    root.classList.remove('large-click-targets');
  }

  // Apply focus indicators
  if (_settings.focusIndicators) {
    root.classList.add('enhanced-focus');
  } else {
    root.classList.remove('enhanced-focus');
  }
}

/**
 * Get fallback content based on user preferences
 */
export function getFallbackContent(
  type: 'error' | 'loading' | 'empty',
  context: {
    userSettings?: UserSettings;
    featureState?: FeatureState;
    userRole?: 'student' | 'instructor' | 'admin';
  }
) {
  const { userSettings, featureState: _featureState, userRole } = context;

  // Adjust content based on accessibility settings
  const useSimpleLanguage = userSettings?.accessibility?.simpleLanguage;
  const showDetailedStats = userSettings?.learning?.progressTracking?.showDetailedStats;

  switch (_type) {
    case 'error':
      return {
        title: useSimpleLanguage ? 'Something went wrong' : 'An unexpected error occurred',
        description: useSimpleLanguage 
          ? 'We had a problem. Please try again or get help.'
          : 'We encountered an unexpected error. Our team has been notified and is working on a fix.',
        actions: getErrorActions( userRole, useSimpleLanguage)
      };

    case 'loading':
      return {
        title: useSimpleLanguage ? 'Loading...' : 'Loading content',
        description: useSimpleLanguage 
          ? 'Please wait while we get your content.'
          : 'Please wait while we load your content. This should only take a moment.',
        showProgress: showDetailedStats
      };

    case 'empty':
      return {
        title: useSimpleLanguage ? 'Nothing here yet' : 'No content available',
        description: useSimpleLanguage 
          ? 'There is nothing to show right now. Try looking somewhere else.'
          : 'There is no content available at the moment. You can explore other sections or try again later.',
        suggestions: getEmptyStateSuggestions( userRole, useSimpleLanguage)
      };

    default:
      return null;
  }
}

function getErrorActions( userRole?: string, useSimpleLanguage?: boolean) {
  const actions = [
    {
      label: useSimpleLanguage ? 'Try Again' : 'Retry',
      action: 'retry',
      primary: true
    },
    {
      label: useSimpleLanguage ? 'Go Home' : 'Return to Dashboard',
      action: 'home',
      primary: false
    }
  ];

  if (_userRole === 'instructor' || userRole === 'admin') {
    actions.push({
      label: useSimpleLanguage ? 'Report Problem' : 'Report Issue',
      action: 'report',
      primary: false
    });
  }

  return actions;
}

function getEmptyStateSuggestions( userRole?: string, useSimpleLanguage?: boolean) {
  const suggestions = [
    {
      label: useSimpleLanguage ? 'See Courses' : 'Browse Courses',
      href: '/courses'
    },
    {
      label: useSimpleLanguage ? 'Go Home' : 'Return to Dashboard',
      href: '/'
    }
  ];

  if (_userRole === 'instructor') {
    suggestions.unshift({
      label: useSimpleLanguage ? 'Make Course' : 'Create Course',
      href: '/instructor/courses/new'
    });
  }

  return suggestions;
}

/**
 * Track fallback usage for analytics
 */
export function trackFallbackUsage(
  type: 'error_boundary' | 'empty_state' | 'loading_timeout' | 'offline_mode',
  context: {
    component?: string;
    page?: string;
    userRole?: string;
    duration?: number;
    metadata?: Record<string, any>;
  }
) {
  errorTracker.captureInfo(`Fallback used: ${type}`, {
    component: context.component || 'unknown',
    action: 'fallback_usage',
    metadata: {
      fallbackType: type,
      page: context.page || window.location.pathname,
      userRole: context.userRole,
      duration: context.duration,
      ...context.metadata
    }
  });
}

/**
 * Generate contextual help based on current state
 */
export function generateContextualHelp(
  errorType: string,
  userContext: {
    currentPage: string;
    userRole?: string;
    recentActions?: string[];
    settings?: UserSettings;
  }
) {
  const { currentPage, userRole, recentActions: _recentActions, settings } = userContext;
  const useSimpleLanguage = settings?.accessibility?.simpleLanguage;

  const helpItems = [];

  // Page-specific help
  if (_currentPage.includes('/courses')) {
    helpItems.push({
      title: useSimpleLanguage ? 'Course Help' : 'Course Navigation Help',
      description: useSimpleLanguage 
        ? 'Learn how to use courses'
        : 'Get help with navigating and using courses',
      action: (_) => window.open( '/help/courses', '_blank')
    });
  }

  if (_currentPage.includes('/playground')) {
    helpItems.push({
      title: useSimpleLanguage ? 'Code Help' : 'Playground Help',
      description: useSimpleLanguage 
        ? 'Learn how to write code'
        : 'Get help with the code playground',
      action: (_) => window.open( '/help/playground', '_blank')
    });
  }

  // Error-specific help
  if (_errorType === 'network') {
    helpItems.push({
      title: useSimpleLanguage ? 'Connection Problem' : 'Network Issues',
      description: useSimpleLanguage 
        ? 'Check your internet connection'
        : 'Troubleshoot network connectivity issues',
      action: (_) => window.open( '/help/network', '_blank')
    });
  }

  // Role-specific help
  if (_userRole === 'instructor') {
    helpItems.push({
      title: useSimpleLanguage ? 'Teacher Help' : 'Instructor Resources',
      description: useSimpleLanguage 
        ? 'Get help for teachers'
        : 'Access instructor-specific help and resources',
      action: (_) => window.open( '/help/instructors', '_blank')
    });
  }

  // General help
  helpItems.push({
    title: useSimpleLanguage ? 'Get Help' : 'Contact Support',
    description: useSimpleLanguage 
      ? 'Talk to someone who can help'
      : 'Contact our support team for assistance',
    action: (_) => window.open( '/support', '_blank')
  });

  return helpItems;
}

/**
 * Smart retry logic with exponential backoff
 */
export class SmartRetry {
  private attempts = 0;
  private maxAttempts = 3;
  private baseDelay = 1000; // 1 second

  constructor( maxAttempts = 3, baseDelay = 1000) {
    this.maxAttempts = maxAttempts;
    this.baseDelay = baseDelay;
  }

  async execute<T>(_fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn(_);
      this.reset(_);
      return result;
    } catch (_error) {
      this.attempts++;
      
      if (_this.attempts >= this.maxAttempts) {
        this.reset(_);
        throw error;
      }

      // Exponential backoff with jitter
      const delay = this.baseDelay * Math.pow( 2, this.attempts - 1);
      const jitter = Math.random() * 0.1 * delay;
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      
      return this.execute(_fn);
    }
  }

  reset(_) {
    this.attempts = 0;
  }

  get canRetry(_) {
    return this.attempts < this.maxAttempts;
  }

  get attemptsRemaining(_) {
    return this.maxAttempts - this.attempts;
  }
}

/**
 * Offline-first data management
 */
export class OfflineDataManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>(_);
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set( key: string, data: any, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(_),
      ttl
    });

    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`offline_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(_),
        ttl
      }));
    } catch (_error) {
      // Ignore localStorage errors
    }
  }

  get(_key: string) {
    let cached = this.cache.get(_key);
    
    // Try localStorage if not in memory
    if (!cached) {
      try {
        const stored = localStorage.getItem(_`offline_cache_${key}`);
        if (stored) {
          cached = JSON.parse(_stored);
          if (cached) {
            this.cache.set( key, cached);
          }
        }
      } catch (_error) {
        // Ignore localStorage errors
      }
    }

    if (!cached) return null;

    // Check if expired
    if (_Date.now() - cached.timestamp > cached.ttl) {
      this.delete(_key);
      return null;
    }

    return cached.data;
  }

  delete(_key: string) {
    this.cache.delete(_key);
    try {
      localStorage.removeItem(_`offline_cache_${key}`);
    } catch (_error) {
      // Ignore localStorage errors
    }
  }

  clear(_) {
    this.cache.clear(_);
    try {
      const keys = Object.keys(_localStorage);
      keys.forEach(key => {
        if (_key.startsWith('offline_cache')) {
          localStorage.removeItem(_key);
        }
      });
    } catch (_error) {
      // Ignore localStorage errors
    }
  }

  has(_key: string) {
    return this.get(_key) !== null;
  }
}

// Global instances
export const smartRetry = new SmartRetry(_);
export const offlineData = new OfflineDataManager(_);
