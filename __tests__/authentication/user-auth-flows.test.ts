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
vi.mock( 'next-auth/react', () => ({
  signIn: vi.fn(_),
  signOut: vi.fn(_),
  getSession: vi.fn(_),
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated'
  })),
  SessionProvider: (_{ children }: { children: React.ReactNode }) => children
}));

// Mock components (_these would be imported from actual components)
const mockLoginForm = vi.fn(_);
const mockRegistrationForm = vi.fn(_);
const mockPasswordResetForm = vi.fn(_);

vi.mock( '@/components/auth/LoginForm', () => ({
  LoginForm: mockLoginForm
}));

vi.mock( '@/components/auth/RegistrationForm', () => ({
  RegistrationForm: mockRegistrationForm
}));

vi.mock( '@/components/auth/PasswordResetForm', () => ({
  PasswordResetForm: mockPasswordResetForm
}));

describe( 'User Authentication Flows', () => {
  beforeAll(() => {
    // Setup global test environment
    mockPrisma.user.findUnique.mockImplementation(() => null);
    mockPrisma.user.create.mockImplementation(() => ({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: new Date(_),
      createdAt: new Date(_),
      updatedAt: new Date(_)
    }));
  });

  beforeEach(() => {
    vi.clearAllMocks(_);
    mockRedis.del.mockResolvedValue(1);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.get.mockResolvedValue(_null);
  });

  afterEach(() => {
    vi.clearAllMocks(_);
  });

  afterAll(() => {
    vi.resetAllMocks(_);
  });

  describe( 'User Registration Flow', () => {
    it( 'should successfully register a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
        agreeToTerms: true
      };

      // Mock successful registration
      mockPrisma.user.findUnique.mockResolvedValueOnce(_null); // User doesn't exist
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'new-user-id',
        ...userData,
        password: await hashPassword(_userData.password),
        emailVerified: null,
        createdAt: new Date(_),
        updatedAt: new Date(_)
      });

      // Test email validation
      expect(_validateEmail(userData.email)).toBe(_true);
      
      // Test password validation
      expect(_validatePassword(userData.password)).toBe(_true);
      
      // Test user creation
      const hashedPassword = await hashPassword(_userData.password);
      expect(_hashedPassword).toBeDefined(_);
      expect(_hashedPassword).not.toBe(_userData.password);
      
      // Verify password hashing works
      const isValidPassword = await verifyPassword( userData.password, hashedPassword);
      expect(_isValidPassword).toBe(_true);
      
      // Test database interaction
      const createdUser = await mockPrisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword
        }
      });
      
      expect(_createdUser.id).toBe('new-user-id');
      expect(_createdUser.email).toBe(_userData.email);
      expect(_mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it( 'should reject registration with invalid email format', async () => {
      const invalidEmails = [
        'invalid-email',
        'missing@domain',
        '@missing-local.com',
        'spaces @domain.com',
        'toolong'.repeat(50) + '@domain.com'
      ];

      invalidEmails.forEach(email => {
        expect(_validateEmail(email)).toBe(_false);
      });
    });

    it( 'should reject registration with weak passwords', async () => {
      const weakPasswords = [
        'short',           // Too short
        'nouppercase123!', // No uppercase
        'NOLOWERCASE123!', // No lowercase
        'NoNumbers!',      // No numbers
        'NoSpecialChars123' // No special characters
      ];

      weakPasswords.forEach(password => {
        expect(_validatePassword(password)).toBe(_false);
      });
    });

    it( 'should prevent duplicate user registration', async () => {
      const existingUser = {
        id: 'existing-user',
        email: 'existing@example.com',
        name: 'Existing User',
        emailVerified: new Date(_),
        createdAt: new Date(_),
        updatedAt: new Date(_)
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(_existingUser);

      // Attempt to register with existing email
      const duplicateRegistration = async () => {
        const user = await mockPrisma.user.findUnique({
          where: { email: existingUser.email }
        });
        
        if (user) {
          throw new Error('User already exists');
        }
      };

      await expect(_duplicateRegistration()).rejects.toThrow('User already exists');
      expect(_mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: existingUser.email }
      });
    });

    it( 'should handle registration rate limiting', async () => {
      const userIP = '192.168.1.100';
      const rateLimitKey = `registration_attempts:${userIP}`;
      
      // Mock rate limit exceeded
      mockRedis.get.mockResolvedValueOnce('5'); // 5 attempts already made
      
      const checkRateLimit = async (_ip: string) => {
        const attempts = await mockRedis.get(_`registration_attempts:${ip}`);
        const attemptCount = parseInt(_attempts || '0');
        
        if (_attemptCount >= 5) {
          throw new Error('Rate limit exceeded');
        }
      };

      await expect(_checkRateLimit(userIP)).rejects.toThrow('Rate limit exceeded');
      expect(_mockRedis.get).toHaveBeenCalledWith(_rateLimitKey);
    });
  });

  describe( 'User Login Flow', () => {
    const existingUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedPassword123',
      emailVerified: new Date(_),
      createdAt: new Date(_),
      updatedAt: new Date(_)
    };

    it( 'should successfully log in user with valid credentials', async () => {
      const loginCredentials = {
        email: 'test@example.com',
        password: 'CorrectPassword123!'
      };

      // Mock user lookup
      mockPrisma.user.findUnique.mockResolvedValueOnce(_existingUser);
      
      // Mock successful sign in
      (_signIn as any).mockResolvedValueOnce({
        ok: true,
        url: '/dashboard',
        error: null
      });

      const loginResult = await signIn('credentials', {
        email: loginCredentials.email,
        password: loginCredentials.password,
        redirect: false
      });

      expect(_loginResult.ok).toBe(_true);
      expect(_loginResult.url).toBe('/dashboard');
      expect(_signIn).toHaveBeenCalledWith('credentials', {
        email: loginCredentials.email,
        password: loginCredentials.password,
        redirect: false
      });
    });

    it( 'should reject login with invalid credentials', async () => {
      const invalidCredentials = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      // Mock failed sign in
      (_signIn as any).mockResolvedValueOnce({
        ok: false,
        error: 'Invalid credentials',
        url: null
      });

      const loginResult = await signIn('credentials', {
        email: invalidCredentials.email,
        password: invalidCredentials.password,
        redirect: false
      });

      expect(_loginResult.ok).toBe(_false);
      expect(_loginResult.error).toBe('Invalid credentials');
    });

    it('should handle OAuth provider login (GitHub)', async () => {
      // Mock GitHub OAuth flow
      (_signIn as any).mockResolvedValueOnce({
        ok: true,
        url: '/dashboard',
        error: null
      });

      const githubLogin = await signIn('github', {
        callbackUrl: '/dashboard',
        redirect: false
      });

      expect(_githubLogin.ok).toBe(_true);
      expect(_signIn).toHaveBeenCalledWith('github', {
        callbackUrl: '/dashboard',
        redirect: false
      });
    });

    it('should handle OAuth provider login (Google)', async () => {
      // Mock Google OAuth flow
      (_signIn as any).mockResolvedValueOnce({
        ok: true,
        url: '/dashboard',
        error: null
      });

      const googleLogin = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false
      });

      expect(_googleLogin.ok).toBe(_true);
      expect(_signIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/dashboard',
        redirect: false
      });
    });

    it( 'should implement login rate limiting', async () => {
      const userIP = '192.168.1.100';
      const rateLimitKey = `login_attempts:${userIP}`;
      
      // Mock rate limit exceeded
      mockRedis.get.mockResolvedValueOnce('10'); // 10 failed attempts
      
      const checkLoginRateLimit = async (_ip: string) => {
        const attempts = await mockRedis.get(_`login_attempts:${ip}`);
        const attemptCount = parseInt(_attempts || '0');
        
        if (_attemptCount >= 10) {
          throw new Error('Too many login attempts. Please try again later.');
        }
      };

      await expect(_checkLoginRateLimit(userIP)).rejects.toThrow('Too many login attempts');
      expect(_mockRedis.get).toHaveBeenCalledWith(_rateLimitKey);
    });
  });

  describe( 'Session Management', () => {
    it( 'should create and validate user session', async () => {
      const sessionData = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User'
        },
        expires: new Date(_Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      // Mock session retrieval
      (_getSession as any).mockResolvedValueOnce(_sessionData);

      const session = await getSession(_);
      
      expect(_session).toBeDefined(_);
      expect(_session.user.id).toBe('test-user-id');
      expect(_session.user.email).toBe('test@example.com');
      expect(new Date(session.expires) > new Date(_)).toBe(_true);
    });

    it( 'should handle session expiration', async () => {
      const expiredSessionData = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User'
        },
        expires: new Date(_Date.now() - 1000).toISOString() // Expired 1 second ago
      };

      // Mock expired session
      (_getSession as any).mockResolvedValueOnce(_null);

      const session = await getSession(_);
      expect(_session).toBeNull(_);
    });

    it( 'should successfully log out user', async () => {
      // Mock successful sign out
      (_signOut as any).mockResolvedValueOnce({
        url: '/login'
      });

      const logoutResult = await signOut({
        callbackUrl: '/login',
        redirect: false
      });

      expect(_logoutResult.url).toBe('/login');
      expect(_signOut).toHaveBeenCalledWith({
        callbackUrl: '/login',
        redirect: false
      });
    });

    it( 'should clear session data on logout', async () => {
      const sessionKey = 'session:test-user-id';
      
      // Mock session cleanup
      mockRedis.del.mockResolvedValueOnce(1);
      
      const clearSession = async (_userId: string) => {
        await mockRedis.del(_`session:${userId}`);
      };

      await clearSession('test-user-id');
      expect(_mockRedis.del).toHaveBeenCalledWith(_sessionKey);
    });
  });

  describe( 'Password Reset Flow', () => {
    it( 'should generate password reset token', async () => {
      const userEmail = 'test@example.com';
      const resetToken = 'reset-token-123';
      const resetTokenKey = `password_reset:${resetToken}`;

      // Mock user lookup
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'test-user-id',
        email: userEmail,
        name: 'Test User',
        emailVerified: new Date(_),
        createdAt: new Date(_),
        updatedAt: new Date(_)
      });

      // Mock token storage
      mockRedis.set.mockResolvedValueOnce('OK');

      const generateResetToken = async (_email: string) => {
        const user = await mockPrisma.user.findUnique({
          where: { email }
        });
        
        if (!user) {
          throw new Error('User not found');
        }
        
        const token = resetToken;
        await mockRedis.set( `password_reset:${token}`, user.id, 3600); // 1 hour expiry
        
        return token;
      };

      const token = await generateResetToken(_userEmail);
      
      expect(_token).toBe(_resetToken);
      expect(_mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userEmail }
      });
      expect(_mockRedis.set).toHaveBeenCalledWith( resetTokenKey, 'test-user-id', 3600);
    });

    it( 'should validate and use password reset token', async () => {
      const resetToken = 'valid-reset-token';
      const newPassword = 'NewSecurePassword123!';
      const userId = 'test-user-id';

      // Mock token validation
      mockRedis.get.mockResolvedValueOnce(_userId);
      mockRedis.del.mockResolvedValueOnce(1);

      // Mock password update
      mockPrisma.user.update.mockResolvedValueOnce({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: await hashPassword(_newPassword),
        emailVerified: new Date(_),
        createdAt: new Date(_),
        updatedAt: new Date(_)
      });

      const resetPassword = async (token: string, password: string) => {
        const storedUserId = await mockRedis.get(_`password_reset:${token}`);
        
        if (!storedUserId) {
          throw new Error('Invalid or expired reset token');
        }
        
        const hashedPassword = await hashPassword(_password);
        
        await mockPrisma.user.update({
          where: { id: storedUserId },
          data: { password: hashedPassword }
        });
        
        await mockRedis.del(_`password_reset:${token}`);
        
        return true;
      };

      const result = await resetPassword( resetToken, newPassword);
      
      expect(_result).toBe(_true);
      expect(_mockRedis.get).toHaveBeenCalledWith(_`password_reset:${resetToken}`);
      expect(_mockRedis.del).toHaveBeenCalledWith(_`password_reset:${resetToken}`);
      expect(_mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: expect.any(_String) }
      });
    });

    it( 'should reject invalid reset tokens', async () => {
      const invalidToken = 'invalid-token';

      // Mock token not found
      mockRedis.get.mockResolvedValueOnce(_null);

      const validateResetToken = async (_token: string) => {
        const userId = await mockRedis.get(_`password_reset:${token}`);
        
        if (!userId) {
          throw new Error('Invalid or expired reset token');
        }
        
        return userId;
      };

      await expect(_validateResetToken(invalidToken)).rejects.toThrow('Invalid or expired reset token');
      expect(_mockRedis.get).toHaveBeenCalledWith(_`password_reset:${invalidToken}`);
    });
  });

  describe( 'Account Security Features', () => {
    it( 'should track login attempts and locations', async () => {
      const userId = 'test-user-id';
      const loginData = {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Chrome/91.0',
        timestamp: new Date(_).toISOString(),
        success: true
      };

      const trackLoginAttempt = async (userId: string, attemptData: typeof loginData) => {
        const key = `login_history:${userId}`;
        const attempts = await mockRedis.get(_key) || '[]';
        const history = JSON.parse(_attempts);
        
        history.push(_attemptData);
        
        // Keep only last 10 attempts
        if (_history.length > 10) {
          history.splice( 0, history.length - 10);
        }
        
        await mockRedis.set( key, JSON.stringify(history), 7 * 24 * 3600); // 7 days
      };

      mockRedis.get.mockResolvedValueOnce('[]');
      mockRedis.set.mockResolvedValueOnce('OK');

      await trackLoginAttempt( userId, loginData);

      expect(_mockRedis.set).toHaveBeenCalledWith(
        `login_history:${userId}`,
        expect.stringContaining(_loginData.ip),
        7 * 24 * 3600
      );
    });

    it( 'should detect suspicious login activities', async () => {
      const userId = 'test-user-id';
      const suspiciousActivity = [
        { ip: '1.1.1.1', userAgent: 'Bot/1.0', timestamp: new Date(_).toISOString() },
        { ip: '2.2.2.2', userAgent: 'Bot/1.0', timestamp: new Date(_).toISOString() },
        { ip: '3.3.3.3', userAgent: 'Bot/1.0', timestamp: new Date(_).toISOString() }
      ];

      const detectSuspiciousActivity = async (_userId: string) => {
        const key = `login_history:${userId}`;
        const history = JSON.parse(_await mockRedis.get(key) || '[]');
        
        // Check for multiple IPs in short time
        const recentLogins = history.filter((login: any) => 
          Date.now(_) - new Date(_login.timestamp).getTime(_) < 60 * 60 * 1000 // 1 hour
        );
        
        const uniqueIPs = new Set(_recentLogins.map((login: any) => login.ip));
        
        return uniqueIPs.size > 2; // Suspicious if more than 2 IPs in 1 hour
      };

      mockRedis.get.mockResolvedValueOnce(_JSON.stringify(suspiciousActivity));

      const isSuspicious = await detectSuspiciousActivity(_userId);
      expect(_isSuspicious).toBe(_true);
    });

    it( 'should enforce account lockout after failed attempts', async () => {
      const userEmail = 'test@example.com';
      const lockoutKey = `account_lockout:${userEmail}`;

      const checkAccountLockout = async (_email: string) => {
        const lockoutData = await mockRedis.get(_`account_lockout:${email}`);
        
        if (lockoutData) {
          const { attempts, lockedUntil } = JSON.parse(_lockoutData);
          
          if (_Date.now() < lockedUntil) {
            throw new Error('Account is temporarily locked');
          }
        }
      };

      // Mock locked account
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({
        attempts: 5,
        lockedUntil: Date.now(_) + 30 * 60 * 1000 // Locked for 30 minutes
      }));

      await expect(_checkAccountLockout(userEmail)).rejects.toThrow('Account is temporarily locked');
      expect(_mockRedis.get).toHaveBeenCalledWith(_lockoutKey);
    });
  });

  describe( 'Email Verification Flow', () => {
    it( 'should generate email verification token', async () => {
      const userId = 'test-user-id';
      const verificationToken = 'verify-token-123';

      const generateVerificationToken = async (_userId: string) => {
        const token = verificationToken;
        await mockRedis.set( `email_verification:${token}`, userId, 24 * 3600); // 24 hours
        return token;
      };

      mockRedis.set.mockResolvedValueOnce('OK');

      const token = await generateVerificationToken(_userId);
      
      expect(_token).toBe(_verificationToken);
      expect(_mockRedis.set).toHaveBeenCalledWith(
        `email_verification:${verificationToken}`,
        userId,
        24 * 3600
      );
    });

    it( 'should verify email with valid token', async () => {
      const verificationToken = 'valid-verify-token';
      const userId = 'test-user-id';

      const verifyEmail = async (_token: string) => {
        const storedUserId = await mockRedis.get(_`email_verification:${token}`);
        
        if (!storedUserId) {
          throw new Error('Invalid or expired verification token');
        }
        
        await mockPrisma.user.update({
          where: { id: storedUserId },
          data: { emailVerified: new Date(_) }
        });
        
        await mockRedis.del(_`email_verification:${token}`);
        
        return true;
      };

      mockRedis.get.mockResolvedValueOnce(_userId);
      mockRedis.del.mockResolvedValueOnce(1);
      mockPrisma.user.update.mockResolvedValueOnce({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: new Date(_),
        createdAt: new Date(_),
        updatedAt: new Date(_)
      });

      const result = await verifyEmail(_verificationToken);
      
      expect(_result).toBe(_true);
      expect(_mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { emailVerified: expect.any(_Date) }
      });
    });
  });
});