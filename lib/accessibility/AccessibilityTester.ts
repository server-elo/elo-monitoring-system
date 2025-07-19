import { configure, run, Result } from 'axe-core';

export interface AccessibilityTestResult {
  violations: Result[];
  passes: Result[];
  incomplete: Result[];
  inapplicable: Result[];
  summary: {
    violationCount: number;
    passCount: number;
    incompleteCount: number;
    criticalIssues: number;
    seriousIssues: number;
    moderateIssues: number;
    minorIssues: number;
  };
  wcagLevel: 'AA' | 'AAA';
  score: number; // 0-100 accessibility score
}

export interface AccessibilityTestOptions {
  wcagLevel?: 'AA' | 'AAA';
  tags?: string[];
  rules?: Record<string, { enabled: boolean }>;
  includeSelectors?: string[];
  excludeSelectors?: string[];
  timeout?: number;
}

export class AccessibilityTester {
  private static instance: AccessibilityTester;
  private isConfigured = false;

  static getInstance(): AccessibilityTester {
    if (!AccessibilityTester.instance) {
      AccessibilityTester.instance = new AccessibilityTester();
    }
    return AccessibilityTester.instance;
  }

  private constructor() {
    this.configureAxe();
  }

  private configureAxe(): void {
    if (this.isConfigured) return;

    configure({
      rules: [
        // Enable all WCAG 2.1 AA rules
        { id: 'color-contrast', enabled: true },
        { id: 'keyboard-navigation', enabled: true },
        { id: 'focus-order-semantics', enabled: true },
        { id: 'aria-valid-attr', enabled: true },
        { id: 'aria-valid-attr-value', enabled: true },
        { id: 'aria-labelledby', enabled: true },
        { id: 'aria-describedby', enabled: true },
        { id: 'button-name', enabled: true },
        { id: 'form-field-multiple-labels', enabled: true },
        { id: 'input-image-alt', enabled: true },
        { id: 'label', enabled: true },
        { id: 'link-name', enabled: true },
        { id: 'image-alt', enabled: true },
        { id: 'heading-order', enabled: true },
        { id: 'landmark-one-main', enabled: true },
        { id: 'page-has-heading-one', enabled: true },
        { id: 'region', enabled: true },
        { id: 'skip-link', enabled: true },
        { id: 'tabindex', enabled: true },
        { id: 'focus-order-semantics', enabled: true }
      ],
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
    });

    this.isConfigured = true;
  }

  async testElement(
    element: HTMLElement,
    options: AccessibilityTestOptions = {}
  ): Promise<AccessibilityTestResult> {
    const {
      wcagLevel = 'AA',
      tags = ['wcag2a', 'wcag2aa', 'wcag21aa'],
      rules = {},
      includeSelectors = [],
      excludeSelectors = [],
      timeout = 5000
    } = options;

    try {
      const results = await run(element, {
        tags,
        rules,
        include: includeSelectors.length > 0 ? [includeSelectors] : undefined,
        exclude: excludeSelectors.length > 0 ? [excludeSelectors] : undefined,
        timeout
      });

      return this.processResults(results, wcagLevel);
    } catch (error) {
      console.error('Accessibility test failed:', error);
      throw new Error(`Accessibility test failed: ${error}`);
    }
  }

  async testPage(options: AccessibilityTestOptions = {}): Promise<AccessibilityTestResult> {
    return this.testElement(document.body, options);
  }

  private processResults(results: any, wcagLevel: 'AA' | 'AAA'): AccessibilityTestResult {
    const { violations, passes, incomplete, inapplicable } = results;

    // Count issues by severity
    let criticalIssues = 0;
    let seriousIssues = 0;
    let moderateIssues = 0;
    let minorIssues = 0;

    violations.forEach((violation: any) => {
      switch (violation.impact) {
        case 'critical':
          criticalIssues += violation.nodes.length;
          break;
        case 'serious':
          seriousIssues += violation.nodes.length;
          break;
        case 'moderate':
          moderateIssues += violation.nodes.length;
          break;
        case 'minor':
          minorIssues += violation.nodes.length;
          break;
      }
    });

    // Calculate accessibility score (0-100)
    const totalIssues = criticalIssues + seriousIssues + moderateIssues + minorIssues;
    const totalTests = violations.length + passes.length;
    const score = totalTests > 0 ? Math.max(0, Math.round(((totalTests - totalIssues) / totalTests) * 100)) : 100;

    return {
      violations,
      passes,
      incomplete,
      inapplicable,
      summary: {
        violationCount: violations.length,
        passCount: passes.length,
        incompleteCount: incomplete.length,
        criticalIssues,
        seriousIssues,
        moderateIssues,
        minorIssues
      },
      wcagLevel,
      score
    };
  }

  generateReport(result: AccessibilityTestResult): string {
    const { summary, score, wcagLevel } = result;
    
    let report = `\n🔍 ACCESSIBILITY TEST REPORT (WCAG ${wcagLevel})\n`;
    report += `${'='.repeat(50)}\n\n`;
    
    report += `📊 OVERALL SCORE: ${score}/100\n\n`;
    
    report += `📈 SUMMARY:\n`;
    report += `  ✅ Passed: ${summary.passCount} tests\n`;
    report += `  ❌ Failed: ${summary.violationCount} tests\n`;
    report += `  ⚠️  Incomplete: ${summary.incompleteCount} tests\n\n`;
    
    if (summary.violationCount > 0) {
      report += `🚨 ISSUES BY SEVERITY:\n`;
      if (summary.criticalIssues > 0) report += `  🔴 Critical: ${summary.criticalIssues}\n`;
      if (summary.seriousIssues > 0) report += `  🟠 Serious: ${summary.seriousIssues}\n`;
      if (summary.moderateIssues > 0) report += `  🟡 Moderate: ${summary.moderateIssues}\n`;
      if (summary.minorIssues > 0) report += `  🔵 Minor: ${summary.minorIssues}\n`;
      report += `\n`;
    }
    
    if (result.violations.length > 0) {
      report += `❌ VIOLATIONS:\n`;
      result.violations.forEach((violation, index) => {
        report += `\n${index + 1}. ${violation.description}\n`;
        report += `   Impact: ${violation.impact}\n`;
        report += `   Help: ${violation.helpUrl}\n`;
        report += `   Elements: ${violation.nodes.length}\n`;
      });
    }
    
    return report;
  }

  // Quick accessibility checks for common issues
  async quickCheck(element: HTMLElement): Promise<{
    hasSkipLinks: boolean;
    hasProperHeadings: boolean;
    hasAltText: boolean;
    hasFormLabels: boolean;
    hasKeyboardAccess: boolean;
    colorContrast: boolean;
  }> {
    const result = await this.testElement(element, {
      tags: ['wcag2aa'],
      rules: {
        'skip-link': { enabled: true },
        'heading-order': { enabled: true },
        'image-alt': { enabled: true },
        'label': { enabled: true },
        'keyboard': { enabled: true },
        'color-contrast': { enabled: true }
      }
    });

    return {
      hasSkipLinks: !result.violations.some(v => v.id === 'skip-link'),
      hasProperHeadings: !result.violations.some(v => v.id === 'heading-order'),
      hasAltText: !result.violations.some(v => v.id === 'image-alt'),
      hasFormLabels: !result.violations.some(v => v.id === 'label'),
      hasKeyboardAccess: !result.violations.some(v => v.id.includes('keyboard')),
      colorContrast: !result.violations.some(v => v.id === 'color-contrast')
    };
  }

  // Test specific component types
  async testButton(button: HTMLElement): Promise<AccessibilityTestResult> {
    return this.testElement(button, {
      tags: ['wcag2aa'],
      rules: {
        'button-name': { enabled: true },
        'color-contrast': { enabled: true },
        'focus-order-semantics': { enabled: true }
      }
    });
  }

  async testForm(form: HTMLElement): Promise<AccessibilityTestResult> {
    return this.testElement(form, {
      tags: ['wcag2aa'],
      rules: {
        'label': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true }
      }
    });
  }

  async testNavigation(nav: HTMLElement): Promise<AccessibilityTestResult> {
    return this.testElement(nav, {
      tags: ['wcag2aa'],
      rules: {
        'link-name': { enabled: true },
        'skip-link': { enabled: true },
        'landmark-one-main': { enabled: true },
        'region': { enabled: true }
      }
    });
  }

  async testModal(modal: HTMLElement): Promise<AccessibilityTestResult> {
    return this.testElement(modal, {
      tags: ['wcag2aa'],
      rules: {
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'aria-labelledby': { enabled: true }
      }
    });
  }
}

// Export singleton instance
export const accessibilityTester = AccessibilityTester.getInstance();

// Utility function for quick testing in development
export async function testAccessibility(element?: HTMLElement): Promise<void> {
  if (process.env.NODE_ENV !== 'development') return;

  const targetElement = element || document.body;
  const result = await accessibilityTester.testElement(targetElement);
  
  console.group('🔍 Accessibility Test Results');
  console.log(accessibilityTester.generateReport(result));
  
  if (result.violations.length > 0) {
    console.warn('Accessibility violations found:', result.violations);
  }
  
  console.groupEnd();
}
