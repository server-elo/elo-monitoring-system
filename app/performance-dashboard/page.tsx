"use client";

import React, { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { PerformanceMonitor } from "@/components/performance/PerformanceMonitor";
import { AgentOpsMonitoringPanel } from "@/components/monitoring/AgentOpsMonitoringPanel";
interface OptimizationData {
  before: {
    bundleSize: number;
    firstLoad: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
  };
  after: {
    bundleSize: number;
    firstLoad: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
  };
  improvements: {
    bundleSizeReduction: string;
    performanceGain: string;
    optimizationsApplied: string[];
  };
}
export default function PerformanceDashboard(): void {
  const [data, setData] = useState<OptimizationData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Load performance report
    fetch("/performance-optimization-report.json")
      .then((res: unknown) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse">Loading performance data...</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-red-500">Failed to load performance data</div>
      </div>
    );
  }
  const metrics = [
    {
      name: "Bundle Size",
      before: `${(data.before.bundleSize / 1024).toFixed(0)} KB`,
      after: `${(data.after.bundleSize / 1024).toFixed(0)} KB`,
      improvement: `${(((data.before.bundleSize - data.after.bundleSize) / data.before.bundleSize) * 100).toFixed(1)}%`,
      color: "text-green-600",
    },
    {
      name: "First Load",
      before: `${data.before.firstLoad} ms`,
      after: `${data.after.firstLoad} ms`,
      improvement: `${(((data.before.firstLoad - data.after.firstLoad) / data.before.firstLoad) * 100).toFixed(1)}%`,
      color: "text-green-600",
    },
    {
      name: "LCP",
      before: `${data.before.largestContentfulPaint} ms`,
      after: `${data.after.largestContentfulPaint} ms`,
      improvement: `${(((data.before.largestContentfulPaint - data.after.largestContentfulPaint) / data.before.largestContentfulPaint) * 100).toFixed(1)}%`,
      color: "text-green-600",
    },
    {
      name: "TTI",
      before: `${data.before.timeToInteractive} ms`,
      after: `${data.after.timeToInteractive} ms`,
      improvement: `${(((data.before.timeToInteractive - data.after.timeToInteractive) / data.before.timeToInteractive) * 100).toFixed(1)}%`,
      color: "text-green-600",
    },
    {
      name: "TBT",
      before: `${data.before.totalBlockingTime} ms`,
      after: `${data.after.totalBlockingTime} ms`,
      improvement: `${(((data.before.totalBlockingTime - data.after.totalBlockingTime) / data.before.totalBlockingTime) * 100).toFixed(1)}%`,
      color: "text-green-600",
    },
    {
      name: "CLS",
      before: data.before.cumulativeLayoutShift.toFixed(3),
      after: data.after.cumulativeLayoutShift.toFixed(3),
      improvement: `${(((data.before.cumulativeLayoutShift - data.after.cumulativeLayoutShift) / data.before.cumulativeLayoutShift) * 100).toFixed(1)}%`,
      color: "text-green-600",
    },
  ];
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          Performance Optimization Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric: unknown) => (
            <Card key={metric.name} className="p-6">
              <h3 className="text-lg font-semibold mb-4">{metric.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Before:</span>
                  <span className="font-mono">{metric.before}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">After:</span>
                  <span className="font-mono">{metric.after}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-500">Improvement:</span>
                  <span className={`font-bold ${metric.color}`}>
                    ↓ {metric.improvement}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Optimizations Applied</h2>
          <ul className="space-y-2">
            {data.improvements.optimizationsApplied.map(
              (optimization, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{optimization}</span>
                </li>
              ),
            )}
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Monitor real-user metrics with Web Vitals</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Set up continuous performance budgets</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Implement A/B testing for performance improvements</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Configure CDN for static assets</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Enable HTTP/3 and Brotli compression</span>
            </li>
          </ul>
        </Card>
        
        {/* AgentOps Monitoring Section */}
        <div className="mt-8">
          <AgentOpsMonitoringPanel />
        </div>
      </div>
      <PerformanceMonitor />
    </div>
  );
}