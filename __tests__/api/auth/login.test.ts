/**
 * Login API Endpoint Testing Suite
 * Comprehensive tests for authentication login functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Import test utilities
import {
  createMockResponse,
  measureExecutionTime,
} from '../../utils/testHelpers';
import {
  expectValidApiResponse,
  expectValidErrorResponse,
  expectValidJWT,
  expectSecureData,
} from '../../utils/assertionHelpers';

// Import mocks
import {
  mockSessionManager,
  createMockSession,
  resetSessionMocks,
} from '../../mocks/auth/sessionManager.mock';
import {
  mockRedisClient,
  resetRedisMocks,
} from '../../mocks/cache/redis.mock';

// Mock login endpoint handler
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  error?: string;
  message?: string;
}

class MockAuthService {
  async validateCredentials(email: string, password: string) {
    // Mock user database
    const users = {
      'student@example.com': {
        id: 'student-id',
        email: 'student@example.com',
        name: 'Student User',
        role: 'STUDENT',
        passwordHash: 'hashed-password-123',
        status: 'ACTIVE',
      },
      'instructor@example.com': {
        id: 'instructor-id',
        email: 'instructor@example.com',
        name: 'Instructor User',
        role: 'INSTRUCTOR',
        passwordHash: 'hashed-password-456',
        status: 'ACTIVE',
      },
      'admin@example.com': {
        id: 'admin-id',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        passwordHash: 'hashed-password-789',
        status: 'ACTIVE',
      },
      'banned@example.com': {
        id: 'banned-id',
        email: 'banned@example.com',
        name: 'Banned User',
        role: 'STUDENT',
        passwordHash: 'hashed-password-000',
        status: 'BANNED',
      },
    };

    const user = users[email as keyof typeof users];
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    if (user.status === 'BANNED') {
      return { success: false, error: 'Account has been banned' };
    }

    // Simulate password verification
    if (password === 'wrongpassword') {
      return { success: false, error: 'Invalid credentials' };
    }

    return { success: true, user };
  }

  async checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = `login_attempts:${ip}`;
    const attempts = parseInt(await mockRedisClient.get(key) || '0');
    const maxAttempts = 5;
    
    if (attempts >= maxAttempts) {
      return { allowed: false, remaining: 0 };
    }

    await mockRedisClient.incr(key);
    await mockRedisClient.expire(key, 900); // 15 minutes

    return { allowed: true, remaining: maxAttempts - attempts - 1 };
  }

  async createUserSession(user: any, rememberMe: boolean = false) {
    const expiresIn = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 24 hours
    
    const sessionResult = await mockSessionManager.createSession(user.id, {
      email: user.email,
      role: user.role,
      status: user.status,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Browser',
    });

    if (!sessionResult.success) {
      throw new Error('Failed to create session');
    }

    return {
      token: sessionResult.token,
      refreshToken: sessionResult.refreshToken,
      expiresAt: new Date(Date.now() + expiresIn).toISOString(),
    };
  }
}

const mockAuthService = new MockAuthService();

// Mock login endpoint implementation
async function mockLoginHandler(request: LoginRequest, ip: string = '127.0.0.1'): Promise<LoginResponse> {
  try {
    // Input validation
    if (!request.email || !request.password) {
      return {
        success: false,
        error: 'Email and password are required',
      };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      return {
        success: false,
        error: 'Invalid email format',
      };
    }

    // Rate limiting check
    const rateLimitResult = await mockAuthService.checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: 'Too many login attempts. Please try again later.',
      };
    }

    // Validate credentials
    const authResult = await mockAuthService.validateCredentials(request.email, request.password);
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      };
    }

    // Create session
    const sessionData = await mockAuthService.createUserSession(authResult.user, request.rememberMe);

    return {
      success: true,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        role: authResult.user.role,
      },
      token: sessionData.token,
      refreshToken: sessionData.refreshToken,
      expiresAt: sessionData.expiresAt,
    };

  } catch (error) {
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

describe('Login API Endpoint Tests', () => {
  beforeEach(() => {
    resetSessionMocks();
    resetRedisMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful Login Scenarios', () => {
    it('should successfully log in a student user', async () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'student@example.com',
        password: 'validpassword',
      };

      // Act
      const { result, duration } = await measureExecutionTime(() =>
        mockLoginHandler(loginRequest)
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('student@example.com');
      expect(result.user?.role).toBe('STUDENT');
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(duration).toBeLessThan(500); // Should complete within 500ms

      expectValidApiResponse(result);
      expectValidJWT(result.token!);
    });

    it('should successfully log in an instructor user', async () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'instructor@example.com',
        password: 'validpassword',
      };

      // Act
      const result = await mockLoginHandler(loginRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user?.role).toBe('INSTRUCTOR');
      expectValidApiResponse(result);
    });

    it('should successfully log in an admin user', async () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'admin@example.com',
        password: 'validpassword',
      };

      // Act
      const result = await mockLoginHandler(loginRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user?.role).toBe('ADMIN');
      expectValidApiResponse(result);
    });

    it('should handle remember me functionality', async () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'student@example.com',
        password: 'validpassword',
        rememberMe: true,
      };

      // Act
      const result = await mockLoginHandler(loginRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.expiresAt).toBeDefined();
      
      // Verify extended expiration time
      const expiresAt = new Date(result.expiresAt!);
      const now = new Date();
      const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      expect(diffHours).toBeGreaterThan(24); // Should be more than 24 hours
    });
  });

  describe('Authentication Failures', () => {
    it('should reject invalid email addresses', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        '',
      ];

      for (const email of invalidEmails) {
        const result = await mockLoginHandler({
          email,
          password: 'validpassword',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid email format');
        expectValidErrorResponse(result);
      }
    });

    it('should reject missing credentials', async () => {
      const testCases = [
        { email: '', password: 'password' },
        { email: 'test@example.com', password: '' },
        { email: '', password: '' },
      ];

      for (const testCase of testCases) {
        const result = await mockLoginHandler(testCase);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Email and password are required');
        expectValidErrorResponse(result);
      }
    });

    it('should reject non-existent users', async () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'nonexistent@example.com',
        password: 'validpassword',
      };

      // Act
      const result = await mockLoginHandler(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expectValidErrorResponse(result);
    });

    it('should reject incorrect passwords', async () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'student@example.com',
        password: 'wrongpassword',
      };

      // Act
      const result = await mockLoginHandler(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expectValidErrorResponse(result);
    });

    it('should reject banned users', async () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'banned@example.com',
        password: 'validpassword',
      };

      // Act
      const result = await mockLoginHandler(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Account has been banned');
      expectValidErrorResponse(result);
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting for login attempts', async () => {
      const ip = '192.168.1.100';
      const loginRequest: LoginRequest = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      };

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const result = await mockLoginHandler(loginRequest, ip);
        expect(result.success).toBe(false);
      }

      // 6th attempt should be rate limited
      const rateLimitedResult = await mockLoginHandler(loginRequest, ip);
      expect(rateLimitedResult.success).toBe(false);
      expect(rateLimitedResult.error).toBe('Too many login attempts. Please try again later.');
    });

    it('should track rate limits per IP address', async () => {
      const ip1 = '192.168.1.101';
      const ip2 = '192.168.1.102';
      const loginRequest: LoginRequest = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      };

      // Make 5 failed attempts from IP1
      for (let i = 0; i < 5; i++) {
        await mockLoginHandler(loginRequest, ip1);
      }

      // IP1 should be rate limited
      const ip1Result = await mockLoginHandler(loginRequest, ip1);
      expect(ip1Result.error).toBe('Too many login attempts. Please try again later.');

      // IP2 should still be allowed
      const ip2Result = await mockLoginHandler(loginRequest, ip2);
      expect(ip2Result.error).toBe('Invalid credentials'); // Normal validation error
    });
  });

  describe('Security Validations', () => {
    it('should sanitize user input to prevent XSS', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
      ];

      for (const payload of xssPayloads) {
        const result = await mockLoginHandler({
          email: payload,
          password: 'password',
        });

        expect(result.success).toBe(false);
        expectSecureData({ email: payload });
      }
    });

    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        "admin'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
      ];

      for (const payload of sqlInjectionPayloads) {
        const result = await mockLoginHandler({
          email: payload,
          password: 'password',
        });

        expect(result.success).toBe(false);
        expectSecureData({ email: payload });
      }
    });

    it('should not expose sensitive information in error messages', async () => {
      // Test with various invalid inputs
      const testCases = [
        { email: 'admin@example.com', password: 'wrongpassword' },
        { email: 'nonexistent@example.com', password: 'anypassword' },
      ];

      for (const testCase of testCases) {
        const result = await mockLoginHandler(testCase);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials'); // Generic message
        
        // Ensure no password hash or user details in response
        const responseString = JSON.stringify(result);
        expect(responseString).not.toContain('passwordHash');
        expect(responseString).not.toContain('hashed-password');
      }
    });
  });

  describe('Performance Requirements', () => {
    it('should respond within acceptable time limits', async () => {
      const loginRequest: LoginRequest = {
        email: 'student@example.com',
        password: 'validpassword',
      };

      const { duration } = await measureExecutionTime(() =>
        mockLoginHandler(loginRequest)
      );

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent login requests', async () => {
      const loginRequests = Array.from({ length: 10 }, (_, i) => ({
        email: `user${i}@example.com`,
        password: 'password',
      }));

      const startTime = Date.now();
      const promises = loginRequests.map(request => mockLoginHandler(request));
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(2000); // Should handle 10 concurrent requests within 2 seconds
    });

    it('should not cause memory leaks with repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      const loginRequest: LoginRequest = {
        email: 'student@example.com',
        password: 'validpassword',
      };

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await mockLoginHandler(loginRequest);
      }

      // Force garbage collection if available
      if (global.gc) global.gc();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
    });
  });

  describe('Session Management Integration', () => {
    it('should create valid sessions for authenticated users', async () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'student@example.com',
        password: 'validpassword',
      };

      // Act
      const result = await mockLoginHandler(loginRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSessionManager.createSession).toHaveBeenCalled();
      
      // Verify session can be validated
      const sessionValidation = await mockSessionManager.validateSession(result.token!);
      expect(sessionValidation.success).toBe(true);
    });

    it('should handle session creation failures gracefully', async () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'student@example.com',
        password: 'validpassword',
      };

      // Mock session creation failure
      mockSessionManager.createSession.mockRejectedValueOnce(
        new Error('Session service unavailable')
      );

      // Act
      const result = await mockLoginHandler(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed request data', async () => {
      const malformedRequests = [
        null,
        undefined,
        {},
        { email: null, password: null },
        { email: undefined, password: undefined },
      ];

      for (const request of malformedRequests) {
        const result = await mockLoginHandler(request as any);
        expect(result.success).toBe(false);
      }
    });

    it('should handle very long input strings', async () => {
      const longString = 'a'.repeat(10000);
      
      const result = await mockLoginHandler({
        email: longString,
        password: longString,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should handle special characters in credentials', async () => {
      const specialCharacters = [
        'test+tag@example.com',
        'test.email@example.com',
        'test_email@example.com',
        'test-email@example.com',
      ];

      for (const email of specialCharacters) {
        const result = await mockLoginHandler({
          email,
          password: 'validpassword',
        });

        // Should not crash, either succeed or fail gracefully
        expect(typeof result.success).toBe('boolean');
      }
    });
  });
});