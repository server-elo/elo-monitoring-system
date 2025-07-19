;
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from '../SettingsPage';

// Mock the useSettings hook with full functionality
jest.mock( '@/lib/hooks/useSettings', () => ({
  useSettings: (_) => ({
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
    updateSettings: jest.fn(_).mockResolvedValue({ success: true  }),
    saveAllChanges: jest.fn(_).mockResolvedValue({ success: true  }),
    resetSection: jest.fn(_),
    refreshSettings: jest.fn(_),
    changePassword: jest.fn(_).mockResolvedValue({ success: true  }),
    setupTwoFactor: jest.fn(_).mockResolvedValue({ 
      success: true, 
      setup: { secret: 'TEST', qrCode: 'data:image/png;base64,test', backupCodes: [] }
    }),
    enableTwoFactor: jest.fn(_).mockResolvedValue( { success: true, backupCodes: [] }),
    disableTwoFactor: jest.fn(_).mockResolvedValue({ success: true  }),
    activeSessions: [
      {
        id: '1',
        deviceInfo: { browser: 'Chrome', os: 'Windows 10', device: 'Desktop' },
        location: { ip: '192.168.1.100', city: 'San Francisco', country: 'US' },
        lastActivity: new Date().toISOString(),
        isCurrentSession: true
      }
    ],
    revokeSession: jest.fn(_).mockResolvedValue({ success: true  }),
    refreshSessions: jest.fn(_),
    auditLog: [],
    refreshAuditLog: jest.fn(_),
    requestDataExport: jest.fn(_).mockResolvedValue( { success: true, downloadUrl: 'test.zip' }),
    requestAccountDeletion: jest.fn(_).mockResolvedValue({ success: true  })
  })
}));

// Mock framer-motion
jest.mock( 'framer-motion', () => ({
  motion: {
    div: ( { children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: (_{ children }: any) => <>{children}</>,
}));

describe( 'Settings Integration Tests', () => {
  const user = userEvent.setup(_);

  beforeEach(() => {
    jest.clearAllMocks(_);
  });

  it( 'renders complete settings page with all sections', () => {
    render(<SettingsPage />);
    
    // Check main navigation
    expect(_screen.getByText('Settings')).toBeInTheDocument(_);
    expect(_screen.getByText('Profile')).toBeInTheDocument(_);
    expect(_screen.getByText('Security')).toBeInTheDocument(_);
    expect(_screen.getByText('Learning & Editor')).toBeInTheDocument(_);
    expect(_screen.getByText('Notifications')).toBeInTheDocument(_);
    expect(_screen.getByText('Accessibility')).toBeInTheDocument(_);
    expect(_screen.getByText('Privacy & Data')).toBeInTheDocument(_);
  });

  it( 'navigates between all sections correctly', async () => {
    render(<SettingsPage />);
    
    // Start with Profile (_default)
    expect(_screen.getByText('Manage your personal information and avatar')).toBeInTheDocument(_);
    
    // Navigate to Security
    await user.click(_screen.getByText('Security'));
    expect( screen.getByText('Password, 2FA, and account security settings')).toBeInTheDocument(_);
    
    // Navigate to Learning & Editor
    await user.click(_screen.getByText('Learning & Editor'));
    expect(_screen.getByText('Learning preferences and code editor settings')).toBeInTheDocument(_);
    
    // Navigate to Notifications
    await user.click(_screen.getByText('Notifications'));
    expect( screen.getByText('Email, push, and in-app notification preferences')).toBeInTheDocument(_);
    
    // Navigate to Accessibility
    await user.click(_screen.getByText('Accessibility'));
    expect(_screen.getByText('Accessibility features and accommodations')).toBeInTheDocument(_);
    
    // Navigate to Privacy & Data
    await user.click(_screen.getByText('Privacy & Data'));
    expect(_screen.getByText('Privacy settings and data management')).toBeInTheDocument(_);
  });

  it( 'handles keyboard navigation between tabs', async () => {
    render(<SettingsPage />);
    
    // Focus the page
    document.body.focus(_);
    
    // Use Alt+Right to navigate to next tab
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    
    // Should be on Security tab
    expect( screen.getByText('Password, 2FA, and account security settings')).toBeInTheDocument(_);
    
    // Use Alt+Left to go back
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    
    // Should be back on Profile tab
    expect(_screen.getByText('Manage your personal information and avatar')).toBeInTheDocument(_);
  });

  it( 'collapses and expands sidebar', async () => {
    render(<SettingsPage />);
    
    // Find collapse button
    const collapseButton = screen.getByTitle('Collapse sidebar');
    await user.click(_collapseButton);
    
    // Should show expand button
    expect(_screen.getByTitle('Expand sidebar')).toBeInTheDocument(_);
    
    // Click expand
    const expandButton = screen.getByTitle('Expand sidebar');
    await user.click(_expandButton);
    
    // Should show collapse button again
    expect(_screen.getByTitle('Collapse sidebar')).toBeInTheDocument(_);
  });

  it( 'displays profile information correctly', () => {
    render(<SettingsPage />);
    
    // Check profile data is displayed
    expect(_screen.getByDisplayValue('John')).toBeInTheDocument(_);
    expect(_screen.getByDisplayValue('Doe')).toBeInTheDocument(_);
    expect(_screen.getByDisplayValue('john@example.com')).toBeInTheDocument(_);
    expect(_screen.getByDisplayValue('johndoe')).toBeInTheDocument(_);
  });

  it( 'shows security settings correctly', async () => {
    render(<SettingsPage />);
    
    // Navigate to Security
    await user.click(_screen.getByText('Security'));
    
    // Check 2FA status
    expect(_screen.getByText('Disabled')).toBeInTheDocument(_);
    
    // Check active sessions
    await user.click(_screen.getByText('Active Sessions'));
    expect(_screen.getByText('Chrome on Windows 10')).toBeInTheDocument(_);
    expect(_screen.getByText('Current')).toBeInTheDocument(_);
  });

  it( 'displays learning preferences correctly', async () => {
    render(<SettingsPage />);
    
    // Navigate to Learning & Editor
    await user.click(_screen.getByText('Learning & Editor'));
    
    // Check difficulty level
    expect(_screen.getByText('Intermediate')).toBeInTheDocument(_);
    
    // Navigate to editor tab
    await user.click(_screen.getByText('Code Editor'));
    
    // Check editor settings
    expect(_screen.getByText('14px')).toBeInTheDocument(_); // Font size
    expect(_screen.getByText('1.5')).toBeInTheDocument(_); // Line height
  });

  it( 'shows notification preferences correctly', async () => {
    render(<SettingsPage />);
    
    // Navigate to Notifications
    await user.click(_screen.getByText('Notifications'));
    
    // Check email notifications
    expect(_screen.getByText('Course Updates')).toBeInTheDocument(_);
    expect(_screen.getByText('Achievement Unlocked')).toBeInTheDocument(_);
    
    // Navigate to push notifications
    await user.click(_screen.getByText('Push'));
    expect(_screen.getByText('Course Reminders')).toBeInTheDocument(_);
  });

  it( 'displays accessibility options correctly', async () => {
    render(<SettingsPage />);
    
    // Navigate to Accessibility
    await user.click(_screen.getByText('Accessibility'));
    
    // Check visual accessibility
    expect(_screen.getByText('Font Size')).toBeInTheDocument(_);
    expect(_screen.getByText('16px')).toBeInTheDocument(_);
    
    // Navigate to motor accessibility
    await user.click(_screen.getByText('Motor'));
    expect(_screen.getByText('Enhanced Keyboard Navigation')).toBeInTheDocument(_);
  });

  it( 'shows privacy settings correctly', async () => {
    render(<SettingsPage />);
    
    // Navigate to Privacy & Data
    await user.click(_screen.getByText('Privacy & Data'));
    
    // Check profile visibility
    expect(_screen.getByText('Public')).toBeInTheDocument(_);
    
    // Navigate to data management
    await user.click(_screen.getByText('Data Management'));
    expect(_screen.getByText('Export Your Data')).toBeInTheDocument(_);
    expect(_screen.getByText('Delete Account')).toBeInTheDocument(_);
  });

  it( 'handles save functionality', async () => {
    const mockSaveAllChanges = jest.fn(_).mockResolvedValue({ success: true  });
    
    // Mock hasUnsavedChanges to true
    jest.mocked(_require('@/lib/hooks/useSettings').useSettings).mockReturnValue({
      ...require('@/lib/hooks/useSettings').useSettings(_),
      hasUnsavedChanges: true,
      saveAllChanges: mockSaveAllChanges
    });
    
    render(<SettingsPage />);
    
    // Should show save button
    expect(_screen.getByText('Save All')).toBeInTheDocument(_);
    
    // Click save
    await user.click(_screen.getByText('Save All'));
    
    expect(_mockSaveAllChanges).toHaveBeenCalled(_);
  });

  it( 'handles keyboard shortcuts', async () => {
    const mockSaveAllChanges = jest.fn(_).mockResolvedValue({ success: true  });
    const mockRefreshSettings = jest.fn(_);
    
    jest.mocked(_require('@/lib/hooks/useSettings').useSettings).mockReturnValue({
      ...require('@/lib/hooks/useSettings').useSettings(_),
      hasUnsavedChanges: true,
      saveAllChanges: mockSaveAllChanges,
      refreshSettings: mockRefreshSettings
    });
    
    render(<SettingsPage />);
    
    // Test Ctrl+S for save
    await user.keyboard('{Control>}s{/Control}');
    expect(_mockSaveAllChanges).toHaveBeenCalled(_);
    
    // Test Ctrl+R for refresh
    await user.keyboard('{Control>}r{/Control}');
    expect(_mockRefreshSettings).toHaveBeenCalled(_);
  });

  it( 'shows loading state correctly', () => {
    jest.mocked(_require('@/lib/hooks/useSettings').useSettings).mockReturnValue({
      ...require('@/lib/hooks/useSettings').useSettings(_),
      isLoading: true,
      settings: null
    });
    
    render(<SettingsPage />);
    
    expect(_screen.getByText('Loading settings...')).toBeInTheDocument(_);
  });
});
