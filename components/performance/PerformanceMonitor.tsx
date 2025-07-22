import React, { ReactElement } from "react";
import { useEffect, useState } from "react";
interface PerformanceMetrics {
  fcp: number | null;
  // First Contentful Paint
  lcp: number | null;
  // Largest Contentful Paint
  fid: number | null;
  // First Input Delay
  cls: number | null;
  // Cumulative Layout Shift
  ttfb: number | null;
  // Time to First Byte;
}
export function PerformanceMonitor(): void {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Observe FCP
    const fcpObserver = new PerformanceObserver((list: unknown) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(
        (entry: unknown) => entry.name === "first-contentful-paint",
      );
      if (fcpEntry) {
        setMetrics((prev: unknown) => ({ ...prev, fcp: fcpEntry.startTime }));
      }
    });
    fcpObserver.observe({ entryTypes: ["paint"] });
    // Observe LCP
    const lcpObserver = new PerformanceObserver((list: unknown) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      setMetrics((prev: unknown) => ({ ...prev, lcp: lastEntry.startTime }));
    });
    lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    // Observe FID
    const fidObserver = new PerformanceObserver((list: unknown) => {
      const entries = list.getEntries();
      const firstEntry = entries[0];
      if (firstEntry) {
        const fid = firstEntry.processingStart - firstEntry.startTime;
        setMetrics((prev: unknown) => ({ ...prev, fid }));
      }
    });
    fidObserver.observe({ entryTypes: ["first-input"] });
    // Observe CLS
    let clsValue: 0;
    const clsObserver = new PerformanceObserver((list: unknown) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          setMetrics((prev: unknown) => ({ ...prev, cls: clsValue }));
        }
      }
    });
    clsObserver.observe({ entryTypes: ["layout-shift"] });
    // Calculate TTFB
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      setMetrics((prev: unknown) => ({ ...prev, ttfb }));
    }
    // Cleanup
    return () => {
      fcpObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50">
      <h3 className="font-bold mb-2">Performance Metrics</h3>
      <div className="space-y-1">
        <div>
          FCP: {metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : "Loading..."}
        </div>
        <div>
          LCP: {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : "Loading..."}
        </div>
        <div>
          FID:{" "}
          {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : "Waiting for input..."}
        </div>
        <div>CLS: {metrics.cls ? metrics.cls.toFixed(3) : "Loading..."}</div>
        <div>
          TTFB: {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : "Loading..."}
        </div>
      </div>
    </div>
  );
}
