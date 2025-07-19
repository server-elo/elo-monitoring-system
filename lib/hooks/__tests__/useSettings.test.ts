import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettings } from '../useSettings';

// Mock timers
jest.useFakeTimers();

describe('useSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('loads settings on mount', async () => {
    const { result } = renderHook(() => useSettings());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.settings).toBe(null);
    
    // Fast-forward timers to complete loading
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.settings).toBeTruthy();
    });
  });

  it('updates settings correctly', async () => {
    const { result } = renderHook(() => useSettings());
    
    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.settings).toBeTruthy();
    });
    
    // Update profile settings
    await act(async () => {
      await result.current.updateSettings('profile', { firstName: 'Jane' });
    });
    
    expect(result.current.settings?.profile.firstName).toBe('Jane');
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('auto-saves after delay', async () => {
    const { result } = renderHook(() => useSettings());
    
    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.settings).toBeTruthy();
    });
    
    // Update settings
    await act(async () => {
      await result.current.updateSettings('profile', { firstName: 'Jane' });
    });
    
    expect(result.current.hasUnsavedChanges).toBe(true);
    
    // Fast-forward auto-save timer
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  it('saves all changes immediately when requested', async () => {
    const { result } = renderHook(() => useSettings());
    
    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.settings).toBeTruthy();
    });
    
    // Update settings
    await act(async () => {
      await result.current.updateSettings('profile', { firstName: 'Jane' });
    });
    
    expect(result.current.hasUnsavedChanges).toBe(true);
    
    // Save immediately
    await act(async () => {
      await result.current.saveAllChanges();
    });
    
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('resets section to original values', async () => {
    const { result } = renderHook(() => useSettings());
    
    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.settings).toBeTruthy();
    });
    
    const originalFirstName = result.current.settings?.profile.firstName;
    
    // Update settings
    await act(async () => {
      await result.current.updateSettings('profile', { firstName: 'Jane' });
    });
    
    expect(result.current.settings?.profile.firstName).toBe('Jane');
    
    // Reset section
    await act(async () => {
      await result.current.resetSection('profile');
    });
    
    expect(result.current.settings?.profile.firstName).toBe(originalFirstName);
  });

  it('refreshes settings from server', async () => {
    const { result } = renderHook(() => useSettings());
    
    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.settings).toBeTruthy();
    });
    
    // Make local changes
    await act(async () => {
      await result.current.updateSettings('profile', { firstName: 'Jane' });
    });
    
    expect(result.current.hasUnsavedChanges).toBe(true);
    
    // Refresh settings
    await act(async () => {
      result.current.refreshSettings();
      jest.advanceTimersByTime(500);
    });
    
    await waitFor(() => {
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  it('handles password change', async () => {
    const { result } = renderHook(() => useSettings());
    
    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.settings).toBeTruthy();
    });
    
    // Change password with correct current password
    let changeResult;
    await act(async () => {
      changeResult = await result.current.changePassword('current123', 'newpassword123');
    });
    
    expect(changeResult).toEqual({ success: true });
    
    // Change password with incorrect current password
    await act(async () => {
      changeResult = await result.current.changePassword('wrong', 'newpassword123');
    });
    
    expect(changeResult).toEqual({ 
      success: false, 
      error: 'Current password is incorrect' 
    });
  });

  it('handles two-factor authentication setup', async () => {
    const { result } = renderHook(() => useSettings());
    
    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.settings).toBeTruthy();
    });
    
    // Setup 2FA
    let setupResult;
    await act(async () => {
      setupResult = await result.current.setupTwoFactor();
      jest.advanceTimersByTime(1000);
    });
    
    expect(setupResult).toEqual({
      success: true,
      setup: expect.objectContaining({
        secret: expect.any(String),
        qrCode: expect.any(String),
        backupCodes: expect.any(Array)
      })
    });
  });

  it('enables two-factor authentication', async () => {
    const { result } = renderHook(() => useSettings());
    
    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.settings).toBeTruthy();
    });
    
    expect(result.current.settings?.security.twoFactorEnabled).toBe(false);
    
    // Enable 2FA with correct code
    let enableResult;
    await act(async () => {
      enableResult = await result.current.enableTwoFactor('123456', 'TESTSECRET');
      jest.advanceTimersByTime(1000);
    });
    
    expect(enableResult).toEqual({
      success: true,
      backupCodes: expect.any(Array)
    });
    
    expect(result.current.settings?.security.twoFactorEnabled).toBe(true);
  });

  it('disables two-factor authentication', async () => {
    const { result } = renderHook(() => useSettings());
    
    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.settings).toBeTruthy();
    });
    
    // First enable 2FA
    await act(async () => {
      await result.current.enableTwoFactor('123456', 'TESTSECRET');
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.settings?.security.twoFactorEnabled).toBe(true);
    
    // Then disable it
    let disableResult;
    await act(async () => {
      disableResult = await result.current.disableTwoFactor('123456');
      jest.advanceTimersByTime(1000);
    });
    
    expect(disableResult).toEqual({ success: true });
    expect(result.current.settings?.security.twoFactorEnabled).toBe(false);
  });

  it('manages active sessions', async () => {
    const { result } = renderHook(() => useSettings());
    
    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.activeSessions).toHaveLength(2);
    });
    
    // Revoke a session
    await act(async () => {
      await result.current.revokeSession('2');
      jest.advanceTimersByTime(500);
    });
    
    expect(result.current.activeSessions).toHaveLength(1);
    expect(result.current.activeSessions[0].id).toBe('1');
  });

  it('refreshes sessions', async () => {
    const { result } = renderHook(() => useSettings());
    
    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.activeSessions).toHaveLength(2);
    });
    
    // Refresh sessions
    await act(async () => {
      result.current.refreshSessions();
      jest.advanceTimersByTime(500);
    });
    
    // Should still have sessions (mock data doesn't change)
    expect(result.current.activeSessions).toHaveLength(2);
  });

  it('handles data export request', async () => {
    const { result } = renderHook(() => useSettings());
    
    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.settings).toBeTruthy();
    });
    
    // Request data export
    let exportResult;
    await act(async () => {
      exportResult = await result.current.requestDataExport();
      jest.advanceTimersByTime(2000);
    });
    
    expect(exportResult).toEqual({
      success: true,
      downloadUrl: expect.stringContaining('export')
    });
  });

  it('handles account deletion request', async () => {
    const { result } = renderHook(() => useSettings());
    
    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.settings).toBeTruthy();
    });
    
    // Request account deletion
    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.requestAccountDeletion();
      jest.advanceTimersByTime(2000);
    });
    
    expect(deleteResult).toEqual({ success: true });
  });
});
