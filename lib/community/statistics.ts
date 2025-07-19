'use client';

import {
  CommunityStats,
  StatsFilters,
  ExportOptions,
  TrendingTopic,
  CommunityMilestone,
  CommunityError
} from './types';
import { realTimeManager } from './websocket';

export class CommunityStatsManager {
  private static instance: CommunityStatsManager;
  private cache = new Map<string, { data: any; expiresAt: Date }>(_);
  private cacheTimeout = 60000; // 1 minute
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers = new Set<(_stats: CommunityStats) => void>(_);

  static getInstance(_): CommunityStatsManager {
    if (!CommunityStatsManager.instance) {
      CommunityStatsManager.instance = new CommunityStatsManager(_);
    }
    return CommunityStatsManager.instance;
  }

  constructor(_) {
    this.setupRealTimeUpdates(_);
    this.startPeriodicUpdates(_);
  }

  private setupRealTimeUpdates(_): void {
    // Subscribe to real-time statistics updates
    realTimeManager.subscribe( 'stats_update', (data: Partial<CommunityStats>) => {
      this.handleStatsUpdate(_data);
    });

    // Subscribe to events that affect statistics
    realTimeManager.subscribe( 'userprogress', (data: any) => {
      this.handleProgressUpdate(_data);
    });

    realTimeManager.subscribe( 'user_registration', (data: any) => {
      this.handleUserRegistration(_data);
    });
  }

  private handleStatsUpdate(_data: Partial<CommunityStats>): void {
    // Invalidate relevant cache entries
    this.invalidateCache('community_stats');
    
    // Notify subscribers
    this.notifySubscribers(_data);
  }

  private handleProgressUpdate( data: any): void {
    // Update lesson completion stats
    this.invalidateCache('lesson_stats');
    this.invalidateCache('engagement_stats');
  }

  private handleUserRegistration( data: any): void {
    // Update user count stats
    this.invalidateCache('user_stats');
  }

  private startPeriodicUpdates(_): void {
    // Update statistics every minute
    this.updateInterval = setInterval(() => {
      this.refreshStats(_);
    }, 60000);
  }

  private async refreshStats(_): Promise<void> {
    try {
      const stats = await this.fetchCommunityStats(_);
      this.notifySubscribers(_stats);
    } catch (_error) {
      console.error('Failed to refresh community stats:', error);
    }
  }

  private notifySubscribers(_stats: Partial<CommunityStats>): void {
    this.subscribers.forEach(callback => {
      try {
        callback(_stats as CommunityStats);
      } catch (_error) {
        console.error('Error in stats subscriber callback:', error);
      }
    });
  }

  private invalidateCache(_pattern: string): void {
    const keysToRemove: string[] = [];
    this.cache.forEach( (_, key) => {
      if (_key.includes(pattern)) {
        keysToRemove.push(_key);
      }
    });
    keysToRemove.forEach(_key => this.cache.delete(key));
  }

  private getCachedData<T>(_key: string): T | null {
    const cached = this.cache.get(_key);
    if (cached && cached.expiresAt > new Date()) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData<T>( key: string, data: T): void {
    const expiresAt = new Date(_Date.now() + this.cacheTimeout);
    this.cache.set( key, { data, expiresAt });
  }

  async getCommunityStats( filters?: StatsFilters, useCache: boolean = true): Promise<CommunityStats> {
    const cacheKey = `community_stats_${JSON.stringify(_filters || {})}`;
    
    if (useCache) {
      const cached = this.getCachedData<CommunityStats>(_cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const stats = await this.fetchCommunityStats(_filters);
      
      if (useCache) {
        this.setCachedData( cacheKey, stats);
      }
      
      return stats;
    } catch (_error) {
      console.error('Error fetching community stats:', error);
      throw new CommunityError({
        code: 'STATS_FETCH_FAILED',
        message: 'Failed to fetch community statistics',
        details: error,
        timestamp: new Date(_)
      });
    }
  }

  private async fetchCommunityStats(_filters?: StatsFilters): Promise<CommunityStats> {
    const response = await fetch('/api/community/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filters  })
    });

    if (!response.ok) {
      throw new Error(_`Failed to fetch stats: ${response.statusText}`);
    }

    return response.json(_);
  }

  async getTrendingTopics(_limit: number = 10): Promise<TrendingTopic[]> {
    const cacheKey = `trending_topics_${limit}`;
    
    const cached = this.getCachedData<TrendingTopic[]>(_cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(_`/api/community/trending?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(_`Failed to fetch trending topics: ${response.statusText}`);
      }
      
      const topics = await response.json(_);
      this.setCachedData( cacheKey, topics);
      
      return topics;
    } catch (_error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  }

  async getCommunityMilestones(_limit: number = 5): Promise<CommunityMilestone[]> {
    const cacheKey = `community_milestones_${limit}`;
    
    const cached = this.getCachedData<CommunityMilestone[]>(_cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(_`/api/community/milestones?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(_`Failed to fetch milestones: ${response.statusText}`);
      }
      
      const milestones = await response.json(_);
      this.setCachedData( cacheKey, milestones);
      
      return milestones;
    } catch (_error) {
      console.error('Error fetching community milestones:', error);
      return [];
    }
  }

  async exportStats(_options: ExportOptions): Promise<string> {
    try {
      const response = await fetch('/api/community/stats/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(_options)
      });

      if (!response.ok) {
        throw new Error(_`Failed to export stats: ${response.statusText}`);
      }

      if (_options.format === 'csv') {
        return response.text(_);
      } else {
        const data = await response.json(_);
        return JSON.stringify( data, null, 2);
      }
    } catch (_error) {
      console.error('Error exporting stats:', error);
      throw new CommunityError({
        code: 'EXPORT_FAILED',
        message: 'Failed to export statistics',
        details: error,
        timestamp: new Date(_)
      });
    }
  }

  async getEngagementMetrics(_timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<any> {
    const cacheKey = `engagement_metrics_${timeframe}`;
    
    const cached = this.getCachedData(_cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(_`/api/community/engagement?timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error(_`Failed to fetch engagement metrics: ${response.statusText}`);
      }
      
      const metrics = await response.json(_);
      this.setCachedData( cacheKey, metrics);
      
      return metrics;
    } catch (_error) {
      console.error('Error fetching engagement metrics:', error);
      return null;
    }
  }

  async getLearningProgress(_timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<any> {
    const cacheKey = `learningprogress_${timeframe}`;
    
    const cached = this.getCachedData(_cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(_`/api/community/learning-progress?timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error(_`Failed to fetch learning progress: ${response.statusText}`);
      }
      
      const progress = await response.json(_);
      this.setCachedData( cacheKey, progress);
      
      return progress;
    } catch (_error) {
      console.error('Error fetching learning progress:', error);
      return null;
    }
  }

  // Subscribe to real-time stats updates
  subscribe(_callback: (stats: CommunityStats) => void): (_) => void {
    this.subscribers.add(_callback);
    
    return (_) => {
      this.subscribers.delete(_callback);
    };
  }

  // Get default filters
  getDefaultFilters(_): StatsFilters {
    const now = new Date(_);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return {
      startDate: thirtyDaysAgo,
      endDate: now,
      engagementTypes: ['lessons', 'quizzes', 'projects', 'community']
    };
  }

  // Clear all cache
  clearCache(_): void {
    this.cache.clear(_);
  }

  // Cleanup
  destroy(_): void {
    if (_this.updateInterval) {
      clearInterval(_this.updateInterval);
      this.updateInterval = null;
    }
    this.subscribers.clear(_);
    this.cache.clear(_);
  }
}

// Export singleton instance
export const communityStatsManager = CommunityStatsManager.getInstance(_);

// Utility functions for statistics
export const StatsUtils = {
  formatNumber(_num: number): string {
    if (_num >= 1000000) {
      return `${(_num / 1000000).toFixed(1)}M`;
    } else if (_num >= 1000) {
      return `${(_num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  },

  formatPercentage( value: number, total: number): string {
    if (_total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  },

  formatDuration(_minutes: number): string {
    if (_minutes >= 1440) { // 24 hours
      const days = Math.floor(_minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours}h`;
    } else if (_minutes >= 60) {
      const hours = Math.floor(_minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  },

  calculateGrowthRate( current: number, previous: number): number {
    if (_previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  formatGrowthRate(_rate: number): string {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(1)}%`;
  },

  getGrowthColor(_rate: number): string {
    if (_rate > 0) return 'text-green-400';
    if (_rate < 0) return 'text-red-400';
    return 'text-gray-400';
  },

  getTrendIcon(_trend: 'up' | 'down' | 'stable'): string {
    switch (_trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  },

  formatTimeRange( startDate: Date, endDate: Date): string {
    const start = startDate.toLocaleDateString(_);
    const end = endDate.toLocaleDateString(_);
    
    if (_start === end) {
      return start;
    }
    
    return `${start} - ${end}`;
  },

  generateExportFilename( format: 'csv' | 'json', dateRange: { start: Date; end: Date }): string {
    const start = dateRange.start.toISOString().split('T')[0];
    const end = dateRange.end.toISOString().split('T')[0];
    return `community-stats-${start}-to-${end}.${format}`;
  }
};
