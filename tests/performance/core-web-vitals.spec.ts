import { test, expect, Page } from '@playwright/test';

interface WebVitalsMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  inp: number | null;
}

// Performance thresholds based on Google's Core Web Vitals
const PERFORMANCE_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  fid: { good: 100, poor: 300 },   // First Input Delay
  cls: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  fcp: { good: 1800, poor: 3000 }, // First Contentful Paint
  ttfb: { good: 800, poor: 1800 }, // Time to First Byte
  inp: { good: 200, poor: 500 },   // Interaction to Next Paint
};

async function measureWebVitals(page: Page): Promise<WebVitalsMetrics> {
  return await page.evaluate(() => {
    return new Promise<WebVitalsMetrics>((resolve) => {
      const metrics: WebVitalsMetrics = {
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: null,
        inp: null,
      };

      // Measure TTFB
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.ttfb = navigation.responseStart - navigation.requestStart;
      }

      // Measure FCP
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }

      let metricsCollected = 0;
      const totalMetrics = 4; // LCP, FID, CLS, INP

      const checkComplete = () => {
        metricsCollected++;
        if (metricsCollected >= totalMetrics) {
          resolve(metrics);
        }
      };

      // Use PerformanceObserver for other metrics
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              metrics.lcp = entry.startTime;
              checkComplete();
              break;
            case 'first-input':
              metrics.fid = (entry as any).processingStart - entry.startTime;
              checkComplete();
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                metrics.cls = (metrics.cls || 0) + (entry as any).value;
              }
              break;
          }
        });
      });

      observer.observe({ 
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] 
      });

      // Simulate CLS completion after a delay
      setTimeout(() => {
        checkComplete();
      }, 2000);

      // Measure INP (simplified version)
      let maxINP = 0;
      const inputHandler = (event: Event) => {
        const startTime = performance.now();
        requestAnimationFrame(() => {
          const inp = performance.now() - startTime;
          maxINP = Math.max(maxINP, inp);
          metrics.inp = maxINP;
        });
      };

      ['click', 'keydown', 'pointerdown'].forEach(eventType => {
        document.addEventListener(eventType, inputHandler, { passive: true });
      });

      setTimeout(() => {
        checkComplete();
      }, 3000);

      // Fallback timeout
      setTimeout(() => {
        resolve(metrics);
      }, 5000);
    });
  });
}

test.describe('Core Web Vitals Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cache and cookies for consistent testing
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('Homepage performance meets Core Web Vitals thresholds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    
    // Measure Core Web Vitals
    const metrics = await measureWebVitals(page);
    
    console.log('Core Web Vitals:', metrics);
    
    // Assert performance thresholds
    if (metrics.lcp !== null) {
      expect(metrics.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.lcp.poor);
      console.log(`LCP: ${metrics.lcp}ms (${metrics.lcp < PERFORMANCE_THRESHOLDS.lcp.good ? 'Good' : 'Needs Improvement'})`);
    }
    
    if (metrics.fcp !== null) {
      expect(metrics.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.fcp.poor);
      console.log(`FCP: ${metrics.fcp}ms (${metrics.fcp < PERFORMANCE_THRESHOLDS.fcp.good ? 'Good' : 'Needs Improvement'})`);
    }
    
    if (metrics.cls !== null) {
      expect(metrics.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cls.poor);
      console.log(`CLS: ${metrics.cls} (${metrics.cls < PERFORMANCE_THRESHOLDS.cls.good ? 'Good' : 'Needs Improvement'})`);
    }
    
    if (metrics.ttfb !== null) {
      expect(metrics.ttfb).toBeLessThan(PERFORMANCE_THRESHOLDS.ttfb.poor);
      console.log(`TTFB: ${metrics.ttfb}ms (${metrics.ttfb < PERFORMANCE_THRESHOLDS.ttfb.good ? 'Good' : 'Needs Improvement'})`);
    }
  });

  test('Learn page performance', async ({ page }) => {
    await page.goto('/learn', { waitUntil: 'networkidle' });
    
    const metrics = await measureWebVitals(page);
    console.log('Learn page metrics:', metrics);
    
    // Learn page should load quickly
    if (metrics.lcp !== null) {
      expect(metrics.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.lcp.poor);
    }
  });

  test('Code editor performance', async ({ page }) => {
    await page.goto('/code', { waitUntil: 'networkidle' });
    
    // Wait for Monaco Editor to load
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });
    
    const metrics = await measureWebVitals(page);
    console.log('Code editor metrics:', metrics);
    
    // Code editor might take longer to load due to Monaco
    if (metrics.lcp !== null) {
      expect(metrics.lcp).toBeLessThan(6000); // More lenient for heavy components
    }
  });

  test('Dashboard performance', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    
    const metrics = await measureWebVitals(page);
    console.log('Dashboard metrics:', metrics);
    
    if (metrics.lcp !== null) {
      expect(metrics.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.lcp.poor);
    }
  });
});

test.describe('Resource Loading Performance', () => {
  test('Critical resources load within budget', async ({ page }) => {
    const resourceTimings: Array<{
      name: string;
      duration: number;
      size: number;
      type: string;
    }> = [];

    page.on('response', async (response) => {
      const request = response.request();
      const timing = await response.finished();
      
      if (timing) {
        const url = new URL(request.url());
        const resourceType = request.resourceType();
        
        resourceTimings.push({
          name: url.pathname,
          duration: timing,
          size: parseInt(response.headers()['content-length'] || '0'),
          type: resourceType,
        });
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Analyze resource timings
    const criticalResources = resourceTimings.filter(r => 
      r.type === 'document' || 
      r.type === 'stylesheet' || 
      r.name.includes('critical')
    );

    console.log('Critical resources:', criticalResources);

    // Critical resources should load quickly
    criticalResources.forEach(resource => {
      expect(resource.duration).toBeLessThan(2000);
    });

    // Check total bundle size
    const jsResources = resourceTimings.filter(r => r.name.endsWith('.js'));
    const totalJSSize = jsResources.reduce((sum, r) => sum + r.size, 0);
    
    console.log(`Total JS bundle size: ${(totalJSSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Bundle size should be reasonable (under 2MB for initial load)
    expect(totalJSSize).toBeLessThan(2 * 1024 * 1024);
  });

  test('Images are optimized and load efficiently', async ({ page }) => {
    const imageTimings: Array<{
      url: string;
      duration: number;
      size: number;
      format: string;
    }> = [];

    page.on('response', async (response) => {
      const contentType = response.headers()['content-type'] || '';
      
      if (contentType.startsWith('image/')) {
        const timing = await response.finished();
        const size = parseInt(response.headers()['content-length'] || '0');
        
        imageTimings.push({
          url: response.url(),
          duration: timing || 0,
          size,
          format: contentType,
        });
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    console.log('Image loading performance:', imageTimings);

    // Check that modern formats are being used
    const modernFormats = imageTimings.filter(img => 
      img.format.includes('webp') || img.format.includes('avif')
    );

    if (imageTimings.length > 0) {
      const modernFormatRatio = modernFormats.length / imageTimings.length;
      console.log(`Modern format usage: ${(modernFormatRatio * 100).toFixed(1)}%`);
      
      // At least 50% of images should use modern formats
      expect(modernFormatRatio).toBeGreaterThan(0.5);
    }

    // Images should load within reasonable time
    imageTimings.forEach(image => {
      expect(image.duration).toBeLessThan(3000);
    });
  });
});

test.describe('Interaction Performance', () => {
  test('Navigation is responsive', async ({ page }) => {
    await page.goto('/');
    
    // Measure navigation timing
    const startTime = Date.now();
    await page.click('a[href="/learn"]');
    await page.waitForURL('/learn');
    const navigationTime = Date.now() - startTime;
    
    console.log(`Navigation time: ${navigationTime}ms`);
    expect(navigationTime).toBeLessThan(1000);
  });

  test('Button interactions are responsive', async ({ page }) => {
    await page.goto('/');
    
    // Find interactive buttons
    const buttons = await page.locator('button').all();
    
    for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
      const startTime = Date.now();
      await button.click();
      
      // Wait for any visual feedback
      await page.waitForTimeout(100);
      
      const responseTime = Date.now() - startTime;
      console.log(`Button response time: ${responseTime}ms`);
      
      // Interactions should feel instant (under 100ms)
      expect(responseTime).toBeLessThan(200);
    }
  });

  test('Form inputs are responsive', async ({ page }) => {
    await page.goto('/auth');
    
    const emailInput = page.locator('input[type="email"]').first();
    
    if (await emailInput.isVisible()) {
      const startTime = Date.now();
      await emailInput.fill('test@example.com');
      
      // Wait for any validation or visual feedback
      await page.waitForTimeout(50);
      
      const responseTime = Date.now() - startTime;
      console.log(`Input response time: ${responseTime}ms`);
      
      expect(responseTime).toBeLessThan(100);
    }
  });
});

test.describe('Mobile Performance', () => {
  test.use({ 
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });

  test('Mobile performance meets thresholds', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const metrics = await measureWebVitals(page);
    console.log('Mobile metrics:', metrics);
    
    // Mobile should still meet performance thresholds
    if (metrics.lcp !== null) {
      expect(metrics.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.lcp.poor);
    }
    
    if (metrics.cls !== null) {
      expect(metrics.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cls.poor);
    }
  });

  test('Touch interactions are responsive on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Test touch interactions
    const startTime = Date.now();
    await page.tap('button:visible');
    await page.waitForTimeout(100);
    const responseTime = Date.now() - startTime;
    
    console.log(`Touch response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(200);
  });
});
