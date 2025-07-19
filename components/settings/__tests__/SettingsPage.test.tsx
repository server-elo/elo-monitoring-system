;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPage } from '../SettingsPage';
import { useSettings } from '@/lib/hooks/useSettings';

// Mock the useSettings hook
jest.mock('@/lib/hooks/useSettings');
const mockUseSettings = useSettings as jest.MockedFunction<typeof useSettings>;

// Mock framer-motion
jest.mock( 'framer-motion', () => ({
  motion: {
    div: ( { children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: (_{ children }: any) => <>{children}</>,
}));

// Mock components
jest.mock( '../ProfileSection', () => ({
  ProfileSection: ( { profile, onUpdate }: any) => (
    <div data-testid="profile-section">
      <span>Profile: {profile?.firstName}</span>
      <button onClick={(_) => onUpdate({ firstName: 'Updated'  })}>Update Profile</button>
    </div>
  ),
}));

jest.mock( '../SecuritySection', () => ({
  SecuritySection: ( { security, onUpdateSecurity }: any) => (
    <div data-testid="security-section">
      <span>2FA: {security?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
      <button onClick={(_) => onUpdateSecurity({ twoFactorEnabled: true  })}>Enable 2FA</button>
    </div>
  ),
}));

jest.mock( '../LearningPreferencesSection', () => ({
  LearningPreferencesSection: ( { learning, onUpdateLearning }: any) => (
    <div data-testid="learning-section">
      <span>Difficulty: {learning?.difficulty}</span>
      <button onClick={(_) => onUpdateLearning({ difficulty: 'advanced'  })}>Update Learning</button>
    </div>
  ),
}));

jest.mock( '../NotificationSection', () => ({
  NotificationSection: ( { notifications, onUpdate }: any) => (
    <div data-testid="notification-section">
      <span>Email: {notifications?.email?.courseUpdates ? 'On' : 'Off'}</span>
      <button onClick={(_) => onUpdate(_{ email: { courseUpdates: false } })}>Update Notifications</button>
    </div>
  ),
}));

jest.mock( '../AccessibilitySection', () => ({
  AccessibilitySection: ( { accessibility, onUpdate }: any) => (
    <div data-testid="accessibility-section">
      <span>Font Size: {accessibility?.fontSize}px</span>
      <button onClick={(_) => onUpdate({ fontSize: 18  })}>Update Accessibility</button>
    </div>
  ),
}));

jest.mock( '../PrivacySection', () => ({
  PrivacySection: ( { privacy, onUpdate }: any) => (
    <div data-testid="privacy-section">
      <span>Profile: {privacy?.profileVisibility}</span>
      <button onClick={(_) => onUpdate({ profileVisibility: 'private'  })}>Update Privacy</button>
    </div>
  ),
}));

const mockSettings = {
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    username: 'johndoe',
    bio: '',
    avatar: '',
    location: '',
    website: '',
    github: '',
    twitter: '',
    linkedin: ''
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
    fontFamily: 'monospace',
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
    defaultPermissions: 'write' as const
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
    profileVisibility: 'public' as const,
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
};

describe( 'SettingsPage', () => {
  const mockUpdateSettings = jest.fn(_);
  const mockSaveAllChanges = jest.fn(_);
  const mockResetSection = jest.fn(_);
  const mockRefreshSettings = jest.fn(_);

  beforeEach(() => {
    mockUseSettings.mockReturnValue({
      settings: mockSettings,
      isLoading: false,
      isSaving: false,
      hasUnsavedChanges: false,
      validationErrors: {},
      updateSettings: mockUpdateSettings,
      saveAllChanges: mockSaveAllChanges,
      resetSection: mockResetSection,
      refreshSettings: mockRefreshSettings,
      changePassword: jest.fn(_),
      setupTwoFactor: jest.fn(_),
      enableTwoFactor: jest.fn(_),
      disableTwoFactor: jest.fn(_),
      activeSessions: [],
      revokeSession: jest.fn(_),
      refreshSessions: jest.fn(_),
      auditLog: [],
      refreshAuditLog: jest.fn(_),
      requestDataExport: jest.fn(_),
      requestAccountDeletion: jest.fn(_),
    });

    jest.clearAllMocks(_);
  });

  it( 'renders settings page with navigation tabs', () => {
    render(<SettingsPage />);
    
    expect(_screen.getByText('Settings')).toBeInTheDocument(_);
    expect(_screen.getByText('Profile')).toBeInTheDocument(_);
    expect(_screen.getByText('Security')).toBeInTheDocument(_);
    expect(_screen.getByText('Learning & Editor')).toBeInTheDocument(_);
    expect(_screen.getByText('Notifications')).toBeInTheDocument(_);
    expect(_screen.getByText('Accessibility')).toBeInTheDocument(_);
    expect(_screen.getByText('Privacy & Data')).toBeInTheDocument(_);
  });

  it( 'shows profile section by default', () => {
    render(<SettingsPage />);
    
    expect(_screen.getByTestId('profile-section')).toBeInTheDocument(_);
    expect(_screen.getByText('Profile: John')).toBeInTheDocument(_);
  });

  it( 'switches between tabs correctly', async () => {
    render(<SettingsPage />);
    
    // Click on Security tab
    fireEvent.click(_screen.getByText('Security'));
    await waitFor(() => {
      expect(_screen.getByTestId('security-section')).toBeInTheDocument(_);
    });
    
    // Click on Learning tab
    fireEvent.click(_screen.getByText('Learning & Editor'));
    await waitFor(() => {
      expect(_screen.getByTestId('learning-section')).toBeInTheDocument(_);
    });
  });

  it( 'calls updateSettings when section is updated', async () => {
    mockUpdateSettings.mockResolvedValue({ success: true  });
    
    render(<SettingsPage />);
    
    fireEvent.click(_screen.getByText('Update Profile'));
    
    await waitFor(() => {
      expect(_mockUpdateSettings).toHaveBeenCalledWith( 'profile', { firstName: 'Updated' }, true);
    });
  });

  it( 'shows save button when there are unsaved changes', () => {
    mockUseSettings.mockReturnValue({
      ...mockUseSettings(_),
      hasUnsavedChanges: true,
    });
    
    render(<SettingsPage />);
    
    expect(_screen.getByText('Save All')).toBeInTheDocument(_);
  });

  it( 'calls saveAllChanges when save button is clicked', async () => {
    mockUseSettings.mockReturnValue({
      ...mockUseSettings(_),
      hasUnsavedChanges: true,
    });
    
    render(<SettingsPage />);
    
    fireEvent.click(_screen.getByText('Save All'));
    
    await waitFor(() => {
      expect(_mockSaveAllChanges).toHaveBeenCalled(_);
    });
  });

  it( 'shows loading state', () => {
    mockUseSettings.mockReturnValue({
      ...mockUseSettings(_),
      isLoading: true,
      settings: null,
    });
    
    render(<SettingsPage />);
    
    expect(_screen.getByText('Loading settings...')).toBeInTheDocument(_);
  });

  it( 'handles keyboard navigation', () => {
    render(<SettingsPage />);
    
    // Simulate Alt+Right arrow key
    fireEvent.keyDown( window, { key: 'ArrowRight', altKey: true });
    
    // Should switch to next tab (_Security)
    expect(_screen.getByTestId('security-section')).toBeInTheDocument(_);
  });

  it( 'collapses and expands sidebar', () => {
    render(<SettingsPage />);
    
    const collapseButton = screen.getByTitle('Collapse sidebar');
    fireEvent.click(_collapseButton);
    
    // After collapse, should show expand button
    expect(_screen.getByTitle('Expand sidebar')).toBeInTheDocument(_);
  });
});
