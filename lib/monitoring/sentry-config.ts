/**
 * Complete Sentry Configuration for Production Monitoring
 * 
 * Provides comprehensive error tracking, performance monitoring,
 * and source map configuration for production deployments.
 */

import * as Sentry from '@sentry/nextjs';
import { env, monitoringConfig, isProduction } from '@/lib/config/environment';
import { logger } from './simple-logger';

/**
 * Enhanced Sentry configuration with production optimizations
 */
export function configureSentry(): void {
  if (!monitoringConfig.sentry.dsn) {
    if (isProduction) {
      logger.error('Sentry DSN not configured for production environment');
    } else {
      logger.warn('Sentry DSN not configured, error tracking disabled');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: monitoringConfig.sentry.dsn,
      environment: env.NODE_ENV,
      release: env.NEXT_PUBLIC_APP_VERSION,
      
      // Performance monitoring
      tracesSampleRate: getTracesSampleRate(),
      profilesSampleRate: getProfilesSampleRate(),
      
      // Error filtering and enhancement
      beforeSend: enhanceErrorEvent,
      beforeSendTransaction: filterTransactions,
      
      // Advanced integrations
      integrations: getIntegrations(),
      
      // Transport configuration
      transport: getTransportConfig(),
      
      // Source maps configuration
      enableTracing: true,
      autoInstrumentServerFunctions: true,
      autoInstrumentMiddleware: true,
      
      // Performance configuration
      sendDefaultPii: false,
      attachStacktrace: true,
      
      // Advanced settings
      normalizeDepth: 6,
      maxValueLength: 1000,
      maxBreadcrumbs: 50,
      
      // Custom tags and context
      initialScope: {
        tags: {
          component: 'frontend',
          version: env.NEXT_PUBLIC_APP_VERSION,
          buildTime: process.env.BUILD_TIMESTAMP || 'unknown'
        },
        contexts: {
          app: {
            name: env.NEXT_PUBLIC_APP_NAME,
            version: env.NEXT_PUBLIC_APP_VERSION,
            build: process.env.VERCEL_GIT_COMMIT_SHA || 'local'
          },
          runtime: {
            name: 'nextjs',
            version: process.env.npm_package_dependencies_next || 'unknown'
          }
        }
      }
    });

    // Set up additional user context
    setupUserContext();
    
    // Configure custom error boundaries
    setupErrorBoundaries();
    
    logger.info('Sentry monitoring initialized successfully', {
      environment: env.NODE_ENV,
      release: env.NEXT_PUBLIC_APP_VERSION,
      tracesSampleRate: getTracesSampleRate()
    });

  } catch (error) {
    logger.error('Failed to initialize Sentry', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

/**
 * Get appropriate traces sample rate based on environment
 */
function getTracesSampleRate(): number {
  if (env.NODE_ENV === 'development') return 1.0;
  if (env.NODE_ENV === 'staging') return 0.5;
  return 0.1; // Production: sample 10% of transactions
}

/**
 * Get appropriate profiles sample rate based on environment
 */
function getProfilesSampleRate(): number {
  if (env.NODE_ENV === 'development') return 1.0;
  if (env.NODE_ENV === 'staging') return 0.2;
  return 0.05; // Production: sample 5% of profiles
}

/**
 * Enhanced error event processing
 */
function enhanceErrorEvent(event: Sentry.Event, hint: Sentry.EventHint): Sentry.Event | null {
  const error = hint.originalException;
  
  // Filter out non-critical errors
  if (shouldIgnoreError(error)) {
    return null;
  }
  
  // Add custom context
  event.tags = {
    ...event.tags,
    errorBoundary: hint.mechanism === 'react' ? 'true' : 'false',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
    timestamp: new Date().toISOString()
  };
  
  // Enhance stack traces
  if (event.exception?.values?.[0]) {
    event.exception.values[0].stacktrace?.frames?.forEach((frame: any) => {
      // Mark third-party code
      if (frame.filename?.includes('node_modules')) {
        frame.in_app = false;
      }
      
      // Remove sensitive information
      if (frame.vars) {
        frame.vars = sanitizeVariables(frame.vars);
      }
    });
  }
  
  // Add breadcrumb enhancement
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
      ...breadcrumb,
      data: sanitizeData(breadcrumb.data || {})
    }));
  }
  
  return event;
}

/**
 * Filter transaction events for performance
 */
function filterTransactions(event: Sentry.Event): Sentry.Event | null {
  // In development, sample heavily to reduce noise
  if (!isProduction && Math.random() > 0.1) {
    return null;
  }
  
  // Filter out health check and static asset requests
  const transactionName = event.transaction;
  if (transactionName) {
    const ignoredPatterns = [
      '/health',
      '/api/health',
      '/_next/static',
      '/favicon.ico',
      '/manifest.json',
      '/sw.js'
    ];
    
    if (ignoredPatterns.some(pattern => transactionName.includes(pattern))) {
      return null;
    }
  }
  
  return event;
}

/**
 * Configure Sentry integrations
 */
function getIntegrations(): Sentry.Integration[] {
  const defaultIntegrations = Sentry.getDefaultIntegrations({});
  
  // Filter out problematic integrations
  const filteredIntegrations = defaultIntegrations.filter(integration => {
    const name = integration.name;
    return !name.includes('OpenTelemetry') &&
           !name.includes('NodeFetch') &&
           !name.includes('Http');
  });
  
  // Add custom integrations
  const customIntegrations: Sentry.Integration[] = [
    Sentry.replayIntegration({
      // Session replay configuration
      sessionSampleRate: isProduction ? 0.01 : 0.1,
      errorSampleRate: isProduction ? 0.1 : 1.0,
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true
    }),
    
    Sentry.extraErrorDataIntegration({
      depth: 10
    }),
    
    Sentry.captureConsoleIntegration({
      levels: ['error', 'warn']
    })
  ];
  
  return [...filteredIntegrations, ...customIntegrations];
}

/**
 * Configure Sentry transport
 */
function getTransportConfig() {
  return {
    // Custom transport options for reliability
    bufferSize: 30,
    recordDroppedEvent: (reason: string, category: string) => {
      logger.warn('Sentry event dropped', { reason, category });
    }
  };
}

/**
 * Set up user context tracking
 */
function setupUserContext(): void {
  // This will be called from auth contexts to set user information
  if (typeof window !== 'undefined') {
    // Client-side user context setup
    window.addEventListener('auth-state-change', (event: any) => {
      const { user } = event.detail || {};
      
      Sentry.setUser({
        id: user?.id,
        email: user?.email,
        username: user?.name,
        role: user?.role,
        subscription: user?.subscription
      });
    });
  }
}

/**
 * Configure error boundaries integration
 */
function setupErrorBoundaries(): void {
  // Add global error handlers
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      Sentry.captureException(event.reason, {
        tags: { errorType: 'unhandledRejection' },
        contexts: {
          promise: {
            reason: event.reason?.toString() || 'Unknown reason'
          }
        }
      });
    });
  }
}

/**
 * Check if error should be ignored
 */
function shouldIgnoreError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message || error.toString();
  
  // Ignore common non-critical errors
  const ignoredPatterns = [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Script error',
    'Network request failed',
    'ChunkLoadError',
    'Loading chunk',
    'Loading CSS chunk',
    'AbortError',
    'The user aborted a request'
  ];
  
  return ignoredPatterns.some(pattern => message.includes(pattern));
}

/**
 * Sanitize variables in stack traces
 */
function sanitizeVariables(vars: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(vars)) {
    // Remove sensitive data
    if (key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('key')) {
      sanitized[key] = '[Filtered]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitize breadcrumb data
 */
function sanitizeData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.length > 200) {
      sanitized[key] = value.substring(0, 200) + '...';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Utility functions for manual error reporting
 */
export const sentryUtils = {
  /**
   * Report user action with context
   */
  reportUserAction: (action: string, data?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      message: `User action: ${action}`,
      category: 'user',
      level: 'info',
      data: sanitizeData(data || {})
    });
  },
  
  /**
   * Report performance issue
   */
  reportPerformanceIssue: (name: string, duration: number, context?: Record<string, any>) => {
    if (duration > 1000) { // Report slow operations
      Sentry.captureMessage(`Performance issue: ${name}`, {
        level: 'warning',
        tags: {
          performanceIssue: 'true',
          operationName: name,
          duration: duration.toString()
        },
        contexts: {
          performance: {
            name,
            duration,
            threshold: 1000,
            ...context
          }
        }
      });
    }
  },
  
  /**
   * Report feature usage
   */
  reportFeatureUsage: (feature: string, success: boolean, metadata?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      message: `Feature used: ${feature}`,
      category: 'feature',
      level: success ? 'info' : 'warning',
      data: {
        feature,
        success,
        ...sanitizeData(metadata || {})
      }
    });
  },
  
  /**
   * Set user context manually
   */
  setUserContext: (user: {
    id?: string;
    email?: string;
    role?: string;
    subscription?: string;
  }) => {
    Sentry.setUser(user);
  },
  
  /**
   * Add custom tags
   */
  addTags: (tags: Record<string, string>) => {
    Sentry.setTags(tags);
  }
};

// Export for use in error boundaries and components
export { configureSentry as default };