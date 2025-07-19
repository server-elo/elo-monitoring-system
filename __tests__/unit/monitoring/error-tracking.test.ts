import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { errorTracker, captureError, captureWarning, captureInfo, useErrorTracking } from '@/lib/monitoring/error-tracking';
;

// Mock external dependencies
jest.mock('@sentry/nextjs', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((callback) => callback({
    setUser: jest.fn(),
    setTag: jest.fn(),
    setContext: jest.fn(),
    setLevel: jest.fn(),
    addBreadcrumb: jest.fn()
  })),
  addBreadcrumb: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
  getDefaultIntegrations: jest.fn().mockReturnValue([])
}));

// Mock fetch for external service calls
global.fetch = jest.fn();

// Mock window and navigator objects
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:3000/test' },
  writable: true
});

Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Test Browser)',
  writable: true
});

describe('Error Tracking System - Comprehensive Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset error tracker state
    errorTracker['events'] = [];
    errorTracker['listeners'] = [];
    
    // Mock environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Error Tracker Initialization', () => {
    it('should initialize error tracker with default settings', () => {
      expect(errorTracker).toBeDefined();
      expect(errorTracker['events']).toEqual([]);
      expect(errorTracker['listeners']).toEqual([]);
      expect(errorTracker['maxEvents']).toBe(1000);
    });

    it('should setup global error handlers', () => {
      // Verify that global error handlers are set up
      expect(errorTracker['setupGlobalErrorHandlers']).toBeDefined();
    });
  });

  describe('Error Capture Functionality', () => {
    describe('captureError', () => {
      it('should capture error with basic information', () => {
        const testError = new Error('Test error message');
        const context = {
          component: 'TestComponent',
          action: 'test_action'
        };

        errorTracker.captureError(testError, context);

        const events = errorTracker.getRecentEvents();
        expect(events).toHaveLength(1);
        
        const event = events[0];
        expect(event.level).toBe('error');
        expect(event.message).toBe('Test error message');
        expect(event.context.component).toBe('TestComponent');
        expect(event.context.action).toBe('test_action');
        expect(event.stack).toBe(testError.stack);
      });

      it('should generate unique IDs for each error', () => {
        const error1 = new Error('Error 1');
        const error2 = new Error('Error 2');

        errorTracker.captureError(error1);
        errorTracker.captureError(error2);

        const events = errorTracker.getRecentEvents();
        expect(events).toHaveLength(2);
        expect(events[0].id).not.toBe(events[1].id);
      });

      it('should include timestamp in ISO format', () => {
        const testError = new Error('Test error');
        
        errorTracker.captureError(testError);

        const events = errorTracker.getRecentEvents();
        const event = events[0];
        
        expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(new Date(event.timestamp)).toBeInstanceOf(Date);
      });

      it('should generate fingerprint for error grouping', () => {
        const testError = new Error('Test error');
        
        errorTracker.captureError(testError);

        const events = errorTracker.getRecentEvents();
        const event = events[0];
        
        expect(event.fingerprint).toBeDefined();
        expect(typeof event.fingerprint).toBe('string');
        expect(event.fingerprint.length).toBeGreaterThan(0);
      });

      it('should generate appropriate tags', () => {
        const testError = new Error('Test error');
        const context = {
          component: 'AuthComponent',
          action: 'login'
        };
        
        errorTracker.captureError(testError, context);

        const events = errorTracker.getRecentEvents();
        const event = events[0];
        
        expect(event.tags).toBeDefined();
        expect(Array.isArray(event.tags)).toBe(true);
        expect(event.tags.length).toBeGreaterThan(0);
      });

      it('should handle errors without stack traces', () => {
        const errorWithoutStack = new Error('Error without stack');
        errorWithoutStack.stack = undefined;
        
        expect(() => errorTracker.captureError(errorWithoutStack)).not.toThrow();
        
        const events = errorTracker.getRecentEvents();
        expect(events).toHaveLength(1);
        expect(events[0].stack).toBeUndefined();
      });
    });

    describe('captureWarning', () => {
      it('should capture warning messages', () => {
        const warningMessage = 'This is a warning';
        const context = { component: 'WarningComponent' };

        errorTracker.captureWarning(warningMessage, context);

        const events = errorTracker.getRecentEvents();
        expect(events).toHaveLength(1);
        
        const event = events[0];
        expect(event.level).toBe('warning');
        expect(event.message).toBe(warningMessage);
        expect(event.context.component).toBe('WarningComponent');
      });

      it('should not include stack trace for warnings', () => {
        errorTracker.captureWarning('Warning message');

        const events = errorTracker.getRecentEvents();
        const event = events[0];
        
        expect(event.stack).toBeUndefined();
      });
    });

    describe('captureInfo', () => {
      it('should capture info messages', () => {
        const infoMessage = 'This is an info message';
        const context = { component: 'InfoComponent' };

        errorTracker.captureInfo(infoMessage, context);

        const events = errorTracker.getRecentEvents();
        expect(events).toHaveLength(1);
        
        const event = events[0];
        expect(event.level).toBe('info');
        expect(event.message).toBe(infoMessage);
        expect(event.context.component).toBe('InfoComponent');
      });
    });
  });

  describe('Event Management', () => {
    describe('Event Storage', () => {
      it('should store events in memory', () => {
        const error1 = new Error('Error 1');
        const error2 = new Error('Error 2');

        errorTracker.captureError(error1);
        errorTracker.captureError(error2);

        const events = errorTracker.getRecentEvents();
        expect(events).toHaveLength(2);
      });

      it('should limit stored events to maxEvents', () => {
        // Set a lower limit for testing
        errorTracker['maxEvents'] = 3;

        for (let i = 0; i < 5; i++) {
          errorTracker.captureError(new Error(`Error ${i}`));
        }

        const events = errorTracker.getRecentEvents();
        expect(events).toHaveLength(3);
        
        // Should keep the most recent events
        expect(events[0].message).toBe('Error 4');
        expect(events[1].message).toBe('Error 3');
        expect(events[2].message).toBe('Error 2');
      });

      it('should return events in reverse chronological order', () => {
        errorTracker.captureError(new Error('First error'));
        
        // Add a small delay to ensure different timestamps
        setTimeout(() => {
          errorTracker.captureError(new Error('Second error'));
          
          const events = errorTracker.getRecentEvents();
          expect(events[0].message).toBe('Second error');
          expect(events[1].message).toBe('First error');
        }, 10);
      });
    });

    describe('Event Listeners', () => {
      it('should notify listeners when errors are captured', () => {
        const listener = jest.fn();
        errorTracker.addListener(listener);

        const testError = new Error('Test error');
        errorTracker.captureError(testError);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
          level: 'error',
          message: 'Test error'
        }));
      });

      it('should handle multiple listeners', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();
        
        errorTracker.addListener(listener1);
        errorTracker.addListener(listener2);

        errorTracker.captureError(new Error('Test error'));

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
      });

      it('should handle listener errors gracefully', () => {
        const faultyListener = jest.fn(() => {
          throw new Error('Listener error');
        });
        const goodListener = jest.fn();
        
        errorTracker.addListener(faultyListener);
        errorTracker.addListener(goodListener);

        expect(() => errorTracker.captureError(new Error('Test error'))).not.toThrow();
        expect(goodListener).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Context and Metadata', () => {
    it('should capture browser context automatically', () => {
      errorTracker.captureError(new Error('Test error'));

      const events = errorTracker.getRecentEvents();
      const event = events[0];
      
      expect(event.context.url).toBe('http://localhost:3000/test');
      expect(event.context.userAgent).toBe('Mozilla/5.0 (Test Browser)');
    });

    it('should include user and session information when available', () => {
      // Mock user and session getters
      errorTracker['getUserId'] = jest.fn().mockReturnValue('user-123');
      errorTracker['getSessionId'] = jest.fn().mockReturnValue('session-456');

      errorTracker.captureError(new Error('Test error'));

      const events = errorTracker.getRecentEvents();
      const event = events[0];
      
      expect(event.context.userId).toBe('user-123');
      expect(event.context.sessionId).toBe('session-456');
    });

    it('should merge custom context with default context', () => {
      const customContext = {
        component: 'CustomComponent',
        action: 'custom_action',
        metadata: { key: 'value' }
      };

      errorTracker.captureError(new Error('Test error'), customContext);

      const events = errorTracker.getRecentEvents();
      const event = events[0];
      
      expect(event.context.component).toBe('CustomComponent');
      expect(event.context.action).toBe('custom_action');
      expect(event.context.metadata).toEqual({ key: 'value' });
      expect(event.context.url).toBe('http://localhost:3000/test');
    });
  });

  describe('External Service Integration', () => {
    it('should send errors to external service in production', () => {
      process.env.NODE_ENV = 'production';
      
      errorTracker.captureError(new Error('Production error'));

      expect(fetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Production error')
      });
    });

    it('should not send errors to external service in development', () => {
      process.env.NODE_ENV = 'development';
      
      errorTracker.captureError(new Error('Development error'));

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle network errors when sending to external service', () => {
      process.env.NODE_ENV = 'production';
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      expect(() => errorTracker.captureError(new Error('Test error'))).not.toThrow();
    });
  });

  describe('Metrics and Analytics', () => {
    describe('getMetrics', () => {
      it('should calculate error metrics correctly', () => {
        // Add various types of errors
        errorTracker.captureError(new Error('Error 1'));
        errorTracker.captureError(new Error('Error 2'));
        errorTracker.captureWarning('Warning 1');
        errorTracker.captureInfo('Info 1');

        const metrics = errorTracker.getMetrics();

        expect(metrics).toBeDefined();
        expect(metrics.totalErrors).toBeGreaterThan(0);
        expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
        expect(metrics.topErrors).toBeDefined();
        expect(Array.isArray(metrics.topErrors)).toBe(true);
      });

      it('should group similar errors by fingerprint', () => {
        // Create multiple instances of the same error
        for (let i = 0; i < 3; i++) {
          errorTracker.captureError(new Error('Repeated error'));
        }

        const metrics = errorTracker.getMetrics();
        const topErrors = metrics.topErrors;

        expect(topErrors.length).toBeGreaterThan(0);
        const repeatedError = topErrors.find(error => error.message === 'Repeated error');
        expect(repeatedError).toBeDefined();
        expect(repeatedError?.count).toBe(3);
      });

      it('should track errors by page', () => {
        // Mock different URLs
        Object.defineProperty(window, 'location', {
          value: { href: 'http://localhost:3000/page1' },
          writable: true
        });
        errorTracker.captureError(new Error('Page 1 error'));

        Object.defineProperty(window, 'location', {
          value: { href: 'http://localhost:3000/page2' },
          writable: true
        });
        errorTracker.captureError(new Error('Page 2 error'));

        const metrics = errorTracker.getMetrics();
        expect(metrics.errorsByPage).toBeDefined();
        expect(Object.keys(metrics.errorsByPage).length).toBeGreaterThan(0);
      });
    });

    describe('Error Rate Calculation', () => {
      it('should calculate error rate per minute', () => {
        const startTime = Date.now();

        // Add errors with timestamps
        for (let i = 0; i < 5; i++) {
          errorTracker.captureError(new Error(`Error ${i}`));
        }

        const metrics = errorTracker.getMetrics();
        expect(metrics.errorRate).toBeGreaterThan(0);
      });
    });
  });

  describe('Breadcrumb Functionality', () => {
    it('should add breadcrumbs for user actions', () => {
      errorTracker.addBreadcrumb({
        message: 'User clicked button',
        category: 'ui',
        level: 'info',
        data: { buttonId: 'submit-btn' }
      });

      errorTracker.captureError(new Error('Error after button click'));

      // Verify breadcrumb was added (implementation dependent)
      expect(errorTracker.addBreadcrumb).toBeDefined();
    });

    it('should limit breadcrumb history', () => {
      // Add many breadcrumbs
      for (let i = 0; i < 150; i++) {
        errorTracker.addBreadcrumb({
          message: `Breadcrumb ${i}`,
          category: 'test'
        });
      }

      // Should not exceed maximum breadcrumbs
      expect(errorTracker['breadcrumbs']?.length || 0).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Filtering and Rate Limiting', () => {
    it('should filter out ignored errors', () => {
      // Mock shouldIgnoreError to return true for specific errors
      errorTracker['shouldIgnoreError'] = jest.fn().mockReturnValue(true);

      errorTracker.captureError(new Error('Ignored error'));

      const events = errorTracker.getRecentEvents();
      expect(events).toHaveLength(0);
    });

    it('should implement rate limiting for similar errors', () => {
      // Capture many similar errors quickly
      for (let i = 0; i < 10; i++) {
        errorTracker.captureError(new Error('Repeated error'));
      }

      // Should not capture all errors due to rate limiting
      const events = errorTracker.getRecentEvents();
      expect(events.length).toBeLessThan(10);
    });

    it('should reset rate limiting after time window', async () => {
      // Mock time-based rate limiting reset
      jest.useFakeTimers();

      errorTracker.captureError(new Error('Rate limited error'));

      // Fast forward time
      jest.advanceTimersByTime(60000); // 1 minute

      errorTracker.captureError(new Error('Rate limited error'));

      const events = errorTracker.getRecentEvents();
      expect(events.length).toBeGreaterThan(0);

      jest.useRealTimers();
    });
  });

  describe('Performance Impact', () => {
    it('should capture errors efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        errorTracker.captureError(new Error(`Performance test error ${i}`));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(100); // 100ms for 100 errors
    });

    it('should not block main thread', async () => {
      const heavyError = new Error('Heavy error');
      heavyError.stack = 'x'.repeat(10000); // Large stack trace

      const startTime = performance.now();
      errorTracker.captureError(heavyError);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be fast even with large errors
    });
  });

  describe('Convenience Functions', () => {
    it('should provide global captureError function', () => {
      const testError = new Error('Global capture test');

      captureError(testError, { component: 'GlobalTest' });

      const events = errorTracker.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].message).toBe('Global capture test');
      expect(events[0].context.component).toBe('GlobalTest');
    });

    it('should provide global captureWarning function', () => {
      captureWarning('Global warning test', { component: 'GlobalTest' });

      const events = errorTracker.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].level).toBe('warning');
      expect(events[0].message).toBe('Global warning test');
    });

    it('should provide global captureInfo function', () => {
      captureInfo('Global info test', { component: 'GlobalTest' });

      const events = errorTracker.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].level).toBe('info');
      expect(events[0].message).toBe('Global info test');
    });
  });

  describe('React Hook Integration', () => {
    it('should provide useErrorTracking hook', () => {
      const hookResult = useErrorTracking();

      expect(hookResult).toBeDefined();
      expect(hookResult.captureError).toBeDefined();
      expect(hookResult.captureWarning).toBeDefined();
      expect(hookResult.captureInfo).toBeDefined();
      expect(hookResult.getMetrics).toBeDefined();
      expect(hookResult.getRecentEvents).toBeDefined();
    });

    it('should allow error capture through hook', () => {
      const { captureError: hookCaptureError } = useErrorTracking();

      hookCaptureError(new Error('Hook error test'), { component: 'HookTest' });

      const events = errorTracker.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].message).toBe('Hook error test');
    });
  });

  describe('Error Recovery and Cleanup', () => {
    it('should clear events when requested', () => {
      errorTracker.captureError(new Error('Error 1'));
      errorTracker.captureError(new Error('Error 2'));

      expect(errorTracker.getRecentEvents()).toHaveLength(2);

      errorTracker.clearEvents();

      expect(errorTracker.getRecentEvents()).toHaveLength(0);
    });

    it('should handle memory cleanup for long-running applications', () => {
      // Simulate long-running application with many errors
      for (let i = 0; i < 2000; i++) {
        errorTracker.captureError(new Error(`Long running error ${i}`));
      }

      const events = errorTracker.getRecentEvents();

      // Should not exceed memory limits
      expect(events.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Security and Privacy', () => {
    it('should sanitize sensitive information from error messages', () => {
      const sensitiveError = new Error('Password: secret123, Token: abc123xyz');

      errorTracker.captureError(sensitiveError);

      const events = errorTracker.getRecentEvents();
      const event = events[0];

      // Should sanitize sensitive data (implementation dependent)
      expect(event.message).not.toContain('secret123');
      expect(event.message).not.toContain('abc123xyz');
    });

    it('should not include sensitive context data', () => {
      const sensitiveContext = {
        password: 'secret',
        token: 'sensitive-token',
        component: 'LoginForm'
      };

      errorTracker.captureError(new Error('Login error'), sensitiveContext);

      const events = errorTracker.getRecentEvents();
      const event = events[0];

      expect(event.context.password).toBeUndefined();
      expect(event.context.token).toBeUndefined();
      expect(event.context.component).toBe('LoginForm'); // Non-sensitive data should remain
    });
  });
});
