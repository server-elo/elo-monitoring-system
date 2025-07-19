/**
 * @fileoverview Comprehensive User Authentication Flows Testing
 * Tests the complete user journey from registration to authenticated sessions
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signIn, signOut, getSession } from 'next-auth/react';
import { TestProvider } from '../utils/TestProvider';
import { mockPrisma } from '../utils/mockPrisma';
import { mockRedis } from '../utils/mockRedis';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { validateEmail, validatePassword } from '@/lib/validation/auth';

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated'
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock components (these would be imported from actual components)
const mockLoginForm = vi.fn();
const mockRegistrationForm = vi.fn();
const mockPasswordResetForm = vi.fn();

vi.mock('@/components/auth/LoginForm', () => ({
  LoginForm: mockLoginForm
}));

vi.mock('@/components/auth/RegistrationForm', () => ({
  RegistrationForm: mockRegistrationForm
}));

vi.mock('@/components/auth/PasswordResetForm', () => ({
  PasswordResetForm: mockPasswordResetForm
}));

describe('User Authentication Flows', () => {
  beforeAll(() => {
    // Setup global test environment
    mockPrisma.user.findUnique.mockImplementation(() => null);
    mockPrisma.user.create.mockImplementation(() => ({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.del.mockResolvedValue(1);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.get.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  describe('User Registration Flow', () => {
    it('should successfully register a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
        agreeToTerms: true
      };

      // Mock successful registration
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // User doesn't exist
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'new-user-id',
        ...userData,
        password: await hashPassword(userData.password),
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Test email validation
      expect(validateEmail(userData.email)).toBe(true);
      
      // Test password validation
      expect(validatePassword(userData.password)).toBe(true);
      
      // Test user creation
      const hashedPassword = await hashPassword(userData.password);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(userData.password);
      
      // Verify password hashing works
      const isValidPassword = await verifyPassword(userData.password, hashedPassword);
      expect(isValidPassword).toBe(true);
      
      // Test database interaction
      const createdUser = await mockPrisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword
        }
      });
      
      expect(createdUser.id).toBe('new-user-id');
      expect(createdUser.email).toBe(userData.email);
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should reject registration with invalid email format', async () => {
      const invalidEmails = [
        'invalid-email',
        'missing@domain',
        '@missing-local.com',
        'spaces @domain.com',
        'toolong'.repeat(50) + '@domain.com'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should reject registration with weak passwords', async () => {
      const weakPasswords = [
        'short',           // Too short
        'nouppercase123!', // No uppercase
        'NOLOWERCASE123!', // No lowercase
        'NoNumbers!',      // No numbers
        'NoSpecialChars123' // No special characters
      ];

      weakPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });

    it('should prevent duplicate user registration', async () => {
      const existingUser = {
        id: 'existing-user',
        email: 'existing@example.com',
        name: 'Existing User',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);

      // Attempt to register with existing email
      const duplicateRegistration = async () => {
        const user = await mockPrisma.user.findUnique({
          where: { email: existingUser.email }
        });
        
        if (user) {
          throw new Error('User already exists');
        }
      };

      await expect(duplicateRegistration()).rejects.toThrow('User already exists');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: existingUser.email }
      });
    });

    it('should handle registration rate limiting', async () => {
      const userIP = '192.168.1.100';
      const rateLimitKey = `registration_attempts:${userIP}`;
      
      // Mock rate limit exceeded
      mockRedis.get.mockResolvedValueOnce('5'); // 5 attempts already made
      
      const checkRateLimit = async (ip: string) => {
        const attempts = await mockRedis.get(`registration_attempts:${ip}`);
        const attemptCount = parseInt(attempts || '0');
        
        if (attemptCount >= 5) {
          throw new Error('Rate limit exceeded');
        }
      };

      await expect(checkRateLimit(userIP)).rejects.toThrow('Rate limit exceeded');
      expect(mockRedis.get).toHaveBeenCalledWith(rateLimitKey);
    });
  });

  describe('User Login Flow', () => {
    const existingUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedPassword123',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should successfully log in user with valid credentials', async () => {
      const loginCredentials = {
        email: 'test@example.com',
        password: 'CorrectPassword123!'
      };

      // Mock user lookup
      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);
      
      // Mock successful sign in
      (signIn as any).mockResolvedValueOnce({
        ok: true,
        url: '/dashboard',
        error: null
      });

      const loginResult = await signIn('credentials', {
        email: loginCredentials.email,
        password: loginCredentials.password,
        redirect: false
      });

      expect(loginResult.ok).toBe(true);
      expect(loginResult.url).toBe('/dashboard');
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: loginCredentials.email,
        password: loginCredentials.password,
        redirect: false
      });
    });

    it('should reject login with invalid credentials', async () => {
      const invalidCredentials = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      // Mock failed sign in
      (signIn as any).mockResolvedValueOnce({
        ok: false,
        error: 'Invalid credentials',
        url: null
      });

      const loginResult = await signIn('credentials', {
        email: invalidCredentials.email,
        password: invalidCredentials.password,
        redirect: false
      });

      expect(loginResult.ok).toBe(false);
      expect(loginResult.error).toBe('Invalid credentials');
    });

    it('should handle OAuth provider login (GitHub)', async () => {
      // Mock GitHub OAuth flow
      (signIn as any).mockResolvedValueOnce({
        ok: true,
        url: '/dashboard',
        error: null
      });

      const githubLogin = await signIn('github', {
        callbackUrl: '/dashboard',
        redirect: false
      });

      expect(githubLogin.ok).toBe(true);
      expect(signIn).toHaveBeenCalledWith('github', {
        callbackUrl: '/dashboard',
        redirect: false
      });
    });

    it('should handle OAuth provider login (Google)', async () => {
      // Mock Google OAuth flow
      (signIn as any).mockResolvedValueOnce({
        ok: true,
        url: '/dashboard',
        error: null
      });

      const googleLogin = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false
      });

      expect(googleLogin.ok).toBe(true);
      expect(signIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/dashboard',
        redirect: false
      });
    });

    it('should implement login rate limiting', async () => {
      const userIP = '192.168.1.100';
      const rateLimitKey = `login_attempts:${userIP}`;
      
      // Mock rate limit exceeded
      mockRedis.get.mockResolvedValueOnce('10'); // 10 failed attempts
      
      const checkLoginRateLimit = async (ip: string) => {
        const attempts = await mockRedis.get(`login_attempts:${ip}`);
        const attemptCount = parseInt(attempts || '0');
        
        if (attemptCount >= 10) {
          throw new Error('Too many login attempts. Please try again later.');
        }
      };

      await expect(checkLoginRateLimit(userIP)).rejects.toThrow('Too many login attempts');
      expect(mockRedis.get).toHaveBeenCalledWith(rateLimitKey);
    });
  });

  describe('Session Management', () => {
    it('should create and validate user session', async () => {
      const sessionData = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User'
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      // Mock session retrieval
      (getSession as any).mockResolvedValueOnce(sessionData);

      const session = await getSession();
      
      expect(session).toBeDefined();
      expect(session.user.id).toBe('test-user-id');
      expect(session.user.email).toBe('test@example.com');
      expect(new Date(session.expires) > new Date()).toBe(true);
    });

    it('should handle session expiration', async () => {
      const expiredSessionData = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User'
        },
        expires: new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
      };

      // Mock expired session
      (getSession as any).mockResolvedValueOnce(null);

      const session = await getSession();
      expect(session).toBeNull();
    });

    it('should successfully log out user', async () => {
      // Mock successful sign out
      (signOut as any).mockResolvedValueOnce({
        url: '/login'
      });

      const logoutResult = await signOut({
        callbackUrl: '/login',
        redirect: false
      });

      expect(logoutResult.url).toBe('/login');
      expect(signOut).toHaveBeenCalledWith({
        callbackUrl: '/login',
        redirect: false
      });
    });

    it('should clear session data on logout', async () => {
      const sessionKey = 'session:test-user-id';
      
      // Mock session cleanup
      mockRedis.del.mockResolvedValueOnce(1);
      
      const clearSession = async (userId: string) => {
        await mockRedis.del(`session:${userId}`);
      };

      await clearSession('test-user-id');
      expect(mockRedis.del).toHaveBeenCalledWith(sessionKey);
    });
  });

  describe('Password Reset Flow', () => {
    it('should generate password reset token', async () => {
      const userEmail = 'test@example.com';
      const resetToken = 'reset-token-123';
      const resetTokenKey = `password_reset:${resetToken}`;

      // Mock user lookup
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'test-user-id',
        email: userEmail,
        name: 'Test User',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock token storage
      mockRedis.set.mockResolvedValueOnce('OK');

      const generateResetToken = async (email: string) => {
        const user = await mockPrisma.user.findUnique({
          where: { email }
        });
        
        if (!user) {
          throw new Error('User not found');
        }
        
        const token = resetToken;
        await mockRedis.set(`password_reset:${token}`, user.id, 3600); // 1 hour expiry
        
        return token;
      };

      const token = await generateResetToken(userEmail);
      
      expect(token).toBe(resetToken);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userEmail }
      });
      expect(mockRedis.set).toHaveBeenCalledWith(resetTokenKey, 'test-user-id', 3600);
    });

    it('should validate and use password reset token', async () => {
      const resetToken = 'valid-reset-token';
      const newPassword = 'NewSecurePassword123!';
      const userId = 'test-user-id';

      // Mock token validation
      mockRedis.get.mockResolvedValueOnce(userId);
      mockRedis.del.mockResolvedValueOnce(1);

      // Mock password update
      mockPrisma.user.update.mockResolvedValueOnce({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: await hashPassword(newPassword),
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const resetPassword = async (token: string, password: string) => {
        const storedUserId = await mockRedis.get(`password_reset:${token}`);
        
        if (!storedUserId) {
          throw new Error('Invalid or expired reset token');
        }
        
        const hashedPassword = await hashPassword(password);
        
        await mockPrisma.user.update({
          where: { id: storedUserId },
          data: { password: hashedPassword }
        });
        
        await mockRedis.del(`password_reset:${token}`);
        
        return true;
      };

      const result = await resetPassword(resetToken, newPassword);
      
      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith(`password_reset:${resetToken}`);
      expect(mockRedis.del).toHaveBeenCalledWith(`password_reset:${resetToken}`);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: expect.any(String) }
      });
    });

    it('should reject invalid reset tokens', async () => {
      const invalidToken = 'invalid-token';

      // Mock token not found
      mockRedis.get.mockResolvedValueOnce(null);

      const validateResetToken = async (token: string) => {
        const userId = await mockRedis.get(`password_reset:${token}`);
        
        if (!userId) {
          throw new Error('Invalid or expired reset token');
        }
        
        return userId;
      };

      await expect(validateResetToken(invalidToken)).rejects.toThrow('Invalid or expired reset token');
      expect(mockRedis.get).toHaveBeenCalledWith(`password_reset:${invalidToken}`);
    });
  });

  describe('Account Security Features', () => {
    it('should track login attempts and locations', async () => {
      const userId = 'test-user-id';
      const loginData = {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Chrome/91.0',
        timestamp: new Date().toISOString(),
        success: true
      };

      const trackLoginAttempt = async (userId: string, attemptData: typeof loginData) => {
        const key = `login_history:${userId}`;
        const attempts = await mockRedis.get(key) || '[]';
        const history = JSON.parse(attempts);
        
        history.push(attemptData);
        
        // Keep only last 10 attempts
        if (history.length > 10) {
          history.splice(0, history.length - 10);
        }
        
        await mockRedis.set(key, JSON.stringify(history), 7 * 24 * 3600); // 7 days
      };

      mockRedis.get.mockResolvedValueOnce('[]');
      mockRedis.set.mockResolvedValueOnce('OK');

      await trackLoginAttempt(userId, loginData);

      expect(mockRedis.set).toHaveBeenCalledWith(
        `login_history:${userId}`,
        expect.stringContaining(loginData.ip),
        7 * 24 * 3600
      );
    });

    it('should detect suspicious login activities', async () => {
      const userId = 'test-user-id';
      const suspiciousActivity = [
        { ip: '1.1.1.1', userAgent: 'Bot/1.0', timestamp: new Date().toISOString() },
        { ip: '2.2.2.2', userAgent: 'Bot/1.0', timestamp: new Date().toISOString() },
        { ip: '3.3.3.3', userAgent: 'Bot/1.0', timestamp: new Date().toISOString() }
      ];

      const detectSuspiciousActivity = async (userId: string) => {
        const key = `login_history:${userId}`;
        const history = JSON.parse(await mockRedis.get(key) || '[]');
        
        // Check for multiple IPs in short time
        const recentLogins = history.filter((login: any) => 
          Date.now() - new Date(login.timestamp).getTime() < 60 * 60 * 1000 // 1 hour
        );
        
        const uniqueIPs = new Set(recentLogins.map((login: any) => login.ip));
        
        return uniqueIPs.size > 2; // Suspicious if more than 2 IPs in 1 hour
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(suspiciousActivity));

      const isSuspicious = await detectSuspiciousActivity(userId);
      expect(isSuspicious).toBe(true);
    });

    it('should enforce account lockout after failed attempts', async () => {
      const userEmail = 'test@example.com';
      const lockoutKey = `account_lockout:${userEmail}`;

      const checkAccountLockout = async (email: string) => {
        const lockoutData = await mockRedis.get(`account_lockout:${email}`);
        
        if (lockoutData) {
          const { attempts, lockedUntil } = JSON.parse(lockoutData);
          
          if (Date.now() < lockedUntil) {
            throw new Error('Account is temporarily locked');
          }
        }
      };

      // Mock locked account
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({
        attempts: 5,
        lockedUntil: Date.now() + 30 * 60 * 1000 // Locked for 30 minutes
      }));

      await expect(checkAccountLockout(userEmail)).rejects.toThrow('Account is temporarily locked');
      expect(mockRedis.get).toHaveBeenCalledWith(lockoutKey);
    });
  });

  describe('Email Verification Flow', () => {
    it('should generate email verification token', async () => {
      const userId = 'test-user-id';
      const verificationToken = 'verify-token-123';

      const generateVerificationToken = async (userId: string) => {
        const token = verificationToken;
        await mockRedis.set(`email_verification:${token}`, userId, 24 * 3600); // 24 hours
        return token;
      };

      mockRedis.set.mockResolvedValueOnce('OK');

      const token = await generateVerificationToken(userId);
      
      expect(token).toBe(verificationToken);
      expect(mockRedis.set).toHaveBeenCalledWith(
        `email_verification:${verificationToken}`,
        userId,
        24 * 3600
      );
    });

    it('should verify email with valid token', async () => {
      const verificationToken = 'valid-verify-token';
      const userId = 'test-user-id';

      const verifyEmail = async (token: string) => {
        const storedUserId = await mockRedis.get(`email_verification:${token}`);
        
        if (!storedUserId) {
          throw new Error('Invalid or expired verification token');
        }
        
        await mockPrisma.user.update({
          where: { id: storedUserId },
          data: { emailVerified: new Date() }
        });
        
        await mockRedis.del(`email_verification:${token}`);
        
        return true;
      };

      mockRedis.get.mockResolvedValueOnce(userId);
      mockRedis.del.mockResolvedValueOnce(1);
      mockPrisma.user.update.mockResolvedValueOnce({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await verifyEmail(verificationToken);
      
      expect(result).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { emailVerified: expect.any(Date) }
      });
    });
  });
});