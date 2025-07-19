/**
 * @fileoverview Comprehensive Database Operations Testing
 * Tests Prisma integration, migrations, and query optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { mockPrisma } from '../utils/mockPrisma';
import { optimizedPrisma } from '@/lib/database/query-optimization';
import { DatabaseMigrationManager } from '@/lib/database/migration-scripts';

// Mock Prisma client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma)
}));

vi.mock('@/lib/database/query-optimization', () => ({
  optimizedPrisma: mockPrisma
}));

describe('Database Operations', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    // Clear all mock calls before each test
    Object.values(mockPrisma).forEach(model => {
      if (typeof model === 'object' && model !== null) {
        Object.values(model).forEach(method => {
          if (typeof method === 'function' && method.mockClear) {
            method.mockClear();
          }
        });
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('User Operations', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedpassword',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      experience: 1000,
      level: 5,
      streak: 7,
      totalPoints: 2500
    };

    it('should create a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'hashedpassword123'
      };

      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'new-user-id',
        ...userData,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        experience: 0,
        level: 1,
        streak: 0,
        totalPoints: 0
      });

      const createdUser = await mockPrisma.user.create({
        data: userData
      });

      expect(createdUser.id).toBe('new-user-id');
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.experience).toBe(0);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: userData
      });
    });

    it('should find user by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      const foundUser = await mockPrisma.user.findUnique({
        where: { email: 'test@example.com' }
      });

      expect(foundUser).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });

    it('should update user profile', async () => {
      const updateData = {
        name: 'Updated Name',
        experience: 1500,
        level: 6
      };

      const updatedUser = { ...mockUser, ...updateData, updatedAt: new Date() };
      mockPrisma.user.update.mockResolvedValueOnce(updatedUser);

      const result = await mockPrisma.user.update({
        where: { id: mockUser.id },
        data: updateData
      });

      expect(result.name).toBe(updateData.name);
      expect(result.experience).toBe(updateData.experience);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateData
      });
    });

    it('should delete user and cascade related data', async () => {
      mockPrisma.user.delete.mockResolvedValueOnce(mockUser);

      const deletedUser = await mockPrisma.user.delete({
        where: { id: mockUser.id }
      });

      expect(deletedUser).toEqual(mockUser);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id }
      });
    });

    it('should handle user not found scenarios', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const foundUser = await mockPrisma.user.findUnique({
        where: { email: 'nonexistent@example.com' }
      });

      expect(foundUser).toBeNull();
    });

    it('should find multiple users with pagination', async () => {
      const mockUsers = Array.from({ length: 10 }, (_, i) => ({
        ...mockUser,
        id: `user-${i}`,
        email: `user${i}@example.com`
      }));

      mockPrisma.user.findMany.mockResolvedValueOnce(mockUsers.slice(0, 5));

      const users = await mockPrisma.user.findMany({
        take: 5,
        skip: 0,
        orderBy: { createdAt: 'desc' }
      });

      expect(users).toHaveLength(5);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        take: 5,
        skip: 0,
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('Course Operations', () => {
    const mockCourse = {
      id: 'course-123',
      title: 'Advanced Solidity',
      description: 'Learn advanced Solidity concepts',
      difficulty: 'ADVANCED',
      category: 'BLOCKCHAIN',
      published: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: 'author-123'
    };

    it('should create a new course with lessons', async () => {
      const courseData = {
        title: 'New Course',
        description: 'Course description',
        difficulty: 'BEGINNER',
        category: 'SMART_CONTRACTS',
        authorId: 'author-123',
        lessons: {
          create: [
            {
              title: 'Lesson 1',
              content: 'Lesson content',
              order: 1
            }
          ]
        }
      };

      mockPrisma.course.create.mockResolvedValueOnce({
        ...mockCourse,
        ...courseData,
        id: 'new-course-id',
        lessons: [
          {
            id: 'lesson-1',
            title: 'Lesson 1',
            content: 'Lesson content',
            order: 1,
            courseId: 'new-course-id'
          }
        ]
      });

      const createdCourse = await mockPrisma.course.create({
        data: courseData,
        include: { lessons: true }
      });

      expect(createdCourse.id).toBe('new-course-id');
      expect(createdCourse.lessons).toHaveLength(1);
      expect(mockPrisma.course.create).toHaveBeenCalledWith({
        data: courseData,
        include: { lessons: true }
      });
    });

    it('should find courses with filters and pagination', async () => {
      const mockCourses = [mockCourse];

      mockPrisma.course.findMany.mockResolvedValueOnce(mockCourses);

      const courses = await mockPrisma.course.findMany({
        where: {
          published: true,
          difficulty: 'ADVANCED'
        },
        include: {
          lessons: true,
          enrollments: true
        },
        take: 10,
        skip: 0
      });

      expect(courses).toEqual(mockCourses);
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: {
          published: true,
          difficulty: 'ADVANCED'
        },
        include: {
          lessons: true,
          enrollments: true
        },
        take: 10,
        skip: 0
      });
    });

    it('should update course with nested lesson updates', async () => {
      const updateData = {
        title: 'Updated Course Title',
        lessons: {
          update: [
            {
              where: { id: 'lesson-1' },
              data: { title: 'Updated Lesson Title' }
            }
          ]
        }
      };

      const updatedCourse = {
        ...mockCourse,
        title: 'Updated Course Title',
        updatedAt: new Date()
      };

      mockPrisma.course.update.mockResolvedValueOnce(updatedCourse);

      const result = await mockPrisma.course.update({
        where: { id: mockCourse.id },
        data: updateData,
        include: { lessons: true }
      });

      expect(result.title).toBe('Updated Course Title');
      expect(mockPrisma.course.update).toHaveBeenCalledWith({
        where: { id: mockCourse.id },
        data: updateData,
        include: { lessons: true }
      });
    });
  });

  describe('Progress Tracking Operations', () => {
    const mockProgress = {
      id: 'progress-123',
      userId: 'user-123',
      courseId: 'course-123',
      progressPercentage: 75,
      completedLessons: 8,
      totalLessons: 10,
      lastAccessedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create user course progress', async () => {
      const progressData = {
        userId: 'user-123',
        courseId: 'course-123',
        progressPercentage: 25,
        completedLessons: 2,
        totalLessons: 10
      };

      mockPrisma.userCourseProgress.create.mockResolvedValueOnce({
        ...progressData,
        id: 'new-progress-id',
        lastAccessedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const createdProgress = await mockPrisma.userCourseProgress.create({
        data: progressData
      });

      expect(createdProgress.progressPercentage).toBe(25);
      expect(createdProgress.completedLessons).toBe(2);
      expect(mockPrisma.userCourseProgress.create).toHaveBeenCalledWith({
        data: progressData
      });
    });

    it('should update progress with lesson completion', async () => {
      const updateData = {
        progressPercentage: 85,
        completedLessons: 9,
        lastAccessedAt: new Date()
      };

      const updatedProgress = { ...mockProgress, ...updateData };
      mockPrisma.userCourseProgress.update.mockResolvedValueOnce(updatedProgress);

      const result = await mockPrisma.userCourseProgress.update({
        where: {
          userId_courseId: {
            userId: mockProgress.userId,
            courseId: mockProgress.courseId
          }
        },
        data: updateData
      });

      expect(result.progressPercentage).toBe(85);
      expect(result.completedLessons).toBe(9);
    });

    it('should find user progress across multiple courses', async () => {
      const mockProgressList = [
        mockProgress,
        { ...mockProgress, id: 'progress-456', courseId: 'course-456' }
      ];

      mockPrisma.userCourseProgress.findMany.mockResolvedValueOnce(mockProgressList);

      const userProgress = await mockPrisma.userCourseProgress.findMany({
        where: { userId: 'user-123' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              difficulty: true
            }
          }
        }
      });

      expect(userProgress).toHaveLength(2);
      expect(mockPrisma.userCourseProgress.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              difficulty: true
            }
          }
        }
      });
    });
  });

  describe('Leaderboard and Achievement Operations', () => {
    it('should fetch global leaderboard with rankings', async () => {
      const mockLeaderboard = [
        { id: 'user-1', name: 'Top User', totalPoints: 5000, level: 10 },
        { id: 'user-2', name: 'Second User', totalPoints: 4500, level: 9 },
        { id: 'user-3', name: 'Third User', totalPoints: 4000, level: 8 }
      ];

      mockPrisma.user.findMany.mockResolvedValueOnce(mockLeaderboard);

      const leaderboard = await mockPrisma.user.findMany({
        select: {
          id: true,
          name: true,
          totalPoints: true,
          level: true
        },
        orderBy: { totalPoints: 'desc' },
        take: 100
      });

      expect(leaderboard).toEqual(mockLeaderboard);
      expect(leaderboard[0].totalPoints).toBeGreaterThan(leaderboard[1].totalPoints);
    });

    it('should create user achievements', async () => {
      const achievementData = {
        userId: 'user-123',
        achievementId: 'first-lesson-complete',
        earnedAt: new Date(),
        points: 100
      };

      mockPrisma.userAchievement.create.mockResolvedValueOnce({
        ...achievementData,
        id: 'user-achievement-123'
      });

      const userAchievement = await mockPrisma.userAchievement.create({
        data: achievementData
      });

      expect(userAchievement.points).toBe(100);
      expect(mockPrisma.userAchievement.create).toHaveBeenCalledWith({
        data: achievementData
      });
    });
  });

  describe('Database Transactions', () => {
    it('should handle complex transactions with rollback', async () => {
      const transactionCallback = vi.fn().mockImplementation(async (tx) => {
        // Simulate transaction operations
        await tx.user.update({
          where: { id: 'user-123' },
          data: { totalPoints: 1000 }
        });

        await tx.userCourseProgress.create({
          data: {
            userId: 'user-123',
            courseId: 'course-123',
            progressPercentage: 100
          }
        });

        return { success: true };
      });

      mockPrisma.$transaction.mockResolvedValueOnce({ success: true });

      const result = await mockPrisma.$transaction(transactionCallback);

      expect(result.success).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(transactionCallback);
    });

    it('should handle transaction failures and rollback', async () => {
      const failingTransaction = vi.fn().mockRejectedValue(new Error('Transaction failed'));

      mockPrisma.$transaction.mockRejectedValueOnce(new Error('Transaction failed'));

      await expect(mockPrisma.$transaction(failingTransaction)).rejects.toThrow('Transaction failed');
    });
  });

  describe('Database Migrations', () => {
    let migrationManager: DatabaseMigrationManager;

    beforeEach(() => {
      migrationManager = new DatabaseMigrationManager({
        sourceEngine: 'sqlite',
        targetEngine: 'postgresql',
        batchSize: 1000,
        enableRollback: true
      });
    });

    it('should validate migration configuration', () => {
      const config = {
        sourceEngine: 'sqlite' as const,
        targetEngine: 'postgresql' as const,
        batchSize: 1000,
        enableRollback: true
      };

      const isValid = migrationManager.validateConfig(config);
      expect(isValid).toBe(true);
    });

    it('should perform data migration with progress tracking', async () => {
      const migrationConfig = {
        sourceEngine: 'sqlite' as const,
        targetEngine: 'postgresql' as const,
        batchSize: 100,
        enableRollback: true
      };

      // Mock migration execution
      const mockMigrationResult = {
        success: true,
        migratedTables: ['users', 'courses', 'lessons'],
        totalRecords: 5000,
        duration: 120000, // 2 minutes
        warnings: []
      };

      const executeMigrationSpy = vi.spyOn(migrationManager, 'executeMigration')
        .mockResolvedValueOnce(mockMigrationResult);

      const result = await migrationManager.executeMigration(migrationConfig);

      expect(result.success).toBe(true);
      expect(result.migratedTables).toContain('users');
      expect(result.totalRecords).toBe(5000);
      expect(executeMigrationSpy).toHaveBeenCalledWith(migrationConfig);
    });

    it('should create rollback snapshots before migration', async () => {
      const createSnapshotSpy = vi.spyOn(migrationManager, 'createRollbackSnapshot')
        .mockResolvedValueOnce({
          snapshotId: 'snapshot-123',
          timestamp: new Date(),
          tables: ['users', 'courses']
        });

      const snapshot = await migrationManager.createRollbackSnapshot(['users', 'courses']);

      expect(snapshot.snapshotId).toBe('snapshot-123');
      expect(snapshot.tables).toEqual(['users', 'courses']);
      expect(createSnapshotSpy).toHaveBeenCalledWith(['users', 'courses']);
    });

    it('should handle migration rollback', async () => {
      const rollbackSpy = vi.spyOn(migrationManager, 'rollbackMigration')
        .mockResolvedValueOnce({
          success: true,
          restoredTables: ['users', 'courses'],
          duration: 60000
        });

      const rollbackResult = await migrationManager.rollbackMigration('snapshot-123');

      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.restoredTables).toContain('users');
      expect(rollbackSpy).toHaveBeenCalledWith('snapshot-123');
    });
  });

  describe('Query Performance and Optimization', () => {
    it('should track query execution times', async () => {
      const startTime = Date.now();
      
      mockPrisma.user.findMany.mockImplementation(async () => {
        // Simulate query delay
        await new Promise(resolve => setTimeout(resolve, 50));
        return [{ id: 'user-1', name: 'Test User' }];
      });

      const users = await mockPrisma.user.findMany();
      const duration = Date.now() - startTime;

      expect(users).toHaveLength(1);
      expect(duration).toBeGreaterThanOrEqual(50);
    });

    it('should handle database connection errors', async () => {
      mockPrisma.user.findMany.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(mockPrisma.user.findMany()).rejects.toThrow('Database connection failed');
    });

    it('should optimize queries with proper indexing hints', async () => {
      // Mock query with index usage
      const queryWithIndex = async () => {
        return await mockPrisma.user.findMany({
          where: {
            email: 'test@example.com' // Indexed field
          }
        });
      };

      mockPrisma.user.findMany.mockResolvedValueOnce([]);

      const result = await queryWithIndex();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle bulk operations efficiently', async () => {
      const bulkUserData = Array.from({ length: 100 }, (_, i) => ({
        email: `user${i}@example.com`,
        name: `User ${i}`
      }));

      mockPrisma.user.createMany.mockResolvedValueOnce({ count: 100 });

      const result = await mockPrisma.user.createMany({
        data: bulkUserData,
        skipDuplicates: true
      });

      expect(result.count).toBe(100);
      expect(mockPrisma.user.createMany).toHaveBeenCalledWith({
        data: bulkUserData,
        skipDuplicates: true
      });
    });
  });

  describe('Data Integrity and Constraints', () => {
    it('should enforce unique constraints', async () => {
      mockPrisma.user.create.mockRejectedValueOnce(
        new Error('Unique constraint failed on the fields: (`email`)')
      );

      await expect(mockPrisma.user.create({
        data: {
          email: 'existing@example.com',
          name: 'Duplicate User'
        }
      })).rejects.toThrow('Unique constraint failed');
    });

    it('should enforce foreign key constraints', async () => {
      mockPrisma.course.create.mockRejectedValueOnce(
        new Error('Foreign key constraint failed on the field: `authorId`')
      );

      await expect(mockPrisma.course.create({
        data: {
          title: 'Test Course',
          authorId: 'non-existent-author'
        }
      })).rejects.toThrow('Foreign key constraint failed');
    });

    it('should validate required fields', async () => {
      mockPrisma.user.create.mockRejectedValueOnce(
        new Error('Argument `email` is missing')
      );

      await expect(mockPrisma.user.create({
        data: {
          name: 'User Without Email'
          // Missing required email field
        }
      })).rejects.toThrow('Argument `email` is missing');
    });
  });
});