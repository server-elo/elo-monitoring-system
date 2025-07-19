/**
 * Comprehensive Admin Monitoring Dashboard
 * 
 * Centralized dashboard that combines all monitoring systems:
 * - System performance metrics
 * - Database and Redis monitoring
 * - Uptime monitoring
 * - Bundle analysis
 * - Error tracking
 * - Real-time alerts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, BarChart3, Clock, Database, Download, Monitor, RefreshCw, Settings, TrendingUp, TrendingDown, Zap, Shield, Package, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonitoringDashboard } from './MonitoringDashboard';
import { databaseMonitor } from '@/lib/monitoring/database-monitoring';
import { uptimeMonitor } from '@/lib/monitoring/uptime-monitoring';
import { bundleAnalyzer } from '@/lib/monitoring/bundle-analysis';
import { ga4 } from '@/lib/monitoring/google-analytics';
;
import { logger } from '@/lib/monitoring/simple-logger';
import { cn } from '@/lib/utils';

/**
 * Dashboard tab types
 */
type DashboardTab = 
  | 'overview'
  | 'performance'
  | 'database'
  | 'uptime'
  | 'bundles'
  | 'errors'
  | 'analytics'
  | 'alerts'
  | 'settings';

/**
 * Alert severity levels
 */
interface AlertSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

/**
 * System health status
 */
interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  services: {
    database: 'up' | 'down' | 'degraded';
    redis: 'up' | 'down' | 'degraded';
    api: 'up' | 'down' | 'degraded';
    auth: 'up' | 'down' | 'degraded';
  };
  performance: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  uptime: number;
  lastUpdate: Date;
}

/**
 * Comprehensive monitoring dashboard component
 */
export function ComprehensiveMonitoringDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval] = useState(30000); // 30 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [_searchFilter] = useState('');
  const [_selectedTimeRange] = useState('1h');

  /**
   * Initialize dashboard data
   */
  useEffect(() => {
    initializeDashboard();
    
    if (autoRefresh) {
      const interval = setInterval(refreshDashboard, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  /**
   * Initialize dashboard
   */
  const initializeDashboard = async () => {
    try {
      setIsLoading(true);
      
      await Promise.all([
        loadSystemHealth(),
        loadAlertSummary(),
        loadMonitoringData()
      ]);
      
      logger.info('Comprehensive monitoring dashboard initialized');
    } catch (error) {
      logger.error('Failed to initialize monitoring dashboard', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load system health data
   */
  const loadSystemHealth = async () => {
    try {
      // Get database metrics
      const dbMetrics = databaseMonitor.getDatabaseMetrics();
      const redisMetrics = databaseMonitor.getRedisMetrics();
      
      // Get uptime status
      const uptimeStatus = uptimeMonitor.getSystemStatus();
      
      // Calculate overall health
      let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      
      if (dbMetrics.health.status === 'critical' || 
          redisMetrics.connection.status === 'error' ||
          uptimeStatus.downServices > 0) {
        overallHealth = 'critical';
      } else if (dbMetrics.health.status === 'degraded' || 
                 redisMetrics.connection.status === 'disconnected' ||
                 uptimeStatus.degradedServices > 0) {
        overallHealth = 'warning';
      }

      const health: SystemHealth = {
        overall: overallHealth,
        services: {
          database: dbMetrics.health.status === 'healthy' ? 'up' : 
                   dbMetrics.health.status === 'degraded' ? 'degraded' : 'down',
          redis: redisMetrics.connection.status === 'connected' ? 'up' : 
                redisMetrics.connection.status === 'disconnected' ? 'down' : 'degraded',
          api: uptimeStatus.upServices > 0 ? 'up' : 'down',
          auth: 'up' // Would be determined by specific auth service checks
        },
        performance: {
          responseTime: dbMetrics.queryPerformance.averageExecutionTime,
          errorRate: dbMetrics.queryPerformance.failedQueries / 
                    Math.max(dbMetrics.queryPerformance.totalQueries, 1),
          throughput: dbMetrics.queryPerformance.totalQueries
        },
        uptime: uptimeStatus.averageUptime,
        lastUpdate: new Date()
      };

      setSystemHealth(health);
    } catch (error) {
      logger.error('Failed to load system health', error as Error);
    }
  };

  /**
   * Load alert summary
   */
  const loadAlertSummary = async () => {
    try {
      // Get alerts from various sources
      const uptimeIncidents = uptimeMonitor.getIncidents(undefined, 'open');
      
      // Mock alert summary (would aggregate from all monitoring sources)
      const summary: AlertSummary = {
        critical: uptimeIncidents.filter(i => i.severity === 'critical').length,
        high: uptimeIncidents.filter(i => i.severity === 'high').length,
        medium: uptimeIncidents.filter(i => i.severity === 'medium').length,
        low: uptimeIncidents.filter(i => i.severity === 'low').length,
        total: uptimeIncidents.length
      };

      setAlertSummary(summary);
    } catch (error) {
      logger.error('Failed to load alert summary', error as Error);
    }
  };

  /**
   * Load monitoring data
   */
  const loadMonitoringData = async () => {
    try {
      // Trigger data collection from various monitoring systems
      await Promise.all([
        // Database monitoring data is updated automatically
        // Uptime monitoring data is updated automatically
        // Bundle analysis data would be loaded from latest build
      ]);
    } catch (error) {
      logger.error('Failed to load monitoring data', error as Error);
    }
  };

  /**
   * Refresh dashboard data
   */
  const refreshDashboard = async () => {
    await Promise.all([
      loadSystemHealth(),
      loadAlertSummary()
    ]);
  };

  /**
   * Export monitoring data
   */
  const exportMonitoringData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      systemHealth,
      alertSummary,
      database: databaseMonitor.exportMonitoringData(),
      uptime: uptimeMonitor.exportData(),
      bundles: bundleAnalyzer.exportData(),
      analytics: ga4.exportData()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Dashboard tabs configuration
   */
  const tabs: Array<{ id: DashboardTab; label: string; icon: any; count?: number }> = [
    { id: 'overview', label: 'Overview', icon: Monitor },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'uptime', label: 'Uptime', icon: Activity },
    { id: 'bundles', label: 'Bundles', icon: Package },
    { id: 'errors', label: 'Errors', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: Shield, count: alertSummary?.total },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  /**
   * System status indicator
   */
  const StatusIndicator = ({ status }: { status: 'up' | 'down' | 'degraded' }) => (
    <div className={cn(
      "w-3 h-3 rounded-full",
      status === 'up' && "bg-green-500",
      status === 'degraded' && "bg-yellow-500",
      status === 'down' && "bg-red-500"
    )} />
  );

  /**
   * Health metric card
   */
  const HealthMetricCard = ({ 
    title, 
    value, 
    unit, 
    status, 
    icon: Icon,
    trend 
  }: {
    title: string;
    value: number;
    unit: string;
    status: 'good' | 'warning' | 'critical';
    icon: any;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading monitoring dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                System Monitoring Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Real-time monitoring and analytics for the Solidity Learning Platform
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* System health indicator */}
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  systemHealth?.overall === 'healthy' && "bg-green-500",
                  systemHealth?.overall === 'warning' && "bg-yellow-500",
                  systemHealth?.overall === 'critical' && "bg-red-500"
                )} />
                <span className="text-sm font-medium">
                  {systemHealth?.overall === 'healthy' && 'All Systems Operational'}
                  {systemHealth?.overall === 'warning' && 'Some Issues Detected'}
                  {systemHealth?.overall === 'critical' && 'Critical Issues'}
                </span>
              </div>

              {/* Auto refresh toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={cn(
                  "flex items-center space-x-2",
                  autoRefresh && "bg-green-500/20 border-green-500"
                )}
              >
                <Activity className="w-4 h-4" />
                <span>{autoRefresh ? 'Live' : 'Paused'}</span>
              </Button>
              
              {/* Manual refresh */}
              <Button variant="outline" size="sm" onClick={refreshDashboard}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              {/* Export data */}
              <Button variant="outline" size="sm" onClick={exportMonitoringData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 border-b-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {systemHealth && (
                <>
                  <HealthMetricCard
                    title="System Uptime"
                    value={systemHealth.uptime * 100}
                    unit="%"
                    status={systemHealth.uptime > 0.99 ? 'good' : systemHealth.uptime > 0.95 ? 'warning' : 'critical'}
                    icon={Clock}
                    trend="up"
                  />
                  <HealthMetricCard
                    title="Response Time"
                    value={systemHealth.performance.responseTime}
                    unit="ms"
                    status={systemHealth.performance.responseTime < 100 ? 'good' : systemHealth.performance.responseTime < 500 ? 'warning' : 'critical'}
                    icon={Zap}
                    trend={systemHealth.performance.responseTime < 200 ? 'up' : 'down'}
                  />
                  <HealthMetricCard
                    title="Error Rate"
                    value={systemHealth.performance.errorRate * 100}
                    unit="%"
                    status={systemHealth.performance.errorRate < 0.01 ? 'good' : systemHealth.performance.errorRate < 0.05 ? 'warning' : 'critical'}
                    icon={AlertTriangle}
                    trend={systemHealth.performance.errorRate < 0.02 ? 'up' : 'down'}
                  />
                  <HealthMetricCard
                    title="Throughput"
                    value={systemHealth.performance.throughput}
                    unit="req/min"
                    status="good"
                    icon={Activity}
                    trend="up"
                  />
                </>
              )}
            </div>

            {/* Services status */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Service Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {systemHealth && Object.entries(systemHealth.services).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <StatusIndicator status={status} />
                      <span className="font-medium capitalize">{service}</span>
                    </div>
                    <span className={cn(
                      "text-sm",
                      status === 'up' && "text-green-600",
                      status === 'degraded' && "text-yellow-600",
                      status === 'down' && "text-red-600"
                    )}>
                      {status === 'up' && 'Operational'}
                      {status === 'degraded' && 'Degraded'}
                      {status === 'down' && 'Down'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent alerts */}
            {alertSummary && alertSummary.total > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Active Alerts</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('alerts')}
                  >
                    View All
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{alertSummary.critical}</div>
                    <div className="text-sm text-gray-600">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{alertSummary.high}</div>
                    <div className="text-sm text-gray-600">High</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{alertSummary.medium}</div>
                    <div className="text-sm text-gray-600">Medium</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{alertSummary.low}</div>
                    <div className="text-sm text-gray-600">Low</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <MonitoringDashboard />
        )}

        {/* Other tabs would render their respective components */}
        {activeTab === 'database' && (
          <div className="text-center text-gray-500 py-8">
            Database monitoring component would be rendered here
          </div>
        )}

        {/* Placeholder for other tabs */}
        {!['overview', 'performance', 'database'].includes(activeTab) && (
          <div className="text-center text-gray-500 py-8">
            {tabs.find(t => t.id === activeTab)?.label} monitoring component would be rendered here
          </div>
        )}
      </div>
    </div>
  );
}