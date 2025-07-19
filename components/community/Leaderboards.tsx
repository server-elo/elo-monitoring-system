'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Filter, RefreshCw, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import type {
  LeaderboardUser,
  LeaderboardCategory,
  LeaderboardFilters,
  LeaderboardResponse,
  LoadingState
} from '@/lib/community/types';
import { leaderboardManager, LeaderboardUtils } from '@/lib/community/leaderboard';
import { useAuth } from '@/lib/hooks/useAuth';
import { logger } from '@/lib/api/logger';

interface LeaderboardsProps {
  className?: string;
}

interface LeaderboardFiltersProps {
  filters: LeaderboardFilters;
  onFiltersChange: (filters: LeaderboardFilters) => void;
  categories: LeaderboardCategory[];
  isLoading: boolean;
}

function LeaderboardFilters({ filters, onFiltersChange, categories, isLoading }: LeaderboardFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <select
            value={filters.category}
            onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
          <select
            value={filters.timeframe}
            onChange={(e) => onFiltersChange({ ...filters, timeframe: e.target.value as any })}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="all-time">All Time</option>
          </select>
        </div>

        {/* User Role */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">User Role</label>
          <select
            value={filters.userRole || 'all'}
            onChange={(e) => onFiltersChange({ ...filters, userRole: e.target.value === 'all' ? undefined : e.target.value as any })}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
          >
            <option value="all">All Users</option>
            <option value="student">Students</option>
            <option value="instructor">Instructors</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
              placeholder="Search users..."
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 disabled:opacity-50"
            />
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                <select
                  value={filters.region || ''}
                  onChange={(e) => onFiltersChange({ ...filters, region: e.target.value || undefined })}
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

              {/* Min XP */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Min XP</label>
                <input
                  type="number"
                  value={filters.minXP || ''}
                  onChange={(e) => onFiltersChange({ ...filters, minXP: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="0"
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 disabled:opacity-50"
                />
              </div>

              {/* Max XP */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max XP</label>
                <input
                  type="number"
                  value={filters.maxXP || ''}
                  onChange={(e) => onFiltersChange({ ...filters, maxXP: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="No limit"
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 disabled:opacity-50"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

interface LeaderboardUserCardProps {
  user: LeaderboardUser;
  currentUserId?: string;
  category: LeaderboardCategory;
  index: number;
}

function LeaderboardUserCard({ user, currentUserId, category, index }: LeaderboardUserCardProps) {
  const isCurrentUser = user.id === currentUserId;
  const rankChange = LeaderboardUtils.calculateRankChange(user.rank, user.previousRank);

  const getRankChangeIcon = () => {
    if (rankChange > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (rankChange < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getValueForCategory = () => {
    switch (category.sortBy) {
      case 'xpTotal': return LeaderboardUtils.formatXP(user.xpTotal);
      case 'xpWeekly': return LeaderboardUtils.formatXP(user.xpWeekly);
      case 'xpDaily': return LeaderboardUtils.formatXP(user.xpDaily);
      case 'currentStreak': return `${user.currentStreak} days`;
      case 'completionRate': return `${user.completionRate}%`;
      case 'contributionScore': return user.contributionScore.toString();
      default: return user.xpTotal.toString();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02]',
        isCurrentUser 
          ? 'bg-blue-500/20 border-blue-400/50 ring-2 ring-blue-400/30' 
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      )}
    >
      <div className="flex items-center space-x-4">
        {/* Rank */}
        <div className="flex flex-col items-center">
          <div className={cn('text-2xl font-bold', LeaderboardUtils.getRankColor(user.rank))}>
            {LeaderboardUtils.getRankIcon(user.rank)}
          </div>
          {rankChange !== 0 && (
            <div className="flex items-center space-x-1 text-xs">
              {getRankChangeIcon()}
              <span className={cn(
                'font-medium',
                rankChange > 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {Math.abs(rankChange)}
              </span>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          {user.currentStreak > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <Flame className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-white">{user.name}</h3>
            {isCurrentUser && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">You</span>
            )}
            <span className="text-xs text-gray-400 capitalize">{user.role}</span>
          </div>
          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
            <span>{getValueForCategory()}</span>
            <span>•</span>
            <span>{user.lessonsCompleted} lessons</span>
            {user.currentStreak > 0 && (
              <>
                <span>•</span>
                <span className={LeaderboardUtils.getStreakColor(user.currentStreak)}>
                  {user.currentStreak} day streak
                </span>
              </>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center space-x-1">
          {user.badges.slice(0, 3).map((badge) => (
            <div
              key={badge.id}
              className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center"
              title={badge.name}
            >
              <span className="text-xs">{badge.icon}</span>
            </div>
          ))}
          {user.badges.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-500/20 flex items-center justify-center">
              <span className="text-xs text-gray-400">+{user.badges.length - 3}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function Leaderboards({ className }: LeaderboardsProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<LeaderboardCategory[]>([]);
  const [currentCategory, setCurrentCategory] = useState<LeaderboardCategory | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [filters, setFilters] = useState<LeaderboardFilters>(leaderboardManager.getDefaultFilters());
  const [loading, setLoading] = useState<LoadingState>({
    leaderboards: true,
    statistics: false,
    export: false,
    refresh: false
  });
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    loadCategories();
    setupRealTimeUpdates();
  }, []);

  // Load leaderboard when filters change
  useEffect(() => {
    if (currentCategory) {
      loadLeaderboard(true);
    }
  }, [filters, currentCategory]);

  // Setup infinite scroll
  useEffect(() => {
    if (loadMoreRef.current && hasNextPage && !loading.leaderboards) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMoreUsers();
          }
        },
        { threshold: 0.1 }
      );
      
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPage, loading.leaderboards]);

  const loadCategories = async () => {
    try {
      const categoriesData = await leaderboardManager.getLeaderboardCategories();
      setCategories(categoriesData);
      
      if (categoriesData.length > 0) {
        const defaultCategory = categoriesData.find(c => c.id === filters.category) || categoriesData[0];
        setCurrentCategory(defaultCategory);
        setFilters(prev => ({ ...prev, category: defaultCategory.id }));
      }
    } catch (error) {
      logger.error('Failed to load categories:', {}, error as Error);
      // Use default categories as fallback
      const defaultCategories = leaderboardManager.getDefaultCategories();
      setCategories(defaultCategories);
      setCurrentCategory(defaultCategories[0]);
    }
  };

  const loadLeaderboard = async (reset: boolean = false) => {
    if (!currentCategory) return;

    setLoading(prev => ({ ...prev, leaderboards: true }));
    
    try {
      const currentPage = reset ? 1 : page;
      const data = await leaderboardManager.getLeaderboard(
        currentCategory.id,
        filters,
        currentPage,
        50
      );

      if (reset) {
        setLeaderboardData(data);
        setPage(1);
      } else {
        setLeaderboardData(prev => prev ? {
          ...data,
          users: [...prev.users, ...data.users]
        } : data);
      }
      
      setHasNextPage(data.hasNextPage);
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      logger.error('Failed to load leaderboard:', {}, error as Error);
    } finally {
      setLoading(prev => ({ ...prev, leaderboards: false }));
    }
  };

  const loadMoreUsers = async () => {
    if (!hasNextPage || loading.leaderboards) return;
    
    setPage(prev => prev + 1);
    await loadLeaderboard(false);
  };

  const setupRealTimeUpdates = () => {
    const unsubscribe = leaderboardManager.subscribeToUpdates((event) => {
      // Refresh leaderboard when relevant updates occur
      if (currentCategory && shouldRefreshForEvent(event)) {
        loadLeaderboard(true);
      }
    });

    return unsubscribe;
  };

  const shouldRefreshForEvent = (event: any): boolean => {
    // Determine if this event should trigger a leaderboard refresh
    return event.type === 'xp_gained' || 
           event.type === 'lesson_completed' || 
           event.type === 'achievement_unlocked';
  };

  const handleRefresh = async () => {
    if (!currentCategory) return;
    
    setLoading(prev => ({ ...prev, refresh: true }));
    
    try {
      await leaderboardManager.refreshLeaderboard(currentCategory.id, filters);
      await loadLeaderboard(true);
    } catch (error) {
      logger.error('Failed to refresh leaderboard:', {}, error as Error);
    } finally {
      setLoading(prev => ({ ...prev, refresh: false }));
    }
  };

  const handleFiltersChange = (newFilters: LeaderboardFilters) => {
    setFilters(newFilters);
    
    // Update current category if category filter changed
    if (newFilters.category !== filters.category) {
      const newCategory = categories.find(c => c.id === newFilters.category);
      if (newCategory) {
        setCurrentCategory(newCategory);
      }
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Leaderboards</h1>
          <p className="text-gray-400 mt-1">
            Compete with the community and track your progress
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
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
      <LeaderboardFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        categories={categories}
        isLoading={loading.leaderboards}
      />

      {/* Category Tabs */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-1 overflow-x-auto">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleFiltersChange({ ...filters, category: category.id })}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
              currentCategory?.id === category.id
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            )}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 overflow-hidden">
        {loading.leaderboards && !leaderboardData ? (
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-600 animate-pulse rounded" />
                  <div className="w-12 h-12 bg-gray-600 animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="w-1/3 h-4 bg-gray-600 animate-pulse rounded" />
                    <div className="w-1/2 h-3 bg-gray-600 animate-pulse rounded" />
                  </div>
                  <div className="w-20 h-6 bg-gray-600 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : leaderboardData && leaderboardData.users.length > 0 ? (
          <div className="p-6">
            <div className="space-y-3">
              {leaderboardData.users.map((leaderboardUser, index) => (
                <LeaderboardUserCard
                  key={leaderboardUser.id}
                  user={leaderboardUser}
                  currentUserId={user?.id}
                  category={currentCategory!}
                  index={index}
                />
              ))}
            </div>
            
            {/* Load More Trigger */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="mt-6 text-center">
                {loading.leaderboards ? (
                  <div className="flex items-center justify-center space-x-2 text-gray-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading more users...</span>
                  </div>
                ) : (
                  <Button
                    onClick={loadMoreUsers}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Load More
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
            <p className="text-gray-400">
              No users match the current filters. Try adjusting your search criteria.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
