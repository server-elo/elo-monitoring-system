/**
 * @fileoverview CDN Configuration and Asset Optimization
 * @module lib/performance/CDNConfiguration
 */

/**
 * Quantum CDN configuration for optimal asset delivery and performance.
 * Implements intelligent edge caching and global asset optimization.
 */

export interface CDNConfig {
  baseUrl: string
  regions: string[]
  cacheControl: string
  compression: boolean
  imageOptimization: boolean
  staticAssets: string[]
}

export interface AssetOptimizationConfig {
  images: {
    formats: string[]
    quality: number
    sizes: number[]
    lazy: boolean
    webp: boolean
    avif: boolean
  }
  fonts: {
    preload: boolean
    display: string
    formats: string[]
  }
  css: {
    minify: boolean
    critical: boolean
    async: boolean
  }
  javascript: {
    minify: boolean
    compress: boolean
    splitChunks: boolean
  }
}

/**
 * Quantum CDN Manager
 */
export class QuantumCDNManager {
  private static instance: QuantumCDNManager
  private config: CDNConfig
  private assetOptimization: AssetOptimizationConfig

  static getInstance(): QuantumCDNManager {
    if (!QuantumCDNManager.instance) {
      QuantumCDNManager.instance = new QuantumCDNManager()
    }
    return QuantumCDNManager.instance
  }

  constructor() {
    this.config = this.getDefaultCDNConfig()
    this.assetOptimization = this.getDefaultAssetConfig()
  }

  /**
   * Get optimized asset URL with CDN
   */
  getAssetUrl(path: string, options?: AssetUrlOptions): string {
    const baseUrl = this.config.baseUrl || ''
    const optimizedPath = this.optimizeAssetPath(path, options)

    return `${baseUrl}${optimizedPath}`
  }

  /**
   * Get optimized image URL with transformations
   */
  getImageUrl(path: string, options?: ImageOptions): string {
    if (!path) return ''

    const params = new URLSearchParams()

    if (options?.width) params.set('w', options.width.toString())
    if (options?.height) params.set('h', options.height.toString())
    if (options?.quality) params.set('q', options.quality.toString())
    if (options?.format) params.set('f', options.format)
    if (options?.fit) params.set('fit', options.fit)

    const queryString = params.toString()
    const separator = path.includes('?') ? '&' : '?'

    return this.getAssetUrl(
      path + (queryString ? `${separator}${queryString}` : ''),
    )
  }

  /**
   * Get preload headers for critical assets
   */
  getPreloadHeaders(): string[] {
    const headers: string[] = []

    // Preload critical fonts
    const criticalFonts = [
      '/fonts/inter-var.woff2',
      '/fonts/jetbrains-mono.woff2',
    ]

    criticalFonts.forEach((font) => {
      headers.push(
        `<${this.getAssetUrl(font)}>; rel=preload; as=font; type=font/woff2; crossorigin`,
      )
    })

    // Preload critical CSS
    const criticalCSS = ['/styles/critical.css']
    criticalCSS.forEach((css) => {
      headers.push(`<${this.getAssetUrl(css)}>; rel=preload; as=style`)
    })

    // Preload critical JavaScript
    const criticalJS = ['/scripts/critical.js']
    criticalJS.forEach((js) => {
      headers.push(`<${this.getAssetUrl(js)}>; rel=preload; as=script`)
    })

    return headers
  }

  /**
   * Generate resource hints
   */
  generateResourceHints(): ResourceHint[] {
    const hints: ResourceHint[] = []

    // DNS prefetch for external domains
    const externalDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'cdn.jsdelivr.net',
      'unpkg.com',
    ]

    externalDomains.forEach((domain) => {
      hints.push({
        rel: 'dns-prefetch',
        href: `https://${domain}`,
      })
    })

    // Preconnect to CDN
    if (this.config.baseUrl) {
      hints.push({
        rel: 'preconnect',
        href: this.config.baseUrl,
        crossorigin: true,
      })
    }

    return hints
  }

  /**
   * Get cache control headers by asset type
   */
  getCacheControlHeaders(assetPath: string): Record<string, string> {
    const headers: Record<string, string> = {}

    if (this.isStaticAsset(assetPath)) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable'
      headers['Expires'] = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toUTCString()
    } else if (this.isApiEndpoint(assetPath)) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
      headers['Pragma'] = 'no-cache'
      headers['Expires'] = '0'
    } else {
      headers['Cache-Control'] =
        'public, max-age=3600, stale-while-revalidate=86400'
    }

    // Security headers
    headers['X-Content-Type-Options'] = 'nosniff'
    headers['X-Frame-Options'] = 'DENY'
    headers['X-XSS-Protection'] = '1; mode=block'

    return headers
  }

  /**
   * Optimize asset delivery based on device capabilities
   */
  optimizeForDevice(userAgent: string): AssetOptimizationConfig {
    const optimizedConfig = { ...this.assetOptimization }

    // Mobile optimization
    if (this.isMobileDevice(userAgent)) {
      optimizedConfig.images.quality = 75
      optimizedConfig.images.sizes = [320, 640, 750, 828]
      optimizedConfig.javascript.compress = true
    }

    // High-DPI display optimization
    if (this.isHighDPIDevice(userAgent)) {
      optimizedConfig.images.quality = 85
    }

    // Slow connection optimization
    if (this.isSlowConnection()) {
      optimizedConfig.images.quality = 60
      optimizedConfig.images.lazy = true
      optimizedConfig.css.critical = true
    }

    return optimizedConfig
  }

  /**
   * Generate service worker cache strategies
   */
  generateServiceWorkerStrategies(): ServiceWorkerStrategy[] {
    return [
      {
        urlPattern: /\/_next\/static\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: {
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
            maxEntries: 100,
          },
        },
      },
      {
        urlPattern: /\/api\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 3,
          expiration: {
            maxAgeSeconds: 5 * 60, // 5 minutes
            maxEntries: 50,
          },
        },
      },
      {
        urlPattern: /\.(png|jpg|jpeg|svg|webp|avif)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            maxEntries: 60,
          },
        },
      },
      {
        urlPattern: /\.(woff|woff2|ttf)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts',
          expiration: {
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
            maxEntries: 30,
          },
        },
      },
    ]
  }

  /**
   * Private helper methods
   */
  private optimizeAssetPath(path: string, options?: AssetUrlOptions): string {
    let optimizedPath = path

    // Add versioning for cache busting
    if (options?.version) {
      const separator = path.includes('?') ? '&' : '?'
      optimizedPath += `${separator}v=${options.version}`
    }

    // Add compression hint
    if (this.config.compression && options?.compress !== false) {
      const separator = optimizedPath.includes('?') ? '&' : '?'
      optimizedPath += `${separator}compress=1`
    }

    return optimizedPath
  }

  private isStaticAsset(path: string): boolean {
    const staticExtensions = [
      '.css',
      '.js',
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.svg',
      '.webp',
      '.avif',
      '.woff',
      '.woff2',
      '.ttf',
    ]
    return (
      staticExtensions.some((ext) => path.endsWith(ext)) ||
      path.includes('/_next/static/')
    )
  }

  private isApiEndpoint(path: string): boolean {
    return path.startsWith('/api/') || path.startsWith('/trpc/')
  }

  private isMobileDevice(userAgent: string): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    )
  }

  private isHighDPIDevice(userAgent: string): boolean {
    return /Retina|@2x|@3x/i.test(userAgent)
  }

  private isSlowConnection(): boolean {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      return (
        connection?.effectiveType === 'slow-2g' ||
        connection?.effectiveType === '2g'
      )
    }
    return false
  }

  private getDefaultCDNConfig(): CDNConfig {
    return {
      baseUrl: process.env.NEXT_PUBLIC_CDN_URL || '',
      regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
      cacheControl: 'public, max-age=31536000',
      compression: true,
      imageOptimization: true,
      staticAssets: [
        '.css',
        '.js',
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.svg',
        '.webp',
        '.avif',
        '.woff',
        '.woff2',
      ],
    }
  }

  private getDefaultAssetConfig(): AssetOptimizationConfig {
    return {
      images: {
        formats: ['avif', 'webp', 'jpg'],
        quality: 80,
        sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        lazy: true,
        webp: true,
        avif: true,
      },
      fonts: {
        preload: true,
        display: 'swap',
        formats: ['woff2', 'woff'],
      },
      css: {
        minify: true,
        critical: true,
        async: true,
      },
      javascript: {
        minify: true,
        compress: true,
        splitChunks: true,
      },
    }
  }
}

/**
 * Interfaces
 */
export interface AssetUrlOptions {
  version?: string
  compress?: boolean
  region?: string
}

export interface ImageOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpg' | 'png'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

export interface ResourceHint {
  rel: 'dns-prefetch' | 'preconnect' | 'preload' | 'prefetch'
  href: string
  as?: string
  type?: string
  crossorigin?: boolean
}

export interface ServiceWorkerStrategy {
  urlPattern: RegExp
  handler:
    | 'CacheFirst'
    | 'NetworkFirst'
    | 'StaleWhileRevalidate'
    | 'NetworkOnly'
    | 'CacheOnly'
  options: {
    cacheName: string
    networkTimeoutSeconds?: number
    expiration: {
      maxAgeSeconds: number
      maxEntries: number
    }
  }
}

/**
 * Utility functions
 */
export function generateCriticalCSS(html: string): string {
  // This would typically use a library like 'critical' or 'puppeteer'
  // For now, return a placeholder that would be replaced with actual critical CSS
  return `
    /* Critical CSS - Above the fold styles */
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
  `
}

export function generateImageSrcSet(src: string, sizes: number[]): string {
  const cdnManager = QuantumCDNManager.getInstance()

  return sizes
    .map((size) => {
      const url = cdnManager.getImageUrl(src, { width: size, format: 'webp' })
      return `${url} ${size}w`
    })
    .join(', ')
}

export function getOptimizedImageProps(
  src: string,
  alt: string,
  options?: ImageOptions,
) {
  const cdnManager = QuantumCDNManager.getInstance()

  const sizes = options?.width
    ? `${options.width}px`
    : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'

  const srcSet = generateImageSrcSet(src, [320, 640, 768, 1024, 1280, 1920])

  return {
    src: cdnManager.getImageUrl(src, options),
    srcSet,
    sizes,
    alt,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  }
}

export default QuantumCDNManager
