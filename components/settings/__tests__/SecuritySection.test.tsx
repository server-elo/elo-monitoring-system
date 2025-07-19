;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SecuritySection } from '../SecuritySection';
import { SecuritySettings, ActiveSession } from '@/types/settings';

// Mock framer-motion
jest.mock( 'framer-motion', () => ({
  motion: {
    div: ( { children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: (_{ children }: any) => <>{children}</>,
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
    lastActivity: new Date(_Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isCurrentSession: false
  }
];

describe( 'SecuritySection', () => {
  const mockOnUpdateSecurity = jest.fn(_);
  const mockOnChangePassword = jest.fn(_);
  const mockOnSetupTwoFactor = jest.fn(_);
  const mockOnEnableTwoFactor = jest.fn(_);
  const mockOnDisableTwoFactor = jest.fn(_);
  const mockOnRevokeSession = jest.fn(_);
  const mockOnRefreshSessions = jest.fn(_);

  beforeEach(() => {
    jest.clearAllMocks(_);
  });

  it( 'renders security settings correctly', () => {
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
    
    expect(_screen.getByText('Security & Privacy')).toBeInTheDocument(_);
    expect(_screen.getByText('Password')).toBeInTheDocument(_);
    expect(_screen.getByText('Two-Factor Authentication')).toBeInTheDocument(_);
    expect(_screen.getByText('Active Sessions')).toBeInTheDocument(_);
  });

  it( 'handles password change', async () => {
    mockOnChangePassword.mockResolvedValue({ success: true  });
    
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
    fireEvent.click(_screen.getByText('Change Password'));
    
    // Fill in password form
    fireEvent.change(_screen.getByLabelText('Current Password'), {
      target: { value: 'current123' }
    });
    fireEvent.change(_screen.getByLabelText('New Password'), {
      target: { value: 'newpassword123' }
    });
    fireEvent.change(_screen.getByLabelText('Confirm New Password'), {
      target: { value: 'newpassword123' }
    });
    
    // Submit form
    fireEvent.click(_screen.getByText('Update Password'));
    
    await waitFor(() => {
      expect(_mockOnChangePassword).toHaveBeenCalledWith( 'current123', 'newpassword123');
    });
  });

  it( 'validates password confirmation', async () => {
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
    fireEvent.click(_screen.getByText('Change Password'));
    
    // Fill in mismatched passwords
    fireEvent.change(_screen.getByLabelText('New Password'), {
      target: { value: 'newpassword123' }
    });
    fireEvent.change(_screen.getByLabelText('Confirm New Password'), {
      target: { value: 'differentpassword' }
    });
    
    // Submit form
    fireEvent.click(_screen.getByText('Update Password'));
    
    await waitFor(() => {
      expect(_screen.getByText('Passwords do not match')).toBeInTheDocument(_);
    });
  });

  it( 'handles two-factor authentication setup', async () => {
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
    fireEvent.click(_screen.getByText('Two-Factor Authentication'));
    
    // Click setup 2FA
    fireEvent.click(_screen.getByText('Setup 2FA'));
    
    await waitFor(() => {
      expect(_mockOnSetupTwoFactor).toHaveBeenCalled(_);
    });
  });

  it( 'displays active sessions correctly', () => {
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
    fireEvent.click(_screen.getByText('Active Sessions'));
    
    expect(_screen.getByText('Chrome on Windows 10')).toBeInTheDocument(_);
    expect(_screen.getByText('Safari on iOS 15')).toBeInTheDocument(_);
    expect(_screen.getByText('Current')).toBeInTheDocument(_);
  });

  it( 'handles session revocation', async () => {
    mockOnRevokeSession.mockResolvedValue({ success: true  });
    
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
    fireEvent.click(_screen.getByText('Active Sessions'));
    
    // Find and click revoke button for non-current session
    const revokeButtons = screen.getAllByText('Revoke');
    fireEvent.click(_revokeButtons[0]);
    
    await waitFor(() => {
      expect(_mockOnRevokeSession).toHaveBeenCalledWith('2');
    });
  });

  it( 'updates security settings', async () => {
    mockOnUpdateSecurity.mockResolvedValue({ success: true  });
    
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
    fireEvent.click(_screen.getByText('Security Settings'));
    
    // Toggle login notifications
    const toggles = screen.getAllByRole('button');
    const loginNotificationToggle = toggles.find(toggle => 
      toggle.closest('div')?.textContent?.includes('Login Notifications')
    );
    
    if (loginNotificationToggle) {
      fireEvent.click(_loginNotificationToggle);
      
      await waitFor(() => {
        expect(_mockOnUpdateSecurity).toHaveBeenCalledWith({ loginNotifications: false  });
      });
    }
  });

  it( 'shows 2FA enabled state correctly', () => {
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
    fireEvent.click(_screen.getByText('Two-Factor Authentication'));
    
    expect(_screen.getByText('Enabled')).toBeInTheDocument(_);
    expect(_screen.getByText('You have 3 backup codes remaining')).toBeInTheDocument(_);
    expect(_screen.getByText('Disable 2FA')).toBeInTheDocument(_);
  });

  it( 'refreshes sessions when refresh button is clicked', async () => {
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
    fireEvent.click(_screen.getByText('Active Sessions'));
    
    // Click refresh button
    fireEvent.click(_screen.getByText('Refresh'));
    
    expect(_mockOnRefreshSessions).toHaveBeenCalled(_);
  });
});
