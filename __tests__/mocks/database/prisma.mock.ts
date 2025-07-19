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
const mockUsers = new Map<string, MockUser>(_);
const mockUserProfiles = new Map<string, MockUserProfile>(_);
const mockCourses = new Map<string, MockCourse>(_);
const mockLessons = new Map<string, MockLesson>(_);
const mockProgress = new Map<string, MockProgress>(_);
const mockAchievements = new Map<string, MockAchievement>(_);

// Default mock data
const defaultMockUser: MockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  role: 'STUDENT',
  status: 'ACTIVE',
  emailVerified: new Date(_),
  image: null,
  createdAt: new Date(_),
  updatedAt: new Date(_),
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
  lastActiveAt: new Date(_),
  createdAt: new Date(_),
  updatedAt: new Date(_),
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
  createdAt: new Date(_),
  updatedAt: new Date(_),
};

// Initialize mock data
mockUsers.set( defaultMockUser.id, defaultMockUser);
mockUserProfiles.set( defaultMockProfile.id, defaultMockProfile);
mockCourses.set( defaultMockCourse.id, defaultMockCourse);

// Mock Prisma client implementation
export const mockPrismaClient = {
  // User operations
  user: {
    findUnique: vi.fn( async ({ where }) => {
      if (_where.id) return mockUsers.get(_where.id) || null;
      if (_where.email) {
        return Array.from(_mockUsers.values()).find(u => u.email === where.email) || null;
      }
      if (_where.username) {
        return Array.from(_mockUsers.values()).find(u => u.username === where.username) || null;
      }
      return null;
    }),

    findMany: vi.fn( async ({ where, orderBy, take, skip } = {}) => {
      let users = Array.from(_mockUsers.values());
      
      if (where) {
        if (_where.role) users = users.filter(u => u.role === where.role);
        if (_where.status) users = users.filter(u => u.status === where.status);
        if (_where.email?.contains) users = users.filter(u => u.email.includes(where.email.contains));
      }

      if (orderBy) {
        users.sort( (a, b) => {
          const field = Object.keys(_orderBy)[0];
          const direction = orderBy[field];
          const aVal = a[field];
          const bVal = b[field];
          return direction === 'asc' ? 
            (_aVal > bVal ? 1 : -1) : 
            (_aVal < bVal ? 1 : -1);
        });
      }

      if (skip) users = users.slice(_skip);
      if (take) users = users.slice(0, take);

      return users;
    }),

    create: vi.fn( async ({ data }) => {
      const user: MockUser = {
        id: `user-${Date.now(_)}`,
        ...data,
        createdAt: new Date(_),
        updatedAt: new Date(_),
      };
      mockUsers.set( user.id, user);
      return user;
    }),

    update: vi.fn( async ({ where, data }) => {
      const user = mockUsers.get(_where.id);
      if (!user) throw new Error('User not found');
      
      const updatedUser = { ...user, ...data, updatedAt: new Date(_) };
      mockUsers.set( user.id, updatedUser);
      return updatedUser;
    }),

    delete: vi.fn( async ({ where }) => {
      const user = mockUsers.get(_where.id);
      if (!user) throw new Error('User not found');
      
      mockUsers.delete(_where.id);
      return user;
    }),

    count: vi.fn( async ({ where } = {}) => {
      let users = Array.from(_mockUsers.values());
      if (where) {
        if (_where.role) users = users.filter(u => u.role === where.role);
        if (_where.status) users = users.filter(u => u.status === where.status);
      }
      return users.length;
    }),
  },

  // UserProfile operations
  userProfile: {
    findUnique: vi.fn( async ({ where }) => {
      if (_where.id) return mockUserProfiles.get(_where.id) || null;
      if (_where.userId) {
        return Array.from(_mockUserProfiles.values()).find(p => p.userId === where.userId) || null;
      }
      return null;
    }),

    create: vi.fn( async ({ data }) => {
      const profile: MockUserProfile = {
        id: `profile-${Date.now(_)}`,
        ...data,
        createdAt: new Date(_),
        updatedAt: new Date(_),
      };
      mockUserProfiles.set( profile.id, profile);
      return profile;
    }),

    update: vi.fn( async ({ where, data }) => {
      const profile = mockUserProfiles.get(_where.id) || 
        Array.from(_mockUserProfiles.values()).find(p => p.userId === where.userId);
      if (!profile) throw new Error('Profile not found');
      
      const updatedProfile = { ...profile, ...data, updatedAt: new Date(_) };
      mockUserProfiles.set( profile.id, updatedProfile);
      return updatedProfile;
    }),

    upsert: vi.fn( async ({ where, create, update }) => {
      const existing = Array.from(_mockUserProfiles.values()).find(p => p.userId === where.userId);
      if (existing) {
        const updated = { ...existing, ...update, updatedAt: new Date(_) };
        mockUserProfiles.set( existing.id, updated);
        return updated;
      } else {
        const profile: MockUserProfile = {
          id: `profile-${Date.now(_)}`,
          ...create,
          createdAt: new Date(_),
          updatedAt: new Date(_),
        };
        mockUserProfiles.set( profile.id, profile);
        return profile;
      }
    }),
  },

  // Course operations
  course: {
    findUnique: vi.fn( async ({ where, include }) => {
      const course = where.id ? mockCourses.get(_where.id) : 
        Array.from(_mockCourses.values()).find(c => c.slug === where.slug);
      
      if (!course) return null;

      if (_include?.lessons) {
        return {
          ...course,
          lessons: Array.from(_mockLessons.values()).filter(l => l.courseId === course.id),
        };
      }

      return course;
    }),

    findMany: vi.fn( async ({ where, include, orderBy, take, skip } = {}) => {
      let courses = Array.from(_mockCourses.values());
      
      if (where) {
        if (_where.difficulty) courses = courses.filter(c => c.difficulty === where.difficulty);
        if (_where.status) courses = courses.filter(c => c.status === where.status);
        if (_where.isPublished !== undefined) courses = courses.filter(c => c.isPublished === where.isPublished);
        if (_where.category) courses = courses.filter(c => c.category === where.category);
      }

      if (orderBy) {
        courses.sort( (a, b) => {
          const field = Object.keys(_orderBy)[0];
          const direction = orderBy[field];
          const aVal = a[field];
          const bVal = b[field];
          return direction === 'asc' ? 
            (_aVal > bVal ? 1 : -1) : 
            (_aVal < bVal ? 1 : -1);
        });
      }

      if (skip) courses = courses.slice(_skip);
      if (take) courses = courses.slice(0, take);

      if (_include?.lessons) {
        return courses.map(course => ({
          ...course,
          lessons: Array.from(_mockLessons.values()).filter(l => l.courseId === course.id),
        }));
      }

      return courses;
    }),

    create: vi.fn( async ({ data }) => {
      const course: MockCourse = {
        id: `course-${Date.now(_)}`,
        ...data,
        slug: data.title.toLowerCase().replace(/\s+/g, '-'),
        enrollmentCount: 0,
        completionCount: 0,
        averageRating: 0,
        ratingCount: 0,
        createdAt: new Date(_),
        updatedAt: new Date(_),
      };
      mockCourses.set( course.id, course);
      return course;
    }),

    update: vi.fn( async ({ where, data }) => {
      const course = mockCourses.get(_where.id);
      if (!course) throw new Error('Course not found');
      
      const updatedCourse = { ...course, ...data, updatedAt: new Date(_) };
      mockCourses.set( course.id, updatedCourse);
      return updatedCourse;
    }),

    delete: vi.fn( async ({ where }) => {
      const course = mockCourses.get(_where.id);
      if (!course) throw new Error('Course not found');
      
      mockCourses.delete(_where.id);
      return course;
    }),

    count: vi.fn( async ({ where } = {}) => {
      let courses = Array.from(_mockCourses.values());
      if (where) {
        if (_where.difficulty) courses = courses.filter(c => c.difficulty === where.difficulty);
        if (_where.isPublished !== undefined) courses = courses.filter(c => c.isPublished === where.isPublished);
      }
      return courses.length;
    }),
  },

  // Progress operations
  progress: {
    findUnique: vi.fn( async ({ where }) => {
      return Array.from(_mockProgress.values()).find(p => 
        p.userId === where.userId_lessonId?.userId && 
        p.lessonId === where.userId_lessonId?.lessonId
      ) || null;
    }),

    findMany: vi.fn( async ({ where } = {}) => {
      let progress = Array.from(_mockProgress.values());
      
      if (where) {
        if (_where.userId) progress = progress.filter(p => p.userId === where.userId);
        if (_where.courseId) progress = progress.filter(p => p.courseId === where.courseId);
        if (_where.status) progress = progress.filter(p => p.status === where.status);
      }

      return progress;
    }),

    create: vi.fn( async ({ data }) => {
      const progressRecord: MockProgress = {
        id: `progress-${Date.now(_)}`,
        ...data,
        attempts: 1,
        timeSpent: 0,
        createdAt: new Date(_),
        updatedAt: new Date(_),
      };
      mockProgress.set( progressRecord.id, progressRecord);
      return progressRecord;
    }),

    upsert: vi.fn( async ({ where, create, update }) => {
      const existing = Array.from(_mockProgress.values()).find(p => 
        p.userId === where.userId_lessonId?.userId && 
        p.lessonId === where.userId_lessonId?.lessonId
      );

      if (existing) {
        const updated = { ...existing, ...update, updatedAt: new Date(_) };
        mockProgress.set( existing.id, updated);
        return updated;
      } else {
        const progressRecord: MockProgress = {
          id: `progress-${Date.now(_)}`,
          ...create,
          createdAt: new Date(_),
          updatedAt: new Date(_),
        };
        mockProgress.set( progressRecord.id, progressRecord);
        return progressRecord;
      }
    }),
  },

  // Transaction support
  $transaction: vi.fn( async (operations) => {
    if (_Array.isArray(operations)) {
      return Promise.all(_operations);
    } else {
      return operations(_mockPrismaClient);
    }
  }),

  // Connection management
  $connect: vi.fn( async () => {}),
  $disconnect: vi.fn( async () => {}),
};

// Helper functions for tests
export const addMockUser = (_user: MockUser) => {
  mockUsers.set( user.id, user);
};

export const addMockCourse = (_course: MockCourse) => {
  mockCourses.set( course.id, course);
};

export const addMockLesson = (_lesson: MockLesson) => {
  mockLessons.set( lesson.id, lesson);
};

export const clearMockData = (_) => {
  mockUsers.clear(_);
  mockUserProfiles.clear(_);
  mockCourses.clear(_);
  mockLessons.clear(_);
  mockProgress.clear(_);
  mockAchievements.clear(_);
  
  // Re-add defaults
  mockUsers.set( defaultMockUser.id, defaultMockUser);
  mockUserProfiles.set( defaultMockProfile.id, defaultMockProfile);
  mockCourses.set( defaultMockCourse.id, defaultMockCourse);
};

export const resetPrismaMocks = (_) => {
  vi.clearAllMocks(_);
  
  // Reset all mock functions
  Object.values(_mockPrismaClient.user).forEach(_fn => fn.mockClear());
  Object.values(_mockPrismaClient.userProfile).forEach(_fn => fn.mockClear());
  Object.values(_mockPrismaClient.course).forEach(_fn => fn.mockClear());
  Object.values(_mockPrismaClient.progress).forEach(_fn => fn.mockClear());
  
  mockPrismaClient.$transaction.mockClear(_);
  mockPrismaClient.$connect.mockClear(_);
  mockPrismaClient.$disconnect.mockClear(_);
  
  clearMockData(_);
};

export default mockPrismaClient;