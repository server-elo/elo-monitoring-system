'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, BookOpen, Clock, TrendingUp, TrendingDown, Activity, Award, Target, Download, RefreshCw, Filter, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import type {
  CommunityStats,
  StatsFilters,
  TrendingTopic,
  CommunityMilestone,
  LoadingState,
  ExportOptions
} from '@/lib/community/types';
import { communityStatsManager, StatsUtils } from '@/lib/community/statistics';

interface CommunityStatsProps {
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  color: string;
  loading?: boolean;
}

function StatCard({ title, value, change, icon: Icon, color, loading }: StatCardProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          {loading ? (
            <div className="w-20 h-8 bg-gray-600 animate-pulse rounded mt-2" />
          ) : (
            <p className="text-2xl font-bold text-white mt-1">
              {typeof value === 'number' ? StatsUtils.formatNumber(value) : value}
            </p>
          )}
          {change !== undefined && !loading && (
            <div className={cn('flex items-center space-x-1 mt-1', StatsUtils.getGrowthColor(change))}>
              {change >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="text-xs font-medium">
                {StatsUtils.formatGrowthRate(change)}
              </span>
            </div>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', `bg-${color}-500/20`)}>
          <Icon className={cn('w-6 h-6', `text-${color}-400`)} />
        </div>
      </div>
    </Card>
  );
}

interface StatsFiltersProps {
  filters: StatsFilters;
  onFiltersChange: (filters: StatsFilters) => void;
  isLoading: boolean;
}

function StatsFilters({ filters, onFiltersChange, isLoading }: StatsFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value ? new Date(value) : undefined
    });
  };

  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Filters</h3>
        <Button
          onClick={() => setShowAdvanced(!showAdvanced)}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
          <input
            type="date"
            value={formatDateForInput(filters.startDate)}
            onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
          <input
            type="date"
            value={formatDateForInput(filters.endDate)}
            onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* User Role */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">User Role</label>
                <select
                  value={filters.userDemographics?.role || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    userDemographics: {
                      ...filters.userDemographics,
                      role: e.target.value as any || undefined
                    }
                  })}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
                >
                  <option value="">All Roles</option>
                  <option value="student">Students</option>
                  <option value="instructor">Instructors</option>
                  <option value="admin">Admins</option>
                </select>
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                <select
                  value={filters.userDemographics?.region || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    userDemographics: {
                      ...filters.userDemographics,
                      region: e.target.value || undefined
                    }
                  })}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
                >
                  <option value="">All Regions</option>
                  <option value="US">United States</option>
                  <option value="EU">Europe</option>
                  <option value="AS">Asia</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                <select
                  value={filters.difficultyLevels?.[0] || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    difficultyLevels: e.target.value ? [e.target.value as any] : undefined
                  })}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

interface TrendingTopicsProps {
  topics: TrendingTopic[];
  loading: boolean;
}

function TrendingTopics({ topics, loading }: TrendingTopicsProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Trending Topics</h3>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-600 animate-pulse rounded" />
              <div className="flex-1 space-y-2">
                <div className="w-2/3 h-4 bg-gray-600 animate-pulse rounded" />
                <div className="w-1/3 h-3 bg-gray-600 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : topics.length > 0 ? (
        <div className="space-y-3">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-sm">{StatsUtils.getTrendIcon(topic.trend)}</span>
                </div>
                <div>
                  <h4 className="font-medium text-white">{topic.title}</h4>
                  <p className="text-sm text-gray-400">{topic.category}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">{topic.mentions}</div>
                <div className={cn('text-xs', StatsUtils.getGrowthColor(topic.trendPercentage))}>
                  {StatsUtils.formatGrowthRate(topic.trendPercentage)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400">No trending topics found</p>
        </div>
      )}
    </Card>
  );
}

interface CommunityMilestonesProps {
  milestones: CommunityMilestone[];
  loading: boolean;
}

function CommunityMilestones({ milestones, loading }: CommunityMilestonesProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Milestones</h3>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-600 animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-gray-600 animate-pulse rounded" />
                <div className="w-1/2 h-3 bg-gray-600 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : milestones.length > 0 ? (
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg"
            >
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <span className="text-lg">{milestone.icon}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white">{milestone.title}</h4>
                <p className="text-sm text-gray-400">{milestone.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {milestone.achievedAt.toLocaleDateString()}
                  </span>
                  <span className="text-xs text-blue-400 font-medium">
                    {StatsUtils.formatNumber(milestone.value)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400">No recent milestones</p>
        </div>
      )}
    </Card>
  );
}

export function CommunityStats({ className }: CommunityStatsProps) {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [milestones, setMilestones] = useState<CommunityMilestone[]>([]);
  const [filters, setFilters] = useState<StatsFilters>(communityStatsManager.getDefaultFilters());
  const [loading, setLoading] = useState<LoadingState>({
    leaderboards: false,
    statistics: true,
    export: false,
    refresh: false
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadAllData();
    setupRealTimeUpdates();
  }, []);

  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadAllData = async () => {
    await Promise.all([
      loadStats(),
      loadTrendingTopics(),
      loadMilestones()
    ]);
  };

  const loadStats = async () => {
    setLoading(prev => ({ ...prev, statistics: true }));
    
    try {
      const statsData = await communityStatsManager.getCommunityStats(filters);
      setStats(statsData);
      setLastUpdated(statsData.lastUpdated);
    } catch (error) {
      console.error('Failed to load community stats:', error);
    } finally {
      setLoading(prev => ({ ...prev, statistics: false }));
    }
  };

  const loadTrendingTopics = async () => {
    try {
      const topics = await communityStatsManager.getTrendingTopics(10);
      setTrendingTopics(topics);
    } catch (error) {
      console.error('Failed to load trending topics:', error);
    }
  };

  const loadMilestones = async () => {
    try {
      const milestonesData = await communityStatsManager.getCommunityMilestones(5);
      setMilestones(milestonesData);
    } catch (error) {
      console.error('Failed to load milestones:', error);
    }
  };

  const setupRealTimeUpdates = () => {
    const unsubscribe = communityStatsManager.subscribe((updatedStats) => {
      setStats(updatedStats);
      setLastUpdated(new Date());
    });

    return unsubscribe;
  };

  const handleRefresh = async () => {
    setLoading(prev => ({ ...prev, refresh: true }));
    
    try {
      await loadAllData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setLoading(prev => ({ ...prev, refresh: false }));
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setLoading(prev => ({ ...prev, export: true }));
    
    try {
      const exportOptions: ExportOptions = {
        format,
        dateRange: {
          start: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: filters.endDate || new Date()
        },
        includeFields: ['users', 'lessons', 'engagement', 'milestones'],
        filters
      };

      const data = await communityStatsManager.exportStats(exportOptions);
      
      // Download the file
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = StatsUtils.generateExportFilename(format, exportOptions.dateRange);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export stats:', error);
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Community Statistics</h1>
          <p className="text-gray-400 mt-1">
            Track community engagement and platform growth
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button
            onClick={() => handleExport('csv')}
            disabled={loading.export}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => handleExport('json')}
            disabled={loading.export}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={loading.refresh}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading.refresh && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <StatsFilters
        filters={filters}
        onFiltersChange={setFilters}
        isLoading={loading.statistics}
      />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          change={stats?.platformGrowth.userGrowthRate}
          icon={Users}
          color="blue"
          loading={loading.statistics}
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers.today || 0}
          icon={Activity}
          color="green"
          loading={loading.statistics}
        />
        <StatCard
          title="Lessons Completed"
          value={stats?.lessonsCompleted.today || 0}
          change={stats?.platformGrowth.contentGrowthRate}
          icon={BookOpen}
          color="purple"
          loading={loading.statistics}
        />
        <StatCard
          title="Avg. Session Time"
          value={stats ? StatsUtils.formatDuration(stats.engagementMetrics.averageSessionTime) : '0m'}
          change={stats?.platformGrowth.engagementGrowthRate}
          icon={Clock}
          color="orange"
          loading={loading.statistics}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Weekly Active Users"
          value={stats?.engagementMetrics.weeklyActiveUsers || 0}
          icon={Users}
          color="cyan"
          loading={loading.statistics}
        />
        <StatCard
          title="Retention Rate"
          value={stats ? `${stats.engagementMetrics.retentionRate}%` : '0%'}
          icon={Target}
          color="pink"
          loading={loading.statistics}
        />
        <StatCard
          title="Completion Rate"
          value={stats ? StatsUtils.formatPercentage(stats.lessonsCompleted.total, stats.totalUsers * 10) : '0%'}
          icon={Award}
          color="yellow"
          loading={loading.statistics}
        />
      </div>

      {/* Trending Topics and Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendingTopics topics={trendingTopics} loading={loading.statistics} />
        <CommunityMilestones milestones={milestones} loading={loading.statistics} />
      </div>
    </div>
  );
}
