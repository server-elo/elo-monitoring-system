/**
 * Performance Helpers
 * Utilities for measuring and testing performance
 */

import { performance } from 'perf_hooks';

// Performance measurement utilities
export const measureExecutionTime = async <T>(fn: () => Promise<T> | T): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;
  
  return { result, duration };
};

export const measureSyncExecutionTime = <T>(fn: () => T): { result: T; duration: number } => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;
  
  return { result, duration };
};

// Memory measurement utilities
export const measureMemoryUsage = <T>(fn: () => T): { result: T; memoryDelta: NodeJS.MemoryUsage } => {
  if (global.gc) global.gc(); // Force garbage collection if available
  
  const initialMemory = process.memoryUsage();
  const result = fn();
  
  if (global.gc) global.gc(); // Force garbage collection again
  
  const finalMemory = process.memoryUsage();
  const memoryDelta = {
    rss: finalMemory.rss - initialMemory.rss,
    heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
    heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
    external: finalMemory.external - initialMemory.external,
    arrayBuffers: finalMemory.arrayBuffers - initialMemory.arrayBuffers,
  };
  
  return { result, memoryDelta };
};

export const measureAsyncMemoryUsage = async <T>(fn: () => Promise<T>): Promise<{ result: T; memoryDelta: NodeJS.MemoryUsage }> => {
  if (global.gc) global.gc();
  
  const initialMemory = process.memoryUsage();
  const result = await fn();
  
  if (global.gc) global.gc();
  
  const finalMemory = process.memoryUsage();
  const memoryDelta = {
    rss: finalMemory.rss - initialMemory.rss,
    heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
    heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
    external: finalMemory.external - initialMemory.external,
    arrayBuffers: finalMemory.arrayBuffers - initialMemory.arrayBuffers,
  };
  
  return { result, memoryDelta };
};

// Performance assertions
export const assertResponseTime = (actualTime: number, expectedTime: number, tolerance: number = 100) => {
  expect(actualTime).toBeLessThan(expectedTime + tolerance);
};

export const assertMemoryUsage = (memoryDelta: NodeJS.MemoryUsage, maxHeapIncrease: number = 10 * 1024 * 1024) => {
  expect(memoryDelta.heapUsed).toBeLessThan(maxHeapIncrease);
};

// Benchmark utilities
export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  operationsPerSecond: number;
}

export const benchmark = async <T>(
  name: string,
  fn: () => Promise<T> | T,
  iterations: number = 100
): Promise<BenchmarkResult> => {
  const times: number[] = [];
  
  // Warm-up runs
  for (let i = 0; i < Math.min(10, iterations); i++) {
    await fn();
  }
  
  // Actual benchmark runs
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  // Calculate standard deviation
  const variance = times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / iterations;
  const standardDeviation = Math.sqrt(variance);
  
  const operationsPerSecond = 1000 / averageTime;
  
  return {
    name,
    iterations,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    standardDeviation,
    operationsPerSecond,
  };
};

export const compareBenchmarks = (baseline: BenchmarkResult, comparison: BenchmarkResult) => {
  const performanceRatio = comparison.averageTime / baseline.averageTime;
  const improvement = (1 - performanceRatio) * 100;
  
  return {
    baselineTime: baseline.averageTime,
    comparisonTime: comparison.averageTime,
    performanceRatio,
    improvement,
    isFaster: comparison.averageTime < baseline.averageTime,
    isSlower: comparison.averageTime > baseline.averageTime,
    significantDifference: Math.abs(improvement) > 5, // 5% threshold
  };
};

// Load testing utilities
export interface LoadTestOptions {
  concurrentUsers: number;
  duration: number; // milliseconds
  rampUpTime?: number; // milliseconds
  requestDelay?: number; // milliseconds between requests per user
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorsPerSecond: number;
  successRate: number;
  errors: Array<{ error: Error; timestamp: number }>;
}

export const loadTest = async <T>(
  testFunction: () => Promise<T>,
  options: LoadTestOptions
): Promise<LoadTestResult> => {
  const {
    concurrentUsers,
    duration,
    rampUpTime = 0,
    requestDelay = 0,
  } = options;
  
  const results: Array<{ success: boolean; responseTime: number; error?: Error; timestamp: number }> = [];
  const startTime = Date.now();
  const endTime = startTime + duration;
  
  // Create user simulation functions
  const userSimulations = Array.from({ length: concurrentUsers }, (_, userIndex) => {
    return async () => {
      // Stagger user start times during ramp-up
      const userStartDelay = (rampUpTime * userIndex) / concurrentUsers;
      await new Promise(resolve => setTimeout(resolve, userStartDelay));
      
      while (Date.now() < endTime) {
        const requestStart = performance.now();
        const timestamp = Date.now();
        
        try {
          await testFunction();
          const responseTime = performance.now() - requestStart;
          results.push({ success: true, responseTime, timestamp });
        } catch (error) {
          const responseTime = performance.now() - requestStart;
          results.push({ 
            success: false, 
            responseTime, 
            error: error as Error, 
            timestamp 
          });
        }
        
        if (requestDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, requestDelay));
        }
      }
    };
  });
  
  // Run all user simulations concurrently
  await Promise.all(userSimulations.map(simulation => simulation()));
  
  // Calculate results
  const totalRequests = results.length;
  const successfulRequests = results.filter(r => r.success).length;
  const failedRequests = results.filter(r => !r.success).length;
  
  const responseTimes = results.map(r => r.responseTime);
  const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);
  
  const actualDuration = duration / 1000; // Convert to seconds
  const requestsPerSecond = totalRequests / actualDuration;
  const errorsPerSecond = failedRequests / actualDuration;
  const successRate = (successfulRequests / totalRequests) * 100;
  
  const errors = results
    .filter(r => !r.success && r.error)
    .map(r => ({ error: r.error!, timestamp: r.timestamp }));
  
  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    averageResponseTime,
    minResponseTime,
    maxResponseTime,
    requestsPerSecond,
    errorsPerSecond,
    successRate,
    errors,
  };
};

// Memory leak detection
export const detectMemoryLeak = async <T>(
  testFunction: () => Promise<T>,
  iterations: number = 100,
  maxHeapGrowth: number = 50 * 1024 * 1024 // 50MB
): Promise<{ hasLeak: boolean; heapGrowth: number; iterations: number }> => {
  if (global.gc) global.gc();
  
  const initialMemory = process.memoryUsage();
  
  for (let i = 0; i < iterations; i++) {
    await testFunction();
    
    // Force garbage collection every 10 iterations
    if (i % 10 === 0 && global.gc) {
      global.gc();
    }
  }
  
  if (global.gc) global.gc();
  
  const finalMemory = process.memoryUsage();
  const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
  
  return {
    hasLeak: heapGrowth > maxHeapGrowth,
    heapGrowth,
    iterations,
  };
};

// Performance monitoring
export class PerformanceMonitor {
  private metrics: Array<{ name: string; value: number; timestamp: number; type: 'timing' | 'memory' | 'counter' }> = [];
  
  recordTiming(name: string, duration: number) {
    this.metrics.push({
      name,
      value: duration,
      timestamp: Date.now(),
      type: 'timing',
    });
  }
  
  recordMemory(name: string, bytes: number) {
    this.metrics.push({
      name,
      value: bytes,
      timestamp: Date.now(),
      type: 'memory',
    });
  }
  
  recordCounter(name: string, count: number = 1) {
    this.metrics.push({
      name,
      value: count,
      timestamp: Date.now(),
      type: 'counter',
    });
  }
  
  getMetrics(name?: string) {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }
  
  getAverageTime(name: string): number {
    const timingMetrics = this.metrics.filter(m => m.name === name && m.type === 'timing');
    if (timingMetrics.length === 0) return 0;
    
    const total = timingMetrics.reduce((sum, m) => sum + m.value, 0);
    return total / timingMetrics.length;
  }
  
  getTotalCount(name: string): number {
    const counterMetrics = this.metrics.filter(m => m.name === name && m.type === 'counter');
    return counterMetrics.reduce((sum, m) => sum + m.value, 0);
  }
  
  clear() {
    this.metrics = [];
  }
  
  export() {
    return {
      totalMetrics: this.metrics.length,
      metrics: this.metrics,
      summary: this.getSummary(),
    };
  }
  
  private getSummary() {
    const summary: Record<string, any> = {};
    
    const uniqueNames = [...new Set(this.metrics.map(m => m.name))];
    
    uniqueNames.forEach(name => {
      const nameMetrics = this.metrics.filter(m => m.name === name);
      const timings = nameMetrics.filter(m => m.type === 'timing');
      const memories = nameMetrics.filter(m => m.type === 'memory');
      const counters = nameMetrics.filter(m => m.type === 'counter');
      
      summary[name] = {
        totalRecords: nameMetrics.length,
      };
      
      if (timings.length > 0) {
        const values = timings.map(t => t.value);
        summary[name].timing = {
          count: timings.length,
          average: values.reduce((sum, v) => sum + v, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
      
      if (memories.length > 0) {
        const values = memories.map(m => m.value);
        summary[name].memory = {
          count: memories.length,
          average: values.reduce((sum, v) => sum + v, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
      
      if (counters.length > 0) {
        summary[name].counter = {
          count: counters.length,
          total: counters.reduce((sum, c) => sum + c.value, 0),
        };
      }
    });
    
    return summary;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility to format performance results
export const formatPerformanceResults = (results: BenchmarkResult | LoadTestResult) => {
  if ('iterations' in results) {
    // BenchmarkResult
    return `
Benchmark: ${results.name}
Iterations: ${results.iterations}
Average Time: ${results.averageTime.toFixed(2)}ms
Min/Max Time: ${results.minTime.toFixed(2)}ms / ${results.maxTime.toFixed(2)}ms
Operations/sec: ${results.operationsPerSecond.toFixed(2)}
Standard Deviation: ${results.standardDeviation.toFixed(2)}ms
    `.trim();
  } else {
    // LoadTestResult
    return `
Load Test Results
Total Requests: ${results.totalRequests}
Success Rate: ${results.successRate.toFixed(2)}%
Requests/sec: ${results.requestsPerSecond.toFixed(2)}
Average Response Time: ${results.averageResponseTime.toFixed(2)}ms
Min/Max Response Time: ${results.minResponseTime.toFixed(2)}ms / ${results.maxResponseTime.toFixed(2)}ms
Failed Requests: ${results.failedRequests}
    `.trim();
  }
};

export default {
  measureExecutionTime,
  measureSyncExecutionTime,
  measureMemoryUsage,
  measureAsyncMemoryUsage,
  assertResponseTime,
  assertMemoryUsage,
  benchmark,
  compareBenchmarks,
  loadTest,
  detectMemoryLeak,
  PerformanceMonitor,
  performanceMonitor,
  formatPerformanceResults,
};