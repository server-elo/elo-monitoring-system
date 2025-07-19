/**
 * Performance Optimizer for Solidity Learning Platform
 * Monitors and optimizes AI response times, database queries, and overall performance
 */

interface PerformanceMetrics {
  aiResponseTime: number;
  databaseQueryTime: number;
  pageLoadTime: number;
  lighthouseScore: number;
  timestamp: Date;
}

interface OptimizationTarget {
  aiResponseTime: number; // <2s for local LLM
  databaseQueryTime: number; // <100ms
  lighthouseScore: number; // 90+
  pageLoadTime: number; // <3s
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetrics[] = [];
  private targets: OptimizationTarget = {
    aiResponseTime: 2000, // 2 seconds
    databaseQueryTime: 100, // 100ms
    lighthouseScore: 90,
    pageLoadTime: 3000 // 3 seconds
  };

  private constructor() {
    this.initializePerformanceMonitoring();
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private initializePerformanceMonitoring(): void {
    // Monitor page load performance
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.measurePageLoadTime();
      });

      // Monitor navigation performance
      this.setupNavigationObserver();
    }
  }

  // AI Response Time Optimization
  async optimizeAIResponse<T>(
    aiFunction: () => Promise<T>,
    fallbackFunction?: () => Promise<T>,
    timeoutMs: number = 2000
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // Race between AI function and timeout
      const result = await Promise.race([
        aiFunction(),
        this.createTimeoutPromise(timeoutMs)
      ]);

      const responseTime = Date.now() - startTime;
      this.recordAIResponseTime(responseTime);

      if (responseTime > this.targets.aiResponseTime) {
        console.warn(`⚠️ AI response time (${responseTime}ms) exceeded target (${this.targets.aiResponseTime}ms)`);
      } else {
        console.log(`✅ AI response time: ${responseTime}ms (within target)`);
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (fallbackFunction && responseTime >= timeoutMs) {
        console.log(`🔄 AI timeout (${responseTime}ms), using fallback`);
        const fallbackStart = Date.now();
        const result = await fallbackFunction();
        const fallbackTime = Date.now() - fallbackStart;
        this.recordAIResponseTime(fallbackTime, 'fallback');
        return result;
      }

      throw error;
    }
  }

  // Database Query Optimization
  async optimizeDBQuery<T>(
    queryFunction: () => Promise<T>,
    queryName: string = 'unknown'
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await queryFunction();
      const queryTime = Date.now() - startTime;
      
      this.recordDatabaseQueryTime(queryTime, queryName);

      if (queryTime > this.targets.databaseQueryTime) {
        console.warn(`⚠️ Database query '${queryName}' (${queryTime}ms) exceeded target (${this.targets.databaseQueryTime}ms)`);
        this.suggestQueryOptimization(queryName, queryTime);
      } else {
        console.log(`✅ Database query '${queryName}': ${queryTime}ms (within target)`);
      }

      return result;
    } catch (error) {
      const queryTime = Date.now() - startTime;
      console.error(`❌ Database query '${queryName}' failed after ${queryTime}ms:`, error);
      throw error;
    }
  }

  // Component Performance Optimization
  optimizeComponentRender(componentName: string): {
    startMeasure: () => void;
    endMeasure: () => void;
  } {
    let startTime: number;

    return {
      startMeasure: () => {
        startTime = performance.now();
      },
      endMeasure: () => {
        const renderTime = performance.now() - startTime;
        console.log(`🎨 Component '${componentName}' render time: ${renderTime.toFixed(2)}ms`);
        
        if (renderTime > 16.67) { // 60fps threshold
          console.warn(`⚠️ Component '${componentName}' render time (${renderTime.toFixed(2)}ms) may cause frame drops`);
        }
      }
    };
  }

  // Memory Usage Optimization
  monitorMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const memoryInfo = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };

      console.log(`💾 Memory usage: ${memoryInfo.used}MB / ${memoryInfo.total}MB (limit: ${memoryInfo.limit}MB)`);

      if (memoryInfo.used / memoryInfo.limit > 0.8) {
        console.warn('⚠️ High memory usage detected, consider optimizing');
        this.suggestMemoryOptimization();
      }
    }
  }

  // Performance Metrics Recording
  private recordAIResponseTime(time: number, source: string = 'ai'): void {
    console.log(`📊 Recording AI response time: ${time}ms (${source})`);
  }

  private recordDatabaseQueryTime(time: number, queryName: string): void {
    console.log(`📊 Recording DB query time: ${time}ms (${queryName})`);
  }

  private measurePageLoadTime(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      console.log(`📊 Page load time: ${loadTime}ms`);
      
      if (loadTime > this.targets.pageLoadTime) {
        console.warn(`⚠️ Page load time (${loadTime}ms) exceeded target (${this.targets.pageLoadTime}ms)`);
        this.suggestPageLoadOptimization();
      }
    }
  }

  private setupNavigationObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log(`🧭 Navigation to ${navEntry.name}: ${navEntry.duration}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
    });
  }

  // Optimization Suggestions
  private suggestQueryOptimization(queryName: string, time: number): void {
    const suggestions = [
      'Add database indexes for frequently queried fields',
      'Use query result caching for repeated queries',
      'Optimize JOIN operations and reduce data fetching',
      'Consider database connection pooling',
      'Use pagination for large result sets'
    ];

    console.log(`💡 Query optimization suggestions for '${queryName}':`);
    suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion}`);
    });
  }

  private suggestPageLoadOptimization(): void {
    const suggestions = [
      'Enable code splitting and lazy loading',
      'Optimize images and use WebP format',
      'Minimize and compress JavaScript/CSS',
      'Use CDN for static assets',
      'Implement service worker caching'
    ];

    console.log('💡 Page load optimization suggestions:');
    suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion}`);
    });
  }

  private suggestMemoryOptimization(): void {
    const suggestions = [
      'Remove unused event listeners',
      'Clear large objects from memory',
      'Use WeakMap/WeakSet for temporary references',
      'Implement virtual scrolling for large lists',
      'Optimize image loading and caching'
    ];

    console.log('💡 Memory optimization suggestions:');
    suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion}`);
    });
  }

  // Public API for getting current performance status
  getPerformanceStatus(): {
    targets: OptimizationTarget;
    recommendations: string[];
  } {
    return {
      targets: this.targets,
      recommendations: [
        'Monitor AI response times and use local LLM when available',
        'Optimize database queries with proper indexing',
        'Implement code splitting and lazy loading',
        'Use performance monitoring tools regularly'
      ]
    };
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();
