/**
 * Session Manager Mock
 * Provides comprehensive mocking for session management operations
 */

import { vi } from 'vitest';

export interface MockSession {
  id: string;
  userId: string;
  email: string;
  role: string;
  status: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

// Mock session data
export const mockSessionData: MockSession = {
  id: 'session-id-123',
  userId: 'test-user-id',
  email: 'test@example.com',
  role: 'STUDENT',
  status: 'ACTIVE',
  token: 'mock-session-token-123',
  refreshToken: 'mock-refresh-token-123',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  createdAt: new Date(),
  lastActivityAt: new Date(),
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0 (Test Browser)',
  isActive: true,
};

export const mockExpiredSession: MockSession = {
  ...mockSessionData,
  id: 'expired-session-id',
  token: 'expired-token-123',
  expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  isActive: false,
};

export const mockAdminSession: MockSession = {
  ...mockSessionData,
  id: 'admin-session-id',
  userId: 'admin-user-id',
  email: 'admin@example.com',
  role: 'ADMIN',
  token: 'admin-token-123',
  refreshToken: 'admin-refresh-token-123',
};

// Mock session storage
const mockSessionStorage = new Map<string, MockSession>();

// Initialize with default sessions
mockSessionStorage.set(mockSessionData.id, mockSessionData);
mockSessionStorage.set(mockExpiredSession.id, mockExpiredSession);
mockSessionStorage.set(mockAdminSession.id, mockAdminSession);

// Session Manager Mock Implementation
export const mockSessionManager = {
  // Create new session
  createSession: vi.fn(async (userId: string, userData: any) => {
    const sessionId = `session-${Date.now()}`;
    const token = `token-${Date.now()}`;
    const refreshToken = `refresh-${Date.now()}`;
    
    const session: MockSession = {
      id: sessionId,
      userId,
      email: userData.email,
      role: userData.role,
      status: userData.status,
      token,
      refreshToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      lastActivityAt: new Date(),
      ipAddress: userData.ipAddress || '127.0.0.1',
      userAgent: userData.userAgent || 'Test User Agent',
      isActive: true,
    };

    mockSessionStorage.set(sessionId, session);
    return { success: true, session, token, refreshToken };
  }),

  // Validate session by token
  validateSession: vi.fn(async (token: string) => {
    const session = Array.from(mockSessionStorage.values())
      .find(s => s.token === token);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (!session.isActive) {
      return { success: false, error: 'Session is inactive' };
    }

    if (session.expiresAt < new Date()) {
      session.isActive = false;
      return { success: false, error: 'Session expired' };
    }

    // Update last activity
    session.lastActivityAt = new Date();
    return { success: true, session };
  }),

  // Refresh session token
  refreshSession: vi.fn(async (refreshToken: string) => {
    const session = Array.from(mockSessionStorage.values())
      .find(s => s.refreshToken === refreshToken);

    if (!session) {
      return { success: false, error: 'Invalid refresh token' };
    }

    if (!session.isActive) {
      return { success: false, error: 'Session is inactive' };
    }

    // Generate new tokens
    const newToken = `token-${Date.now()}`;
    const newRefreshToken = `refresh-${Date.now()}`;
    
    session.token = newToken;
    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    session.lastActivityAt = new Date();

    return { 
      success: true, 
      session, 
      token: newToken, 
      refreshToken: newRefreshToken 
    };
  }),

  // Destroy session
  destroySession: vi.fn(async (token: string) => {
    const session = Array.from(mockSessionStorage.values())
      .find(s => s.token === token);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    session.isActive = false;
    mockSessionStorage.delete(session.id);
    return { success: true, message: 'Session destroyed' };
  }),

  // Get session by ID
  getSessionById: vi.fn(async (sessionId: string) => {
    const session = mockSessionStorage.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }
    return { success: true, session };
  }),

  // Get all active sessions for user
  getUserSessions: vi.fn(async (userId: string) => {
    const sessions = Array.from(mockSessionStorage.values())
      .filter(s => s.userId === userId && s.isActive);
    return { success: true, sessions };
  }),

  // Destroy all sessions for user
  destroyUserSessions: vi.fn(async (userId: string) => {
    const sessions = Array.from(mockSessionStorage.values())
      .filter(s => s.userId === userId);
    
    sessions.forEach(session => {
      session.isActive = false;
      mockSessionStorage.delete(session.id);
    });

    return { success: true, destroyedCount: sessions.length };
  }),

  // Clean up expired sessions
  cleanupExpiredSessions: vi.fn(async () => {
    const now = new Date();
    const expiredSessions = Array.from(mockSessionStorage.values())
      .filter(s => s.expiresAt < now);

    expiredSessions.forEach(session => {
      session.isActive = false;
      mockSessionStorage.delete(session.id);
    });

    return { success: true, cleanedCount: expiredSessions.length };
  }),

  // Update session activity
  updateSessionActivity: vi.fn(async (token: string) => {
    const session = Array.from(mockSessionStorage.values())
      .find(s => s.token === token);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    session.lastActivityAt = new Date();
    return { success: true, session };
  }),

  // Check if session exists
  sessionExists: vi.fn(async (token: string) => {
    const session = Array.from(mockSessionStorage.values())
      .find(s => s.token === token);
    return { exists: !!session, isActive: session?.isActive || false };
  }),

  // Get session count for user
  getSessionCount: vi.fn(async (userId: string) => {
    const count = Array.from(mockSessionStorage.values())
      .filter(s => s.userId === userId && s.isActive).length;
    return { success: true, count };
  }),
};

// Mock session events
export const mockSessionEvents = {
  onSessionCreated: vi.fn(),
  onSessionValidated: vi.fn(),
  onSessionRefreshed: vi.fn(),
  onSessionDestroyed: vi.fn(),
  onSessionExpired: vi.fn(),
};

// Mock session configuration
export const mockSessionConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  refreshThreshold: 60 * 60 * 1000, // 1 hour
  maxConcurrentSessions: 5,
  cleanupInterval: 60 * 60 * 1000, // 1 hour
  trackLastActivity: true,
  secureOnly: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  httpOnly: true,
};

// Helper functions for tests
export const createMockSession = (overrides: Partial<MockSession> = {}): MockSession => ({
  ...mockSessionData,
  ...overrides,
});

export const createExpiredSession = (overrides: Partial<MockSession> = {}): MockSession => ({
  ...mockExpiredSession,
  ...overrides,
});

export const addMockSession = (session: MockSession) => {
  mockSessionStorage.set(session.id, session);
};

export const removeMockSession = (sessionId: string) => {
  mockSessionStorage.delete(sessionId);
};

export const clearMockSessions = () => {
  mockSessionStorage.clear();
  // Re-add default sessions
  mockSessionStorage.set(mockSessionData.id, mockSessionData);
  mockSessionStorage.set(mockExpiredSession.id, mockExpiredSession);
  mockSessionStorage.set(mockAdminSession.id, mockAdminSession);
};

export const getMockSessionStorage = () => mockSessionStorage;

// Reset all session mocks
export const resetSessionMocks = () => {
  vi.clearAllMocks();
  Object.values(mockSessionManager).forEach(fn => fn.mockClear());
  Object.values(mockSessionEvents).forEach(fn => fn.mockClear());
  clearMockSessions();
};

export default mockSessionManager;