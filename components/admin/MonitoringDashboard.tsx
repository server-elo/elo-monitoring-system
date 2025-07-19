/**
 * Real-time Performance Monitoring Dashboard
 * 
 * Provides comprehensive monitoring interface for administrators
 * including performance metrics, error tracking, and system health.
 */

'use client';

import React, { useState, useEffect } from 'react';
;
import { Activity, AlertTriangle, CheckCircle, Clock, Monitor, Server, TrendingUp, TrendingDown, Users, Zap, Cpu, HardDrive, Wifi, RefreshCw, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ga4 } from '@/lib/monitoring/google-analytics';
import { logger } from '@/lib/monitoring/simple-logger';
import { cn } from '@/lib/utils';

/**
 * Monitoring data interfaces
 */
interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  responseTime: number;
}

interface PerformanceMetrics {
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  pageLoadTime: number;
  apiResponseTime: number;
  errorRate: number;
  throughput: number;
}

interface UserMetrics {
  activeUsers: number;
  newUsers: number;
  sessionDuration: number;
  bounceRate: number;
  conversionRate: number;
}

interface AlertData {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
}

/**
 * Real-time monitoring dashboard
 */
export function MonitoringDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    uptime: 0,
    responseTime: 0
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    coreWebVitals: { lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0 },
    pageLoadTime: 0,
    apiResponseTime: 0,
    errorRate: 0,
    throughput: 0
  });

  const [userMetrics, setUserMetrics] = useState<UserMetrics>({
    activeUsers: 0,
    newUsers: 0,
    sessionDuration: 0,
    bounceRate: 0,
    conversionRate: 0
  });

  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [isRealTime, setIsRealTime] = useState(true);
  const [timeRange] = useState('1h');
  const [_selectedMetrics] = useState('all');

  /**
   * Initialize monitoring dashboard
   */
  useEffect(() => {
    loadInitialData();
    
    if (isRealTime) {
      const interval = setInterval(refreshMetrics, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isRealTime, timeRange]);

  /**
   * Load initial monitoring data
   */
  const loadInitialData = async () => {
    try {
      // Load system metrics
      await Promise.all([
        loadSystemMetrics(),
        loadPerformanceMetrics(),
        loadUserMetrics(),
        loadAlerts()
      ]);
      
      logger.info('Monitoring dashboard data loaded');
    } catch (error) {
      logger.error('Failed to load monitoring data', error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  /**
   * Load system metrics
   */
  const loadSystemMetrics = async () => {
    // Simulate API call to monitoring service
    const metrics: SystemMetrics = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 1000,
      uptime: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
      responseTime: Math.random() * 500 + 50
    };
    
    setSystemMetrics(metrics);
  };

  /**
   * Load performance metrics including Core Web Vitals
   */
  const loadPerformanceMetrics = async () => {
    // Get Core Web Vitals from GA4
    const webVitals = ga4.getWebVitals();
    const latest = webVitals.reduce((acc, vital) => {
      acc[vital.name.toLowerCase() as keyof typeof acc] = vital.value;
      return acc;
    }, { lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0 });

    const metrics: PerformanceMetrics = {
      coreWebVitals: latest,
      pageLoadTime: Math.random() * 3000 + 500,
      apiResponseTime: Math.random() * 200 + 50,
      errorRate: Math.random() * 5,
      throughput: Math.random() * 1000 + 100
    };

    setPerformanceMetrics(metrics);
  };

  /**
   * Load user metrics
   */
  const loadUserMetrics = async () => {
    const metrics: UserMetrics = {
      activeUsers: Math.floor(Math.random() * 500) + 50,
      newUsers: Math.floor(Math.random() * 100) + 10,
      sessionDuration: Math.random() * 600 + 120,
      bounceRate: Math.random() * 50 + 10,
      conversionRate: Math.random() * 10 + 2
    };

    setUserMetrics(metrics);
  };

  /**
   * Load system alerts
   */
  const loadAlerts = async () => {
    const mockAlerts: AlertData[] = [
      {
        id: '1',
        type: 'warning',
        message: 'High CPU usage detected',
        timestamp: new Date(Date.now() - 300000),
        severity: 'medium',
        source: 'System Monitor'
      },
      {
        id: '2',
        type: 'error',
        message: 'Database connection timeout',
        timestamp: new Date(Date.now() - 600000),
        severity: 'high',
        source: 'Database Monitor'
      }
    ];

    setAlerts(mockAlerts);
  };

  /**
   * Refresh all metrics
   */
  const refreshMetrics = async () => {
    await Promise.all([
      loadSystemMetrics(),
      loadPerformanceMetrics(),
      loadUserMetrics()
    ]);
  };

  /**
   * Export monitoring data
   */
  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      systemMetrics,
      performanceMetrics,
      userMetrics,
      alerts,
      webVitals: ga4.getWebVitals(),
      analyticsData: ga4.exportData()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Get metric status color
   */
  const getMetricStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'critical';
  };

  /**
   * Format uptime display
   */
  const formatUptime = (uptime: number) => {
    const seconds = Math.floor((Date.now() - uptime) / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  /**
   * Metric card component
   */
  const MetricCard = ({ title, value, unit, icon: Icon, status, trend }: {
    title: string;
    value: number;
    unit: string;
    icon: any;
    status: 'good' | 'warning' | 'critical';
    trend?: 'up' | 'down';
  }) => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className={cn(
            "w-5 h-5",
            status === 'good' && "text-green-500",
            status === 'warning' && "text-yellow-500",
            status === 'critical' && "text-red-500"
          )} />
          <span className="text-sm font-medium text-gray-600">{title}</span>
        </div>
        {trend && (
          <div className="flex items-center">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      <div className="flex items-baseline space-x-1">
        <span className="text-2xl font-bold">{value.toFixed(1)}</span>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Monitoring Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time system performance and analytics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
            className={cn(
              "flex items-center space-x-2",
              isRealTime && "bg-green-500/20 border-green-500"
            )}
          >
            <Activity className="w-4 h-4" />
            <span>{isRealTime ? 'Live' : 'Paused'}</span>
          </Button>
          
          <Button variant="outline" size="sm" onClick={refreshMetrics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Usage"
          value={systemMetrics.cpu}
          unit="%"
          icon={Cpu}
          status={getMetricStatus(systemMetrics.cpu, { good: 50, warning: 80 })}
          trend={systemMetrics.cpu > 50 ? 'up' : 'down'}
        />
        
        <MetricCard
          title="Memory Usage"
          value={systemMetrics.memory}
          unit="%"
          icon={HardDrive}
          status={getMetricStatus(systemMetrics.memory, { good: 60, warning: 85 })}
        />
        
        <MetricCard
          title="Response Time"
          value={systemMetrics.responseTime}
          unit="ms"
          icon={Zap}
          status={getMetricStatus(systemMetrics.responseTime, { good: 100, warning: 300 })}
        />
        
        <MetricCard
          title="Network I/O"
          value={systemMetrics.network}
          unit="KB/s"
          icon={Wifi}
          status={getMetricStatus(systemMetrics.network, { good: 500, warning: 800 })}
        />
      </div>

      {/* Core Web Vitals */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Monitor className="w-5 h-5 mr-2" />
          Core Web Vitals
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {(performanceMetrics.coreWebVitals.lcp / 1000).toFixed(2)}s
            </div>
            <div className="text-sm text-gray-400">LCP</div>
            <div className={cn(
              "text-xs px-2 py-1 rounded mt-1",
              performanceMetrics.coreWebVitals.lcp <= 2500 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            )}>
              {performanceMetrics.coreWebVitals.lcp <= 2500 ? 'Good' : 'Poor'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {performanceMetrics.coreWebVitals.fid.toFixed(0)}ms
            </div>
            <div className="text-sm text-gray-400">FID</div>
            <div className={cn(
              "text-xs px-2 py-1 rounded mt-1",
              performanceMetrics.coreWebVitals.fid <= 100 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            )}>
              {performanceMetrics.coreWebVitals.fid <= 100 ? 'Good' : 'Poor'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {performanceMetrics.coreWebVitals.cls.toFixed(3)}
            </div>
            <div className="text-sm text-gray-400">CLS</div>
            <div className={cn(
              "text-xs px-2 py-1 rounded mt-1",
              performanceMetrics.coreWebVitals.cls <= 0.1 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            )}>
              {performanceMetrics.coreWebVitals.cls <= 0.1 ? 'Good' : 'Poor'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">
              {(performanceMetrics.coreWebVitals.fcp / 1000).toFixed(2)}s
            </div>
            <div className="text-sm text-gray-400">FCP</div>
            <div className={cn(
              "text-xs px-2 py-1 rounded mt-1",
              performanceMetrics.coreWebVitals.fcp <= 1800 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            )}>
              {performanceMetrics.coreWebVitals.fcp <= 1800 ? 'Good' : 'Poor'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {performanceMetrics.coreWebVitals.ttfb.toFixed(0)}ms
            </div>
            <div className="text-sm text-gray-400">TTFB</div>
            <div className={cn(
              "text-xs px-2 py-1 rounded mt-1",
              performanceMetrics.coreWebVitals.ttfb <= 800 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            )}>
              {performanceMetrics.coreWebVitals.ttfb <= 800 ? 'Good' : 'Poor'}
            </div>
          </div>
        </div>
      </Card>

      {/* User Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            User Metrics
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Users</span>
              <span className="text-2xl font-bold text-green-400">{userMetrics.activeUsers}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">New Users</span>
              <span className="text-2xl font-bold text-blue-400">{userMetrics.newUsers}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Avg Session Duration</span>
              <span className="text-2xl font-bold text-purple-400">
                {Math.floor(userMetrics.sessionDuration / 60)}m {Math.floor(userMetrics.sessionDuration % 60)}s
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Conversion Rate</span>
              <span className="text-2xl font-bold text-orange-400">{userMetrics.conversionRate.toFixed(1)}%</span>
            </div>
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Recent Alerts
          </h2>
          
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 rounded bg-gray-800/50">
                <div className={cn(
                  "w-3 h-3 rounded-full mt-1",
                  alert.type === 'error' && "bg-red-500",
                  alert.type === 'warning' && "bg-yellow-500",
                  alert.type === 'info' && "bg-blue-500"
                )} />
                
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{alert.message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {alert.source} • {alert.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                <div className={cn(
                  "text-xs px-2 py-1 rounded",
                  alert.severity === 'critical' && "bg-red-500/20 text-red-400",
                  alert.severity === 'high' && "bg-orange-500/20 text-orange-400",
                  alert.severity === 'medium' && "bg-yellow-500/20 text-yellow-400",
                  alert.severity === 'low' && "bg-blue-500/20 text-blue-400"
                )}>
                  {alert.severity}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Server className="w-5 h-5 mr-2" />
          System Status
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded">
            <div>
              <div className="text-sm text-gray-400">Database</div>
              <div className="text-lg font-semibold text-white">Online</div>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded">
            <div>
              <div className="text-sm text-gray-400">API Services</div>
              <div className="text-lg font-semibold text-white">Healthy</div>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded">
            <div>
              <div className="text-sm text-gray-400">Uptime</div>
              <div className="text-lg font-semibold text-white">{formatUptime(systemMetrics.uptime)}</div>
            </div>
            <Clock className="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}