'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, Activity, Clock, Target, BarChart3, PieChart, LineChart, Download, RefreshCw } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

interface UserAnalyticsProps {
  className?: string;
}

function MetricCard({ metric }: { metric: AnalyticsMetric }) {
  const Icon = metric.icon;
  
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 hover:bg-white/15 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{metric.label}</p>
          <p className="text-2xl font-bold text-white mt-1">{metric.value}</p>
          <div className={cn(
            'flex items-center mt-2 text-sm',
            metric.trend === 'up' ? 'text-green-400' : 
            metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
          )}>
            {metric.trend === 'up' ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : metric.trend === 'down' ? (
              <TrendingDown className="w-4 h-4 mr-1" />
            ) : (
              <Activity className="w-4 h-4 mr-1" />
            )}
            <span>{Math.abs(metric.change)}% from last month</span>
          </div>
        </div>
        <div className={cn('p-3 rounded-full', metric.color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}

function SimpleChart({ title, data, type: _type = 'line' }: { title: string; data: ChartData; type?: 'line' | 'bar' | 'pie' }) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <LineChart className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <PieChart className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Simplified chart representation */}
      <div className="h-64 flex items-end justify-between space-x-2">
        {data.labels.map((label, index) => {
          const value = data.datasets[0]?.data[index] || 0;
          const maxValue = Math.max(...(data.datasets[0]?.data || [0]));
          const height = (value / maxValue) * 100;
          
          return (
            <div key={label} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t transition-all duration-500 hover:opacity-80"
                style={{ height: `${height}%`, minHeight: '4px' }}
                title={`${label}: ${value}`}
              />
              <span className="text-xs text-gray-400 mt-2 text-center">{label}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function UserSegmentChart() {
  const segments = [
    { label: 'Active Students', value: 68, color: 'bg-green-500' },
    { label: 'Inactive Students', value: 22, color: 'bg-yellow-500' },
    { label: 'Instructors', value: 8, color: 'bg-blue-500' },
    { label: 'Admins', value: 2, color: 'bg-purple-500' }
  ];

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">User Segments</h3>
      
      <div className="space-y-4">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn('w-3 h-3 rounded-full', segment.color)} />
              <span className="text-gray-300">{segment.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={cn('h-full transition-all duration-500', segment.color)}
                  style={{ width: `${segment.value}%` }}
                />
              </div>
              <span className="text-white font-medium w-8 text-right">{segment.value}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TopPerformers() {
  const performers = [
    { name: 'Alice Johnson', xp: 4250, lessons: 32, score: 96 },
    { name: 'Bob Smith', xp: 3890, lessons: 28, score: 94 },
    { name: 'Carol Davis', xp: 3650, lessons: 26, score: 92 },
    { name: 'David Wilson', xp: 3420, lessons: 24, score: 91 },
    { name: 'Eva Brown', xp: 3180, lessons: 22, score: 89 }
  ];

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Top Performers</h3>
        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
          View All
        </Button>
      </div>
      
      <div className="space-y-4">
        {performers.map((performer, index) => (
          <div key={performer.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{index + 1}</span>
              </div>
              <div>
                <div className="font-medium text-white">{performer.name}</div>
                <div className="text-sm text-gray-400">{performer.lessons} lessons completed</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-medium">{performer.xp} XP</div>
              <div className="text-sm text-green-400">{performer.score}% avg</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function UserAnalytics({ className }: UserAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(false);

  const metrics: AnalyticsMetric[] = [
    {
      label: 'Total Users',
      value: '1,247',
      change: 12.5,
      trend: 'up',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      label: 'Active Users',
      value: '892',
      change: 8.3,
      trend: 'up',
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      label: 'Avg. Session Time',
      value: '24m',
      change: -2.1,
      trend: 'down',
      icon: Clock,
      color: 'bg-orange-500'
    },
    {
      label: 'Completion Rate',
      value: '78.5%',
      change: 5.7,
      trend: 'up',
      icon: Target,
      color: 'bg-purple-500'
    }
  ];

  const userGrowthData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'New Users',
      data: [45, 67, 89, 123, 156, 189],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true
    }]
  };

  const engagementData: ChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Engagement Score',
      data: [72, 78, 85, 82],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true
    }]
  };

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Analytics</h1>
          <p className="text-gray-400 mt-1">Insights into user behavior and engagement</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <MetricCard metric={metric} />
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleChart title="User Growth" data={userGrowthData} type="line" />
        <SimpleChart title="Weekly Engagement" data={engagementData} type="bar" />
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserSegmentChart />
        <TopPerformers />
      </div>

      {/* Detailed Insights */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">↑ 23%</div>
            <div className="text-sm text-gray-300">User retention improved this month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-2">4.2/5</div>
            <div className="text-sm text-gray-300">Average user satisfaction score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-2">67%</div>
            <div className="text-sm text-gray-300">Users complete their first lesson</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
