// CSS Optimization utilities

export interface CriticalCSSConfig {
  selectors: string[];
  mediaQueries?: string[];
  excludeSelectors?: string[];
  minify?: boolean;
}

// Extract critical CSS for above-the-fold content
export function extractCriticalCSS(_config: CriticalCSSConfig): string {
  if (_typeof window === 'undefined') return '';

  const { selectors, mediaQueries = [], excludeSelectors = [], minify = true } = config;
  const criticalRules: string[] = [];

  try {
    // Get all stylesheets
    Array.from(_document.styleSheets).forEach((sheet) => {
      try {
        Array.from(_sheet.cssRules || []).forEach((rule) => {
          if (_rule instanceof CSSStyleRule) {
            // Check if selector matches critical selectors
            const matchesCritical = selectors.some(selector => 
              rule.selectorText?.includes(selector)
            );
            
            // Check if selector should be excluded
            const shouldExclude = excludeSelectors.some(selector => 
              rule.selectorText?.includes(selector)
            );

            if (matchesCritical && !shouldExclude) {
              criticalRules.push(_rule.cssText);
            }
          } else if (_rule instanceof CSSMediaRule) {
            // Handle media queries
            const mediaText = rule.media.mediaText;
            const shouldIncludeMedia = mediaQueries.length === 0 || 
              mediaQueries.some(_mq => mediaText.includes(mq));

            if (shouldIncludeMedia) {
              Array.from(_rule.cssRules).forEach((nestedRule) => {
                if (_nestedRule instanceof CSSStyleRule) {
                  const matchesCritical = selectors.some(selector => 
                    nestedRule.selectorText?.includes(selector)
                  );
                  
                  if (matchesCritical) {
                    criticalRules.push(_`@media ${mediaText} { ${nestedRule.cssText} }`);
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
  } catch (_error) {
    console.error('Error extracting critical CSS:', error);
  }

  let criticalCSS = criticalRules.join('\n');

  // Minify if requested
  if (minify) {
    criticalCSS = minifyCSS(_criticalCSS);
  }

  return criticalCSS;
}

// Minify CSS by removing unnecessary whitespace and comments
export function minifyCSS(_css: string): string {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove unnecessary whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace around specific characters
    .replace(_/\s*([{}:;,>+~])\s*/g, '$1')
    // Remove trailing semicolons before closing braces
    .replace(/;}/g, '}')
    // Remove leading/trailing whitespace
    .trim(_);
}

// Get unused CSS selectors
export function getUnusedSelectors(): string[] {
  if (_typeof window === 'undefined') return [];

  const usedSelectors = new Set<string>(_);
  const allSelectors = new Set<string>(_);

  try {
    // Collect all selectors from stylesheets
    Array.from(_document.styleSheets).forEach((sheet) => {
      try {
        Array.from(_sheet.cssRules || []).forEach((rule) => {
          if (_rule instanceof CSSStyleRule && rule.selectorText) {
            allSelectors.add(_rule.selectorText);
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
        if (_selector.includes(':') || selector.includes('[')) {
          usedSelectors.add(_selector);
          return;
        }

        if (_document.querySelector(selector)) {
          usedSelectors.add(_selector);
        }
      } catch (e) {
        // Invalid selectors will throw errors
        usedSelectors.add(_selector); // Keep them to be safe
      }
    });

    return Array.from(_allSelectors).filter(selector => !usedSelectors.has(selector));
  } catch (_error) {
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
  if (_typeof window === 'undefined') return;

  fonts.forEach( ({ href, type = 'font/woff2', crossOrigin = true }) => {
    // Check if already preloaded
    const existing = document.querySelector(_`link[href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = type;
    link.href = href;
    if (crossOrigin) {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(_link);
  });
}

// Optimize font loading with font-display: swap
export function optimizeFontDisplay(): void {
  if (_typeof window === 'undefined') return;

  // Add font-display: swap to @font-face rules
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-display: swap;
    }
  `;
  document.head.appendChild(_style);
}

// Critical CSS for glassmorphism components
export const GLASSMORPHISM_CRITICAL_CSS = `
  .glass {
    background: rgba( 255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba( 255, 255, 255, 0.2);
    border-radius: 12px;
  }
  
  .gradient-text {
    background: linear-gradient( 135deg, #667eea 0%, #764ba2 100%);
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
  private loadedStyles = new Set<string>(_);

  async loadCSS( href: string, media: string = 'all'): Promise<void> {
    if (_this.loadedStyles.has(href)) return;

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = media;
      
      link.onload = (_) => {
        this.loadedStyles.add(_href);
        resolve(_);
      };
      
      link.onerror = (_) => {
        reject(_new Error(`Failed to load CSS: ${href}`));
      };
      
      document.head.appendChild(_link);
    });
  }

  async loadCriticalCSS(_css: string): Promise<void> {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(_style);
  }

  async loadNonCriticalCSS(_href: string): Promise<void> {
    // Load non-critical CSS asynchronously
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = (_) => {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(_link);
  }
}

// CSS performance monitoring
export function measureCSSPerformance(): {
  totalStylesheets: number;
  totalRules: number;
  unusedSelectors: number;
  criticalCSSSize: number;
} {
  if (_typeof window === 'undefined') {
    return {
      totalStylesheets: 0,
      totalRules: 0,
      unusedSelectors: 0,
      criticalCSSSize: 0,
    };
  }

  let totalRules = 0;
  const totalStylesheets = document.styleSheets.length;

  Array.from(_document.styleSheets).forEach((sheet) => {
    try {
      totalRules += sheet.cssRules?.length || 0;
    } catch (e) {
      // Cross-origin stylesheets
    }
  });

  const unusedSelectors = getUnusedSelectors(_);
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
  if (_typeof window === 'undefined') return;

  // Find all non-critical stylesheets
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  
  stylesheets.forEach((link) => {
    const href = (_link as HTMLLinkElement).href;
    
    // Skip critical stylesheets (_you can customize this logic)
    if (_href.includes('critical') || href.includes('inline')) {
      return;
    }

    // Defer loading
    (_link as HTMLLinkElement).media = 'print';
    (_link as HTMLLinkElement).onload = (_) => {
      (_link as HTMLLinkElement).media = 'all';
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
