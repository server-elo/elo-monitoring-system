'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiPerformanceMonitor } from '@/lib/monitoring/apiPerformance';

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  slowRequestRate: number;
  endpointStats: Record<string, {
    count: number;
    averageTime: number;
    errorRate: number;
  }>;
}

export const PerformanceDashboard: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [timeWindow, setTimeWindow] = useState(300000); // 5 minutes
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = () => {
      try {
        const currentStats = apiPerformanceMonitor.getStats(timeWindow);
        setStats(currentStats);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch performance stats:', error);
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [timeWindow]);

  const getHealthStatus = (averageTime: number) => {
    if (averageTime < 200) return { status: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (averageTime < 500) return { status: 'Good', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (averageTime < 1000) return { status: 'Fair', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    return { status: 'Poor', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  if (isLoading) {
    return (
      <div className="glass border border-white/10 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass border border-white/10 rounded-xl p-6 text-center">
        <p className="text-gray-400">No performance data available</p>
      </div>
    );
  }

  const health = getHealthStatus(stats.averageResponseTime);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">API Performance Dashboard</h2>
        <div className="flex items-center space-x-4">
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(Number(e.target.value))}
            className="glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent"
          >
            <option value={60000}>Last 1 minute</option>
            <option value={300000}>Last 5 minutes</option>
            <option value={900000}>Last 15 minutes</option>
            <option value={3600000}>Last 1 hour</option>
          </select>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${health.bg} ${health.color}`}>
            {health.status}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests"
          value={stats.totalRequests.toLocaleString()}
          icon="📊"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${Math.round(stats.averageResponseTime)}ms`}
          icon="⚡"
          status={health.status}
        />
        <MetricCard
          title="Error Rate"
          value={`${(stats.errorRate * 100).toFixed(1)}%`}
          icon="❌"
          status={stats.errorRate > 0.05 ? 'Poor' : stats.errorRate > 0.01 ? 'Fair' : 'Good'}
        />
        <MetricCard
          title="Slow Requests"
          value={`${(stats.slowRequestRate * 100).toFixed(1)}%`}
          icon="🐌"
          status={stats.slowRequestRate > 0.1 ? 'Poor' : stats.slowRequestRate > 0.05 ? 'Fair' : 'Good'}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Distribution */}
        <div className="glass border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Response Time Distribution</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Average</span>
              <span className="text-white font-mono">{Math.round(stats.averageResponseTime)}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">95th Percentile</span>
              <span className="text-white font-mono">{Math.round(stats.p95ResponseTime)}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">99th Percentile</span>
              <span className="text-white font-mono">{Math.round(stats.p99ResponseTime)}ms</span>
            </div>
          </div>
        </div>

        {/* Top Slow Endpoints */}
        <div className="glass border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Slowest Endpoints</h3>
          <div className="space-y-2">
            {Object.entries(stats.endpointStats)
              .sort(([, a], [, b]) => b.averageTime - a.averageTime)
              .slice(0, 5)
              .map(([endpoint, data]) => (
                <div key={endpoint} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{endpoint}</p>
                    <p className="text-gray-400 text-xs">{data.count} requests</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-mono text-sm">{Math.round(data.averageTime)}ms</p>
                    {data.errorRate > 0 && (
                      <p className="text-red-400 text-xs">{(data.errorRate * 100).toFixed(1)}% errors</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* All Endpoints Table */}
      <div className="glass border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">All Endpoints</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 text-gray-300">Endpoint</th>
                <th className="text-right py-2 text-gray-300">Requests</th>
                <th className="text-right py-2 text-gray-300">Avg Time</th>
                <th className="text-right py-2 text-gray-300">Error Rate</th>
                <th className="text-right py-2 text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.endpointStats).map(([endpoint, data]) => {
                const endpointHealth = getHealthStatus(data.averageTime);
                return (
                  <tr key={endpoint} className="border-b border-white/10 last:border-b-0">
                    <td className="py-2 text-white font-mono text-xs">{endpoint}</td>
                    <td className="py-2 text-right text-gray-300">{data.count}</td>
                    <td className="py-2 text-right text-white font-mono">{Math.round(data.averageTime)}ms</td>
                    <td className="py-2 text-right text-gray-300">{(data.errorRate * 100).toFixed(1)}%</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-1 rounded text-xs ${endpointHealth.bg} ${endpointHealth.color}`}>
                        {endpointHealth.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  status?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, status }) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Excellent':
      case 'Good':
        return 'text-green-400';
      case 'Fair':
        return 'text-yellow-400';
      case 'Poor':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass border border-white/10 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-300 text-sm">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-2xl font-bold ${getStatusColor(status)}`}>{value}</span>
        {status && (
          <span className={`text-xs ${getStatusColor(status)}`}>{status}</span>
        )}
      </div>
    </motion.div>
  );
};

export default PerformanceDashboard;
