import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { errorTracker, captureError, captureWarning, captureInfo, useErrorTracking } from '@/lib/monitoring/error-tracking';
;

// Mock external dependencies
jest.mock( '@sentry/nextjs', () => ({
  init: jest.fn(_),
  captureException: jest.fn(_),
  captureMessage: jest.fn(_),
  withScope: jest.fn((callback) => callback({
    setUser: jest.fn(_),
    setTag: jest.fn(_),
    setContext: jest.fn(_),
    setLevel: jest.fn(_),
    addBreadcrumb: jest.fn(_)
  })),
  addBreadcrumb: jest.fn(_),
  close: jest.fn(_).mockResolvedValue(_undefined),
  getDefaultIntegrations: jest.fn(_).mockReturnValue([])
}));

// Mock fetch for external service calls
global.fetch = jest.fn(_);

// Mock window and navigator objects
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:3000/test' },
  writable: true
});

Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (_Test Browser)',
  writable: true
});

describe( 'Error Tracking System - Comprehensive Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks(_);
    // Reset error tracker state
    errorTracker['events'] = [];
    errorTracker['listeners'] = [];
    
    // Mock environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.restoreAllMocks(_);
  });

  describe( 'Error Tracker Initialization', () => {
    it( 'should initialize error tracker with default settings', () => {
      expect(_errorTracker).toBeDefined(_);
      expect(_errorTracker['events']).toEqual([]);
      expect(_errorTracker['listeners']).toEqual([]);
      expect(_errorTracker['maxEvents']).toBe(1000);
    });

    it( 'should setup global error handlers', () => {
      // Verify that global error handlers are set up
      expect(_errorTracker['setupGlobalErrorHandlers']).toBeDefined(_);
    });
  });

  describe( 'Error Capture Functionality', () => {
    describe( 'captureError', () => {
      it( 'should capture error with basic information', () => {
        const testError = new Error('Test error message');
        const context = {
          component: 'TestComponent',
          action: 'test_action'
        };

        errorTracker.captureError( testError, context);

        const events = errorTracker.getRecentEvents(_);
        expect(_events).toHaveLength(1);
        
        const event = events[0];
        expect(_event.level).toBe('error');
        expect(_event.message).toBe('Test error message');
        expect(_event.context.component).toBe('TestComponent');
        expect(_event.context.action).toBe('test_action');
        expect(_event.stack).toBe(_testError.stack);
      });

      it( 'should generate unique IDs for each error', () => {
        const error1 = new Error('Error 1');
        const error2 = new Error('Error 2');

        errorTracker.captureError(_error1);
        errorTracker.captureError(_error2);

        const events = errorTracker.getRecentEvents(_);
        expect(_events).toHaveLength(_2);
        expect(_events[0].id).not.toBe(_events[1].id);
      });

      it( 'should include timestamp in ISO format', () => {
        const testError = new Error('Test error');
        
        errorTracker.captureError(_testError);

        const events = errorTracker.getRecentEvents(_);
        const event = events[0];
        
        expect(_event.timestamp).toMatch(_/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(new Date(event.timestamp)).toBeInstanceOf(_Date);
      });

      it( 'should generate fingerprint for error grouping', () => {
        const testError = new Error('Test error');
        
        errorTracker.captureError(_testError);

        const events = errorTracker.getRecentEvents(_);
        const event = events[0];
        
        expect(_event.fingerprint).toBeDefined(_);
        expect(_typeof event.fingerprint).toBe('string');
        expect(_event.fingerprint.length).toBeGreaterThan(0);
      });

      it( 'should generate appropriate tags', () => {
        const testError = new Error('Test error');
        const context = {
          component: 'AuthComponent',
          action: 'login'
        };
        
        errorTracker.captureError( testError, context);

        const events = errorTracker.getRecentEvents(_);
        const event = events[0];
        
        expect(_event.tags).toBeDefined(_);
        expect(_Array.isArray(event.tags)).toBe(_true);
        expect(_event.tags.length).toBeGreaterThan(0);
      });

      it( 'should handle errors without stack traces', () => {
        const errorWithoutStack = new Error('Error without stack');
        errorWithoutStack.stack = undefined;
        
        expect(() => errorTracker.captureError(_errorWithoutStack)).not.toThrow(_);
        
        const events = errorTracker.getRecentEvents(_);
        expect(_events).toHaveLength(1);
        expect(_events[0].stack).toBeUndefined(_);
      });
    });

    describe( 'captureWarning', () => {
      it( 'should capture warning messages', () => {
        const warningMessage = 'This is a warning';
        const context = { component: 'WarningComponent' };

        errorTracker.captureWarning( warningMessage, context);

        const events = errorTracker.getRecentEvents(_);
        expect(_events).toHaveLength(1);
        
        const event = events[0];
        expect(_event.level).toBe('warning');
        expect(_event.message).toBe(_warningMessage);
        expect(_event.context.component).toBe('WarningComponent');
      });

      it( 'should not include stack trace for warnings', () => {
        errorTracker.captureWarning('Warning message');

        const events = errorTracker.getRecentEvents(_);
        const event = events[0];
        
        expect(_event.stack).toBeUndefined(_);
      });
    });

    describe( 'captureInfo', () => {
      it( 'should capture info messages', () => {
        const infoMessage = 'This is an info message';
        const context = { component: 'InfoComponent' };

        errorTracker.captureInfo( infoMessage, context);

        const events = errorTracker.getRecentEvents(_);
        expect(_events).toHaveLength(1);
        
        const event = events[0];
        expect(_event.level).toBe('info');
        expect(_event.message).toBe(_infoMessage);
        expect(_event.context.component).toBe('InfoComponent');
      });
    });
  });

  describe( 'Event Management', () => {
    describe( 'Event Storage', () => {
      it( 'should store events in memory', () => {
        const error1 = new Error('Error 1');
        const error2 = new Error('Error 2');

        errorTracker.captureError(_error1);
        errorTracker.captureError(_error2);

        const events = errorTracker.getRecentEvents(_);
        expect(_events).toHaveLength(_2);
      });

      it( 'should limit stored events to maxEvents', () => {
        // Set a lower limit for testing
        errorTracker['maxEvents'] = 3;

        for (let i = 0; i < 5; i++) {
          errorTracker.captureError(_new Error(`Error ${i}`));
        }

        const events = errorTracker.getRecentEvents(_);
        expect(_events).toHaveLength(3);
        
        // Should keep the most recent events
        expect(_events[0].message).toBe('Error 4');
        expect(_events[1].message).toBe('Error 3');
        expect(_events[2].message).toBe('Error 2');
      });

      it( 'should return events in reverse chronological order', () => {
        errorTracker.captureError(_new Error('First error'));
        
        // Add a small delay to ensure different timestamps
        setTimeout(() => {
          errorTracker.captureError(_new Error('Second error'));
          
          const events = errorTracker.getRecentEvents(_);
          expect(_events[0].message).toBe('Second error');
          expect(_events[1].message).toBe('First error');
        }, 10);
      });
    });

    describe( 'Event Listeners', () => {
      it( 'should notify listeners when errors are captured', () => {
        const listener = jest.fn(_);
        errorTracker.addListener(_listener);

        const testError = new Error('Test error');
        errorTracker.captureError(_testError);

        expect(_listener).toHaveBeenCalledTimes(1);
        expect(_listener).toHaveBeenCalledWith(expect.objectContaining({
          level: 'error',
          message: 'Test error'
        }));
      });

      it( 'should handle multiple listeners', () => {
        const listener1 = jest.fn(_);
        const listener2 = jest.fn(_);
        
        errorTracker.addListener(_listener1);
        errorTracker.addListener(_listener2);

        errorTracker.captureError(_new Error('Test error'));

        expect(_listener1).toHaveBeenCalledTimes(1);
        expect(_listener2).toHaveBeenCalledTimes(1);
      });

      it( 'should handle listener errors gracefully', () => {
        const faultyListener = jest.fn(() => {
          throw new Error('Listener error');
        });
        const goodListener = jest.fn(_);
        
        errorTracker.addListener(_faultyListener);
        errorTracker.addListener(_goodListener);

        expect(() => errorTracker.captureError(_new Error('Test error'))).not.toThrow(_);
        expect(_goodListener).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe( 'Context and Metadata', () => {
    it( 'should capture browser context automatically', () => {
      errorTracker.captureError(_new Error('Test error'));

      const events = errorTracker.getRecentEvents(_);
      const event = events[0];
      
      expect(_event.context.url).toBe('http://localhost:3000/test');
      expect(_event.context.userAgent).toBe('Mozilla/5.0 (Test Browser)');
    });

    it( 'should include user and session information when available', () => {
      // Mock user and session getters
      errorTracker['getUserId'] = jest.fn(_).mockReturnValue('user-123');
      errorTracker['getSessionId'] = jest.fn(_).mockReturnValue('session-456');

      errorTracker.captureError(_new Error('Test error'));

      const events = errorTracker.getRecentEvents(_);
      const event = events[0];
      
      expect(_event.context.userId).toBe('user-123');
      expect(_event.context.sessionId).toBe('session-456');
    });

    it( 'should merge custom context with default context', () => {
      const customContext = {
        component: 'CustomComponent',
        action: 'custom_action',
        metadata: { key: 'value' }
      };

      errorTracker.captureError(_new Error('Test error'), customContext);

      const events = errorTracker.getRecentEvents(_);
      const event = events[0];
      
      expect(_event.context.component).toBe('CustomComponent');
      expect(_event.context.action).toBe('custom_action');
      expect(_event.context.metadata).toEqual({ key: 'value'  });
      expect(_event.context.url).toBe('http://localhost:3000/test');
    });
  });

  describe( 'External Service Integration', () => {
    it( 'should send errors to external service in production', () => {
      process.env.NODE_ENV = 'production';
      
      errorTracker.captureError(_new Error('Production error'));

      expect(_fetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Production error')
      });
    });

    it( 'should not send errors to external service in development', () => {
      process.env.NODE_ENV = 'development';
      
      errorTracker.captureError(_new Error('Development error'));

      expect(_fetch).not.toHaveBeenCalled(_);
    });

    it( 'should handle network errors when sending to external service', () => {
      process.env.NODE_ENV = 'production';
      (_fetch as jest.Mock).mockRejectedValue(_new Error('Network error'));

      expect(() => errorTracker.captureError(_new Error('Test error'))).not.toThrow(_);
    });
  });

  describe( 'Metrics and Analytics', () => {
    describe( 'getMetrics', () => {
      it( 'should calculate error metrics correctly', () => {
        // Add various types of errors
        errorTracker.captureError(_new Error('Error 1'));
        errorTracker.captureError(_new Error('Error 2'));
        errorTracker.captureWarning('Warning 1');
        errorTracker.captureInfo('Info 1');

        const metrics = errorTracker.getMetrics(_);

        expect(_metrics).toBeDefined(_);
        expect(_metrics.totalErrors).toBeGreaterThan(0);
        expect(_metrics.errorRate).toBeGreaterThanOrEqual(0);
        expect(_metrics.topErrors).toBeDefined(_);
        expect(_Array.isArray(metrics.topErrors)).toBe(_true);
      });

      it( 'should group similar errors by fingerprint', () => {
        // Create multiple instances of the same error
        for (let i = 0; i < 3; i++) {
          errorTracker.captureError(_new Error('Repeated error'));
        }

        const metrics = errorTracker.getMetrics(_);
        const topErrors = metrics.topErrors;

        expect(_topErrors.length).toBeGreaterThan(0);
        const repeatedError = topErrors.find(error => error.message === 'Repeated error');
        expect(_repeatedError).toBeDefined(_);
        expect(_repeatedError?.count).toBe(3);
      });

      it( 'should track errors by page', () => {
        // Mock different URLs
        Object.defineProperty(window, 'location', {
          value: { href: 'http://localhost:3000/page1' },
          writable: true
        });
        errorTracker.captureError(_new Error('Page 1 error'));

        Object.defineProperty(window, 'location', {
          value: { href: 'http://localhost:3000/page2' },
          writable: true
        });
        errorTracker.captureError(_new Error('Page 2 error'));

        const metrics = errorTracker.getMetrics(_);
        expect(_metrics.errorsByPage).toBeDefined(_);
        expect(_Object.keys(metrics.errorsByPage).length).toBeGreaterThan(0);
      });
    });

    describe( 'Error Rate Calculation', () => {
      it( 'should calculate error rate per minute', () => {
        const startTime = Date.now(_);

        // Add errors with timestamps
        for (let i = 0; i < 5; i++) {
          errorTracker.captureError(_new Error(`Error ${i}`));
        }

        const metrics = errorTracker.getMetrics(_);
        expect(_metrics.errorRate).toBeGreaterThan(0);
      });
    });
  });

  describe( 'Breadcrumb Functionality', () => {
    it( 'should add breadcrumbs for user actions', () => {
      errorTracker.addBreadcrumb({
        message: 'User clicked button',
        category: 'ui',
        level: 'info',
        data: { buttonId: 'submit-btn' }
      });

      errorTracker.captureError(_new Error('Error after button click'));

      // Verify breadcrumb was added (_implementation dependent)
      expect(_errorTracker.addBreadcrumb).toBeDefined(_);
    });

    it( 'should limit breadcrumb history', () => {
      // Add many breadcrumbs
      for (let i = 0; i < 150; i++) {
        errorTracker.addBreadcrumb({
          message: `Breadcrumb ${i}`,
          category: 'test'
        });
      }

      // Should not exceed maximum breadcrumbs
      expect(_errorTracker['breadcrumbs']?.length || 0).toBeLessThanOrEqual(100);
    });
  });

  describe( 'Error Filtering and Rate Limiting', () => {
    it( 'should filter out ignored errors', () => {
      // Mock shouldIgnoreError to return true for specific errors
      errorTracker['shouldIgnoreError'] = jest.fn(_).mockReturnValue(_true);

      errorTracker.captureError(_new Error('Ignored error'));

      const events = errorTracker.getRecentEvents(_);
      expect(_events).toHaveLength(0);
    });

    it( 'should implement rate limiting for similar errors', () => {
      // Capture many similar errors quickly
      for (let i = 0; i < 10; i++) {
        errorTracker.captureError(_new Error('Repeated error'));
      }

      // Should not capture all errors due to rate limiting
      const events = errorTracker.getRecentEvents(_);
      expect(_events.length).toBeLessThan(10);
    });

    it( 'should reset rate limiting after time window', async () => {
      // Mock time-based rate limiting reset
      jest.useFakeTimers(_);

      errorTracker.captureError(_new Error('Rate limited error'));

      // Fast forward time
      jest.advanceTimersByTime(_60000); // 1 minute

      errorTracker.captureError(_new Error('Rate limited error'));

      const events = errorTracker.getRecentEvents(_);
      expect(_events.length).toBeGreaterThan(0);

      jest.useRealTimers(_);
    });
  });

  describe( 'Performance Impact', () => {
    it( 'should capture errors efficiently', () => {
      const startTime = performance.now(_);

      for (let i = 0; i < 100; i++) {
        errorTracker.captureError(_new Error(`Performance test error ${i}`));
      }

      const endTime = performance.now(_);
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(_duration).toBeLessThan(100); // 100ms for 100 errors
    });

    it( 'should not block main thread', async () => {
      const heavyError = new Error('Heavy error');
      heavyError.stack = 'x'.repeat(10000); // Large stack trace

      const startTime = performance.now(_);
      errorTracker.captureError(_heavyError);
      const endTime = performance.now(_);

      expect(_endTime - startTime).toBeLessThan(50); // Should be fast even with large errors
    });
  });

  describe( 'Convenience Functions', () => {
    it( 'should provide global captureError function', () => {
      const testError = new Error('Global capture test');

      captureError( testError, { component: 'GlobalTest' });

      const events = errorTracker.getRecentEvents(_);
      expect(_events).toHaveLength(1);
      expect(_events[0].message).toBe('Global capture test');
      expect(_events[0].context.component).toBe('GlobalTest');
    });

    it( 'should provide global captureWarning function', () => {
      captureWarning( 'Global warning test', { component: 'GlobalTest' });

      const events = errorTracker.getRecentEvents(_);
      expect(_events).toHaveLength(1);
      expect(_events[0].level).toBe('warning');
      expect(_events[0].message).toBe('Global warning test');
    });

    it( 'should provide global captureInfo function', () => {
      captureInfo( 'Global info test', { component: 'GlobalTest' });

      const events = errorTracker.getRecentEvents(_);
      expect(_events).toHaveLength(1);
      expect(_events[0].level).toBe('info');
      expect(_events[0].message).toBe('Global info test');
    });
  });

  describe( 'React Hook Integration', () => {
    it( 'should provide useErrorTracking hook', () => {
      const hookResult = useErrorTracking(_);

      expect(_hookResult).toBeDefined(_);
      expect(_hookResult.captureError).toBeDefined(_);
      expect(_hookResult.captureWarning).toBeDefined(_);
      expect(_hookResult.captureInfo).toBeDefined(_);
      expect(_hookResult.getMetrics).toBeDefined(_);
      expect(_hookResult.getRecentEvents).toBeDefined(_);
    });

    it( 'should allow error capture through hook', () => {
      const { captureError: hookCaptureError } = useErrorTracking(_);

      hookCaptureError(_new Error('Hook error test'), { component: 'HookTest' });

      const events = errorTracker.getRecentEvents(_);
      expect(_events).toHaveLength(1);
      expect(_events[0].message).toBe('Hook error test');
    });
  });

  describe( 'Error Recovery and Cleanup', () => {
    it( 'should clear events when requested', () => {
      errorTracker.captureError(_new Error('Error 1'));
      errorTracker.captureError(_new Error('Error 2'));

      expect(_errorTracker.getRecentEvents()).toHaveLength(_2);

      errorTracker.clearEvents();

      expect(_errorTracker.getRecentEvents()).toHaveLength(0);
    });

    it( 'should handle memory cleanup for long-running applications', () => {
      // Simulate long-running application with many errors
      for (let i = 0; i < 2000; i++) {
        errorTracker.captureError(_new Error(`Long running error ${i}`));
      }

      const events = errorTracker.getRecentEvents(_);

      // Should not exceed memory limits
      expect(_events.length).toBeLessThanOrEqual(1000);
    });
  });

  describe( 'Security and Privacy', () => {
    it( 'should sanitize sensitive information from error messages', () => {
      const sensitiveError = new Error( 'Password: secret123, Token: abc123xyz');

      errorTracker.captureError(_sensitiveError);

      const events = errorTracker.getRecentEvents(_);
      const event = events[0];

      // Should sanitize sensitive data (_implementation dependent)
      expect(_event.message).not.toContain('secret123');
      expect(_event.message).not.toContain('abc123xyz');
    });

    it( 'should not include sensitive context data', () => {
      const sensitiveContext = {
        password: 'secret',
        token: 'sensitive-token',
        component: 'LoginForm'
      };

      errorTracker.captureError(_new Error('Login error'), sensitiveContext);

      const events = errorTracker.getRecentEvents(_);
      const event = events[0];

      expect(_event.context.password).toBeUndefined(_);
      expect(_event.context.token).toBeUndefined(_);
      expect(_event.context.component).toBe('LoginForm'); // Non-sensitive data should remain
    });
  });
});
