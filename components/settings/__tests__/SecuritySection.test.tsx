;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SecuritySection } from '../SecuritySection';
import { SecuritySettings, ActiveSession } from '@/types/settings';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockSecurity: SecuritySettings = {
  twoFactorEnabled: false,
  backupCodes: [],
  loginNotifications: true,
  suspiciousActivityAlerts: true,
  sessionTimeout: 60
};

const mockActiveSessions: ActiveSession[] = [
  {
    id: '1',
    deviceInfo: {
      browser: 'Chrome',
      os: 'Windows 10',
      device: 'Desktop'
    },
    location: {
      ip: '192.168.1.100',
      city: 'San Francisco',
      country: 'United States'
    },
    lastActivity: new Date().toISOString(),
    isCurrentSession: true
  },
  {
    id: '2',
    deviceInfo: {
      browser: 'Safari',
      os: 'iOS 15',
      device: 'iPhone'
    },
    location: {
      ip: '10.0.0.50',
      city: 'San Francisco',
      country: 'United States'
    },
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isCurrentSession: false
  }
];

describe('SecuritySection', () => {
  const mockOnUpdateSecurity = jest.fn();
  const mockOnChangePassword = jest.fn();
  const mockOnSetupTwoFactor = jest.fn();
  const mockOnEnableTwoFactor = jest.fn();
  const mockOnDisableTwoFactor = jest.fn();
  const mockOnRevokeSession = jest.fn();
  const mockOnRefreshSessions = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders security settings correctly', () => {
    render(
      <SecuritySection
        security={mockSecurity}
        activeSessions={mockActiveSessions}
        onUpdateSecurity={mockOnUpdateSecurity}
        onChangePassword={mockOnChangePassword}
        onSetupTwoFactor={mockOnSetupTwoFactor}
        onEnableTwoFactor={mockOnEnableTwoFactor}
        onDisableTwoFactor={mockOnDisableTwoFactor}
        onRevokeSession={mockOnRevokeSession}
        onRefreshSessions={mockOnRefreshSessions}
      />
    );
    
    expect(screen.getByText('Security & Privacy')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByText('Active Sessions')).toBeInTheDocument();
  });

  it('handles password change', async () => {
    mockOnChangePassword.mockResolvedValue({ success: true });
    
    render(
      <SecuritySection
        security={mockSecurity}
        activeSessions={mockActiveSessions}
        onUpdateSecurity={mockOnUpdateSecurity}
        onChangePassword={mockOnChangePassword}
        onSetupTwoFactor={mockOnSetupTwoFactor}
        onEnableTwoFactor={mockOnEnableTwoFactor}
        onDisableTwoFactor={mockOnDisableTwoFactor}
        onRevokeSession={mockOnRevokeSession}
        onRefreshSessions={mockOnRefreshSessions}
      />
    );
    
    // Click change password button
    fireEvent.click(screen.getByText('Change Password'));
    
    // Fill in password form
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'current123' }
    });
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'newpassword123' }
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'newpassword123' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Update Password'));
    
    await waitFor(() => {
      expect(mockOnChangePassword).toHaveBeenCalledWith('current123', 'newpassword123');
    });
  });

  it('validates password confirmation', async () => {
    render(
      <SecuritySection
        security={mockSecurity}
        activeSessions={mockActiveSessions}
        onUpdateSecurity={mockOnUpdateSecurity}
        onChangePassword={mockOnChangePassword}
        onSetupTwoFactor={mockOnSetupTwoFactor}
        onEnableTwoFactor={mockOnEnableTwoFactor}
        onDisableTwoFactor={mockOnDisableTwoFactor}
        onRevokeSession={mockOnRevokeSession}
        onRefreshSessions={mockOnRefreshSessions}
      />
    );
    
    // Click change password button
    fireEvent.click(screen.getByText('Change Password'));
    
    // Fill in mismatched passwords
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'newpassword123' }
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'differentpassword' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Update Password'));
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('handles two-factor authentication setup', async () => {
    mockOnSetupTwoFactor.mockResolvedValue({
      success: true,
      setup: {
        secret: 'TESTSECRET',
        qrCode: 'data:image/png;base64,test',
        backupCodes: ['123456', '789012']
      }
    });
    
    render(
      <SecuritySection
        security={mockSecurity}
        activeSessions={mockActiveSessions}
        onUpdateSecurity={mockOnUpdateSecurity}
        onChangePassword={mockOnChangePassword}
        onSetupTwoFactor={mockOnSetupTwoFactor}
        onEnableTwoFactor={mockOnEnableTwoFactor}
        onDisableTwoFactor={mockOnDisableTwoFactor}
        onRevokeSession={mockOnRevokeSession}
        onRefreshSessions={mockOnRefreshSessions}
      />
    );
    
    // Switch to 2FA tab
    fireEvent.click(screen.getByText('Two-Factor Authentication'));
    
    // Click setup 2FA
    fireEvent.click(screen.getByText('Setup 2FA'));
    
    await waitFor(() => {
      expect(mockOnSetupTwoFactor).toHaveBeenCalled();
    });
  });

  it('displays active sessions correctly', () => {
    render(
      <SecuritySection
        security={mockSecurity}
        activeSessions={mockActiveSessions}
        onUpdateSecurity={mockOnUpdateSecurity}
        onChangePassword={mockOnChangePassword}
        onSetupTwoFactor={mockOnSetupTwoFactor}
        onEnableTwoFactor={mockOnEnableTwoFactor}
        onDisableTwoFactor={mockOnDisableTwoFactor}
        onRevokeSession={mockOnRevokeSession}
        onRefreshSessions={mockOnRefreshSessions}
      />
    );
    
    // Switch to sessions tab
    fireEvent.click(screen.getByText('Active Sessions'));
    
    expect(screen.getByText('Chrome on Windows 10')).toBeInTheDocument();
    expect(screen.getByText('Safari on iOS 15')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('handles session revocation', async () => {
    mockOnRevokeSession.mockResolvedValue({ success: true });
    
    render(
      <SecuritySection
        security={mockSecurity}
        activeSessions={mockActiveSessions}
        onUpdateSecurity={mockOnUpdateSecurity}
        onChangePassword={mockOnChangePassword}
        onSetupTwoFactor={mockOnSetupTwoFactor}
        onEnableTwoFactor={mockOnEnableTwoFactor}
        onDisableTwoFactor={mockOnDisableTwoFactor}
        onRevokeSession={mockOnRevokeSession}
        onRefreshSessions={mockOnRefreshSessions}
      />
    );
    
    // Switch to sessions tab
    fireEvent.click(screen.getByText('Active Sessions'));
    
    // Find and click revoke button for non-current session
    const revokeButtons = screen.getAllByText('Revoke');
    fireEvent.click(revokeButtons[0]);
    
    await waitFor(() => {
      expect(mockOnRevokeSession).toHaveBeenCalledWith('2');
    });
  });

  it('updates security settings', async () => {
    mockOnUpdateSecurity.mockResolvedValue({ success: true });
    
    render(
      <SecuritySection
        security={mockSecurity}
        activeSessions={mockActiveSessions}
        onUpdateSecurity={mockOnUpdateSecurity}
        onChangePassword={mockOnChangePassword}
        onSetupTwoFactor={mockOnSetupTwoFactor}
        onEnableTwoFactor={mockOnEnableTwoFactor}
        onDisableTwoFactor={mockOnDisableTwoFactor}
        onRevokeSession={mockOnRevokeSession}
        onRefreshSessions={mockOnRefreshSessions}
      />
    );
    
    // Switch to settings tab
    fireEvent.click(screen.getByText('Security Settings'));
    
    // Toggle login notifications
    const toggles = screen.getAllByRole('button');
    const loginNotificationToggle = toggles.find(toggle => 
      toggle.closest('div')?.textContent?.includes('Login Notifications')
    );
    
    if (loginNotificationToggle) {
      fireEvent.click(loginNotificationToggle);
      
      await waitFor(() => {
        expect(mockOnUpdateSecurity).toHaveBeenCalledWith({ loginNotifications: false });
      });
    }
  });

  it('shows 2FA enabled state correctly', () => {
    const securityWith2FA = {
      ...mockSecurity,
      twoFactorEnabled: true,
      backupCodes: ['123456', '789012', '345678']
    };
    
    render(
      <SecuritySection
        security={securityWith2FA}
        activeSessions={mockActiveSessions}
        onUpdateSecurity={mockOnUpdateSecurity}
        onChangePassword={mockOnChangePassword}
        onSetupTwoFactor={mockOnSetupTwoFactor}
        onEnableTwoFactor={mockOnEnableTwoFactor}
        onDisableTwoFactor={mockOnDisableTwoFactor}
        onRevokeSession={mockOnRevokeSession}
        onRefreshSessions={mockOnRefreshSessions}
      />
    );
    
    // Switch to 2FA tab
    fireEvent.click(screen.getByText('Two-Factor Authentication'));
    
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('You have 3 backup codes remaining')).toBeInTheDocument();
    expect(screen.getByText('Disable 2FA')).toBeInTheDocument();
  });

  it('refreshes sessions when refresh button is clicked', async () => {
    render(
      <SecuritySection
        security={mockSecurity}
        activeSessions={mockActiveSessions}
        onUpdateSecurity={mockOnUpdateSecurity}
        onChangePassword={mockOnChangePassword}
        onSetupTwoFactor={mockOnSetupTwoFactor}
        onEnableTwoFactor={mockOnEnableTwoFactor}
        onDisableTwoFactor={mockOnDisableTwoFactor}
        onRevokeSession={mockOnRevokeSession}
        onRefreshSessions={mockOnRefreshSessions}
      />
    );
    
    // Switch to sessions tab
    fireEvent.click(screen.getByText('Active Sessions'));
    
    // Click refresh button
    fireEvent.click(screen.getByText('Refresh'));
    
    expect(mockOnRefreshSessions).toHaveBeenCalled();
  });
});
