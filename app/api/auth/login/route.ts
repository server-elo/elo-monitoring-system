import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  withErrorHandling,
  generateRequestId,
  getClientIP,
  parseUserAgent
} from '@/lib/api/utils';
import { ApiErrorCode, HttpStatus, AuthResponse, UserRole, UserStatus, UserProfile } from '@/lib/api/types';
import { logger } from '@/lib/api/logger';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false)
});

// SECURITY WARNING: Mock user database - MUST be replaced with actual database in production
// These are development-only test accounts with known passwords
// TODO: Remove this mock data and implement proper database integration
const mockUsers = [
  {
    id: '1',
    email: 'student@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // Development only: secret123
    name: 'John Student',
    role: 'STUDENT' as const,
    status: 'ACTIVE' as const,
    profile: {
      avatar: null,
      bio: null,
      location: null,
      website: null,
      github: null,
      twitter: null,
      linkedin: null,
      xpTotal: 1250,
      level: 5,
      lessonsCompleted: 23,
      coursesCompleted: 2,
      achievementsCount: 8,
      currentStreak: 7,
      longestStreak: 15
    },
    preferences: {
      theme: 'dark' as const,
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      achievementNotifications: true
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    lastLoginAt: '2024-01-14T15:45:00Z'
  },
  {
    id: '2',
    email: 'instructor@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // secret123
    name: 'Jane Instructor',
    role: 'INSTRUCTOR' as const,
    status: 'ACTIVE' as const,
    profile: {
      avatar: null,
      bio: 'Experienced Solidity developer and educator',
      location: 'San Francisco, CA',
      website: 'https://janedev.com',
      github: 'janedev',
      twitter: 'janedev',
      linkedin: 'jane-developer',
      xpTotal: 5000,
      level: 15,
      lessonsCompleted: 150,
      coursesCompleted: 25,
      achievementsCount: 45,
      currentStreak: 30,
      longestStreak: 60
    },
    preferences: {
      theme: 'light' as const,
      language: 'en',
      timezone: 'America/Los_Angeles',
      emailNotifications: true,
      pushNotifications: false,
      weeklyDigest: true,
      achievementNotifications: true
    },
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-01-15T08:20:00Z',
    lastLoginAt: '2024-01-15T08:20:00Z'
  },
  {
    id: '3',
    email: 'admin@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // secret123
    name: 'Admin User',
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
    profile: {
      avatar: null,
      bio: 'Platform administrator',
      location: null,
      website: null,
      github: null,
      twitter: null,
      linkedin: null,
      xpTotal: 10000,
      level: 25,
      lessonsCompleted: 300,
      coursesCompleted: 50,
      achievementsCount: 100,
      currentStreak: 100,
      longestStreak: 200
    },
    preferences: {
      theme: 'system' as const,
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: false,
      achievementNotifications: false
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
    lastLoginAt: '2024-01-15T12:00:00Z'
  }
];

async function loginHandler(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: 'INVALID_FORMAT'
      }));
      return validationErrorResponse(errors, requestId);
    }
    
    const { email, password, rememberMe } = validation.data;
    
    // Find user by email
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return errorResponse(
        ApiErrorCode.UNAUTHORIZED,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
        undefined,
        requestId
      );
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return errorResponse(
        ApiErrorCode.UNAUTHORIZED,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
        undefined,
        requestId
      );
    }
    
    // Check user status
    if (user.status !== 'ACTIVE') {
      return errorResponse(
        ApiErrorCode.FORBIDDEN,
        'Account is not active',
        HttpStatus.FORBIDDEN,
        { status: user.status },
        requestId
      );
    }
    
    // Generate JWT tokens
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return errorResponse(
        ApiErrorCode.INTERNAL_SERVER_ERROR,
        'Server configuration error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        undefined,
        requestId
      );
    }

    // Validate JWT secret length for security
    if (jwtSecret.length < 32) {
      logger.error('JWT_SECRET is too short. Must be at least 32 characters.', {
        requestId,
        secretLength: jwtSecret.length,
        minimumRequired: 32
      });
      return errorResponse(
        ApiErrorCode.INTERNAL_SERVER_ERROR,
        'Server configuration error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        undefined,
        requestId
      );
    }
    const tokenExpiry = rememberMe ? '30d' : '24h';
    const refreshTokenExpiry = rememberMe ? '90d' : '7d';
    
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: generateRequestId()
    };
    
    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: tokenExpiry,
      issuer: 'solidity-learning-platform',
      audience: 'solidity-learning-platform'
    });
    
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      jwtSecret,
      {
        expiresIn: refreshTokenExpiry,
        issuer: 'solidity-learning-platform',
        audience: 'solidity-learning-platform'
      }
    );
    
    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
    
    // Log login attempt
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const { browser, os } = parseUserAgent(userAgent);
    
    logger.info('Login successful', {
      userId: user.id,
      email: user.email,
      ip: clientIP,
      browser,
      os,
      rememberMe,
      requestId,
      timestamp: new Date().toISOString()
    });
    
    // Prepare response data
    const responseData: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        status: user.status as UserStatus,
        profile: {
          avatar: user.profile?.avatar || undefined,
          bio: user.profile?.bio || undefined,
          location: user.profile?.location || undefined,
          website: user.profile?.website || undefined,
          github: user.profile?.github || undefined,
          twitter: user.profile?.twitter || undefined,
          linkedin: user.profile?.linkedin || undefined,
          xpTotal: user.profile?.xpTotal || 0,
          level: user.profile?.level || 1,
          lessonsCompleted: user.profile?.lessonsCompleted || 0,
          coursesCompleted: user.profile?.coursesCompleted || 0,
          achievementsCount: user.profile?.achievementsCount || 0,
          currentStreak: user.profile?.currentStreak || 0,
          longestStreak: user.profile?.longestStreak || 0,
        } as UserProfile,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: new Date().toISOString()
      },
      token,
      refreshToken,
      expiresAt: expiresAt.toISOString()
    };
    
    // Create response with secure headers
    const response = successResponse(responseData, undefined, HttpStatus.OK, requestId);
    
    // Set secure HTTP-only cookie for refresh token
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 90 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 90 days or 7 days
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    logger.error('Login error', {
      requestId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, error instanceof Error ? error : undefined);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Login failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// Export handlers
export const POST = withErrorHandling(loginHandler);
