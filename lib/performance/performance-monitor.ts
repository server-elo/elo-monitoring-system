import { logger } from '@/lib/logging/structured-logger';

/**
 * Comprehensive Performance Monitoring System
 * Real-time performance tracking and optimization
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private startTime: number = Date.now();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeClientMonitoring();
    } else {
      this.initializeServerMonitoring();
    }
  }

  // Client-side performance monitoring
  private initializeClientMonitoring(): void {
    // Web Vitals monitoring
    this.observeWebVitals();
    
    // Resource timing
    this.observeResourceTiming();
    
    // Navigation timing
    this.observeNavigationTiming();
    
    // Memory usage (if available)
    this.observeMemoryUsage();
    
    // Custom metrics
    this.observeCustomMetrics();
  }

  // Server-side performance monitoring
  private initializeServerMonitoring(): void {
    // CPU usage monitoring
    this.monitorCPUUsage();
    
    // Memory usage monitoring
    this.monitorMemoryUsage();
    
    // Event loop lag monitoring
    this.monitorEventLoopLag();
  }

  private observeWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    this.createObserver('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.recordWebVital({
        name: 'LCP',
        value: lastEntry.startTime,
        rating: this.getRating('LCP', lastEntry.startTime),
      });
    });

    // First Input Delay
    this.createObserver('first-input', (entries) => {
      const firstEntry = entries[0];
      this.recordWebVital({
        name: 'FID',
        value: firstEntry.processingStart - firstEntry.startTime,
        rating: this.getRating('FID', firstEntry.processingStart - firstEntry.startTime),
      });
    });

    // Cumulative Layout Shift
    this.createObserver('layout-shift', (entries) => {
      let clsValue = 0;
      for (const entry of entries) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.recordWebVital({
        name: 'CLS',
        value: clsValue,
        rating: this.getRating('CLS', clsValue),
      });
    });
  }

  private observeResourceTiming(): void {
    if (typeof window === 'undefined') return;

    this.createObserver('resource', (entries) => {
      for (const entry of entries) {
        const duration = entry.responseEnd - entry.startTime;
        this.recordMetric({
          name: 'resource_load_time',
          value: duration,
          unit: 'ms',
          timestamp: new Date(),
          context: {
            resource: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize || 0,
          },
        });
      }
    });
  }

  private observeNavigationTiming(): void {
    if (typeof window === 'undefined') return;

    this.createObserver('navigation', (entries) => {
      const entry = entries[0];
      
      // Time to First Byte
      const ttfb = entry.responseStart - entry.requestStart;
      this.recordWebVital({
        name: 'TTFB',
        value: ttfb,
        rating: this.getRating('TTFB', ttfb),
      });

      // First Contentful Paint
      if ('getEntriesByName' in performance) {
        const fcpEntries = performance.getEntriesByName('first-contentful-paint');
        if (fcpEntries.length > 0) {
          this.recordWebVital({
            name: 'FCP',
            value: fcpEntries[0].startTime,
            rating: this.getRating('FCP', fcpEntries[0].startTime),
          });
        }
      }

      // Additional navigation metrics
      this.recordMetric({
        name: 'dom_content_loaded',
        value: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
        unit: 'ms',
        timestamp: new Date(),
      });

      this.recordMetric({
        name: 'load_complete',
        value: entry.loadEventEnd - entry.loadEventStart,
        unit: 'ms',
        timestamp: new Date(),
      });
    });
  }

  private observeMemoryUsage(): void {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      this.recordMetric({
        name: 'heap_used',
        value: memory.usedJSHeapSize / 1048576, // Convert to MB
        unit: 'MB',
        timestamp: new Date(),
        context: {
          totalHeapSize: memory.totalJSHeapSize / 1048576,
          heapSizeLimit: memory.jsHeapSizeLimit / 1048576,
        },
      });
    };

    // Check memory usage every 30 seconds
    setInterval(checkMemory, 30000);
  }

  private observeCustomMetrics(): void {
    if (typeof window === 'undefined') return;

    // Observe custom performance marks and measures
    this.createObserver('measure', (entries) => {
      for (const entry of entries) {
        this.recordMetric({
          name: entry.name,
          value: entry.duration,
          unit: 'ms',
          timestamp: new Date(),
          context: {
            type: 'custom_measure',
          },
        });
      }
    });
  }

  private createObserver(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      logger.warn(`Failed to create performance observer for ${type}`, {
        action: 'performance_monitor',
      }, error as Error);
    }
  }

  private monitorCPUUsage(): void {
    if (typeof process === 'undefined') return;

    const checkCPU = () => {
      const usage = process.cpuUsage();
      const uptime = process.uptime();
      
      const userCPU = (usage.user / 1000000) / uptime * 100; // Convert to percentage
      const systemCPU = (usage.system / 1000000) / uptime * 100;
      
      this.recordMetric({
        name: 'cpu_usage_user',
        value: userCPU,
        unit: '%',
        timestamp: new Date(),
      });

      this.recordMetric({
        name: 'cpu_usage_system',
        value: systemCPU,
        unit: '%',
        timestamp: new Date(),
      });
    };

    // Check CPU usage every 60 seconds
    setInterval(checkCPU, 60000);
  }

  private monitorMemoryUsage(): void {
    if (typeof process === 'undefined') return;

    const checkMemory = () => {
      const usage = process.memoryUsage();
      
      this.recordMetric({
        name: 'memory_heap_used',
        value: usage.heapUsed / 1048576, // Convert to MB
        unit: 'MB',
        timestamp: new Date(),
        context: {
          heapTotal: usage.heapTotal / 1048576,
          external: usage.external / 1048576,
          rss: usage.rss / 1048576,
        },
      });
    };

    // Check memory usage every 30 seconds
    setInterval(checkMemory, 30000);
  }

  private monitorEventLoopLag(): void {
    if (typeof process === 'undefined') return;

    let lastTime = process.hrtime.bigint();
    
    const checkLag = () => {
      const currentTime = process.hrtime.bigint();
      const lag = Number(currentTime - lastTime - BigInt(1000000000)) / 1000000; // Convert to ms
      lastTime = currentTime;
      
      this.recordMetric({
        name: 'event_loop_lag',
        value: Math.max(0, lag),
        unit: 'ms',
        timestamp: new Date(),
      });
    };

    // Check event loop lag every second
    setInterval(checkLag, 1000);
  }

  private getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private recordWebVital(vital: WebVitalsMetric): void {
    this.recordMetric({
      name: `web_vital_${vital.name.toLowerCase()}`,
      value: vital.value,
      unit: vital.name === 'CLS' ? 'score' : 'ms',
      timestamp: new Date(),
      context: {
        rating: vital.rating,
        type: 'web_vital',
      },
    });

    // Log poor web vitals
    if (vital.rating === 'poor') {
      logger.warn(`Poor Web Vital detected: ${vital.name}`, {
        action: 'web_vital',
        metadata: vital,
      });
    }
  }

  public recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Always log performance metrics
    logger.performance(metric.name, metric.value, {
      metadata: {
        unit: metric.unit,
        context: metric.context,
      },
    });

    // Keep only recent metrics (last hour)
    const oneHourAgo = Date.now() - 3600000;
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);
  }

  public getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  public getAverageMetric(name: string, timeWindowMs: number = 300000): number | null {
    const cutoff = Date.now() - timeWindowMs;
    const relevantMetrics = this.metrics.filter(
      m => m.name === name && m.timestamp.getTime() > cutoff
    );

    if (relevantMetrics.length === 0) return null;

    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }

  public markCustomTiming(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
    }
  }

  public measureCustomTiming(name: string, startMark: string, endMark?: string): void {
    if (typeof performance !== 'undefined') {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark);
        } else {
          performance.measure(name, startMark);
        }
      } catch (error) {
        logger.warn(`Failed to measure custom timing: ${name}`, {
          action: 'performance_measure',
        }, error as Error);
      }
    }
  }

  public getPerformanceSummary(): {
    uptime: number;
    metricsCount: number;
    averages: Record<string, number>;
    alerts: string[];
  } {
    const uptime = Date.now() - this.startTime;
    const alerts: string[] = [];

    // Calculate averages for key metrics
    const averages: Record<string, number> = {};
    const keyMetrics = ['web_vital_lcp', 'web_vital_fid', 'web_vital_cls', 'memory_heap_used', 'event_loop_lag'];
    
    for (const metric of keyMetrics) {
      const avg = this.getAverageMetric(metric);
      if (avg !== null) {
        averages[metric] = avg;

        // Check for performance alerts
        if (metric === 'web_vital_lcp' && avg > 4000) {
          alerts.push('LCP is poor (>4s)');
        }
        if (metric === 'web_vital_fid' && avg > 300) {
          alerts.push('FID is poor (>300ms)');
        }
        if (metric === 'memory_heap_used' && avg > 512) {
          alerts.push('High memory usage (>512MB)');
        }
        if (metric === 'event_loop_lag' && avg > 100) {
          alerts.push('High event loop lag (>100ms)');
        }
      }
    }

    return {
      uptime,
      metricsCount: this.metrics.length,
      averages,
      alerts,
    };
  }

  public cleanup(): void {
    // Disconnect all observers
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;