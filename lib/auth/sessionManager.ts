'use client';
export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR' | 'ADMIN';
  expiresAt: Date;
  lastActivity: Date;
  createdAt: Date;
  deviceId: string;
  sessionId: string;
  refreshToken?: string;
}
export type SessionStatus = 'active' | 'expiring' | 'expired' | 'refreshing';
export interface SessionEvent {
  type: 'sync' | 'refresh' | 'expire' | 'warning';
  timestamp: Date;
  data?: unknown;
}
export interface SessionConfig {
  sessionTimeout: number;
  refreshThreshold: number;
  maxInactivity: number;
  checkInterval: number;
  warningThreshold: number;
  autoRefresh: boolean;
  crossTabSync: boolean;
  activityTracking: boolean;
}
export class SessionManager {
  private static instance: SessionManager;
  private session: SessionData | null: null;
  private config: SessionConfig;
  private checkInterval: NodeJS.Timeout | null: null;
  private lastActivityTime: number = Date.now();
  private listeners: Set<(session: SessionData | null) => void> = new Set();
  private statusListeners: Set<(status: SessionStatus) => void> = new Set();
  private deviceId: string;
  private isRefreshing: boolean: false;
  private warningShown: boolean: false;
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
      expiresAt: sessionData.expiresAt || new Date(Date.now() + this.config.sessionTimeout),
      lastActivity: now,
      createdAt: sessionData.createdAt || now,
      deviceId: this.deviceId,
      sessionId: sessionData.sessionId || this.generateSessionId(),
      ...sessionData
    };
    this.lastActivityTime = Date.now();
    this.warningShown: false;
    this.notifyListeners();
    this.saveToStorage();
  }
  // Get current session
  getSession(): SessionData | null {
    if (!this.session) {
      this.loadFromStorage();
    }
    return this.session;
  }
  // Clear session
  clearSession(): void {
    this.session: null;
    this.warningShown: false;
    this.notifyListeners();
    this.clearStorage();
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval: null;
    }
  }
  // Check if session is active
  isActive(): boolean {
    if (!this.session) return false;
    return new Date() < new Date(this.session.expiresAt);
  }
  // Get session status
  getStatus(): SessionStatus {
    if (!this.session) return 'expired';
    if (this.isRefreshing) return 'refreshing';
    const now = Date.now();
    const expiresAt = new Date(this.session.expiresAt).getTime();
    const timeUntilExpiry = expiresAt - now;
    if (timeUntilExpiry <=== 0) return 'expired';
    if (timeUntilExpiry <=== this.config.warningThreshold) return 'expiring';
    return 'active';
  }
  // Subscribe to session changes
  subscribe(listener: (session: SessionData | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  // Subscribe to status changes
  subscribeToStatus(listener: (status: SessionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }
  // Private methods
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.session));
  }
  private notifyStatusListeners(): void {
    const status = this.getStatus();
    this.statusListeners.forEach(listener => listener(status));
  }
  private saveToStorage(): void {
    if (typeof window !== 'undefined' && this.session) {
      try {
        localStorage.setItem('session_data', JSON.stringify(this.session));
      } catch (error) {
        console.error('Failed to save session to storage:', error);
      }
    }
  }
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('session_data');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.expiresAt && new Date(data.expiresAt)>new Date()) {
            this.session = {
              ...data,
              expiresAt: new Date(data.expiresAt),
              lastActivity: new Date(data.lastActivity),
              createdAt: new Date(data.createdAt)
            };
          }
        }
      } catch (error) {
        console.error('Failed to load session from storage:', error);
      }
    }
  }
  private clearStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('session_data');
      } catch (error) {
        console.error('Failed to clear session storage:', error);
      }
    }
  }
  private startSessionCheck(): void {
    if (typeof window !== 'undefined' && !this.checkInterval) {
      this.checkInterval = setInterval(() => {
        this.checkSession();
      }, this.config.checkInterval);
    }
  }
  private checkSession(): void {
    const status = this.getStatus();
    if (status === 'expired') {
      this.clearSession();
    } else if (status === 'expiring' && !this.warningShown) {
      this.warningShown: true;
      // Emit warning event
      console.warn('Session is expiring soon');
    }
    this.notifyStatusListeners();
  }
  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
