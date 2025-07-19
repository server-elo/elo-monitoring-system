import { NextRequest } from 'next/server';
import { adminEndpoint } from '@/lib/api/middleware';
import { ApiResponseBuilder } from '@/lib/api/response';
import { validateQuery, validateBody, PaginationSchema, SearchSchema, CreateUserSchema } from '@/lib/api/validation';
import { AuthService } from '@/lib/api/auth';
import { ApiUser, UserRole, UserStatus } from '@/lib/api/types';
import { MiddlewareContext } from '@/lib/api/middleware';
import { createPaginationMeta, sanitizeForResponse } from '@/lib/api/response';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/monitoring/simple-logger';

// Mock users database
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

// Generate more mock users for pagination testing
for (let i = 3; i <= 50; i++) {
  mockUsers.push({
    id: `user_${i}`,
    email: `user${i}@example.com`,
    name: `User ${i}`,
    role: i % 5 === 0 ? UserRole.INSTRUCTOR : UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G',
    profile: {
      xpTotal: Math.floor(Math.random() * 5000),
      level: Math.floor(Math.random() * 20) + 1,
      lessonsCompleted: Math.floor(Math.random() * 50),
      coursesCompleted: Math.floor(Math.random() * 10),
      achievementsCount: Math.floor(Math.random() * 30),
      currentStreak: Math.floor(Math.random() * 30),
      longestStreak: Math.floor(Math.random() * 60)
    },
    preferences: {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      achievementNotifications: true
    },
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  });
}

function filterUsers(users: ApiUser[], filters: any): ApiUser[] {
  let filtered = [...users];

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }

  if (filters.status) {
    filtered = filtered.filter(user => user.status === filters.status);
  }

  if (filters.category) {
    // Category could be role in this context
    filtered = filtered.filter(user => user.role === filters.category);
  }

  return filtered;
}

function sortUsers(users: ApiUser[], sortBy: string, sortOrder: 'asc' | 'desc'): ApiUser[] {
  return users.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'email':
        aValue = a.email;
        bValue = b.email;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'xp':
        aValue = a.profile.xpTotal;
        bValue = b.profile.xpTotal;
        break;
      default:
        aValue = a.createdAt;
        bValue = b.createdAt;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

// GET /api/v1/users - List users (admin only)
export const GET = adminEndpoint(async (request: NextRequest, _context: MiddlewareContext) => {
  try {
    const url = new URL(request.url);
    const pagination = validateQuery(PaginationSchema, url.searchParams);
    const filters = validateQuery(SearchSchema, url.searchParams);

    // Remove sensitive data and filter users
    const safeUsers = mockUsers.map(user => sanitizeForResponse(user, ['passwordHash'])) as ApiUser[];
    const filteredUsers = filterUsers(safeUsers, filters);
    const sortedUsers = sortUsers(filteredUsers, pagination.sortBy || 'createdAt', pagination.sortOrder || 'asc');

    // Apply pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

    // Create pagination metadata
    const paginationMeta = createPaginationMeta(
      page,
      limit,
      filteredUsers.length
    );

    return ApiResponseBuilder.paginated(paginatedUsers, paginationMeta);
  } catch (error) {
    logger.error('Get users error', error as Error);
    return ApiResponseBuilder.internalServerError('Failed to fetch users');
  }
});

// POST /api/v1/users - Create user (admin only)
export const POST = adminEndpoint(async (request: NextRequest, _context: MiddlewareContext) => {
  try {
    const body = await validateBody(CreateUserSchema, request);
    const { email, password, name, role } = body;

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return ApiResponseBuilder.conflict('User with this email already exists');
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(password);

    // Create new user
    const now = new Date().toISOString();
    const newUser: ApiUser & { passwordHash: string } = {
      id: uuidv4(),
      email: email.toLowerCase(),
      name,
      role: role || UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash,
      profile: {
        xpTotal: 0,
        level: 1,
        lessonsCompleted: 0,
        coursesCompleted: 0,
        achievementsCount: 0,
        currentStreak: 0,
        longestStreak: 0
      },
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        weeklyDigest: true,
        achievementNotifications: true
      },
      createdAt: now,
      updatedAt: now
    };

    mockUsers.push(newUser);

    // Return user without sensitive data
    const safeUser = sanitizeForResponse(newUser, ['passwordHash']);

    return ApiResponseBuilder.created(safeUser);
  } catch (error) {
    logger.error('Create user error', error as Error);
    
    if (error instanceof Error) {
      return ApiResponseBuilder.validationError(error.message, []);
    }
    
    return ApiResponseBuilder.internalServerError('Failed to create user');
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
