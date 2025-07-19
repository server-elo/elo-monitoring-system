import { NextRequest } from 'next/server';
import { authEndpoint } from '@/lib/api/middleware';
import { ApiResponseBuilder } from '@/lib/api/response';
import { validateBody, LoginSchema } from '@/lib/api/validation';
import { AuthService } from '@/lib/api/auth';
import { ApiUser, UserRole, UserStatus } from '@/lib/api/types';
import { logger } from '@/lib/monitoring/simple-logger';

// Mock user database - in production, this would be a real database
const mockUsers: Array<ApiUser & { passwordHash: string }> = [
  {
    id: 'user_1',
    email: 'student@example.com',
    name: 'John Student',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', // password123
    profile: {
      xpTotal: 1250,
      level: 5,
      lessonsCompleted: 12,
      coursesCompleted: 2,
      achievementsCount: 8,
      currentStreak: 7,
      longestStreak: 15
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
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    lastLoginAt: '2024-01-20T15:30:00Z'
  },
  {
    id: 'user_2',
    email: 'instructor@example.com',
    name: 'Jane Instructor',
    role: UserRole.INSTRUCTOR,
    status: UserStatus.ACTIVE,
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', // password123
    profile: {
      bio: 'Experienced Solidity developer and educator',
      xpTotal: 5000,
      level: 15,
      lessonsCompleted: 45,
      coursesCompleted: 8,
      achievementsCount: 25,
      currentStreak: 30,
      longestStreak: 45
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      achievementNotifications: true
    },
    createdAt: '2022-06-01T08:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z',
    lastLoginAt: '2024-01-20T14:00:00Z'
  },
  {
    id: 'user_3',
    email: 'admin@example.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', // password123
    profile: {
      xpTotal: 10000,
      level: 25,
      lessonsCompleted: 100,
      coursesCompleted: 15,
      achievementsCount: 50,
      currentStreak: 60,
      longestStreak: 90
    },
    preferences: {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: false,
      achievementNotifications: true
    },
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2024-01-20T16:00:00Z',
    lastLoginAt: '2024-01-20T16:00:00Z'
  }
];

async function findUserByEmail(email: string): Promise<(ApiUser & { passwordHash: string }) | null> {
  return mockUsers.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
}

async function updateLastLogin(userId: string): Promise<void> {
  const user = mockUsers.find(u => u.id === userId);
  if (user) {
    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
  }
}

export const POST = authEndpoint(async (request: NextRequest) => {
  try {
    // Validate request body
    const body = await validateBody(LoginSchema, request);
    const { email, password, rememberMe } = body;

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return ApiResponseBuilder.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      return ApiResponseBuilder.forbidden('Account is not active');
    }

    // Verify password
    const isPasswordValid = await AuthService.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return ApiResponseBuilder.unauthorized('Invalid email or password');
    }

    // Update last login
    await updateLastLogin(user.id);

    // Remove sensitive data from user object
    const { passwordHash, ...safeUser } = user;

    // Generate tokens
    const accessToken = AuthService.generateAccessToken(safeUser);
    const refreshToken = AuthService.generateRefreshToken(user.id);

    // Prepare response data
    const responseData = {
      user: safeUser,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
        tokenType: 'Bearer'
      },
      session: {
        id: AuthService.generateSessionId(),
        expiresAt: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000).toISOString(),
        rememberMe
      }
    };

    return ApiResponseBuilder.success(responseData);
  } catch (error) {
    logger.error('Login error', error as Error);
    
    if (error instanceof Error) {
      return ApiResponseBuilder.unauthorized(error.message);
    }
    
    return ApiResponseBuilder.internalServerError('Login failed');
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
