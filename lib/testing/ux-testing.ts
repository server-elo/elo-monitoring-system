/**
 * Comprehensive UX testing utilities and scenarios
 */

import { Page } from '@playwright/test';
import { expect } from '@playwright/test';

// UX Testing Scenarios
export interface UXTestScenario {
  id: string;
  name: string;
  description: string;
  category: 'loading' | 'error-handling' | 'navigation' | 'accessibility' | 'performance';
  priority: 'high' | 'medium' | 'low';
  userRole?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  steps: UXTestStep[];
  expectedOutcomes: string[];
  networkConditions?: 'fast' | 'slow' | 'offline' | 'intermittent';
}

export interface UXTestStep {
  action: string;
  selector?: string;
  input?: string;
  waitFor?: string | number;
  screenshot?: boolean;
  validate?: (page: Page) => Promise<void>;
}

// Network condition simulation
export class NetworkSimulator {
  static async simulateSlowNetwork(page: Page): Promise<void> {
    await page.route('**/*', async (route) => {
      // Add delay to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      await route.continue();
    });
  }

  static async simulateOfflineMode(page: Page): Promise<void> {
    await page.setOfflineMode(true);
  }

  static async simulateIntermittentConnection(page: Page): Promise<void> {
    const isOnline = true;
    
    await page.route('**/*', async (route) => {
      // Randomly drop requests to simulate intermittent connection
      if (Math.random() < 0.3) {
        await route.abort('internetdisconnected');
      } else {
        await route.continue();
      }
    });
  }

  static async resetNetworkConditions(page: Page): Promise<void> {
    await page.setOfflineMode(false);
    await page.unroute('**/*');
  }
}

// Loading state testing utilities
export class LoadingStateTestUtils {
  static async testSkeletonLoaders(page: Page, selectors: string[]): Promise<void> {
    for (const selector of selectors) {
      // Check if skeleton loader appears
      await expect(page.locator(selector)).toBeVisible();
      
      // Verify skeleton has proper ARIA attributes
      const skeleton = page.locator(selector);
      await expect(skeleton).toHaveAttribute('role', 'status');
      await expect(skeleton).toHaveAttribute('aria-label');
      
      // Check for glassmorphism styling
      const styles = await skeleton.evaluate(el => getComputedStyle(el));
      expect(styles.backdropFilter).toContain('blur');
    }
  }

  static async testProgressIndicators(page: Page): Promise<void> {
    // Test form submission progress
    await page.click('[data-testid="submit-button"]');
    
    // Check for loading spinner
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Check for progress bar if present
    const progressBar = page.locator('[data-testid="progress-bar"]');
    if (await progressBar.isVisible()) {
      // Verify progress increases over time
      const initialProgress = await progressBar.getAttribute('aria-valuenow');
      await page.waitForTimeout(1000);
      const laterProgress = await progressBar.getAttribute('aria-valuenow');
      expect(Number(laterProgress)).toBeGreaterThan(Number(initialProgress));
    }
  }

  static async testFileUploadProgress(page: Page, filePath: string): Promise<void> {
    // Start file upload
    await page.setInputFiles('[data-testid="file-input"]', filePath);
    
    // Check for upload progress component
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    
    // Verify progress indicators
    await expect(page.locator('[data-testid="upload-percentage"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-speed"]')).toBeVisible();
    
    // Test cancel functionality
    await page.click('[data-testid="cancel-upload"]');
    await expect(page.locator('[data-testid="upload-progress"]')).not.toBeVisible();
  }

  static async testDebouncedLoading(page: Page): Promise<void> {
    // Test search debouncing
    const searchInput = page.locator('[data-testid="search-input"]');
    
    // Type quickly - should not show loading immediately
    await searchInput.fill('test');
    await expect(page.locator('[data-testid="search-loading"]')).not.toBeVisible();
    
    // Wait for debounce delay
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="search-loading"]')).toBeVisible();
  }
}

// Error boundary testing utilities
export class ErrorBoundaryTestUtils {
  static async testComponentErrorBoundary(page: Page): Promise<void> {
    // Trigger component error
    await page.evaluate(() => {
      // Simulate component error
      const errorEvent = new Error('Test component error');
      window.dispatchEvent(new CustomEvent('test-error', { detail: errorEvent }));
    });
    
    // Check for error boundary fallback
    await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
    
    // Verify retry functionality
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="error-boundary"]')).not.toBeVisible();
  }

  static async testAsyncErrorBoundary(page: Page): Promise<void> {
    // Simulate API error
    await page.route('**/api/**', route => route.abort('failed'));
    
    // Trigger API call
    await page.click('[data-testid="api-trigger"]');
    
    // Check for async error boundary
    await expect(page.locator('[data-testid="async-error-boundary"]')).toBeVisible();
    
    // Test retry with exponential backoff
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="retry-count"]')).toContainText('1');
    
    // Reset network and retry
    await page.unroute('**/api/**');
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="async-error-boundary"]')).not.toBeVisible();
  }

  static async testRoleSpecificErrorMessages(page: Page, userRole: string): Promise<void> {
    // Trigger error
    await page.evaluate(() => {
      throw new Error('Test role-specific error');
    });
    
    // Check for role-specific error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    
    // Verify role-specific content
    if (userRole === 'ADMIN') {
      await expect(errorMessage).toContainText('System Error Detected');
      await expect(page.locator('[data-testid="error-logs-link"]')).toBeVisible();
    } else if (userRole === 'INSTRUCTOR') {
      await expect(errorMessage).toContainText('Course Content Error');
      await expect(page.locator('[data-testid="course-dashboard-link"]')).toBeVisible();
    } else {
      await expect(errorMessage).toContainText('Something went wrong');
      await expect(page.locator('[data-testid="continue-learning-link"]')).toBeVisible();
    }
  }
}

// Toast notification testing utilities
export class ToastTestUtils {
  static async testSuccessToast(page: Page): Promise<void> {
    // Trigger success action
    await page.click('[data-testid="success-trigger"]');
    
    // Check for success toast
    const toast = page.locator('[data-testid="toast-success"]');
    await expect(toast).toBeVisible();
    
    // Verify glassmorphism styling
    const styles = await toast.evaluate(el => getComputedStyle(el));
    expect(styles.backdropFilter).toContain('blur');
    
    // Test auto-dismiss
    await page.waitForTimeout(5000);
    await expect(toast).not.toBeVisible();
  }

  static async testCelebrationModal(page: Page): Promise<void> {
    // Trigger achievement
    await page.click('[data-testid="achievement-trigger"]');
    
    // Check for celebration modal
    await expect(page.locator('[data-testid="celebration-modal"]')).toBeVisible();
    
    // Verify confetti animation
    await expect(page.locator('[data-testid="confetti"]')).toBeVisible();
    
    // Test accessibility
    const modal = page.locator('[data-testid="celebration-modal"]');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-labelledby');
    
    // Test keyboard navigation
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  }

  static async testNotificationQueuing(page: Page): Promise<void> {
    // Trigger multiple notifications rapidly
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="notification-trigger"]');
    }
    
    // Check that notifications are queued properly
    const notifications = page.locator('[data-testid="toast"]');
    const count = await notifications.count();
    expect(count).toBeLessThanOrEqual(3); // Max 3 visible at once
    
    // Verify smart grouping
    await expect(page.locator('[data-testid="grouped-notification"]')).toBeVisible();
  }
}

// Navigation testing utilities
export class NavigationTestUtils {
  static async testSmartBackButton(page: Page): Promise<void> {
    // Navigate through pages
    await page.goto('/learn');
    await page.goto('/learn/lesson-1');
    
    // Test back button
    await page.click('[data-testid="smart-back-button"]');
    await expect(page).toHaveURL(/\/learn$/);
    
    // Test fallback when no history
    await page.goto('/isolated-page');
    await page.click('[data-testid="smart-back-button"]');
    await expect(page).toHaveURL('/');
  }

  static async testBreadcrumbs(page: Page): Promise<void> {
    await page.goto('/learn/course/lesson/exercise');
    
    // Check breadcrumb structure
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
    await expect(breadcrumbs).toBeVisible();
    
    // Test breadcrumb navigation
    await page.click('[data-testid="breadcrumb-course"]');
    await expect(page).toHaveURL(/\/learn\/course$/);
  }

  static async testContinueLearning(page: Page): Promise<void> {
    // Check for continue learning suggestions
    await expect(page.locator('[data-testid="continue-learning"]')).toBeVisible();
    
    // Test suggestion click
    await page.click('[data-testid="learning-suggestion"]:first-child');
    
    // Verify navigation occurred
    await expect(page).not.toHaveURL('/');
  }

  static async testDeadEndPrevention(page: Page): Promise<void> {
    // Navigate to potential dead end
    await page.goto('/course-complete');
    
    // Check for navigation options
    await expect(page.locator('[data-testid="next-steps"]')).toBeVisible();
    await expect(page.locator('[data-testid="continue-learning"]')).toBeVisible();
    
    // Test navigation suggestions
    const suggestions = page.locator('[data-testid="navigation-suggestion"]');
    expect(await suggestions.count()).toBeGreaterThan(0);
  }
}

// Accessibility testing utilities
export class AccessibilityTestUtils {
  static async testKeyboardNavigation(page: Page): Promise<void> {
    // Test tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus').getAttribute('data-testid');
    expect(focusedElement).toBeTruthy();
    
    // Test skip links
    await page.keyboard.press('Tab');
    const skipLink = page.locator('[data-testid="skip-link"]');
    if (await skipLink.isVisible()) {
      await page.keyboard.press('Enter');
      // Verify focus moved to main content
      focusedElement = await page.locator(':focus').getAttribute('data-testid');
      expect(focusedElement).toBe('main-content');
    }
  }

  static async testScreenReaderSupport(page: Page): Promise<void> {
    // Check for proper ARIA labels
    const interactiveElements = page.locator('button, a, input, select, textarea');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      const hasLabel = await element.getAttribute('aria-label') || 
                      await element.getAttribute('aria-labelledby') ||
                      await element.textContent();
      expect(hasLabel).toBeTruthy();
    }
  }

  static async testReducedMotionSupport(page: Page): Promise<void> {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Trigger animations
    await page.click('[data-testid="animation-trigger"]');
    
    // Verify animations are disabled or reduced
    const animatedElement = page.locator('[data-testid="animated-element"]');
    const styles = await animatedElement.evaluate(el => getComputedStyle(el));
    expect(styles.animationDuration).toBe('0s');
  }
}

// Performance testing utilities
export class PerformanceTestUtils {
  static async testLoadingPerformance(page: Page): Promise<void> {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 second max load time
  }

  static async testAnimationPerformance(page: Page): Promise<void> {
    // Monitor frame rate during animations
    await page.evaluate(() => {
      let frameCount = 0;
      const startTime = performance.now();
      
      function countFrames() {
        frameCount++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(countFrames);
        } else {
          (window as any).fps = frameCount;
        }
      }
      
      requestAnimationFrame(countFrames);
    });
    
    // Trigger animations
    await page.click('[data-testid="animation-trigger"]');
    await page.waitForTimeout(1000);
    
    // Check frame rate
    const fps = await page.evaluate(() => (window as any).fps);
    expect(fps).toBeGreaterThan(30); // Minimum 30 FPS
  }

  static async testMemoryUsage(page: Page): Promise<void> {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize);
    
    // Perform memory-intensive operations
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="memory-intensive-action"]');
      await page.waitForTimeout(100);
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
    
    // Check memory usage hasn't grown excessively
    const finalMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize);
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    }
  }
}

// Comprehensive UX test scenarios
export const UX_TEST_SCENARIOS: UXTestScenario[] = [
  {
    id: 'loading-states-comprehensive',
    name: 'Comprehensive Loading States',
    description: 'Test all loading states under various network conditions',
    category: 'loading',
    priority: 'high',
    steps: [
      { action: 'Navigate to dashboard', waitFor: 'networkidle' },
      { action: 'Test skeleton loaders', validate: async (page) => await LoadingStateTestUtils.testSkeletonLoaders(page, ['[data-testid="course-skeleton"]', '[data-testid="lesson-skeleton"]']) },
      { action: 'Test form submission loading', validate: async (page) => await LoadingStateTestUtils.testProgressIndicators(page) },
      { action: 'Test file upload progress', validate: async (page) => await LoadingStateTestUtils.testFileUploadProgress(page, 'test-file.pdf') }
    ],
    expectedOutcomes: [
      'Skeleton loaders appear with proper ARIA attributes',
      'Progress indicators show accurate progress',
      'File upload shows progress and allows cancellation',
      'All loading states respect reduced motion preferences'
    ],
    networkConditions: 'slow'
  },
  {
    id: 'error-handling-comprehensive',
    name: 'Comprehensive Error Handling',
    description: 'Test error boundaries and recovery mechanisms',
    category: 'error-handling',
    priority: 'high',
    steps: [
      { action: 'Test component error boundary', validate: async (page) => await ErrorBoundaryTestUtils.testComponentErrorBoundary(page) },
      { action: 'Test async error boundary', validate: async (page) => await ErrorBoundaryTestUtils.testAsyncErrorBoundary(page) },
      { action: 'Test role-specific error messages', validate: async (page) => await ErrorBoundaryTestUtils.testRoleSpecificErrorMessages(page, 'STUDENT') }
    ],
    expectedOutcomes: [
      'Error boundaries catch and display appropriate fallbacks',
      'Retry mechanisms work with exponential backoff',
      'Error messages are contextual to user role',
      'Recovery options are clearly presented'
    ]
  }
];

// Integration testing utilities
export class IntegrationTestUtils {
  static async testErrorTrackingIntegration(page: Page): Promise<void> {
    // Trigger error and verify it's tracked
    await page.evaluate(() => {
      // Simulate error that should be tracked
      throw new Error('Test integration error');
    });

    // Check that error was sent to tracking service
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('sentry') || request.url().includes('error-tracking')) {
        networkRequests.push(request);
      }
    });

    expect(networkRequests.length).toBeGreaterThan(0);
  }

  static async testSettingsIntegration(page: Page): Promise<void> {
    // Test that UX components respect user settings
    await page.goto('/settings');

    // Enable reduced motion
    await page.check('[data-testid="reduce-motion-toggle"]');
    await page.click('[data-testid="save-settings"]');

    // Navigate to page with animations
    await page.goto('/dashboard');

    // Verify animations are disabled
    const animatedElement = page.locator('[data-testid="animated-element"]');
    const styles = await animatedElement.evaluate(el => getComputedStyle(el));
    expect(styles.animationDuration).toBe('0s');
  }

  static async testNotificationSystemIntegration(page: Page): Promise<void> {
    // Test that UX components integrate with notification system
    await page.click('[data-testid="trigger-success"]');

    // Verify notification appears
    await expect(page.locator('[data-testid="notification"]')).toBeVisible();

    // Test celebration integration
    await page.click('[data-testid="trigger-achievement"]');
    await expect(page.locator('[data-testid="celebration-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="confetti"]')).toBeVisible();
  }
}

// Test runner utility
export class UXTestRunner {
  static async runScenario(page: Page, scenario: UXTestScenario): Promise<boolean> {
    console.log(`Running UX test scenario: ${scenario.name}`);

    try {
      // Set up network conditions
      if (scenario.networkConditions) {
        switch (scenario.networkConditions) {
          case 'slow':
            await NetworkSimulator.simulateSlowNetwork(page);
            break;
          case 'offline':
            await NetworkSimulator.simulateOfflineMode(page);
            break;
          case 'intermittent':
            await NetworkSimulator.simulateIntermittentConnection(page);
            break;
        }
      }

      // Execute test steps
      for (const step of scenario.steps) {
        console.log(`Executing step: ${step.action}`);

        if (step.selector && step.action.includes('click')) {
          await page.click(step.selector);
        }

        if (step.input && step.selector) {
          await page.fill(step.selector, step.input);
        }

        if (step.waitFor) {
          if (typeof step.waitFor === 'string') {
            await page.waitForSelector(step.waitFor);
          } else {
            await page.waitForTimeout(step.waitFor);
          }
        }

        if (step.screenshot) {
          await page.screenshot({ path: `test-screenshots/${scenario.id}-${step.action.replace(/\s+/g, '-')}.png` });
        }

        if (step.validate) {
          await step.validate(page);
        }
      }

      // Reset network conditions
      await NetworkSimulator.resetNetworkConditions(page);

      console.log(`✅ UX test scenario passed: ${scenario.name}`);
      return true;
    } catch (error) {
      console.error(`❌ UX test scenario failed: ${scenario.name}`, error);
      return false;
    }
  }

  static async runAllScenarios(page: Page, scenarios: UXTestScenario[] = UX_TEST_SCENARIOS): Promise<{ passed: number; failed: number; results: Array<{ scenario: string; passed: boolean }> }> {
    const results = [];
    let passed = 0;
    let failed = 0;

    for (const scenario of scenarios) {
      const result = await this.runScenario(page, scenario);
      results.push({ scenario: scenario.name, passed: result });

      if (result) {
        passed++;
      } else {
        failed++;
      }
    }

    return { passed, failed, results };
  }
}
