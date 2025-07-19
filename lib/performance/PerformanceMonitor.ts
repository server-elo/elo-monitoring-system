'use client';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  category: 'render' | 'interaction' | 'network' | 'memory' | 'custom';
  threshold?: number;
  unit: 'ms' | 'fps' | 'mb' | 'count' | '%';
}

interface PerformanceAlert {
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  timestamp: Date;
  suggestions: string[];
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsHistory: number[] = [];
  private isMonitoring = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor FPS
    this.startFPSMonitoring();
    
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // Monitor user interactions
    this.startInteractionMonitoring();
    
    // Monitor network performance
    this.startNetworkMonitoring();
  }

  private startFPSMonitoring(): void {
    const measureFPS = (timestamp: number) => {
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = timestamp;
      }

      const delta = timestamp - this.lastFrameTime;
      const fps = 1000 / delta;
      
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > 60) { // Keep last 60 frames
        this.fpsHistory.shift();
      }

      // Calculate average FPS
      const avgFPS = this.fpsHistory.reduce((sum, f) => sum + f, 0) / this.fpsHistory.length;
      
      this.recordMetric({
        name: 'fps',
        value: Math.round(avgFPS),
        timestamp: new Date(),
        category: 'render',
        threshold: 30,
        unit: 'fps'
      });

      // Check for performance issues
      if (avgFPS < 30) {
        this.createAlert('fps', avgFPS, 30, 'warning', [
          'Consider reducing animation complexity',
          'Check for memory leaks',
          'Optimize rendering performance'
        ]);
      }

      this.lastFrameTime = timestamp;
      this.frameCount++;

      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };

    this.isMonitoring = true;
    requestAnimationFrame(measureFPS);
  }

  private startMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;

        this.recordMetric({
          name: 'memory_used',
          value: Math.round(usedMB),
          timestamp: new Date(),
          category: 'memory',
          threshold: 100,
          unit: 'mb'
        });

        this.recordMetric({
          name: 'memory_usage_percent',
          value: Math.round((usedMB / limitMB) * 100),
          timestamp: new Date(),
          category: 'memory',
          threshold: 80,
          unit: '%'
        });

        // Alert on high memory usage
        const usagePercent = (usedMB / limitMB) * 100;
        if (usagePercent > 80) {
          this.createAlert('memory_usage_percent', usagePercent, 80, 'critical', [
            'Check for memory leaks',
            'Clear unused variables and references',
            'Consider lazy loading for large components'
          ]);
        }
      }
    };

    // Check memory every 5 seconds
    setInterval(checkMemory, 5000);
    checkMemory(); // Initial check
  }

  private startInteractionMonitoring(): void {
    // Monitor input delay
    const measureInputDelay = (event: Event) => {
      const now = performance.now();
      const eventTime = event.timeStamp || now;
      const delay = now - eventTime;

      this.recordMetric({
        name: 'input_delay',
        value: Math.round(delay),
        timestamp: new Date(),
        category: 'interaction',
        threshold: 100,
        unit: 'ms'
      });

      if (delay > 100) {
        this.createAlert('input_delay', delay, 100, 'warning', [
          'Optimize event handlers',
          'Use debouncing for frequent events',
          'Consider moving heavy operations to web workers'
        ]);
      }
    };

    // Monitor various interaction events
    ['click', 'keydown', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, measureInputDelay, { passive: true });
    });

    // Monitor Long Tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric({
              name: 'long_task',
              value: Math.round(entry.duration),
              timestamp: new Date(),
              category: 'interaction',
              threshold: 50,
              unit: 'ms'
            });

            if (entry.duration > 50) {
              this.createAlert('long_task', entry.duration, 50, 'warning', [
                'Break up long-running tasks',
                'Use setTimeout or requestIdleCallback',
                'Consider code splitting'
              ]);
            }
          });
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (error) {
        console.warn('Long Task API not supported');
      }
    }
  }

  private startNetworkMonitoring(): void {
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            const navEntry = entry as PerformanceNavigationTiming;
            
            // Page load time
            const loadTime = navEntry.loadEventEnd - navEntry.navigationStart;
            this.recordMetric({
              name: 'page_load_time',
              value: Math.round(loadTime),
              timestamp: new Date(),
              category: 'network',
              threshold: 3000,
              unit: 'ms'
            });

            // First Contentful Paint
            if (navEntry.loadEventEnd > 0) {
              this.recordMetric({
                name: 'dom_content_loaded',
                value: Math.round(navEntry.domContentLoadedEventEnd - navEntry.navigationStart),
                timestamp: new Date(),
                category: 'network',
                threshold: 1500,
                unit: 'ms'
              });
            }
          });
        });

        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (error) {
        console.warn('Navigation Timing API not supported');
      }
    }
  }

  // Record a custom metric
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check threshold if specified
    if (metric.threshold && metric.value > metric.threshold) {
      this.createAlert(
        metric.name,
        metric.value,
        metric.threshold,
        metric.value > metric.threshold * 1.5 ? 'critical' : 'warning',
        [`${metric.name} exceeded threshold of ${metric.threshold}${metric.unit}`]
      );
    }
  }

  // Create a performance alert
  private createAlert(
    metric: string,
    value: number,
    threshold: number,
    severity: 'warning' | 'critical',
    suggestions: string[]
  ): void {
    // Avoid duplicate alerts for the same metric within 30 seconds
    const recentAlert = this.alerts.find(alert => 
      alert.metric === metric && 
      Date.now() - alert.timestamp.getTime() < 30000
    );

    if (recentAlert) return;

    const alert: PerformanceAlert = {
      metric,
      value,
      threshold,
      severity,
      timestamp: new Date(),
      suggestions
    };

    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    // Log alert
    console.warn(`Performance Alert [${severity.toUpperCase()}]: ${metric} = ${value} (threshold: ${threshold})`);
    suggestions.forEach(suggestion => console.warn(`  💡 ${suggestion}`));
  }

  // Get performance summary
  getPerformanceSummary(): {
    currentFPS: number;
    averageFPS: number;
    memoryUsage: number;
    alertCount: number;
    criticalAlerts: number;
    recentMetrics: PerformanceMetric[];
  } {
    const recentMetrics = this.metrics.slice(-20);
    const fpsMetrics = this.metrics.filter(m => m.name === 'fps').slice(-10);
    const memoryMetrics = this.metrics.filter(m => m.name === 'memory_used').slice(-1);
    
    const currentFPS = fpsMetrics.length > 0 ? fpsMetrics[fpsMetrics.length - 1].value : 0;
    const averageFPS = fpsMetrics.length > 0 
      ? Math.round(fpsMetrics.reduce((sum, m) => sum + m.value, 0) / fpsMetrics.length)
      : 0;
    
    const memoryUsage = memoryMetrics.length > 0 ? memoryMetrics[0].value : 0;
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical').length;

    return {
      currentFPS,
      averageFPS,
      memoryUsage,
      alertCount: this.alerts.length,
      criticalAlerts,
      recentMetrics
    };
  }

  // Get recent alerts
  getRecentAlerts(limit: number = 10): PerformanceAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Clear old metrics and alerts
  cleanup(): void {
    const oneHourAgo = Date.now() - 3600000;
    
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);
    this.alerts = this.alerts.filter(a => a.timestamp.getTime() > oneHourAgo);
  }

  // Start/stop monitoring
  startMonitoring(): void {
    this.isMonitoring = true;
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  // Custom timing utilities
  startTiming(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        value: Math.round(duration),
        timestamp: new Date(),
        category: 'custom',
        unit: 'ms'
      });
    };
  }

  // Measure function execution time
  measureFunction<T>(name: string, fn: () => T): T {
    const endTiming = this.startTiming(name);
    try {
      const result = fn();
      return result;
    } finally {
      endTiming();
    }
  }

  // Measure async function execution time
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const endTiming = this.startTiming(name);
    try {
      const result = await fn();
      return result;
    } finally {
      endTiming();
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
