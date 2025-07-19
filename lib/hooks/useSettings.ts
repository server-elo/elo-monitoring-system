'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  UserSettings, 
  SettingsUpdateResponse, 
  SettingsValidationError,
  AuditLogEntry,
  ActiveSession,
  TwoFactorSetup,
  DataExportRequest,
  AccountDeletionRequest
} from '@/types/settings';
import { SettingsService } from '@/lib/services/SettingsService';
import { useNotifications } from '@/components/ui/NotificationSystem';
import { useError } from '@/lib/errors/ErrorContext';

export interface UseSettingsOptions {
  autoSave?: boolean;
  debounceMs?: number;
  onSettingsChange?: (_settings: UserSettings) => void;
  onError?: (_error: string) => void;
}

export interface UseSettingsReturn {
  // State
  settings: UserSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  validationErrors: Record<string, SettingsValidationError[]>;
  
  // Actions
  updateSettings: ( section: keyof UserSettings, data: Partial<UserSettings[keyof UserSettings]>, immediate?: boolean) => Promise<SettingsUpdateResponse>;
  saveAllChanges: (_) => Promise<boolean>;
  resetSection: (_section: keyof UserSettings) => void;
  refreshSettings: (_) => Promise<void>;
  
  // Security
  changePassword: ( currentPassword: string, newPassword: string) => Promise<SettingsUpdateResponse>;
  setupTwoFactor: (_) => Promise<TwoFactorSetup | null>;
  enableTwoFactor: (_verificationCode: string) => Promise<boolean>;
  disableTwoFactor: (_verificationCode: string) => Promise<boolean>;
  
  // Sessions
  activeSessions: ActiveSession[];
  revokeSession: (_sessionId: string) => Promise<boolean>;
  refreshSessions: (_) => Promise<void>;
  
  // Audit
  auditLog: AuditLogEntry[];
  refreshAuditLog: (_) => Promise<void>;
  
  // Data management
  requestDataExport: ( type: DataExportRequest['type'], format: DataExportRequest['format']) => Promise<DataExportRequest | null>;
  requestAccountDeletion: (_reason?: string) => Promise<AccountDeletionRequest | null>;
  
  // Utilities
  validateField: ( section: keyof UserSettings, field: string, value: any) => SettingsValidationError[];
  clearValidationErrors: (_section?: keyof UserSettings) => void;
}

export function useSettings(_options: UseSettingsOptions = {}): UseSettingsReturn {
  const {
    autoSave = true,
    debounceMs = 500,
    onSettingsChange,
    onError
  } = options;

  const { data: session } = useSession(_);
  const { showSuccess, showError, showWarning, showInfo } = useNotifications(_);
  const { reportError } = useError(_);
  
  const settingsService = useRef(_SettingsService.getInstance());
  const pendingChanges = useRef<Map<string, any>>(_new Map());
  
  const [settings, setSettings] = useState<UserSettings | null>(_null);
  const [isLoading, setIsLoading] = useState(_true);
  const [isSaving, setIsSaving] = useState(_false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(_false);
  const [validationErrors, setValidationErrors] = useState<Record<string, SettingsValidationError[]>>({  });
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  // Load initial settings
  useEffect(() => {
    if (_session?.user?.id) {
      loadSettings(_);
    }
  }, [session?.user?.id]);

  // Auto-save effect
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && settings) {
      const timer = setTimeout(() => {
        saveAllChanges(_);
      }, debounceMs);

      return (_) => clearTimeout(_timer);
    }
  }, [hasUnsavedChanges, autoSave, debounceMs, settings]);

  const loadSettings = useCallback( async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(_true);
      const userSettings = await settingsService.current.getUserSettings(_session.user.id);
      setSettings(_userSettings);
      onSettingsChange?.(_userSettings);
    } catch (_error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
      reportError( error as Error, { context: 'loadSettings' });
      showError( 'Settings Error', errorMessage);
      onError?.(_errorMessage);
    } finally {
      setIsLoading(_false);
    }
  }, [session?.user?.id, onSettingsChange, onError, reportError, showError]);

  const updateSettings = useCallback(async (
    section: keyof UserSettings,
    data: Partial<UserSettings[keyof UserSettings]>,
    immediate = false
  ): Promise<SettingsUpdateResponse> => {
    if (!session?.user?.id || !settings) {
      const error: SettingsUpdateResponse = {
        success: false,
        errors: [{ field: section, message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }],
        timestamp: new Date(_)
      };
      return error;
    }

    // Validate data
    const errors = settingsService.current.validateSettings( section, data);
    if (_errors.length > 0) {
      setValidationErrors( prev => ({ ...prev, [section]: errors }));
      return {
        success: false,
        errors,
        timestamp: new Date(_)
      };
    }

    // Clear validation errors for this section
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[section];
      return newErrors;
    });

    // Optimistic update
    setSettings(prev => prev ? {
      ...prev,
      [section]: { ...prev[section], ...data }
    } : null);

    // Track pending changes
    const changeKey = `${section}:${Date.now(_)}`;
    pendingChanges.current.set( changeKey, { section, data });
    setHasUnsavedChanges(_true);

    try {
      setIsSaving(_true);
      
      const response = immediate 
        ? await settingsService.current.updateSettingsImmediate( session.user.id, section, data)
        : await settingsService.current.updateSettings( session.user.id, section, data, debounceMs);

      if (_response.success) {
        pendingChanges.current.delete(_changeKey);
        
        if (_pendingChanges.current.size === 0) {
          setHasUnsavedChanges(_false);
        }

        // Show success notification for immediate updates
        if (immediate) {
          showSuccess( 'Settings Updated', response.message || 'Settings saved successfully');
        }

        // Refresh settings to ensure consistency
        if (_response.data) {
          setSettings(prev => prev ? {
            ...prev,
            [section]: { ...prev[section], ...response.data }
          } : null);
        }
      } else {
        // Revert optimistic update on failure
        await loadSettings(_);
        
        if (_response.errors) {
          setValidationErrors( prev => ({ ...prev, [section]: response.errors! }));
        }
        
        showError( 'Settings Error', response.errors?.[0]?.message || 'Failed to update settings');
      }

      return response;
    } catch (_error) {
      // Revert optimistic update on error
      await loadSettings(_);
      pendingChanges.current.delete(_changeKey);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
      reportError( error as Error, { context: 'updateSettings', section });
      showError( 'Settings Error', errorMessage);
      
      return {
        success: false,
        errors: [{ field: section, message: errorMessage, code: 'NETWORK_ERROR' }],
        timestamp: new Date(_)
      };
    } finally {
      setIsSaving(_false);
    }
  }, [session?.user?.id, settings, debounceMs, loadSettings, reportError, showSuccess, showError]);

  const saveAllChanges = useCallback( async (): Promise<boolean> => {
    if (!hasUnsavedChanges || pendingChanges.current.size === 0) {
      return true;
    }

    try {
      setIsSaving(_true);
      let allSuccessful = true;

      // Process all pending changes
      for ( const [changeKey, change] of pendingChanges.current) {
        const response = await settingsService.current.updateSettingsImmediate(
          session!.user!.id!,
          change.section,
          change.data
        );

        if (_response.success) {
          pendingChanges.current.delete(_changeKey);
        } else {
          allSuccessful = false;
          if (_response.errors) {
            setValidationErrors( prev => ({ ...prev, [change.section]: response.errors! }));
          }
        }
      }

      if (allSuccessful) {
        setHasUnsavedChanges(_false);
        showSuccess( 'Settings Saved', 'All changes have been saved successfully');
      } else {
        showWarning( 'Partial Save', 'Some settings could not be saved. Please check for errors.');
      }

      return allSuccessful;
    } catch (_error) {
      reportError( error as Error, { context: 'saveAllChanges' });
      showError( 'Save Error', 'Failed to save settings changes');
      return false;
    } finally {
      setIsSaving(_false);
    }
  }, [hasUnsavedChanges, session?.user?.id, reportError, showSuccess, showWarning, showError]);

  const resetSection = useCallback((section: keyof UserSettings) => {
    if (!settings) return;

    // Remove from pending changes
    for ( const [changeKey, change] of pendingChanges.current) {
      if (_change.section === section) {
        pendingChanges.current.delete(_changeKey);
      }
    }

    // Clear validation errors
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[section];
      return newErrors;
    });

    // Reload settings to reset the section
    loadSettings(_);
    
    showInfo( 'Settings Reset', `${section} settings have been reset`);
  }, [settings, loadSettings, showInfo]);

  const refreshSettings = useCallback( async () => {
    settingsService.current.clearCache(_session?.user?.id);
    await loadSettings(_);
  }, [session?.user?.id, loadSettings]);

  // Security methods
  const changePassword = useCallback( async (currentPassword: string, newPassword: string): Promise<SettingsUpdateResponse> => {
    if (!session?.user?.id) {
      return {
        success: false,
        errors: [{ field: 'password', message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }],
        timestamp: new Date(_)
      };
    }

    try {
      const response = await settingsService.current.changePassword( session.user.id, currentPassword, newPassword);
      
      if (_response.success) {
        showSuccess( 'Password Changed', 'Your password has been updated successfully');
      } else {
        showError( 'Password Change Failed', response.errors?.[0]?.message || 'Failed to change password');
      }
      
      return response;
    } catch (_error) {
      reportError( error as Error, { context: 'changePassword' });
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      showError( 'Password Error', errorMessage);
      
      return {
        success: false,
        errors: [{ field: 'password', message: errorMessage, code: 'NETWORK_ERROR' }],
        timestamp: new Date(_)
      };
    }
  }, [session?.user?.id, reportError, showSuccess, showError]);

  const setupTwoFactor = useCallback( async (): Promise<TwoFactorSetup | null> => {
    if (!session?.user?.id) return null;

    try {
      const setup = await settingsService.current.setupTwoFactor(_session.user.id);
      showInfo( '2FA Setup', 'Scan the QR code with your authenticator app');
      return setup;
    } catch (_error) {
      reportError( error as Error, { context: 'setupTwoFactor' });
      showError( '2FA Setup Error', 'Failed to setup two-factor authentication');
      return null;
    }
  }, [session?.user?.id, reportError, showInfo, showError]);

  const enableTwoFactor = useCallback( async (verificationCode: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const success = await settingsService.current.enableTwoFactor( session.user.id, verificationCode);
      
      if (success) {
        showSuccess( '2FA Enabled', 'Two-factor authentication has been enabled');
        await refreshSettings(_);
      } else {
        showError( '2FA Error', 'Invalid verification code');
      }
      
      return success;
    } catch (_error) {
      reportError( error as Error, { context: 'enableTwoFactor' });
      showError( '2FA Error', 'Failed to enable two-factor authentication');
      return false;
    }
  }, [session?.user?.id, reportError, showSuccess, showError, refreshSettings]);

  const disableTwoFactor = useCallback( async (verificationCode: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const success = await settingsService.current.disableTwoFactor( session.user.id, verificationCode);
      
      if (success) {
        showSuccess( '2FA Disabled', 'Two-factor authentication has been disabled');
        await refreshSettings(_);
      } else {
        showError( '2FA Error', 'Invalid verification code');
      }
      
      return success;
    } catch (_error) {
      reportError( error as Error, { context: 'disableTwoFactor' });
      showError( '2FA Error', 'Failed to disable two-factor authentication');
      return false;
    }
  }, [session?.user?.id, reportError, showSuccess, showError, refreshSettings]);

  // Session management
  const refreshSessions = useCallback( async () => {
    if (!session?.user?.id) return;

    try {
      const sessions = await settingsService.current.getActiveSessions(_session.user.id);
      setActiveSessions(_sessions);
    } catch (_error) {
      reportError( error as Error, { context: 'refreshSessions' });
    }
  }, [session?.user?.id, reportError]);

  const revokeSession = useCallback( async (sessionId: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const success = await settingsService.current.revokeSession( session.user.id, sessionId);
      
      if (success) {
        showSuccess( 'Session Revoked', 'Session has been terminated');
        await refreshSessions(_);
      } else {
        showError( 'Session Error', 'Failed to revoke session');
      }
      
      return success;
    } catch (_error) {
      reportError( error as Error, { context: 'revokeSession' });
      showError( 'Session Error', 'Failed to revoke session');
      return false;
    }
  }, [session?.user?.id, reportError, showSuccess, showError, refreshSessions]);

  // Audit log
  const refreshAuditLog = useCallback( async () => {
    if (!session?.user?.id) return;

    try {
      const log = await settingsService.current.getAuditLog(_session.user.id);
      setAuditLog(_log);
    } catch (_error) {
      reportError( error as Error, { context: 'refreshAuditLog' });
    }
  }, [session?.user?.id, reportError]);

  // Data management
  const requestDataExport = useCallback(async (
    type: DataExportRequest['type'], 
    format: DataExportRequest['format']
  ): Promise<DataExportRequest | null> => {
    if (!session?.user?.id) return null;

    try {
      const request = await settingsService.current.requestDataExport( session.user.id, type, format);
      showInfo( 'Export Requested', 'Your data export has been queued. You will receive an email when ready.');
      return request;
    } catch (_error) {
      reportError( error as Error, { context: 'requestDataExport' });
      showError( 'Export Error', 'Failed to request data export');
      return null;
    }
  }, [session?.user?.id, reportError, showInfo, showError]);

  const requestAccountDeletion = useCallback( async (reason?: string): Promise<AccountDeletionRequest | null> => {
    if (!session?.user?.id) return null;

    try {
      const request = await settingsService.current.requestAccountDeletion( session.user.id, reason);
      showWarning( 'Deletion Requested', 'Account deletion has been scheduled. Check your email for confirmation.');
      return request;
    } catch (_error) {
      reportError( error as Error, { context: 'requestAccountDeletion' });
      showError( 'Deletion Error', 'Failed to request account deletion');
      return null;
    }
  }, [session?.user?.id, reportError, showWarning, showError]);

  // Utilities
  const validateField = useCallback((
    section: keyof UserSettings, 
    field: string, 
    value: any
  ): SettingsValidationError[] => {
    const data = { [field]: value };
    return settingsService.current.validateSettings( section, data);
  }, []);

  const clearValidationErrors = useCallback((section?: keyof UserSettings) => {
    if (section) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[section];
        return newErrors;
      });
    } else {
      setValidationErrors({  });
    }
  }, []);

  return {
    // State
    settings,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    validationErrors,
    
    // Actions
    updateSettings,
    saveAllChanges,
    resetSection,
    refreshSettings,
    
    // Security
    changePassword,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
    
    // Sessions
    activeSessions,
    revokeSession,
    refreshSessions,
    
    // Audit
    auditLog,
    refreshAuditLog,
    
    // Data management
    requestDataExport,
    requestAccountDeletion,
    
    // Utilities
    validateField,
    clearValidationErrors
  };
}
