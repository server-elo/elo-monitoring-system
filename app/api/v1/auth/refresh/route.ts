import { NextRequest } from 'next/server';
import { authEndpoint } from '@/lib/api/middleware';
import { ApiResponseBuilder, UnauthorizedException } from '@/lib/api/response';
import { validateBody, RefreshTokenSchema } from '@/lib/api/validation';
import { AuthService } from '@/lib/api/auth';
import { ApiUser, UserRole, UserStatus } from '@/lib/api/types';
import { logger } from '@/lib/monitoring/simple-logger';

// Mock user database - same as login
const mockUsers: Array<ApiUser & { passwordHash: string; tokenVersion: number }> = [
  {
    id: 'user_1',
    email: 'student@example.com',
    name: 'John Student',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G',
    tokenVersion: 0,
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
  }
];

async function findUserById(userId: string): Promise<(ApiUser & { tokenVersion: number }) | null> {
  const user = mockUsers.find(u => u.id === userId);
  return user ? { ...user } : null;
}

// async function incrementTokenVersion(userId: string): Promise<number> {
//   const user = mockUsers.find(u => u.id === userId);
//   if (user) {
//     user.tokenVersion = (user.tokenVersion || 0) + 1;
//     return user.tokenVersion;
//   }
//   return 0;
// }

export const POST = authEndpoint(async (request: NextRequest) => {
  try {
    // Validate request body
    const body = await validateBody(RefreshTokenSchema, request);
    const { refreshToken } = body;

    // Verify refresh token
    const payload = AuthService.verifyRefreshToken(refreshToken);

    // Find user
    const user = await findUserById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Check token version (for token revocation)
    if (payload.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Remove sensitive data
    const { passwordHash, tokenVersion, ...safeUser } = user;

    // Generate new tokens
    const newAccessToken = AuthService.generateAccessToken(safeUser);
    const newRefreshToken = AuthService.generateRefreshToken(user.id, user.tokenVersion);

    // Prepare response data
    const responseData = {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
        tokenType: 'Bearer'
      },
      user: safeUser
    };

    return ApiResponseBuilder.success(responseData);
  } catch (error) {
    logger.error('Token refresh error', error as Error);
    
    if (error instanceof UnauthorizedException) {
      return ApiResponseBuilder.unauthorized(error.message);
    }
    
    if (error instanceof Error) {
      return ApiResponseBuilder.unauthorized(error.message);
    }
    
    return ApiResponseBuilder.internalServerError('Token refresh failed');
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
