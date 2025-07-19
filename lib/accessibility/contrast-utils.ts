/**
 * Accessibility and contrast utilities for eye-friendly design
 * Ensures WCAG 2.1 AA compliance and optimal readability
 */

// Color contrast calculation utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

export function meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

export function meetsWCAGAAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

// Color palette with guaranteed accessibility
export const accessibleColors = {
  light: {
    background: '#ffffff',
    surface: '#f8f9fa',
    surfaceVariant: '#e9ecef',
    primary: '#0066cc',
    primaryVariant: '#004499',
    secondary: '#6c757d',
    accent: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    success: '#28a745',
    text: {
      primary: '#212529',
      secondary: '#6c757d',
      disabled: '#adb5bd',
      inverse: '#ffffff'
    },
    border: '#dee2e6',
    divider: '#e9ecef'
  },
  dark: {
    background: '#0f1419',
    surface: '#1a1f2e',
    surfaceVariant: '#252a3a',
    primary: '#4a9eff',
    primaryVariant: '#2d7dd2',
    secondary: '#8e9aaf',
    accent: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
    success: '#4caf50',
    text: {
      primary: '#e6e6e6',
      secondary: '#b0b0b0',
      disabled: '#666666',
      inverse: '#000000'
    },
    border: '#3a3f4f',
    divider: '#2a2f3f'
  }
};

// Generate accessible color variations
export function generateAccessibleVariation(
  baseColor: string,
  targetBackground: string,
  targetRatio = 4.5
): string {
  const baseRgb = hexToRgb(baseColor);
  const bgRgb = hexToRgb(targetBackground);
  
  if (!baseRgb || !bgRgb) return baseColor;
  
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const baseLuminance = getLuminance(baseRgb.r, baseRgb.g, baseRgb.b);
  
  // Determine if we need to make the color lighter or darker
  const shouldLighten = bgLuminance > baseLuminance;
  
  let { r, g, b } = baseRgb;
  let currentRatio = getContrastRatio(baseColor, targetBackground);
  
  // Adjust color until we meet the target ratio
  while (currentRatio < targetRatio && (shouldLighten ? r < 255 : r > 0)) {
    if (shouldLighten) {
      r = Math.min(255, r + 5);
      g = Math.min(255, g + 5);
      b = Math.min(255, b + 5);
    } else {
      r = Math.max(0, r - 5);
      g = Math.max(0, g - 5);
      b = Math.max(0, b - 5);
    }
    
    const newColor = rgbToHex(r, g, b);
    currentRatio = getContrastRatio(newColor, targetBackground);
  }
  
  return rgbToHex(r, g, b);
}

// Focus indicator utilities
export function generateFocusRing(baseColor: string, intensity = 0.3): string {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return 'rgba(59, 130, 246, 0.3)';
  
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity})`;
}

// Text size and spacing utilities for accessibility
export const textSizes = {
  xs: { fontSize: '0.75rem', lineHeight: '1rem' },
  sm: { fontSize: '0.875rem', lineHeight: '1.25rem' },
  base: { fontSize: '1rem', lineHeight: '1.5rem' },
  lg: { fontSize: '1.125rem', lineHeight: '1.75rem' },
  xl: { fontSize: '1.25rem', lineHeight: '1.75rem' },
  '2xl': { fontSize: '1.5rem', lineHeight: '2rem' },
  '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem' },
  '4xl': { fontSize: '2.25rem', lineHeight: '2.5rem' },
  '5xl': { fontSize: '3rem', lineHeight: '1' },
  '6xl': { fontSize: '3.75rem', lineHeight: '1' }
};

export const accessibleSpacing = {
  touchTarget: '44px', // Minimum touch target size
  textSpacing: '0.12em', // Optimal letter spacing
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2
  },
  margins: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  }
};

// Motion and animation preferences
export function respectsReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getAnimationDuration(defaultDuration: number): number {
  return respectsReducedMotion() ? 0.01 : defaultDuration;
}

// Screen reader utilities
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof window === 'undefined') return;
  
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Keyboard navigation utilities
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }
  
  element.addEventListener('keydown', handleTabKey);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

// Color blindness simulation utilities
export function simulateColorBlindness(
  color: string,
  type: 'protanopia' | 'deuteranopia' | 'tritanopia'
): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  let { r, g, b } = rgb;
  
  // Simplified color blindness simulation matrices
  switch (type) {
    case 'protanopia': // Red-blind
      r = 0.567 * r + 0.433 * g;
      g = 0.558 * r + 0.442 * g;
      b = 0.242 * g + 0.758 * b;
      break;
    case 'deuteranopia': // Green-blind
      r = 0.625 * r + 0.375 * g;
      g = 0.7 * r + 0.3 * g;
      b = 0.3 * g + 0.7 * b;
      break;
    case 'tritanopia': // Blue-blind
      r = 0.95 * r + 0.05 * g;
      g = 0.433 * g + 0.567 * b;
      b = 0.475 * g + 0.525 * b;
      break;
  }
  
  return rgbToHex(
    Math.round(Math.max(0, Math.min(255, r))),
    Math.round(Math.max(0, Math.min(255, g))),
    Math.round(Math.max(0, Math.min(255, b)))
  );
}

// Accessibility testing utilities
export function testColorAccessibility(foreground: string, background: string) {
  const ratio = getContrastRatio(foreground, background);
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA: {
      normal: meetsWCAGAA(foreground, background, false),
      large: meetsWCAGAA(foreground, background, true)
    },
    wcagAAA: {
      normal: meetsWCAGAAA(foreground, background, false),
      large: meetsWCAGAAA(foreground, background, true)
    },
    grade: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA Large' : 'Fail'
  };
}

// Generate accessible color scheme
export function generateAccessibleScheme(primaryColor: string, isDark = false) {
  const background = isDark ? '#0f1419' : '#ffffff';
  const surface = isDark ? '#1a1f2e' : '#f8f9fa';

  return {
    primary: generateAccessibleVariation(primaryColor, background, 4.5),
    secondary: generateAccessibleVariation(primaryColor, background, 3),
    accent: generateAccessibleVariation(primaryColor, surface, 4.5),
    background,
    surface,
    text: {
      primary: isDark ? '#e6e6e6' : '#212529',
      secondary: isDark ? '#b0b0b0' : '#6c757d',
      disabled: isDark ? '#666666' : '#adb5bd'
    }
  };
}

// Accessibility audit utilities
export function auditPageAccessibility(): {
  issues: Array<{
    type: string;
    element: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  score: number;
} {
  const issues: Array<{
    type: string;
    element: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }> = [];

  // Check for missing alt text
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      issues.push({
        type: 'missing-alt',
        element: `img[${index}]`,
        message: 'Image missing alt text',
        severity: 'error'
      });
    }
  });

  // Check for proper heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > lastLevel + 1) {
      issues.push({
        type: 'heading-hierarchy',
        element: `${heading.tagName.toLowerCase()}[${index}]`,
        message: `Heading level skipped from h${lastLevel} to h${level}`,
        severity: 'warning'
      });
    }
    lastLevel = level;
  });

  // Check for interactive elements without proper labels
  const interactiveElements = document.querySelectorAll('button, input, select, textarea, a');
  interactiveElements.forEach((element, index) => {
    const hasLabel = element.getAttribute('aria-label') ||
                    element.getAttribute('aria-labelledby') ||
                    ((element as HTMLInputElement).labels?.length ?? 0) > 0 ||
                    element.textContent?.trim();

    if (!hasLabel) {
      issues.push({
        type: 'missing-label',
        element: `${element.tagName.toLowerCase()}[${index}]`,
        message: 'Interactive element missing accessible label',
        severity: 'error'
      });
    }
  });

  // Calculate accessibility score
  const totalElements = images.length + headings.length + interactiveElements.length;

  // Log total elements for debugging
  console.debug(`Accessibility audit found ${totalElements} elements to check`);
  const errorCount = issues.filter(issue => issue.severity === 'error').length;
  const warningCount = issues.filter(issue => issue.severity === 'warning').length;

  const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 5));

  return { issues, score };
}
