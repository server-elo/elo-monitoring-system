/**
 * Mock Prisma Client for Testing
 * Provides comprehensive mocking for all database operations
 */

import { vi } from 'vitest';

export const mockPrisma = {
  // User model mocks
  user: {
    create: vi.fn(_),
    findUnique: vi.fn(_),
    findFirst: vi.fn(_),
    findMany: vi.fn(_),
    update: vi.fn(_),
    updateMany: vi.fn(_),
    upsert: vi.fn(_),
    delete: vi.fn(_),
    deleteMany: vi.fn(_),
    createMany: vi.fn(_),
    count: vi.fn(_),
    aggregate: vi.fn(_),
    groupBy: vi.fn(_)
  },

  // Course model mocks
  course: {
    create: vi.fn(_),
    findUnique: vi.fn(_),
    findFirst: vi.fn(_),
    findMany: vi.fn(_),
    update: vi.fn(_),
    updateMany: vi.fn(_),
    upsert: vi.fn(_),
    delete: vi.fn(_),
    deleteMany: vi.fn(_),
    createMany: vi.fn(_),
    count: vi.fn(_),
    aggregate: vi.fn(_),
    groupBy: vi.fn(_)
  },

  // Lesson model mocks
  lesson: {
    create: vi.fn(_),
    findUnique: vi.fn(_),
    findFirst: vi.fn(_),
    findMany: vi.fn(_),
    update: vi.fn(_),
    updateMany: vi.fn(_),
    upsert: vi.fn(_),
    delete: vi.fn(_),
    deleteMany: vi.fn(_),
    createMany: vi.fn(_),
    count: vi.fn(_),
    aggregate: vi.fn(_),
    groupBy: vi.fn(_)
  },

  // Progress tracking mocks
  userCourseProgress: {
    create: vi.fn(_),
    findUnique: vi.fn(_),
    findFirst: vi.fn(_),
    findMany: vi.fn(_),
    update: vi.fn(_),
    updateMany: vi.fn(_),
    upsert: vi.fn(_),
    delete: vi.fn(_),
    deleteMany: vi.fn(_),
    createMany: vi.fn(_),
    count: vi.fn(_),
    aggregate: vi.fn(_),
    groupBy: vi.fn(_)
  },

  userLessonProgress: {
    create: vi.fn(_),
    findUnique: vi.fn(_),
    findFirst: vi.fn(_),
    findMany: vi.fn(_),
    update: vi.fn(_),
    updateMany: vi.fn(_),
    upsert: vi.fn(_),
    delete: vi.fn(_),
    deleteMany: vi.fn(_),
    createMany: vi.fn(_),
    count: vi.fn(_),
    aggregate: vi.fn(_),
    groupBy: vi.fn(_)
  },

  // Achievement mocks
  userAchievement: {
    create: vi.fn(_),
    findUnique: vi.fn(_),
    findFirst: vi.fn(_),
    findMany: vi.fn(_),
    update: vi.fn(_),
    updateMany: vi.fn(_),
    upsert: vi.fn(_),
    delete: vi.fn(_),
    deleteMany: vi.fn(_),
    createMany: vi.fn(_),
    count: vi.fn(_),
    aggregate: vi.fn(_),
    groupBy: vi.fn(_)
  },

  // Exercise mocks
  exercise: {
    create: vi.fn(_),
    findUnique: vi.fn(_),
    findFirst: vi.fn(_),
    findMany: vi.fn(_),
    update: vi.fn(_),
    updateMany: vi.fn(_),
    upsert: vi.fn(_),
    delete: vi.fn(_),
    deleteMany: vi.fn(_),
    createMany: vi.fn(_),
    count: vi.fn(_),
    aggregate: vi.fn(_),
    groupBy: vi.fn(_)
  },

  // Session mocks
  session: {
    create: vi.fn(_),
    findUnique: vi.fn(_),
    findFirst: vi.fn(_),
    findMany: vi.fn(_),
    update: vi.fn(_),
    updateMany: vi.fn(_),
    upsert: vi.fn(_),
    delete: vi.fn(_),
    deleteMany: vi.fn(_),
    createMany: vi.fn(_),
    count: vi.fn(_),
    aggregate: vi.fn(_),
    groupBy: vi.fn(_)
  },

  // Account mocks (_for OAuth)
  account: {
    create: vi.fn(_),
    findUnique: vi.fn(_),
    findFirst: vi.fn(_),
    findMany: vi.fn(_),
    update: vi.fn(_),
    updateMany: vi.fn(_),
    upsert: vi.fn(_),
    delete: vi.fn(_),
    deleteMany: vi.fn(_),
    createMany: vi.fn(_),
    count: vi.fn(_),
    aggregate: vi.fn(_),
    groupBy: vi.fn(_)
  },

  // Transaction mock
  $transaction: vi.fn(_),

  // Connection management
  $connect: vi.fn(_),
  $disconnect: vi.fn(_),

  // Raw queries
  $executeRaw: vi.fn(_),
  $executeRawUnsafe: vi.fn(_),
  $queryRaw: vi.fn(_),
  $queryRawUnsafe: vi.fn(_),

  // Extensions and middleware
  $use: vi.fn(_),
  $on: vi.fn(_),
  $extends: vi.fn(_)
};

// Helper function to reset all mocks
export const resetMockPrisma = (_) => {
  Object.values(_mockPrisma).forEach(model => {
    if (_typeof model === 'object' && model !== null) {
      Object.values(_model).forEach(method => {
        if (_typeof method === 'function' && method.mockReset) {
          method.mockReset(_);
        }
      });
    } else if (_typeof model === 'function' && model.mockReset) {
      model.mockReset(_);
    }
  });
};

// Helper function to create common mock data
export const createMockUser = (_overrides = {}) => ({
  id: 'mock-user-id',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashedpassword',
  emailVerified: new Date(_),
  createdAt: new Date(_),
  updatedAt: new Date(_),
  experience: 1000,
  level: 5,
  streak: 7,
  totalPoints: 2500,
  ...overrides
});

export const createMockCourse = (_overrides = {}) => ({
  id: 'mock-course-id',
  title: 'Test Course',
  description: 'Test course description',
  difficulty: 'BEGINNER',
  category: 'SMART_CONTRACTS',
  published: true,
  createdAt: new Date(_),
  updatedAt: new Date(_),
  authorId: 'mock-author-id',
  ...overrides
});

export const createMockLesson = (_overrides = {}) => ({
  id: 'mock-lesson-id',
  title: 'Test Lesson',
  content: 'Test lesson content',
  order: 1,
  courseId: 'mock-course-id',
  createdAt: new Date(_),
  updatedAt: new Date(_),
  ...overrides
});

export const createMockProgress = (_overrides = {}) => ({
  id: 'mock-progress-id',
  userId: 'mock-user-id',
  courseId: 'mock-course-id',
  progressPercentage: 50,
  completedLessons: 5,
  totalLessons: 10,
  lastAccessedAt: new Date(_),
  createdAt: new Date(_),
  updatedAt: new Date(_),
  ...overrides
});