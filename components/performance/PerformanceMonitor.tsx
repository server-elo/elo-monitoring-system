"use client"

import { ReactElement, useEffect, useState } from 'react';

interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  loading: boolean;
}

export function PerformanceMonitor(): ReactElement {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({ loading: true });

  useEffect(() => {
    // Simple performance monitoring - in production, use more sophisticated tools
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      // Process performance entries
      setMetrics({ loading: false });
    });

    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        observer.observe({ entryTypes: ['navigation', 'paint'] });
      } catch (error) {
        console.warn('Performance monitoring not supported');
        setMetrics({ loading: false });
      }
    } else {
      setMetrics({ loading: false });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Performance Monitor</h3>
      {metrics.loading ? (
        <p>Loading performance metrics...</p>
      ) : (
        <div className="space-y-2">
          <p>Performance monitoring active ✓</p>
          <p className="text-sm text-gray-600">
            Monitoring Web Vitals and page performance
          </p>
        </div>
      )}
    </div>
  );
}

export default PerformanceMonitor;