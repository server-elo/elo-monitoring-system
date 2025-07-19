'use client';

import { AdminUser, SecurityEvent } from './types';

export class AdminAuthManager {
  private static instance: AdminAuthManager;
  private currentUser: AdminUser | null = null;
  private permissions: Set<string> = new Set();
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private sessionTimer: NodeJS.Timeout | null = null;
  private securityEvents: SecurityEvent[] = [];

  static getInstance(): AdminAuthManager {
    if (!AdminAuthManager.instance) {
      AdminAuthManager.instance = new AdminAuthManager();
    }
    return AdminAuthManager.instance;
  }

  // Authentication methods
  async authenticateAdmin(email: string, password: string, twoFactorCode?: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      // Simulate API call
      const response = await this.mockAuthAPI(email, password, twoFactorCode);
      
      if (response.success && response.user) {
        this.currentUser = response.user;
        this.loadUserPermissions(response.user);
        this.startSessionTimer();
        this.logSecurityEvent('login_success', response.user.id);
        return { success: true, user: response.user };
      } else {
        this.logSecurityEvent('login_failure', undefined, { email, reason: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      this.logSecurityEvent('login_error', undefined, { email, error: error.message });
      return { success: false, error: 'Authentication failed' };
    }
  }

  async requireTwoFactor(userId: string): Promise<boolean> {
    // Check if user requires 2FA
    const user = await this.getUserById(userId);
    return user?.twoFactorEnabled || false;
  }

  logout(): void {
    if (this.currentUser) {
      this.logSecurityEvent('logout', this.currentUser.id);
    }
    this.currentUser = null;
    this.permissions.clear();
    this.stopSessionTimer();
  }

  // Permission checking
  hasPermission(permission: string): boolean {
    return this.permissions.has(permission) || this.permissions.has('admin.all');
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  requirePermission(permission: string): void {
    if (!this.hasPermission(permission)) {
      this.logSecurityEvent('permission_denied', this.currentUser?.id, { permission });
      throw new Error(`Permission denied: ${permission}`);
    }
  }

  // Role-based access control
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isInstructor(): boolean {
    return this.hasRole('instructor') || this.isAdmin();
  }

  // Session management
  private startSessionTimer(): void {
    this.stopSessionTimer();
    this.sessionTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.sessionTimeout);
  }

  private stopSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  private handleSessionTimeout(): void {
    if (this.currentUser) {
      this.logSecurityEvent('session_timeout', this.currentUser.id);
    }
    this.logout();
    // Redirect to login page
    window.location.href = '/admin/login';
  }

  refreshSession(): void {
    if (this.currentUser) {
      this.startSessionTimer();
    }
  }

  // Security event logging
  private logSecurityEvent(type: string, userId?: string, metadata?: any): void {
    const event: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      severity: this.getEventSeverity(type),
      userId,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      description: this.getEventDescription(type, metadata),
      metadata: metadata || {},
      resolved: false
    };

    this.securityEvents.push(event);
    
    // Send to audit log
    this.sendToAuditLog(event);
    
    // Alert on critical events
    if (event.severity === 'critical') {
      this.alertAdmins(event);
    }
  }

  private getEventSeverity(type: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'login_success': 'low',
      'login_failure': 'medium',
      'login_error': 'high',
      'logout': 'low',
      'session_timeout': 'medium',
      'permission_denied': 'high',
      'suspicious_activity': 'critical',
      'data_breach': 'critical'
    };
    return severityMap[type] || 'medium';
  }

  private getEventDescription(type: string, metadata?: any): string {
    const descriptions: Record<string, string> = {
      'login_success': 'Admin user logged in successfully',
      'login_failure': `Login attempt failed: ${metadata?.reason || 'Invalid credentials'}`,
      'login_error': 'Login error occurred',
      'logout': 'Admin user logged out',
      'session_timeout': 'Admin session timed out',
      'permission_denied': `Permission denied for: ${metadata?.permission || 'unknown'}`
    };
    return descriptions[type] || `Security event: ${type}`;
  }

  private getClientIP(): string {
    // In a real implementation, this would get the actual client IP
    return '127.0.0.1';
  }

  private async sendToAuditLog(event: SecurityEvent): Promise<void> {
    // Send security event to audit log system
    console.log('Security event logged:', event);
  }

  private async alertAdmins(event: SecurityEvent): Promise<void> {
    // Send alert to other admins about critical security event
    console.log('Critical security event:', event);
  }

  // User and permission loading
  private async loadUserPermissions(user: AdminUser): Promise<void> {
    try {
      const permissions = await this.getUserPermissions(user.id);
      this.permissions = new Set(permissions);
    } catch (error) {
      console.error('Failed to load user permissions:', error);
      this.permissions = new Set();
    }
  }

  private async getUserPermissions(_userId: string): Promise<string[]> {
    // Mock permissions based on role
    const rolePermissions: Record<string, string[]> = {
      admin: [
        'admin.all',
        'users.read', 'users.write', 'users.delete',
        'content.read', 'content.write', 'content.delete',
        'system.read', 'system.write', 'system.admin',
        'security.read', 'security.write', 'security.admin',
        'analytics.read', 'analytics.write'
      ],
      instructor: [
        'users.read',
        'content.read', 'content.write',
        'analytics.read'
      ],
      student: [
        'content.read'
      ]
    };

    const user = this.currentUser;
    return rolePermissions[user?.role || 'student'] || [];
  }

  private async getUserById(userId: string): Promise<AdminUser | null> {
    // Mock user lookup
    return this.currentUser?.id === userId ? this.currentUser : null;
  }

  private async mockAuthAPI(email: string, password: string, _twoFactorCode?: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    // Mock authentication - in real implementation, this would call your auth API
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    if (email === 'admin@example.com' && password === 'admin123') {
      const user: AdminUser = {
        id: 'admin_1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        status: 'active',
        createdAt: new Date('2023-01-01'),
        lastLoginAt: new Date(),
        loginCount: 42,
        xpTotal: 0,
        lessonsCompleted: 0,
        averageScore: 0,
        timeSpent: 0,
        emailVerified: true,
        twoFactorEnabled: false
      };

      return { success: true, user };
    }

    return { success: false, error: 'Invalid credentials' };
  }

  // Getters
  getCurrentUser(): AdminUser | null {
    return this.currentUser;
  }

  getPermissions(): string[] {
    return Array.from(this.permissions);
  }

  getSecurityEvents(): SecurityEvent[] {
    return this.securityEvents;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // IP Whitelisting
  private allowedIPs: Set<string> = new Set(['127.0.0.1', '::1']);

  addAllowedIP(ip: string): void {
    this.requirePermission('security.admin');
    this.allowedIPs.add(ip);
  }

  removeAllowedIP(ip: string): void {
    this.requirePermission('security.admin');
    this.allowedIPs.delete(ip);
  }

  isIPAllowed(ip: string): boolean {
    return this.allowedIPs.has(ip);
  }

  // Multi-factor authentication
  async generateTwoFactorSecret(): Promise<string> {
    this.requirePermission('users.write');
    // Generate TOTP secret
    return 'JBSWY3DPEHPK3PXP'; // Mock secret
  }

  async verifyTwoFactorCode(_secret: string, code: string): Promise<boolean> {
    // Verify TOTP code
    return code === '123456'; // Mock verification
  }
}

// Permission constants
export const ADMIN_PERMISSIONS = {
  // User management
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
  USERS_DELETE: 'users.delete',
  USERS_ADMIN: 'users.admin',

  // Content management
  CONTENT_READ: 'content.read',
  CONTENT_WRITE: 'content.write',
  CONTENT_DELETE: 'content.delete',
  CONTENT_ADMIN: 'content.admin',

  // System management
  SYSTEM_READ: 'system.read',
  SYSTEM_WRITE: 'system.write',
  SYSTEM_ADMIN: 'system.admin',

  // Security management
  SECURITY_READ: 'security.read',
  SECURITY_WRITE: 'security.write',
  SECURITY_ADMIN: 'security.admin',

  // Analytics
  ANALYTICS_READ: 'analytics.read',
  ANALYTICS_WRITE: 'analytics.write',

  // Community management
  COMMUNITY_READ: 'community.read',
  COMMUNITY_WRITE: 'community.write',
  COMMUNITY_ADMIN: 'community.admin',

  // All permissions
  ALL: 'admin.all'
} as const;

export const adminAuth = AdminAuthManager.getInstance();
