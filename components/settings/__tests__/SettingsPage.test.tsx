;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPage } from '../SettingsPage';
import { useSettings } from '@/lib/hooks/useSettings';

// Mock the useSettings hook
jest.mock('@/lib/hooks/useSettings');
const mockUseSettings = useSettings as jest.MockedFunction<typeof useSettings>;

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock components
jest.mock('../ProfileSection', () => ({
  ProfileSection: ({ profile, onUpdate }: any) => (
    <div data-testid="profile-section">
      <span>Profile: {profile?.firstName}</span>
      <button onClick={() => onUpdate({ firstName: 'Updated' })}>Update Profile</button>
    </div>
  ),
}));

jest.mock('../SecuritySection', () => ({
  SecuritySection: ({ security, onUpdateSecurity }: any) => (
    <div data-testid="security-section">
      <span>2FA: {security?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
      <button onClick={() => onUpdateSecurity({ twoFactorEnabled: true })}>Enable 2FA</button>
    </div>
  ),
}));

jest.mock('../LearningPreferencesSection', () => ({
  LearningPreferencesSection: ({ learning, onUpdateLearning }: any) => (
    <div data-testid="learning-section">
      <span>Difficulty: {learning?.difficulty}</span>
      <button onClick={() => onUpdateLearning({ difficulty: 'advanced' })}>Update Learning</button>
    </div>
  ),
}));

jest.mock('../NotificationSection', () => ({
  NotificationSection: ({ notifications, onUpdate }: any) => (
    <div data-testid="notification-section">
      <span>Email: {notifications?.email?.courseUpdates ? 'On' : 'Off'}</span>
      <button onClick={() => onUpdate({ email: { courseUpdates: false } })}>Update Notifications</button>
    </div>
  ),
}));

jest.mock('../AccessibilitySection', () => ({
  AccessibilitySection: ({ accessibility, onUpdate }: any) => (
    <div data-testid="accessibility-section">
      <span>Font Size: {accessibility?.fontSize}px</span>
      <button onClick={() => onUpdate({ fontSize: 18 })}>Update Accessibility</button>
    </div>
  ),
}));

jest.mock('../PrivacySection', () => ({
  PrivacySection: ({ privacy, onUpdate }: any) => (
    <div data-testid="privacy-section">
      <span>Profile: {privacy?.profileVisibility}</span>
      <button onClick={() => onUpdate({ profileVisibility: 'private' })}>Update Privacy</button>
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

describe('SettingsPage', () => {
  const mockUpdateSettings = jest.fn();
  const mockSaveAllChanges = jest.fn();
  const mockResetSection = jest.fn();
  const mockRefreshSettings = jest.fn();

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
      changePassword: jest.fn(),
      setupTwoFactor: jest.fn(),
      enableTwoFactor: jest.fn(),
      disableTwoFactor: jest.fn(),
      activeSessions: [],
      revokeSession: jest.fn(),
      refreshSessions: jest.fn(),
      auditLog: [],
      refreshAuditLog: jest.fn(),
      requestDataExport: jest.fn(),
      requestAccountDeletion: jest.fn(),
    });

    jest.clearAllMocks();
  });

  it('renders settings page with navigation tabs', () => {
    render(<SettingsPage />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Learning & Editor')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
    expect(screen.getByText('Privacy & Data')).toBeInTheDocument();
  });

  it('shows profile section by default', () => {
    render(<SettingsPage />);
    
    expect(screen.getByTestId('profile-section')).toBeInTheDocument();
    expect(screen.getByText('Profile: John')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(<SettingsPage />);
    
    // Click on Security tab
    fireEvent.click(screen.getByText('Security'));
    await waitFor(() => {
      expect(screen.getByTestId('security-section')).toBeInTheDocument();
    });
    
    // Click on Learning tab
    fireEvent.click(screen.getByText('Learning & Editor'));
    await waitFor(() => {
      expect(screen.getByTestId('learning-section')).toBeInTheDocument();
    });
  });

  it('calls updateSettings when section is updated', async () => {
    mockUpdateSettings.mockResolvedValue({ success: true });
    
    render(<SettingsPage />);
    
    fireEvent.click(screen.getByText('Update Profile'));
    
    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith('profile', { firstName: 'Updated' }, true);
    });
  });

  it('shows save button when there are unsaved changes', () => {
    mockUseSettings.mockReturnValue({
      ...mockUseSettings(),
      hasUnsavedChanges: true,
    });
    
    render(<SettingsPage />);
    
    expect(screen.getByText('Save All')).toBeInTheDocument();
  });

  it('calls saveAllChanges when save button is clicked', async () => {
    mockUseSettings.mockReturnValue({
      ...mockUseSettings(),
      hasUnsavedChanges: true,
    });
    
    render(<SettingsPage />);
    
    fireEvent.click(screen.getByText('Save All'));
    
    await waitFor(() => {
      expect(mockSaveAllChanges).toHaveBeenCalled();
    });
  });

  it('shows loading state', () => {
    mockUseSettings.mockReturnValue({
      ...mockUseSettings(),
      isLoading: true,
      settings: null,
    });
    
    render(<SettingsPage />);
    
    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(<SettingsPage />);
    
    // Simulate Alt+Right arrow key
    fireEvent.keyDown(window, { key: 'ArrowRight', altKey: true });
    
    // Should switch to next tab (Security)
    expect(screen.getByTestId('security-section')).toBeInTheDocument();
  });

  it('collapses and expands sidebar', () => {
    render(<SettingsPage />);
    
    const collapseButton = screen.getByTitle('Collapse sidebar');
    fireEvent.click(collapseButton);
    
    // After collapse, should show expand button
    expect(screen.getByTitle('Expand sidebar')).toBeInTheDocument();
  });
});
