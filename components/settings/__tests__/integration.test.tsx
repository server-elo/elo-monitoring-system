;
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from '../SettingsPage';

// Mock the useSettings hook with full functionality
jest.mock('@/lib/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        bio: 'Software developer',
        avatar: '/avatar.jpg',
        location: 'San Francisco',
        website: 'https://johndoe.com',
        github: 'johndoe',
        twitter: '@johndoe',
        linkedin: 'johndoe'
      },
      security: {
        twoFactorEnabled: false,
        backupCodes: [],
        loginNotifications: true,
        suspiciousActivityAlerts: true,
        sessionTimeout: 60
      },
      learning: {
        difficulty: 'intermediate',
        studyReminders: {
          enabled: true,
          frequency: 'daily',
          time: '09:00'
        },
        progressTracking: {
          showDetailedStats: true,
          shareProgress: false,
          weeklyGoals: 10
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
        fontFamily: 'JetBrains Mono',
        lineHeight: 1.5,
        tabSize: 2,
        wordWrap: true,
        lineNumbers: true,
        minimap: true,
        autoSave: true,
        autoSaveInterval: 3000,
        formatOnSave: true,
        formatOnType: false
      },
      collaboration: {
        showCursors: true,
        showSelections: true,
        showUserNames: true,
        sharePresence: true,
        enableRealTimeChat: true,
        notificationSound: true,
        allowInvitations: true,
        autoJoinSessions: false,
        defaultPermissions: 'write'
      },
      notifications: {
        email: {
          courseUpdates: true,
          achievementUnlocked: true,
          weeklyProgress: false,
          collaborationInvites: true,
          systemAnnouncements: true,
          securityAlerts: true,
          marketingEmails: false
        },
        push: {
          courseReminders: true,
          achievementUnlocked: true,
          collaborationActivity: true,
          systemAlerts: true
        },
        inApp: {
          realTimeCollaboration: true,
          codeAnalysisResults: true,
          debuggingAlerts: true,
          versionControlUpdates: false
        }
      },
      accessibility: {
        fontSize: 16,
        highContrast: false,
        colorBlindSupport: false,
        screenReader: false,
        focusIndicators: false,
        keyboardNavigation: true,
        stickyKeys: false,
        clickDelay: 0,
        largeClickTargets: false,
        reduceMotion: false,
        simpleLanguage: false,
        readingGuide: false,
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
        allowThirdParty: false
      }
    },
    isLoading: false,
    isSaving: false,
    hasUnsavedChanges: false,
    validationErrors: {},
    updateSettings: jest.fn().mockResolvedValue({ success: true }),
    saveAllChanges: jest.fn().mockResolvedValue({ success: true }),
    resetSection: jest.fn(),
    refreshSettings: jest.fn(),
    changePassword: jest.fn().mockResolvedValue({ success: true }),
    setupTwoFactor: jest.fn().mockResolvedValue({ 
      success: true, 
      setup: { secret: 'TEST', qrCode: 'data:image/png;base64,test', backupCodes: [] }
    }),
    enableTwoFactor: jest.fn().mockResolvedValue({ success: true, backupCodes: [] }),
    disableTwoFactor: jest.fn().mockResolvedValue({ success: true }),
    activeSessions: [
      {
        id: '1',
        deviceInfo: { browser: 'Chrome', os: 'Windows 10', device: 'Desktop' },
        location: { ip: '192.168.1.100', city: 'San Francisco', country: 'US' },
        lastActivity: new Date().toISOString(),
        isCurrentSession: true
      }
    ],
    revokeSession: jest.fn().mockResolvedValue({ success: true }),
    refreshSessions: jest.fn(),
    auditLog: [],
    refreshAuditLog: jest.fn(),
    requestDataExport: jest.fn().mockResolvedValue({ success: true, downloadUrl: 'test.zip' }),
    requestAccountDeletion: jest.fn().mockResolvedValue({ success: true })
  })
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Settings Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders complete settings page with all sections', () => {
    render(<SettingsPage />);
    
    // Check main navigation
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Learning & Editor')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
    expect(screen.getByText('Privacy & Data')).toBeInTheDocument();
  });

  it('navigates between all sections correctly', async () => {
    render(<SettingsPage />);
    
    // Start with Profile (default)
    expect(screen.getByText('Manage your personal information and avatar')).toBeInTheDocument();
    
    // Navigate to Security
    await user.click(screen.getByText('Security'));
    expect(screen.getByText('Password, 2FA, and account security settings')).toBeInTheDocument();
    
    // Navigate to Learning & Editor
    await user.click(screen.getByText('Learning & Editor'));
    expect(screen.getByText('Learning preferences and code editor settings')).toBeInTheDocument();
    
    // Navigate to Notifications
    await user.click(screen.getByText('Notifications'));
    expect(screen.getByText('Email, push, and in-app notification preferences')).toBeInTheDocument();
    
    // Navigate to Accessibility
    await user.click(screen.getByText('Accessibility'));
    expect(screen.getByText('Accessibility features and accommodations')).toBeInTheDocument();
    
    // Navigate to Privacy & Data
    await user.click(screen.getByText('Privacy & Data'));
    expect(screen.getByText('Privacy settings and data management')).toBeInTheDocument();
  });

  it('handles keyboard navigation between tabs', async () => {
    render(<SettingsPage />);
    
    // Focus the page
    document.body.focus();
    
    // Use Alt+Right to navigate to next tab
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    
    // Should be on Security tab
    expect(screen.getByText('Password, 2FA, and account security settings')).toBeInTheDocument();
    
    // Use Alt+Left to go back
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    
    // Should be back on Profile tab
    expect(screen.getByText('Manage your personal information and avatar')).toBeInTheDocument();
  });

  it('collapses and expands sidebar', async () => {
    render(<SettingsPage />);
    
    // Find collapse button
    const collapseButton = screen.getByTitle('Collapse sidebar');
    await user.click(collapseButton);
    
    // Should show expand button
    expect(screen.getByTitle('Expand sidebar')).toBeInTheDocument();
    
    // Click expand
    const expandButton = screen.getByTitle('Expand sidebar');
    await user.click(expandButton);
    
    // Should show collapse button again
    expect(screen.getByTitle('Collapse sidebar')).toBeInTheDocument();
  });

  it('displays profile information correctly', () => {
    render(<SettingsPage />);
    
    // Check profile data is displayed
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
  });

  it('shows security settings correctly', async () => {
    render(<SettingsPage />);
    
    // Navigate to Security
    await user.click(screen.getByText('Security'));
    
    // Check 2FA status
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    
    // Check active sessions
    await user.click(screen.getByText('Active Sessions'));
    expect(screen.getByText('Chrome on Windows 10')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('displays learning preferences correctly', async () => {
    render(<SettingsPage />);
    
    // Navigate to Learning & Editor
    await user.click(screen.getByText('Learning & Editor'));
    
    // Check difficulty level
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    
    // Navigate to editor tab
    await user.click(screen.getByText('Code Editor'));
    
    // Check editor settings
    expect(screen.getByText('14px')).toBeInTheDocument(); // Font size
    expect(screen.getByText('1.5')).toBeInTheDocument(); // Line height
  });

  it('shows notification preferences correctly', async () => {
    render(<SettingsPage />);
    
    // Navigate to Notifications
    await user.click(screen.getByText('Notifications'));
    
    // Check email notifications
    expect(screen.getByText('Course Updates')).toBeInTheDocument();
    expect(screen.getByText('Achievement Unlocked')).toBeInTheDocument();
    
    // Navigate to push notifications
    await user.click(screen.getByText('Push'));
    expect(screen.getByText('Course Reminders')).toBeInTheDocument();
  });

  it('displays accessibility options correctly', async () => {
    render(<SettingsPage />);
    
    // Navigate to Accessibility
    await user.click(screen.getByText('Accessibility'));
    
    // Check visual accessibility
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('16px')).toBeInTheDocument();
    
    // Navigate to motor accessibility
    await user.click(screen.getByText('Motor'));
    expect(screen.getByText('Enhanced Keyboard Navigation')).toBeInTheDocument();
  });

  it('shows privacy settings correctly', async () => {
    render(<SettingsPage />);
    
    // Navigate to Privacy & Data
    await user.click(screen.getByText('Privacy & Data'));
    
    // Check profile visibility
    expect(screen.getByText('Public')).toBeInTheDocument();
    
    // Navigate to data management
    await user.click(screen.getByText('Data Management'));
    expect(screen.getByText('Export Your Data')).toBeInTheDocument();
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
  });

  it('handles save functionality', async () => {
    const mockSaveAllChanges = jest.fn().mockResolvedValue({ success: true });
    
    // Mock hasUnsavedChanges to true
    jest.mocked(require('@/lib/hooks/useSettings').useSettings).mockReturnValue({
      ...require('@/lib/hooks/useSettings').useSettings(),
      hasUnsavedChanges: true,
      saveAllChanges: mockSaveAllChanges
    });
    
    render(<SettingsPage />);
    
    // Should show save button
    expect(screen.getByText('Save All')).toBeInTheDocument();
    
    // Click save
    await user.click(screen.getByText('Save All'));
    
    expect(mockSaveAllChanges).toHaveBeenCalled();
  });

  it('handles keyboard shortcuts', async () => {
    const mockSaveAllChanges = jest.fn().mockResolvedValue({ success: true });
    const mockRefreshSettings = jest.fn();
    
    jest.mocked(require('@/lib/hooks/useSettings').useSettings).mockReturnValue({
      ...require('@/lib/hooks/useSettings').useSettings(),
      hasUnsavedChanges: true,
      saveAllChanges: mockSaveAllChanges,
      refreshSettings: mockRefreshSettings
    });
    
    render(<SettingsPage />);
    
    // Test Ctrl+S for save
    await user.keyboard('{Control>}s{/Control}');
    expect(mockSaveAllChanges).toHaveBeenCalled();
    
    // Test Ctrl+R for refresh
    await user.keyboard('{Control>}r{/Control}');
    expect(mockRefreshSettings).toHaveBeenCalled();
  });

  it('shows loading state correctly', () => {
    jest.mocked(require('@/lib/hooks/useSettings').useSettings).mockReturnValue({
      ...require('@/lib/hooks/useSettings').useSettings(),
      isLoading: true,
      settings: null
    });
    
    render(<SettingsPage />);
    
    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
  });
});
