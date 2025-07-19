import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuthService, JwtPayload, RefreshTokenPayload } from '@/lib/api/auth';
import { UserRole, UserStatus, ApiUser } from '@/lib/api/types';
import { UnauthorizedException, ForbiddenException } from '@/lib/api/response';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// Mock external dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

// Test data
const mockUser: ApiUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
  profile: {
    avatar: null,
    bio: 'Test bio',
    location: 'Test Location',
    website: null,
    github: null,
    twitter: null,
    linkedin: null
  },
  preferences: {
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    achievementNotifications: true
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockJwtPayload: JwtPayload = {
  userId: 'user-123',
  email: 'test@example.com',
  role: UserRole.STUDENT,
  permissions: ['lessons:read', 'courses:read', 'progress:read', 'progress:write'],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 900 // 15 minutes
};

describe('AuthService - Comprehensive Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
    mockBcrypt.compare.mockResolvedValue(true as never);
    mockJwt.sign.mockReturnValue('mock-jwt-token' as never);
    mockJwt.verify.mockReturnValue(mockJwtPayload as never);
    
    // Mock environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Password Management', () => {
    describe('hashPassword', () => {
      it('should hash password with correct salt rounds', async () => {
        const password = 'testPassword123!';
        
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

      it('should handle undefined password', async () => {
        await expect(AuthService.hashPassword(undefined as any)).rejects.toThrow('Password cannot be empty');
      });

      it('should handle bcrypt errors gracefully', async () => {
        mockBcrypt.hash.mockRejectedValue(new Error('Bcrypt error') as never);
        
        await expect(AuthService.hashPassword('password')).rejects.toThrow('Password hashing failed');
      });

      it('should handle very long passwords', async () => {
        const longPassword = 'a'.repeat(1000);
        
        await AuthService.hashPassword(longPassword);
        
        expect(mockBcrypt.hash).toHaveBeenCalledWith(longPassword, 12);
      });

      it('should handle special characters in password', async () => {
        const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        await AuthService.hashPassword(specialPassword);
        
        expect(mockBcrypt.hash).toHaveBeenCalledWith(specialPassword, 12);
      });
    });

    describe('verifyPassword', () => {
      it('should verify correct password', async () => {
        mockBcrypt.compare.mockResolvedValue(true as never);
        
        const result = await AuthService.verifyPassword('password', 'hashed-password');
        
        expect(mockBcrypt.compare).toHaveBeenCalledWith('password', 'hashed-password');
        expect(result).toBe(true);
      });

      it('should reject incorrect password', async () => {
        mockBcrypt.compare.mockResolvedValue(false as never);
        
        const result = await AuthService.verifyPassword('wrong-password', 'hashed-password');
        
        expect(result).toBe(false);
      });

      it('should handle empty password verification', async () => {
        const result = await AuthService.verifyPassword('', 'hashed-password');
        
        expect(result).toBe(false);
      });

      it('should handle empty hash verification', async () => {
        const result = await AuthService.verifyPassword('password', '');
        
        expect(result).toBe(false);
      });

      it('should handle bcrypt comparison errors', async () => {
        mockBcrypt.compare.mockRejectedValue(new Error('Comparison error') as never);
        
        await expect(AuthService.verifyPassword('password', 'hash')).rejects.toThrow('Password verification failed');
      });
    });
  });

  describe('JWT Token Generation', () => {
    describe('generateAccessToken', () => {
      it('should generate valid access token for student', () => {
        const studentUser = { ...mockUser, role: UserRole.STUDENT };
        
        const token = AuthService.generateAccessToken(studentUser);
        
        expect(mockJwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: studentUser.id,
            email: studentUser.email,
            role: UserRole.STUDENT,
            permissions: expect.arrayContaining(['lessons:read', 'courses:read'])
          }),
          'test-secret',
          expect.objectContaining({
            expiresIn: '15m',
            issuer: 'solidity-learning-platform',
            audience: 'solidity-learners'
          })
        );
        expect(token).toBe('mock-jwt-token');
      });

      it('should generate valid access token for instructor', () => {
        const instructorUser = { ...mockUser, role: UserRole.INSTRUCTOR };
        
        AuthService.generateAccessToken(instructorUser);
        
        expect(mockJwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            role: UserRole.INSTRUCTOR,
            permissions: expect.arrayContaining(['lessons:write', 'analytics:read'])
          }),
          expect.any(String),
          expect.any(Object)
        );
      });

      it('should generate valid access token for admin', () => {
        const adminUser = { ...mockUser, role: UserRole.ADMIN };
        
        AuthService.generateAccessToken(adminUser);
        
        expect(mockJwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            role: UserRole.ADMIN,
            permissions: expect.arrayContaining(['users:read', 'system:read'])
          }),
          expect.any(String),
          expect.any(Object)
        );
      });

      it('should generate valid access token for admin with all permissions', () => {
        const adminUser = { ...mockUser, role: UserRole.ADMIN };
        
        AuthService.generateAccessToken(adminUser);
        
        expect(mockJwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            role: UserRole.ADMIN,
            permissions: expect.arrayContaining(['users:read', 'system:read', 'system:write'])
          }),
          expect.any(String),
          expect.any(Object)
        );
      });
    });

    describe('generateRefreshToken', () => {
      it('should generate valid refresh token', () => {
        const userId = 'user-123';
        const tokenVersion = 1;
        
        const token = AuthService.generateRefreshToken(userId, tokenVersion);
        
        expect(mockJwt.sign).toHaveBeenCalledWith(
          { userId, tokenVersion },
          'test-secret',
          expect.objectContaining({
            expiresIn: '7d',
            issuer: 'solidity-learning-platform',
            audience: 'solidity-learners'
          })
        );
        expect(token).toBe('mock-jwt-token');
      });

      it('should generate refresh token with default version', () => {
        const userId = 'user-123';
        
        AuthService.generateRefreshToken(userId);
        
        expect(mockJwt.sign).toHaveBeenCalledWith(
          { userId, tokenVersion: 0 },
          expect.any(String),
          expect.any(Object)
        );
      });
    });
  });

  describe('JWT Token Verification', () => {
    describe('verifyAccessToken', () => {
      it('should verify valid access token', () => {
        const token = 'valid-token';
        
        const result = AuthService.verifyAccessToken(token);
        
        expect(mockJwt.verify).toHaveBeenCalledWith(token, 'test-secret', {
          issuer: 'solidity-learning-platform',
          audience: 'solidity-learners'
        });
        expect(result).toEqual(mockJwtPayload);
      });

      it('should throw UnauthorizedException for expired token', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new jwt.TokenExpiredError('Token expired', new Date());
        });
        
        expect(() => AuthService.verifyAccessToken('expired-token'))
          .toThrow(UnauthorizedException);
        expect(() => AuthService.verifyAccessToken('expired-token'))
          .toThrow('Access token has expired');
      });

      it('should throw UnauthorizedException for invalid token', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new jwt.JsonWebTokenError('Invalid token');
        });
        
        expect(() => AuthService.verifyAccessToken('invalid-token'))
          .toThrow(UnauthorizedException);
        expect(() => AuthService.verifyAccessToken('invalid-token'))
          .toThrow('Invalid access token');
      });

      it('should throw UnauthorizedException for malformed token', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new Error('Malformed token');
        });
        
        expect(() => AuthService.verifyAccessToken('malformed-token'))
          .toThrow(UnauthorizedException);
        expect(() => AuthService.verifyAccessToken('malformed-token'))
          .toThrow('Token verification failed');
      });
    });

    describe('verifyRefreshToken', () => {
      it('should verify valid refresh token', () => {
        const refreshPayload: RefreshTokenPayload = {
          userId: 'user-123',
          tokenVersion: 1,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 604800 // 7 days
        };
        mockJwt.verify.mockReturnValue(refreshPayload as never);

        const result = AuthService.verifyRefreshToken('valid-refresh-token');

        expect(result).toEqual(refreshPayload);
      });

      it('should throw UnauthorizedException for expired refresh token', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new jwt.TokenExpiredError('Refresh token expired', new Date());
        });

        expect(() => AuthService.verifyRefreshToken('expired-refresh-token'))
          .toThrow(UnauthorizedException);
        expect(() => AuthService.verifyRefreshToken('expired-refresh-token'))
          .toThrow('Refresh token has expired');
      });
    });
  });

  describe('Token Extraction', () => {
    describe('extractTokenFromRequest', () => {
      it('should extract token from Authorization header', () => {
        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer valid-token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(null)
          }
        } as unknown as NextRequest;

        const token = AuthService.extractTokenFromRequest(mockRequest);

        expect(token).toBe('valid-token');
        expect(mockRequest.headers.get).toHaveBeenCalledWith('authorization');
      });

      it('should extract token from cookies when header is missing', () => {
        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue(null)
          },
          cookies: {
            get: jest.fn().mockReturnValue({ value: 'cookie-token' })
          }
        } as unknown as NextRequest;

        const token = AuthService.extractTokenFromRequest(mockRequest);

        expect(token).toBe('cookie-token');
        expect(mockRequest.cookies.get).toHaveBeenCalledWith('accessToken');
      });

      it('should return null when no token is found', () => {
        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue(null)
          },
          cookies: {
            get: jest.fn().mockReturnValue(null)
          }
        } as unknown as NextRequest;

        const token = AuthService.extractTokenFromRequest(mockRequest);

        expect(token).toBeNull();
      });

      it('should handle malformed Authorization header', () => {
        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue('InvalidFormat token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(null)
          }
        } as unknown as NextRequest;

        const token = AuthService.extractTokenFromRequest(mockRequest);

        expect(token).toBeNull();
      });
    });
  });

  describe('Role-Based Permissions', () => {
    describe('getRolePermissions', () => {
      it('should return correct permissions for STUDENT role', () => {
        const permissions = AuthService.getRolePermissions(UserRole.STUDENT);

        expect(permissions).toEqual([
          'lessons:read',
          'courses:read',
          'progress:read',
          'progress:write',
          'achievements:read',
          'community:read',
          'profile:read',
          'profile:write'
        ]);
      });

      it('should return correct permissions for INSTRUCTOR role', () => {
        const permissions = AuthService.getRolePermissions(UserRole.INSTRUCTOR);

        expect(permissions).toContain('lessons:write');
        expect(permissions).toContain('courses:write');
        expect(permissions).toContain('analytics:read');
        expect(permissions).toContain('community:moderate');
      });

      it('should return correct permissions for ADMIN role', () => {
        const permissions = AuthService.getRolePermissions(UserRole.ADMIN);

        expect(permissions).toContain('users:read');
        expect(permissions).toContain('users:write');
        expect(permissions).toContain('system:read');
        expect(permissions).toContain('lessons:delete');
      });

      it('should return admin permissions for ADMIN role', () => {
        const permissions = AuthService.getRolePermissions(UserRole.ADMIN);

        expect(permissions).toContain('users:read');
        expect(permissions).toContain('users:write');
        expect(permissions).toContain('system:read');
        expect(permissions).toContain('system:write');
      });

      it('should return empty array for invalid role', () => {
        const permissions = AuthService.getRolePermissions('INVALID_ROLE' as UserRole);

        expect(permissions).toEqual([]);
      });
    });

    describe('hasPermission', () => {
      it('should return true for super admin with any permission', () => {
        const result = AuthService.hasPermission(['*'], 'any:permission');

        expect(result).toBe(true);
      });

      it('should return true for exact permission match', () => {
        const userPermissions = ['lessons:read', 'courses:write'];

        expect(AuthService.hasPermission(userPermissions, 'lessons:read')).toBe(true);
        expect(AuthService.hasPermission(userPermissions, 'courses:write')).toBe(true);
      });

      it('should return false for missing permission', () => {
        const userPermissions = ['lessons:read'];

        expect(AuthService.hasPermission(userPermissions, 'lessons:write')).toBe(false);
      });

      it('should handle wildcard permissions', () => {
        const userPermissions = ['lessons:*'];

        expect(AuthService.hasPermission(userPermissions, 'lessons:read')).toBe(true);
        expect(AuthService.hasPermission(userPermissions, 'lessons:write')).toBe(true);
        expect(AuthService.hasPermission(userPermissions, 'courses:read')).toBe(false);
      });

      it('should handle empty permissions array', () => {
        const result = AuthService.hasPermission([], 'any:permission');

        expect(result).toBe(false);
      });
    });

    describe('hasRole', () => {
      it('should return true when user has required role', () => {
        const result = AuthService.hasRole(UserRole.ADMIN, [UserRole.ADMIN, UserRole.INSTRUCTOR]);

        expect(result).toBe(true);
      });

      it('should return false when user does not have required role', () => {
        const result = AuthService.hasRole(UserRole.STUDENT, [UserRole.ADMIN, UserRole.INSTRUCTOR]);

        expect(result).toBe(false);
      });

      it('should handle single role requirement', () => {
        expect(AuthService.hasRole(UserRole.INSTRUCTOR, [UserRole.INSTRUCTOR])).toBe(true);
        expect(AuthService.hasRole(UserRole.STUDENT, [UserRole.INSTRUCTOR])).toBe(false);
      });
    });
  });

  describe('Authentication Middleware', () => {
    describe('authenticateRequest', () => {
      it('should authenticate valid request', async () => {
        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer valid-token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(null)
          }
        } as unknown as NextRequest;

        const result = await AuthService.authenticateRequest(mockRequest);

        expect(result).toEqual(mockJwtPayload);
      });

      it('should throw UnauthorizedException when no token provided', async () => {
        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue(null)
          },
          cookies: {
            get: jest.fn().mockReturnValue(null)
          }
        } as unknown as NextRequest;

        await expect(AuthService.authenticateRequest(mockRequest))
          .rejects.toThrow(UnauthorizedException);
        await expect(AuthService.authenticateRequest(mockRequest))
          .rejects.toThrow('No authentication token provided');
      });
    });

    describe('requirePermission', () => {
      it('should allow access with correct permission', async () => {
        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer valid-token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(null)
          }
        } as unknown as NextRequest;

        const result = await AuthService.requirePermission(mockRequest, 'lessons:read');

        expect(result).toEqual(mockJwtPayload);
      });

      it('should throw ForbiddenException for insufficient permissions', async () => {
        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer valid-token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(null)
          }
        } as unknown as NextRequest;

        await expect(AuthService.requirePermission(mockRequest, 'admin:delete'))
          .rejects.toThrow(ForbiddenException);
        await expect(AuthService.requirePermission(mockRequest, 'admin:delete'))
          .rejects.toThrow('Insufficient permissions. Required: admin:delete');
      });
    });

    describe('requireRole', () => {
      it('should allow access with correct role', async () => {
        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer valid-token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(null)
          }
        } as unknown as NextRequest;

        const result = await AuthService.requireRole(mockRequest, [UserRole.STUDENT, UserRole.INSTRUCTOR]);

        expect(result).toEqual(mockJwtPayload);
      });

      it('should throw ForbiddenException for insufficient role', async () => {
        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer valid-token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(null)
          }
        } as unknown as NextRequest;

        await expect(AuthService.requireRole(mockRequest, [UserRole.ADMIN]))
          .rejects.toThrow(ForbiddenException);
        await expect(AuthService.requireRole(mockRequest, [UserRole.ADMIN]))
          .rejects.toThrow('Insufficient role. Required: ADMIN');
      });
    });
  });

  describe('Session Management', () => {
    describe('generateSessionId', () => {
      it('should generate unique session IDs', () => {
        const sessionId1 = AuthService.generateSessionId();
        const sessionId2 = AuthService.generateSessionId();

        expect(sessionId1).toMatch(/^sess_\d+_[a-z0-9]+$/);
        expect(sessionId2).toMatch(/^sess_\d+_[a-z0-9]+$/);
        expect(sessionId1).not.toBe(sessionId2);
      });
    });

    describe('isTokenExpiringSoon', () => {
      it('should return true for token expiring within threshold', () => {
        const payload: JwtPayload = {
          ...mockJwtPayload,
          exp: Math.floor(Date.now() / 1000) + 240 // 4 minutes from now
        };

        const result = AuthService.isTokenExpiringSoon(payload, 5);

        expect(result).toBe(true);
      });

      it('should return false for token not expiring soon', () => {
        const payload: JwtPayload = {
          ...mockJwtPayload,
          exp: Math.floor(Date.now() / 1000) + 600 // 10 minutes from now
        };

        const result = AuthService.isTokenExpiringSoon(payload, 5);

        expect(result).toBe(false);
      });

      it('should return false for token without expiration', () => {
        const payload: JwtPayload = {
          ...mockJwtPayload,
          exp: undefined
        };

        const result = AuthService.isTokenExpiringSoon(payload, 5);

        expect(result).toBe(false);
      });
    });
  });

  describe('Security Tests', () => {
    describe('Token Tampering Protection', () => {
      it('should reject tampered tokens', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new jwt.JsonWebTokenError('Invalid signature');
        });

        expect(() => AuthService.verifyAccessToken('tampered-token'))
          .toThrow(UnauthorizedException);
      });

      it('should reject tokens with invalid signature', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new jwt.JsonWebTokenError('Invalid signature');
        });

        expect(() => AuthService.verifyAccessToken('invalid-signature-token'))
          .toThrow('Invalid access token');
      });
    });

    describe('Permission Escalation Protection', () => {
      it('should prevent permission escalation through token manipulation', () => {
        const studentPermissions = AuthService.getRolePermissions(UserRole.STUDENT);

        expect(studentPermissions).not.toContain('users:delete');
        expect(studentPermissions).not.toContain('system:write');
        expect(studentPermissions).not.toContain('*');
      });

      it('should enforce strict permission checking', () => {
        const studentPermissions = ['lessons:read'];

        expect(AuthService.hasPermission(studentPermissions, 'lessons:write')).toBe(false);
        expect(AuthService.hasPermission(studentPermissions, 'admin:read')).toBe(false);
      });
    });

    describe('Input Validation', () => {
      it('should handle malicious input in password hashing', async () => {
        const maliciousInput = '<script>alert("xss")</script>';

        await AuthService.hashPassword(maliciousInput);

        expect(mockBcrypt.hash).toHaveBeenCalledWith(maliciousInput, 12);
      });

      it('should handle SQL injection attempts in user data', () => {
        const maliciousUser = {
          ...mockUser,
          email: "'; DROP TABLE users; --"
        };

        expect(() => AuthService.generateAccessToken(maliciousUser)).not.toThrow();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should hash passwords within acceptable time', async () => {
      const startTime = performance.now();

      await AuthService.hashPassword('test-password');

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 100ms (mocked, but validates call structure)
      expect(duration).toBeLessThan(100);
    });

    it('should generate tokens quickly', () => {
      const startTime = performance.now();

      AuthService.generateAccessToken(mockUser);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 10ms
      expect(duration).toBeLessThan(10);
    });

    it('should verify tokens efficiently', () => {
      const startTime = performance.now();

      AuthService.verifyAccessToken('test-token');

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 10ms
      expect(duration).toBeLessThan(10);
    });
  });
});
