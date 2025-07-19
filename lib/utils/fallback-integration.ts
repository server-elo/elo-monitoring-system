/**
 * Integration utilities for fallback systems with existing platform features
 */

import { UserSettings } from '@/types/settings';
import { FeatureState } from '@/lib/features/feature-flags';
import { errorTracker } from '@/lib/monitoring/error-tracking';

/**
 * Apply user accessibility settings to fallback components
 */
export function applyAccessibilitySettings(settings: UserSettings['accessibility']) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Apply font size
  if (settings.fontSize) {
    root.style.setProperty('--fallback-font-size', `${settings.fontSize}px`);
  }

  // Apply high contrast
  if (settings.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  // Apply reduced motion
  if (settings.reducedMotion) {
    root.style.setProperty('--fallback-animation-duration', '0.01ms');
    root.classList.add('reduce-motion');
  } else {
    root.style.setProperty('--fallback-animation-duration', '');
    root.classList.remove('reduce-motion');
  }

  // Apply large click targets
  if (settings.largeClickTargets) {
    root.classList.add('large-click-targets');
  } else {
    root.classList.remove('large-click-targets');
  }

  // Apply focus indicators
  if (settings.focusIndicators) {
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

  switch (type) {
    case 'error':
      return {
        title: useSimpleLanguage ? 'Something went wrong' : 'An unexpected error occurred',
        description: useSimpleLanguage 
          ? 'We had a problem. Please try again or get help.'
          : 'We encountered an unexpected error. Our team has been notified and is working on a fix.',
        actions: getErrorActions(userRole, useSimpleLanguage)
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
        suggestions: getEmptyStateSuggestions(userRole, useSimpleLanguage)
      };

    default:
      return null;
  }
}

function getErrorActions(userRole?: string, useSimpleLanguage?: boolean) {
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

  if (userRole === 'instructor' || userRole === 'admin') {
    actions.push({
      label: useSimpleLanguage ? 'Report Problem' : 'Report Issue',
      action: 'report',
      primary: false
    });
  }

  return actions;
}

function getEmptyStateSuggestions(userRole?: string, useSimpleLanguage?: boolean) {
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

  if (userRole === 'instructor') {
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
  if (currentPage.includes('/courses')) {
    helpItems.push({
      title: useSimpleLanguage ? 'Course Help' : 'Course Navigation Help',
      description: useSimpleLanguage 
        ? 'Learn how to use courses'
        : 'Get help with navigating and using courses',
      action: () => window.open('/help/courses', '_blank')
    });
  }

  if (currentPage.includes('/playground')) {
    helpItems.push({
      title: useSimpleLanguage ? 'Code Help' : 'Playground Help',
      description: useSimpleLanguage 
        ? 'Learn how to write code'
        : 'Get help with the code playground',
      action: () => window.open('/help/playground', '_blank')
    });
  }

  // Error-specific help
  if (errorType === 'network') {
    helpItems.push({
      title: useSimpleLanguage ? 'Connection Problem' : 'Network Issues',
      description: useSimpleLanguage 
        ? 'Check your internet connection'
        : 'Troubleshoot network connectivity issues',
      action: () => window.open('/help/network', '_blank')
    });
  }

  // Role-specific help
  if (userRole === 'instructor') {
    helpItems.push({
      title: useSimpleLanguage ? 'Teacher Help' : 'Instructor Resources',
      description: useSimpleLanguage 
        ? 'Get help for teachers'
        : 'Access instructor-specific help and resources',
      action: () => window.open('/help/instructors', '_blank')
    });
  }

  // General help
  helpItems.push({
    title: useSimpleLanguage ? 'Get Help' : 'Contact Support',
    description: useSimpleLanguage 
      ? 'Talk to someone who can help'
      : 'Contact our support team for assistance',
    action: () => window.open('/support', '_blank')
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

  constructor(maxAttempts = 3, baseDelay = 1000) {
    this.maxAttempts = maxAttempts;
    this.baseDelay = baseDelay;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.attempts++;
      
      if (this.attempts >= this.maxAttempts) {
        this.reset();
        throw error;
      }

      // Exponential backoff with jitter
      const delay = this.baseDelay * Math.pow(2, this.attempts - 1);
      const jitter = Math.random() * 0.1 * delay;
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      
      return this.execute(fn);
    }
  }

  reset() {
    this.attempts = 0;
  }

  get canRetry() {
    return this.attempts < this.maxAttempts;
  }

  get attemptsRemaining() {
    return this.maxAttempts - this.attempts;
  }
}

/**
 * Offline-first data management
 */
export class OfflineDataManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`offline_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl
      }));
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  get(key: string) {
    let cached = this.cache.get(key);
    
    // Try localStorage if not in memory
    if (!cached) {
      try {
        const stored = localStorage.getItem(`offline_cache_${key}`);
        if (stored) {
          cached = JSON.parse(stored);
          if (cached) {
            this.cache.set(key, cached);
          }
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    }

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.delete(key);
      return null;
    }

    return cached.data;
  }

  delete(key: string) {
    this.cache.delete(key);
    try {
      localStorage.removeItem(`offline_cache_${key}`);
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  clear() {
    this.cache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('offline_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  has(key: string) {
    return this.get(key) !== null;
  }
}

// Global instances
export const smartRetry = new SmartRetry();
export const offlineData = new OfflineDataManager();
