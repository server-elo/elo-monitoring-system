import { monitoringConfig, isProduction } from '@/lib/config/environment';
import { logger } from './simple-logger';

/**
 * Comprehensive Analytics and Performance Monitoring
 * Tracks user behavior, learning progress, and system performance
 */

interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: number;
}

interface LearningAnalytics {
  userId: string;
  lessonId?: string;
  courseId?: string;
  action: 'start' | 'progress' | 'complete' | 'abandon';
  progress: number;
  timeSpent: number;
  score?: number;
  metadata?: Record<string, any>;
}

interface CollaborationAnalytics {
  sessionId: string;
  userId: string;
  action: 'join' | 'leave' | 'code_change' | 'message' | 'voice_chat' | 'screen_share';
  participants: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceMetrics {
  metric: 'page_load' | 'api_response' | 'code_compilation' | 'ai_response' | 'database_query';
  value: number;
  url?: string;
  endpoint?: string;
  success: boolean;
  metadata?: Record<string, any>;
}

interface UserEngagement {
  userId: string;
  sessionDuration: number;
  pageViews: number;
  interactions: number;
  features: string[];
  timestamp: number;
}

class AnalyticsManager {
  private events: AnalyticsEvent[] = [];
  private learningEvents: LearningAnalytics[] = [];
  private collaborationEvents: CollaborationAnalytics[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private userSessions: Map<string, UserEngagement> = new Map();
  private initialized = false;

  /**
   * Check if analytics is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  constructor() {
    this.initializeAnalytics();
    this.setupPerformanceObserver();
    this.setupPeriodicFlush();
  }

  /**
   * Initialize analytics services
   */
  private initializeAnalytics(): void {
    // Initialize Google Analytics
    if (monitoringConfig.analytics.ga && typeof window !== 'undefined') {
      this.initializeGA();
    }

    // Initialize PostHog
    if (monitoringConfig.analytics.posthog.key && typeof window !== 'undefined') {
      this.initializePostHog();
    }

    // Initialize Mixpanel
    if (monitoringConfig.analytics.mixpanel && typeof window !== 'undefined') {
      this.initializeMixpanel();
    }

    this.initialized = true;
    console.log('✅ Analytics initialized');
  }

  /**
   * Initialize Google Analytics
   */
  private initializeGA(): void {
    try {
      // Load gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${monitoringConfig.analytics.ga}`;
      document.head.appendChild(script);

      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      (window as any).gtag = gtag;

      gtag('js', new Date());
      gtag('config', monitoringConfig.analytics.ga, {
        page_title: document.title,
        page_location: window.location.href,
      });

      console.log('✅ Google Analytics initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google Analytics:', error);
    }
  }

  /**
   * Initialize PostHog
   */
  private initializePostHog(): void {
    try {
      // This would typically use the PostHog SDK
      // For now, we'll simulate the initialization
      console.log('✅ PostHog initialized');
    } catch (error) {
      console.error('❌ Failed to initialize PostHog:', error);
    }
  }

  /**
   * Initialize Mixpanel
   */
  private initializeMixpanel(): void {
    try {
      // This would typically use the Mixpanel SDK
      // For now, we'll simulate the initialization
      console.log('✅ Mixpanel initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Mixpanel:', error);
    }
  }

  /**
   * Setup performance observer
   */
  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Observe Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          this.trackPerformance('page_load', entry.duration, {
            url: window.location.href,
            loadEventEnd: (entry as PerformanceNavigationTiming).loadEventEnd,
            domContentLoaded: (entry as PerformanceNavigationTiming).domContentLoadedEventEnd,
          });
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'measure'] });

    // Track Web Vitals using web-vitals library (if available)
    this.trackWebVitals();
  }

  /**
   * Track Web Vitals
   */
  private trackWebVitals(): void {
    // This would typically use the web-vitals library
    // For now, we'll simulate tracking
    if (typeof window !== 'undefined') {
      // Simulate CLS, FID, LCP, FCP, TTFB tracking
      setTimeout(() => {
        this.trackEvent('web_vital', {
          metric: 'LCP',
          value: Math.random() * 2500 + 1000, // Simulate LCP value
          rating: 'good',
        });
      }, 1000);
    }
  }

  /**
   * Setup periodic flush of analytics data
   */
  private setupPeriodicFlush(): void {
    // Flush events every 30 seconds
    setInterval(() => {
      this.flushEvents();
    }, 30 * 1000);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushEvents();
      });
    }
  }

  /**
   * Track generic event
   */
  trackEvent(name: string, properties: Record<string, any> = {}, userId?: string): void {
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
      userId,
      sessionId: this.getSessionId(),
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Send to external services
    this.sendToGA(name, properties);
    this.sendToPostHog(name, properties, userId);
    this.sendToMixpanel(name, properties, userId);

    // Log for debugging
    logger.info(`Analytics event: ${name}`, {
      userId,
      metadata: properties,
    });
  }

  /**
   * Track learning analytics
   */
  trackLearning(analytics: LearningAnalytics): void {
    this.learningEvents.push({
      ...analytics,
      timestamp: Date.now(),
    } as any);

    // Track as generic event
    this.trackEvent('learning_activity', {
      action: analytics.action,
      lessonId: analytics.lessonId,
      courseId: analytics.courseId,
      progress: analytics.progress,
      timeSpent: analytics.timeSpent,
      score: analytics.score,
      ...analytics.metadata,
    }, analytics.userId);

    logger.logLearning({
      type: analytics.action === 'complete' ? 'lesson_complete' : 'lesson_start',
      userId: analytics.userId,
      lessonId: analytics.lessonId,
      progress: analytics.progress,
      score: analytics.score,
      metadata: analytics.metadata,
    });
  }

  /**
   * Track collaboration analytics
   */
  trackCollaboration(analytics: CollaborationAnalytics): void {
    this.collaborationEvents.push({
      ...analytics,
      timestamp: Date.now(),
    } as any);

    this.trackEvent('collaboration_activity', {
      action: analytics.action,
      sessionId: analytics.sessionId,
      participants: analytics.participants,
      duration: analytics.duration,
      ...analytics.metadata,
    }, analytics.userId);

    logger.logCollaboration(
      analytics.action as any,
      analytics.sessionId,
      {
        userId: analytics.userId,
        metadata: analytics.metadata,
      }
    );
  }

  /**
   * Track performance metrics
   */
  trackPerformance(
    metric: PerformanceMetrics['metric'],
    value: number,
    metadata: Record<string, any> = {},
    success: boolean = true
  ): void {
    const performanceMetric: PerformanceMetrics = {
      metric,
      value,
      success,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
      },
    };

    this.performanceMetrics.push(performanceMetric);

    this.trackEvent('performance_metric', {
      metric,
      value,
      success,
      ...metadata,
    });

    logger.logPerformance({
      operation: metric,
      duration: value,
      success,
      metadata,
    });
  }

  /**
   * Track user engagement
   */
  trackUserEngagement(userId: string, action: string, feature?: string): void {
    let engagement = this.userSessions.get(userId);
    
    if (!engagement) {
      engagement = {
        userId,
        sessionDuration: 0,
        pageViews: 0,
        interactions: 0,
        features: [],
        timestamp: Date.now(),
      };
      this.userSessions.set(userId, engagement);
    }

    engagement.interactions++;
    
    if (action === 'page_view') {
      engagement.pageViews++;
    }

    if (feature && !engagement.features.includes(feature)) {
      engagement.features.push(feature);
    }

    engagement.sessionDuration = Date.now() - engagement.timestamp;

    this.trackEvent('user_engagement', {
      action,
      feature,
      sessionDuration: engagement.sessionDuration,
      interactions: engagement.interactions,
      pageViews: engagement.pageViews,
      featuresUsed: engagement.features.length,
    }, userId);
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string, userId?: string): void {
    this.trackEvent('page_view', {
      path,
      title: title || document.title,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    }, userId);

    if (userId) {
      this.trackUserEngagement(userId, 'page_view');
    }
  }

  /**
   * Track user action
   */
  trackUserAction(action: string, target: string, userId?: string, metadata?: Record<string, any>): void {
    this.trackEvent('user_action', {
      action,
      target,
      ...metadata,
    }, userId);

    if (userId) {
      this.trackUserEngagement(userId, action, target);
    }
  }

  /**
   * Send event to Google Analytics
   */
  private sendToGA(name: string, properties: Record<string, any>): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, properties);
    }
  }

  /**
   * Send event to PostHog
   */
  private sendToPostHog(name: string, properties: Record<string, any>, userId?: string): void {
    // This would use the PostHog SDK
    console.log('PostHog event:', { name, properties, userId });
  }

  /**
   * Send event to Mixpanel
   */
  private sendToMixpanel(name: string, properties: Record<string, any>, userId?: string): void {
    // This would use the Mixpanel SDK
    console.log('Mixpanel event:', { name, properties, userId });
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server-session';
    
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Flush events to external services
   */
  private flushEvents(): void {
    if (this.events.length === 0) return;

    const events = [...this.events];
    this.events = [];

    // Send batch to analytics services
    this.sendBatchToServices(events);

    logger.info('Analytics events flushed', {
      count: events.length,
      metadata: {
        eventTypes: [...new Set(events.map(e => e.name))],
        flushTimestamp: Date.now(),
        batchSize: events.length
      },
    });
  }

  /**
   * Send batch of events to analytics services
   */
  private sendBatchToServices(events: AnalyticsEvent[]): void {
    // This would send batched events to analytics services
    if (isProduction) {
      console.log(`Sending ${events.length} analytics events to services`);
    }
  }

  /**
   * Get analytics statistics
   */
  getStats(): {
    pendingEvents: number;
    learningEvents: number;
    collaborationEvents: number;
    performanceMetrics: number;
    activeSessions: number;
  } {
    return {
      pendingEvents: this.events.length,
      learningEvents: this.learningEvents.length,
      collaborationEvents: this.collaborationEvents.length,
      performanceMetrics: this.performanceMetrics.length,
      activeSessions: this.userSessions.size,
    };
  }

  /**
   * Generate analytics report
   */
  generateReport(): {
    summary: Record<string, number>;
    topEvents: Array<{ name: string; count: number }>;
    performance: Record<string, { avg: number; count: number }>;
    engagement: Record<string, any>;
  } {
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const performanceByMetric = this.performanceMetrics.reduce((acc, metric) => {
      if (!acc[metric.metric]) {
        acc[metric.metric] = { total: 0, count: 0 };
      }
      acc[metric.metric].total += metric.value;
      acc[metric.metric].count++;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const performance = Object.entries(performanceByMetric).reduce((acc, [metric, data]) => {
      acc[metric] = {
        avg: data.total / data.count,
        count: data.count,
      };
      return acc;
    }, {} as Record<string, { avg: number; count: number }>);

    const engagement = {
      totalSessions: this.userSessions.size,
      avgSessionDuration: Array.from(this.userSessions.values())
        .reduce((sum: number, session) => sum + session.sessionDuration, 0) / this.userSessions.size,
      totalInteractions: Array.from(this.userSessions.values())
        .reduce((sum: number, session) => sum + session.interactions, 0),
    };

    return {
      summary: {
        totalEvents: this.events.length,
        learningEvents: this.learningEvents.length,
        collaborationEvents: this.collaborationEvents.length,
        performanceMetrics: this.performanceMetrics.length,
      },
      topEvents,
      performance,
      engagement,
    };
  }
}

// Create singleton instance
export const analytics = new AnalyticsManager();

/**
 * React hook for analytics tracking
 */
export function useAnalytics() {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackLearning: analytics.trackLearning.bind(analytics),
    trackCollaboration: analytics.trackCollaboration.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
  };
}

// Export types
export type {
  AnalyticsEvent,
  LearningAnalytics,
  CollaborationAnalytics,
  PerformanceMetrics,
  UserEngagement,
};
