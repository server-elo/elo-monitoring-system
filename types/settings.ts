export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
  githubUsername?: string;
  twitterUsername?: string;
  linkedinUsername?: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  lastLoginAt?: Date;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes: string[];
  passwordLastChanged: Date;
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
  sessionTimeout: number; // in minutes
  allowedDevices: string[];
  ipWhitelist: string[];
}

export interface NotificationSettings {
  email: {
    courseUpdates: boolean;
    achievementUnlocked: boolean;
    weeklyProgress: boolean;
    collaborationInvites: boolean;
    systemAnnouncements: boolean;
    securityAlerts: boolean;
    marketingEmails: boolean;
  };
  push: {
    courseReminders: boolean;
    achievementUnlocked: boolean;
    collaborationActivity: boolean;
    systemAlerts: boolean;
  };
  inApp: {
    realTimeCollaboration: boolean;
    codeAnalysisResults: boolean;
    debuggingAlerts: boolean;
    versionControlUpdates: boolean;
  };
}

export interface LearningPreferences {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningPath: string[];
  preferredLanguages: string[];
  studyReminders: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'custom';
    time: string; // HH:MM format
    timezone: string;
  };
  progressTracking: {
    showDetailedStats: boolean;
    shareProgress: boolean;
    goalSetting: boolean;
    weeklyGoals: number; // hours per week
  };
  contentPreferences: {
    videoSpeed: number;
    autoplayVideos: boolean;
    showHints: boolean;
    skipIntroductions: boolean;
  };
}

export interface EditorPreferences {
  theme: 'dark' | 'light' | 'high-contrast' | 'auto';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  bracketPairColorization: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // in milliseconds
  formatOnSave: boolean;
  formatOnType: boolean;
  showWhitespace: boolean;
  renderControlCharacters: boolean;
  cursorStyle: 'line' | 'block' | 'underline';
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
}

export interface CollaborationPreferences {
  showCursors: boolean;
  showSelections: boolean;
  showUserNames: boolean;
  enableRealTimeChat: boolean;
  autoJoinSessions: boolean;
  sharePresence: boolean;
  allowInvitations: boolean;
  defaultPermissions: 'read' | 'write' | 'admin';
  notificationSound: boolean;
  cursorColor?: string;
}

export interface AccessibilitySettings {
  screenReader: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  colorBlindnessSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  colorBlindSupport: boolean;
  voiceCommands: boolean;
  fontSize: number;
  stickyKeys: boolean;
  clickDelay: number;
  largeClickTargets: boolean;
  simpleLanguage: boolean;
  readingGuide: boolean;
  reduceMotion: boolean;
  autoPauseMedia: boolean;
  sessionTimeoutWarning: number;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showProgress: boolean;
  showAchievements: boolean;
  allowCollaboration: boolean;
  showOnlineStatus: boolean;
  dataRetentionDays: number; // in days
  allowAnalytics: boolean;
  allowPersonalization: boolean;
  allowMarketing: boolean;
  allowThirdParty: boolean;
  allowCookies: boolean;
  dataRetention: number; // in days
  shareUsageData: boolean;
}

export interface UserSettings {
  profile: UserProfile;
  security: SecuritySettings;
  notifications: NotificationSettings;
  learning: LearningPreferences;
  editor: EditorPreferences;
  collaboration: CollaborationPreferences;
  accessibility: AccessibilitySettings;
  privacy: PrivacySettings;
}

export interface SettingsUpdateRequest {
  section: keyof UserSettings;
  data: Partial<UserSettings[keyof UserSettings]>;
  timestamp: Date;
  source: 'user' | 'system' | 'admin';
}

export interface SettingsValidationError {
  field: string;
  message: string;
  code: string;
}

export interface SettingsUpdateResponse {
  success: boolean;
  data?: Partial<UserSettings>;
  errors?: SettingsValidationError[];
  message?: string;
  timestamp: Date;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  section: keyof UserSettings;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  source: 'user' | 'system' | 'admin';
}

export interface ActiveSession {
  id: string;
  userId: string;
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
    isMobile: boolean;
  };
  location: {
    country: string;
    city: string;
    ip: string;
  };
  createdAt: Date;
  lastActivity: Date;
  isCurrentSession: boolean;
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventPersonalInfo: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  verificationCode?: string;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  type: 'profile' | 'progress' | 'code' | 'all';
  format: 'json' | 'csv' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface AccountDeletionRequest {
  id: string;
  userId: string;
  reason?: string;
  scheduledFor: Date;
  confirmationCode: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
}

// Default settings
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'profile'> = {
  security: {
    twoFactorEnabled: false,
    backupCodes: [],
    passwordLastChanged: new Date(),
    loginNotifications: true,
    suspiciousActivityAlerts: true,
    sessionTimeout: 480, // 8 hours
    allowedDevices: [],
    ipWhitelist: []
  },
  notifications: {
    email: {
      courseUpdates: true,
      achievementUnlocked: true,
      weeklyProgress: true,
      collaborationInvites: true,
      systemAnnouncements: true,
      securityAlerts: true,
      marketingEmails: false
    },
    push: {
      courseReminders: true,
      achievementUnlocked: true,
      collaborationActivity: false,
      systemAlerts: true
    },
    inApp: {
      realTimeCollaboration: true,
      codeAnalysisResults: true,
      debuggingAlerts: true,
      versionControlUpdates: true
    }
  },
  learning: {
    difficulty: 'beginner',
    learningPath: [],
    preferredLanguages: ['solidity'],
    studyReminders: {
      enabled: false,
      frequency: 'daily',
      time: '19:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    progressTracking: {
      showDetailedStats: true,
      shareProgress: false,
      goalSetting: true,
      weeklyGoals: 5
    },
    contentPreferences: {
      videoSpeed: 1.0,
      autoplayVideos: false,
      showHints: true,
      skipIntroductions: false
    }
  },
  editor: {
    theme: 'dark',
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
    lineHeight: 1.5,
    tabSize: 4,
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
    bracketPairColorization: true,
    autoSave: true,
    autoSaveInterval: 2000,
    formatOnSave: true,
    formatOnType: false,
    showWhitespace: false,
    renderControlCharacters: false,
    cursorStyle: 'line',
    cursorBlinking: 'blink'
  },
  collaboration: {
    showCursors: true,
    showSelections: true,
    showUserNames: true,
    enableRealTimeChat: true,
    autoJoinSessions: false,
    sharePresence: true,
    allowInvitations: true,
    defaultPermissions: 'write',
    notificationSound: true
  },
  accessibility: {
    screenReader: false,
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    keyboardNavigation: true,
    focusIndicators: true,
    colorBlindnessSupport: 'none',
    colorBlindSupport: false,
    voiceCommands: false,
    fontSize: 16,
    stickyKeys: false,
    clickDelay: 0,
    largeClickTargets: false,
    simpleLanguage: false,
    readingGuide: false,
    reduceMotion: false,
    autoPauseMedia: false,
    sessionTimeoutWarning: 5
  },
  privacy: {
    profileVisibility: 'public',
    showProgress: true,
    showAchievements: true,
    allowCollaboration: true,
    showOnlineStatus: true,
    dataRetentionDays: 365,
    allowAnalytics: true,
    allowPersonalization: true,
    allowMarketing: false,
    allowThirdParty: false,
    allowCookies: true,
    dataRetention: 365,
    shareUsageData: false
  }
};
