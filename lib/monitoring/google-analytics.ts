/**
 * Google Analytics 4 Integration with Core Web Vitals
 * 
 * Provides comprehensive analytics tracking including user behavior,
 * performance metrics, and Core Web Vitals for production monitoring.
 */

import { env } from '@/lib/config/environment';
import { logger } from './simple-logger';

/**
 * GA4 Event structure
 */
interface GA4Event {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

/**
 * Core Web Vitals data structure
 */
interface WebVitalData {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
}

/**
 * User properties for enhanced tracking
 */
interface UserProperties {
  user_role?: string;
  subscription_type?: string;
  learning_level?: string;
  preferred_language?: string;
  device_type?: string;
  session_count?: number;
}

/**
 * Enhanced learning analytics events
 */
interface LearningEvent {
  event_name: 
    | 'lesson_start'
    | 'lesson_complete'
    | 'quiz_attempt'
    | 'quiz_complete'
    | 'code_submission'
    | 'collaboration_join'
    | 'achievement_unlock'
    | 'course_enroll'
    | 'course_complete'
    | 'ai_interaction';
  
  lesson_id?: string;
  course_id?: string;
  quiz_score?: number;
  completion_time?: number;
  difficulty_level?: string;
  success?: boolean;
  collaboration_type?: string;
  achievement_type?: string;
  ai_model?: string;
  interaction_type?: string;
}

/**
 * Google Analytics 4 Manager
 */
class GoogleAnalytics {
  private initialized = false;
  private measurementId: string | null = null;
  private eventQueue: GA4Event[] = [];
  private webVitalsData: WebVitalData[] = [];

  constructor() {
    this.measurementId = env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null;
    this.initialize();
  }

  /**
   * Initialize Google Analytics 4
   */
  private async initialize(): Promise<void> {
    if (!this.measurementId) {
      logger.warn('Google Analytics Measurement ID not configured');
      return;
    }

    if (typeof window === 'undefined') {
      return; // Server-side, skip initialization
    }

    try {
      // Load gtag script
      await this.loadGtagScript();
      
      // Configure GA4
      this.configureGA4();
      
      // Set up Core Web Vitals tracking
      this.setupWebVitalsTracking();
      
      // Set up enhanced ecommerce tracking
      this.setupEnhancedEcommerce();
      
      // Process queued events
      this.processEventQueue();
      
      this.initialized = true;
      
      logger.info('Google Analytics 4 initialized successfully', {
        measurementId: this.measurementId,
        webVitalsEnabled: true
      });

    } catch (error) {
      logger.error('Failed to initialize Google Analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        measurementId: this.measurementId
      });
    }
  }

  /**
   * Load Google Analytics gtag script
   */
  private loadGtagScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gtag) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      
      script.onload = () => {
        // Initialize gtag function
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
          window.dataLayer.push(arguments);
        };
        
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Analytics script'));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Configure GA4 with enhanced settings
   */
  private configureGA4(): void {
    if (!window.gtag || !this.measurementId) return;

    // Initialize GA4
    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      // Privacy and compliance
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      
      // Enhanced tracking
      send_page_view: true,
      page_title: document.title,
      page_location: window.location.href,
      
      // Custom dimensions and metrics
      custom_map: {
        custom_dimension_1: 'user_role',
        custom_dimension_2: 'learning_level',
        custom_dimension_3: 'device_type',
        custom_dimension_4: 'session_duration',
        custom_metric_1: 'lesson_completion_time',
        custom_metric_2: 'quiz_score',
        custom_metric_3: 'code_submissions'
      },
      
      // Debugging (development only)
      debug_mode: env.NODE_ENV === 'development'
    });

    // Set default user properties
    this.setUserProperties({
      device_type: this.getDeviceType(),
      session_count: this.getSessionCount()
    });
  }

  /**
   * Set up Core Web Vitals tracking
   */
  private setupWebVitalsTracking(): void {
    if (!window.gtag) return;

    // Import web-vitals library dynamically
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      // Track all Core Web Vitals
      onCLS((metric) => this.reportWebVital(metric));
      onFID((metric) => this.reportWebVital(metric));
      onFCP((metric) => this.reportWebVital(metric));
      onLCP((metric) => this.reportWebVital(metric));
      onTTFB((metric) => this.reportWebVital(metric));
      onINP((metric) => this.reportWebVital(metric));
      
      logger.info('Core Web Vitals tracking enabled');
    }).catch((error) => {
      logger.warn('Failed to load web-vitals library', {
        error: error.message
      });
    });
  }

  /**
   * Set up enhanced ecommerce tracking for course purchases
   */
  private setupEnhancedEcommerce(): void {
    if (!window.gtag) return;

    // Track course views as product views
    window.addEventListener('course-view', (event: any) => {
      const { course } = event.detail || {};
      
      if (course) {
        window.gtag('event', 'view_item', {
          currency: 'USD',
          value: course.price || 0,
          items: [{
            item_id: course.id,
            item_name: course.title,
            item_category: course.category,
            item_category2: course.difficulty,
            price: course.price || 0,
            quantity: 1
          }]
        });
      }
    });

    // Track course enrollments as purchases
    window.addEventListener('course-enroll', (event: any) => {
      const { course, user } = event.detail || {};
      
      if (course) {
        window.gtag('event', 'purchase', {
          transaction_id: `enroll_${course.id}_${Date.now()}`,
          value: course.price || 0,
          currency: 'USD',
          items: [{
            item_id: course.id,
            item_name: course.title,
            item_category: course.category,
            item_category2: course.difficulty,
            price: course.price || 0,
            quantity: 1
          }]
        });
      }
    });
  }

  /**
   * Report Core Web Vital to Google Analytics
   */
  private reportWebVital(metric: any): void {
    const webVitalData: WebVitalData = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType
    };

    this.webVitalsData.push(webVitalData);

    if (window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
        custom_parameter_rating: metric.rating,
        custom_parameter_navigation_type: metric.navigationType || 'unknown'
      });
    }

    // Also report to custom monitoring
    logger.info(`Core Web Vital: ${metric.name}`, {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id
    });
  }

  /**
   * Track learning events
   */
  public trackLearningEvent(event: LearningEvent): void {
    if (!this.initialized && window.gtag) {
      this.eventQueue.push({
        action: event.event_name,
        category: 'Learning',
        custom_parameters: event
      });
      return;
    }

    if (window.gtag) {
      window.gtag('event', event.event_name, {
        event_category: 'Learning',
        ...event,
        custom_parameter_timestamp: Date.now()
      });
    }
  }

  /**
   * Track user engagement
   */
  public trackEngagement(action: string, details?: Record<string, any>): void {
    this.trackEvent({
      action,
      category: 'Engagement',
      custom_parameters: {
        ...details,
        timestamp: Date.now(),
        session_id: this.getSessionId()
      }
    });
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(metric: string, value: number, context?: Record<string, any>): void {
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        event_category: 'Performance',
        event_label: metric,
        value: Math.round(value),
        custom_parameter_context: JSON.stringify(context || {})
      });
    }
  }

  /**
   * Track feature usage
   */
  public trackFeature(feature: string, action: string, success: boolean = true): void {
    this.trackEvent({
      action: `${feature}_${action}`,
      category: 'Feature',
      label: success ? 'success' : 'failure',
      value: success ? 1 : 0
    });
  }

  /**
   * Set user properties
   */
  public setUserProperties(properties: UserProperties): void {
    if (window.gtag) {
      window.gtag('config', this.measurementId!, {
        user_properties: properties
      });
    }
  }

  /**
   * Track page view
   */
  public trackPageView(path: string, title?: string): void {
    if (window.gtag) {
      window.gtag('config', this.measurementId!, {
        page_path: path,
        page_title: title || document.title
      });
    }
  }

  /**
   * Generic event tracking
   */
  public trackEvent(event: GA4Event): void {
    if (!this.initialized) {
      this.eventQueue.push(event);
      return;
    }

    if (window.gtag) {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.custom_parameters
      });
    }
  }

  /**
   * Process queued events
   */
  private processEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.trackEvent(event);
      }
    }
  }

  /**
   * Get device type for tracking
   */
  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'server';
    
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server-session';
    
    let sessionId = sessionStorage.getItem('ga_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('ga_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get session count
   */
  private getSessionCount(): number {
    if (typeof window === 'undefined') return 0;
    
    const count = localStorage.getItem('ga_session_count');
    const newCount = count ? parseInt(count) + 1 : 1;
    localStorage.setItem('ga_session_count', newCount.toString());
    return newCount;
  }

  /**
   * Get current Web Vitals data
   */
  public getWebVitalsData(): WebVitalData[] {
    return [...this.webVitalsData];
  }

  /**
   * Export analytics data for debugging
   */
  public exportAnalyticsData(): any {
    return {
      initialized: this.initialized,
      measurementId: this.measurementId,
      webVitals: this.webVitalsData,
      queuedEvents: this.eventQueue.length,
      sessionId: this.getSessionId(),
      deviceType: this.getDeviceType()
    };
  }
}

// Create singleton instance
const googleAnalytics = new GoogleAnalytics();

// Export convenience functions
export const ga4 = {
  trackEvent: (event: GA4Event) => googleAnalytics.trackEvent(event),
  trackLearning: (event: LearningEvent) => googleAnalytics.trackLearningEvent(event),
  trackEngagement: (action: string, details?: Record<string, any>) => googleAnalytics.trackEngagement(action, details),
  trackPerformance: (metric: string, value: number, context?: Record<string, any>) => googleAnalytics.trackPerformance(metric, value, context),
  trackFeature: (feature: string, action: string, success?: boolean) => googleAnalytics.trackFeature(feature, action, success),
  trackPageView: (path: string, title?: string) => googleAnalytics.trackPageView(path, title),
  setUserProperties: (properties: UserProperties) => googleAnalytics.setUserProperties(properties),
  getWebVitals: () => googleAnalytics.getWebVitalsData(),
  exportData: () => googleAnalytics.exportAnalyticsData()
};

export default googleAnalytics;