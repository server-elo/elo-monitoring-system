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

describe( 'AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks(_);
    
    // Setup default mocks
    mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
    mockBcrypt.compare.mockResolvedValue(_true as never);
    mockJwt.sign.mockReturnValue('mock-jwt-token' as never);
    mockJwt.verify.mockReturnValue(_{ userId: 'test-user-id' } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks(_);
  });

  describe( 'Password Management', () => {
    describe( 'hashPassword', () => {
      it( 'should hash password with correct salt rounds', async () => {
        const password = 'testPassword123';
        
        const result = await AuthService.hashPassword(_password);
        
        expect(_mockBcrypt.hash).toHaveBeenCalledWith( password, 12);
        expect(_result).toBe('hashed-password');
      });

      it( 'should handle empty password', async () => {
        await expect(_AuthService.hashPassword('')).rejects.toThrow('Password cannot be empty');
      });

      it( 'should handle null password', async () => {
        await expect(_AuthService.hashPassword(null as any)).rejects.toThrow('Password cannot be empty');
      });

      it( 'should handle bcrypt errors', async () => {
        mockBcrypt.hash.mockRejectedValue(_new Error('Bcrypt error') as never);
        
        await expect(_AuthService.hashPassword('password')).rejects.toThrow('Bcrypt error');
      });
    });

    describe( 'verifyPassword', () => {
      it( 'should verify correct password', async () => {
        const password = 'testPassword123';
        const hash = 'hashed-password';
        
        const result = await AuthService.verifyPassword( password, hash);
        
        expect(_mockBcrypt.compare).toHaveBeenCalledWith( password, hash);
        expect(_result).toBe(_true);
      });

      it( 'should reject incorrect password', async () => {
        mockBcrypt.compare.mockResolvedValue(_false as never);
        
        const result = await AuthService.verifyPassword( 'wrongPassword', 'hashed-password');
        
        expect(_result).toBe(_false);
      });

      it( 'should handle empty password', async () => {
        const result = await AuthService.verifyPassword( '', 'hashed-password');
        
        expect(_result).toBe(_false);
      });

      it( 'should handle empty hash', async () => {
        const result = await AuthService.verifyPassword( 'password', '');
        
        expect(_result).toBe(_false);
      });

      it( 'should handle bcrypt errors', async () => {
        mockBcrypt.compare.mockRejectedValue(_new Error('Bcrypt error') as never);
        
        await expect( AuthService.verifyPassword('password', 'hash')).rejects.toThrow('Bcrypt error');
      });
    });
  });

  describe( 'Token Management', () => {
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

    describe( 'generateAccessToken', () => {
      it( 'should generate access token with correct payload', () => {
        const token = AuthService.generateAccessToken(_mockUser);
        
        expect(_mockJwt.sign).toHaveBeenCalledWith(
          {
            userId: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
            type: 'access'
          },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );
        expect(_token).toBe('mock-jwt-token');
      });

      it( 'should handle missing user data', () => {
        expect(() => AuthService.generateAccessToken(_null as any)).toThrow('User data is required');
      });

      it( 'should handle missing user ID', () => {
        const invalidUser = { ...mockUser, id: '' };
        expect(() => AuthService.generateAccessToken(_invalidUser)).toThrow('User ID is required');
      });

      it( 'should handle JWT signing errors', () => {
        mockJwt.sign.mockImplementation(() => {
          throw new Error('JWT signing error');
        });
        
        expect(() => AuthService.generateAccessToken(_mockUser)).toThrow('JWT signing error');
      });
    });

    describe( 'generateRefreshToken', () => {
      it( 'should generate refresh token with correct payload', () => {
        const userId = 'test-user-id';
        const tokenVersion = 1;
        
        const token = AuthService.generateRefreshToken( userId, tokenVersion);
        
        expect(_mockJwt.sign).toHaveBeenCalledWith(
          {
            userId,
            tokenVersion,
            type: 'refresh'
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        expect(_token).toBe('mock-jwt-token');
      });

      it( 'should use default token version', () => {
        const userId = 'test-user-id';
        
        AuthService.generateRefreshToken(_userId);
        
        expect(_mockJwt.sign).toHaveBeenCalledWith(
          {
            userId,
            tokenVersion: 0,
            type: 'refresh'
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
      });

      it( 'should handle empty user ID', () => {
        expect(() => AuthService.generateRefreshToken('')).toThrow('User ID is required');
      });
    });

    describe( 'verifyAccessToken', () => {
      it( 'should verify valid access token', () => {
        const token = 'valid-jwt-token';
        const mockPayload = {
          userId: 'test-user-id',
          email: 'test@example.com',
          role: UserRole.STUDENT,
          type: 'access'
        };
        
        mockJwt.verify.mockReturnValue(_mockPayload as never);
        
        const result = AuthService.verifyAccessToken(_token);
        
        expect(_mockJwt.verify).toHaveBeenCalledWith( token, process.env.JWT_SECRET);
        expect(_result).toEqual(_mockPayload);
      });

      it( 'should reject invalid token', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new Error('Invalid token');
        });
        
        expect(() => AuthService.verifyAccessToken('invalid-token')).toThrow('Invalid token');
      });

      it( 'should reject wrong token type', () => {
        const mockPayload = {
          userId: 'test-user-id',
          type: 'refresh'
        };
        
        mockJwt.verify.mockReturnValue(_mockPayload as never);
        
        expect(() => AuthService.verifyAccessToken('token')).toThrow('Invalid token type');
      });

      it( 'should handle empty token', () => {
        expect(() => AuthService.verifyAccessToken('')).toThrow('Token is required');
      });
    });

    describe( 'verifyRefreshToken', () => {
      it( 'should verify valid refresh token', () => {
        const token = 'valid-refresh-token';
        const mockPayload = {
          userId: 'test-user-id',
          tokenVersion: 1,
          type: 'refresh'
        };
        
        mockJwt.verify.mockReturnValue(_mockPayload as never);
        
        const result = AuthService.verifyRefreshToken(_token);
        
        expect(_mockJwt.verify).toHaveBeenCalledWith( token, process.env.JWT_SECRET);
        expect(_result).toEqual(_mockPayload);
      });

      it( 'should reject wrong token type', () => {
        const mockPayload = {
          userId: 'test-user-id',
          type: 'access'
        };
        
        mockJwt.verify.mockReturnValue(_mockPayload as never);
        
        expect(() => AuthService.verifyRefreshToken('token')).toThrow('Invalid token type');
      });
    });
  });

  describe( 'Session Management', () => {
    describe( 'generateSessionId', () => {
      it( 'should generate unique session IDs', () => {
        const id1 = AuthService.generateSessionId(_);
        const id2 = AuthService.generateSessionId(_);
        
        expect(_id1).toBeValidUUID(_);
        expect(_id2).toBeValidUUID(_);
        expect(_id1).not.toBe(_id2);
      });
    });

    describe( 'validateSession', () => {
      it( 'should validate active session', () => {
        const session = {
          id: 'session-id',
          userId: 'user-id',
          expiresAt: new Date(_Date.now() + 3600000).toISOString(), // 1 hour from now
          active: true
        };
        
        const result = AuthService.validateSession(_session);
        
        expect(_result).toBe(_true);
      });

      it( 'should reject expired session', () => {
        const session = {
          id: 'session-id',
          userId: 'user-id',
          expiresAt: new Date(_Date.now() - 3600000).toISOString(), // 1 hour ago
          active: true
        };
        
        const result = AuthService.validateSession(_session);
        
        expect(_result).toBe(_false);
      });

      it( 'should reject inactive session', () => {
        const session = {
          id: 'session-id',
          userId: 'user-id',
          expiresAt: new Date(_Date.now() + 3600000).toISOString(),
          active: false
        };
        
        const result = AuthService.validateSession(_session);
        
        expect(_result).toBe(_false);
      });

      it( 'should handle invalid session data', () => {
        expect(_AuthService.validateSession(null as any)).toBe(_false);
        expect(_AuthService.validateSession({} as any)).toBe(_false);
        expect(_AuthService.validateSession({ id: 'test' } as any)).toBe(_false);
      });
    });
  });

  describe( 'Permission Management', () => {
    describe( 'hasPermission', () => {
      it( 'should grant permission for matching role', () => {
        const result = AuthService.hasPermission( UserRole.ADMIN, ['admin:read']);
        
        expect(_result).toBe(_true);
      });

      it( 'should deny permission for non-matching role', () => {
        const result = AuthService.hasPermission( UserRole.STUDENT, ['admin:read']);
        
        expect(_result).toBe(_false);
      });

      it( 'should handle multiple permissions', () => {
        const result = AuthService.hasPermission( UserRole.INSTRUCTOR, ['lessons:read', 'lessons:write']);
        
        expect(_result).toBe(_true);
      });

      it( 'should handle empty permissions array', () => {
        const result = AuthService.hasPermission( UserRole.STUDENT, []);
        
        expect(_result).toBe(_true); // No permissions required
      });

      it( 'should handle invalid role', () => {
        const result = AuthService.hasPermission( 'INVALID_ROLE' as any, ['admin:read']);
        
        expect(_result).toBe(_false);
      });
    });

    describe( 'getRolePermissions', () => {
      it( 'should return correct permissions for STUDENT', () => {
        const permissions = AuthService.getRolePermissions(UserRole.STUDENT);
        
        expect(_permissions).toContain('lessons:read');
        expect(_permissions).toContain('progress:read');
        expect(_permissions).not.toContain('admin:read');
      });

      it( 'should return correct permissions for INSTRUCTOR', () => {
        const permissions = AuthService.getRolePermissions(UserRole.INSTRUCTOR);
        
        expect(_permissions).toContain('lessons:read');
        expect(_permissions).toContain('lessons:write');
        expect(_permissions).toContain('students:read');
        expect(_permissions).not.toContain('admin:write');
      });

      it( 'should return correct permissions for ADMIN', () => {
        const permissions = AuthService.getRolePermissions(UserRole.ADMIN);
        
        expect(_permissions).toContain('admin:read');
        expect(_permissions).toContain('admin:write');
        expect(_permissions).toContain('users:write');
      });

      it( 'should handle invalid role', () => {
        const permissions = AuthService.getRolePermissions('INVALID_ROLE' as any);
        
        expect(_permissions).toEqual([]);
      });
    });
  });

  describe( 'Security Utilities', () => {
    describe( 'sanitizeUserData', () => {
      it( 'should remove sensitive fields', () => {
        const userData = {
          id: 'user-id',
          email: 'test@example.com',
          password: 'secret-password',
          passwordHash: 'hashed-password',
          refreshToken: 'refresh-token',
          name: 'Test User'
        };
        
        const sanitized = AuthService.sanitizeUserData(_userData);
        
        expect(_sanitized).toEqual({
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User'
        });
        expect(_sanitized).not.toHaveProperty('password');
        expect(_sanitized).not.toHaveProperty('passwordHash');
        expect(_sanitized).not.toHaveProperty('refreshToken');
      });

      it( 'should handle null input', () => {
        const result = AuthService.sanitizeUserData(_null);
        
        expect(_result).toBeNull(_);
      });

      it( 'should handle undefined input', () => {
        const result = AuthService.sanitizeUserData(_undefined);
        
        expect(_result).toBeUndefined(_);
      });
    });

    describe( 'validatePasswordStrength', () => {
      it( 'should accept strong password', () => {
        const result = AuthService.validatePasswordStrength('StrongPassword123!');
        
        expect(_result.isValid).toBe(_true);
        expect(_result.errors).toHaveLength(0);
      });

      it( 'should reject weak passwords', () => {
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
          const result = AuthService.validatePasswordStrength(_password);
          expect(_result.isValid).toBe(_false);
          expect(_result.errors.length).toBeGreaterThan(0);
        });
      });

      it( 'should provide specific error messages', () => {
        const result = AuthService.validatePasswordStrength('weak');
        
        expect(_result.errors).toContain('Password must be at least 8 characters long');
        expect(_result.errors).toContain('Password must contain at least one uppercase letter');
        expect(_result.errors).toContain('Password must contain at least one number');
        expect(_result.errors).toContain('Password must contain at least one special character');
      });
    });
  });
});
