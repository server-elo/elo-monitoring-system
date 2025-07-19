import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuthService } from '@/lib/api/auth';
import { UserRole, UserStatus } from '@/lib/api/types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock external dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
    mockBcrypt.compare.mockResolvedValue(true as never);
    mockJwt.sign.mockReturnValue('mock-jwt-token' as never);
    mockJwt.verify.mockReturnValue({ userId: 'test-user-id' } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Password Management', () => {
    describe('hashPassword', () => {
      it('should hash password with correct salt rounds', async () => {
        const password = 'testPassword123';
        
        const result = await AuthService.hashPassword(password);
        
        expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
        expect(result).toBe('hashed-password');
      });

      it('should handle empty password', async () => {
        await expect(AuthService.hashPassword('')).rejects.toThrow('Password cannot be empty');
      });

      it('should handle null password', async () => {
        await expect(AuthService.hashPassword(null as any)).rejects.toThrow('Password cannot be empty');
      });

      it('should handle bcrypt errors', async () => {
        mockBcrypt.hash.mockRejectedValue(new Error('Bcrypt error') as never);
        
        await expect(AuthService.hashPassword('password')).rejects.toThrow('Bcrypt error');
      });
    });

    describe('verifyPassword', () => {
      it('should verify correct password', async () => {
        const password = 'testPassword123';
        const hash = 'hashed-password';
        
        const result = await AuthService.verifyPassword(password, hash);
        
        expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
        expect(result).toBe(true);
      });

      it('should reject incorrect password', async () => {
        mockBcrypt.compare.mockResolvedValue(false as never);
        
        const result = await AuthService.verifyPassword('wrongPassword', 'hashed-password');
        
        expect(result).toBe(false);
      });

      it('should handle empty password', async () => {
        const result = await AuthService.verifyPassword('', 'hashed-password');
        
        expect(result).toBe(false);
      });

      it('should handle empty hash', async () => {
        const result = await AuthService.verifyPassword('password', '');
        
        expect(result).toBe(false);
      });

      it('should handle bcrypt errors', async () => {
        mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt error') as never);
        
        await expect(AuthService.verifyPassword('password', 'hash')).rejects.toThrow('Bcrypt error');
      });
    });
  });

  describe('Token Management', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      profile: {
        xpTotal: 1000,
        level: 5,
        lessonsCompleted: 10,
        coursesCompleted: 2,
        achievementsCount: 5,
        currentStreak: 3,
        longestStreak: 10,
      },
      preferences: {
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        weeklyDigest: true,
        achievementNotifications: true,
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    describe('generateAccessToken', () => {
      it('should generate access token with correct payload', () => {
        const token = AuthService.generateAccessToken(mockUser);
        
        expect(mockJwt.sign).toHaveBeenCalledWith(
          {
            userId: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
            type: 'access'
          },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );
        expect(token).toBe('mock-jwt-token');
      });

      it('should handle missing user data', () => {
        expect(() => AuthService.generateAccessToken(null as any)).toThrow('User data is required');
      });

      it('should handle missing user ID', () => {
        const invalidUser = { ...mockUser, id: '' };
        expect(() => AuthService.generateAccessToken(invalidUser)).toThrow('User ID is required');
      });

      it('should handle JWT signing errors', () => {
        mockJwt.sign.mockImplementation(() => {
          throw new Error('JWT signing error');
        });
        
        expect(() => AuthService.generateAccessToken(mockUser)).toThrow('JWT signing error');
      });
    });

    describe('generateRefreshToken', () => {
      it('should generate refresh token with correct payload', () => {
        const userId = 'test-user-id';
        const tokenVersion = 1;
        
        const token = AuthService.generateRefreshToken(userId, tokenVersion);
        
        expect(mockJwt.sign).toHaveBeenCalledWith(
          {
            userId,
            tokenVersion,
            type: 'refresh'
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        expect(token).toBe('mock-jwt-token');
      });

      it('should use default token version', () => {
        const userId = 'test-user-id';
        
        AuthService.generateRefreshToken(userId);
        
        expect(mockJwt.sign).toHaveBeenCalledWith(
          {
            userId,
            tokenVersion: 0,
            type: 'refresh'
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
      });

      it('should handle empty user ID', () => {
        expect(() => AuthService.generateRefreshToken('')).toThrow('User ID is required');
      });
    });

    describe('verifyAccessToken', () => {
      it('should verify valid access token', () => {
        const token = 'valid-jwt-token';
        const mockPayload = {
          userId: 'test-user-id',
          email: 'test@example.com',
          role: UserRole.STUDENT,
          type: 'access'
        };
        
        mockJwt.verify.mockReturnValue(mockPayload as never);
        
        const result = AuthService.verifyAccessToken(token);
        
        expect(mockJwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
        expect(result).toEqual(mockPayload);
      });

      it('should reject invalid token', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new Error('Invalid token');
        });
        
        expect(() => AuthService.verifyAccessToken('invalid-token')).toThrow('Invalid token');
      });

      it('should reject wrong token type', () => {
        const mockPayload = {
          userId: 'test-user-id',
          type: 'refresh'
        };
        
        mockJwt.verify.mockReturnValue(mockPayload as never);
        
        expect(() => AuthService.verifyAccessToken('token')).toThrow('Invalid token type');
      });

      it('should handle empty token', () => {
        expect(() => AuthService.verifyAccessToken('')).toThrow('Token is required');
      });
    });

    describe('verifyRefreshToken', () => {
      it('should verify valid refresh token', () => {
        const token = 'valid-refresh-token';
        const mockPayload = {
          userId: 'test-user-id',
          tokenVersion: 1,
          type: 'refresh'
        };
        
        mockJwt.verify.mockReturnValue(mockPayload as never);
        
        const result = AuthService.verifyRefreshToken(token);
        
        expect(mockJwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
        expect(result).toEqual(mockPayload);
      });

      it('should reject wrong token type', () => {
        const mockPayload = {
          userId: 'test-user-id',
          type: 'access'
        };
        
        mockJwt.verify.mockReturnValue(mockPayload as never);
        
        expect(() => AuthService.verifyRefreshToken('token')).toThrow('Invalid token type');
      });
    });
  });

  describe('Session Management', () => {
    describe('generateSessionId', () => {
      it('should generate unique session IDs', () => {
        const id1 = AuthService.generateSessionId();
        const id2 = AuthService.generateSessionId();
        
        expect(id1).toBeValidUUID();
        expect(id2).toBeValidUUID();
        expect(id1).not.toBe(id2);
      });
    });

    describe('validateSession', () => {
      it('should validate active session', () => {
        const session = {
          id: 'session-id',
          userId: 'user-id',
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          active: true
        };
        
        const result = AuthService.validateSession(session);
        
        expect(result).toBe(true);
      });

      it('should reject expired session', () => {
        const session = {
          id: 'session-id',
          userId: 'user-id',
          expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          active: true
        };
        
        const result = AuthService.validateSession(session);
        
        expect(result).toBe(false);
      });

      it('should reject inactive session', () => {
        const session = {
          id: 'session-id',
          userId: 'user-id',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          active: false
        };
        
        const result = AuthService.validateSession(session);
        
        expect(result).toBe(false);
      });

      it('should handle invalid session data', () => {
        expect(AuthService.validateSession(null as any)).toBe(false);
        expect(AuthService.validateSession({} as any)).toBe(false);
        expect(AuthService.validateSession({ id: 'test' } as any)).toBe(false);
      });
    });
  });

  describe('Permission Management', () => {
    describe('hasPermission', () => {
      it('should grant permission for matching role', () => {
        const result = AuthService.hasPermission(UserRole.ADMIN, ['admin:read']);
        
        expect(result).toBe(true);
      });

      it('should deny permission for non-matching role', () => {
        const result = AuthService.hasPermission(UserRole.STUDENT, ['admin:read']);
        
        expect(result).toBe(false);
      });

      it('should handle multiple permissions', () => {
        const result = AuthService.hasPermission(UserRole.INSTRUCTOR, ['lessons:read', 'lessons:write']);
        
        expect(result).toBe(true);
      });

      it('should handle empty permissions array', () => {
        const result = AuthService.hasPermission(UserRole.STUDENT, []);
        
        expect(result).toBe(true); // No permissions required
      });

      it('should handle invalid role', () => {
        const result = AuthService.hasPermission('INVALID_ROLE' as any, ['admin:read']);
        
        expect(result).toBe(false);
      });
    });

    describe('getRolePermissions', () => {
      it('should return correct permissions for STUDENT', () => {
        const permissions = AuthService.getRolePermissions(UserRole.STUDENT);
        
        expect(permissions).toContain('lessons:read');
        expect(permissions).toContain('progress:read');
        expect(permissions).not.toContain('admin:read');
      });

      it('should return correct permissions for INSTRUCTOR', () => {
        const permissions = AuthService.getRolePermissions(UserRole.INSTRUCTOR);
        
        expect(permissions).toContain('lessons:read');
        expect(permissions).toContain('lessons:write');
        expect(permissions).toContain('students:read');
        expect(permissions).not.toContain('admin:write');
      });

      it('should return correct permissions for ADMIN', () => {
        const permissions = AuthService.getRolePermissions(UserRole.ADMIN);
        
        expect(permissions).toContain('admin:read');
        expect(permissions).toContain('admin:write');
        expect(permissions).toContain('users:write');
      });

      it('should handle invalid role', () => {
        const permissions = AuthService.getRolePermissions('INVALID_ROLE' as any);
        
        expect(permissions).toEqual([]);
      });
    });
  });

  describe('Security Utilities', () => {
    describe('sanitizeUserData', () => {
      it('should remove sensitive fields', () => {
        const userData = {
          id: 'user-id',
          email: 'test@example.com',
          password: 'secret-password',
          passwordHash: 'hashed-password',
          refreshToken: 'refresh-token',
          name: 'Test User'
        };
        
        const sanitized = AuthService.sanitizeUserData(userData);
        
        expect(sanitized).toEqual({
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User'
        });
        expect(sanitized).not.toHaveProperty('password');
        expect(sanitized).not.toHaveProperty('passwordHash');
        expect(sanitized).not.toHaveProperty('refreshToken');
      });

      it('should handle null input', () => {
        const result = AuthService.sanitizeUserData(null);
        
        expect(result).toBeNull();
      });

      it('should handle undefined input', () => {
        const result = AuthService.sanitizeUserData(undefined);
        
        expect(result).toBeUndefined();
      });
    });

    describe('validatePasswordStrength', () => {
      it('should accept strong password', () => {
        const result = AuthService.validatePasswordStrength('StrongPassword123!');
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject weak passwords', () => {
        const weakPasswords = [
          'weak',
          '12345678',
          'password',
          'PASSWORD',
          'Password',
          'Password123',
          'password123!',
        ];
        
        weakPasswords.forEach(password => {
          const result = AuthService.validatePasswordStrength(password);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        });
      });

      it('should provide specific error messages', () => {
        const result = AuthService.validatePasswordStrength('weak');
        
        expect(result.errors).toContain('Password must be at least 8 characters long');
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).toContain('Password must contain at least one number');
        expect(result.errors).toContain('Password must contain at least one special character');
      });
    });
  });
});
