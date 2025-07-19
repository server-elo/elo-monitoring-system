import { NextRequest } from 'next/server';
import { protectedEndpoint, adminEndpoint } from '@/lib/api/middleware';
import { ApiResponseBuilder, NotFoundException, ForbiddenException } from '@/lib/api/response';
import { validateBody, UpdateUserSchema, IdSchema } from '@/lib/api/validation';
import { ApiUser, UserRole, UserStatus } from '@/lib/api/types';
import { MiddlewareContext } from '@/lib/api/middleware';
import { sanitizeForResponse } from '@/lib/api/response';
import { logger } from '@/lib/monitoring/simple-logger';

// Mock users database (same as users/route.ts)
const mockUsers: Array<ApiUser & { passwordHash: string }> = [
  {
    id: 'user_1',
    email: 'student@example.com',
    name: 'John Student',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G',
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
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G',
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
  }
];

function findUserById(id: string): (ApiUser & { passwordHash: string }) | null {
  return mockUsers.find(user => user.id === id) || null;
}

function canAccessUser(requestingUserId: string, targetUserId: string, userRole: UserRole): boolean {
  // Users can access their own data
  if (requestingUserId === targetUserId) {
    return true;
  }

  // Admins can access any user data
  if (userRole === UserRole.ADMIN) {
    return true;
  }

  // Instructors can access student data (for their courses)
  if (userRole === UserRole.INSTRUCTOR) {
    const targetUser = findUserById(targetUserId);
    return targetUser?.role === UserRole.STUDENT;
  }

  return false;
}

// GET /api/v1/users/[id] - Get user by ID
export const GET = protectedEndpoint(async (request: NextRequest, context: MiddlewareContext) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      return ApiResponseBuilder.validationError('User ID is required', []);
    }

    // Validate user ID format
    try {
      IdSchema.parse(userId);
    } catch {
      return ApiResponseBuilder.validationError('Invalid user ID format', []);
    }

    // Check if user can access this data
    if (!canAccessUser(context.user!.id, userId, context.user!.role as UserRole)) {
      throw new ForbiddenException('You do not have permission to access this user');
    }

    // Find user
    const user = findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive data
    const safeUser = sanitizeForResponse(user, ['passwordHash']);

    // Filter data based on permissions
    if (context.user!.id !== userId && context.user!.role === UserRole.STUDENT) {
      // Students can only see limited public profile data of other users
      const publicProfile = {
        id: safeUser.id,
        name: safeUser.name,
        role: safeUser.role,
        profile: {
          xpTotal: safeUser.profile?.xpTotal || 0,
          level: safeUser.profile?.level || 1,
          lessonsCompleted: safeUser.profile?.lessonsCompleted || 0,
          coursesCompleted: safeUser.profile?.coursesCompleted || 0,
          achievementsCount: safeUser.profile?.achievementsCount || 0,
          bio: safeUser.profile?.bio || null
        },
        createdAt: safeUser.createdAt
      };
      return ApiResponseBuilder.success(publicProfile);
    }

    return ApiResponseBuilder.success(safeUser);
  } catch (error) {
    logger.error('Get user error', error as Error);
    
    if (error instanceof NotFoundException) {
      return ApiResponseBuilder.notFound(error.message);
    }
    
    if (error instanceof ForbiddenException) {
      return ApiResponseBuilder.forbidden(error.message);
    }
    
    return ApiResponseBuilder.internalServerError('Failed to fetch user');
  }
});

// PUT /api/v1/users/[id] - Update user
export const PUT = protectedEndpoint(async (request: NextRequest, context: MiddlewareContext) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      return ApiResponseBuilder.validationError('User ID is required', []);
    }

    // Validate user ID format
    try {
      IdSchema.parse(userId);
    } catch {
      return ApiResponseBuilder.validationError('Invalid user ID format', []);
    }

    // Check if user can update this data
    const canUpdate = context.user!.id === userId || 
                     context.user!.role === UserRole.ADMIN;

    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update this user');
    }

    // Find user
    const user = findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate request body
    const body = await validateBody(UpdateUserSchema, request);

    // Check if non-admin is trying to change role
    if (body.role && context.user!.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can change user roles');
    }

    // Check if non-admin is trying to change status
    if (body.status && context.user!.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can change user status');
    }

    // Update user
    if (body.name) user.name = body.name;
    if (body.email) user.email = body.email.toLowerCase();
    if (body.role) user.role = body.role;
    if (body.status) user.status = body.status;
    user.updatedAt = new Date().toISOString();

    // Remove sensitive data
    const safeUser = sanitizeForResponse(user, ['passwordHash']);

    return ApiResponseBuilder.success(safeUser);
  } catch (error) {
    logger.error('Update user error', error as Error);
    
    if (error instanceof NotFoundException) {
      return ApiResponseBuilder.notFound(error.message);
    }
    
    if (error instanceof ForbiddenException) {
      return ApiResponseBuilder.forbidden(error.message);
    }
    
    if (error instanceof Error) {
      return ApiResponseBuilder.validationError(error.message, []);
    }
    
    return ApiResponseBuilder.internalServerError('Failed to update user');
  }
});

// DELETE /api/v1/users/[id] - Delete user (admin only)
export const DELETE = adminEndpoint(async (request: NextRequest, context: MiddlewareContext) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      return ApiResponseBuilder.validationError('User ID is required', []);
    }

    // Validate user ID format
    try {
      IdSchema.parse(userId);
    } catch {
      return ApiResponseBuilder.validationError('Invalid user ID format', []);
    }

    // Find user
    const userIndex = mockUsers.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      throw new NotFoundException('User not found');
    }

    // Prevent self-deletion
    if (userId === context.user!.id) {
      return ApiResponseBuilder.forbidden('You cannot delete your own account');
    }

    // Remove user (in production, this might be a soft delete)
    mockUsers.splice(userIndex, 1);

    return ApiResponseBuilder.noContent();
  } catch (error) {
    logger.error('Delete user error', error as Error);
    
    if (error instanceof NotFoundException) {
      return ApiResponseBuilder.notFound(error.message);
    }
    
    return ApiResponseBuilder.internalServerError('Failed to delete user');
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
