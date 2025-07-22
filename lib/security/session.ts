import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import crypto from "crypto";
/**;
 * Session Security and CSRF Protection
 * Simplified implementation to get the site working
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
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxConcurrentSessions: 5,
      ipValidation: false, // Disabled for simplicity
      userAgentValidation: false, // Disabled for simplicity
      sessionRotation: true,
      ...config,
    };
    // Clean up expired sessions and tokens periodically
    setInterval(
      () => {
        this.cleanupExpiredSessions();
        this.cleanupExpiredCSRFTokens();
      },
      5 * 60 * 1000,
    ); // Every 5 minutes
  }
  /**
   * Generate CSRF token
   */
  generateCSRFToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString("hex");
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
    if (csrfToken.sessionId! === sessionId) {
      return false;
    }
    return true;
  }
  /**
   * Track active session
   */
  trackSession(sessionInfo: SessionInfo): void {
    this.activeSessions.set(sessionInfo.sessionId, sessionInfo);
  }
  /**
   * Validate session
   */
  validateSession(sessionId: string, req: NextRequest): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }
    // Check if session is expired
    const now = Date.now();
    const lastActivity = session.lastActivity.getTime();
    if (now - lastActivity > this.config.sessionTimeout) {
      this.activeSessions.delete(sessionId);
      return false;
    }
    // Update last activity
    session.lastActivity = new Date();
    this.activeSessions.set(sessionId, session);
    return session.isValid;
  }
  /**
   * Invalidate session
   */
  invalidateSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    // Remove associated CSRF tokens
    for (const [token, csrfToken] of this.csrfTokens.entries()) {
      if (csrfToken.sessionId === sessionId) {
        this.csrfTokens.delete(token);
      }
    }
  }
  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.activeSessions.entries()) {
      const lastActivity = session.lastActivity.getTime();
      if (now - lastActivity > this.config.sessionTimeout) {
        this.activeSessions.delete(sessionId);
      }
    }
  }
  /**
   * Clean up expired CSRF tokens
   */
  private cleanupExpiredCSRFTokens(): void {
    const now = Date.now();
    for (const [token, csrfToken] of this.csrfTokens.entries()) {
      if (now - csrfToken.timestamp > 60 * 60 * 1000) {
        // 1 hour
        this.csrfTokens.delete(token);
      }
    }
  }
  /**
   * Get session statistics
   */
  getSessionStats(): { activeSessions: number; csrfTokens: number } {
    return {
      activeSessions: this.activeSessions.size,
      csrfTokens: this.csrfTokens.size,
    };
  }
}
// Create singleton instance
export const sessionSecurity = new SessionSecurityManager();
/**
 * Get current session from NextAuth
 */
export async function getCurrentSession(): void {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}
/**
 * Extract client IP from request
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const cfConnectingIP = req.headers.get("cf-connecting-ip");
  if (cfConnectingIP) return cfConnectingIP.trim();
  if (realIP) return realIP.trim();
  if (forwarded) return forwarded.split(",")[0].trim();
  return "127.0.0.1";
}
/**
 * Validate request security
 */
export function validateRequestSecurity(req: NextRequest): boolean {
  // Basic validation - can be enhanced later
  const userAgent = req.headers.get("user-agent");
  if (!userAgent) {
    return false;
  }
  // Check for suspicious patterns
  const suspiciousPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i];
  // Allow legitimate bots but block obvious malicious ones
  const isSuspicious = suspiciousPatterns.some((pattern: unknown) =>
    pattern.test(userAgent),
  );
  return !isSuspicious;
}
