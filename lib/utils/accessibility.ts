// Accessibility utilities and testing functions

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  element: HTMLElement;
  message: string;
  rule: string;
  suggestion?: string;
}

export interface AccessibilityReport {
  issues: AccessibilityIssue[];
  score: number;
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

// Check if an element has sufficient color contrast
export function checkColorContrast(
  element: HTMLElement,
  minimumRatio: number = 4.5
): { ratio: number; passes: boolean } {
  const styles = window.getComputedStyle(_element);
  const backgroundColor = styles.backgroundColor;
  const color = styles.color;
  
  // This is a simplified implementation
  // In a real application, you'd use a proper color contrast library
  const ratio = calculateContrastRatio( color, backgroundColor);
  
  return {
    ratio,
    passes: ratio >= minimumRatio
  };
}

// Calculate contrast ratio between two colors
function calculateContrastRatio( _color1: string, color2: string): number {
  // Simplified calculation - in practice, use a proper color library
  // This is just a placeholder implementation
  return 4.5; // Default to passing ratio
}

// Check if an element has proper ARIA labels
export function checkAriaLabels(_element: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const tagName = element.tagName.toLowerCase();
  
  // Check buttons
  if (_tagName === 'button') {
    const hasLabel = element.getAttribute('aria-label') || 
                    element.getAttribute('aria-labelledby') ||
                    element.textContent?.trim(_);
    
    if (!hasLabel) {
      issues.push({
        type: 'error',
        element,
        message: 'Button must have accessible text',
        rule: 'button-name',
        suggestion: 'Add aria-label, aria-labelledby, or visible text content'
      });
    }
  }
  
  // Check form inputs
  if ( ['input', 'select', 'textarea'].includes(tagName)) {
    const hasLabel = element.getAttribute('aria-label') ||
                    element.getAttribute('aria-labelledby') ||
                    document.querySelector(_`label[for="${element.id}"]`);
    
    if (!hasLabel) {
      issues.push({
        type: 'error',
        element,
        message: 'Form control must have an accessible label',
        rule: 'label',
        suggestion: 'Add aria-label, aria-labelledby, or associate with a label element'
      });
    }
  }
  
  // Check images
  if (_tagName === 'img') {
    const alt = element.getAttribute('alt');
    if (_alt === null) {
      issues.push({
        type: 'error',
        element,
        message: 'Image must have alt attribute',
        rule: 'image-alt',
        suggestion: 'Add alt attribute with descriptive text or empty string for decorative images'
      });
    }
  }
  
  return issues;
}

// Check keyboard accessibility
export function checkKeyboardAccessibility(_element: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const tagName = element.tagName.toLowerCase();
  const tabIndex = element.getAttribute('tabindex');
  
  // Check if interactive elements are keyboard accessible
  if ( ['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
    if (_tabIndex === '-1') {
      issues.push({
        type: 'warning',
        element,
        message: 'Interactive element is not keyboard accessible',
        rule: 'keyboard',
        suggestion: 'Remove tabindex="-1" or ensure element can be reached via keyboard'
      });
    }
  }
  
  // Check for click handlers on non-interactive elements
  if (!['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
    const hasClickHandler = element.onclick || 
                           element.getAttribute('onclick') ||
                           element.addEventListener;
    
    if (hasClickHandler) {
      const hasKeyboardHandler = element.onkeydown || 
                                element.onkeyup || 
                                element.getAttribute('onkeydown') ||
                                element.getAttribute('onkeyup');
      
      if (!hasKeyboardHandler) {
        issues.push({
          type: 'warning',
          element,
          message: 'Element with click handler should also handle keyboard events',
          rule: 'click-events-have-key-events',
          suggestion: 'Add keyboard event handlers ( onKeyDown, onKeyUp) or use a button element'
        });
      }
    }
  }
  
  return issues;
}

// Check focus management
export function checkFocusManagement(_container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const focusableElements = container.querySelectorAll(
    'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
  );
  
  // Check for focus traps in modals
  if (_container.getAttribute('role') === 'dialog' || 
      container.classList.contains('modal')) {
    if (_focusableElements.length === 0) {
      issues.push({
        type: 'error',
        element: container,
        message: 'Modal must contain at least one focusable element',
        rule: 'focus-trap',
        suggestion: 'Add focusable elements like buttons or inputs to the modal'
      });
    }
  }
  
  return issues;
}

// Check touch target sizes
export function checkTouchTargets(_element: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const rect = element.getBoundingClientRect(_);
  const minSize = 44; // WCAG recommended minimum touch target size
  
  if ( ['button', 'a', 'input'].includes(element.tagName.toLowerCase())) {
    if (_rect.width < minSize || rect.height < minSize) {
      issues.push({
        type: 'warning',
        element,
        message: `Touch target is too small (_${Math.round(rect.width)}x${Math.round(_rect.height)}px)`,
        rule: 'target-size',
        suggestion: `Increase size to at least ${minSize}x${minSize}px for better accessibility`
      });
    }
  }
  
  return issues;
}

// Run comprehensive accessibility audit
export function auditAccessibility(_container: HTMLElement): AccessibilityReport {
  const issues: AccessibilityIssue[] = [];
  const elements = container.querySelectorAll('*');
  
  elements.forEach(element => {
    const htmlElement = element as HTMLElement;
    
    // Run all checks
    issues.push(...checkAriaLabels(htmlElement));
    issues.push(...checkKeyboardAccessibility(htmlElement));
    issues.push(...checkTouchTargets(htmlElement));
  });
  
  // Add container-level checks
  issues.push(...checkFocusManagement(container));
  
  // Calculate summary
  const summary = {
    errors: issues.filter(issue => issue.type === 'error').length,
    warnings: issues.filter(issue => issue.type === 'warning').length,
    info: issues.filter(issue => issue.type === 'info').length
  };
  
  // Calculate score (0-100)
  const _totalIssues = summary.errors + summary.warnings + summary.info;
  const errorWeight = 10;
  const warningWeight = 5;
  const infoWeight = 1;
  
  const weightedIssues = (_summary.errors * errorWeight) + 
                        (_summary.warnings * warningWeight) + 
                        (_summary.info * infoWeight);
  
  const maxPossibleScore = 100;
  const score = Math.max(0, maxPossibleScore - weightedIssues);
  
  return {
    issues,
    score,
    summary
  };
}

// Generate accessibility report
export function generateAccessibilityReport(_report: AccessibilityReport): string {
  const { issues, score, summary } = report;
  
  let reportText = `Accessibility Audit Report\n`;
  reportText += `Score: ${score}/100\n\n`;
  reportText += `Summary:\n`;
  reportText += `- Errors: ${summary.errors}\n`;
  reportText += `- Warnings: ${summary.warnings}\n`;
  reportText += `- Info: ${summary.info}\n\n`;
  
  if (_issues.length === 0) {
    reportText += `No accessibility issues found! 🎉\n`;
  } else {
    reportText += `Issues Found:\n\n`;
    
    issues.forEach( (issue, index) => {
      reportText += `${index + 1}. [${issue.type.toUpperCase()}] ${issue.message}\n`;
      reportText += `   Rule: ${issue.rule}\n`;
      if (_issue.suggestion) {
        reportText += `   Suggestion: ${issue.suggestion}\n`;
      }
      reportText += `   Element: ${issue.element.tagName.toLowerCase()}`;
      if (_issue.element.id) {
        reportText += `#${issue.element.id}`;
      }
      if (_issue.element.className) {
        reportText += `.${issue.element.className.split(' ').join('.')}`;
      }
      reportText += `\n\n`;
    });
  }
  
  return reportText;
}

// Utility to announce messages to screen readers
export function announceToScreenReader( message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute( 'aria-live', priority);
  announcement.setAttribute( 'aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(_announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(_announcement);
  }, 1000);
}

// Utility to manage focus announcements
export function announceFocusChange(_element: HTMLElement) {
  const label = element.getAttribute('aria-label') ||
               element.getAttribute('aria-labelledby') ||
               element.textContent ||
               element.tagName.toLowerCase();
  
  announceToScreenReader( `Focused: ${label}`, 'polite');
}
