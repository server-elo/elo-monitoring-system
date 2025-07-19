'use client';

import { UserSettings, SettingsUpdateResponse, SettingsValidationError, AuditLogEntry, ActiveSession, TwoFactorSetup, DataExportRequest, AccountDeletionRequest, DEFAULT_USER_SETTINGS } from '@/types/settings';

export class SettingsService {
  private static instance: SettingsService;
  private baseUrl: string;
  private cache: Map<string, any> = new Map();
  private pendingUpdates: Map<string, NodeJS.Timeout> = new Map();

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  static getInstance(baseUrl?: string): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService(baseUrl);
    }
    return SettingsService.instance;
  }

  /**
   * Get user settings with caching
   */
  async getUserSettings(userId: string, useCache = true): Promise<UserSettings> {
    const cacheKey = `settings:${userId}`;
    
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/settings/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }

      const settings = await response.json();
      
      // Merge with defaults to ensure all properties exist
      const mergedSettings = this.mergeWithDefaults(settings);
      
      this.cache.set(cacheKey, mergedSettings);
      return mergedSettings;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      // Return default settings on error
      return {
        ...DEFAULT_USER_SETTINGS,
        profile: {
          id: userId,
          email: '',
          displayName: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          emailVerified: false
        }
      } as UserSettings;
    }
  }

  /**
   * Update user settings with debouncing
   */
  async updateSettings(
    userId: string, 
    section: keyof UserSettings, 
    data: Partial<UserSettings[keyof UserSettings]>,
    debounceMs = 500
  ): Promise<SettingsUpdateResponse> {
    const updateKey = `${userId}:${section}`;
    
    // Clear existing timeout
    if (this.pendingUpdates.has(updateKey)) {
      clearTimeout(this.pendingUpdates.get(updateKey)!);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          const result = await this.performUpdate(userId, section, data);
          this.pendingUpdates.delete(updateKey);
          resolve(result);
        } catch (error) {
          this.pendingUpdates.delete(updateKey);
          reject(error);
        }
      }, debounceMs);

      this.pendingUpdates.set(updateKey, timeout);
    });
  }

  /**
   * Immediate update without debouncing (for critical changes)
   */
  async updateSettingsImmediate(
    userId: string, 
    section: keyof UserSettings, 
    data: Partial<UserSettings[keyof UserSettings]>
  ): Promise<SettingsUpdateResponse> {
    return this.performUpdate(userId, section, data);
  }

  /**
   * Validate settings data
   */
  validateSettings(
    section: keyof UserSettings, 
    data: Partial<UserSettings[keyof UserSettings]>
  ): SettingsValidationError[] {
    const errors: SettingsValidationError[] = [];

    switch (section) {
      case 'profile':
        errors.push(...this.validateProfile(data as any));
        break;
      case 'security':
        errors.push(...this.validateSecurity(data as any));
        break;
      case 'notifications':
        errors.push(...this.validateNotifications(data as any));
        break;
      case 'learning':
        errors.push(...this.validateLearning(data as any));
        break;
      case 'editor':
        errors.push(...this.validateEditor(data as any));
        break;
      case 'collaboration':
        errors.push(...this.validateCollaboration(data as any));
        break;
      case 'accessibility':
        errors.push(...this.validateAccessibility(data as any));
        break;
      case 'privacy':
        errors.push(...this.validatePrivacy(data as any));
        break;
    }

    return errors;
  }

  /**
   * Get audit log for user
   */
  async getAuditLog(userId: string, limit = 50): Promise<AuditLogEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/settings/${userId}/audit?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audit log: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return [];
    }
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(userId: string): Promise<ActiveSession[]> {
    try {
      const response = await fetch(`${this.baseUrl}/settings/${userId}/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/settings/${userId}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      return response.ok;
    } catch (error) {
      console.error('Error revoking session:', error);
      return false;
    }
  }

  /**
   * Setup two-factor authentication
   */
  async setupTwoFactor(userId: string): Promise<TwoFactorSetup> {
    try {
      const response = await fetch(`${this.baseUrl}/settings/${userId}/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to setup 2FA: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      throw error;
    }
  }

  /**
   * Verify and enable two-factor authentication
   */
  async enableTwoFactor(userId: string, verificationCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/settings/${userId}/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ verificationCode })
      });

      return response.ok;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return false;
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(userId: string, verificationCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/settings/${userId}/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ verificationCode })
      });

      return response.ok;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return false;
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<SettingsUpdateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/settings/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          errors: result.errors || [{ field: 'password', message: result.message, code: 'CHANGE_FAILED' }],
          timestamp: new Date()
        };
      }

      // Clear cache on password change
      this.cache.delete(`settings:${userId}`);
      
      return {
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error changing password:', error);
      return {
        success: false,
        errors: [{ field: 'password', message: 'Failed to change password', code: 'NETWORK_ERROR' }],
        timestamp: new Date()
      };
    }
  }

  /**
   * Request data export
   */
  async requestDataExport(
    userId: string, 
    type: DataExportRequest['type'], 
    format: DataExportRequest['format']
  ): Promise<DataExportRequest> {
    try {
      const response = await fetch(`${this.baseUrl}/settings/${userId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ type, format })
      });

      if (!response.ok) {
        throw new Error(`Failed to request data export: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting data export:', error);
      throw error;
    }
  }

  /**
   * Request account deletion
   */
  async requestAccountDeletion(userId: string, reason?: string): Promise<AccountDeletionRequest> {
    try {
      const response = await fetch(`${this.baseUrl}/settings/${userId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error(`Failed to request account deletion: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(`settings:${userId}`);
    } else {
      this.cache.clear();
    }
  }

  // Private methods

  private async performUpdate(
    userId: string, 
    section: keyof UserSettings, 
    data: Partial<UserSettings[keyof UserSettings]>
  ): Promise<SettingsUpdateResponse> {
    // Validate data
    const errors = this.validateSettings(section, data);
    if (errors.length > 0) {
      return {
        success: false,
        errors,
        timestamp: new Date()
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/settings/${userId}/${section}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          errors: result.errors || [{ field: section, message: result.message, code: 'UPDATE_FAILED' }],
          timestamp: new Date()
        };
      }

      // Update cache
      const cacheKey = `settings:${userId}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        cached[section] = { ...cached[section], ...data };
        this.cache.set(cacheKey, cached);
      }

      return {
        success: true,
        data: result.data,
        message: result.message,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error updating settings:', error);
      return {
        success: false,
        errors: [{ field: section, message: 'Network error occurred', code: 'NETWORK_ERROR' }],
        timestamp: new Date()
      };
    }
  }

  private mergeWithDefaults(settings: Partial<UserSettings>): UserSettings {
    return {
      profile: settings.profile!,
      security: { ...DEFAULT_USER_SETTINGS.security, ...settings.security },
      notifications: { ...DEFAULT_USER_SETTINGS.notifications, ...settings.notifications },
      learning: { ...DEFAULT_USER_SETTINGS.learning, ...settings.learning },
      editor: { ...DEFAULT_USER_SETTINGS.editor, ...settings.editor },
      collaboration: { ...DEFAULT_USER_SETTINGS.collaboration, ...settings.collaboration },
      accessibility: { ...DEFAULT_USER_SETTINGS.accessibility, ...settings.accessibility },
      privacy: { ...DEFAULT_USER_SETTINGS.privacy, ...settings.privacy }
    };
  }

  // Validation methods (simplified - would be more comprehensive in production)
  private validateProfile(data: any): SettingsValidationError[] {
    const errors: SettingsValidationError[] = [];
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_EMAIL' });
    }
    
    if (data.displayName && (data.displayName.length < 2 || data.displayName.length > 50)) {
      errors.push({ field: 'displayName', message: 'Display name must be 2-50 characters', code: 'INVALID_LENGTH' });
    }
    
    return errors;
  }

  private validateSecurity(data: any): SettingsValidationError[] {
    const errors: SettingsValidationError[] = [];
    
    if (data.sessionTimeout && (data.sessionTimeout < 15 || data.sessionTimeout > 1440)) {
      errors.push({ field: 'sessionTimeout', message: 'Session timeout must be 15-1440 minutes', code: 'INVALID_RANGE' });
    }
    
    return errors;
  }

  private validateNotifications(_data: any): SettingsValidationError[] {
    // Basic validation - would be more comprehensive
    return [];
  }

  private validateLearning(data: any): SettingsValidationError[] {
    const errors: SettingsValidationError[] = [];
    
    if (data.progressTracking?.weeklyGoals && (data.progressTracking.weeklyGoals < 1 || data.progressTracking.weeklyGoals > 168)) {
      errors.push({ field: 'weeklyGoals', message: 'Weekly goals must be 1-168 hours', code: 'INVALID_RANGE' });
    }
    
    return errors;
  }

  private validateEditor(data: any): SettingsValidationError[] {
    const errors: SettingsValidationError[] = [];
    
    if (data.fontSize && (data.fontSize < 8 || data.fontSize > 32)) {
      errors.push({ field: 'fontSize', message: 'Font size must be 8-32px', code: 'INVALID_RANGE' });
    }
    
    if (data.tabSize && (data.tabSize < 1 || data.tabSize > 8)) {
      errors.push({ field: 'tabSize', message: 'Tab size must be 1-8 spaces', code: 'INVALID_RANGE' });
    }
    
    return errors;
  }

  private validateCollaboration(_data: any): SettingsValidationError[] {
    return [];
  }

  private validateAccessibility(_data: any): SettingsValidationError[] {
    return [];
  }

  private validatePrivacy(data: any): SettingsValidationError[] {
    const errors: SettingsValidationError[] = [];
    
    if (data.dataRetention && (data.dataRetention < 30 || data.dataRetention > 2555)) {
      errors.push({ field: 'dataRetention', message: 'Data retention must be 30-2555 days', code: 'INVALID_RANGE' });
    }
    
    return errors;
  }
}
