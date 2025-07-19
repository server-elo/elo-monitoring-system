'use client';

import React, { useEffect } from 'react';
import { 
  extractCriticalCSS, 
  preloadCriticalFonts, 
  optimizeFontDisplay,
  deferNonCriticalCSS,
  CSSLoader,
  GLASSMORPHISM_CRITICAL_CSS 
} from '@/lib/utils/cssOptimization';

interface PerformanceOptimizerProps {
  page?: 'homepage' | 'dashboard' | 'editor' | 'learn';
  enableCriticalCSS?: boolean;
  enableFontOptimization?: boolean;
  enableCSSDefer?: boolean;
  children?: React.ReactNode;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  page = 'homepage',
  enableCriticalCSS = true,
  enableFontOptimization = true,
  enableCSSDefer = true,
  children,
}) => {
  useEffect(() => {
    // Only run optimizations in the browser
    if (typeof window === 'undefined') return;

    const runOptimizations = async () => {
      try {
        // 1. Font optimization
        if (enableFontOptimization) {
          // Preload critical fonts
          preloadCriticalFonts([
            {
              href: '/fonts/inter-var.woff2',
              type: 'font/woff2',
            },
          ]);

          // Optimize font display
          optimizeFontDisplay();
        }

        // 2. Critical CSS extraction and loading
        if (enableCriticalCSS) {
          const cssLoader = new CSSLoader();
          
          // Load glassmorphism critical CSS immediately
          await cssLoader.loadCriticalCSS(GLASSMORPHISM_CRITICAL_CSS);

          // Extract page-specific critical CSS
          const pageSelectors = getPageSelectors(page);
          const criticalCSS = extractCriticalCSS({
            selectors: pageSelectors,
            mediaQueries: ['(max-width: 768px)', '(prefers-reduced-motion: reduce)'],
            excludeSelectors: ['.tooltip', '.modal', '.dropdown'],
          });

          if (criticalCSS) {
            await cssLoader.loadCriticalCSS(criticalCSS);
          }
        }

        // 3. Defer non-critical CSS
        if (enableCSSDefer) {
          // Wait a bit for critical content to render
          setTimeout(() => {
            deferNonCriticalCSS();
          }, 100);
        }

        // 4. Preload next page resources based on current page
        preloadNextPageResources(page);

      } catch (error) {
        console.error('Performance optimization error:', error);
      }
    };

    // Run optimizations after initial render
    requestAnimationFrame(runOptimizations);
  }, [page, enableCriticalCSS, enableFontOptimization, enableCSSDefer]);

  return <>{children}</>;
};

// Get critical selectors for each page type
function getPageSelectors(page: string): string[] {
  const commonSelectors = [
    'nav', 'header', 'main', 'footer',
    '.glass', '.gradient-text', '.focus-visible',
    'button', 'input', 'a',
  ];

  const pageSpecificSelectors: Record<string, string[]> = {
    homepage: [
      '.hero', '.features', '.cta',
      'h1', 'h2', '.hero-content',
    ],
    dashboard: [
      '.sidebar', '.dashboard-grid', '.card',
      '.stats', '.chart-container',
    ],
    editor: [
      '.editor-container', '.toolbar', '.monaco-editor',
      '.editor-tabs', '.file-tree',
    ],
    learn: [
      '.lesson-content', '.progress-bar', '.lesson-nav',
      '.code-example', '.quiz-container',
    ],
  };

  return [...commonSelectors, ...(pageSpecificSelectors[page] || [])];
}

// Preload resources for likely next pages
function preloadNextPageResources(currentPage: string): void {
  const nextPageMap: Record<string, string[]> = {
    homepage: ['/learn', '/code'],
    dashboard: ['/learn', '/profile'],
    editor: ['/learn', '/collaborate'],
    learn: ['/code', '/dashboard'],
  };

  const nextPages = nextPageMap[currentPage] || [];
  
  nextPages.forEach(page => {
    // Preload the page
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = page;
    document.head.appendChild(link);
  });
}

// Critical CSS component for server-side rendering
export const CriticalCSS: React.FC<{ page?: string }> = ({ page = 'homepage' }) => {
  // Page selectors would be used for more specific critical CSS extraction
  // const pageSelectors = getPageSelectors(page);
  
  // This would be generated at build time in a real implementation
  const criticalCSS = `
    /* Critical CSS for ${page} */
    ${GLASSMORPHISM_CRITICAL_CSS}
    
    /* Navigation */
    nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; }
    
    /* Layout */
    main { min-height: 100vh; }
    
    /* Typography */
    h1, h2, h3 { font-weight: 700; line-height: 1.2; }
    
    /* Buttons */
    button { min-height: 44px; border-radius: 8px; transition: all 0.2s; }
    button:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
    
    /* Forms */
    input, textarea { border-radius: 8px; transition: all 0.2s; }
    input:focus, textarea:focus { outline: 2px solid #3b82f6; outline-offset: 2px; }
    
    /* Loading states */
    .loading { opacity: 0.6; pointer-events: none; }
    
    /* Responsive utilities */
    @media (max-width: 768px) {
      .hidden-mobile { display: none; }
    }
    
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;

  return (
    <style
      dangerouslySetInnerHTML={{ __html: criticalCSS }}
      data-critical-css={page}
    />
  );
};

// Font preload component
export const FontPreloader: React.FC = () => (
  <>
    <link
      rel="preload"
      href="/fonts/inter-var.woff2"
      as="font"
      type="font/woff2"
      crossOrigin="anonymous"
    />
    <style jsx>{`
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 100 900;
        font-display: swap;
        src: url('/fonts/inter-var.woff2') format('woff2');
      }
    `}</style>
  </>
);

// Resource hints component
export const ResourceHints: React.FC<{ page?: string }> = ({ page = 'homepage' }) => {
  const hints = getResourceHints(page);
  
  return (
    <>
      {hints.preconnect.map(href => (
        <link key={href} rel="preconnect" href={href} />
      ))}
      {hints.dnsPrefetch.map(href => (
        <link key={href} rel="dns-prefetch" href={href} />
      ))}
      {hints.preload.map(({ href, as, type }) => (
        <link key={href} rel="preload" href={href} as={as} type={type} />
      ))}
    </>
  );
};

function getResourceHints(_page: string) {
  return {
    preconnect: [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
    dnsPrefetch: [
      'https://api.github.com',
      'https://avatars.githubusercontent.com',
    ],
    preload: [
      { href: '/grid.svg', as: 'image', type: 'image/svg+xml' },
      { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
    ],
  };
}

// Performance monitoring component
export const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
        if (entry.entryType === 'first-input') {
          const fidEntry = entry as any; // PerformanceEventTiming
          console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
        }
        if (entry.entryType === 'layout-shift') {
          const clsEntry = entry as any; // LayoutShift
          console.log('CLS:', clsEntry.value);
        }
      });
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

    return () => observer.disconnect();
  }, []);

  return null;
};

export default PerformanceOptimizer;
