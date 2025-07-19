'use client';

import { LeaderboardCategory, LeaderboardFilters, LeaderboardResponse, LeaderboardCache, LeaderboardEvent, CommunityError } from './types';
import { realTimeManager } from './websocket';

export class LeaderboardManager {
  private static instance: LeaderboardManager;
  private cache = new Map<string, LeaderboardCache>(_);
  private cacheTimeout = 30000; // 30 seconds
  private updateDebounceMap = new Map<string, NodeJS.Timeout>(_);
  private debounceDelay = 200; // 200ms for real-time updates

  static getInstance(_): LeaderboardManager {
    if (!LeaderboardManager.instance) {
      LeaderboardManager.instance = new LeaderboardManager(_);
    }
    return LeaderboardManager.instance;
  }

  constructor(_) {
    this.setupRealTimeUpdates(_);
    this.startCacheCleanup(_);
  }

  private setupRealTimeUpdates(_): void {
    // Subscribe to real-time leaderboard updates
    realTimeManager.subscribe( 'leaderboard_update', (data: LeaderboardEvent) => {
      this.handleRealTimeUpdate(_data);
    });

    // Subscribe to user progress updates
    realTimeManager.subscribe( 'userprogress', (data: any) => {
      this.handleUserProgressUpdate(_data);
    });
  }

  private handleRealTimeUpdate(_event: LeaderboardEvent): void {
    // Debounce updates to prevent excessive recalculations
    const debounceKey = `${event.type}_${event.userId}`;
    
    if (_this.updateDebounceMap.has(debounceKey)) {
      clearTimeout(_this.updateDebounceMap.get(debounceKey)!);
    }

    this.updateDebounceMap.set( debounceKey, setTimeout(() => {
      this.processLeaderboardUpdate(_event);
      this.updateDebounceMap.delete(_debounceKey);
    }, this.debounceDelay));
  }

  private processLeaderboardUpdate(_event: LeaderboardEvent): void {
    // Invalidate relevant cache entries
    this.invalidateUserCache(_event.userId);
    
    // Notify subscribers of the update
    this.notifyLeaderboardChange(_event);
  }

  private handleUserProgressUpdate(_data: any): void {
    // Handle user progress updates that affect leaderboards
    const event: LeaderboardEvent = {
      type: 'xp_gained',
      userId: data.userId,
      data: {
        xpGained: data.xpEarned,
        lessonId: data.lessonId
      },
      timestamp: new Date(_)
    };
    
    this.handleRealTimeUpdate(_event);
  }

  private invalidateUserCache( userId: string): void {
    // Remove cache entries that might be affected by this user's update
    const keysToRemove: string[] = [];
    
    this.cache.forEach( (_, key) => {
      if (_key.includes('global') || key.includes('weekly') || key.includes('daily')) {
        keysToRemove.push(_key);
      }
    });
    
    keysToRemove.forEach(_key => this.cache.delete(key));
  }

  private notifyLeaderboardChange(_event: LeaderboardEvent): void {
    // Emit update to subscribers
    if (_typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('leaderboardUpdate', { 
        detail: event 
      }));
    }
  }

  private startCacheCleanup(_): void {
    setInterval(() => {
      const now = new Date(_);
      const expiredKeys: string[] = [];
      
      this.cache.forEach( (entry, key) => {
        if (_entry.expiresAt < now) {
          expiredKeys.push(_key);
        }
      });
      
      expiredKeys.forEach(_key => this.cache.delete(key));
    }, 60000); // Clean up every minute
  }

  private generateCacheKey( category: string, filters: LeaderboardFilters, page: number): string {
    const filterString = JSON.stringify(_filters);
    return `leaderboard_${category}_${page}_${btoa(_filterString)}`;
  }

  private getCachedData(_key: string): LeaderboardResponse | null {
    const cached = this.cache.get(_key);
    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }
    return null;
  }

  private setCachedData( key: string, data: LeaderboardResponse): void {
    const expiresAt = new Date(_Date.now() + this.cacheTimeout);
    this.cache.set(key, {
      key,
      data,
      expiresAt,
      lastUpdated: new Date(_)
    });
  }

  async getLeaderboard(
    category: string, 
    filters: LeaderboardFilters, 
    page: number = 1, 
    limit: number = 50,
    useCache: boolean = true
  ): Promise<LeaderboardResponse> {
    const cacheKey = this.generateCacheKey( category, filters, page);
    
    // Check cache first
    if (useCache) {
      const cached = this.getCachedData(_cacheKey);
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
        throw new Error(_`Failed to fetch leaderboard: ${response.statusText}`);
      }

      const data: LeaderboardResponse = await response.json(_);
      
      // Cache the result
      if (useCache) {
        this.setCachedData( cacheKey, data);
      }
      
      return data;
    } catch (_error) {
      console.error('Error fetching leaderboard:', error);
      throw new CommunityError({
        code: 'LEADERBOARD_FETCH_FAILED',
        message: 'Failed to fetch leaderboard data',
        details: error,
        timestamp: new Date(_)
      });
    }
  }

  async getLeaderboardCategories(_): Promise<LeaderboardCategory[]> {
    try {
      const response = await fetch('/api/community/leaderboard/categories');
      
      if (!response.ok) {
        throw new Error(_`Failed to fetch categories: ${response.statusText}`);
      }
      
      return response.json(_);
    } catch (_error) {
      console.error('Error fetching leaderboard categories:', error);
      throw new CommunityError({
        code: 'LEADERBOARD_FETCH_FAILED',
        message: 'Failed to fetch leaderboard categories',
        details: error,
        timestamp: new Date(_)
      });
    }
  }

  async getUserRank( userId: string, category: string, filters: LeaderboardFilters): Promise<number> {
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
        throw new Error(_`Failed to fetch user rank: ${response.statusText}`);
      }

      const data = await response.json(_);
      return data.rank;
    } catch (_error) {
      console.error('Error fetching user rank:', error);
      return -1;
    }
  }

  async refreshLeaderboard( category: string, filters: LeaderboardFilters): Promise<void> {
    // Clear cache for this leaderboard
    const keysToRemove: string[] = [];
    this.cache.forEach( (_, key) => {
      if (_key.includes(`leaderboard_${category}`)) {
        keysToRemove.push(_key);
      }
    });
    keysToRemove.forEach(_key => this.cache.delete(key));

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
    } catch (_error) {
      console.error('Error refreshing leaderboard:', error);
    }
  }

  // Subscribe to leaderboard updates
  subscribeToUpdates(_callback: (event: LeaderboardEvent) => void): (_) => void {
    const handler = (_event: CustomEvent) => {
      callback(_event.detail);
    };

    if (_typeof window !== 'undefined') {
      window.addEventListener( 'leaderboardUpdate', handler as EventListener);
      
      return (_) => {
        window.removeEventListener( 'leaderboardUpdate', handler as EventListener);
      };
    }
    
    return (_) => {};
  }

  // Get cache statistics
  getCacheStats(_): { size: number; hitRate: number; entries: number } {
    const now = new Date(_);
    let validEntries = 0;
    
    this.cache.forEach((entry) => {
      if (_entry.expiresAt > now) {
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
  clearCache(_): void {
    this.cache.clear(_);
  }

  // Get default leaderboard categories
  getDefaultCategories(_): LeaderboardCategory[] {
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
  getDefaultFilters(_): LeaderboardFilters {
    return {
      timeframe: 'all-time',
      category: 'global_xp',
      userRole: 'all'
    };
  }
}

// Export singleton instance
export const leaderboardManager = LeaderboardManager.getInstance(_);

// Utility functions for leaderboard calculations
export const LeaderboardUtils = {
  calculateRankChange( currentRank: number, previousRank?: number): number {
    if (!previousRank) return 0;
    return previousRank - currentRank;
  },

  formatXP(_xp: number): string {
    if (_xp >= 1000000) {
      return `${(_xp / 1000000).toFixed(1)}M`;
    } else if (_xp >= 1000) {
      return `${(_xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  },

  formatTimeSpent(_minutes: number): string {
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

  getRankIcon(_rank: number): string {
    switch (_rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  },

  getRankColor(_rank: number): string {
    if (_rank === 1) return 'text-yellow-400';
    if (_rank === 2) return 'text-gray-300';
    if (_rank === 3) return 'text-amber-600';
    if (_rank <= 10) return 'text-blue-400';
    if (_rank <= 50) return 'text-green-400';
    return 'text-gray-400';
  },

  getStreakColor(_streak: number): string {
    if (_streak >= 30) return 'text-red-400';
    if (_streak >= 14) return 'text-orange-400';
    if (_streak >= 7) return 'text-yellow-400';
    if (_streak >= 3) return 'text-green-400';
    return 'text-blue-400';
  }
};
