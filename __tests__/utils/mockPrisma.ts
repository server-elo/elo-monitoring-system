/**
 * Mock Prisma Client for Testing
 * Provides comprehensive mocking for all database operations
 */

import { vi } from 'vitest';

export const mockPrisma = {
  // User model mocks
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn()
  },

  // Course model mocks
  course: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn()
  },

  // Lesson model mocks
  lesson: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn()
  },

  // Progress tracking mocks
  userCourseProgress: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn()
  },

  userLessonProgress: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn()
  },

  // Achievement mocks
  userAchievement: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn()
  },

  // Exercise mocks
  exercise: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn()
  },

  // Session mocks
  session: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn()
  },

  // Account mocks (for OAuth)
  account: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn()
  },

  // Transaction mock
  $transaction: vi.fn(),

  // Connection management
  $connect: vi.fn(),
  $disconnect: vi.fn(),

  // Raw queries
  $executeRaw: vi.fn(),
  $executeRawUnsafe: vi.fn(),
  $queryRaw: vi.fn(),
  $queryRawUnsafe: vi.fn(),

  // Extensions and middleware
  $use: vi.fn(),
  $on: vi.fn(),
  $extends: vi.fn()
};

// Helper function to reset all mocks
export const resetMockPrisma = () => {
  Object.values(mockPrisma).forEach(model => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach(method => {
        if (typeof method === 'function' && method.mockReset) {
          method.mockReset();
        }
      });
    } else if (typeof model === 'function' && model.mockReset) {
      model.mockReset();
    }
  });
};

// Helper function to create common mock data
export const createMockUser = (overrides = {}) => ({
  id: 'mock-user-id',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashedpassword',
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  experience: 1000,
  level: 5,
  streak: 7,
  totalPoints: 2500,
  ...overrides
});

export const createMockCourse = (overrides = {}) => ({
  id: 'mock-course-id',
  title: 'Test Course',
  description: 'Test course description',
  difficulty: 'BEGINNER',
  category: 'SMART_CONTRACTS',
  published: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  authorId: 'mock-author-id',
  ...overrides
});

export const createMockLesson = (overrides = {}) => ({
  id: 'mock-lesson-id',
  title: 'Test Lesson',
  content: 'Test lesson content',
  order: 1,
  courseId: 'mock-course-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockProgress = (overrides = {}) => ({
  id: 'mock-progress-id',
  userId: 'mock-user-id',
  courseId: 'mock-course-id',
  progressPercentage: 50,
  completedLessons: 5,
  totalLessons: 10,
  lastAccessedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});