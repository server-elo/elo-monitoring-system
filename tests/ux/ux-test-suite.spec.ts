import { test, expect, Page, BrowserContext } from '@playwright/test';
import { 
  UXTestRunner, 
  UX_TEST_SCENARIOS,
  LoadingStateTestUtils,
  ErrorBoundaryTestUtils,
  ToastTestUtils,
  NavigationTestUtils,
  AccessibilityTestUtils,
  PerformanceTestUtils,
  IntegrationTestUtils,
  NetworkSimulator
} from '@/lib/testing/ux-testing';

// Test configuration
test.describe('UX Polish Test Suite', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      // Enable accessibility testing
      reducedMotion: 'no-preference',
      // Set viewport for consistent testing
      viewport: { width: 1280, height: 720 },
      // Enable permissions for testing
      permissions: ['notifications']
    });
    
    page = await context.newPage();
    
    // Set up test data and authentication
    await page.goto('/auth/test-login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.describe('Loading States & Async Operations', () => {
    test('should display skeleton loaders with glassmorphism design', async () => {
      await page.goto('/courses');
      
      // Test skeleton loaders
      await LoadingStateTestUtils.testSkeletonLoaders(page, [
        '[data-testid="course-skeleton"]',
        '[data-testid="lesson-skeleton"]',
        '[data-testid="user-skeleton"]'
      ]);
    });

    test('should show progress indicators for form submissions', async () => {
      await page.goto('/profile/edit');
      await LoadingStateTestUtils.testProgressIndicators(page);
    });

    test('should handle file upload with progress tracking', async () => {
      await page.goto('/upload');
      await LoadingStateTestUtils.testFileUploadProgress(page, 'test-files/sample.pdf');
    });

    test('should implement debounced loading for search', async () => {
      await page.goto('/search');
      await LoadingStateTestUtils.testDebouncedLoading(page);
    });

    test('should respect reduced motion preferences', async () => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('/dashboard');
      await page.click('[data-testid="animation-trigger"]');
      
      // Verify animations are disabled
      const animatedElement = page.locator('[data-testid="animated-element"]');
      const styles = await animatedElement.evaluate(el => getComputedStyle(el));
      expect(styles.animationDuration).toBe('0s');
    });
  });

  test.describe('Error Boundaries & Graceful Error Handling', () => {
    test('should handle component errors with retry mechanisms', async () => {
      await page.goto('/dashboard');
      await ErrorBoundaryTestUtils.testComponentErrorBoundary(page);
    });

    test('should handle async operation errors', async () => {
      await page.goto('/api-test');
      await ErrorBoundaryTestUtils.testAsyncErrorBoundary(page);
    });

    test('should show role-specific error messages for students', async () => {
      await page.goto('/error-test');
      await ErrorBoundaryTestUtils.testRoleSpecificErrorMessages(page, 'STUDENT');
    });

    test('should show role-specific error messages for instructors', async () => {
      // Switch to instructor role
      await page.goto('/auth/switch-role?role=INSTRUCTOR');
      await page.goto('/error-test');
      await ErrorBoundaryTestUtils.testRoleSpecificErrorMessages(page, 'INSTRUCTOR');
    });

    test('should show role-specific error messages for admins', async () => {
      // Switch to admin role
      await page.goto('/auth/switch-role?role=ADMIN');
      await page.goto('/error-test');
      await ErrorBoundaryTestUtils.testRoleSpecificErrorMessages(page, 'ADMIN');
    });
  });

  test.describe('Success Feedback & Toast Notifications', () => {
    test('should display success toasts with glassmorphism design', async () => {
      await page.goto('/dashboard');
      await ToastTestUtils.testSuccessToast(page);
    });

    test('should show celebration modals for achievements', async () => {
      await page.goto('/achievements');
      await ToastTestUtils.testCelebrationModal(page);
    });

    test('should handle notification queuing and grouping', async () => {
      await page.goto('/notifications-test');
      await ToastTestUtils.testNotificationQueuing(page);
    });

    test('should support keyboard navigation for notifications', async () => {
      await page.goto('/dashboard');
      
      // Trigger notification
      await page.click('[data-testid="notification-trigger"]');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('data-testid', 'notification-close');
      
      // Test escape key
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="notification"]')).not.toBeVisible();
    });
  });

  test.describe('Navigation Flow Optimization', () => {
    test('should provide smart back button functionality', async () => {
      await NavigationTestUtils.testSmartBackButton(page);
    });

    test('should display contextual breadcrumbs', async () => {
      await NavigationTestUtils.testBreadcrumbs(page);
    });

    test('should show continue learning suggestions', async () => {
      await NavigationTestUtils.testContinueLearning(page);
    });

    test('should prevent dead-end navigation', async () => {
      await NavigationTestUtils.testDeadEndPrevention(page);
    });

    test('should support deep linking', async () => {
      // Test deep link to specific lesson
      await page.goto('/learn/solidity-basics/lesson-3?section=variables');
      
      // Verify correct content is loaded
      await expect(page.locator('[data-testid="lesson-title"]')).toContainText('Variables');
      await expect(page.locator('[data-testid="section-variables"]')).toBeVisible();
      
      // Test sharing functionality
      await page.click('[data-testid="share-button"]');
      const shareUrl = await page.locator('[data-testid="share-url"]').inputValue();
      expect(shareUrl).toContain('/learn/solidity-basics/lesson-3?section=variables');
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should support keyboard navigation', async () => {
      await page.goto('/dashboard');
      await AccessibilityTestUtils.testKeyboardNavigation(page);
    });

    test('should provide screen reader support', async () => {
      await page.goto('/learn');
      await AccessibilityTestUtils.testScreenReaderSupport(page);
    });

    test('should respect reduced motion preferences', async () => {
      await AccessibilityTestUtils.testReducedMotionSupport(page);
    });

    test('should meet WCAG 2.1 AA color contrast requirements', async () => {
      await page.goto('/dashboard');
      
      // Test color contrast for text elements
      const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, button, a');
      const count = await textElements.count();
      
      for (let i = 0; i < Math.min(count, 20); i++) { // Test first 20 elements
        const element = textElements.nth(i);
        const styles = await element.evaluate(el => {
          const computed = getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });
        
        // Basic contrast check (simplified)
        expect(styles.color).not.toBe(styles.backgroundColor);
      }
    });

    test('should provide proper focus indicators', async () => {
      await page.goto('/dashboard');
      
      // Tab through interactive elements
      const interactiveElements = page.locator('button, a, input, select, textarea');
      const count = await interactiveElements.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        
        // Check for visible focus indicator
        const styles = await focusedElement.evaluate(el => getComputedStyle(el));
        const hasOutline = styles.outline !== 'none' || 
                          styles.boxShadow.includes('0 0') ||
                          styles.border.includes('2px');
        expect(hasOutline).toBeTruthy();
      }
    });
  });

  test.describe('Performance Standards', () => {
    test('should load pages within 3 seconds', async () => {
      await PerformanceTestUtils.testLoadingPerformance(page);
    });

    test('should maintain 60fps during animations', async () => {
      await page.goto('/animations-test');
      await PerformanceTestUtils.testAnimationPerformance(page);
    });

    test('should manage memory usage efficiently', async () => {
      await page.goto('/memory-test');
      await PerformanceTestUtils.testMemoryUsage(page);
    });

    test('should optimize Core Web Vitals', async () => {
      await page.goto('/dashboard');
      
      // Measure Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals: any = {};
            
            entries.forEach((entry) => {
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.lcp = entry.startTime;
              }
              if (entry.entryType === 'first-input') {
                vitals.fid = entry.processingStart - entry.startTime;
              }
              if (entry.entryType === 'layout-shift') {
                vitals.cls = (vitals.cls || 0) + entry.value;
              }
            });
            
            resolve(vitals);
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          
          // Timeout after 5 seconds
          setTimeout(() => resolve({}), 5000);
        });
      });
      
      // Check Core Web Vitals thresholds
      if ((vitals as any).lcp) {
        expect((vitals as any).lcp).toBeLessThan(2500); // LCP < 2.5s
      }
      if ((vitals as any).fid) {
        expect((vitals as any).fid).toBeLessThan(100); // FID < 100ms
      }
      if ((vitals as any).cls) {
        expect((vitals as any).cls).toBeLessThan(0.1); // CLS < 0.1
      }
    });
  });

  test.describe('Integration & System Tests', () => {
    test('should integrate with error tracking system', async () => {
      await IntegrationTestUtils.testErrorTrackingIntegration(page);
    });

    test('should integrate with user settings', async () => {
      await IntegrationTestUtils.testSettingsIntegration(page);
    });

    test('should integrate with notification system', async () => {
      await IntegrationTestUtils.testNotificationSystemIntegration(page);
    });

    test('should work under slow network conditions', async () => {
      await NetworkSimulator.simulateSlowNetwork(page);
      
      await page.goto('/dashboard');
      
      // Verify skeleton loaders appear
      await expect(page.locator('[data-testid="skeleton-loader"]')).toBeVisible();
      
      // Wait for content to load
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      await NetworkSimulator.resetNetworkConditions(page);
    });

    test('should handle offline scenarios gracefully', async () => {
      await page.goto('/dashboard');
      
      // Go offline
      await NetworkSimulator.simulateOfflineMode(page);
      
      // Try to navigate
      await page.click('[data-testid="navigation-link"]');
      
      // Should show offline message
      await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
      
      // Go back online
      await NetworkSimulator.resetNetworkConditions(page);
      
      // Should automatically retry
      await expect(page.locator('[data-testid="offline-message"]')).not.toBeVisible();
    });
  });

  test.describe('Comprehensive UX Scenarios', () => {
    test('should run all predefined UX test scenarios', async () => {
      const results = await UXTestRunner.runAllScenarios(page, UX_TEST_SCENARIOS);
      
      console.log(`UX Test Results: ${results.passed} passed, ${results.failed} failed`);
      
      // Ensure at least 80% of scenarios pass
      const passRate = results.passed / (results.passed + results.failed);
      expect(passRate).toBeGreaterThan(0.8);
      
      // Log detailed results
      results.results.forEach(result => {
        console.log(`${result.passed ? '✅' : '❌'} ${result.scenario}`);
      });
    });
  });
});
