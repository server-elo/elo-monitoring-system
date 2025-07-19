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
  triggerEvent: (event: Omit<AchievementEvent, 'userId' | 'timestamp'>) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  refreshProgress: () => Promise<void>;
  
  // Filters and queries
  getFilteredAchievements: (filter?: AchievementFilter) => Promise<UserAchievement[]>;
  
  // Event listeners
  onAchievementUnlock: (callback: (achievement: Achievement, notification: AchievementNotification) => void) => () => void;
  onProgressUpdate: (callback: (achievementId: string, progress: number) => void) => () => void;
}

export function useAchievements(): UseAchievementsReturn {
  const { user, isAuthenticated } = useAuth();
  const { showError } = useError();
  const [achievementManager] = useState(() => AchievementManager.getInstance());
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Record<string, UserAchievement>>({});
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const unlockCallbacks = useRef<Set<(achievement: Achievement, notification: AchievementNotification) => void>>(new Set());
  const progressCallbacks = useRef<Set<(achievementId: string, progress: number) => void>>(new Set());

  // Load initial data
  const loadData = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load all achievements
      const allAchievements = achievementManager.getAllAchievements();
      setAchievements(allAchievements);

      // Load user progress
      const progress = await achievementManager.loadUserProgress(user.id);
      setUserAchievements(progress.achievements);

      // Load stats
      const userStats = await achievementManager.getAchievementStats(user.id);
      setStats(userStats);

      // Load notifications
      const userNotifications = await achievementManager.getNotifications(user.id);
      setNotifications(userNotifications);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load achievements';
      setError(errorMessage);
      showError('achievement', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, achievementManager, showError]);

  // Initialize data on mount and auth changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up achievement unlock listener
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const unsubscribe = achievementManager.addUnlockListener((achievement, notification) => {
      // Update local state
      setUserAchievements(prev => ({
        ...prev,
        [achievement.id]: {
          ...prev[achievement.id],
          status: 'unlocked',
          progress: 100,
          unlockedAt: new Date()
        }
      }));

      // Add notification
      setNotifications(prev => [notification, ...prev]);

      // Refresh stats
      if (user) {
        achievementManager.getAchievementStats(user.id).then(setStats);
      }

      // Notify callbacks
      unlockCallbacks.current.forEach(callback => {
        try {
          callback(achievement, notification);
        } catch (error) {
          console.error('Error in achievement unlock callback:', error);
        }
      });
    });

    return unsubscribe;
  }, [isAuthenticated, user, achievementManager]);

  // Trigger achievement event
  const triggerEvent = useCallback(async (eventData: Omit<AchievementEvent, 'userId' | 'timestamp'>) => {
    if (!isAuthenticated || !user) return;

    try {
      const event: AchievementEvent = {
        ...eventData,
        userId: user.id,
        timestamp: new Date()
      };

      const newNotifications = await achievementManager.processEvent(event);
      
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
        
        // Refresh user achievements and stats
        const progress = await achievementManager.loadUserProgress(user.id);
        setUserAchievements(progress.achievements);
        
        const userStats = await achievementManager.getAchievementStats(user.id);
        setStats(userStats);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process achievement event';
      console.error('Achievement event error:', err);
      showError('achievement', errorMessage);
    }
  }, [isAuthenticated, user, achievementManager, showError]);

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: string) => {
    if (!isAuthenticated || !user) return;

    try {
      await achievementManager.markNotificationRead(user.id, notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [isAuthenticated, user, achievementManager]);

  // Refresh progress
  const refreshProgress = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Get filtered achievements
  const getFilteredAchievements = useCallback(async (filter?: AchievementFilter) => {
    if (!isAuthenticated || !user) return [];

    try {
      return await achievementManager.getUserAchievements(user.id, filter);
    } catch (err) {
      console.error('Failed to get filtered achievements:', err);
      return [];
    }
  }, [isAuthenticated, user, achievementManager]);

  // Event listener management
  const onAchievementUnlock = useCallback((callback: (achievement: Achievement, notification: AchievementNotification) => void) => {
    unlockCallbacks.current.add(callback);
    return () => unlockCallbacks.current.delete(callback);
  }, []);

  const onProgressUpdate = useCallback((callback: (achievementId: string, progress: number) => void) => {
    progressCallbacks.current.add(callback);
    return () => progressCallbacks.current.delete(callback);
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
export function useAchievementProgress(achievementId: string) {
  const { userAchievements, triggerEvent } = useAchievements();
  const achievement = userAchievements[achievementId];

  const updateProgress = useCallback(async (eventData: Omit<AchievementEvent, 'userId' | 'timestamp'>) => {
    await triggerEvent(eventData);
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
  const { notifications, markNotificationRead } = useAchievements();
  
  const unreadNotifications = notifications.filter(n => !n.read);
  const recentNotifications = notifications.slice(0, 10);

  const markAllRead = useCallback(async () => {
    const unreadIds = unreadNotifications.map(n => n.id);
    await Promise.all(unreadIds.map(id => markNotificationRead(id)));
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
  const { stats, userAchievements } = useAchievements();
  
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

  const badges = Object.values(userAchievements)
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
