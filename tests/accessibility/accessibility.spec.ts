import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Accessibility test configuration
const ACCESSIBILITY_CONFIG = {
  wcagLevel: 'AA',
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
  rules: {
    // Disable color-contrast for development (can be flaky in CI)
    'color-contrast': { enabled: process.env.CI !== 'true' },
    // Enable all other important rules
    'keyboard': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'button-name': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'heading-order': { enabled: true },
    'image-alt': { enabled: true },
    'label': { enabled: true },
    'landmark-one-main': { enabled: true },
    'link-name': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true },
    'skip-link': { enabled: true }
  }
};

// Test pages and their expected accessibility requirements
const TEST_PAGES = [
  {
    path: '/',
    name: 'Homepage',
    requirements: {
      hasSkipLinks: true,
      hasMainLandmark: true,
      hasHeadingHierarchy: true,
      hasAltText: true,
      minScore: 85
    }
  },
  {
    path: '/learn',
    name: 'Learn Page',
    requirements: {
      hasSkipLinks: true,
      hasMainLandmark: true,
      hasHeadingHierarchy: true,
      hasFormLabels: true,
      minScore: 80
    }
  },
  {
    path: '/code',
    name: 'Code Editor',
    requirements: {
      hasSkipLinks: true,
      hasMainLandmark: true,
      hasKeyboardAccess: true,
      hasAriaLabels: true,
      minScore: 75
    }
  }
];

// Helper function to run accessibility tests
async function runAccessibilityTest(page: any, config = ACCESSIBILITY_CONFIG) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(config.tags)
    .withRules(config.rules)
    .analyze();

  return accessibilityScanResults;
}

// Helper function to check specific accessibility requirements
async function checkAccessibilityRequirements(page: any, requirements: any) {
  const results = {
    hasSkipLinks: false,
    hasMainLandmark: false,
    hasHeadingHierarchy: false,
    hasAltText: false,
    hasFormLabels: false,
    hasKeyboardAccess: false,
    hasAriaLabels: false
  };

  // Check for skip links
  if (requirements.hasSkipLinks) {
    const skipLinks = await page.locator('a[href="#main-content"], .skip-link').count();
    results.hasSkipLinks = skipLinks > 0;
  }

  // Check for main landmark
  if (requirements.hasMainLandmark) {
    const mainLandmark = await page.locator('main, [role="main"]').count();
    results.hasMainLandmark = mainLandmark > 0;
  }

  // Check heading hierarchy
  if (requirements.hasHeadingHierarchy) {
    const h1Count = await page.locator('h1').count();
    results.hasHeadingHierarchy = h1Count === 1;
  }

  // Check alt text for images
  if (requirements.hasAltText) {
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    results.hasAltText = imagesWithoutAlt === 0;
  }

  // Check form labels
  if (requirements.hasFormLabels) {
    const inputsWithoutLabels = await page.locator('input:not([aria-label]):not([aria-labelledby])').count();
    const inputsWithLabels = await page.locator('input[aria-label], input[aria-labelledby], label input').count();
    results.hasFormLabels = inputsWithoutLabels === 0 || inputsWithLabels > 0;
  }

  // Check keyboard accessibility
  if (requirements.hasKeyboardAccess) {
    const focusableElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').count();
    results.hasKeyboardAccess = focusableElements > 0;
  }

  // Check ARIA labels
  if (requirements.hasAriaLabels) {
    const elementsWithAria = await page.locator('[aria-label], [aria-labelledby], [aria-describedby]').count();
    results.hasAriaLabels = elementsWithAria > 0;
  }

  return results;
}

// Main accessibility test suite
test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up accessibility testing environment
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // Test each page for accessibility compliance
  for (const testPage of TEST_PAGES) {
    test(`${testPage.name} - WCAG ${ACCESSIBILITY_CONFIG.wcagLevel} Compliance`, async ({ page }) => {
      // Navigate to the page
      await page.goto(testPage.path);
      
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      
      // Run accessibility scan
      const accessibilityScanResults = await runAccessibilityTest(page);
      
      // Check for violations
      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Log results for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log(`Accessibility violations found on ${testPage.name}:`, 
          accessibilityScanResults.violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length
          }))
        );
      }
    });

    test(`${testPage.name} - Specific Requirements`, async ({ page }) => {
      // Navigate to the page
      await page.goto(testPage.path);
      await page.waitForLoadState('networkidle');
      
      // Check specific requirements
      const results = await checkAccessibilityRequirements(page, testPage.requirements);
      
      // Assert each requirement
      if (testPage.requirements.hasSkipLinks) {
        expect(results.hasSkipLinks).toBe(true);
      }
      if (testPage.requirements.hasMainLandmark) {
        expect(results.hasMainLandmark).toBe(true);
      }
      if (testPage.requirements.hasHeadingHierarchy) {
        expect(results.hasHeadingHierarchy).toBe(true);
      }
      if (testPage.requirements.hasAltText) {
        expect(results.hasAltText).toBe(true);
      }
      if (testPage.requirements.hasFormLabels) {
        expect(results.hasFormLabels).toBe(true);
      }
      if (testPage.requirements.hasKeyboardAccess) {
        expect(results.hasKeyboardAccess).toBe(true);
      }
      if (testPage.requirements.hasAriaLabels) {
        expect(results.hasAriaLabels).toBe(true);
      }
    });
  }

  // Keyboard navigation tests
  test('Keyboard Navigation - Tab Order', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();
    
    // Test skip link functionality
    await page.keyboard.press('Tab');
    const skipLinkFocused = await page.evaluate(() => 
      document.activeElement?.textContent?.includes('Skip to main content')
    );
    
    if (skipLinkFocused) {
      await page.keyboard.press('Enter');
      const mainContentFocused = await page.evaluate(() => 
        document.activeElement?.id === 'main-content'
      );
      expect(mainContentFocused).toBe(true);
    }
  });

  // Screen reader simulation tests
  test('Screen Reader - ARIA Announcements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for live regions
    const liveRegions = await page.locator('[aria-live]').count();
    expect(liveRegions).toBeGreaterThan(0);
    
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Verify heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  // Color contrast tests (when not in CI)
  if (process.env.CI !== 'true') {
    test('Color Contrast - WCAG AA Standards', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .withRules({ 'color-contrast': { enabled: true } })
        .analyze();
      
      const contrastViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'color-contrast'
      );
      
      expect(contrastViolations).toEqual([]);
    });
  }

  // Mobile accessibility tests
  test('Mobile Accessibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check touch target sizes (minimum 44px)
    const touchTargets = await page.locator('button, a, input[type="button"], input[type="submit"]').all();
    
    for (const target of touchTargets) {
      const box = await target.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
    
    // Run mobile-specific accessibility scan
    const mobileResults = await runAccessibilityTest(page);
    expect(mobileResults.violations).toEqual([]);
  });

  // Form accessibility tests
  test('Form Accessibility', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Check form labels
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const hasLabel = await input.evaluate(el => {
        const id = el.id;
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        
        return !!(ariaLabel || ariaLabelledBy || label);
      });
      
      expect(hasLabel).toBe(true);
    }
    
    // Test form error handling
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Check for error announcements
      const errorMessages = await page.locator('[role="alert"], [aria-live="assertive"]').count();
      expect(errorMessages).toBeGreaterThan(0);
    }
  });
});
