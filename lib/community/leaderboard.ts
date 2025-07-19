'use client';

import { LeaderboardCategory, LeaderboardFilters, LeaderboardResponse, LeaderboardCache, LeaderboardEvent, CommunityError } from './types';
import { realTimeManager } from './websocket';

export class LeaderboardManager {
  private static instance: LeaderboardManager;
  private cache = new Map<string, LeaderboardCache>();
  private cacheTimeout = 30000; // 30 seconds
  private updateDebounceMap = new Map<string, NodeJS.Timeout>();
  private debounceDelay = 200; // 200ms for real-time updates

  static getInstance(): LeaderboardManager {
    if (!LeaderboardManager.instance) {
      LeaderboardManager.instance = new LeaderboardManager();
    }
    return LeaderboardManager.instance;
  }

  constructor() {
    this.setupRealTimeUpdates();
    this.startCacheCleanup();
  }

  private setupRealTimeUpdates(): void {
    // Subscribe to real-time leaderboard updates
    realTimeManager.subscribe('leaderboard_update', (data: LeaderboardEvent) => {
      this.handleRealTimeUpdate(data);
    });

    // Subscribe to user progress updates
    realTimeManager.subscribe('user_progress', (data: any) => {
      this.handleUserProgressUpdate(data);
    });
  }

  private handleRealTimeUpdate(event: LeaderboardEvent): void {
    // Debounce updates to prevent excessive recalculations
    const debounceKey = `${event.type}_${event.userId}`;
    
    if (this.updateDebounceMap.has(debounceKey)) {
      clearTimeout(this.updateDebounceMap.get(debounceKey)!);
    }

    this.updateDebounceMap.set(debounceKey, setTimeout(() => {
      this.processLeaderboardUpdate(event);
      this.updateDebounceMap.delete(debounceKey);
    }, this.debounceDelay));
  }

  private processLeaderboardUpdate(event: LeaderboardEvent): void {
    // Invalidate relevant cache entries
    this.invalidateUserCache(event.userId);
    
    // Notify subscribers of the update
    this.notifyLeaderboardChange(event);
  }

  private handleUserProgressUpdate(data: any): void {
    // Handle user progress updates that affect leaderboards
    const event: LeaderboardEvent = {
      type: 'xp_gained',
      userId: data.userId,
      data: {
        xpGained: data.xpEarned,
        lessonId: data.lessonId
      },
      timestamp: new Date()
    };
    
    this.handleRealTimeUpdate(event);
  }

  private invalidateUserCache(_userId: string): void {
    // Remove cache entries that might be affected by this user's update
    const keysToRemove: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes('global') || key.includes('weekly') || key.includes('daily')) {
        keysToRemove.push(key);
      }
    });
    
    keysToRemove.forEach(key => this.cache.delete(key));
  }

  private notifyLeaderboardChange(event: LeaderboardEvent): void {
    // Emit update to subscribers
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('leaderboardUpdate', { 
        detail: event 
      }));
    }
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = new Date();
      const expiredKeys: string[] = [];
      
      this.cache.forEach((entry, key) => {
        if (entry.expiresAt < now) {
          expiredKeys.push(key);
        }
      });
      
      expiredKeys.forEach(key => this.cache.delete(key));
    }, 60000); // Clean up every minute
  }

  private generateCacheKey(category: string, filters: LeaderboardFilters, page: number): string {
    const filterString = JSON.stringify(filters);
    return `leaderboard_${category}_${page}_${btoa(filterString)}`;
  }

  private getCachedData(key: string): LeaderboardResponse | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: LeaderboardResponse): void {
    const expiresAt = new Date(Date.now() + this.cacheTimeout);
    this.cache.set(key, {
      key,
      data,
      expiresAt,
      lastUpdated: new Date()
    });
  }

  async getLeaderboard(
    category: string, 
    filters: LeaderboardFilters, 
    page: number = 1, 
    limit: number = 50,
    useCache: boolean = true
  ): Promise<LeaderboardResponse> {
    const cacheKey = this.generateCacheKey(category, filters, page);
    
    // Check cache first
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await fetch('/api/community/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          filters,
          page,
          limit
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
      }

      const data: LeaderboardResponse = await response.json();
      
      // Cache the result
      if (useCache) {
        this.setCachedData(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw new CommunityError({
        code: 'LEADERBOARD_FETCH_FAILED',
        message: 'Failed to fetch leaderboard data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  async getLeaderboardCategories(): Promise<LeaderboardCategory[]> {
    try {
      const response = await fetch('/api/community/leaderboard/categories');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching leaderboard categories:', error);
      throw new CommunityError({
        code: 'LEADERBOARD_FETCH_FAILED',
        message: 'Failed to fetch leaderboard categories',
        details: error,
        timestamp: new Date()
      });
    }
  }

  async getUserRank(userId: string, category: string, filters: LeaderboardFilters): Promise<number> {
    try {
      const response = await fetch('/api/community/leaderboard/rank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          category,
          filters
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user rank: ${response.statusText}`);
      }

      const data = await response.json();
      return data.rank;
    } catch (error) {
      console.error('Error fetching user rank:', error);
      return -1;
    }
  }

  async refreshLeaderboard(category: string, filters: LeaderboardFilters): Promise<void> {
    // Clear cache for this leaderboard
    const keysToRemove: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(`leaderboard_${category}`)) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => this.cache.delete(key));

    // Trigger refresh on server
    try {
      await fetch('/api/community/leaderboard/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          filters
        })
      });
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
    }
  }

  // Subscribe to leaderboard updates
  subscribeToUpdates(callback: (event: LeaderboardEvent) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('leaderboardUpdate', handler as EventListener);
      
      return () => {
        window.removeEventListener('leaderboardUpdate', handler as EventListener);
      };
    }
    
    return () => {};
  }

  // Get cache statistics
  getCacheStats(): { size: number; hitRate: number; entries: number } {
    const now = new Date();
    let validEntries = 0;
    
    this.cache.forEach((entry) => {
      if (entry.expiresAt > now) {
        validEntries++;
      }
    });

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
      entries: validEntries
    };
  }

  // Clear all cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get default leaderboard categories
  getDefaultCategories(): LeaderboardCategory[] {
    return [
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
        id: 'completion_rate',
        name: 'Course Completion',
        description: 'Users with highest completion rates',
        icon: '✅',
        sortBy: 'completionRate',
        timeframe: 'all-time',
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
      },
      {
        id: 'top_contributors',
        name: 'Top Contributors',
        description: 'Users with highest contribution scores',
        icon: '🌟',
        sortBy: 'contributionScore',
        timeframe: 'all-time',
        enabled: true
      }
    ];
  }

  // Get default filters
  getDefaultFilters(): LeaderboardFilters {
    return {
      timeframe: 'all-time',
      category: 'global_xp',
      userRole: 'all'
    };
  }
}

// Export singleton instance
export const leaderboardManager = LeaderboardManager.getInstance();

// Utility functions for leaderboard calculations
export const LeaderboardUtils = {
  calculateRankChange(currentRank: number, previousRank?: number): number {
    if (!previousRank) return 0;
    return previousRank - currentRank;
  },

  formatXP(xp: number): string {
    if (xp >= 1000000) {
      return `${(xp / 1000000).toFixed(1)}M`;
    } else if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  },

  formatTimeSpent(minutes: number): string {
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

  getRankIcon(rank: number): string {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  },

  getRankColor(rank: number): string {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    if (rank <= 10) return 'text-blue-400';
    if (rank <= 50) return 'text-green-400';
    return 'text-gray-400';
  },

  getStreakColor(streak: number): string {
    if (streak >= 30) return 'text-red-400';
    if (streak >= 14) return 'text-orange-400';
    if (streak >= 7) return 'text-yellow-400';
    if (streak >= 3) return 'text-green-400';
    return 'text-blue-400';
  }
};
