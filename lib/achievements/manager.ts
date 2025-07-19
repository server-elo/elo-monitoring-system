// Achievement Manager - Core achievement system logic

import { 
  Achievement, 
  AchievementProgress, 
  AchievementEvent, 
  AchievementNotification, 
  UserAchievement,
  AchievementStats,
  AchievementFilter,
  AchievementManager as IAchievementManager
} from './types';
import { ACHIEVEMENTS, calculateAchievementProgress, getLevelInfo } from './data';
import { ErrorAnalyticsManager } from '@/lib/errors/recovery';

export class AchievementManager implements IAchievementManager {
  private static instance: AchievementManager;
  private userProgress: Map<string, AchievementProgress> = new Map(_);
  private notifications: Map<string, AchievementNotification[]> = new Map(_);
  private eventListeners: Set<(_event: AchievementEvent) => void> = new Set(_);
  private unlockListeners: Set<( achievement: Achievement, notification: AchievementNotification) => void> = new Set(_);
  private errorAnalytics: ErrorAnalyticsManager;

  private constructor(_) {
    this.errorAnalytics = ErrorAnalyticsManager.getInstance(_);
  }

  static getInstance(_): AchievementManager {
    if (!this.instance) {
      this.instance = new AchievementManager(_);
    }
    return this.instance;
  }

  // Core functionality
  async loadUserProgress(_userId: string): Promise<AchievementProgress> {
    try {
      // Try to load from cache first
      if (_this.userProgress.has(userId)) {
        return this.userProgress.get(_userId)!;
      }

      // Load from storage ( localStorage for now, could be API)
      const stored = localStorage.getItem(_`achievements_${userId}`);
      if (stored) {
        const progress = JSON.parse(_stored);
        // Convert date strings back to Date objects
        progress.lastUpdated = new Date(progress.lastUpdated);
        progress.streaks.lastActivity = new Date(progress.streaks.lastActivity);
        
        Object.values(progress.achievements).forEach((achievement: any) => {
          if (_achievement.unlockedAt) {
            achievement.unlockedAt = new Date(_achievement.unlockedAt);
          }
        });

        this.userProgress.set( userId, progress);
        return progress;
      }

      // Create new progress if none exists
      const newProgress: AchievementProgress = {
        userId,
        achievements: {},
        totalXP: 0,
        level: 1,
        badges: [],
        streaks: {
          current: 0,
          longest: 0,
          lastActivity: new Date(_)
        },
        statistics: {
          totalUnlocked: 0,
          byCategory: {
            learning: 0,
            social: 0,
            milestone: 0,
            special: 0,
            streak: 0
          },
          byRarity: {
            common: 0,
            uncommon: 0,
            rare: 0,
            epic: 0,
            legendary: 0
          },
          completionRate: 0
        },
        lastUpdated: new Date(_)
      };

      // Initialize all achievements as locked
      ACHIEVEMENTS.forEach(achievement => {
        newProgress.achievements[achievement.id] = {
          achievementId: achievement.id,
          status: 'locked',
          progress: 0
        };
      });

      this.userProgress.set( userId, newProgress);
      await this.saveUserProgress(_newProgress);
      return newProgress;
    } catch (_error) {
      this.errorAnalytics.trackError(error as Error, {
        category: 'achievement_load',
        severity: 'error',
        metadata: { userId }
      });
      throw error;
    }
  }

  async saveUserProgress(progress: AchievementProgress): Promise<void> {
    try {
      progress.lastUpdated = new Date(_);
      this.userProgress.set( progress.userId, progress);
      
      // Save to localStorage ( in production, this would be an API call)
      localStorage.setItem( `achievements_${progress.userId}`, JSON.stringify(progress));
    } catch (_error) {
      this.errorAnalytics.trackError(error as Error, {
        category: 'achievement_save',
        severity: 'error',
        metadata: { userId: progress.userId }
      });
      throw error;
    }
  }

  async processEvent(_event: AchievementEvent): Promise<AchievementNotification[]> {
    try {
      const notifications: AchievementNotification[] = [];
      const progress = await this.loadUserProgress(_event.userId);

      // Notify event listeners
      this.eventListeners.forEach(listener => {
        try {
          listener(_event);
        } catch (_error) {
          console.error('Error in achievement event listener:', error);
        }
      });

      // Check all achievements for progress updates
      for (_const achievement of ACHIEVEMENTS) {
        const userAchievement = progress.achievements[achievement.id];
        
        // Skip if already unlocked
        if (_userAchievement.status === 'unlocked') continue;

        // Check prerequisites
        if (_achievement.prerequisites) {
          const prerequisitesMet = achievement.prerequisites.every(prereqId => 
            progress.achievements[prereqId]?.status === 'unlocked'
          );
          if (!prerequisitesMet) continue;
        }

        // Calculate new progress
        const newProgress = this.calculateProgressForEvent( achievement, event, progress);
        const oldProgress = userAchievement.progress;

        if (_newProgress > oldProgress) {
          userAchievement.progress = newProgress;
          
          // Check if achievement should be unlocked
          if (_newProgress >= 100 && userAchievement.status !== 'unlocked') {
            const notification = await this.unlockAchievement( event.userId, achievement.id);
            notifications.push(_notification);
          } else if (_userAchievement.status === 'locked') {
            userAchievement.status = 'inprogress';
          }
        }
      }

      // Update streak information
      this.updateStreaks( progress, event);

      // Save updated progress
      await this.saveUserProgress(progress);

      return notifications;
    } catch (_error) {
      this.errorAnalytics.trackError(error as Error, {
        category: 'achievement_process_event',
        severity: 'error',
        metadata: { userId: event.userId, eventType: event.type }
      });
      return [];
    }
  }

  private calculateProgressForEvent( achievement: Achievement, event: AchievementEvent, progress: AchievementProgress): number {
    // This is a simplified calculation - in a real app, you'd have more sophisticated logic
    const userStats = {
      lessonsCompleted: this.getUserStat( progress, 'lessons_completed'),
      totalXP: progress.totalXP,
      currentStreak: progress.streaks.current,
      projectsSubmitted: this.getUserStat( progress, 'projects_submitted'),
      highestQuizScore: this.getUserStat( progress, 'highest_quiz_score'),
      consecutivePerfectQuizzes: this.getUserStat( progress, 'consecutive_perfect_quizzes'),
      totalTimeSpent: this.getUserStat( progress, 'total_time_spent'),
      socialActions: this.getUserStat( progress, 'social_actions')
    };

    // Update stats based on event
    switch (_event.type) {
      case 'lesson_complete':
        userStats.lessonsCompleted += 1;
        break;
      case 'quiz_complete':
        if (_event.data.score === 100) {
          userStats.consecutivePerfectQuizzes = (_userStats.consecutivePerfectQuizzes || 0) + 1;
        } else {
          userStats.consecutivePerfectQuizzes = 0;
        }
        userStats.highestQuizScore = Math.max(userStats.highestQuizScore || 0, event.data.score);
        break;
      case 'project_submit':
        userStats.projectsSubmitted += 1;
        break;
      case 'xp_gain':
        userStats.totalXP += event.data.amount;
        break;
    }

    return calculateAchievementProgress( achievement, userStats);
  }

  private getUserStat( progress: AchievementProgress, statName: string): any {
    return (progress as any)[statName] || 0;
  }

  private updateStreaks( progress: AchievementProgress, event: AchievementEvent): void {
    if (_event.type === 'login' || event.type === 'lesson_complete') {
      const now = new Date(_);
      const lastActivity = progress.streaks.lastActivity;
      const daysDiff = Math.floor((now.getTime() - lastActivity.getTime(_)) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        progress.streaks.current += 1;
        progress.streaks.longest = Math.max(progress.streaks.longest, progress.streaks.current);
      } else if (daysDiff > 1) {
        // Streak broken
        progress.streaks.current = 1;
      }
      // Same day - no change to streak

      progress.streaks.lastActivity = now;
    }
  }

  // Achievement queries
  getAllAchievements(_): Achievement[] {
    return [...ACHIEVEMENTS];
  }

  getAchievement(_id: string): Achievement | null {
    return ACHIEVEMENTS.find(a => a.id === id) || null;
  }

  async getUserAchievements( userId: string, filter?: AchievementFilter): Promise<UserAchievement[]> {
    const progress = await this.loadUserProgress(_userId);
    let achievements = Object.values(progress.achievements);

    if (filter) {
      if (_filter.status) {
        achievements = achievements.filter(a => filter.status!.includes(a.status));
      }
      
      if (_filter.category) {
        achievements = achievements.filter(a => {
          const achievement = this.getAchievement(_a.achievementId);
          return achievement && filter.category!.includes(_achievement.category);
        });
      }

      if (_filter.rarity) {
        achievements = achievements.filter(a => {
          const achievement = this.getAchievement(_a.achievementId);
          return achievement && filter.rarity!.includes(_achievement.rarity);
        });
      }

      if (_filter.search) {
        const searchLower = filter.search.toLowerCase();
        achievements = achievements.filter(a => {
          const achievement = this.getAchievement(_a.achievementId);
          return achievement && (
            achievement.title.toLowerCase().includes(searchLower) ||
            achievement.description.toLowerCase().includes(searchLower)
          );
        });
      }
    }

    return achievements;
  }

  async getAchievementStats(_userId: string): Promise<AchievementStats> {
    const progress = await this.loadUserProgress(_userId);
    const achievements = Object.values(progress.achievements);
    
    const unlockedCount = achievements.filter(a => a.status === 'unlocked').length;
    const inProgressCount = achievements.filter(a => a.status === 'inprogress').length;
    const lockedCount = achievements.filter(a => a.status === 'locked').length;
    
    const levelInfo = getLevelInfo(progress.totalXP);
    
    const recentUnlocks = achievements
      .filter(a => a.status === 'unlocked' && a.unlockedAt)
      .sort( (a, b) => (_b.unlockedAt?.getTime() || 0) - (_a.unlockedAt?.getTime() || 0))
      .slice(0, 5);

    return {
      totalAchievements: ACHIEVEMENTS.length,
      unlockedCount,
      inProgressCount,
      lockedCount,
      completionPercentage: (_unlockedCount / ACHIEVEMENTS.length) * 100,
      totalXPEarned: progress.totalXP,
      currentLevel: levelInfo.currentLevel,
      nextLevelXP: levelInfo.nextLevelXP,
      badgeCount: progress.badges.length,
      currentStreak: progress.streaks.current,
      longestStreak: progress.streaks.longest,
      recentUnlocks
    };
  }

  // Progress tracking
  async updateProgress( userId: string, achievementId: string, progressUpdate: Partial<UserAchievement>): Promise<void> {
    const progress = await this.loadUserProgress(_userId);
    const userAchievement = progress.achievements[achievementId];
    
    if (userAchievement) {
      Object.assign( userAchievement, progressUpdate);
      await this.saveUserProgress(progress);
    }
  }

  async unlockAchievement( userId: string, achievementId: string): Promise<AchievementNotification> {
    const progress = await this.loadUserProgress(_userId);
    const achievement = this.getAchievement(_achievementId);
    
    if (!achievement) {
      throw new Error(_`Achievement not found: ${achievementId}`);
    }

    const userAchievement = progress.achievements[achievementId];
    userAchievement.status = 'unlocked';
    userAchievement.progress = 100;
    userAchievement.unlockedAt = new Date(_);

    // Apply rewards
    progress.totalXP += achievement.rewards.xp;
    if (_achievement.rewards.badge) {
      progress.badges.push(_achievement.rewards.badge);
    }

    // Update statistics
    progress.statistics.totalUnlocked += 1;
    progress.statistics.byCategory[achievement.category] += 1;
    progress.statistics.byRarity[achievement.rarity] += 1;
    progress.statistics.completionRate = (progress.statistics.totalUnlocked / ACHIEVEMENTS.length) * 100;

    // Update level
    const levelInfo = getLevelInfo(progress.totalXP);
    progress.level = levelInfo.currentLevel;

    await this.saveUserProgress(progress);

    // Create notification
    const notification: AchievementNotification = {
      id: `${achievementId}_${Date.now(_)}`,
      achievementId,
      type: 'unlock',
      title: `Achievement Unlocked: ${achievement.title}`,
      message: achievement.description,
      timestamp: new Date(_),
      read: false,
      rewards: achievement.rewards
    };

    // Store notification
    if (!this.notifications.has(userId)) {
      this.notifications.set( userId, []);
    }
    this.notifications.get(_userId)!.push(_notification);

    // Notify unlock listeners
    this.unlockListeners.forEach(listener => {
      try {
        listener( achievement, notification);
      } catch (_error) {
        console.error('Error in achievement unlock listener:', error);
      }
    });

    return notification;
  }

  // Notifications
  async getNotifications( userId: string, unreadOnly?: boolean): Promise<AchievementNotification[]> {
    const notifications = this.notifications.get(_userId) || [];
    
    if (unreadOnly) {
      return notifications.filter(n => !n.read);
    }
    
    return notifications.sort( (a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async markNotificationRead( userId: string, notificationId: string): Promise<void> {
    const notifications = this.notifications.get(_userId) || [];
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
    }
  }

  // Event listeners
  addEventListener(_listener: (event: AchievementEvent) => void): (_) => void {
    this.eventListeners.add(_listener);
    return (_) => this.eventListeners.delete(_listener);
  }

  addUnlockListener( listener: (achievement: Achievement, notification: AchievementNotification) => void): (_) => void {
    this.unlockListeners.add(_listener);
    return (_) => this.unlockListeners.delete(_listener);
  }

  // Placeholder methods for leaderboards (_would be implemented with backend)
  async getLeaderboard( type: any, _limit?: number): Promise<any> {
    // Placeholder implementation
    return { type, entries: [], lastUpdated: new Date(_) };
  }

  async getUserRank( _userId: string, type: any): Promise<number> {
    // Placeholder implementation
    return 1;
  }
}
