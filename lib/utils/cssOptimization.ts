// CSS Optimization utilities

export interface CriticalCSSConfig {
  selectors: string[];
  mediaQueries?: string[];
  excludeSelectors?: string[];
  minify?: boolean;
}

// Extract critical CSS for above-the-fold content
export function extractCriticalCSS(config: CriticalCSSConfig): string {
  if (typeof window === 'undefined') return '';

  const { selectors, mediaQueries = [], excludeSelectors = [], minify = true } = config;
  const criticalRules: string[] = [];

  try {
    // Get all stylesheets
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        Array.from(sheet.cssRules || []).forEach((rule) => {
          if (rule instanceof CSSStyleRule) {
            // Check if selector matches critical selectors
            const matchesCritical = selectors.some(selector => 
              rule.selectorText?.includes(selector)
            );
            
            // Check if selector should be excluded
            const shouldExclude = excludeSelectors.some(selector => 
              rule.selectorText?.includes(selector)
            );

            if (matchesCritical && !shouldExclude) {
              criticalRules.push(rule.cssText);
            }
          } else if (rule instanceof CSSMediaRule) {
            // Handle media queries
            const mediaText = rule.media.mediaText;
            const shouldIncludeMedia = mediaQueries.length === 0 || 
              mediaQueries.some(mq => mediaText.includes(mq));

            if (shouldIncludeMedia) {
              Array.from(rule.cssRules).forEach((nestedRule) => {
                if (nestedRule instanceof CSSStyleRule) {
                  const matchesCritical = selectors.some(selector => 
                    nestedRule.selectorText?.includes(selector)
                  );
                  
                  if (matchesCritical) {
                    criticalRules.push(`@media ${mediaText} { ${nestedRule.cssText} }`);
                  }
                }
              });
            }
          }
        });
      } catch (e) {
        // Cross-origin stylesheets may throw errors
        console.warn('Could not access stylesheet:', e);
      }
    });
  } catch (error) {
    console.error('Error extracting critical CSS:', error);
  }

  let criticalCSS = criticalRules.join('\n');

  // Minify if requested
  if (minify) {
    criticalCSS = minifyCSS(criticalCSS);
  }

  return criticalCSS;
}

// Minify CSS by removing unnecessary whitespace and comments
export function minifyCSS(css: string): string {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove unnecessary whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace around specific characters
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    // Remove trailing semicolons before closing braces
    .replace(/;}/g, '}')
    // Remove leading/trailing whitespace
    .trim();
}

// Get unused CSS selectors
export function getUnusedSelectors(): string[] {
  if (typeof window === 'undefined') return [];

  const usedSelectors = new Set<string>();
  const allSelectors = new Set<string>();

  try {
    // Collect all selectors from stylesheets
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        Array.from(sheet.cssRules || []).forEach((rule) => {
          if (rule instanceof CSSStyleRule && rule.selectorText) {
            allSelectors.add(rule.selectorText);
          }
        });
      } catch (e) {
        console.warn('Could not access stylesheet:', e);
      }
    });

    // Check which selectors are actually used
    allSelectors.forEach((selector) => {
      try {
        // Skip pseudo-selectors and complex selectors for now
        if (selector.includes(':') || selector.includes('[')) {
          usedSelectors.add(selector);
          return;
        }

        if (document.querySelector(selector)) {
          usedSelectors.add(selector);
        }
      } catch (e) {
        // Invalid selectors will throw errors
        usedSelectors.add(selector); // Keep them to be safe
      }
    });

    return Array.from(allSelectors).filter(selector => !usedSelectors.has(selector));
  } catch (error) {
    console.error('Error finding unused selectors:', error);
    return [];
  }
}

// Preload critical fonts
export function preloadCriticalFonts(fonts: Array<{
  href: string;
  type?: string;
  crossOrigin?: boolean;
}>): void {
  if (typeof window === 'undefined') return;

  fonts.forEach(({ href, type = 'font/woff2', crossOrigin = true }) => {
    // Check if already preloaded
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = type;
    link.href = href;
    if (crossOrigin) {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  });
}

// Optimize font loading with font-display: swap
export function optimizeFontDisplay(): void {
  if (typeof window === 'undefined') return;

  // Add font-display: swap to @font-face rules
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}

// Critical CSS for glassmorphism components
export const GLASSMORPHISM_CRITICAL_CSS = `
  .glass {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
  }
  
  .gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

// Performance-optimized CSS loading
export class CSSLoader {
  private loadedStyles = new Set<string>();

  async loadCSS(href: string, media: string = 'all'): Promise<void> {
    if (this.loadedStyles.has(href)) return;

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = media;
      
      link.onload = () => {
        this.loadedStyles.add(href);
        resolve();
      };
      
      link.onerror = () => {
        reject(new Error(`Failed to load CSS: ${href}`));
      };
      
      document.head.appendChild(link);
    });
  }

  async loadCriticalCSS(css: string): Promise<void> {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  async loadNonCriticalCSS(href: string): Promise<void> {
    // Load non-critical CSS asynchronously
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = () => {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(link);
  }
}

// CSS performance monitoring
export function measureCSSPerformance(): {
  totalStylesheets: number;
  totalRules: number;
  unusedSelectors: number;
  criticalCSSSize: number;
} {
  if (typeof window === 'undefined') {
    return {
      totalStylesheets: 0,
      totalRules: 0,
      unusedSelectors: 0,
      criticalCSSSize: 0,
    };
  }

  let totalRules = 0;
  const totalStylesheets = document.styleSheets.length;

  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      totalRules += sheet.cssRules?.length || 0;
    } catch (e) {
      // Cross-origin stylesheets
    }
  });

  const unusedSelectors = getUnusedSelectors();
  const criticalCSS = extractCriticalCSS({
    selectors: ['.glass', '.gradient-text', 'nav', 'header', 'main'],
  });

  return {
    totalStylesheets,
    totalRules,
    unusedSelectors: unusedSelectors.length,
    criticalCSSSize: new Blob([criticalCSS]).size,
  };
}

// Utility to defer non-critical CSS
export function deferNonCriticalCSS(): void {
  if (typeof window === 'undefined') return;

  // Find all non-critical stylesheets
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  
  stylesheets.forEach((link) => {
    const href = (link as HTMLLinkElement).href;
    
    // Skip critical stylesheets (you can customize this logic)
    if (href.includes('critical') || href.includes('inline')) {
      return;
    }

    // Defer loading
    (link as HTMLLinkElement).media = 'print';
    (link as HTMLLinkElement).onload = () => {
      (link as HTMLLinkElement).media = 'all';
    };
  });
}

// CSS optimization configuration for different pages
export const CSS_OPTIMIZATION_CONFIG = {
  homepage: {
    critical: ['.glass', '.gradient-text', 'nav', 'header', '.hero'],
    defer: ['charts', 'modal', 'tooltip'],
  },
  dashboard: {
    critical: ['.glass', 'nav', '.sidebar', '.card'],
    defer: ['modal', 'tooltip', 'animation'],
  },
  editor: {
    critical: ['.glass', 'nav', '.editor', '.toolbar'],
    defer: ['modal', 'tooltip', 'sidebar'],
  },
};

export default {
  extractCriticalCSS,
  minifyCSS,
  getUnusedSelectors,
  preloadCriticalFonts,
  optimizeFontDisplay,
  CSSLoader,
  measureCSSPerformance,
  deferNonCriticalCSS,
};
