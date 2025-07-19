// Achievement system types and interfaces

export type AchievementStatus = 'locked' | 'in_progress' | 'unlocked' | 'featured';
export type AchievementCategory = 'learning' | 'social' | 'milestone' | 'special' | 'streak';
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AchievementRequirement {
  type: 'lesson_complete' | 'quiz_score' | 'project_submit' | 'streak_days' | 'xp_earned' | 'time_spent' | 'social_action';
  target: number;
  current: number;
  metadata?: Record<string, any>;
}

export interface AchievementReward {
  xp: number;
  badge?: string;
  title?: string;
  unlocks?: string[]; // IDs of content/features unlocked
  special?: {
    type: 'avatar' | 'theme' | 'feature';
    value: string;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  image?: string;
  requirements: AchievementRequirement[];
  rewards: AchievementReward;
  prerequisites?: string[]; // Achievement IDs that must be unlocked first
  hidden?: boolean; // Hidden until prerequisites are met
  deprecated?: boolean; // No longer obtainable
  releaseDate?: Date;
  expiryDate?: Date; // For limited-time achievements
}

export interface UserAchievement {
  achievementId: string;
  status: AchievementStatus;
  progress: number; // 0-100 percentage
  unlockedAt?: Date;
  notificationShown?: boolean;
  metadata?: Record<string, any>;
}

export interface AchievementProgress {
  userId: string;
  achievements: Record<string, UserAchievement>;
  totalXP: number;
  level: number;
  badges: string[];
  streaks: {
    current: number;
    longest: number;
    lastActivity: Date;
  };
  statistics: {
    totalUnlocked: number;
    byCategory: Record<AchievementCategory, number>;
    byRarity: Record<AchievementRarity, number>;
    completionRate: number;
  };
  lastUpdated: Date;
}

export interface AchievementNotification {
  id: string;
  achievementId: string;
  type: 'unlock' | 'progress' | 'milestone';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  celebrated?: boolean; // Whether unlock animation was shown
  rewards?: AchievementReward;
}

export interface AchievementEvent {
  type: 'lesson_complete' | 'quiz_complete' | 'project_submit' | 'login' | 'streak_update' | 'xp_gain';
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface AchievementFilter {
  status?: AchievementStatus[];
  category?: AchievementCategory[];
  rarity?: AchievementRarity[];
  search?: string;
  sortBy?: 'title' | 'rarity' | 'progress' | 'unlocked_date' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export interface AchievementStats {
  totalAchievements: number;
  unlockedCount: number;
  inProgressCount: number;
  lockedCount: number;
  completionPercentage: number;
  totalXPEarned: number;
  currentLevel: number;
  nextLevelXP: number;
  badgeCount: number;
  currentStreak: number;
  longestStreak: number;
  recentUnlocks: UserAchievement[];
}

// Achievement configuration
export interface AchievementConfig {
  enableNotifications: boolean;
  enableSounds: boolean;
  enableAnimations: boolean;
  notificationDuration: number;
  celebrationDuration: number;
  autoSave: boolean;
  syncInterval: number;
}

// Level progression system
export interface LevelInfo {
  level: number;
  xpRequired: number;
  xpTotal: number;
  title: string;
  description: string;
  rewards?: AchievementReward;
  unlocks?: string[];
}

// Leaderboard types
export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  totalXP: number;
  achievementCount: number;
  rank: number;
  badges: string[];
}

export interface Leaderboard {
  type: 'xp' | 'achievements' | 'streak' | 'weekly' | 'monthly';
  entries: LeaderboardEntry[];
  userRank?: number;
  lastUpdated: Date;
  timeframe?: {
    start: Date;
    end: Date;
  };
}

// Achievement validation and checking
export interface AchievementChecker {
  checkAchievement(achievement: Achievement, userProgress: AchievementProgress, event?: AchievementEvent): boolean;
  calculateProgress(achievement: Achievement, userProgress: AchievementProgress): number;
  getNextMilestone(achievement: Achievement, userProgress: AchievementProgress): AchievementRequirement | null;
}

// Achievement manager interface
export interface AchievementManager {
  // Core functionality
  loadUserProgress(userId: string): Promise<AchievementProgress>;
  saveUserProgress(progress: AchievementProgress): Promise<void>;
  processEvent(event: AchievementEvent): Promise<AchievementNotification[]>;
  
  // Achievement queries
  getAllAchievements(): Achievement[];
  getAchievement(id: string): Achievement | null;
  getUserAchievements(userId: string, filter?: AchievementFilter): Promise<UserAchievement[]>;
  getAchievementStats(userId: string): Promise<AchievementStats>;
  
  // Progress tracking
  updateProgress(userId: string, achievementId: string, progress: Partial<UserAchievement>): Promise<void>;
  unlockAchievement(userId: string, achievementId: string): Promise<AchievementNotification>;
  
  // Notifications
  getNotifications(userId: string, unreadOnly?: boolean): Promise<AchievementNotification[]>;
  markNotificationRead(userId: string, notificationId: string): Promise<void>;
  
  // Leaderboards
  getLeaderboard(type: Leaderboard['type'], limit?: number): Promise<Leaderboard>;
  getUserRank(userId: string, type: Leaderboard['type']): Promise<number>;
}

// Utility types
export type AchievementEventHandler = (event: AchievementEvent) => Promise<void>;
export type AchievementUnlockHandler = (achievement: Achievement, notification: AchievementNotification) => Promise<void>;
export type ProgressUpdateHandler = (userId: string, achievementId: string, oldProgress: number, newProgress: number) => void;
