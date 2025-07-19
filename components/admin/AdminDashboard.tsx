'use client';

import React, { useState, useEffect } from 'react';
import { Users, FileText, TrendingUp, Activity, AlertTriangle, CheckCircle, Eye, Download, Upload, Server, Database, Cpu, HardDrive, Wifi, Shield } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { AdminStats, SystemHealth, AdminNotification } from '@/lib/admin/types';

interface DashboardWidgetProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

function DashboardWidget({ title, value, change, icon: Icon, color, trend, loading }: DashboardWidgetProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 hover:bg-white/15 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          {loading ? (
            <div className="w-16 h-8 bg-gray-600 animate-pulse rounded mt-2" />
          ) : (
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          )}
          {change !== undefined && !loading && (
            <div className={cn(
              'flex items-center mt-2 text-sm',
              trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
            )}>
              <TrendingUp className={cn('w-4 h-4 mr-1', trend === 'down' && 'rotate-180')} />
              <span>{Math.abs(change)}% from last month</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-full', color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}

interface SystemHealthCardProps {
  health: SystemHealth;
  loading?: boolean;
}

function SystemHealthCard({ health, loading }: SystemHealthCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return Activity;
    }
  };

  const StatusIcon = getStatusIcon(health.status);

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">System Health</h3>
        <div className={cn('flex items-center space-x-2', getStatusColor(health.status))}>
          <StatusIcon className="w-5 h-5" />
          <span className="font-medium capitalize">{health.status}</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex justify-between">
              <div className="w-20 h-4 bg-gray-600 animate-pulse rounded" />
              <div className="w-16 h-4 bg-gray-600 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">CPU Usage</span>
            </div>
            <span className="text-white font-medium">{health.cpuUsage}%</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">Memory</span>
            </div>
            <span className="text-white font-medium">{health.memoryUsage}%</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">Disk Usage</span>
            </div>
            <span className="text-white font-medium">{health.diskUsage}%</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">DB Connections</span>
            </div>
            <span className="text-white font-medium">{health.databaseConnections}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">Response Time</span>
            </div>
            <span className="text-white font-medium">{health.responseTime}ms</span>
          </div>

          {health.issues.length > 0 && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
              <h4 className="text-red-400 font-medium mb-2">Issues Detected</h4>
              <ul className="text-sm text-red-300 space-y-1">
                {health.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

interface RecentActivityProps {
  activities: AdminNotification[];
  loading?: boolean;
}

function RecentActivity({ activities, loading }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'security': return Shield;
      case 'user': return Users;
      case 'content': return FileText;
      case 'system': return Server;
      default: return Activity;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
          View All
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-600 animate-pulse rounded-full" />
              <div className="flex-1">
                <div className="w-3/4 h-4 bg-gray-600 animate-pulse rounded mb-2" />
                <div className="w-1/2 h-3 bg-gray-600 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={cn('p-2 rounded-full bg-gray-700', getSeverityColor(activity.severity))}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{activity.title}</p>
                  <p className="text-gray-400 text-xs mt-1">{activity.message}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {activity.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {activity.actionRequired && (
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recentActivity, setRecentActivity] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    // Simulate API calls
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data
    const mockStats: AdminStats = {
      totalUsers: 1247,
      activeUsers: 892,
      newUsersToday: 23,
      totalContent: 156,
      publishedContent: 142,
      pendingContent: 14,
      totalCompletions: 3421,
      averageEngagement: 78.5,
      systemHealth: 'healthy',
      serverLoad: 45,
      databaseSize: 2.3,
      storageUsed: 67.8
    };

    const mockSystemHealth: SystemHealth = {
      status: 'healthy',
      uptime: 99.98,
      cpuUsage: 45,
      memoryUsage: 62,
      diskUsage: 34,
      databaseConnections: 12,
      activeUsers: 892,
      responseTime: 120,
      errorRate: 0.02,
      lastChecked: new Date(),
      issues: []
    };

    const mockActivity: AdminNotification[] = [
      {
        id: '1',
        type: 'security',
        severity: 'warning',
        title: 'Multiple failed login attempts',
        message: '5 failed attempts from IP 192.168.1.100',
        timestamp: new Date(Date.now() - 300000),
        read: false,
        actionRequired: true
      },
      {
        id: '2',
        type: 'user',
        severity: 'info',
        title: 'New user registration',
        message: 'John Doe registered as a student',
        timestamp: new Date(Date.now() - 600000),
        read: false,
        actionRequired: false
      },
      {
        id: '3',
        type: 'content',
        severity: 'info',
        title: 'Content published',
        message: 'Advanced Solidity Patterns lesson published',
        timestamp: new Date(Date.now() - 900000),
        read: true,
        actionRequired: false
      }
    ];

    setStats(mockStats);
    setSystemHealth(mockSystemHealth);
    setRecentActivity(mockActivity);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's what's happening with your platform.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            <Upload className="w-4 h-4 mr-2" />
            Import Data
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardWidget
          title="Total Users"
          value={stats?.totalUsers.toLocaleString() || '0'}
          change={12}
          icon={Users}
          color="bg-blue-500"
          trend="up"
          loading={loading}
        />
        <DashboardWidget
          title="Active Users"
          value={stats?.activeUsers.toLocaleString() || '0'}
          change={8}
          icon={Activity}
          color="bg-green-500"
          trend="up"
          loading={loading}
        />
        <DashboardWidget
          title="Published Content"
          value={stats?.publishedContent || 0}
          change={-3}
          icon={FileText}
          color="bg-purple-500"
          trend="down"
          loading={loading}
        />
        <DashboardWidget
          title="Avg. Engagement"
          value={stats ? `${stats.averageEngagement}%` : '0%'}
          change={5}
          icon={TrendingUp}
          color="bg-orange-500"
          trend="up"
          loading={loading}
        />
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="lg:col-span-1">
          <SystemHealthCard health={systemHealth!} loading={loading} />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivity} loading={loading} />
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 h-auto py-4 flex-col space-y-2"
          >
            <Users className="w-6 h-6" />
            <span>Manage Users</span>
          </Button>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 h-auto py-4 flex-col space-y-2"
          >
            <FileText className="w-6 h-6" />
            <span>Review Content</span>
          </Button>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 h-auto py-4 flex-col space-y-2"
          >
            <Shield className="w-6 h-6" />
            <span>Security Logs</span>
          </Button>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 h-auto py-4 flex-col space-y-2"
          >
            <Eye className="w-6 h-6" />
            <span>Audit Trail</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
