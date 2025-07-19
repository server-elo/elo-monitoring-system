/**
 * Prisma Client Mock
 * Provides comprehensive mocking for database operations
 */

import { vi } from 'vitest';

// Mock data types
export interface MockUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  emailVerified?: Date | null;
  image?: string | null;
  profile?: MockUserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockUserProfile {
  id: string;
  userId: string;
  xpTotal: number;
  level: number;
  lessonsCompleted: number;
  coursesCompleted: number;
  achievementsCount: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockCourse {
  id: string;
  title: string;
  description: string;
  slug: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  category: string;
  estimatedDuration: number;
  xpReward: number;
  instructorId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isPublished: boolean;
  enrollmentCount: number;
  completionCount: number;
  averageRating: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockLesson {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'THEORY' | 'CODING' | 'QUIZ' | 'PROJECT';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDuration: number;
  xpReward: number;
  order: number;
  courseId: string;
  prerequisites: string[];
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockProgress {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: Date | null;
  timeSpent: number;
  score?: number | null;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockAchievement {
  id: string;
  title: string;
  description: string;
  type: 'LESSON' | 'COURSE' | 'STREAK' | 'XP' | 'SPECIAL';
  icon: string;
  condition: any;
  xpReward: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data storage
const mockUsers = new Map<string, MockUser>();
const mockUserProfiles = new Map<string, MockUserProfile>();
const mockCourses = new Map<string, MockCourse>();
const mockLessons = new Map<string, MockLesson>();
const mockProgress = new Map<string, MockProgress>();
const mockAchievements = new Map<string, MockAchievement>();

// Default mock data
const defaultMockUser: MockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  role: 'STUDENT',
  status: 'ACTIVE',
  emailVerified: new Date(),
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultMockProfile: MockUserProfile = {
  id: 'test-profile-id',
  userId: 'test-user-id',
  xpTotal: 1000,
  level: 5,
  lessonsCompleted: 10,
  coursesCompleted: 2,
  achievementsCount: 5,
  currentStreak: 3,
  longestStreak: 10,
  lastActiveAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultMockCourse: MockCourse = {
  id: 'test-course-id',
  title: 'Introduction to Solidity',
  description: 'Learn the basics of Solidity programming',
  slug: 'intro-to-solidity',
  difficulty: 'BEGINNER',
  category: 'Smart Contracts',
  estimatedDuration: 120,
  xpReward: 500,
  instructorId: 'instructor-id',
  status: 'PUBLISHED',
  isPublished: true,
  enrollmentCount: 100,
  completionCount: 75,
  averageRating: 4.5,
  ratingCount: 20,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Initialize mock data
mockUsers.set(defaultMockUser.id, defaultMockUser);
mockUserProfiles.set(defaultMockProfile.id, defaultMockProfile);
mockCourses.set(defaultMockCourse.id, defaultMockCourse);

// Mock Prisma client implementation
export const mockPrismaClient = {
  // User operations
  user: {
    findUnique: vi.fn(async ({ where }) => {
      if (where.id) return mockUsers.get(where.id) || null;
      if (where.email) {
        return Array.from(mockUsers.values()).find(u => u.email === where.email) || null;
      }
      if (where.username) {
        return Array.from(mockUsers.values()).find(u => u.username === where.username) || null;
      }
      return null;
    }),

    findMany: vi.fn(async ({ where, orderBy, take, skip } = {}) => {
      let users = Array.from(mockUsers.values());
      
      if (where) {
        if (where.role) users = users.filter(u => u.role === where.role);
        if (where.status) users = users.filter(u => u.status === where.status);
        if (where.email?.contains) users = users.filter(u => u.email.includes(where.email.contains));
      }

      if (orderBy) {
        users.sort((a, b) => {
          const field = Object.keys(orderBy)[0];
          const direction = orderBy[field];
          const aVal = a[field];
          const bVal = b[field];
          return direction === 'asc' ? 
            (aVal > bVal ? 1 : -1) : 
            (aVal < bVal ? 1 : -1);
        });
      }

      if (skip) users = users.slice(skip);
      if (take) users = users.slice(0, take);

      return users;
    }),

    create: vi.fn(async ({ data }) => {
      const user: MockUser = {
        id: `user-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.set(user.id, user);
      return user;
    }),

    update: vi.fn(async ({ where, data }) => {
      const user = mockUsers.get(where.id);
      if (!user) throw new Error('User not found');
      
      const updatedUser = { ...user, ...data, updatedAt: new Date() };
      mockUsers.set(user.id, updatedUser);
      return updatedUser;
    }),

    delete: vi.fn(async ({ where }) => {
      const user = mockUsers.get(where.id);
      if (!user) throw new Error('User not found');
      
      mockUsers.delete(where.id);
      return user;
    }),

    count: vi.fn(async ({ where } = {}) => {
      let users = Array.from(mockUsers.values());
      if (where) {
        if (where.role) users = users.filter(u => u.role === where.role);
        if (where.status) users = users.filter(u => u.status === where.status);
      }
      return users.length;
    }),
  },

  // UserProfile operations
  userProfile: {
    findUnique: vi.fn(async ({ where }) => {
      if (where.id) return mockUserProfiles.get(where.id) || null;
      if (where.userId) {
        return Array.from(mockUserProfiles.values()).find(p => p.userId === where.userId) || null;
      }
      return null;
    }),

    create: vi.fn(async ({ data }) => {
      const profile: MockUserProfile = {
        id: `profile-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUserProfiles.set(profile.id, profile);
      return profile;
    }),

    update: vi.fn(async ({ where, data }) => {
      const profile = mockUserProfiles.get(where.id) || 
        Array.from(mockUserProfiles.values()).find(p => p.userId === where.userId);
      if (!profile) throw new Error('Profile not found');
      
      const updatedProfile = { ...profile, ...data, updatedAt: new Date() };
      mockUserProfiles.set(profile.id, updatedProfile);
      return updatedProfile;
    }),

    upsert: vi.fn(async ({ where, create, update }) => {
      const existing = Array.from(mockUserProfiles.values()).find(p => p.userId === where.userId);
      if (existing) {
        const updated = { ...existing, ...update, updatedAt: new Date() };
        mockUserProfiles.set(existing.id, updated);
        return updated;
      } else {
        const profile: MockUserProfile = {
          id: `profile-${Date.now()}`,
          ...create,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockUserProfiles.set(profile.id, profile);
        return profile;
      }
    }),
  },

  // Course operations
  course: {
    findUnique: vi.fn(async ({ where, include }) => {
      const course = where.id ? mockCourses.get(where.id) : 
        Array.from(mockCourses.values()).find(c => c.slug === where.slug);
      
      if (!course) return null;

      if (include?.lessons) {
        return {
          ...course,
          lessons: Array.from(mockLessons.values()).filter(l => l.courseId === course.id),
        };
      }

      return course;
    }),

    findMany: vi.fn(async ({ where, include, orderBy, take, skip } = {}) => {
      let courses = Array.from(mockCourses.values());
      
      if (where) {
        if (where.difficulty) courses = courses.filter(c => c.difficulty === where.difficulty);
        if (where.status) courses = courses.filter(c => c.status === where.status);
        if (where.isPublished !== undefined) courses = courses.filter(c => c.isPublished === where.isPublished);
        if (where.category) courses = courses.filter(c => c.category === where.category);
      }

      if (orderBy) {
        courses.sort((a, b) => {
          const field = Object.keys(orderBy)[0];
          const direction = orderBy[field];
          const aVal = a[field];
          const bVal = b[field];
          return direction === 'asc' ? 
            (aVal > bVal ? 1 : -1) : 
            (aVal < bVal ? 1 : -1);
        });
      }

      if (skip) courses = courses.slice(skip);
      if (take) courses = courses.slice(0, take);

      if (include?.lessons) {
        return courses.map(course => ({
          ...course,
          lessons: Array.from(mockLessons.values()).filter(l => l.courseId === course.id),
        }));
      }

      return courses;
    }),

    create: vi.fn(async ({ data }) => {
      const course: MockCourse = {
        id: `course-${Date.now()}`,
        ...data,
        slug: data.title.toLowerCase().replace(/\s+/g, '-'),
        enrollmentCount: 0,
        completionCount: 0,
        averageRating: 0,
        ratingCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCourses.set(course.id, course);
      return course;
    }),

    update: vi.fn(async ({ where, data }) => {
      const course = mockCourses.get(where.id);
      if (!course) throw new Error('Course not found');
      
      const updatedCourse = { ...course, ...data, updatedAt: new Date() };
      mockCourses.set(course.id, updatedCourse);
      return updatedCourse;
    }),

    delete: vi.fn(async ({ where }) => {
      const course = mockCourses.get(where.id);
      if (!course) throw new Error('Course not found');
      
      mockCourses.delete(where.id);
      return course;
    }),

    count: vi.fn(async ({ where } = {}) => {
      let courses = Array.from(mockCourses.values());
      if (where) {
        if (where.difficulty) courses = courses.filter(c => c.difficulty === where.difficulty);
        if (where.isPublished !== undefined) courses = courses.filter(c => c.isPublished === where.isPublished);
      }
      return courses.length;
    }),
  },

  // Progress operations
  progress: {
    findUnique: vi.fn(async ({ where }) => {
      return Array.from(mockProgress.values()).find(p => 
        p.userId === where.userId_lessonId?.userId && 
        p.lessonId === where.userId_lessonId?.lessonId
      ) || null;
    }),

    findMany: vi.fn(async ({ where } = {}) => {
      let progress = Array.from(mockProgress.values());
      
      if (where) {
        if (where.userId) progress = progress.filter(p => p.userId === where.userId);
        if (where.courseId) progress = progress.filter(p => p.courseId === where.courseId);
        if (where.status) progress = progress.filter(p => p.status === where.status);
      }

      return progress;
    }),

    create: vi.fn(async ({ data }) => {
      const progressRecord: MockProgress = {
        id: `progress-${Date.now()}`,
        ...data,
        attempts: 1,
        timeSpent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockProgress.set(progressRecord.id, progressRecord);
      return progressRecord;
    }),

    upsert: vi.fn(async ({ where, create, update }) => {
      const existing = Array.from(mockProgress.values()).find(p => 
        p.userId === where.userId_lessonId?.userId && 
        p.lessonId === where.userId_lessonId?.lessonId
      );

      if (existing) {
        const updated = { ...existing, ...update, updatedAt: new Date() };
        mockProgress.set(existing.id, updated);
        return updated;
      } else {
        const progressRecord: MockProgress = {
          id: `progress-${Date.now()}`,
          ...create,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockProgress.set(progressRecord.id, progressRecord);
        return progressRecord;
      }
    }),
  },

  // Transaction support
  $transaction: vi.fn(async (operations) => {
    if (Array.isArray(operations)) {
      return Promise.all(operations);
    } else {
      return operations(mockPrismaClient);
    }
  }),

  // Connection management
  $connect: vi.fn(async () => {}),
  $disconnect: vi.fn(async () => {}),
};

// Helper functions for tests
export const addMockUser = (user: MockUser) => {
  mockUsers.set(user.id, user);
};

export const addMockCourse = (course: MockCourse) => {
  mockCourses.set(course.id, course);
};

export const addMockLesson = (lesson: MockLesson) => {
  mockLessons.set(lesson.id, lesson);
};

export const clearMockData = () => {
  mockUsers.clear();
  mockUserProfiles.clear();
  mockCourses.clear();
  mockLessons.clear();
  mockProgress.clear();
  mockAchievements.clear();
  
  // Re-add defaults
  mockUsers.set(defaultMockUser.id, defaultMockUser);
  mockUserProfiles.set(defaultMockProfile.id, defaultMockProfile);
  mockCourses.set(defaultMockCourse.id, defaultMockCourse);
};

export const resetPrismaMocks = () => {
  vi.clearAllMocks();
  
  // Reset all mock functions
  Object.values(mockPrismaClient.user).forEach(fn => fn.mockClear());
  Object.values(mockPrismaClient.userProfile).forEach(fn => fn.mockClear());
  Object.values(mockPrismaClient.course).forEach(fn => fn.mockClear());
  Object.values(mockPrismaClient.progress).forEach(fn => fn.mockClear());
  
  mockPrismaClient.$transaction.mockClear();
  mockPrismaClient.$connect.mockClear();
  mockPrismaClient.$disconnect.mockClear();
  
  clearMockData();
};

export default mockPrismaClient;