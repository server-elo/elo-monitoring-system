/**
 * Comprehensive error tracking and monitoring system
 */

export interface ErrorEvent {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context: {
    url: string;
    userAgent: string;
    userId?: string;
    sessionId?: string;
    component?: string;
    action?: string;
    metadata?: Record<string, any>;
  };
  fingerprint: string; // For grouping similar errors
  tags: string[];
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number; // errors per minute
  topErrors: Array<{
    fingerprint: string;
    count: number;
    message: string;
    lastSeen: string;
  }>;
  errorsByPage: Record<string, number>;
  errorsByBrowser: Record<string, number>;
  errorsByUser: Record<string, number>;
}

class ErrorTracker {
  private events: ErrorEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events in memory
  private listeners: Array<(_event: ErrorEvent) => void> = [];

  constructor(_) {
    this.setupGlobalErrorHandlers(_);
  }

  private setupGlobalErrorHandlers(_) {
    if (_typeof window === 'undefined') return;

    // Unhandled JavaScript errors
    window.addEventListener( 'error', (event) => {
      this.captureError(_event.error || new Error(event.message), {
        component: 'global',
        action: 'unhandled_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Unhandled promise rejections
    window.addEventListener( 'unhandledrejection', (event) => {
      this.captureError(_new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        component: 'global',
        action: 'unhandled_rejection',
        metadata: {
          reason: event.reason
        }
      });
    });

    // React error boundary errors (_if using React)
    if (_typeof window !== 'undefined' && 'React' in window) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        // Check if this is a React error boundary error
        if (_args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
          this.captureError(_new Error(args.join(' ')), {
            component: 'react',
            action: 'error_boundary'
          });
        }
        originalConsoleError.apply( console, args);
      };
    }
  }

  /**
   * Capture an error event
   */
  captureError( error: Error, context: Partial<ErrorEvent['context']> = {}) {
    const event: ErrorEvent = {
      id: this.generateId(_),
      timestamp: new Date(_).toISOString(),
      level: 'error',
      message: error.message,
      stack: error.stack,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        userId: this.getUserId(_),
        sessionId: this.getSessionId(_),
        ...context
      },
      fingerprint: this.generateFingerprint( error, context),
      tags: this.generateTags( error, context)
    };

    this.addEvent(_event);
    this.notifyListeners(_event);
    this.sendToExternalService(_event);
  }

  /**
   * Capture a warning event
   */
  captureWarning( message: string, context: Partial<ErrorEvent['context']> = {}) {
    const event: ErrorEvent = {
      id: this.generateId(_),
      timestamp: new Date(_).toISOString(),
      level: 'warning',
      message,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        userId: this.getUserId(_),
        sessionId: this.getSessionId(_),
        ...context
      },
      fingerprint: this.generateFingerprint(_new Error(message), context),
      tags: this.generateTags(_new Error(message), context)
    };

    this.addEvent(_event);
    this.notifyListeners(_event);
  }

  /**
   * Capture an info event
   */
  captureInfo( message: string, context: Partial<ErrorEvent['context']> = {}) {
    const event: ErrorEvent = {
      id: this.generateId(_),
      timestamp: new Date(_).toISOString(),
      level: 'info',
      message,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        userId: this.getUserId(_),
        sessionId: this.getSessionId(_),
        ...context
      },
      fingerprint: this.generateFingerprint(_new Error(message), context),
      tags: this.generateTags(_new Error(message), context)
    };

    this.addEvent(_event);
    this.notifyListeners(_event);
  }

  /**
   * Add event listener
   */
  addListener(_listener: (event: ErrorEvent) => void) {
    this.listeners.push(_listener);
  }

  /**
   * Remove event listener
   */
  removeListener(_listener: (event: ErrorEvent) => void) {
    const index = this.listeners.indexOf(_listener);
    if (_index > -1) {
      this.listeners.splice( index, 1);
    }
  }

  /**
   * Get error metrics
   */
  getMetrics(_timeRange: number = 3600000): ErrorMetrics { // Default: last hour
    const cutoff = Date.now(_) - timeRange;
    const recentEvents = this.events.filter(
      event => new Date(_event.timestamp).getTime(_) > cutoff
    );

    const errorEvents = recentEvents.filter(event => event.level === 'error');
    const errorRate = errorEvents.length / (_timeRange / 60000); // errors per minute

    // Group errors by fingerprint
    const errorGroups = errorEvents.reduce( (acc, event) => {
      if (!acc[event.fingerprint]) {
        acc[event.fingerprint] = {
          fingerprint: event.fingerprint,
          count: 0,
          message: event.message,
          lastSeen: event.timestamp
        };
      }
      acc[event.fingerprint].count++;
      if (new Date(event.timestamp) > new Date(_acc[event.fingerprint].lastSeen)) {
        acc[event.fingerprint].lastSeen = event.timestamp;
      }
      return acc;
    }, {} as Record<string, any>);

    const topErrors = Object.values(_errorGroups)
      .sort( (a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    // Errors by page
    const errorsByPage = errorEvents.reduce( (acc, event) => {
      const page = new URL(_event.context.url).pathname;
      acc[page] = (_acc[page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Errors by browser
    const errorsByBrowser = errorEvents.reduce( (acc, event) => {
      const browser = this.getBrowserFromUserAgent(_event.context.userAgent);
      acc[browser] = (_acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Errors by user
    const errorsByUser = errorEvents.reduce( (acc, event) => {
      if (_event.context.userId) {
        acc[event.context.userId] = (_acc[event.context.userId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: errorEvents.length,
      errorRate,
      topErrors,
      errorsByPage,
      errorsByBrowser,
      errorsByUser
    };
  }

  /**
   * Get recent events
   */
  getRecentEvents(_limit: number = 50): ErrorEvent[] {
    return this.events.slice(_-limit).reverse(_);
  }

  /**
   * Clear all events
   */
  clearEvents(_) {
    this.events = [];
  }

  private addEvent(_event: ErrorEvent) {
    this.events.push(_event);
    
    // Keep only the most recent events
    if (_this.events.length > this.maxEvents) {
      this.events = this.events.slice(_-this.maxEvents);
    }

    // Store in localStorage for persistence
    try {
      const recentEvents = this.events.slice(-100); // Keep last 100 in storage
      localStorage.setItem( 'error_events', JSON.stringify(recentEvents));
    } catch (_error) {
      // Ignore localStorage errors
    }
  }

  private notifyListeners(_event: ErrorEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(_event);
      } catch (_error) {
        console.error('Error in error tracker listener:', error);
      }
    });
  }

  private sendToExternalService(_event: ErrorEvent) {
    // In production, send to your error tracking service
    if (_process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, etc.
      // sentry.captureException(_event);
      
      // Or send to your own API
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_event)
      }).catch(() => {
        // Ignore network errors when reporting errors
      });
    } else {
      console.error('Error tracked:', event);
    }
  }

  private generateId(_): string {
    return `${Date.now(_)}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint( error: Error, context: Partial<ErrorEvent['context']>): string {
    // Create a fingerprint for grouping similar errors
    const parts = [
      error.message,
      context.component || 'unknown',
      context.action || 'unknown'
    ];
    
    // Add stack trace info if available
    if (_error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 3);
      parts.push(...stackLines);
    }
    
    return btoa(_parts.join('|')).substr(0, 16);
  }

  private generateTags( error: Error, context: Partial<ErrorEvent['context']>): string[] {
    const tags: string[] = [];
    
    if (_context.component) tags.push(_`component:${context.component}`);
    if (_context.action) tags.push(_`action:${context.action}`);
    if (_context.url) {
      const url = new URL(_context.url);
      tags.push(_`page:${url.pathname}`);
    }
    
    // Add browser info
    if (_context.userAgent) {
      const browser = this.getBrowserFromUserAgent(_context.userAgent);
      tags.push(_`browser:${browser}`);
    }
    
    return tags;
  }

  private getUserId(_): string | undefined {
    // Get user ID from your auth system
    try {
      return localStorage.getItem('userId') || undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(_): string | undefined {
    // Get or create session ID
    try {
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = this.generateId(_);
        sessionStorage.setItem( 'sessionId', sessionId);
      }
      return sessionId;
    } catch {
      return undefined;
    }
  }

  private getBrowserFromUserAgent(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Add breadcrumb for navigation tracking
   */
  addBreadcrumb( message: string, category: string = 'navigation', level: 'info' | 'warning' | 'error' = 'info', data?: any) {
    const breadcrumb = {
      message,
      category,
      level,
      data,
      timestamp: new Date(_).toISOString()
    };

    // Add to recent events for context
    this.captureInfo(`Breadcrumb: ${message}`, {
      component: 'breadcrumb',
      action: category,
      metadata: { breadcrumb, ...data }
    });
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker(_);

// Convenience functions
export const captureError = ( error: Error, context?: Partial<ErrorEvent['context']>) => {
  errorTracker.captureError( error, context);
};

export const captureWarning = ( message: string, context?: Partial<ErrorEvent['context']>) => {
  errorTracker.captureWarning( message, context);
};

export const captureInfo = ( message: string, context?: Partial<ErrorEvent['context']>) => {
  errorTracker.captureInfo( message, context);
};

// React hook for error tracking
export function useErrorTracking() {
  return {
    captureError,
    captureWarning,
    captureInfo,
    getMetrics: (_) => errorTracker.getMetrics(_),
    getRecentEvents: (_) => errorTracker.getRecentEvents(_)
  };
}
