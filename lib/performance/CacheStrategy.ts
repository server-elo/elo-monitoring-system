/**
 * @fileoverview Quantum Caching Strategy Implementation
 * @module lib/performance/CacheStrategy
 */

/**
 * Advanced caching strategies for optimal performance.
 * Implements multi-tier caching with intelligent invalidation.
 */

export interface CacheConfig {
  ttl: number
  maxSize: number
  strategy: CacheStrategy
  tags?: string[]
}

export enum CacheStrategy {
  LRU = 'lru',
  FIFO = 'fifo',
  TTL = 'ttl',
  HYBRID = 'hybrid',
}

export enum CacheLayer {
  MEMORY = 'memory',
  BROWSER = 'browser',
  CDN = 'cdn',
  REDIS = 'redis',
}

/**
 * Quantum Cache Manager with multi-tier caching
 */
export class QuantumCacheManager {
  private static instance: QuantumCacheManager
  private caches = new Map<CacheLayer, Map<string, CacheEntry>>()
  private configs = new Map<string, CacheConfig>()

  static getInstance(): QuantumCacheManager {
    if (!QuantumCacheManager.instance) {
      QuantumCacheManager.instance = new QuantumCacheManager()
    }
    return QuantumCacheManager.instance
  }

  constructor() {
    // Initialize cache layers
    this.caches.set(CacheLayer.MEMORY, new Map())
    this.caches.set(CacheLayer.BROWSER, new Map())

    // Setup cleanup intervals
    this.setupCleanupInterval()
  }

  /**
   * Set cache configuration for a specific key pattern
   */
  setConfig(keyPattern: string, config: CacheConfig): void {
    this.configs.set(keyPattern, config)
  }

  /**
   * Get data from cache with fallback through layers
   */
  async get<T>(
    key: string,
    layers: CacheLayer[] = [CacheLayer.MEMORY, CacheLayer.BROWSER],
  ): Promise<T | null> {
    for (const layer of layers) {
      const cache = this.caches.get(layer)
      if (cache?.has(key)) {
        const entry = cache.get(key)!

        if (this.isValid(entry)) {
          // Promote to higher cache layers
          if (
            layer !== CacheLayer.MEMORY &&
            layers.includes(CacheLayer.MEMORY)
          ) {
            await this.set(key, entry.data, [CacheLayer.MEMORY])
          }

          entry.lastAccessed = Date.now()
          entry.hitCount++

          return entry.data as T
        } else {
          // Remove expired entry
          cache.delete(key)
        }
      }
    }

    // Try browser storage for persistent caching
    if (layers.includes(CacheLayer.BROWSER)) {
      const browserData = await this.getBrowserCache<T>(key)
      if (browserData) {
        return browserData
      }
    }

    return null
  }

  /**
   * Set data in cache with intelligent layer selection
   */
  async set<T>(
    key: string,
    data: T,
    layers: CacheLayer[] = [CacheLayer.MEMORY],
  ): Promise<void> {
    const config = this.getConfigForKey(key)
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: config.ttl,
      lastAccessed: Date.now(),
      hitCount: 0,
      size: this.estimateSize(data),
      tags: config.tags || [],
    }

    for (const layer of layers) {
      await this.setInLayer(layer, key, entry, config)
    }
  }

  /**
   * Set data in specific cache layer
   */
  private async setInLayer(
    layer: CacheLayer,
    key: string,
    entry: CacheEntry,
    config: CacheConfig,
  ): Promise<void> {
    const cache = this.caches.get(layer)

    if (!cache) return

    // Apply eviction strategy if needed
    await this.applyEvictionStrategy(layer, config)

    cache.set(key, entry)

    // Persist to browser storage for BROWSER layer
    if (layer === CacheLayer.BROWSER) {
      await this.setBrowserCache(key, entry)
    }
  }

  /**
   * Apply cache eviction strategy
   */
  private async applyEvictionStrategy(
    layer: CacheLayer,
    config: CacheConfig,
  ): Promise<void> {
    const cache = this.caches.get(layer)
    if (!cache || cache.size < config.maxSize) return

    const entries = Array.from(cache.entries())
    let toRemove: string[] = []

    switch (config.strategy) {
      case CacheStrategy.LRU:
        entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
        toRemove = entries
          .slice(0, Math.ceil(cache.size * 0.1))
          .map(([key]) => key)
        break

      case CacheStrategy.FIFO:
        entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)
        toRemove = entries
          .slice(0, Math.ceil(cache.size * 0.1))
          .map(([key]) => key)
        break

      case CacheStrategy.TTL:
        const now = Date.now()
        toRemove = entries
          .filter(([, entry]) => now - entry.timestamp > entry.ttl)
          .map(([key]) => key)
        break

      case CacheStrategy.HYBRID:
        // Combine TTL and LRU
        const expired = entries.filter(([, entry]) => !this.isValid(entry))
        if (expired.length > 0) {
          toRemove = expired.map(([key]) => key)
        } else {
          entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
          toRemove = entries
            .slice(0, Math.ceil(cache.size * 0.1))
            .map(([key]) => key)
        }
        break
    }

    // Remove selected entries
    for (const key of toRemove) {
      cache.delete(key)
      if (layer === CacheLayer.BROWSER) {
        await this.removeBrowserCache(key)
      }
    }
  }

  /**
   * Invalidate cache by key or tags
   */
  async invalidate(keyOrTag: string, isTag = false): Promise<void> {
    for (const [layer, cache] of this.caches) {
      const keysToDelete: string[] = []

      for (const [key, entry] of cache) {
        if (isTag && entry.tags.includes(keyOrTag)) {
          keysToDelete.push(key)
        } else if (!isTag && key === keyOrTag) {
          keysToDelete.push(key)
        }
      }

      for (const key of keysToDelete) {
        cache.delete(key)
        if (layer === CacheLayer.BROWSER) {
          await this.removeBrowserCache(key)
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const stats: CacheStats = {
      layers: {},
      totalSize: 0,
      totalEntries: 0,
    }

    for (const [layer, cache] of this.caches) {
      const layerSize = Array.from(cache.values()).reduce(
        (sum, entry) => sum + entry.size,
        0,
      )

      stats.layers[layer] = {
        entries: cache.size,
        size: layerSize,
        hitRatio: this.calculateHitRatio(cache),
      }

      stats.totalSize += layerSize
      stats.totalEntries += cache.size
    }

    return stats
  }

  /**
   * Browser storage operations
   */
  private async getBrowserCache<T>(key: string): Promise<T | null> {
    try {
      if (typeof window === 'undefined') return null

      const stored = localStorage.getItem(`quantum_cache_${key}`)
      if (stored) {
        const entry: CacheEntry = JSON.parse(stored)

        if (this.isValid(entry)) {
          return entry.data as T
        } else {
          localStorage.removeItem(`quantum_cache_${key}`)
        }
      }
    } catch (error) {
      console.warn('Browser cache get error:', error)
    }

    return null
  }

  private async setBrowserCache(key: string, entry: CacheEntry): Promise<void> {
    try {
      if (typeof window === 'undefined') return

      // Only cache small, serializable data in localStorage
      if (entry.size < 50000) {
        // 50KB limit
        localStorage.setItem(`quantum_cache_${key}`, JSON.stringify(entry))
      }
    } catch (error) {
      console.warn('Browser cache set error:', error)
    }
  }

  private async removeBrowserCache(key: string): Promise<void> {
    try {
      if (typeof window === 'undefined') return
      localStorage.removeItem(`quantum_cache_${key}`)
    } catch (error) {
      console.warn('Browser cache remove error:', error)
    }
  }

  /**
   * Utility methods
   */
  private isValid(entry: CacheEntry): boolean {
    const now = Date.now()
    return now - entry.timestamp < entry.ttl
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2 // Rough estimate
    } catch {
      return 1000 // Default size for non-serializable data
    }
  }

  private getConfigForKey(key: string): CacheConfig {
    // Find matching pattern
    for (const [pattern, config] of this.configs) {
      if (key.includes(pattern) || new RegExp(pattern).test(key)) {
        return config
      }
    }

    // Default configuration
    return {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      strategy: CacheStrategy.HYBRID,
      tags: [],
    }
  }

  private calculateHitRatio(cache: Map<string, CacheEntry>): number {
    const entries = Array.from(cache.values())
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0)
    const totalRequests = entries.length

    return totalRequests > 0 ? totalHits / totalRequests : 0
  }

  private setupCleanupInterval(): void {
    if (typeof window !== 'undefined') {
      setInterval(
        () => {
          this.cleanup()
        },
        5 * 60 * 1000,
      ) // Cleanup every 5 minutes
    }
  }

  private async cleanup(): Promise<void> {
    const now = Date.now()

    for (const [layer, cache] of this.caches) {
      const keysToDelete: string[] = []

      for (const [key, entry] of cache) {
        if (!this.isValid(entry)) {
          keysToDelete.push(key)
        }
      }

      for (const key of keysToDelete) {
        cache.delete(key)
        if (layer === CacheLayer.BROWSER) {
          await this.removeBrowserCache(key)
        }
      }
    }
  }
}

/**
 * Cache entry structure
 */
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
  lastAccessed: number
  hitCount: number
  size: number
  tags: string[]
}

/**
 * Cache statistics interface
 */
interface CacheStats {
  layers: Record<
    string,
    {
      entries: number
      size: number
      hitRatio: number
    }
  >
  totalSize: number
  totalEntries: number
}

/**
 * Predefined cache configurations for common patterns
 */
export const CacheConfigurations = {
  // API responses
  API_RESPONSE: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 500,
    strategy: CacheStrategy.HYBRID,
    tags: ['api'],
  },

  // User data
  USER_DATA: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 100,
    strategy: CacheStrategy.LRU,
    tags: ['user'],
  },

  // Static content
  STATIC_CONTENT: {
    ttl: 60 * 60 * 1000, // 1 hour
    maxSize: 200,
    strategy: CacheStrategy.FIFO,
    tags: ['static'],
  },

  // Code compilation results
  COMPILATION_RESULTS: {
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 100,
    strategy: CacheStrategy.HYBRID,
    tags: ['compilation'],
  },

  // AI analysis results
  AI_ANALYSIS: {
    ttl: 20 * 60 * 1000, // 20 minutes
    maxSize: 50,
    strategy: CacheStrategy.LRU,
    tags: ['ai', 'analysis'],
  },
} satisfies Record<string, CacheConfig>

/**
 * Initialize quantum caching with default configurations
 */
export function initializeQuantumCache(): QuantumCacheManager {
  const cache = QuantumCacheManager.getInstance()

  // Set up configurations
  cache.setConfig('api/', CacheConfigurations.API_RESPONSE)
  cache.setConfig('user/', CacheConfigurations.USER_DATA)
  cache.setConfig('static/', CacheConfigurations.STATIC_CONTENT)
  cache.setConfig('compile/', CacheConfigurations.COMPILATION_RESULTS)
  cache.setConfig('ai/', CacheConfigurations.AI_ANALYSIS)

  return cache
}

export default QuantumCacheManager
