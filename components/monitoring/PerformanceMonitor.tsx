'use client';

import React, { useEffect, useState } from 'react';
;

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  navigationTiming: PerformanceNavigationTiming | null;
}

interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    navigationTiming: null,
  });
  const [resourceTimings, setResourceTimings] = useState<ResourceTiming[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsMonitoring(true);
    
    // Measure Core Web Vitals
    measureWebVitals();
    
    // Measure resource timings
    measureResourceTimings();
    
    // Set up continuous monitoring
    const interval = setInterval(() => {
      measureWebVitals();
      measureResourceTimings();
    }, 5000);

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, []);

  const measureWebVitals = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    
    setMetrics(prev => ({
      ...prev,
      ttfb: navigation ? navigation.responseStart - navigation.requestStart : null,
      fcp: fcp ? fcp.startTime : null,
      navigationTiming: navigation,
    }));

    // Use PerformanceObserver for other metrics
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
              break;
            case 'first-input':
              setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                setMetrics(prev => ({ 
                  ...prev, 
                  cls: (prev.cls || 0) + (entry as any).value 
                }));
              }
              break;
          }
        });
      });

      observer.observe({ 
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] 
      });
    }
  };

  const measureResourceTimings = () => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const timings: ResourceTiming[] = resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      type: getResourceType(resource.name),
    }));

    setResourceTimings(timings);
  };

  const getResourceType = (url: string): string => {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    return 'other';
  };

  const getMetricStatus = (metric: number | null, thresholds: { good: number; poor: number }) => {
    if (metric === null) return { status: 'Unknown', color: 'text-gray-400' };
    if (metric <= thresholds.good) return { status: 'Good', color: 'text-green-400' };
    if (metric <= thresholds.poor) return { status: 'Needs Improvement', color: 'text-yellow-400' };
    return { status: 'Poor', color: 'text-red-400' };
  };

  const sendMetricsToAPI = async () => {
    try {
      await fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          resourceTimings: resourceTimings.slice(0, 10), // Send top 10 resources
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  };

  // Send metrics every 30 seconds
  useEffect(() => {
    if (!isMonitoring) return;
    
    const interval = setInterval(sendMetricsToAPI, 30000);
    return () => clearInterval(interval);
  }, [isMonitoring, metrics, resourceTimings]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const lcpStatus = getMetricStatus(metrics.lcp, { good: 2500, poor: 4000 });
  const fcpStatus = getMetricStatus(metrics.fcp, { good: 1800, poor: 3000 });
  const clsStatus = getMetricStatus(metrics.cls, { good: 0.1, poor: 0.25 });
  const ttfbStatus = getMetricStatus(metrics.ttfb, { good: 800, poor: 1800 });

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <div className="glass border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white text-sm">Performance Monitor</h3>
          <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
        
        <div className="space-y-2 text-xs">
          {/* Core Web Vitals */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-400">LCP:</span>
              <span className={`ml-1 ${lcpStatus.color}`}>
                {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">FCP:</span>
              <span className={`ml-1 ${fcpStatus.color}`}>
                {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">CLS:</span>
              <span className={`ml-1 ${clsStatus.color}`}>
                {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">TTFB:</span>
              <span className={`ml-1 ${ttfbStatus.color}`}>
                {metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Resource Summary */}
          <div className="border-t border-white/10 pt-2">
            <div className="text-gray-400 mb-1">Resources:</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>JS: {resourceTimings.filter(r => r.type === 'script').length}</div>
              <div>CSS: {resourceTimings.filter(r => r.type === 'stylesheet').length}</div>
              <div>Images: {resourceTimings.filter(r => r.type === 'image').length}</div>
              <div>Fonts: {resourceTimings.filter(r => r.type === 'font').length}</div>
            </div>
          </div>

          {/* Total Size */}
          <div className="border-t border-white/10 pt-2">
            <span className="text-gray-400">Total Size:</span>
            <span className="ml-1 text-white">
              {(resourceTimings.reduce((sum, r) => sum + r.size, 0) / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>

          {/* Actions */}
          <div className="border-t border-white/10 pt-2 space-y-1">
            <button
              onClick={sendMetricsToAPI}
              className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
            >
              Send Metrics
            </button>
            <button
              onClick={() => {
                console.log('Performance Metrics:', metrics);
                console.log('Resource Timings:', resourceTimings);
              }}
              className="w-full px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
            >
              Log to Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for using performance metrics in components
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    navigationTiming: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const measureMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      
      setMetrics(prev => ({
        ...prev,
        ttfb: navigation ? navigation.responseStart - navigation.requestStart : null,
        fcp: fcp ? fcp.startTime : null,
        navigationTiming: navigation,
      }));
    };

    measureMetrics();
    
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
              break;
            case 'first-input':
              setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                setMetrics(prev => ({ 
                  ...prev, 
                  cls: (prev.cls || 0) + (entry as any).value 
                }));
              }
              break;
          }
        });
      });

      observer.observe({ 
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] 
      });
    }
  }, []);

  return metrics;
};

export default PerformanceMonitor;
