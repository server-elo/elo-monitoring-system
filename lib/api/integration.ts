/**
 * Integration utilities for seamless integration with existing platform systems
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  withErrorHandling, 
  withSecurity, 
  withRateLimit,
  createValidationMiddleware 
} from './middleware';
import { rateLimiters } from './rate-limiting';
import { apiLogger, createLoggingMiddleware } from './logging';
import { errorTracker } from '@/lib/monitoring/error-tracking';
import { isFeatureEnabled } from '@/lib/features/feature-flags';
import { trackFallbackUsage } from '@/lib/utils/fallback-integration';
import { UserSettings } from '@/types/settings';
import { z } from 'zod';

// Middleware composition utility
export function composeMiddleware(...middlewares: Array<(request: NextRequest, handler: Function) => Promise<NextResponse>>) {
  return (handler: Function) => {
    return middlewares.reduceRight(
      (acc, middleware) => (request: NextRequest) => middleware(request, acc),
      handler
    );
  };
}

// Standard API route wrapper with all security and monitoring
export function createApiRoute(options: {
  method?: string | string[];
  validation?: z.ZodSchema<any>;
  rateLimit?: 'public' | 'authenticated' | 'admin' | 'login' | 'registration' | 'upload' | 'search';
  requireAuth?: boolean;
  requireRole?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  featureFlag?: string;
  enableLogging?: boolean;
  enableSecurity?: boolean;
}) {
  const {
    method = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    validation,
    rateLimit,
    requireAuth = false,
    requireRole,
    featureFlag,
    enableLogging = true,
    enableSecurity = true
  } = options;

  return (handler: Function) => {
    const middlewares: Array<(request: NextRequest, handler: Function) => Promise<NextResponse>> = [];

    // Security middleware
    if (enableSecurity) {
      middlewares.push(withSecurity());
    }

    // Logging middleware
    if (enableLogging) {
      middlewares.push(createLoggingMiddleware());
    }

    // Rate limiting middleware
    if (rateLimit) {
      middlewares.push(withRateLimit(rateLimiters[rateLimit]));
    }

    // Method validation
    middlewares.push(async (request: NextRequest, next: Function) => {
      const allowedMethods = Array.isArray(method) ? method : [method];
      if (!allowedMethods.includes(request.method)) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: {
              code: 'METHOD_NOT_ALLOWED',
              message: `Method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`
            }
          }),
          { 
            status: 405,
            headers: {
              'Allow': allowedMethods.join(', '),
              'Content-Type': 'application/json'
            }
          }
        );
      }
      return next(request);
    });

    // Authentication middleware
    if (requireAuth) {
      middlewares.push(async (request: NextRequest, next: Function) => {
        const authHeader = request.headers.get('authorization');
        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');

        if (!authHeader && !userId) {
          return new NextResponse(
            JSON.stringify({
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
              }
            }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Role-based access control
        if (requireRole && userRole !== requireRole && userRole !== 'ADMIN') {
          return new NextResponse(
            JSON.stringify({
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: `${requireRole} role required`
              }
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return next(request);
      });
    }

    // Feature flag middleware
    if (featureFlag) {
      middlewares.push(async (request: NextRequest, next: Function) => {
        const userRole = request.headers.get('x-user-role') as any;
        const userId = request.headers.get('x-user-id');

        if (!isFeatureEnabled(featureFlag, userRole, userId || undefined)) {
          return new NextResponse(
            JSON.stringify({
              success: false,
              error: {
                code: 'FEATURE_DISABLED',
                message: `Feature '${featureFlag}' is not available`
              }
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return next(request);
      });
    }

    // Validation middleware
    if (validation) {
      middlewares.push(createValidationMiddleware(validation));
    }

    // Error handling wrapper
    middlewares.push(withErrorHandling);

    return composeMiddleware(...middlewares)(handler);
  };
}

// Settings integration utilities
export async function getUserSettings(_userId: string): Promise<UserSettings | null> {
  try {
    // In a real implementation, this would fetch from your database
    // For now, return mock settings
    return {
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Learning Solidity',
        location: 'New York',
        website: 'https://johndoe.dev',
        githubUsername: 'johndoe',
        twitterUsername: 'johndoe',
        linkedinUsername: 'john-doe',
        avatar: 'https://example.com/avatar.jpg'
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 60,
        loginNotifications: true,
        backupCodes: [],
        passwordLastChanged: new Date(),
        suspiciousActivityAlerts: true,
        allowedDevices: [],
        ipWhitelist: []
      },
      learning: {
        difficulty: 'beginner',
        learningPath: ['Master Solidity', 'Build DeFi apps'],
        preferredLanguages: ['solidity', 'javascript'],
        studyReminders: {
          enabled: true,
          frequency: 'daily',
          time: '19:00',
          timezone: 'America/New_York'
        },
        progressTracking: {
          showDetailedStats: true,
          shareProgress: true,
          goalSetting: true,
          weeklyGoals: 7
        }
      },
      editor: {
        theme: 'dark',
        fontSize: 14,
        fontFamily: 'fira-code',
        tabSize: 2,
        wordWrap: true,
        lineNumbers: true,
        minimap: true,
        autoSave: true,
        autoSaveInterval: 2000,
        formatOnSave: true,
        formatOnType: false,
        showWhitespace: false,
        renderControlCharacters: false,
        keyBindings: 'default',
        bracketPairColorization: true,
        lineHeight: 1.5
      },
      collaboration: {
        showCursors: true,
        showSelections: true,
        showUserNames: true,
        enableRealTimeChat: true,
        autoJoinSessions: false,
        sharePresence: true,
        allowInvitations: true,
        defaultPermissions: 'read',
        notificationSound: true
      },
      notifications: {
        email: {
          courseUpdates: true,
          achievementUnlocked: true,
          weeklyProgress: true,
          collaborationInvites: true,
          systemAnnouncements: true,
          securityAlerts: true,
          marketingEmails: false
        },
        push: {
          courseReminders: true,
          achievementUnlocked: true,
          collaborationActivity: true,
          systemAlerts: true
        },
        inApp: {
          realTimeCollaboration: true,
          codeAnalysisResults: true,
          debuggingAlerts: true,
          versionControlUpdates: true
        }
      },
      accessibility: {
        fontSize: 16,
        highContrast: false,
        reducedMotion: false,
        screenReader: false,
        keyboardNavigation: true,
        focusIndicators: true,
        largeClickTargets: false,
        simpleLanguage: false,
        largeText: false,
        colorBlindnessSupport: 'none',
        colorBlindSupport: false,
        voiceCommands: false,
        stickyKeys: false,
        clickDelay: 0,
        readingGuide: false,
        reduceMotion: false,
        autoPauseMedia: true,
        sessionTimeoutWarning: 5
      },
      privacy: {
        profileVisibility: 'public',
        showProgress: true,
        showAchievements: true,
        allowCollaboration: true,
        showOnlineStatus: true,
        dataRetentionDays: 365,
        allowAnalytics: true,
        allowPersonalization: true,
        allowMarketing: false,
        allowThirdParty: false,
        allowCookies: true,
        dataRetention: 365,
        shareUsageData: true
      }
    };
  } catch (error) {
    console.error('Failed to fetch user settings:', error);
    return null;
  }
}

// Error tracking integration
export function trackApiError(error: Error, context: {
  endpoint: string;
  method: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}) {
  errorTracker.captureError(error, {
    component: 'api',
    action: 'api_error',
    metadata: {
      endpoint: context.endpoint,
      method: context.method,
      userId: context.userId,
      requestId: context.requestId,
      ...context.metadata
    }
  });
}

// Fallback system integration
export function createFallbackMiddleware() {
  return async (request: NextRequest, handler: Function): Promise<NextResponse> => {
    try {
      const response = await handler(request);
      
      // API success doesn't need fallback tracking
      
      return response;
    } catch (error) {
      // Track API failures as error boundary fallback
      trackFallbackUsage('error_boundary', {
        component: 'api',
        page: new URL(request.url).pathname,
        userRole: request.headers.get('x-user-role') || undefined,
        metadata: {
          method: request.method,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      throw error;
    }
  };
}

// Accessibility integration
export function createAccessibilityMiddleware() {
  return async (request: NextRequest, handler: Function): Promise<NextResponse> => {
    const userId = request.headers.get('x-user-id');
    
    if (userId) {
      try {
        const settings = await getUserSettings(userId);
        if (settings?.accessibility) {
          // Apply accessibility settings to API responses if needed
          // This could modify response format, add additional metadata, etc.
          const response = await handler(request);
          
          // Add accessibility metadata to response headers
          if (settings.accessibility.simpleLanguage) {
            response.headers.set('X-Simple-Language', 'true');
          }
          
          if (settings.accessibility.screenReader) {
            response.headers.set('X-Screen-Reader-Optimized', 'true');
          }
          
          return response;
        }
      } catch (error) {
        console.error('Failed to apply accessibility settings:', error);
      }
    }
    
    return handler(request);
  };
}

// Performance monitoring integration
export function createPerformanceMiddleware() {
  return async (request: NextRequest, handler: Function): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = request.headers.get('x-request-id') || 'unknown';
    
    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;
      
      // Log performance metrics
      apiLogger.log('INFO', `API Performance: ${request.method} ${new URL(request.url).pathname} - ${duration}ms`, {
        duration,
        method: request.method,
        path: new URL(request.url).pathname,
        statusCode: response.status,
        userId: request.headers.get('x-user-id')
      }, requestId);
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error performance
      apiLogger.log('ERROR', `API Error: ${request.method} ${new URL(request.url).pathname} - ${duration}ms`, {
        duration,
        method: request.method,
        path: new URL(request.url).pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: request.headers.get('x-user-id')
      }, requestId);
      
      throw error;
    }
  };
}

// Complete API middleware stack
export function createCompleteApiMiddleware(options: {
  rateLimit?: 'public' | 'authenticated' | 'admin' | 'login' | 'registration' | 'upload' | 'search';
  requireAuth?: boolean;
  requireRole?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  featureFlag?: string;
  validation?: z.ZodSchema<any>;
}) {
  const middlewares = [
    withSecurity(),
    createLoggingMiddleware(),
    createPerformanceMiddleware(),
    createFallbackMiddleware(),
    createAccessibilityMiddleware()
  ];

  if (options.rateLimit) {
    middlewares.push(withRateLimit(rateLimiters[options.rateLimit]));
  }

  if (options.validation) {
    middlewares.push(createValidationMiddleware(options.validation));
  }

  middlewares.push(withErrorHandling);

  return composeMiddleware(...middlewares);
}

// Utility for creating standardized API routes
export const api = {
  get: (options: Parameters<typeof createApiRoute>[0] = {}) => 
    createApiRoute({ ...options, method: 'GET' }),
  
  post: (options: Parameters<typeof createApiRoute>[0] = {}) => 
    createApiRoute({ ...options, method: 'POST' }),
  
  put: (options: Parameters<typeof createApiRoute>[0] = {}) => 
    createApiRoute({ ...options, method: 'PUT' }),
  
  patch: (options: Parameters<typeof createApiRoute>[0] = {}) => 
    createApiRoute({ ...options, method: 'PATCH' }),
  
  delete: (options: Parameters<typeof createApiRoute>[0] = {}) => 
    createApiRoute({ ...options, method: 'DELETE' }),
  
  all: (options: Parameters<typeof createApiRoute>[0] = {}) => 
    createApiRoute({ ...options, method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] })
};
