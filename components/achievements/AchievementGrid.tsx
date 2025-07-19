'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid, 
  List,
  Trophy,
  Target,
  Lock
} from 'lucide-react';
import { Achievement, UserAchievement, AchievementFilter, AchievementStatus, AchievementCategory, AchievementRarity } from '@/lib/achievements/types';
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_RARITIES } from '@/lib/achievements/data';
import { AchievementCard } from './AchievementCard';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { cn } from '@/lib/utils';

interface AchievementGridProps {
  achievements: Achievement[];
  userAchievements: Record<string, UserAchievement>;
  onAchievementClick?: (achievement: Achievement) => void;
  className?: string;
}

export function AchievementGrid({ 
  achievements, 
  userAchievements, 
  onAchievementClick,
  className 
}: AchievementGridProps) {
  const [filter, setFilter] = useState<AchievementFilter>({
    sortBy: 'rarity',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    const filtered = achievements.filter(achievement => {
      const userAchievement = userAchievements[achievement.id];
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!achievement.title.toLowerCase().includes(searchLower) &&
            !achievement.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filter.status && filter.status.length > 0) {
        if (!filter.status.includes(userAchievement?.status || 'locked')) {
          return false;
        }
      }

      // Category filter
      if (filter.category && filter.category.length > 0) {
        if (!filter.category.includes(achievement.category)) {
          return false;
        }
      }

      // Rarity filter
      if (filter.rarity && filter.rarity.length > 0) {
        if (!filter.rarity.includes(achievement.rarity)) {
          return false;
        }
      }

      return true;
    });

    // Sort achievements
    filtered.sort((a, b) => {
      const userA = userAchievements[a.id];
      const userB = userAchievements[b.id];
      let comparison = 0;

      switch (filter.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'rarity':
          const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
          comparison = rarityOrder[a.rarity] - rarityOrder[b.rarity];
          break;
        case 'progress':
          comparison = (userA?.progress || 0) - (userB?.progress || 0);
          break;
        case 'unlocked_date':
          const dateA = userA?.unlockedAt?.getTime() || 0;
          const dateB = userB?.unlockedAt?.getTime() || 0;
          comparison = dateA - dateB;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }

      return filter.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [achievements, userAchievements, filter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = achievements.filter(a => userAchievements[a.id]?.status === 'unlocked').length;
    const inProgress = achievements.filter(a => userAchievements[a.id]?.status === 'in_progress').length;
    const locked = total - unlocked - inProgress;

    return { total, unlocked, inProgress, locked, completion: (unlocked / total) * 100 };
  }, [achievements, userAchievements]);

  const toggleFilter = (type: keyof AchievementFilter, value: AchievementStatus | AchievementCategory | AchievementRarity | string) => {
    setFilter(prev => {
      const currentValues = prev[type] as (AchievementStatus | AchievementCategory | AchievementRarity | string)[] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return { ...prev, [type]: newValues.length > 0 ? newValues : undefined };
    });
  };

  const clearFilters = () => {
    setFilter({ sortBy: 'rarity', sortOrder: 'desc' });
    setSearchTerm('');
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Achievements</h2>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-300">{stats.unlocked} Unlocked</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">{stats.inProgress} In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">{stats.locked} Locked</span>
            </div>
            <div className="text-gray-400">
              {Math.round(stats.completion)}% Complete
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <EnhancedButton
            onClick={() => setViewMode('grid')}
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className="p-2"
            touchTarget
          >
            <Grid className="w-4 h-4" />
          </EnhancedButton>
          <EnhancedButton
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="p-2"
            touchTarget
          >
            <List className="w-4 h-4" />
          </EnhancedButton>
        </div>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Filter Toggle */}
          <EnhancedButton
            onClick={() => setShowFilters(!showFilters)}
            variant="ghost"
            className="text-white"
            touchTarget
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </EnhancedButton>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value as 'title' | 'rarity' | 'progress' | 'unlocked_date' | 'category' }))}
              className="bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="rarity">Rarity</option>
              <option value="title">Title</option>
              <option value="progress">Progress</option>
              <option value="unlocked_date">Unlock Date</option>
              <option value="category">Category</option>
            </select>
            
            <EnhancedButton
              onClick={() => setFilter(prev => ({ 
                ...prev, 
                sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
              }))}
              variant="ghost"
              size="sm"
              className="p-2"
              touchTarget
            >
              {filter.sortOrder === 'asc' ? 
                <SortAsc className="w-4 h-4" /> : 
                <SortDesc className="w-4 h-4" />
              }
            </EnhancedButton>
          </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-white/10 mt-4 space-y-4">
                {/* Status Filters */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {(['unlocked', 'in_progress', 'locked'] as AchievementStatus[]).map(status => (
                      <EnhancedButton
                        key={status}
                        onClick={() => toggleFilter('status', status)}
                        variant={filter.status?.includes(status) ? 'default' : 'ghost'}
                        size="sm"
                        className="text-xs"
                        touchTarget
                      >
                        {status.replace('_', ' ')}
                      </EnhancedButton>
                    ))}
                  </div>
                </div>

                {/* Category Filters */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, category]) => (
                      <EnhancedButton
                        key={key}
                        onClick={() => toggleFilter('category', key as AchievementCategory)}
                        variant={filter.category?.includes(key as AchievementCategory) ? 'default' : 'ghost'}
                        size="sm"
                        className="text-xs"
                        touchTarget
                      >
                        {category.icon} {category.name}
                      </EnhancedButton>
                    ))}
                  </div>
                </div>

                {/* Rarity Filters */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Rarity</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ACHIEVEMENT_RARITIES).map(([key, rarity]) => (
                      <EnhancedButton
                        key={key}
                        onClick={() => toggleFilter('rarity', key as AchievementRarity)}
                        variant={filter.rarity?.includes(key as AchievementRarity) ? 'default' : 'ghost'}
                        size="sm"
                        className={cn('text-xs', rarity.textColor)}
                        touchTarget
                      >
                        {rarity.name}
                      </EnhancedButton>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex justify-end">
                  <EnhancedButton
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    touchTarget
                  >
                    Clear All Filters
                  </EnhancedButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Achievement Grid/List */}
      <div className={cn(
        'grid gap-6',
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'grid-cols-1'
      )}>
        <AnimatePresence mode="popLayout">
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <AchievementCard
                achievement={achievement}
                userAchievement={userAchievements[achievement.id] || {
                  achievementId: achievement.id,
                  status: 'locked',
                  progress: 0
                }}
                onClick={() => onAchievementClick?.(achievement)}
                showDetails={viewMode === 'grid'}
                className={viewMode === 'list' ? 'w-full' : ''}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* No Results */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">No achievements found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
          <EnhancedButton
            onClick={clearFilters}
            variant="ghost"
            className="text-blue-400 hover:text-blue-300"
            touchTarget
          >
            Clear Filters
          </EnhancedButton>
        </div>
      )}
    </div>
  );
}
