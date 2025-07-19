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

export const PerformanceMonitor: React.FC = (_) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    navigationTiming: null,
  });
  const [resourceTimings, setResourceTimings] = useState<ResourceTiming[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(_false);

  useEffect(() => {
    if (_typeof window === 'undefined') return;

    setIsMonitoring(_true);
    
    // Measure Core Web Vitals
    measureWebVitals(_);
    
    // Measure resource timings
    measureResourceTimings(_);
    
    // Set up continuous monitoring
    const interval = setInterval(() => {
      measureWebVitals(_);
      measureResourceTimings(_);
    }, 5000);

    return (_) => {
      clearInterval(_interval);
      setIsMonitoring(_false);
    };
  }, []);

  const measureWebVitals = (_) => {
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
        list.getEntries(_).forEach((entry) => {
          switch (_entry.entryType) {
            case 'largest-contentful-paint':
              setMetrics( prev => ({ ...prev, lcp: entry.startTime }));
              break;
            case 'first-input':
              setMetrics( prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                setMetrics(prev => ({ 
                  ...prev, 
                  cls: (_prev.cls || 0) + (_entry as any).value 
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

  const measureResourceTimings = (_) => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const timings: ResourceTiming[] = resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      type: getResourceType(_resource.name),
    }));

    setResourceTimings(_timings);
  };

  const getResourceType = (_url: string): string => {
    if (_url.includes('.js')) return 'script';
    if (_url.includes('.css')) return 'stylesheet';
    if (_url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) return 'image';
    if (_url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    return 'other';
  };

  const getMetricStatus = ( metric: number | null, thresholds: { good: number; poor: number }) => {
    if (_metric === null) return { status: 'Unknown', color: 'text-gray-400' };
    if (_metric <= thresholds.good) return { status: 'Good', color: 'text-green-400' };
    if (_metric <= thresholds.poor) return { status: 'Needs Improvement', color: 'text-yellow-400' };
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
          timestamp: Date.now(_),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (_error) {
      console.error('Failed to send performance metrics:', error);
    }
  };

  // Send metrics every 30 seconds
  useEffect(() => {
    if (!isMonitoring) return;
    
    const interval = setInterval( sendMetricsToAPI, 30000);
    return (_) => clearInterval(_interval);
  }, [isMonitoring, metrics, resourceTimings]);

  // Only show in development
  if (_process.env.NODE_ENV !== 'development') {
    return null;
  }

  const lcpStatus = getMetricStatus( metrics.lcp, { good: 2500, poor: 4000 });
  const fcpStatus = getMetricStatus( metrics.fcp, { good: 1800, poor: 3000 });
  const clsStatus = getMetricStatus( metrics.cls, { good: 0.1, poor: 0.25 });
  const ttfbStatus = getMetricStatus( metrics.ttfb, { good: 800, poor: 1800 });

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
                {metrics.lcp ? `${Math.round(_metrics.lcp)}ms` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">FCP:</span>
              <span className={`ml-1 ${fcpStatus.color}`}>
                {metrics.fcp ? `${Math.round(_metrics.fcp)}ms` : 'N/A'}
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
                {metrics.ttfb ? `${Math.round(_metrics.ttfb)}ms` : 'N/A'}
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
              {( resourceTimings.reduce((sum, r) => sum + r.size, 0) / 1024 / 1024).toFixed(_2)} MB
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
              onClick={(_) => {
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
export const usePerformanceMetrics = (_) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    navigationTiming: null,
  });

  useEffect(() => {
    if (_typeof window === 'undefined') return;

    const measureMetrics = (_) => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      
      setMetrics(prev => ({
        ...prev,
        ttfb: navigation ? navigation.responseStart - navigation.requestStart : null,
        fcp: fcp ? fcp.startTime : null,
        navigationTiming: navigation,
      }));
    };

    measureMetrics(_);
    
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries(_).forEach((entry) => {
          switch (_entry.entryType) {
            case 'largest-contentful-paint':
              setMetrics( prev => ({ ...prev, lcp: entry.startTime }));
              break;
            case 'first-input':
              setMetrics( prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                setMetrics(prev => ({ 
                  ...prev, 
                  cls: (_prev.cls || 0) + (_entry as any).value 
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
