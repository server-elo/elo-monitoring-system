/**
 * @fileoverview Production Deployment Configuration with Performance Monitoring
 * @module lib/performance/ProductionConfig
 */

import { QuantumCDNManager } from './CDNConfiguration'
import { QuantumCacheManager } from './CacheStrategy'
import { QuantumPreloader } from './LazyLoadingConfig'

/**
 * Production configuration with quantum performance optimizations.
 * Implements comprehensive monitoring and optimization strategies.
 */

export interface ProductionConfig {
  performance: {
    enableCompression: boolean
    enableCaching: boolean
    enableLazyLoading: boolean
    enableCDN: boolean
    enableMonitoring: boolean
    enableOptimizations: boolean
  }
  monitoring: {
    webVitals: boolean
    errorTracking: boolean
    performanceMetrics: boolean
    userExperience: boolean
    businessMetrics: boolean
  }
  optimization: {
    bundleSize: number // Max bundle size in KB
    loadTime: number // Target load time in ms
    cacheHitRate: number // Target cache hit rate %
    errorRate: number // Max error rate %
  }
  deployment: {
    environment: 'production' | 'staging' | 'development'
    region: string
    cdnEnabled: boolean
    healthChecks: boolean
    rollbackStrategy: string
  }
}

/**
 * Quantum Production Manager
 */
export class QuantumProductionManager {
  private static instance: QuantumProductionManager
  private config: ProductionConfig
  private metrics: PerformanceMetrics
  private cdnManager: QuantumCDNManager
  private cacheManager: QuantumCacheManager

  static getInstance(): QuantumProductionManager {
    if (!QuantumProductionManager.instance) {
      QuantumProductionManager.instance = new QuantumProductionManager()
    }
    return QuantumProductionManager.instance
  }

  constructor() {
    this.config = this.getDefaultProductionConfig()
    this.metrics = this.initializeMetrics()
    this.cdnManager = QuantumCDNManager.getInstance()
    this.cacheManager = QuantumCacheManager.getInstance()

    this.initializeProductionOptimizations()
  }

  /**
   * Initialize production optimizations
   */
  private initializeProductionOptimizations(): void {
    if (typeof window !== 'undefined') {
      this.setupPerformanceMonitoring()
      this.setupErrorTracking()
      this.setupWebVitalsTracking()
      this.setupUserExperienceTracking()
    }
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!this.config.monitoring.performanceMetrics) return

    // Monitor Core Web Vitals
    if ('web-vitals' in window || typeof window !== 'undefined') {
      this.monitorCoreWebVitals()
    }

    // Monitor resource loading
    this.monitorResourceLoading()

    // Monitor API performance
    this.monitorAPIPerformance()

    // Setup performance observer
    this.setupPerformanceObserver()
  }

  /**
   * Monitor Core Web Vitals
   */
  private monitorCoreWebVitals(): void {
    const vitalsToTrack = ['FCP', 'LCP', 'FID', 'CLS', 'TTFB', 'INP']

    vitalsToTrack.forEach((vital) => {
      this.observeWebVital(vital)
    })
  }

  private observeWebVital(name: string): void {
    // This would integrate with web-vitals library
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === name) {
              this.recordMetric(name, entry.startTime, {
                value: (entry as any).value || entry.startTime,
                rating: this.getRating(
                  name,
                  (entry as any).value || entry.startTime,
                ),
              })
            }
          }
        })

        observer.observe({ entryTypes: ['measure', 'paint', 'layout-shift'] })
      } catch (error) {
        console.warn(`Failed to observe ${name}:`, error)
      }
    }
  }

  /**
   * Monitor resource loading performance
   */
  private monitorResourceLoading(): void {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming

        this.recordMetric(
          'resource_load',
          resourceEntry.responseEnd - resourceEntry.startTime,
          {
            type: resourceEntry.initiatorType,
            name: resourceEntry.name,
            size: resourceEntry.transferSize,
            cached: resourceEntry.transferSize === 0,
          },
        )
      }
    })

    observer.observe({ entryTypes: ['resource'] })
  }

  /**
   * Monitor API performance
   */
  private monitorAPIPerformance(): void {
    // Intercept fetch requests
    if (typeof window !== 'undefined' && window.fetch) {
      const originalFetch = window.fetch

      window.fetch = async (...args) => {
        const startTime = performance.now()
        const url = typeof args[0] === 'string' ? args[0] : args[0].url

        try {
          const response = await originalFetch(...args)
          const endTime = performance.now()

          this.recordMetric('api_request', endTime - startTime, {
            url,
            status: response.status,
            method: args[1]?.method || 'GET',
            success: response.ok,
          })

          return response
        } catch (error) {
          const endTime = performance.now()

          this.recordMetric('api_request', endTime - startTime, {
            url,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
          })

          throw error
        }
      }
    }
  }

  /**
   * Setup performance observer for navigation and paint timing
   */
  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window))
      return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'navigation':
            this.processNavigationEntry(entry as PerformanceNavigationTiming)
            break
          case 'paint':
            this.processPaintEntry(entry as PerformancePaintTiming)
            break
          case 'largest-contentful-paint':
            this.processLCPEntry(entry)
            break
        }
      }
    })

    try {
      observer.observe({
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint'],
      })
    } catch (error) {
      console.warn('Performance observer setup failed:', error)
    }
  }

  /**
   * Process navigation timing entry
   */
  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    const metrics = {
      domContentLoaded:
        entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domInteractive: entry.domInteractive - entry.navigationStart,
      firstByte: entry.responseStart - entry.navigationStart,
    }

    Object.entries(metrics).forEach(([name, value]) => {
      this.recordMetric(`navigation_${name}`, value)
    })
  }

  /**
   * Process paint timing entry
   */
  private processPaintEntry(entry: PerformancePaintTiming): void {
    this.recordMetric(entry.name.replace('-', '_'), entry.startTime, {
      entryType: entry.entryType,
    })
  }

  /**
   * Process Largest Contentful Paint entry
   */
  private processLCPEntry(entry: any): void {
    this.recordMetric('largest_contentful_paint', entry.startTime, {
      element: entry.element?.tagName || 'unknown',
      url: entry.url || '',
    })
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    if (!this.config.monitoring.errorTracking) return

    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        type: 'unhandled_promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
      })
    })
  }

  /**
   * Setup user experience tracking
   */
  private setupUserExperienceTracking(): void {
    if (!this.config.monitoring.userExperience) return

    // Track user interactions
    this.trackUserInteractions()

    // Track page visibility changes
    this.trackPageVisibility()

    // Track connection quality
    this.trackConnectionQuality()
  }

  private trackUserInteractions(): void {
    const interactionEvents = ['click', 'keydown', 'scroll', 'touchstart']

    interactionEvents.forEach((eventType) => {
      document.addEventListener(
        eventType,
        (event) => {
          this.recordMetric(`user_interaction`, performance.now(), {
            type: eventType,
            target: (event.target as Element)?.tagName || 'unknown',
          })
        },
        { passive: true },
      )
    })
  }

  private trackPageVisibility(): void {
    document.addEventListener('visibilitychange', () => {
      this.recordMetric('page_visibility', performance.now(), {
        visible: !document.hidden,
      })
    })
  }

  private trackConnectionQuality(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection

      this.recordMetric('connection_quality', performance.now(), {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      })
    }
  }

  /**
   * Record performance metric
   */
  private recordMetric(name: string, value: number, metadata?: any): void {
    const timestamp = Date.now()

    if (!this.metrics.data[name]) {
      this.metrics.data[name] = []
    }

    this.metrics.data[name].push({
      value,
      timestamp,
      metadata,
    })

    // Keep only last 1000 entries per metric
    if (this.metrics.data[name].length > 1000) {
      this.metrics.data[name] = this.metrics.data[name].slice(-1000)
    }

    // Check if metric exceeds thresholds
    this.checkThresholds(name, value)
  }

  /**
   * Record error
   */
  private recordError(error: ErrorData): void {
    this.metrics.errors.push({
      ...error,
      timestamp: Date.now(),
    })

    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100)
    }
  }

  /**
   * Check performance thresholds
   */
  private checkThresholds(metricName: string, value: number): void {
    const thresholds = this.getThresholds()
    const threshold = thresholds[metricName]

    if (threshold && value > threshold.warning) {
      console.warn(
        `Performance warning: ${metricName} (${value}ms) exceeds threshold (${threshold.warning}ms)`,
      )

      if (value > threshold.critical) {
        console.error(
          `Performance critical: ${metricName} (${value}ms) exceeds critical threshold (${threshold.critical}ms)`,
        )
        this.triggerAlerts(metricName, value, threshold)
      }
    }
  }

  /**
   * Trigger performance alerts
   */
  private triggerAlerts(
    metricName: string,
    value: number,
    threshold: any,
  ): void {
    // This would integrate with alerting systems
    const alert = {
      type: 'performance_critical',
      metric: metricName,
      value,
      threshold: threshold.critical,
      timestamp: Date.now(),
    }

    // Send to monitoring service
    this.sendToMonitoringService(alert)
  }

  /**
   * Send data to monitoring service
   */
  private async sendToMonitoringService(data: any): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Send to actual monitoring service
        await fetch('/api/monitoring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      }
    } catch (error) {
      console.warn('Failed to send monitoring data:', error)
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): PerformanceReport {
    return {
      overview: this.getOverviewMetrics(),
      webVitals: this.getWebVitalsReport(),
      resources: this.getResourceReport(),
      errors: this.getErrorReport(),
      recommendations: this.getRecommendations(),
    }
  }

  private getOverviewMetrics(): any {
    const metrics = this.metrics.data

    return {
      totalPageLoads: metrics.navigation_load_complete?.length || 0,
      averageLoadTime: this.calculateAverage(metrics.navigation_load_complete),
      errorCount: this.metrics.errors.length,
      cacheHitRate: this.calculateCacheHitRate(),
    }
  }

  private getWebVitalsReport(): any {
    const vitals = ['FCP', 'LCP', 'FID', 'CLS', 'TTFB']
    const report: any = {}

    vitals.forEach((vital) => {
      const data = this.metrics.data[vital]
      if (data && data.length > 0) {
        report[vital] = {
          average: this.calculateAverage(data),
          p75: this.calculatePercentile(data, 75),
          p95: this.calculatePercentile(data, 95),
          rating: this.getRating(vital, this.calculateAverage(data)),
        }
      }
    })

    return report
  }

  private getResourceReport(): any {
    const resourceData = this.metrics.data.resource_load
    if (!resourceData) return {}

    const byType: any = {}
    resourceData.forEach((entry) => {
      const type = entry.metadata?.type || 'unknown'
      if (!byType[type]) {
        byType[type] = { count: 0, totalSize: 0, totalTime: 0 }
      }

      byType[type].count++
      byType[type].totalSize += entry.metadata?.size || 0
      byType[type].totalTime += entry.value
    })

    return byType
  }

  private getErrorReport(): any {
    const errors = this.metrics.errors
    const byType: any = {}

    errors.forEach((error) => {
      if (!byType[error.type]) {
        byType[error.type] = { count: 0, messages: [] }
      }

      byType[error.type].count++
      if (!byType[error.type].messages.includes(error.message)) {
        byType[error.type].messages.push(error.message)
      }
    })

    return byType
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = []
    const report = this.getWebVitalsReport()

    if (report.LCP && report.LCP.average > 2500) {
      recommendations.push(
        'Optimize Largest Contentful Paint by compressing images and enabling CDN',
      )
    }

    if (report.FCP && report.FCP.average > 1800) {
      recommendations.push(
        'Improve First Contentful Paint by optimizing critical CSS delivery',
      )
    }

    if (report.CLS && report.CLS.average > 0.1) {
      recommendations.push(
        'Reduce Cumulative Layout Shift by setting dimensions for images and ads',
      )
    }

    if (this.metrics.errors.length > 10) {
      recommendations.push(
        'High error rate detected - review error logs and implement fixes',
      )
    }

    return recommendations
  }

  /**
   * Utility methods
   */
  private calculateAverage(data?: Array<{ value: number }>): number {
    if (!data || data.length === 0) return 0
    return data.reduce((sum, entry) => sum + entry.value, 0) / data.length
  }

  private calculatePercentile(
    data: Array<{ value: number }>,
    percentile: number,
  ): number {
    if (!data || data.length === 0) return 0

    const sorted = data.map((d) => d.value).sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  private calculateCacheHitRate(): number {
    const resourceData = this.metrics.data.resource_load
    if (!resourceData || resourceData.length === 0) return 0

    const cachedRequests = resourceData.filter(
      (entry) => entry.metadata?.cached,
    ).length
    return (cachedRequests / resourceData.length) * 100
  }

  private getRating(
    metric: string,
    value: number,
  ): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = this.getWebVitalThresholds()
    const threshold = thresholds[metric]

    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  private getWebVitalThresholds(): Record<
    string,
    { good: number; poor: number }
  > {
    return {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
      INP: { good: 200, poor: 500 },
    }
  }

  private getThresholds(): Record<
    string,
    { warning: number; critical: number }
  > {
    return {
      navigation_load_complete: { warning: 3000, critical: 5000 },
      first_contentful_paint: { warning: 1800, critical: 3000 },
      largest_contentful_paint: { warning: 2500, critical: 4000 },
      api_request: { warning: 1000, critical: 3000 },
    }
  }

  private getDefaultProductionConfig(): ProductionConfig {
    return {
      performance: {
        enableCompression: true,
        enableCaching: true,
        enableLazyLoading: true,
        enableCDN: true,
        enableMonitoring: true,
        enableOptimizations: true,
      },
      monitoring: {
        webVitals: true,
        errorTracking: true,
        performanceMetrics: true,
        userExperience: true,
        businessMetrics: true,
      },
      optimization: {
        bundleSize: 1000, // 1MB max
        loadTime: 2000, // 2s target
        cacheHitRate: 80, // 80% cache hit rate
        errorRate: 1, // 1% max error rate
      },
      deployment: {
        environment: (process.env.NODE_ENV as any) || 'development',
        region: process.env.DEPLOYMENT_REGION || 'us-east-1',
        cdnEnabled: true,
        healthChecks: true,
        rollbackStrategy: 'immediate',
      },
    }
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      data: {},
      errors: [],
      startTime: Date.now(),
    }
  }
}

/**
 * Interfaces
 */
interface PerformanceMetrics {
  data: Record<
    string,
    Array<{ value: number; timestamp: number; metadata?: any }>
  >
  errors: Array<ErrorData & { timestamp: number }>
  startTime: number
}

interface ErrorData {
  type: string
  message: string
  filename?: string
  lineno?: number
  colno?: number
  stack?: string
}

interface PerformanceReport {
  overview: any
  webVitals: any
  resources: any
  errors: any
  recommendations: string[]
}

export { QuantumProductionManager }
export default QuantumProductionManager
