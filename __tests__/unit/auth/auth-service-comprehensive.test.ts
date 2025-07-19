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
  iat: Math.floor(_Date.now() / 1000),
  exp: Math.floor(_Date.now() / 1000) + 900 // 15 minutes
};

describe( 'AuthService - Comprehensive Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks(_);
    
    // Setup default mocks
    mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
    mockBcrypt.compare.mockResolvedValue(_true as never);
    mockJwt.sign.mockReturnValue('mock-jwt-token' as never);
    mockJwt.verify.mockReturnValue(_mockJwtPayload as never);
    
    // Mock environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  afterEach(() => {
    jest.restoreAllMocks(_);
  });

  describe( 'Password Management', () => {
    describe( 'hashPassword', () => {
      it( 'should hash password with correct salt rounds', async () => {
        const password = 'testPassword123!';
        
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

      it( 'should handle undefined password', async () => {
        await expect(_AuthService.hashPassword(undefined as any)).rejects.toThrow('Password cannot be empty');
      });

      it( 'should handle bcrypt errors gracefully', async () => {
        mockBcrypt.hash.mockRejectedValue(_new Error('Bcrypt error') as never);
        
        await expect(_AuthService.hashPassword('password')).rejects.toThrow('Password hashing failed');
      });

      it( 'should handle very long passwords', async () => {
        const longPassword = 'a'.repeat(1000);
        
        await AuthService.hashPassword(_longPassword);
        
        expect(_mockBcrypt.hash).toHaveBeenCalledWith( longPassword, 12);
      });

      it( 'should handle special characters in password', async () => {
        const specialPassword = '!@#$%^&*(_)+-=[]{}|;:,.<>?';
        
        await AuthService.hashPassword(_specialPassword);
        
        expect(_mockBcrypt.hash).toHaveBeenCalledWith( specialPassword, 12);
      });
    });

    describe( 'verifyPassword', () => {
      it( 'should verify correct password', async () => {
        mockBcrypt.compare.mockResolvedValue(_true as never);
        
        const result = await AuthService.verifyPassword( 'password', 'hashed-password');
        
        expect(_mockBcrypt.compare).toHaveBeenCalledWith( 'password', 'hashed-password');
        expect(_result).toBe(_true);
      });

      it( 'should reject incorrect password', async () => {
        mockBcrypt.compare.mockResolvedValue(_false as never);
        
        const result = await AuthService.verifyPassword( 'wrong-password', 'hashed-password');
        
        expect(_result).toBe(_false);
      });

      it( 'should handle empty password verification', async () => {
        const result = await AuthService.verifyPassword( '', 'hashed-password');
        
        expect(_result).toBe(_false);
      });

      it( 'should handle empty hash verification', async () => {
        const result = await AuthService.verifyPassword( 'password', '');
        
        expect(_result).toBe(_false);
      });

      it( 'should handle bcrypt comparison errors', async () => {
        mockBcrypt.compare.mockRejectedValue(_new Error('Comparison error') as never);
        
        await expect( AuthService.verifyPassword('password', 'hash')).rejects.toThrow('Password verification failed');
      });
    });
  });

  describe( 'JWT Token Generation', () => {
    describe( 'generateAccessToken', () => {
      it( 'should generate valid access token for student', () => {
        const studentUser = { ...mockUser, role: UserRole.STUDENT };
        
        const token = AuthService.generateAccessToken(_studentUser);
        
        expect(_mockJwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: studentUser.id,
            email: studentUser.email,
            role: UserRole.STUDENT,
            permissions: expect.arrayContaining( ['lessons:read', 'courses:read'])
          }),
          'test-secret',
          expect.objectContaining({
            expiresIn: '15m',
            issuer: 'solidity-learning-platform',
            audience: 'solidity-learners'
          })
        );
        expect(_token).toBe('mock-jwt-token');
      });

      it( 'should generate valid access token for instructor', () => {
        const instructorUser = { ...mockUser, role: UserRole.INSTRUCTOR };
        
        AuthService.generateAccessToken(_instructorUser);
        
        expect(_mockJwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            role: UserRole.INSTRUCTOR,
            permissions: expect.arrayContaining( ['lessons:write', 'analytics:read'])
          }),
          expect.any(_String),
          expect.any(_Object)
        );
      });

      it( 'should generate valid access token for admin', () => {
        const adminUser = { ...mockUser, role: UserRole.ADMIN };
        
        AuthService.generateAccessToken(_adminUser);
        
        expect(_mockJwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            role: UserRole.ADMIN,
            permissions: expect.arrayContaining( ['users:read', 'system:read'])
          }),
          expect.any(_String),
          expect.any(_Object)
        );
      });

      it( 'should generate valid access token for admin with all permissions', () => {
        const adminUser = { ...mockUser, role: UserRole.ADMIN };
        
        AuthService.generateAccessToken(_adminUser);
        
        expect(_mockJwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            role: UserRole.ADMIN,
            permissions: expect.arrayContaining( ['users:read', 'system:read', 'system:write'])
          }),
          expect.any(_String),
          expect.any(_Object)
        );
      });
    });

    describe( 'generateRefreshToken', () => {
      it( 'should generate valid refresh token', () => {
        const userId = 'user-123';
        const tokenVersion = 1;
        
        const token = AuthService.generateRefreshToken( userId, tokenVersion);
        
        expect(_mockJwt.sign).toHaveBeenCalledWith(
          { userId, tokenVersion },
          'test-secret',
          expect.objectContaining({
            expiresIn: '7d',
            issuer: 'solidity-learning-platform',
            audience: 'solidity-learners'
          })
        );
        expect(_token).toBe('mock-jwt-token');
      });

      it( 'should generate refresh token with default version', () => {
        const userId = 'user-123';
        
        AuthService.generateRefreshToken(_userId);
        
        expect(_mockJwt.sign).toHaveBeenCalledWith(
          { userId, tokenVersion: 0 },
          expect.any(_String),
          expect.any(_Object)
        );
      });
    });
  });

  describe( 'JWT Token Verification', () => {
    describe( 'verifyAccessToken', () => {
      it( 'should verify valid access token', () => {
        const token = 'valid-token';
        
        const result = AuthService.verifyAccessToken(_token);
        
        expect(_mockJwt.verify).toHaveBeenCalledWith(token, 'test-secret', {
          issuer: 'solidity-learning-platform',
          audience: 'solidity-learners'
        });
        expect(_result).toEqual(_mockJwtPayload);
      });

      it( 'should throw UnauthorizedException for expired token', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new jwt.TokenExpiredError( 'Token expired', new Date());
        });
        
        expect(() => AuthService.verifyAccessToken('expired-token'))
          .toThrow(_UnauthorizedException);
        expect(() => AuthService.verifyAccessToken('expired-token'))
          .toThrow('Access token has expired');
      });

      it( 'should throw UnauthorizedException for invalid token', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new jwt.JsonWebTokenError('Invalid token');
        });
        
        expect(() => AuthService.verifyAccessToken('invalid-token'))
          .toThrow(_UnauthorizedException);
        expect(() => AuthService.verifyAccessToken('invalid-token'))
          .toThrow('Invalid access token');
      });

      it( 'should throw UnauthorizedException for malformed token', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new Error('Malformed token');
        });
        
        expect(() => AuthService.verifyAccessToken('malformed-token'))
          .toThrow(_UnauthorizedException);
        expect(() => AuthService.verifyAccessToken('malformed-token'))
          .toThrow('Token verification failed');
      });
    });

    describe( 'verifyRefreshToken', () => {
      it( 'should verify valid refresh token', () => {
        const refreshPayload: RefreshTokenPayload = {
          userId: 'user-123',
          tokenVersion: 1,
          iat: Math.floor(_Date.now() / 1000),
          exp: Math.floor(_Date.now() / 1000) + 604800 // 7 days
        };
        mockJwt.verify.mockReturnValue(_refreshPayload as never);

        const result = AuthService.verifyRefreshToken('valid-refresh-token');

        expect(_result).toEqual(_refreshPayload);
      });

      it( 'should throw UnauthorizedException for expired refresh token', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new jwt.TokenExpiredError( 'Refresh token expired', new Date());
        });

        expect(() => AuthService.verifyRefreshToken('expired-refresh-token'))
          .toThrow(_UnauthorizedException);
        expect(() => AuthService.verifyRefreshToken('expired-refresh-token'))
          .toThrow('Refresh token has expired');
      });
    });
  });

  describe( 'Token Extraction', () => {
    describe( 'extractTokenFromRequest', () => {
      it( 'should extract token from Authorization header', () => {
        const mockRequest = {
          headers: {
            get: jest.fn(_).mockReturnValue('Bearer valid-token')
          },
          cookies: {
            get: jest.fn(_).mockReturnValue(_null)
          }
        } as unknown as NextRequest;

        const token = AuthService.extractTokenFromRequest(_mockRequest);

        expect(_token).toBe('valid-token');
        expect(_mockRequest.headers.get).toHaveBeenCalledWith('authorization');
      });

      it( 'should extract token from cookies when header is missing', () => {
        const mockRequest = {
          headers: {
            get: jest.fn(_).mockReturnValue(_null)
          },
          cookies: {
            get: jest.fn(_).mockReturnValue({ value: 'cookie-token'  })
          }
        } as unknown as NextRequest;

        const token = AuthService.extractTokenFromRequest(_mockRequest);

        expect(_token).toBe('cookie-token');
        expect(_mockRequest.cookies.get).toHaveBeenCalledWith('accessToken');
      });

      it( 'should return null when no token is found', () => {
        const mockRequest = {
          headers: {
            get: jest.fn(_).mockReturnValue(_null)
          },
          cookies: {
            get: jest.fn(_).mockReturnValue(_null)
          }
        } as unknown as NextRequest;

        const token = AuthService.extractTokenFromRequest(_mockRequest);

        expect(_token).toBeNull(_);
      });

      it( 'should handle malformed Authorization header', () => {
        const mockRequest = {
          headers: {
            get: jest.fn(_).mockReturnValue('InvalidFormat token')
          },
          cookies: {
            get: jest.fn(_).mockReturnValue(_null)
          }
        } as unknown as NextRequest;

        const token = AuthService.extractTokenFromRequest(_mockRequest);

        expect(_token).toBeNull(_);
      });
    });
  });

  describe( 'Role-Based Permissions', () => {
    describe( 'getRolePermissions', () => {
      it( 'should return correct permissions for STUDENT role', () => {
        const permissions = AuthService.getRolePermissions(UserRole.STUDENT);

        expect(_permissions).toEqual([
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

      it( 'should return correct permissions for INSTRUCTOR role', () => {
        const permissions = AuthService.getRolePermissions(UserRole.INSTRUCTOR);

        expect(_permissions).toContain('lessons:write');
        expect(_permissions).toContain('courses:write');
        expect(_permissions).toContain('analytics:read');
        expect(_permissions).toContain('community:moderate');
      });

      it( 'should return correct permissions for ADMIN role', () => {
        const permissions = AuthService.getRolePermissions(UserRole.ADMIN);

        expect(_permissions).toContain('users:read');
        expect(_permissions).toContain('users:write');
        expect(_permissions).toContain('system:read');
        expect(_permissions).toContain('lessons:delete');
      });

      it( 'should return admin permissions for ADMIN role', () => {
        const permissions = AuthService.getRolePermissions(UserRole.ADMIN);

        expect(_permissions).toContain('users:read');
        expect(_permissions).toContain('users:write');
        expect(_permissions).toContain('system:read');
        expect(_permissions).toContain('system:write');
      });

      it( 'should return empty array for invalid role', () => {
        const permissions = AuthService.getRolePermissions('INVALID_ROLE' as UserRole);

        expect(_permissions).toEqual([]);
      });
    });

    describe( 'hasPermission', () => {
      it( 'should return true for super admin with any permission', () => {
        const result = AuthService.hasPermission( ['*'], 'any:permission');

        expect(_result).toBe(_true);
      });

      it( 'should return true for exact permission match', () => {
        const userPermissions = ['lessons:read', 'courses:write'];

        expect( AuthService.hasPermission(userPermissions, 'lessons:read')).toBe(_true);
        expect( AuthService.hasPermission(userPermissions, 'courses:write')).toBe(_true);
      });

      it( 'should return false for missing permission', () => {
        const userPermissions = ['lessons:read'];

        expect( AuthService.hasPermission(userPermissions, 'lessons:write')).toBe(_false);
      });

      it( 'should handle wildcard permissions', () => {
        const userPermissions = ['lessons:*'];

        expect( AuthService.hasPermission(userPermissions, 'lessons:read')).toBe(_true);
        expect( AuthService.hasPermission(userPermissions, 'lessons:write')).toBe(_true);
        expect( AuthService.hasPermission(userPermissions, 'courses:read')).toBe(_false);
      });

      it( 'should handle empty permissions array', () => {
        const result = AuthService.hasPermission( [], 'any:permission');

        expect(_result).toBe(_false);
      });
    });

    describe( 'hasRole', () => {
      it( 'should return true when user has required role', () => {
        const result = AuthService.hasRole( UserRole.ADMIN, [UserRole.ADMIN, UserRole.INSTRUCTOR]);

        expect(_result).toBe(_true);
      });

      it( 'should return false when user does not have required role', () => {
        const result = AuthService.hasRole( UserRole.STUDENT, [UserRole.ADMIN, UserRole.INSTRUCTOR]);

        expect(_result).toBe(_false);
      });

      it( 'should handle single role requirement', () => {
        expect( AuthService.hasRole(UserRole.INSTRUCTOR, [UserRole.INSTRUCTOR])).toBe(_true);
        expect( AuthService.hasRole(UserRole.STUDENT, [UserRole.INSTRUCTOR])).toBe(_false);
      });
    });
  });

  describe( 'Authentication Middleware', () => {
    describe( 'authenticateRequest', () => {
      it( 'should authenticate valid request', async () => {
        const mockRequest = {
          headers: {
            get: jest.fn(_).mockReturnValue('Bearer valid-token')
          },
          cookies: {
            get: jest.fn(_).mockReturnValue(_null)
          }
        } as unknown as NextRequest;

        const result = await AuthService.authenticateRequest(_mockRequest);

        expect(_result).toEqual(_mockJwtPayload);
      });

      it( 'should throw UnauthorizedException when no token provided', async () => {
        const mockRequest = {
          headers: {
            get: jest.fn(_).mockReturnValue(_null)
          },
          cookies: {
            get: jest.fn(_).mockReturnValue(_null)
          }
        } as unknown as NextRequest;

        await expect(_AuthService.authenticateRequest(mockRequest))
          .rejects.toThrow(_UnauthorizedException);
        await expect(_AuthService.authenticateRequest(mockRequest))
          .rejects.toThrow('No authentication token provided');
      });
    });

    describe( 'requirePermission', () => {
      it( 'should allow access with correct permission', async () => {
        const mockRequest = {
          headers: {
            get: jest.fn(_).mockReturnValue('Bearer valid-token')
          },
          cookies: {
            get: jest.fn(_).mockReturnValue(_null)
          }
        } as unknown as NextRequest;

        const result = await AuthService.requirePermission( mockRequest, 'lessons:read');

        expect(_result).toEqual(_mockJwtPayload);
      });

      it( 'should throw ForbiddenException for insufficient permissions', async () => {
        const mockRequest = {
          headers: {
            get: jest.fn(_).mockReturnValue('Bearer valid-token')
          },
          cookies: {
            get: jest.fn(_).mockReturnValue(_null)
          }
        } as unknown as NextRequest;

        await expect( AuthService.requirePermission(mockRequest, 'admin:delete'))
          .rejects.toThrow(_ForbiddenException);
        await expect( AuthService.requirePermission(mockRequest, 'admin:delete'))
          .rejects.toThrow('Insufficient permissions. Required: admin:delete');
      });
    });

    describe( 'requireRole', () => {
      it( 'should allow access with correct role', async () => {
        const mockRequest = {
          headers: {
            get: jest.fn(_).mockReturnValue('Bearer valid-token')
          },
          cookies: {
            get: jest.fn(_).mockReturnValue(_null)
          }
        } as unknown as NextRequest;

        const result = await AuthService.requireRole( mockRequest, [UserRole.STUDENT, UserRole.INSTRUCTOR]);

        expect(_result).toEqual(_mockJwtPayload);
      });

      it( 'should throw ForbiddenException for insufficient role', async () => {
        const mockRequest = {
          headers: {
            get: jest.fn(_).mockReturnValue('Bearer valid-token')
          },
          cookies: {
            get: jest.fn(_).mockReturnValue(_null)
          }
        } as unknown as NextRequest;

        await expect( AuthService.requireRole(mockRequest, [UserRole.ADMIN]))
          .rejects.toThrow(_ForbiddenException);
        await expect( AuthService.requireRole(mockRequest, [UserRole.ADMIN]))
          .rejects.toThrow('Insufficient role. Required: ADMIN');
      });
    });
  });

  describe( 'Session Management', () => {
    describe( 'generateSessionId', () => {
      it( 'should generate unique session IDs', () => {
        const sessionId1 = AuthService.generateSessionId(_);
        const sessionId2 = AuthService.generateSessionId(_);

        expect(_sessionId1).toMatch(_/^sess_\d+[a-z0-9]+$/);
        expect(_sessionId2).toMatch(_/^sess_\d+[a-z0-9]+$/);
        expect(_sessionId1).not.toBe(_sessionId2);
      });
    });

    describe( 'isTokenExpiringSoon', () => {
      it( 'should return true for token expiring within threshold', () => {
        const payload: JwtPayload = {
          ...mockJwtPayload,
          exp: Math.floor(_Date.now() / 1000) + 240 // 4 minutes from now
        };

        const result = AuthService.isTokenExpiringSoon( payload, 5);

        expect(_result).toBe(_true);
      });

      it( 'should return false for token not expiring soon', () => {
        const payload: JwtPayload = {
          ...mockJwtPayload,
          exp: Math.floor(_Date.now() / 1000) + 600 // 10 minutes from now
        };

        const result = AuthService.isTokenExpiringSoon( payload, 5);

        expect(_result).toBe(_false);
      });

      it( 'should return false for token without expiration', () => {
        const payload: JwtPayload = {
          ...mockJwtPayload,
          exp: undefined
        };

        const result = AuthService.isTokenExpiringSoon( payload, 5);

        expect(_result).toBe(_false);
      });
    });
  });

  describe( 'Security Tests', () => {
    describe( 'Token Tampering Protection', () => {
      it( 'should reject tampered tokens', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new jwt.JsonWebTokenError('Invalid signature');
        });

        expect(() => AuthService.verifyAccessToken('tampered-token'))
          .toThrow(_UnauthorizedException);
      });

      it( 'should reject tokens with invalid signature', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new jwt.JsonWebTokenError('Invalid signature');
        });

        expect(() => AuthService.verifyAccessToken('invalid-signature-token'))
          .toThrow('Invalid access token');
      });
    });

    describe( 'Permission Escalation Protection', () => {
      it( 'should prevent permission escalation through token manipulation', () => {
        const studentPermissions = AuthService.getRolePermissions(UserRole.STUDENT);

        expect(_studentPermissions).not.toContain('users:delete');
        expect(_studentPermissions).not.toContain('system:write');
        expect(_studentPermissions).not.toContain('*');
      });

      it( 'should enforce strict permission checking', () => {
        const studentPermissions = ['lessons:read'];

        expect( AuthService.hasPermission(studentPermissions, 'lessons:write')).toBe(_false);
        expect( AuthService.hasPermission(studentPermissions, 'admin:read')).toBe(_false);
      });
    });

    describe( 'Input Validation', () => {
      it( 'should handle malicious input in password hashing', async () => {
        const maliciousInput = '<script>alert("xss")</script>';

        await AuthService.hashPassword(_maliciousInput);

        expect(_mockBcrypt.hash).toHaveBeenCalledWith( maliciousInput, 12);
      });

      it( 'should handle SQL injection attempts in user data', () => {
        const maliciousUser = {
          ...mockUser,
          email: "'; DROP TABLE users; --"
        };

        expect(() => AuthService.generateAccessToken(_maliciousUser)).not.toThrow(_);
      });
    });
  });

  describe( 'Performance Tests', () => {
    it( 'should hash passwords within acceptable time', async () => {
      const startTime = performance.now(_);

      await AuthService.hashPassword('test-password');

      const endTime = performance.now(_);
      const duration = endTime - startTime;

      // Should complete within 100ms ( mocked, but validates call structure)
      expect(_duration).toBeLessThan(100);
    });

    it( 'should generate tokens quickly', () => {
      const startTime = performance.now(_);

      AuthService.generateAccessToken(_mockUser);

      const endTime = performance.now(_);
      const duration = endTime - startTime;

      // Should complete within 10ms
      expect(_duration).toBeLessThan(10);
    });

    it( 'should verify tokens efficiently', () => {
      const startTime = performance.now(_);

      AuthService.verifyAccessToken('test-token');

      const endTime = performance.now(_);
      const duration = endTime - startTime;

      // Should complete within 10ms
      expect(_duration).toBeLessThan(10);
    });
  });
});
