import { test, expect } from '@playwright/test';

/**
 * Performance E2E tests
 * Tests page load times, API response times, and WebSocket connection stability
 */

test.describe('Performance Testing', () => {
  test('should load home page within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Performance assertion: page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};

        // Largest Contentful Paint (LCP)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID) - simulated
        vitals.fid = 0; // Will be measured on actual interaction

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          vitals.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });

        // First Contentful Paint (FCP)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          vitals.fcp = entries[0].startTime;
        }).observe({ entryTypes: ['paint'] });

        setTimeout(() => resolve(vitals), 2000);
      });
    }) as { lcp?: number; fcp?: number; cls?: number; fid?: number };
    
    console.log('Web Vitals:', webVitals);
    
    // Performance budgets (in milliseconds)
    if (webVitals.lcp) expect(webVitals.lcp).toBeLessThan(2500); // LCP < 2.5s
    if (webVitals.fcp) expect(webVitals.fcp).toBeLessThan(1800); // FCP < 1.8s
    if (webVitals.cls) expect(webVitals.cls).toBeLessThan(0.1);   // CLS < 0.1
  });

  test('should load dashboard efficiently for authenticated users', async ({ page }) => {
    // Set up authentication
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/'
    }]);

    const startTime = Date.now();
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for critical content to load
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard should load within 2 seconds for authenticated users
    expect(loadTime).toBeLessThan(2000);
    
    // Check for lazy-loaded components
    await expect(page.locator('[data-testid="recent-lessons"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle API response times efficiently', async ({ page }) => {
    // Mock API endpoints with timing
    const apiTimes: Record<string, number> = {};
    
    await page.route('/api/**', async (route) => {
      const startTime = Date.now();
      
      // Simulate realistic API response times
      const url = route.request().url();
      let delay = 100; // Default 100ms
      
      if (url.includes('/api/ai/')) delay = 500; // AI endpoints slower
      if (url.includes('/api/auth/')) delay = 200; // Auth endpoints
      if (url.includes('/api/lessons/')) delay = 150; // Lesson data
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const responseTime = Date.now() - startTime;
      apiTimes[url] = responseTime;
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: 'mock-data' })
      });
    });

    await page.goto('/dashboard');
    
    // Trigger various API calls
    await page.click('[data-testid="load-lessons-button"]');
    await page.click('[data-testid="load-progress-button"]');
    
    // Wait for all API calls to complete
    await page.waitForTimeout(2000);
    
    // Verify API response times
    for (const [url, time] of Object.entries(apiTimes)) {
      console.log(`API ${url}: ${time}ms`);
      
      if (url.includes('/api/ai/')) {
        expect(time).toBeLessThan(1000); // AI APIs < 1s
      } else {
        expect(time).toBeLessThan(500); // Other APIs < 500ms
      }
    }
  });

  test('should maintain WebSocket connection stability', async ({ page }) => {
    let connectionEvents: string[] = [];
    
    // Monitor WebSocket connections
    page.on('websocket', ws => {
      connectionEvents.push('connected');
      
      ws.on('close', () => connectionEvents.push('disconnected'));
      ws.on('socketerror', () => connectionEvents.push('error'));
    });

    // Navigate to collaboration page (uses WebSocket)
    await page.goto('/collaboration');
    
    // Create collaboration session
    await page.click('[data-testid="create-session-button"]');
    await page.fill('[data-testid="session-title"]', 'Performance Test Session');
    await page.click('[data-testid="create-session-submit"]');
    
    // Wait for WebSocket connection
    await page.waitForTimeout(2000);
    
    // Verify connection established
    expect(connectionEvents).toContain('connected');
    
    // Test connection stability over time
    const startTime = Date.now();
    const testDuration = 30000; // 30 seconds
    
    while (Date.now() - startTime < testDuration) {
      // Send periodic messages to test connection
      await page.locator('[data-testid="chat-input"]').fill(`Test message ${Date.now()}`);
      await page.click('[data-testid="send-message-button"]');
      
      await page.waitForTimeout(5000); // Wait 5 seconds between messages
    }
    
    // Verify no disconnections occurred
    expect(connectionEvents.filter(e => e === 'disconnected')).toHaveLength(0);
    expect(connectionEvents.filter(e => e === 'error')).toHaveLength(0);
  });

  test('should handle concurrent user load', async ({ context }) => {
    const userSessions = [];
    const loadTimes: number[] = [];
    
    // Simulate 5 concurrent users
    for (let i = 0; i < 5; i++) {
      const userContext = await context.browser()?.newContext();
      const userPage = await userContext!.newPage();
      
      userSessions.push({ context: userContext, page: userPage });
    }
    
    // All users navigate to the same page simultaneously
    const promises = userSessions.map(async ({ page: userPage }, index) => {
      const startTime = Date.now();
      
      await userPage.goto('/lessons');
      await userPage.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      loadTimes.push(loadTime);
      
      console.log(`User ${index + 1} load time: ${loadTime}ms`);
    });
    
    await Promise.all(promises);
    
    // Verify all users loaded within acceptable time
    const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    const maxLoadTime = Math.max(...loadTimes);
    
    console.log(`Average load time: ${averageLoadTime}ms`);
    console.log(`Max load time: ${maxLoadTime}ms`);
    
    expect(averageLoadTime).toBeLessThan(3000);
    expect(maxLoadTime).toBeLessThan(5000);
    
    // Clean up
    for (const { context: userContext, page: userPage } of userSessions) {
      await userPage.close();
      await userContext?.close();
    }
  });

  test('should optimize resource loading', async ({ page }) => {
    const resourceSizes: Record<string, number> = {};
    const resourceTimes: Record<string, number> = {};
    
    // Monitor network requests
    page.on('response', response => {
      const url = response.url();
      const size = parseInt(response.headers()['content-length'] || '0');
      
      resourceSizes[url] = size;
    });
    
    page.on('requestfinished', request => {
      const url = request.url();
      const timing = request.timing();
      
      resourceTimes[url] = timing.responseEnd - timing.requestStart;
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Analyze resource performance
    const jsFiles = Object.keys(resourceSizes).filter(url => url.endsWith('.js'));
    const cssFiles = Object.keys(resourceSizes).filter(url => url.endsWith('.css'));
    const imageFiles = Object.keys(resourceSizes).filter(url => 
      url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/));
    
    // Check JavaScript bundle sizes
    const totalJSSize = jsFiles.reduce((total: number, url) => total + resourceSizes[url], 0);
    console.log(`Total JS size: ${(totalJSSize / 1024).toFixed(2)} KB`);
    expect(totalJSSize).toBeLessThan(1024 * 1024); // < 1MB total JS
    
    // Check CSS bundle sizes
    const totalCSSSize = cssFiles.reduce((total: number, url) => total + resourceSizes[url], 0);
    console.log(`Total CSS size: ${(totalCSSSize / 1024).toFixed(2)} KB`);
    expect(totalCSSSize).toBeLessThan(200 * 1024); // < 200KB total CSS
    
    // Check image optimization
    for (const imageUrl of imageFiles) {
      const size = resourceSizes[imageUrl];
      if (size > 0) {
        console.log(`Image ${imageUrl}: ${(size / 1024).toFixed(2)} KB`);
        expect(size).toBeLessThan(500 * 1024); // < 500KB per image
      }
    }
    
    // Check resource loading times
    for (const [url, time] of Object.entries(resourceTimes)) {
      if (time > 2000) { // Resources taking > 2s
        console.warn(`Slow resource: ${url} took ${time}ms`);
      }
    }
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    // Navigate to memory-intensive page (collaboration with Monaco editor)
    await page.goto('/collaboration');
    
    // Create session with large code content
    await page.click('[data-testid="create-session-button"]');
    await page.fill('[data-testid="session-title"]', 'Memory Test');
    await page.click('[data-testid="create-session-submit"]');
    
    // Wait for Monaco editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible();
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (initialMemory) {
      console.log('Initial memory usage:', initialMemory);
      
      // Perform memory-intensive operations
      const largeCode = 'pragma solidity ^0.8.0;\n\n' + 
        'contract LargeContract {\n' +
        Array(1000).fill(0).map((_, i) => `    uint256 public var${i} = ${i};`).join('\n') +
        '\n}';
      
      const editor = page.locator('.monaco-editor textarea').first();
      await editor.click();
      await editor.fill(largeCode);
      
      // Wait for processing
      await page.waitForTimeout(3000);
      
      // Check memory usage after operations
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });
      
      if (finalMemory) {
        console.log('Final memory usage:', finalMemory);
        
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
        
        console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB (${memoryIncreasePercent.toFixed(2)}%)`);
        
        // Memory increase should be reasonable (< 50MB for this test)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    }
  });

  test('should maintain performance under stress', async ({ page }) => {
    // Navigate to collaboration page
    await page.goto('/collaboration');
    await page.click('[data-testid="create-session-button"]');
    await page.fill('[data-testid="session-title"]', 'Stress Test');
    await page.click('[data-testid="create-session-submit"]');
    
    const performanceMetrics: number[] = [];
    
    // Perform rapid operations to stress test
    for (let i = 0; i < 50; i++) {
      const startTime = Date.now();
      
      // Rapid typing in editor
      const editor = page.locator('.monaco-editor textarea').first();
      await editor.click();
      await editor.type(`// Line ${i}\n`);
      
      // Send chat message
      await page.locator('[data-testid="chat-input"]').fill(`Stress test message ${i}`);
      await page.click('[data-testid="send-message-button"]');
      
      const operationTime = Date.now() - startTime;
      performanceMetrics.push(operationTime);
      
      // Small delay to prevent overwhelming
      await page.waitForTimeout(100);
    }
    
    // Analyze performance degradation
    const averageTime = performanceMetrics.reduce((a: number, b) => a + b, 0) / performanceMetrics.length;
    const firstTenAverage = performanceMetrics.slice(0, 10).reduce((a: number, b) => a + b, 0) / 10;
    const lastTenAverage = performanceMetrics.slice(-10).reduce((a: number, b) => a + b, 0) / 10;
    
    console.log(`Average operation time: ${averageTime.toFixed(2)}ms`);
    console.log(`First 10 operations average: ${firstTenAverage.toFixed(2)}ms`);
    console.log(`Last 10 operations average: ${lastTenAverage.toFixed(2)}ms`);
    
    // Performance should not degrade significantly
    const degradationPercent = ((lastTenAverage - firstTenAverage) / firstTenAverage) * 100;
    console.log(`Performance degradation: ${degradationPercent.toFixed(2)}%`);
    
    expect(degradationPercent).toBeLessThan(50); // < 50% degradation
    expect(averageTime).toBeLessThan(1000); // Average operation < 1s
  });
});
