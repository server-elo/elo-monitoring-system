'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, BarChart3, Shield, RefreshCw, Save, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { CommunityConfig, CommunityFeatureFlags, LeaderboardCategory } from '@/lib/community/types';
;

interface CommunityControlsProps {
  className?: string;
}

interface FeatureFlagToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  icon?: React.ComponentType<any>;
}

function FeatureFlagToggle({ label, description, enabled, onToggle, disabled, icon: Icon }: FeatureFlagToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
      <div className="flex items-center space-x-3">
        {Icon && (
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-400" />
          </div>
        )}
        <div>
          <h4 className="font-medium text-white">{label}</h4>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50',
          enabled ? 'bg-blue-600' : 'bg-gray-600'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

interface LeaderboardCategoryManagerProps {
  categories: LeaderboardCategory[];
  onCategoriesChange: (categories: LeaderboardCategory[]) => void;
}

function LeaderboardCategoryManager({ categories, onCategoriesChange }: LeaderboardCategoryManagerProps) {
  const handleToggleCategory = (categoryId: string, enabled: boolean) => {
    const updatedCategories = categories.map(category =>
      category.id === categoryId ? { ...category, enabled } : category
    );
    onCategoriesChange(updatedCategories);
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Leaderboard Categories</h3>
      <div className="space-y-3">
        {categories.map(category => (
          <div key={category.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{category.icon}</span>
              <div>
                <h4 className="font-medium text-white">{category.name}</h4>
                <p className="text-sm text-gray-400">{category.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 capitalize">{category.timeframe}</span>
              <button
                onClick={() => handleToggleCategory(category.id, !category.enabled)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  category.enabled ? 'bg-green-600' : 'bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                    category.enabled ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CommunityControls({ className }: CommunityControlsProps) {
  const [config, setConfig] = useState<CommunityConfig | null>(null);
  const [featureFlags, setFeatureFlags] = useState<CommunityFeatureFlags | null>(null);
  const [categories, setCategories] = useState<LeaderboardCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadCommunityConfig();
  }, []);

  const loadCommunityConfig = async () => {
    setLoading(true);
    
    try {
      // In a real application, these would be API calls
      const mockConfig: CommunityConfig = {
        leaderboards: {
          enabled: true,
          categories: [
            {
              id: 'global_xp',
              name: 'Global XP Leaders',
              description: 'Top users by total XP earned',
              icon: '🏆',
              sortBy: 'xpTotal',
              timeframe: 'all-time',
              enabled: true
            },
            {
              id: 'weekly_xp',
              name: 'Weekly XP Leaders',
              description: 'Top users by XP earned this week',
              icon: '📅',
              sortBy: 'xpWeekly',
              timeframe: 'weekly',
              enabled: true
            },
            {
              id: 'streak_leaders',
              name: 'Streak Leaders',
              description: 'Users with longest learning streaks',
              icon: '🔥',
              sortBy: 'currentStreak',
              timeframe: 'all-time',
              enabled: true
            }
          ],
          updateInterval: 30000,
          cacheTimeout: 60000,
          maxUsersPerPage: 50,
          realTimeUpdates: true
        },
        statistics: {
          enabled: true,
          updateInterval: 60000,
          retentionPeriod: 365,
          exportEnabled: true,
          realTimeUpdates: true
        },
        realTime: {
          enabled: true,
          websocketUrl: 'ws://localhost:3001/community',
          fallbackPollingInterval: 30000,
          maxReconnectAttempts: 5,
          heartbeatInterval: 30000
        },
        performance: {
          cacheEnabled: true,
          cacheTTL: 300000,
          debounceDelay: 200,
          maxConcurrentUsers: 1000
        }
      };

      const mockFeatureFlags: CommunityFeatureFlags = {
        leaderboardsEnabled: true,
        statisticsEnabled: true,
        realTimeUpdatesEnabled: true,
        achievementsEnabled: true,
        badgesEnabled: true,
        streaksEnabled: true,
        communityMilestonesEnabled: true,
        exportEnabled: true,
        adminControlsEnabled: true
      };

      setConfig(mockConfig);
      setFeatureFlags(mockFeatureFlags);
      setCategories(mockConfig.leaderboards.categories);
    } catch (error) {
      console.error('Failed to load community config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureFlagChange = (flag: keyof CommunityFeatureFlags, enabled: boolean) => {
    if (!featureFlags) return;
    
    setFeatureFlags(prev => prev ? { ...prev, [flag]: enabled } : null);
    setHasChanges(true);
  };

  const handleConfigChange = (section: keyof CommunityConfig, field: string, value: any) => {
    if (!config) return;
    
    setConfig(prev => prev ? {
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    } : null);
    setHasChanges(true);
  };

  const handleCategoriesChange = (updatedCategories: LeaderboardCategory[]) => {
    setCategories(updatedCategories);
    if (config) {
      setConfig(prev => prev ? {
        ...prev,
        leaderboards: {
          ...prev.leaderboards,
          categories: updatedCategories
        }
      } : null);
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!config || !featureFlags) return;
    
    setSaving(true);
    
    try {
      // In a real application, these would be API calls to save the configuration
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save community config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadCommunityConfig();
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-600 rounded w-1/3 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-600 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!config || !featureFlags) {
    return (
      <div className={cn('text-center py-12', className)}>
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Failed to Load Configuration</h3>
        <p className="text-gray-400 mb-4">Unable to load community configuration settings.</p>
        <Button onClick={loadCommunityConfig} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Community Controls</h1>
          <p className="text-gray-400 mt-1">Manage community features and settings</p>
        </div>
        <div className="flex items-center space-x-3">
          {lastSaved && (
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
          <Button
            onClick={handleReset}
            disabled={!hasChanges || saving}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Feature Flags */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Feature Flags</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureFlagToggle
            label="Leaderboards"
            description="Enable community leaderboards and rankings"
            enabled={featureFlags.leaderboardsEnabled}
            onToggle={(enabled) => handleFeatureFlagChange('leaderboardsEnabled', enabled)}
            icon={Trophy}
          />
          <FeatureFlagToggle
            label="Statistics Dashboard"
            description="Enable community statistics and analytics"
            enabled={featureFlags.statisticsEnabled}
            onToggle={(enabled) => handleFeatureFlagChange('statisticsEnabled', enabled)}
            icon={BarChart3}
          />
          <FeatureFlagToggle
            label="Real-time Updates"
            description="Enable WebSocket real-time updates"
            enabled={featureFlags.realTimeUpdatesEnabled}
            onToggle={(enabled) => handleFeatureFlagChange('realTimeUpdatesEnabled', enabled)}
            icon={Activity}
          />
          <FeatureFlagToggle
            label="Achievements System"
            description="Enable user achievements and rewards"
            enabled={featureFlags.achievementsEnabled}
            onToggle={(enabled) => handleFeatureFlagChange('achievementsEnabled', enabled)}
            icon={Trophy}
          />
          <FeatureFlagToggle
            label="Badges System"
            description="Enable user badges and recognition"
            enabled={featureFlags.badgesEnabled}
            onToggle={(enabled) => handleFeatureFlagChange('badgesEnabled', enabled)}
            icon={Shield}
          />
          <FeatureFlagToggle
            label="Learning Streaks"
            description="Enable learning streak tracking"
            enabled={featureFlags.streaksEnabled}
            onToggle={(enabled) => handleFeatureFlagChange('streaksEnabled', enabled)}
            icon={Clock}
          />
        </div>
      </Card>

      {/* Leaderboard Categories */}
      <LeaderboardCategoryManager
        categories={categories}
        onCategoriesChange={handleCategoriesChange}
      />

      {/* Performance Settings */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Performance Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cache TTL (seconds)
            </label>
            <input
              type="number"
              value={config.performance.cacheTTL / 1000}
              onChange={(e) => handleConfigChange('performance', 'cacheTTL', parseInt(e.target.value) * 1000)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Update Interval (seconds)
            </label>
            <input
              type="number"
              value={config.leaderboards.updateInterval / 1000}
              onChange={(e) => handleConfigChange('leaderboards', 'updateInterval', parseInt(e.target.value) * 1000)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Users Per Page
            </label>
            <input
              type="number"
              value={config.leaderboards.maxUsersPerPage}
              onChange={(e) => handleConfigChange('leaderboards', 'maxUsersPerPage', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Concurrent Users
            </label>
            <input
              type="number"
              value={config.performance.maxConcurrentUsers}
              onChange={(e) => handleConfigChange('performance', 'maxConcurrentUsers', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </Card>

      {/* Real-time Settings */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Real-time Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              WebSocket URL
            </label>
            <input
              type="text"
              value={config.realTime.websocketUrl}
              onChange={(e) => handleConfigChange('realTime', 'websocketUrl', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fallback Polling Interval (seconds)
            </label>
            <input
              type="number"
              value={config.realTime.fallbackPollingInterval / 1000}
              onChange={(e) => handleConfigChange('realTime', 'fallbackPollingInterval', parseInt(e.target.value) * 1000)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Reconnect Attempts
            </label>
            <input
              type="number"
              value={config.realTime.maxReconnectAttempts}
              onChange={(e) => handleConfigChange('realTime', 'maxReconnectAttempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Heartbeat Interval (seconds)
            </label>
            <input
              type="number"
              value={config.realTime.heartbeatInterval / 1000}
              onChange={(e) => handleConfigChange('realTime', 'heartbeatInterval', parseInt(e.target.value) * 1000)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
