/**
 * NextAuth Mock Configuration
 * Provides comprehensive mocking for NextAuth authentication flows
 */

import { vi } from 'vitest';
import type { NextAuthConfig, User, Session, JWT } from 'next-auth';

// Mock user data
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  image: 'https://example.com/avatar.jpg',
  role: 'STUDENT',
  status: 'ACTIVE',
  emailVerified: new Date(),
};

export const mockAdminUser: User = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  name: 'Admin User',
  image: 'https://example.com/admin-avatar.jpg',
  role: 'ADMIN',
  status: 'ACTIVE',
  emailVerified: new Date(),
};

export const mockInstructorUser: User = {
  id: 'instructor-user-id',
  email: 'instructor@example.com',
  name: 'Instructor User',
  image: 'https://example.com/instructor-avatar.jpg',
  role: 'INSTRUCTOR',
  status: 'ACTIVE',
  emailVerified: new Date(),
};

// Mock session data
export const mockSession: Session = {
  user: mockUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  sessionToken: 'mock-session-token',
};

export const mockAdminSession: Session = {
  user: mockAdminUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  sessionToken: 'mock-admin-session-token',
};

// Mock JWT token
export const mockJWT: JWT = {
  sub: mockUser.id,
  email: mockUser.email,
  name: mockUser.name,
  picture: mockUser.image,
  role: mockUser.role,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
};

// Mock credentials provider
export const mockCredentialsProvider = {
  id: 'credentials',
  name: 'Credentials',
  type: 'credentials',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' },
  },
  authorize: vi.fn(),
};

// Mock Google provider
export const mockGoogleProvider = {
  id: 'google',
  name: 'Google',
  type: 'oauth',
  clientId: 'mock-google-client-id',
  clientSecret: 'mock-google-client-secret',
};

// Mock callbacks
export const mockCallbacks = {
  jwt: vi.fn(async ({ token, user, account, profile, trigger, session }) => {
    if (user) {
      token.role = user.role;
      token.status = user.status;
    }
    return token;
  }),

  session: vi.fn(async ({ session, token, user }) => {
    if (token) {
      session.user.id = token.sub;
      session.user.role = token.role as string;
      session.user.status = token.status as string;
    }
    return session;
  }),

  signIn: vi.fn(async ({ user, account, profile, email, credentials }) => {
    // Mock sign-in validation
    if (user.status === 'BANNED') {
      return false;
    }
    return true;
  }),

  redirect: vi.fn(async ({ url, baseUrl }) => {
    return baseUrl;
  }),
};

// Mock pages configuration
export const mockPages = {
  signIn: '/auth/login',
  signUp: '/auth/register',
  error: '/auth/error',
  verifyRequest: '/auth/verify-request',
  newUser: '/auth/new-user',
};

// Mock events
export const mockEvents = {
  signIn: vi.fn(),
  signOut: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  linkAccount: vi.fn(),
  session: vi.fn(),
};

// Complete NextAuth configuration mock
export const mockNextAuthConfig: Partial<NextAuthConfig> = {
  providers: [mockCredentialsProvider, mockGoogleProvider],
  callbacks: mockCallbacks,
  pages: mockPages,
  events: mockEvents,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

// Mock NextAuth functions
export const mockNextAuth = {
  getServerSession: vi.fn(),
  getToken: vi.fn(),
  encode: vi.fn(),
  decode: vi.fn(),
};

// Mock auth response helpers
export const createMockAuthResponse = (success: boolean, data?: any, error?: string) => ({
  success,
  data,
  error,
  timestamp: new Date().toISOString(),
});

export const mockAuthErrors = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_BANNED: 'User account has been banned',
  USER_INACTIVE: 'User account is inactive',
  EMAIL_NOT_VERIFIED: 'Email address not verified',
  ACCOUNT_LOCKED: 'Account temporarily locked due to multiple failed login attempts',
  INVALID_TOKEN: 'Invalid or expired token',
  SESSION_EXPIRED: 'Session has expired',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
};

// Mock session states
export const mockSessionStates = {
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  LOADING: 'loading',
};

// Helper functions for tests
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  ...mockUser,
  ...overrides,
});

export const createMockSession = (userOverrides: Partial<User> = {}): Session => ({
  ...mockSession,
  user: createMockUser(userOverrides),
});

export const createMockJWT = (overrides: Partial<JWT> = {}): JWT => ({
  ...mockJWT,
  ...overrides,
});

// Reset all mocks
export const resetAuthMocks = () => {
  vi.clearAllMocks();
  mockCredentialsProvider.authorize.mockClear();
  mockCallbacks.jwt.mockClear();
  mockCallbacks.session.mockClear();
  mockCallbacks.signIn.mockClear();
  mockCallbacks.redirect.mockClear();
  Object.values(mockEvents).forEach(event => event.mockClear());
  Object.values(mockNextAuth).forEach(fn => fn.mockClear());
};

export default mockNextAuthConfig;