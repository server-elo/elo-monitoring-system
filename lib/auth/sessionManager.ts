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
  private lastActivityTime: number = Date.now();
  private refreshPromise: Promise<boolean> | null = null;
  private listeners: Set<(session: SessionData | null) => void> = new Set();
  private statusListeners: Set<(status: SessionStatus) => void> = new Set();
  private eventListeners: Set<(event: SessionEvent) => void> = new Set();
  private errorAnalytics: ErrorAnalyticsManager;
  private deviceId: string;
  private isRefreshing: boolean = false;
  private warningShown: boolean = false;
  private broadcastChannel: BroadcastChannel | null = null;

  private constructor(config: Partial<SessionConfig> = {}) {
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

    this.deviceId = this.generateDeviceId();
    this.errorAnalytics = ErrorAnalyticsManager.getInstance();

    if (this.config.crossTabSync) {
      this.setupCrossTabSync();
    }

    if (this.config.activityTracking) {
      this.setupActivityTracking();
    }

    this.startSessionCheck();
  }

  static getInstance(config?: Partial<SessionConfig>): SessionManager {
    if (!this.instance) {
      this.instance = new SessionManager(config);
    }
    return this.instance;
  }

  // Set session data
  setSession(sessionData: Partial<SessionData>): void {
    const now = new Date();
    this.session = {
      userId: sessionData.userId || '',
      email: sessionData.email || '',
      name: sessionData.name || '',
      role: sessionData.role || 'STUDENT',
      expiresAt: sessionData.expiresAt ? new Date(sessionData.expiresAt) : new Date(Date.now() + this.config.sessionTimeout),
      refreshToken: sessionData.refreshToken,
      lastActivity: now,
      createdAt: sessionData.createdAt ? new Date(sessionData.createdAt) : now,
      deviceId: this.deviceId,
      sessionId: sessionData.sessionId || this.generateSessionId(),
      ...sessionData
    };

    this.lastActivityTime = Date.now();
    this.warningShown = false;

    this.notifyListeners();
    this.notifyStatusListeners();
    this.saveToStorage();
    this.broadcastSessionUpdate();
    this.scheduleRefresh();
    this.scheduleWarning();

    this.emitEvent({
      type: 'sync',
      timestamp: now,
      data: { action: 'session_set' }
    });
  }

  // Get current session
  getSession(): SessionData | null {
    return this.session;
  }

  // Check if session is valid
  isSessionValid(): boolean {
    if (!this.session) return false;
    
    const now = new Date();
    const isExpired = now > this.session.expiresAt;
    const isInactive = Date.now() - this.lastActivityTime > this.config.maxInactivity;
    
    return !isExpired && !isInactive;
  }

  // Check if session needs refresh
  needsRefresh(): boolean {
    if (!this.session) return false;

    const now = Date.now();
    const expiryTime = this.session.expiresAt.getTime();
    const timeUntilExpiry = expiryTime - now;

    return timeUntilExpiry <= this.config.refreshThreshold;
  }

  // Check if session needs warning
  needsWarning(): boolean {
    if (!this.session) return false;

    const now = Date.now();
    const expiryTime = this.session.expiresAt.getTime();
    const timeUntilExpiry = expiryTime - now;

    return timeUntilExpiry <= this.config.warningThreshold && timeUntilExpiry > this.config.refreshThreshold;
  }

  // Get comprehensive session status
  getSessionStatus(): SessionStatus {
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

    const now = Date.now();
    const timeUntilExpiry = this.session.expiresAt.getTime() - now;
    const timeSinceActivity = now - this.lastActivityTime;
    const isValid = this.isSessionValid();
    const needsRefresh = this.needsRefresh();
    const needsWarning = this.needsWarning();
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
  async refreshSession(): Promise<boolean> {
    if (!this.session?.refreshToken) {
      this.handleSessionError('No refresh token available');
      return false;
    }

    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.isRefreshing = true;
    this.notifyStatusListeners();

    this.emitEvent({
      type: 'refresh',
      timestamp: new Date(),
      data: { action: 'refresh_start' }
    });

    this.refreshPromise = this.performRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    this.isRefreshing = false;

    this.notifyStatusListeners();

    return result;
  }

  private async performRefresh(): Promise<boolean> {
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
        if (response.status === 401) {
          this.handleSessionError('Refresh token expired');
          return false;
        }
        
        throw new Error(`Refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Update session with new data
      if (this.session) {
        this.session.expiresAt = new Date(data.expiresAt);
        this.session.refreshToken = data.refreshToken;
        this.session.lastActivity = new Date();
        this.saveToStorage();
        this.notifyListeners();
      }

      return true;
    } catch (error) {
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
  updateActivity(): void {
    this.lastActivityTime = Date.now();
    if (this.session) {
      this.session.lastActivity = new Date();
      this.saveToStorage();
    }
  }

  // Clear session and logout
  clearSession(): void {
    this.session = null;
    this.lastActivityTime = 0;
    this.removeFromStorage();
    this.notifyListeners();
  }

  // Add session change listener
  addListener(listener: (session: SessionData | null) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Add session status listener
  addStatusListener(listener: (status: SessionStatus) => void): () => void {
    this.statusListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  // Add session event listener
  addEventListener(listener: (event: SessionEvent) => void): () => void {
    this.eventListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  // Handle session errors
  private handleSessionError(message: string): void {
    const authError = ErrorFactory.createAuthError({
      message,
      authType: 'refresh',
      userMessage: 'Your session has expired. Please log in again to continue.'
    });

    this.errorAnalytics.trackError(new Error(message), {
      category: 'session_management',
      severity: 'warning',
      metadata: {
        userId: this.session?.userId,
        lastActivity: this.lastActivityTime,
        sessionExpiry: this.session?.expiresAt?.toISOString()
      }
    });

    // Clear invalid session
    this.clearSession();

    // Notify error system
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-error', {
        detail: authError
      }));
    }
  }

  // Setup activity tracking
  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      this.updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, activityHandler, { passive: true });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateActivity();
        this.checkSession();
      }
    });
  }

  // Start periodic session checking
  private startSessionCheck(): void {
    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, this.config.checkInterval);
  }

  // Check session validity and refresh if needed
  private async checkSession(): Promise<void> {
    if (!this.session) return;

    if (!this.isSessionValid()) {
      this.handleSessionError('Session expired or inactive');
      return;
    }

    if (this.needsRefresh()) {
      const refreshed = await this.refreshSession();
      if (!refreshed) {
        this.handleSessionError('Failed to refresh session');
      }
    }
  }

  // Save session to storage
  private saveToStorage(): void {
    if (typeof window === 'undefined' || !this.session) return;

    try {
      const sessionData = {
        ...this.session,
        expiresAt: this.session.expiresAt.toISOString(),
        lastActivity: this.session.lastActivity.toISOString()
      };
      
      localStorage.setItem('session', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save session to storage:', error);
    }
  }

  // Load session from storage
  loadFromStorage(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const stored = localStorage.getItem('session');
      if (!stored) return false;

      const sessionData = JSON.parse(stored);
      this.session = {
        ...sessionData,
        expiresAt: new Date(sessionData.expiresAt),
        lastActivity: new Date(sessionData.lastActivity)
      };

      // Check if loaded session is still valid
      if (!this.isSessionValid()) {
        this.clearSession();
        return false;
      }

      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to load session from storage:', error);
      this.removeFromStorage();
      return false;
    }
  }

  // Remove session from storage
  private removeFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('session');
    } catch (error) {
      console.error('Failed to remove session from storage:', error);
    }
  }

  // Notify all listeners of session changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.session);
      } catch (error) {
        console.error('Error in session listener:', error);
      }
    });
  }

  // Generate device ID
  private generateDeviceId(): string {
    // Only access localStorage on the client side
    if (typeof window === 'undefined') {
      return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const stored = localStorage.getItem('device_id');
    if (stored) return stored;

    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
    return deviceId;
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Setup cross-tab synchronization
  private setupCrossTabSync(): void {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;

    this.broadcastChannel = new BroadcastChannel('session_sync');

    this.broadcastChannel.addEventListener('message', (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'session_update':
          if (data.deviceId !== this.deviceId) {
            this.handleCrossTabSessionUpdate(data);
          }
          break;
        case 'session_logout':
          if (data.deviceId !== this.deviceId) {
            this.clearSession();
          }
          break;
        case 'activity_update':
          if (data.deviceId !== this.deviceId) {
            this.lastActivityTime = Math.max(this.lastActivityTime, data.timestamp);
          }
          break;
      }
    });
  }

  // Handle cross-tab session updates
  private handleCrossTabSessionUpdate(data: any): void {
    if (data.session && (!this.session || data.session.expiresAt > this.session.expiresAt)) {
      this.session = {
        ...data.session,
        expiresAt: new Date(data.session.expiresAt),
        lastActivity: new Date(data.session.lastActivity),
        createdAt: new Date(data.session.createdAt)
      };
      this.notifyListeners();
      this.notifyStatusListeners();
      this.saveToStorage();
    }
  }

  // Broadcast session update to other tabs
  private broadcastSessionUpdate(): void {
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
  private broadcastActivity(): void {
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
  private scheduleRefresh(): void {
    if (!this.config.autoRefresh || !this.session) return;

    if (this.refreshInterval) {
      clearTimeout(this.refreshInterval);
    }

    const timeUntilRefresh = this.session.expiresAt.getTime() - Date.now() - this.config.refreshThreshold;

    if (timeUntilRefresh > 0) {
      this.refreshInterval = setTimeout(() => {
        this.refreshSession();
      }, timeUntilRefresh);
    }
  }

  // Schedule warning notification
  private scheduleWarning(): void {
    if (!this.session) return;

    if (this.warningInterval) {
      clearTimeout(this.warningInterval);
    }

    const timeUntilWarning = this.session.expiresAt.getTime() - Date.now() - this.config.warningThreshold;

    if (timeUntilWarning > 0) {
      this.warningInterval = setTimeout(() => {
        if (!this.warningShown && this.needsWarning()) {
          this.warningShown = true;
          this.emitEvent({
            type: 'warning',
            timestamp: new Date(),
            data: { timeUntilExpiry: this.getSessionStatus().timeUntilExpiry }
          });
        }
      }, timeUntilWarning);
    }
  }

  // Emit session event
  private emitEvent(event: SessionEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in session event listener:', error);
      }
    });
  }

  // Notify status listeners
  private notifyStatusListeners(): void {
    const status = this.getSessionStatus();
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in session status listener:', error);
      }
    });
  }

  // Cleanup resources
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.refreshInterval) {
      clearTimeout(this.refreshInterval);
      this.refreshInterval = null;
    }

    if (this.warningInterval) {
      clearTimeout(this.warningInterval);
      this.warningInterval = null;
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    this.listeners.clear();
    this.statusListeners.clear();
    this.eventListeners.clear();
    this.session = null;
  }

  // Get session statistics
  getSessionStats(): {
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

    const now = Date.now();
    const timeUntilExpiry = this.session.expiresAt.getTime() - now;
    const timeSinceActivity = now - this.lastActivityTime;

    return {
      isValid: this.isSessionValid(),
      timeUntilExpiry: Math.max(0, timeUntilExpiry),
      timeSinceActivity,
      needsRefresh: this.needsRefresh()
    };
  }
}
