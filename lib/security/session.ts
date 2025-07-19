import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { env, securityConfig, isProduction } from '@/lib/config/environment';
import crypto from 'crypto';

/**
 * Session Security and CSRF Protection
 * Implements secure session management and CSRF token validation
 */

interface SessionSecurityConfig {
  csrfProtection: boolean;
  sessionTimeout: number;
  maxConcurrentSessions: number;
  ipValidation: boolean;
  userAgentValidation: boolean;
  sessionRotation: boolean;
}

interface CSRFToken {
  token: string;
  timestamp: number;
  sessionId: string;
}

interface SessionInfo {
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  isValid: boolean;
}

class SessionSecurityManager {
  private readonly config: SessionSecurityConfig;
  private readonly activeSessions: Map<string, SessionInfo> = new Map();
  private readonly csrfTokens: Map<string, CSRFToken> = new Map();

  constructor(config: Partial<SessionSecurityConfig> = {}) {
    this.config = {
      csrfProtection: true,
      sessionTimeout: env.SESSION_TIMEOUT,
      maxConcurrentSessions: 5,
      ipValidation: isProduction,
      userAgentValidation: isProduction,
      sessionRotation: true,
      ...config,
    };

    // Clean up expired sessions and tokens periodically
    setInterval(() => {
      this.cleanupExpiredSessions();
      this.cleanupExpiredCSRFTokens();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const csrfToken: CSRFToken = {
      token,
      timestamp: Date.now(),
      sessionId,
    };

    this.csrfTokens.set(token, csrfToken);
    return token;
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string, sessionId: string): boolean {
    if (!this.config.csrfProtection) {
      return true;
    }

    const csrfToken = this.csrfTokens.get(token);
    if (!csrfToken) {
      return false;
    }

    // Check if token is expired (1 hour)
    const tokenAge = Date.now() - csrfToken.timestamp;
    if (tokenAge > 60 * 60 * 1000) {
      this.csrfTokens.delete(token);
      return false;
    }

    // Check if token belongs to the session
    if (csrfToken.sessionId !== sessionId) {
      return false;
    }

    return true;
  }

  /**
   * Create session info
   */
  createSession(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string
  ): SessionInfo {
    const sessionInfo: SessionInfo = {
      userId,
      sessionId,
      ipAddress,
      userAgent,
      createdAt: new Date(),
      lastActivity: new Date(),
      isValid: true,
    };

    // Check concurrent session limit
    const userSessions = Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId && session.isValid);

    if (userSessions.length >= this.config.maxConcurrentSessions) {
      // Invalidate oldest session
      const oldestSession = userSessions
        .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())[0];
      
      if (oldestSession) {
        this.invalidateSession(oldestSession.sessionId);
      }
    }

    this.activeSessions.set(sessionId, sessionInfo);
    return sessionInfo;
  }

  /**
   * Validate session
   */
  validateSession(
    sessionId: string,
    ipAddress: string,
    userAgent: string
  ): { isValid: boolean; reason?: string } {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return { isValid: false, reason: 'Session not found' };
    }

    if (!session.isValid) {
      return { isValid: false, reason: 'Session invalidated' };
    }

    // Check session timeout
    const sessionAge = Date.now() - session.lastActivity.getTime();
    if (sessionAge > this.config.sessionTimeout * 1000) {
      this.invalidateSession(sessionId);
      return { isValid: false, reason: 'Session expired' };
    }

    // Validate IP address (if enabled)
    if (this.config.ipValidation && session.ipAddress !== ipAddress) {
      this.invalidateSession(sessionId);
      return { isValid: false, reason: 'IP address mismatch' };
    }

    // Validate User Agent (if enabled)
    if (this.config.userAgentValidation && session.userAgent !== userAgent) {
      this.invalidateSession(sessionId);
      return { isValid: false, reason: 'User agent mismatch' };
    }

    // Update last activity
    session.lastActivity = new Date();
    this.activeSessions.set(sessionId, session);

    return { isValid: true };
  }

  /**
   * Invalidate session
   */
  invalidateSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isValid = false;
      this.activeSessions.set(sessionId, session);
    }

    // Remove associated CSRF tokens
    for (const [token, csrfToken] of this.csrfTokens.entries()) {
      if (csrfToken.sessionId === sessionId) {
        this.csrfTokens.delete(token);
      }
    }
  }

  /**
   * Invalidate all user sessions
   */
  invalidateUserSessions(userId: string): void {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.invalidateSession(sessionId);
      }
    }
  }

  /**
   * Get active sessions for user
   */
  getUserSessions(userId: string): SessionInfo[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId && session.isValid);
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const sessionAge = now - session.lastActivity.getTime();
      if (sessionAge > this.config.sessionTimeout * 1000) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Clean up expired CSRF tokens
   */
  private cleanupExpiredCSRFTokens(): void {
    const now = Date.now();
    const expiredTokens: string[] = [];

    for (const [token, csrfToken] of this.csrfTokens.entries()) {
      const tokenAge = now - csrfToken.timestamp;
      if (tokenAge > 60 * 60 * 1000) { // 1 hour
        expiredTokens.push(token);
      }
    }

    expiredTokens.forEach(token => {
      this.csrfTokens.delete(token);
    });

    if (expiredTokens.length > 0) {
      console.log(`Cleaned up ${expiredTokens.length} expired CSRF tokens`);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    activeSessions: number;
    activeCSRFTokens: number;
    sessionsByUser: Record<string, number>;
  } {
    const sessionsByUser: Record<string, number> = {};
    
    for (const session of this.activeSessions.values()) {
      if (session.isValid) {
        sessionsByUser[session.userId] = (sessionsByUser[session.userId] || 0) + 1;
      }
    }

    return {
      activeSessions: Array.from(this.activeSessions.values())
        .filter(session => session.isValid).length,
      activeCSRFTokens: this.csrfTokens.size,
      sessionsByUser,
    };
  }
}

// Create singleton instance
export const sessionSecurity = new SessionSecurityManager();

/**
 * Extract client information from request
 */
export function getClientInfo(request: NextRequest): {
  ipAddress: string;
  userAgent: string;
  fingerprint: string;
} {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 
                   request.headers.get('x-real-ip') || 
                   request.headers.get('x-real-ip') ||
                   'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create a fingerprint based on headers
  const fingerprint = crypto
    .createHash('sha256')
    .update(userAgent + ipAddress + (request.headers.get('accept-language') || ''))
    .digest('hex')
    .substring(0, 16);

  return { ipAddress, userAgent, fingerprint };
}

/**
 * Validate session from request
 */
export async function validateSessionFromRequest(
  request: NextRequest
): Promise<{ isValid: boolean; session?: any; reason?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { isValid: false, reason: 'No session found' };
    }

    const { ipAddress, userAgent } = getClientInfo(request);
    const sessionId = session.user.id; // Using user ID as session ID for simplicity

    const validation = sessionSecurity.validateSession(sessionId, ipAddress, userAgent);
    
    if (!validation.isValid) {
      return { isValid: false, reason: validation.reason };
    }

    return { isValid: true, session };
  } catch (error) {
    console.error('Session validation error:', error);
    return { isValid: false, reason: 'Session validation failed' };
  }
}

/**
 * Create secure session
 */
export async function createSecureSession(
  request: NextRequest,
  userId: string
): Promise<{ sessionId: string; csrfToken: string }> {
  const { ipAddress, userAgent } = getClientInfo(request);
  const sessionId = crypto.randomUUID();

  const sessionInfo = sessionSecurity.createSession(userId, sessionId, ipAddress, userAgent);

  // Enhanced session creation with analytics and logging
  console.log('Session created:', {
    userId,
    sessionId: sessionInfo.sessionId,
    ipAddress,
    userAgent: userAgent?.substring(0, 50) + '...', // Truncate for privacy
    timestamp: sessionInfo.createdAt,
    expiresAt: (sessionInfo as any).expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  // Store session analytics
  if (typeof localStorage !== 'undefined') {
    const sessionAnalytics = JSON.parse(localStorage.getItem('session-analytics') || '[]');
    sessionAnalytics.push({
      type: 'session-created',
      userId,
      sessionId: sessionInfo.sessionId,
      timestamp: Date.now(),
      metadata: {
        hasUserAgent: !!userAgent,
        ipAddressLength: ipAddress?.length || 0
      }
    });
    localStorage.setItem('session-analytics', JSON.stringify(sessionAnalytics.slice(-100)));
  }
  const csrfToken = sessionSecurity.generateCSRFToken(sessionId);

  return { sessionId, csrfToken };
}

/**
 * CSRF protection middleware
 */
export function validateCSRF(request: NextRequest, sessionId: string): boolean {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return true; // Skip CSRF for safe methods
  }

  const csrfToken = request.headers.get('x-csrf-token') || 
                   request.headers.get('csrf-token');

  if (!csrfToken) {
    return false;
  }

  return sessionSecurity.validateCSRFToken(csrfToken, sessionId);
}

/**
 * Session security middleware
 */
export function createSessionMiddleware() {
  return async (request: NextRequest) => {
    const validation = await validateSessionFromRequest(request);
    
    if (!validation.isValid) {
      console.warn(`Session validation failed: ${validation.reason}`);
      // Don't block request, just log for monitoring
    }

    return null; // Continue to next middleware
  };
}

/**
 * Generate secure cookie options
 */
export function getSecureCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
} {
  return {
    httpOnly: securityConfig.session.httpOnly,
    secure: securityConfig.session.secure,
    sameSite: securityConfig.session.sameSite,
    maxAge: securityConfig.session.maxAge,
    path: '/',
  };
}

/**
 * Detect suspicious session activity
 */
export function detectSuspiciousActivity(
  sessionId: string,
  request: NextRequest
): { isSuspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const { ipAddress, userAgent } = getClientInfo(request);

  // Enhanced suspicious activity detection using sessionId for tracking
  console.log('Analyzing session activity:', {
    sessionId,
    ipAddress,
    userAgent: userAgent.substring(0, 50) + '...',
    timestamp: Date.now()
  });

  // Store session activity for pattern analysis
  if (typeof localStorage !== 'undefined') {
    const activityLog = JSON.parse(localStorage.getItem(`session_${sessionId}_activity`) || '[]');
    activityLog.push({
      timestamp: Date.now(),
      ipAddress,
      userAgent,
      url: request.url,
      method: request.method
    });
    localStorage.setItem(`session_${sessionId}_activity`, JSON.stringify(activityLog.slice(-20))); // Keep last 20 activities

    // Check for rapid requests pattern
    const recentActivity = activityLog.filter((activity: any) =>
      Date.now() - activity.timestamp < 60000 // Last minute
    );

    if (recentActivity.length > 10) {
      reasons.push('Rapid request pattern detected');
    }
  }

  // Check for rapid requests from same IP
  // This would typically be implemented with Redis or database

  // Check for unusual user agent patterns
  if (userAgent.includes('bot') || userAgent.includes('crawler')) {
    reasons.push('Bot-like user agent detected');
  }

  // Check for suspicious IP patterns
  if (ipAddress.startsWith('10.') || ipAddress.startsWith('192.168.')) {
    // Private IP ranges might be suspicious in production
    if (isProduction) {
      reasons.push('Private IP address in production');
    }
  }

  // Log suspicious activity detection
  if (reasons.length > 0) {
    console.warn('Suspicious activity detected:', {
      sessionId,
      reasons,
      ipAddress,
      timestamp: Date.now()
    });
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}

/**
 * Export session security utilities
 */
export {
  SessionSecurityManager,
  type SessionInfo,
  type CSRFToken,
  type SessionSecurityConfig,
};
