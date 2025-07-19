// Session management with comprehensive error handling

import { ErrorFactory } from '@/lib/errors/types';
import { ErrorAnalyticsManager } from '@/lib/errors/recovery';

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
  expiresAt: Date;
  refreshToken?: string;
  lastActivity: Date;
  createdAt: Date;
  deviceId: string;
  sessionId: string;
}

export interface SessionConfig {
  sessionTimeout: number; // milliseconds
  refreshThreshold: number; // milliseconds before expiry to refresh
  maxInactivity: number; // milliseconds of inactivity before logout
  checkInterval: number; // milliseconds between session checks
  warningThreshold: number; // milliseconds before expiry to show warning
  autoRefresh: boolean; // enable automatic refresh
  crossTabSync: boolean; // enable cross-tab synchronization
  activityTracking: boolean; // enable activity tracking
}

export interface SessionStatus {
  isValid: boolean;
  timeUntilExpiry: number;
  timeSinceActivity: number;
  needsRefresh: boolean;
  needsWarning: boolean;
  isExpiringSoon: boolean;
  refreshInProgress: boolean;
}

export interface SessionEvent {
  type: 'refresh' | 'expire' | 'warning' | 'activity' | 'sync' | 'error';
  timestamp: Date;
  data?: any;
}

export class SessionManager {
  private static instance: SessionManager;
  private session: SessionData | null = null;
  private config: SessionConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private warningInterval: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now(_);
  private refreshPromise: Promise<boolean> | null = null;
  private listeners: Set<(_session: SessionData | null) => void> = new Set(_);
  private statusListeners: Set<(_status: SessionStatus) => void> = new Set(_);
  private eventListeners: Set<(_event: SessionEvent) => void> = new Set(_);
  private errorAnalytics: ErrorAnalyticsManager;
  private deviceId: string;
  private isRefreshing: boolean = false;
  private warningShown: boolean = false;
  private broadcastChannel: BroadcastChannel | null = null;

  private constructor(_config: Partial<SessionConfig> = {}) {
    this.config = {
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      refreshThreshold: 5 * 60 * 1000, // 5 minutes
      maxInactivity: 30 * 60 * 1000, // 30 minutes
      checkInterval: 60 * 1000, // 1 minute
      warningThreshold: 10 * 60 * 1000, // 10 minutes
      autoRefresh: true,
      crossTabSync: true,
      activityTracking: true,
      ...config
    };

    this.deviceId = this.generateDeviceId(_);
    this.errorAnalytics = ErrorAnalyticsManager.getInstance(_);

    if (_this.config.crossTabSync) {
      this.setupCrossTabSync(_);
    }

    if (_this.config.activityTracking) {
      this.setupActivityTracking(_);
    }

    this.startSessionCheck(_);
  }

  static getInstance(_config?: Partial<SessionConfig>): SessionManager {
    if (!this.instance) {
      this.instance = new SessionManager(_config);
    }
    return this.instance;
  }

  // Set session data
  setSession(_sessionData: Partial<SessionData>): void {
    const now = new Date(_);
    this.session = {
      userId: sessionData.userId || '',
      email: sessionData.email || '',
      name: sessionData.name || '',
      role: sessionData.role || 'STUDENT',
      expiresAt: sessionData.expiresAt ? new Date(_sessionData.expiresAt) : new Date(_Date.now() + this.config.sessionTimeout),
      refreshToken: sessionData.refreshToken,
      lastActivity: now,
      createdAt: sessionData.createdAt ? new Date(_sessionData.createdAt) : now,
      deviceId: this.deviceId,
      sessionId: sessionData.sessionId || this.generateSessionId(_),
      ...sessionData
    };

    this.lastActivityTime = Date.now(_);
    this.warningShown = false;

    this.notifyListeners(_);
    this.notifyStatusListeners(_);
    this.saveToStorage(_);
    this.broadcastSessionUpdate(_);
    this.scheduleRefresh(_);
    this.scheduleWarning(_);

    this.emitEvent({
      type: 'sync',
      timestamp: now,
      data: { action: 'session_set' }
    });
  }

  // Get current session
  getSession(_): SessionData | null {
    return this.session;
  }

  // Check if session is valid
  isSessionValid(_): boolean {
    if (!this.session) return false;
    
    const now = new Date(_);
    const isExpired = now > this.session.expiresAt;
    const isInactive = Date.now(_) - this.lastActivityTime > this.config.maxInactivity;
    
    return !isExpired && !isInactive;
  }

  // Check if session needs refresh
  needsRefresh(_): boolean {
    if (!this.session) return false;

    const now = Date.now(_);
    const expiryTime = this.session.expiresAt.getTime(_);
    const timeUntilExpiry = expiryTime - now;

    return timeUntilExpiry <= this.config.refreshThreshold;
  }

  // Check if session needs warning
  needsWarning(_): boolean {
    if (!this.session) return false;

    const now = Date.now(_);
    const expiryTime = this.session.expiresAt.getTime(_);
    const timeUntilExpiry = expiryTime - now;

    return timeUntilExpiry <= this.config.warningThreshold && timeUntilExpiry > this.config.refreshThreshold;
  }

  // Get comprehensive session status
  getSessionStatus(_): SessionStatus {
    if (!this.session) {
      return {
        isValid: false,
        timeUntilExpiry: 0,
        timeSinceActivity: 0,
        needsRefresh: false,
        needsWarning: false,
        isExpiringSoon: false,
        refreshInProgress: this.isRefreshing
      };
    }

    const now = Date.now(_);
    const timeUntilExpiry = this.session.expiresAt.getTime(_) - now;
    const timeSinceActivity = now - this.lastActivityTime;
    const isValid = this.isSessionValid(_);
    const needsRefresh = this.needsRefresh(_);
    const needsWarning = this.needsWarning(_);
    const isExpiringSoon = timeUntilExpiry <= this.config.warningThreshold;

    return {
      isValid,
      timeUntilExpiry: Math.max(0, timeUntilExpiry),
      timeSinceActivity,
      needsRefresh,
      needsWarning,
      isExpiringSoon,
      refreshInProgress: this.isRefreshing
    };
  }

  // Refresh session token
  async refreshSession(_): Promise<boolean> {
    if (!this.session?.refreshToken) {
      this.handleSessionError('No refresh token available');
      return false;
    }

    // Prevent multiple simultaneous refresh attempts
    if (_this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.isRefreshing = true;
    this.notifyStatusListeners(_);

    this.emitEvent({
      type: 'refresh',
      timestamp: new Date(_),
      data: { action: 'refresh_start' }
    });

    this.refreshPromise = this.performRefresh(_);
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    this.isRefreshing = false;

    this.notifyStatusListeners(_);

    return result;
  }

  private async performRefresh(_): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.session?.refreshToken
        }),
      });

      if (!response.ok) {
        if (_response.status === 401) {
          this.handleSessionError('Refresh token expired');
          return false;
        }
        
        throw new Error(_`Refresh failed: ${response.status}`);
      }

      const data = await response.json(_);
      
      // Update session with new data
      if (_this.session) {
        this.session.expiresAt = new Date(_data.expiresAt);
        this.session.refreshToken = data.refreshToken;
        this.session.lastActivity = new Date(_);
        this.saveToStorage(_);
        this.notifyListeners(_);
      }

      return true;
    } catch (_error) {
      this.errorAnalytics.trackError(error as Error, {
        category: 'session_refresh',
        severity: 'error',
        metadata: {
          userId: this.session?.userId,
          sessionExpiry: this.session?.expiresAt?.toISOString()
        }
      });

      this.handleSessionError('Failed to refresh session');
      return false;
    }
  }

  // Update activity timestamp
  updateActivity(_): void {
    this.lastActivityTime = Date.now(_);
    if (_this.session) {
      this.session.lastActivity = new Date(_);
      this.saveToStorage(_);
    }
  }

  // Clear session and logout
  clearSession(_): void {
    this.session = null;
    this.lastActivityTime = 0;
    this.removeFromStorage(_);
    this.notifyListeners(_);
  }

  // Add session change listener
  addListener(_listener: (session: SessionData | null) => void): (_) => void {
    this.listeners.add(_listener);

    // Return unsubscribe function
    return (_) => {
      this.listeners.delete(_listener);
    };
  }

  // Add session status listener
  addStatusListener(_listener: (status: SessionStatus) => void): (_) => void {
    this.statusListeners.add(_listener);

    // Return unsubscribe function
    return (_) => {
      this.statusListeners.delete(_listener);
    };
  }

  // Add session event listener
  addEventListener(_listener: (event: SessionEvent) => void): (_) => void {
    this.eventListeners.add(_listener);

    // Return unsubscribe function
    return (_) => {
      this.eventListeners.delete(_listener);
    };
  }

  // Handle session errors
  private handleSessionError(_message: string): void {
    const authError = ErrorFactory.createAuthError({
      message,
      authType: 'refresh',
      userMessage: 'Your session has expired. Please log in again to continue.'
    });

    this.errorAnalytics.trackError(_new Error(message), {
      category: 'session_management',
      severity: 'warning',
      metadata: {
        userId: this.session?.userId,
        lastActivity: this.lastActivityTime,
        sessionExpiry: this.session?.expiresAt?.toISOString()
      }
    });

    // Clear invalid session
    this.clearSession(_);

    // Notify error system
    if (_typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-error', {
        detail: authError
      }));
    }
  }

  // Setup activity tracking
  private setupActivityTracking(_): void {
    if (_typeof window === 'undefined') return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = (_) => {
      this.updateActivity(_);
    };

    events.forEach(event => {
      document.addEventListener( event, activityHandler, { passive: true });
    });

    // Track page visibility changes
    document.addEventListener( 'visibilitychange', () => {
      if (!document.hidden) {
        this.updateActivity(_);
        this.checkSession(_);
      }
    });
  }

  // Start periodic session checking
  private startSessionCheck(_): void {
    this.checkInterval = setInterval(() => {
      this.checkSession(_);
    }, this.config.checkInterval);
  }

  // Check session validity and refresh if needed
  private async checkSession(_): Promise<void> {
    if (!this.session) return;

    if (!this.isSessionValid()) {
      this.handleSessionError('Session expired or inactive');
      return;
    }

    if (_this.needsRefresh()) {
      const refreshed = await this.refreshSession(_);
      if (!refreshed) {
        this.handleSessionError('Failed to refresh session');
      }
    }
  }

  // Save session to storage
  private saveToStorage(_): void {
    if (_typeof window === 'undefined' || !this.session) return;

    try {
      const sessionData = {
        ...this.session,
        expiresAt: this.session.expiresAt.toISOString(),
        lastActivity: this.session.lastActivity.toISOString()
      };
      
      localStorage.setItem( 'session', JSON.stringify(sessionData));
    } catch (_error) {
      console.error('Failed to save session to storage:', error);
    }
  }

  // Load session from storage
  loadFromStorage(_): boolean {
    if (_typeof window === 'undefined') return false;

    try {
      const stored = localStorage.getItem('session');
      if (!stored) return false;

      const sessionData = JSON.parse(_stored);
      this.session = {
        ...sessionData,
        expiresAt: new Date(_sessionData.expiresAt),
        lastActivity: new Date(_sessionData.lastActivity)
      };

      // Check if loaded session is still valid
      if (!this.isSessionValid()) {
        this.clearSession(_);
        return false;
      }

      this.notifyListeners(_);
      return true;
    } catch (_error) {
      console.error('Failed to load session from storage:', error);
      this.removeFromStorage(_);
      return false;
    }
  }

  // Remove session from storage
  private removeFromStorage(_): void {
    if (_typeof window === 'undefined') return;

    try {
      localStorage.removeItem('session');
    } catch (_error) {
      console.error('Failed to remove session from storage:', error);
    }
  }

  // Notify all listeners of session changes
  private notifyListeners(_): void {
    this.listeners.forEach(listener => {
      try {
        listener(_this.session);
      } catch (_error) {
        console.error('Error in session listener:', error);
      }
    });
  }

  // Generate device ID
  private generateDeviceId(_): string {
    // Only access localStorage on the client side
    if (_typeof window === 'undefined') {
      return `device_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const stored = localStorage.getItem('device_id');
    if (stored) return stored;

    const deviceId = `device_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem( 'device_id', deviceId);
    return deviceId;
  }

  // Generate session ID
  private generateSessionId(_): string {
    return `session_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Setup cross-tab synchronization
  private setupCrossTabSync(_): void {
    if (_typeof window === 'undefined' || !window.BroadcastChannel) return;

    this.broadcastChannel = new BroadcastChannel('session_sync');

    this.broadcastChannel.addEventListener( 'message', (event) => {
      const { type, data } = event.data;

      switch (_type) {
        case 'session_update':
          if (_data.deviceId !== this.deviceId) {
            this.handleCrossTabSessionUpdate(_data);
          }
          break;
        case 'session_logout':
          if (_data.deviceId !== this.deviceId) {
            this.clearSession(_);
          }
          break;
        case 'activity_update':
          if (_data.deviceId !== this.deviceId) {
            this.lastActivityTime = Math.max(this.lastActivityTime, data.timestamp);
          }
          break;
      }
    });
  }

  // Handle cross-tab session updates
  private handleCrossTabSessionUpdate(_data: any): void {
    if (_data.session && (!this.session || data.session.expiresAt > this.session.expiresAt)) {
      this.session = {
        ...data.session,
        expiresAt: new Date(_data.session.expiresAt),
        lastActivity: new Date(_data.session.lastActivity),
        createdAt: new Date(_data.session.createdAt)
      };
      this.notifyListeners(_);
      this.notifyStatusListeners(_);
      this.saveToStorage(_);
    }
  }

  // Broadcast session update to other tabs
  private broadcastSessionUpdate(_): void {
    if (!this.broadcastChannel || !this.session) return;

    this.broadcastChannel.postMessage({
      type: 'session_update',
      data: {
        deviceId: this.deviceId,
        session: this.session
      }
    });
  }

  // Broadcast activity update
  private broadcastActivity(_): void {
    if (!this.broadcastChannel) return;

    this.broadcastChannel.postMessage({
      type: 'activity_update',
      data: {
        deviceId: this.deviceId,
        timestamp: this.lastActivityTime
      }
    });
  }

  // Schedule automatic refresh
  private scheduleRefresh(_): void {
    if (!this.config.autoRefresh || !this.session) return;

    if (_this.refreshInterval) {
      clearTimeout(_this.refreshInterval);
    }

    const timeUntilRefresh = this.session.expiresAt.getTime(_) - Date.now(_) - this.config.refreshThreshold;

    if (_timeUntilRefresh > 0) {
      this.refreshInterval = setTimeout(() => {
        this.refreshSession(_);
      }, timeUntilRefresh);
    }
  }

  // Schedule warning notification
  private scheduleWarning(_): void {
    if (!this.session) return;

    if (_this.warningInterval) {
      clearTimeout(_this.warningInterval);
    }

    const timeUntilWarning = this.session.expiresAt.getTime(_) - Date.now(_) - this.config.warningThreshold;

    if (_timeUntilWarning > 0) {
      this.warningInterval = setTimeout(() => {
        if (!this.warningShown && this.needsWarning()) {
          this.warningShown = true;
          this.emitEvent({
            type: 'warning',
            timestamp: new Date(_),
            data: { timeUntilExpiry: this.getSessionStatus(_).timeUntilExpiry }
          });
        }
      }, timeUntilWarning);
    }
  }

  // Emit session event
  private emitEvent(_event: SessionEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(_event);
      } catch (_error) {
        console.error('Error in session event listener:', error);
      }
    });
  }

  // Notify status listeners
  private notifyStatusListeners(_): void {
    const status = this.getSessionStatus(_);
    this.statusListeners.forEach(listener => {
      try {
        listener(_status);
      } catch (_error) {
        console.error('Error in session status listener:', error);
      }
    });
  }

  // Cleanup resources
  destroy(_): void {
    if (_this.checkInterval) {
      clearInterval(_this.checkInterval);
      this.checkInterval = null;
    }

    if (_this.refreshInterval) {
      clearTimeout(_this.refreshInterval);
      this.refreshInterval = null;
    }

    if (_this.warningInterval) {
      clearTimeout(_this.warningInterval);
      this.warningInterval = null;
    }

    if (_this.broadcastChannel) {
      this.broadcastChannel.close(_);
      this.broadcastChannel = null;
    }

    this.listeners.clear(_);
    this.statusListeners.clear(_);
    this.eventListeners.clear(_);
    this.session = null;
  }

  // Get session statistics
  getSessionStats(_): {
    isValid: boolean;
    timeUntilExpiry: number;
    timeSinceActivity: number;
    needsRefresh: boolean;
  } {
    if (!this.session) {
      return {
        isValid: false,
        timeUntilExpiry: 0,
        timeSinceActivity: 0,
        needsRefresh: false
      };
    }

    const now = Date.now(_);
    const timeUntilExpiry = this.session.expiresAt.getTime(_) - now;
    const timeSinceActivity = now - this.lastActivityTime;

    return {
      isValid: this.isSessionValid(_),
      timeUntilExpiry: Math.max(0, timeUntilExpiry),
      timeSinceActivity,
      needsRefresh: this.needsRefresh(_)
    };
  }
}
