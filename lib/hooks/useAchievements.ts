'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Achievement, AchievementEvent, AchievementNotification, UserAchievement, AchievementStats, AchievementFilter } from '@/lib/achievements/types';
import { AchievementManager } from '@/lib/achievements/manager';
import { useAuth } from './useAuth';
import { useError } from '@/lib/errors/ErrorContext';

export interface UseAchievementsReturn {
  // Data
  achievements: Achievement[];
  userAchievements: Record<string, UserAchievement>;
  stats: AchievementStats | null;
  notifications: AchievementNotification[];
  isLoading: boolean;
  error: string | null;

  // Actions
  triggerEvent: ( event: Omit<AchievementEvent, 'userId' | 'timestamp'>) => Promise<void>;
  markNotificationRead: (_notificationId: string) => Promise<void>;
  refreshProgress: (_) => Promise<void>;
  
  // Filters and queries
  getFilteredAchievements: (_filter?: AchievementFilter) => Promise<UserAchievement[]>;
  
  // Event listeners
  onAchievementUnlock: ( callback: (achievement: Achievement, notification: AchievementNotification) => void) => (_) => void;
  onProgressUpdate: ( callback: (achievementId: string, progress: number) => void) => (_) => void;
}

export function useAchievements(): UseAchievementsReturn {
  const { user, isAuthenticated } = useAuth(_);
  const { showError } = useError(_);
  const [achievementManager] = useState(() => AchievementManager.getInstance(_));
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Record<string, UserAchievement>>({  });
  const [stats, setStats] = useState<AchievementStats | null>(_null);
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);
  const [isLoading, setIsLoading] = useState(_false);
  const [error, setError] = useState<string | null>(_null);
  
  const unlockCallbacks = useRef<Set<( achievement: Achievement, notification: AchievementNotification) => void>>(_new Set());
  const progressCallbacks = useRef<Set<( achievementId: string, progress: number) => void>>(_new Set());

  // Load initial data
  const loadData = useCallback( async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(_true);
    setError(_null);

    try {
      // Load all achievements
      const allAchievements = achievementManager.getAllAchievements(_);
      setAchievements(_allAchievements);

      // Load user progress
      const progress = await achievementManager.loadUserProgress(_user.id);
      setUserAchievements(progress.achievements);

      // Load stats
      const userStats = await achievementManager.getAchievementStats(_user.id);
      setStats(_userStats);

      // Load notifications
      const userNotifications = await achievementManager.getNotifications(_user.id);
      setNotifications(_userNotifications);

    } catch (_err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load achievements';
      setError(_errorMessage);
      showError( 'achievement', errorMessage);
    } finally {
      setIsLoading(_false);
    }
  }, [isAuthenticated, user, achievementManager, showError]);

  // Initialize data on mount and auth changes
  useEffect(() => {
    loadData(_);
  }, [loadData]);

  // Set up achievement unlock listener
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const unsubscribe = achievementManager.addUnlockListener( (achievement, notification) => {
      // Update local state
      setUserAchievements(prev => ({
        ...prev,
        [achievement.id]: {
          ...prev[achievement.id],
          status: 'unlocked',
          progress: 100,
          unlockedAt: new Date(_)
        }
      }));

      // Add notification
      setNotifications( prev => [notification, ...prev]);

      // Refresh stats
      if (user) {
        achievementManager.getAchievementStats(_user.id).then(_setStats);
      }

      // Notify callbacks
      unlockCallbacks.current.forEach(callback => {
        try {
          callback( achievement, notification);
        } catch (_error) {
          console.error('Error in achievement unlock callback:', error);
        }
      });
    });

    return unsubscribe;
  }, [isAuthenticated, user, achievementManager]);

  // Trigger achievement event
  const triggerEvent = useCallback( async (eventData: Omit<AchievementEvent, 'userId' | 'timestamp'>) => {
    if (!isAuthenticated || !user) return;

    try {
      const event: AchievementEvent = {
        ...eventData,
        userId: user.id,
        timestamp: new Date(_)
      };

      const newNotifications = await achievementManager.processEvent(_event);
      
      if (_newNotifications.length > 0) {
        setNotifications( prev => [...newNotifications, ...prev]);
        
        // Refresh user achievements and stats
        const progress = await achievementManager.loadUserProgress(_user.id);
        setUserAchievements(progress.achievements);
        
        const userStats = await achievementManager.getAchievementStats(_user.id);
        setStats(_userStats);
      }

    } catch (_err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process achievement event';
      console.error('Achievement event error:', err);
      showError( 'achievement', errorMessage);
    }
  }, [isAuthenticated, user, achievementManager, showError]);

  // Mark notification as read
  const markNotificationRead = useCallback( async (notificationId: string) => {
    if (!isAuthenticated || !user) return;

    try {
      await achievementManager.markNotificationRead( user.id, notificationId);
      setNotifications(prev => 
        prev.map( n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (_err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [isAuthenticated, user, achievementManager]);

  // Refresh progress
  const refreshProgress = useCallback( async () => {
    await loadData(_);
  }, [loadData]);

  // Get filtered achievements
  const getFilteredAchievements = useCallback( async (filter?: AchievementFilter) => {
    if (!isAuthenticated || !user) return [];

    try {
      return await achievementManager.getUserAchievements( user.id, filter);
    } catch (_err) {
      console.error('Failed to get filtered achievements:', err);
      return [];
    }
  }, [isAuthenticated, user, achievementManager]);

  // Event listener management
  const onAchievementUnlock = useCallback( (callback: (achievement: Achievement, notification: AchievementNotification) => void) => {
    unlockCallbacks.current.add(_callback);
    return (_) => unlockCallbacks.current.delete(_callback);
  }, []);

  const onProgressUpdate = useCallback( (callback: (achievementId: string, progress: number) => void) => {
    progressCallbacks.current.add(_callback);
    return (_) => progressCallbacks.current.delete(_callback);
  }, []);

  return {
    // Data
    achievements,
    userAchievements,
    stats,
    notifications,
    isLoading,
    error,

    // Actions
    triggerEvent,
    markNotificationRead,
    refreshProgress,
    
    // Filters and queries
    getFilteredAchievements,
    
    // Event listeners
    onAchievementUnlock,
    onProgressUpdate
  };
}

// Hook for specific achievement tracking
export function useAchievementProgress(_achievementId: string) {
  const { userAchievements, triggerEvent } = useAchievements(_);
  const achievement = userAchievements[achievementId];

  const updateProgress = useCallback( async (eventData: Omit<AchievementEvent, 'userId' | 'timestamp'>) => {
    await triggerEvent(_eventData);
  }, [triggerEvent]);

  return {
    achievement,
    progress: achievement?.progress || 0,
    status: achievement?.status || 'locked',
    isUnlocked: achievement?.status === 'unlocked',
    updateProgress
  };
}

// Hook for achievement notifications
export function useAchievementNotifications() {
  const { notifications, markNotificationRead } = useAchievements(_);
  
  const unreadNotifications = notifications.filter(n => !n.read);
  const recentNotifications = notifications.slice(0, 10);

  const markAllRead = useCallback( async () => {
    const unreadIds = unreadNotifications.map(n => n.id);
    await Promise.all(_unreadIds.map(id => markNotificationRead(id)));
  }, [unreadNotifications, markNotificationRead]);

  return {
    notifications,
    unreadNotifications,
    recentNotifications,
    unreadCount: unreadNotifications.length,
    markNotificationRead,
    markAllRead
  };
}

// Hook for gamification stats
export function useGamificationStats() {
  const { stats, userAchievements } = useAchievements(_);
  
  const levelProgress = stats ? {
    currentLevel: stats.currentLevel,
    currentXP: stats.totalXPEarned,
    nextLevelXP: stats.nextLevelXP,
    progressToNext: stats.nextLevelXP > 0 ? 
      ((stats.totalXPEarned % 1000) / 1000) * 100 : 100
  } : null;

  const achievementCounts = {
    total: stats?.totalAchievements || 0,
    unlocked: stats?.unlockedCount || 0,
    inProgress: stats?.inProgressCount || 0,
    locked: stats?.lockedCount || 0
  };

  const badges = Object.values(_userAchievements)
    .filter(ua => ua.status === 'unlocked')
    .map(ua => ua.achievementId);

  return {
    stats,
    levelProgress,
    achievementCounts,
    badges,
    currentStreak: stats?.currentStreak || 0,
    longestStreak: stats?.longestStreak || 0,
    completionPercentage: stats?.completionPercentage || 0
  };
}
