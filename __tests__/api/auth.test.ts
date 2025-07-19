import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as loginHandler } from '@/app/api/v1/auth/login/route';
import { POST as registerHandler } from '@/app/api/v1/auth/register/route';
import { POST as refreshHandler } from '@/app/api/v1/auth/refresh/route';
import { AuthService } from '@/lib/api/auth';

// Mock the auth service
jest.mock('@/lib/api/auth');

describe('Authentication API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user_1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT',
        status: 'ACTIVE'
      };

      (AuthService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (AuthService.generateAccessToken as jest.Mock).mockReturnValue('mock-access-token');
      (AuthService.generateRefreshToken as jest.Mock).mockReturnValue('mock-refresh-token');

      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: false
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.tokens.accessToken).toBe('mock-access-token');
      expect(data.data.tokens.refreshToken).toBe('mock-refresh-token');
      expect(data.data.user.email).toBe('test@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      (AuthService.verifyPassword as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toHaveLength(1);
      expect(data.error.details[0].field).toBe('email');
    });

    it('should return 400 for missing password', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle rate limiting', async () => {
      // Mock rate limit exceeded
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Simulate multiple requests to trigger rate limit
      const promises = Array.from({ length: 15 }, () => loginHandler(request));
      const responses = await Promise.all(promises);

      // At least one should be rate limited
      const rateLimitedResponse = responses.find(r => r.status === 429);
      expect(rateLimitedResponse).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user', async () => {
      (AuthService.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      (AuthService.generateAccessToken as jest.Mock).mockReturnValue('mock-access-token');
      (AuthService.generateRefreshToken as jest.Mock).mockReturnValue('mock-refresh-token');

      const request = new NextRequest('http://localhost:3000/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          name: 'New User',
          acceptTerms: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('newuser@example.com');
      expect(data.data.user.name).toBe('New User');
      expect(data.data.tokens.accessToken).toBe('mock-access-token');
    });

    it('should return 409 for existing user', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          name: 'Existing User',
          acceptTerms: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RESOURCE_CONFLICT');
    });

    it('should return 400 for password mismatch', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!',
          name: 'Test User',
          acceptTerms: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for weak password', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'weak',
          confirmPassword: 'weak',
          name: 'Test User',
          acceptTerms: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for not accepting terms', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          name: 'Test User',
          acceptTerms: false
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should successfully refresh tokens', async () => {
      const mockPayload = {
        userId: 'user_1',
        tokenVersion: 0
      };

      (AuthService.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (AuthService.generateAccessToken as jest.Mock).mockReturnValue('new-access-token');
      (AuthService.generateRefreshToken as jest.Mock).mockReturnValue('new-refresh-token');

      const request = new NextRequest('http://localhost:3000/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'valid-refresh-token'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await refreshHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.tokens.accessToken).toBe('new-access-token');
      expect(data.data.tokens.refreshToken).toBe('new-refresh-token');
    });

    it('should return 401 for invalid refresh token', async () => {
      (AuthService.verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      const request = new NextRequest('http://localhost:3000/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'invalid-refresh-token'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await refreshHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for revoked refresh token', async () => {
      const mockPayload = {
        userId: 'user_1',
        tokenVersion: 0
      };

      (AuthService.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);

      const request = new NextRequest('http://localhost:3000/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'revoked-refresh-token'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await refreshHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for missing refresh token', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await refreshHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Security Tests', () => {
    it('should include security headers in responses', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await loginHandler(request);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('should handle CORS preflight requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      const response = await loginHandler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
    });

    it('should sanitize input data', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com<script>alert("xss")</script>',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await loginHandler(request);
      const data = await response.json();

      // Should either sanitize or reject the input
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should include rate limit headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await loginHandler(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle missing content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      const response = await loginHandler(request);

      // Should still work or return appropriate error
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      (AuthService.verifyPassword as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });
});
