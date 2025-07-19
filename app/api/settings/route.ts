import { NextRequest } from 'next/server';
import { z } from 'zod';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  withErrorHandling,
  generateRequestId
} from '@/lib/api/utils';
import { ApiErrorCode, HttpStatus } from '@/lib/api/types';
import { logger } from '@/lib/monitoring/simple-logger';

// Validation schemas for different settings sections
const profileSettingsSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  website: z.string().url('Invalid website URL').optional(),
  github: z.string().max(50, 'GitHub username must be less than 50 characters').optional(),
  twitter: z.string().max(50, 'Twitter username must be less than 50 characters').optional(),
  linkedin: z.string().max(100, 'LinkedIn profile must be less than 100 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional()
});

const securitySettingsSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
  confirmPassword: z.string().optional(),
  twoFactorEnabled: z.boolean().optional(),
  sessionTimeout: z.number().min(5, 'Session timeout must be at least 5 minutes').max(1440, 'Session timeout cannot exceed 24 hours').optional(),
  loginNotifications: z.boolean().optional()
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const learningSettingsSchema = z.object({
  learningGoals: z.array(z.string()).optional(),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  preferredDifficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  dailyGoal: z.number().min(5, 'Daily goal must be at least 5 minutes').max(480, 'Daily goal cannot exceed 8 hours').optional(),
  weeklyGoal: z.number().min(30, 'Weekly goal must be at least 30 minutes').max(3360, 'Weekly goal cannot exceed 56 hours').optional(),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  timezone: z.string().optional(),
  progressTracking: z.object({
    showDetailedStats: z.boolean().optional(),
    trackTimeSpent: z.boolean().optional(),
    showStreak: z.boolean().optional(),
    showXP: z.boolean().optional()
  }).optional()
});

const editorSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  fontSize: z.number().min(10, 'Font size must be at least 10px').max(24, 'Font size cannot exceed 24px').optional(),
  fontFamily: z.enum(['monospace', 'fira-code', 'source-code-pro', 'jetbrains-mono']).optional(),
  tabSize: z.number().min(2, 'Tab size must be at least 2').max(8, 'Tab size cannot exceed 8').optional(),
  wordWrap: z.boolean().optional(),
  lineNumbers: z.boolean().optional(),
  minimap: z.boolean().optional(),
  autoSave: z.boolean().optional(),
  autoSaveDelay: z.number().min(500, 'Auto-save delay must be at least 500ms').max(10000, 'Auto-save delay cannot exceed 10 seconds').optional(),
  keyBindings: z.enum(['default', 'vim', 'emacs']).optional()
});

const collaborationSettingsSchema = z.object({
  allowCollaboration: z.boolean().optional(),
  shareProgress: z.boolean().optional(),
  showOnlineStatus: z.boolean().optional(),
  allowDirectMessages: z.boolean().optional(),
  mentorshipAvailable: z.boolean().optional(),
  publicProfile: z.boolean().optional(),
  showAchievements: z.boolean().optional(),
  allowFollowers: z.boolean().optional()
});

const notificationSettingsSchema = z.object({
  email: z.object({
    courseUpdates: z.boolean().optional(),
    newLessons: z.boolean().optional(),
    achievements: z.boolean().optional(),
    reminders: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
    marketing: z.boolean().optional()
  }).optional(),
  push: z.object({
    enabled: z.boolean().optional(),
    courseUpdates: z.boolean().optional(),
    achievements: z.boolean().optional(),
    reminders: z.boolean().optional(),
    messages: z.boolean().optional()
  }).optional(),
  inApp: z.object({
    achievements: z.boolean().optional(),
    courseUpdates: z.boolean().optional(),
    messages: z.boolean().optional(),
    system: z.boolean().optional()
  }).optional()
});

const accessibilitySettingsSchema = z.object({
  fontSize: z.number().min(12, 'Font size must be at least 12px').max(24, 'Font size cannot exceed 24px').optional(),
  highContrast: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
  screenReader: z.boolean().optional(),
  keyboardNavigation: z.boolean().optional(),
  focusIndicators: z.boolean().optional(),
  largeClickTargets: z.boolean().optional(),
  simpleLanguage: z.boolean().optional(),
  audioDescriptions: z.boolean().optional(),
  captionsEnabled: z.boolean().optional()
});

const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'friends', 'private']).optional(),
  showEmail: z.boolean().optional(),
  showProgress: z.boolean().optional(),
  showAchievements: z.boolean().optional(),
  allowAnalytics: z.boolean().optional(),
  allowCookies: z.boolean().optional(),
  dataRetention: z.enum(['1year', '2years', '5years', 'indefinite']).optional(),
  marketingEmails: z.boolean().optional(),
  thirdPartySharing: z.boolean().optional()
});

// Schema mapping
const settingsSchemas = {
  profile: profileSettingsSchema,
  security: securitySettingsSchema,
  learning: learningSettingsSchema,
  editor: editorSettingsSchema,
  collaboration: collaborationSettingsSchema,
  notifications: notificationSettingsSchema,
  accessibility: accessibilitySettingsSchema,
  privacy: privacySettingsSchema
};

// Mock user settings
const mockUserSettings = {
  userId: '1',
  profile: {
    firstName: 'John',
    lastName: 'Student',
    bio: 'Learning Solidity and blockchain development',
    location: 'New York, NY',
    website: 'https://johnstudent.dev',
    github: 'johnstudent',
    twitter: 'johnstudent',
    linkedin: 'john-student',
    avatar: 'https://example.com/avatars/john.jpg'
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 60,
    loginNotifications: true
  },
  learning: {
    learningGoals: ['Master Solidity', 'Build DeFi apps'],
    skillLevel: 'BEGINNER',
    preferredDifficulty: 'BEGINNER',
    dailyGoal: 60,
    weeklyGoal: 420,
    reminderTime: '19:00',
    timezone: 'America/New_York',
    progressTracking: {
      showDetailedStats: true,
      trackTimeSpent: true,
      showStreak: true,
      showXP: true
    }
  },
  editor: {
    theme: 'dark',
    fontSize: 14,
    fontFamily: 'fira-code',
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true,
    minimap: true,
    autoSave: true,
    autoSaveDelay: 2000,
    keyBindings: 'default'
  },
  collaboration: {
    allowCollaboration: true,
    shareProgress: true,
    showOnlineStatus: true,
    allowDirectMessages: true,
    mentorshipAvailable: false,
    publicProfile: true,
    showAchievements: true,
    allowFollowers: true
  },
  notifications: {
    email: {
      courseUpdates: true,
      newLessons: true,
      achievements: true,
      reminders: true,
      weeklyDigest: true,
      marketing: false
    },
    push: {
      enabled: true,
      courseUpdates: true,
      achievements: true,
      reminders: true,
      messages: true
    },
    inApp: {
      achievements: true,
      courseUpdates: true,
      messages: true,
      system: true
    }
  },
  accessibility: {
    fontSize: 16,
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    focusIndicators: true,
    largeClickTargets: false,
    simpleLanguage: false,
    audioDescriptions: false,
    captionsEnabled: false
  },
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showProgress: true,
    showAchievements: true,
    allowAnalytics: true,
    allowCookies: true,
    dataRetention: '2years',
    marketingEmails: false,
    thirdPartySharing: false
  },
  updatedAt: '2024-01-15T10:30:00Z'
};

// GET /api/settings - Get all user settings
async function getSettingsHandler(_request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    // TODO: Get user ID from authentication token
    // const userId = getUserFromToken(request);
    
    return successResponse(mockUserSettings, undefined, HttpStatus.OK, requestId);
    
  } catch (error) {
    logger.error('Get settings error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to fetch settings',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// PUT /api/settings - Update user settings
async function updateSettingsHandler(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body = await request.json();
    
    // Validate request structure
    const requestSchema = z.object({
      section: z.enum(['profile', 'security', 'learning', 'editor', 'collaboration', 'notifications', 'accessibility', 'privacy']),
      data: z.record(z.any())
    });
    
    const requestValidation = requestSchema.safeParse(body);
    if (!requestValidation.success) {
      const errors = requestValidation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: 'INVALID_FORMAT'
      }));
      return validationErrorResponse(errors, requestId);
    }
    
    const { section, data } = requestValidation.data;
    
    // Validate section-specific data
    const sectionSchema = settingsSchemas[section];
    const validation = sectionSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: `${section}.${err.path.join('.')}`,
        message: err.message,
        code: 'INVALID_FORMAT'
      }));
      return validationErrorResponse(errors, requestId);
    }
    
    // TODO: Get user ID from authentication token
    // const userId = getUserFromToken(request);
    
    // Update settings
    (mockUserSettings as any)[section] = {
      ...(mockUserSettings as any)[section],
      ...validation.data
    };
    mockUserSettings.updatedAt = new Date().toISOString();
    
    // Log settings update
    logger.info('Settings updated', {
      userId: mockUserSettings.userId,
      requestId,
      metadata: {
        section,
        timestamp: mockUserSettings.updatedAt
      }
    });
    
    return successResponse(
      { 
        message: `${section} settings updated successfully`,
        settings: mockUserSettings[section],
        updatedAt: mockUserSettings.updatedAt
      },
      undefined,
      HttpStatus.OK,
      requestId
    );
    
  } catch (error) {
    logger.error('Update settings error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to update settings',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// Route handlers
export const GET = withErrorHandling(getSettingsHandler);
export const PUT = withErrorHandling(updateSettingsHandler);
