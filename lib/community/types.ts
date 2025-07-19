export interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  xpTotal: number;
  xpWeekly: number;
  xpDaily: number;
  rank: number;
  previousRank?: number;
  lessonsCompleted: number;
  coursesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  recentAchievements: Achievement[];
  joinedAt: Date;
  lastActiveAt: Date;
  region?: string;
  role: 'student' | 'instructor' | 'admin';
  completionRate: number;
  averageScore: number;
  contributionScore: number;
  timeSpent: number; // in minutes
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  earnedAt: Date;
  category: 'learning' | 'streak' | 'completion' | 'community' | 'special';
}

export interface LeaderboardCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  sortBy: keyof LeaderboardUser;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time';
  enabled: boolean;
}

export interface LeaderboardFilters {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time';
  category: string;
  courseCategory?: string;
  userRole?: 'student' | 'instructor' | 'admin' | 'all';
  region?: string;
  minXP?: number;
  maxXP?: number;
  search?: string;
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  lastUpdated: Date;
  category: LeaderboardCategory;
  filters: LeaderboardFilters;
}

export interface CommunityStats {
  totalUsers: number;
  activeUsers: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  lessonsCompleted: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  averageCompletionTime: {
    daily: number; // in minutes
    weekly: number;
    monthly: number;
  };
  engagementMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionTime: number;
    bounceRate: number;
    retentionRate: number;
  };
  trendingTopics: TrendingTopic[];
  communityMilestones: CommunityMilestone[];
  recentAchievements: Achievement[];
  platformGrowth: {
    userGrowthRate: number;
    contentGrowthRate: number;
    engagementGrowthRate: number;
  };
  lastUpdated: Date;
}

export interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  mentions: number;
  engagement: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface CommunityMilestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  achievedAt: Date;
  value: number;
  type: 'users' | 'lessons' | 'xp' | 'achievements' | 'community';
}

export interface StatsFilters {
  startDate?: Date;
  endDate?: Date;
  userDemographics?: {
    ageRange?: [number, number];
    region?: string;
    role?: 'student' | 'instructor' | 'admin';
  };
  courseCategories?: string[];
  difficultyLevels?: ('beginner' | 'intermediate' | 'advanced')[];
  engagementTypes?: ('lessons' | 'quizzes' | 'projects' | 'community')[];
}

export interface ExportOptions {
  format: 'csv' | 'json';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeFields: string[];
  filters?: StatsFilters;
}

export interface RealTimeUpdate {
  type: 'leaderboard' | 'stats' | 'achievement' | 'milestone';
  data: any;
  timestamp: Date;
  userId?: string;
  category?: string;
}

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'update' | 'ping' | 'pong';
  channel?: string;
  data?: any;
  timestamp: Date;
  id: string;
}

export interface LeaderboardCache {
  key: string;
  data: LeaderboardResponse;
  expiresAt: Date;
  lastUpdated: Date;
}

export interface CommunityConfig {
  leaderboards: {
    enabled: boolean;
    categories: LeaderboardCategory[];
    updateInterval: number; // in milliseconds
    cacheTimeout: number; // in milliseconds
    maxUsersPerPage: number;
    realTimeUpdates: boolean;
  };
  statistics: {
    enabled: boolean;
    updateInterval: number;
    retentionPeriod: number; // in days
    exportEnabled: boolean;
    realTimeUpdates: boolean;
  };
  realTime: {
    enabled: boolean;
    websocketUrl: string;
    fallbackPollingInterval: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
  };
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number;
    debounceDelay: number;
    maxConcurrentUsers: number;
  };
}

export interface UserProgress {
  userId: string;
  lessonId: string;
  courseId: string;
  completedAt: Date;
  score: number;
  timeSpent: number;
  xpEarned: number;
  achievementsUnlocked: string[];
}

export interface LeaderboardEvent {
  type: 'xp_gained' | 'lesson_completed' | 'achievement_unlocked' | 'streak_updated' | 'badge_earned';
  userId: string;
  data: {
    xpGained?: number;
    lessonId?: string;
    achievementId?: string;
    streakCount?: number;
    badgeId?: string;
    [key: string]: any;
  };
  timestamp: Date;
}

export interface CommunityFeatureFlags {
  leaderboardsEnabled: boolean;
  statisticsEnabled: boolean;
  realTimeUpdatesEnabled: boolean;
  achievementsEnabled: boolean;
  badgesEnabled: boolean;
  streaksEnabled: boolean;
  communityMilestonesEnabled: boolean;
  exportEnabled: boolean;
  adminControlsEnabled: boolean;
}

export interface AdminCommunityControls {
  canManageLeaderboards: boolean;
  canViewStatistics: boolean;
  canExportData: boolean;
  canManageFeatureFlags: boolean;
  canModerateContent: boolean;
  canManageAchievements: boolean;
  canManageBadges: boolean;
}

// Error types for community features
export interface CommunityError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export type CommunityErrorCode =
  | 'LEADERBOARD_FETCH_FAILED'
  | 'STATS_FETCH_FAILED'
  | 'WEBSOCKET_CONNECTION_FAILED'
  | 'CACHE_ERROR'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_FILTERS'
  | 'EXPORT_FAILED'
  | 'UPDATE_FAILED';

// Community Error class
export class CommunityError extends Error {
  public code: CommunityErrorCode;
  public details?: any;
  public timestamp: Date;

  constructor(code: CommunityErrorCode, message: string, details?: any) {
    super(message);
    this.name = 'CommunityError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }
}

// Performance monitoring types
export interface PerformanceMetrics {
  leaderboardLoadTime: number;
  statsLoadTime: number;
  websocketLatency: number;
  cacheHitRate: number;
  errorRate: number;
  concurrentUsers: number;
  memoryUsage: number;
  timestamp: Date;
}

export interface LoadingState {
  leaderboards: boolean;
  statistics: boolean;
  export: boolean;
  refresh: boolean;
}

export interface CommunityNotification {
  id: string;
  type: 'achievement' | 'rank_change' | 'milestone' | 'badge' | 'streak';
  title: string;
  message: string;
  icon: string;
  timestamp: Date;
  read: boolean;
  userId: string;
  data?: any;
}
