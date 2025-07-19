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
  private cache = new Map<string, { data: any; expiresAt: Date }>();
  private cacheTimeout = 60000; // 1 minute
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers = new Set<(stats: CommunityStats) => void>();

  static getInstance(): CommunityStatsManager {
    if (!CommunityStatsManager.instance) {
      CommunityStatsManager.instance = new CommunityStatsManager();
    }
    return CommunityStatsManager.instance;
  }

  constructor() {
    this.setupRealTimeUpdates();
    this.startPeriodicUpdates();
  }

  private setupRealTimeUpdates(): void {
    // Subscribe to real-time statistics updates
    realTimeManager.subscribe('stats_update', (data: Partial<CommunityStats>) => {
      this.handleStatsUpdate(data);
    });

    // Subscribe to events that affect statistics
    realTimeManager.subscribe('user_progress', (data: any) => {
      this.handleProgressUpdate(data);
    });

    realTimeManager.subscribe('user_registration', (data: any) => {
      this.handleUserRegistration(data);
    });
  }

  private handleStatsUpdate(data: Partial<CommunityStats>): void {
    // Invalidate relevant cache entries
    this.invalidateCache('community_stats');
    
    // Notify subscribers
    this.notifySubscribers(data);
  }

  private handleProgressUpdate(_data: any): void {
    // Update lesson completion stats
    this.invalidateCache('lesson_stats');
    this.invalidateCache('engagement_stats');
  }

  private handleUserRegistration(_data: any): void {
    // Update user count stats
    this.invalidateCache('user_stats');
  }

  private startPeriodicUpdates(): void {
    // Update statistics every minute
    this.updateInterval = setInterval(() => {
      this.refreshStats();
    }, 60000);
  }

  private async refreshStats(): Promise<void> {
    try {
      const stats = await this.fetchCommunityStats();
      this.notifySubscribers(stats);
    } catch (error) {
      console.error('Failed to refresh community stats:', error);
    }
  }

  private notifySubscribers(stats: Partial<CommunityStats>): void {
    this.subscribers.forEach(callback => {
      try {
        callback(stats as CommunityStats);
      } catch (error) {
        console.error('Error in stats subscriber callback:', error);
      }
    });
  }

  private invalidateCache(pattern: string): void {
    const keysToRemove: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => this.cache.delete(key));
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > new Date()) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    const expiresAt = new Date(Date.now() + this.cacheTimeout);
    this.cache.set(key, { data, expiresAt });
  }

  async getCommunityStats(filters?: StatsFilters, useCache: boolean = true): Promise<CommunityStats> {
    const cacheKey = `community_stats_${JSON.stringify(filters || {})}`;
    
    if (useCache) {
      const cached = this.getCachedData<CommunityStats>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const stats = await this.fetchCommunityStats(filters);
      
      if (useCache) {
        this.setCachedData(cacheKey, stats);
      }
      
      return stats;
    } catch (error) {
      console.error('Error fetching community stats:', error);
      throw new CommunityError({
        code: 'STATS_FETCH_FAILED',
        message: 'Failed to fetch community statistics',
        details: error,
        timestamp: new Date()
      });
    }
  }

  private async fetchCommunityStats(filters?: StatsFilters): Promise<CommunityStats> {
    const response = await fetch('/api/community/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filters })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }

    return response.json();
  }

  async getTrendingTopics(limit: number = 10): Promise<TrendingTopic[]> {
    const cacheKey = `trending_topics_${limit}`;
    
    const cached = this.getCachedData<TrendingTopic[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`/api/community/trending?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trending topics: ${response.statusText}`);
      }
      
      const topics = await response.json();
      this.setCachedData(cacheKey, topics);
      
      return topics;
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  }

  async getCommunityMilestones(limit: number = 5): Promise<CommunityMilestone[]> {
    const cacheKey = `community_milestones_${limit}`;
    
    const cached = this.getCachedData<CommunityMilestone[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`/api/community/milestones?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch milestones: ${response.statusText}`);
      }
      
      const milestones = await response.json();
      this.setCachedData(cacheKey, milestones);
      
      return milestones;
    } catch (error) {
      console.error('Error fetching community milestones:', error);
      return [];
    }
  }

  async exportStats(options: ExportOptions): Promise<string> {
    try {
      const response = await fetch('/api/community/stats/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        throw new Error(`Failed to export stats: ${response.statusText}`);
      }

      if (options.format === 'csv') {
        return response.text();
      } else {
        const data = await response.json();
        return JSON.stringify(data, null, 2);
      }
    } catch (error) {
      console.error('Error exporting stats:', error);
      throw new CommunityError({
        code: 'EXPORT_FAILED',
        message: 'Failed to export statistics',
        details: error,
        timestamp: new Date()
      });
    }
  }

  async getEngagementMetrics(timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<any> {
    const cacheKey = `engagement_metrics_${timeframe}`;
    
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`/api/community/engagement?timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch engagement metrics: ${response.statusText}`);
      }
      
      const metrics = await response.json();
      this.setCachedData(cacheKey, metrics);
      
      return metrics;
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
      return null;
    }
  }

  async getLearningProgress(timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<any> {
    const cacheKey = `learning_progress_${timeframe}`;
    
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`/api/community/learning-progress?timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch learning progress: ${response.statusText}`);
      }
      
      const progress = await response.json();
      this.setCachedData(cacheKey, progress);
      
      return progress;
    } catch (error) {
      console.error('Error fetching learning progress:', error);
      return null;
    }
  }

  // Subscribe to real-time stats updates
  subscribe(callback: (stats: CommunityStats) => void): () => void {
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Get default filters
  getDefaultFilters(): StatsFilters {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return {
      startDate: thirtyDaysAgo,
      endDate: now,
      engagementTypes: ['lessons', 'quizzes', 'projects', 'community']
    };
  }

  // Clear all cache
  clearCache(): void {
    this.cache.clear();
  }

  // Cleanup
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.subscribers.clear();
    this.cache.clear();
  }
}

// Export singleton instance
export const communityStatsManager = CommunityStatsManager.getInstance();

// Utility functions for statistics
export const StatsUtils = {
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  },

  formatPercentage(value: number, total: number): string {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  },

  formatDuration(minutes: number): string {
    if (minutes >= 1440) { // 24 hours
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours}h`;
    } else if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  },

  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  formatGrowthRate(rate: number): string {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(1)}%`;
  },

  getGrowthColor(rate: number): string {
    if (rate > 0) return 'text-green-400';
    if (rate < 0) return 'text-red-400';
    return 'text-gray-400';
  },

  getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  },

  formatTimeRange(startDate: Date, endDate: Date): string {
    const start = startDate.toLocaleDateString();
    const end = endDate.toLocaleDateString();
    
    if (start === end) {
      return start;
    }
    
    return `${start} - ${end}`;
  },

  generateExportFilename(format: 'csv' | 'json', dateRange: { start: Date; end: Date }): string {
    const start = dateRange.start.toISOString().split('T')[0];
    const end = dateRange.end.toISOString().split('T')[0];
    return `community-stats-${start}-to-${end}.${format}`;
  }
};
