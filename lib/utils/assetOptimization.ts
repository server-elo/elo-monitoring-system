// Asset optimization utilities for performance

export interface ImageOptimizationConfig {
  quality: number;
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  sizes: string;
  priority: boolean;
  placeholder: 'blur' | 'empty';
}

// Predefined optimization configs for different use cases
export const OPTIMIZATION_PRESETS = {
  hero: {
    quality: 90,
    format: 'webp' as const,
    sizes: '100vw',
    priority: true,
    placeholder: 'blur' as const,
  },
  avatar: {
    quality: 90,
    format: 'webp' as const,
    sizes: '(max-width: 640px) 64px, 96px',
    priority: false,
    placeholder: 'blur' as const,
  },
  thumbnail: {
    quality: 85,
    format: 'webp' as const,
    sizes: '(max-width: 640px) 150px, 300px',
    priority: false,
    placeholder: 'blur' as const,
  },
  icon: {
    quality: 95,
    format: 'png' as const,
    sizes: '32px',
    priority: false,
    placeholder: 'empty' as const,
  },
  background: {
    quality: 80,
    format: 'webp' as const,
    sizes: '100vw',
    priority: false,
    placeholder: 'blur' as const,
  },
} as const;

// Generate responsive image sources
export function generateResponsiveImageSources(
  baseSrc: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920]
): string {
  return sizes
    .map(size => `${baseSrc}?w=${size}&q=85 ${size}w`)
    .join(', ');
}

// Generate blur data URL for placeholder
export function generateBlurDataURL(
  width: number = 10,
  height: number = 10,
  color: string = '#f3f4f6'
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Check if browser supports modern image formats
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

export function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}

// Get optimal image format based on browser support
export async function getOptimalImageFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
  if (await supportsAVIF()) return 'avif';
  if (await supportsWebP()) return 'webp';
  return 'jpeg';
}

// Preload critical images
export function preloadImage(src: string, as: 'image' = 'image'): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = src;
  document.head.appendChild(link);
}

// Preload critical CSS
export function preloadCSS(href: string): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  link.onload = () => {
    link.rel = 'stylesheet';
  };
  document.head.appendChild(link);
}

// Lazy load images with intersection observer
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private images: Set<HTMLImageElement> = new Set();

  constructor(options: IntersectionObserverInit = {}) {
    if (typeof window === 'undefined') return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          this.loadImage(img);
          this.observer?.unobserve(img);
          this.images.delete(img);
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });
  }

  observe(img: HTMLImageElement): void {
    if (!this.observer) return;
    
    this.images.add(img);
    this.observer.observe(img);
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
    
    if (srcset) {
      img.srcset = srcset;
      img.removeAttribute('data-srcset');
    }
    
    img.classList.remove('lazy');
    img.classList.add('loaded');
  }

  disconnect(): void {
    this.observer?.disconnect();
    this.images.clear();
  }
}

// Font optimization utilities
export function preloadFont(href: string, type: string = 'font/woff2'): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = type;
  link.href = href;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// Critical CSS extraction
export function extractCriticalCSS(selectors: string[]): string {
  if (typeof window === 'undefined') return '';
  
  const criticalRules: string[] = [];
  
  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      Array.from(sheet.cssRules || []).forEach((rule) => {
        if (rule instanceof CSSStyleRule) {
          selectors.forEach((selector) => {
            if (rule.selectorText?.includes(selector)) {
              criticalRules.push(rule.cssText);
            }
          });
        }
      });
    } catch (e) {
      // Cross-origin stylesheets may throw errors
      console.warn('Could not access stylesheet:', e);
    }
  });
  
  return criticalRules.join('\n');
}

// Performance monitoring utilities
export interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
}

export function measureWebVitals(): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    const metrics: PerformanceMetrics = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
    };

    // Measure TTFB
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.ttfb = navigation.responseStart - navigation.requestStart;
    }

    // Use web-vitals library if available
    if (typeof window !== 'undefined' && 'web-vitals' in window) {
      // This would require installing web-vitals package
      // For now, we'll use basic performance API
      
      // Measure FCP
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }
    }

    // Return metrics after a short delay to allow for measurements
    setTimeout(() => resolve(metrics), 1000);
  });
}

// Asset caching utilities
export function setCacheHeaders(response: Response, maxAge: number = 31536000): Response {
  response.headers.set('Cache-Control', `public, max-age=${maxAge}, immutable`);
  response.headers.set('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
  return response;
}

export default {
  OPTIMIZATION_PRESETS,
  generateResponsiveImageSources,
  generateBlurDataURL,
  getOptimalImageFormat,
  preloadImage,
  preloadCSS,
  LazyImageLoader,
  preloadFont,
  measureWebVitals,
  setCacheHeaders,
};
