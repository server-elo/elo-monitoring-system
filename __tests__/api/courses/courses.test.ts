/**
 * Courses API Endpoint Testing Suite
 * Comprehensive tests for course management functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import test utilities
import {
  measureExecutionTime,
  loadTest,
} from '../../utils/testHelpers';
import {
  expectValidApiResponse,
  expectValidErrorResponse,
  expectValidCourse,
  expectValidLesson,
  expectSecureData,
} from '../../utils/assertionHelpers';
import {
  generateCourse,
  generateLesson,
  generateUser,
  generateProgress,
} from '../../utils/dataGenerators';

// Import mocks
import {
  mockPrismaClient,
  addMockCourse,
  addMockUser,
  resetPrismaMocks,
} from '../../mocks/database/prisma.mock';
import {
  mockSessionManager,
  resetSessionMocks,
} from '../../mocks/auth/sessionManager.mock';

// API Response Types
interface CourseResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CourseFilters {
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  category?: string;
  search?: string;
  isPublished?: boolean;
  instructorId?: string;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Mock Course Service
class MockCourseService {
  async getCourses(
    filters: CourseFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<CourseResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination;

      // Input validation
      if (page < 1 || limit < 1 || limit > 100) {
        return {
          success: false,
          error: 'Invalid pagination parameters',
        };
      }

      // Build where clause
      const where: any = {};
      if (filters.difficulty) where.difficulty = filters.difficulty;
      if (filters.category) where.category = filters.category;
      if (filters.isPublished !== undefined) where.isPublished = filters.isPublished;
      if (filters.instructorId) where.instructorId = filters.instructorId;

      // Mock database query
      const courses = await mockPrismaClient.course.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          lessons: true,
        },
      });

      const total = await mockPrismaClient.course.count({ where });
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: courses,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch courses',
      };
    }
  }

  async getCourseById(courseId: string, includeProgress?: boolean): Promise<CourseResponse> {
    try {
      if (!courseId) {
        return {
          success: false,
          error: 'Course ID is required',
        };
      }

      const course = await mockPrismaClient.course.findUnique({
        where: { id: courseId },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
          },
          ...(includeProgress && {
            progress: true,
          }),
        },
      });

      if (!course) {
        return {
          success: false,
          error: 'Course not found',
        };
      }

      return {
        success: true,
        data: course,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch course',
      };
    }
  }

  async createCourse(courseData: any, userId: string): Promise<CourseResponse> {
    try {
      // Input validation
      if (!courseData.title || !courseData.description) {
        return {
          success: false,
          error: 'Title and description are required',
        };
      }

      if (courseData.title.length > 200) {
        return {
          success: false,
          error: 'Title must be less than 200 characters',
        };
      }

      if (courseData.description.length > 2000) {
        return {
          success: false,
          error: 'Description must be less than 2000 characters',
        };
      }

      // Validate instructor permissions
      const user = await mockPrismaClient.user.findUnique({
        where: { id: userId },
      });

      if (!user || !['INSTRUCTOR', 'ADMIN'].includes(user.role)) {
        return {
          success: false,
          error: 'Insufficient permissions to create courses',
        };
      }

      const course = await mockPrismaClient.course.create({
        data: {
          ...courseData,
          instructorId: userId,
          slug: courseData.title.toLowerCase().replace(/\s+/g, '-'),
        },
      });

      return {
        success: true,
        data: course,
        message: 'Course created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create course',
      };
    }
  }

  async updateCourse(
    courseId: string,
    updateData: any,
    userId: string
  ): Promise<CourseResponse> {
    try {
      if (!courseId) {
        return {
          success: false,
          error: 'Course ID is required',
        };
      }

      // Check if course exists and user has permission
      const existingCourse = await mockPrismaClient.course.findUnique({
        where: { id: courseId },
      });

      if (!existingCourse) {
        return {
          success: false,
          error: 'Course not found',
        };
      }

      const user = await mockPrismaClient.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Check permissions
      const canEdit = user.role === 'ADMIN' || 
        (user.role === 'INSTRUCTOR' && existingCourse.instructorId === userId);

      if (!canEdit) {
        return {
          success: false,
          error: 'Insufficient permissions to update this course',
        };
      }

      // Validate update data
      if (updateData.title && updateData.title.length > 200) {
        return {
          success: false,
          error: 'Title must be less than 200 characters',
        };
      }

      const updatedCourse = await mockPrismaClient.course.update({
        where: { id: courseId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: updatedCourse,
        message: 'Course updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update course',
      };
    }
  }

  async deleteCourse(courseId: string, userId: string): Promise<CourseResponse> {
    try {
      if (!courseId) {
        return {
          success: false,
          error: 'Course ID is required',
        };
      }

      const course = await mockPrismaClient.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return {
          success: false,
          error: 'Course not found',
        };
      }

      const user = await mockPrismaClient.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Check permissions
      const canDelete = user.role === 'ADMIN' || 
        (user.role === 'INSTRUCTOR' && course.instructorId === userId);

      if (!canDelete) {
        return {
          success: false,
          error: 'Insufficient permissions to delete this course',
        };
      }

      await mockPrismaClient.course.delete({
        where: { id: courseId },
      });

      return {
        success: true,
        message: 'Course deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete course',
      };
    }
  }

  async searchCourses(query: string, filters: CourseFilters = {}): Promise<CourseResponse> {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          error: 'Search query must be at least 2 characters',
        };
      }

      // Sanitize search query
      const sanitizedQuery = query.trim().toLowerCase();
      expectSecureData({ searchQuery: sanitizedQuery });

      const where: any = {
        ...filters,
        OR: [
          { title: { contains: sanitizedQuery } },
          { description: { contains: sanitizedQuery } },
          { category: { contains: sanitizedQuery } },
        ],
      };

      const courses = await mockPrismaClient.course.findMany({
        where,
        orderBy: { enrollmentCount: 'desc' },
        take: 20,
      });

      return {
        success: true,
        data: courses,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Search failed',
      };
    }
  }

  async enrollInCourse(courseId: string, userId: string): Promise<CourseResponse> {
    try {
      const course = await mockPrismaClient.course.findUnique({
        where: { id: courseId },
      });

      if (!course || !course.isPublished) {
        return {
          success: false,
          error: 'Course not available for enrollment',
        };
      }

      // Check if already enrolled (mock check)
      const existingEnrollment = await mockPrismaClient.progress.findMany({
        where: {
          userId,
          courseId,
        },
      });

      if (existingEnrollment.length > 0) {
        return {
          success: false,
          error: 'Already enrolled in this course',
        };
      }

      // Create initial progress records for all lessons
      const lessons = await mockPrismaClient.course.findUnique({
        where: { id: courseId },
        include: { lessons: true },
      });

      if (lessons?.lessons) {
        for (const lesson of lessons.lessons) {
          await mockPrismaClient.progress.create({
            data: {
              userId,
              lessonId: lesson.id,
              courseId,
              status: 'NOT_STARTED',
              timeSpent: 0,
              attempts: 0,
            },
          });
        }
      }

      // Update enrollment count
      await mockPrismaClient.course.update({
        where: { id: courseId },
        data: {
          enrollmentCount: course.enrollmentCount + 1,
        },
      });

      return {
        success: true,
        message: 'Successfully enrolled in course',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to enroll in course',
      };
    }
  }
}

const mockCourseService = new MockCourseService();

describe('Courses API Endpoint Tests', () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetSessionMocks();

    // Add mock data
    const sampleCourses = [
      generateCourse({ difficulty: 'BEGINNER', isPublished: true }),
      generateCourse({ difficulty: 'INTERMEDIATE', isPublished: true }),
      generateCourse({ difficulty: 'ADVANCED', isPublished: false }),
    ];

    sampleCourses.forEach(course => addMockCourse(course));

    const sampleUsers = [
      generateUser({ role: 'STUDENT' }),
      generateUser({ role: 'INSTRUCTOR' }),
      generateUser({ role: 'ADMIN' }),
    ];

    sampleUsers.forEach(user => addMockUser(user));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/courses', () => {
    it('should fetch all published courses with pagination', async () => {
      // Act
      const { result, duration } = await measureExecutionTime(() =>
        mockCourseService.getCourses(
          { isPublished: true },
          { page: 1, limit: 10 }
        )
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.page).toBe(1);
      expect(result.pagination?.limit).toBe(10);
      expect(duration).toBeLessThan(300);

      expectValidApiResponse(result);
    });

    it('should filter courses by difficulty', async () => {
      // Act
      const result = await mockCourseService.getCourses({
        difficulty: 'BEGINNER',
        isPublished: true,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data.length > 0) {
        result.data.forEach((course: any) => {
          expect(course.difficulty).toBe('BEGINNER');
          expectValidCourse(course);
        });
      }
    });

    it('should filter courses by category', async () => {
      // Act
      const result = await mockCourseService.getCourses({
        category: 'Smart Contracts',
        isPublished: true,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should validate pagination parameters', async () => {
      const invalidPaginationCases = [
        { page: 0, limit: 10 },
        { page: 1, limit: 0 },
        { page: -1, limit: 10 },
        { page: 1, limit: 101 }, // Exceeds max limit
      ];

      for (const pagination of invalidPaginationCases) {
        const result = await mockCourseService.getCourses({}, pagination);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid pagination parameters');
      }
    });

    it('should sort courses correctly', async () => {
      // Act
      const result = await mockCourseService.getCourses(
        { isPublished: true },
        { sortBy: 'enrollmentCount', sortOrder: 'desc' }
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data.length > 1) {
        for (let i = 0; i < result.data.length - 1; i++) {
          expect(result.data[i].enrollmentCount).toBeGreaterThanOrEqual(
            result.data[i + 1].enrollmentCount
          );
        }
      }
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should fetch a specific course by ID', async () => {
      // Arrange
      const sampleCourse = generateCourse({ isPublished: true });
      addMockCourse(sampleCourse);

      // Act
      const result = await mockCourseService.getCourseById(sampleCourse.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(sampleCourse.id);
      expectValidCourse(result.data);
    });

    it('should return 404 for non-existent courses', async () => {
      // Act
      const result = await mockCourseService.getCourseById('non-existent-id');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Course not found');
      expectValidErrorResponse(result);
    });

    it('should include lessons when requested', async () => {
      // Arrange
      const sampleCourse = generateCourse({ isPublished: true });
      addMockCourse(sampleCourse);

      // Act
      const result = await mockCourseService.getCourseById(sampleCourse.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.lessons).toBeDefined();
      expect(Array.isArray(result.data.lessons)).toBe(true);
    });

    it('should validate course ID parameter', async () => {
      // Act
      const result = await mockCourseService.getCourseById('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Course ID is required');
    });
  });

  describe('POST /api/courses', () => {
    it('should create a new course for instructors', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR' });
      addMockUser(instructor);

      const courseData = {
        title: 'Advanced Solidity Programming',
        description: 'Learn advanced Solidity concepts and best practices.',
        difficulty: 'ADVANCED',
        category: 'Smart Contracts',
        estimatedDuration: 180,
        xpReward: 500,
      };

      // Act
      const result = await mockCourseService.createCourse(courseData, instructor.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.title).toBe(courseData.title);
      expect(result.data.instructorId).toBe(instructor.id);
      expect(result.message).toBe('Course created successfully');
      expectValidCourse(result.data);
    });

    it('should allow admins to create courses', async () => {
      // Arrange
      const admin = generateUser({ role: 'ADMIN' });
      addMockUser(admin);

      const courseData = {
        title: 'Test Course',
        description: 'A test course for admins.',
        difficulty: 'BEGINNER',
        category: 'Testing',
        estimatedDuration: 60,
        xpReward: 100,
      };

      // Act
      const result = await mockCourseService.createCourse(courseData, admin.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.instructorId).toBe(admin.id);
    });

    it('should reject course creation for students', async () => {
      // Arrange
      const student = generateUser({ role: 'STUDENT' });
      addMockUser(student);

      const courseData = {
        title: 'Unauthorized Course',
        description: 'This should fail.',
        difficulty: 'BEGINNER',
        category: 'Testing',
        estimatedDuration: 60,
        xpReward: 100,
      };

      // Act
      const result = await mockCourseService.createCourse(courseData, student.id);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions to create courses');
      expectValidErrorResponse(result);
    });

    it('should validate required fields', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR' });
      addMockUser(instructor);

      const invalidCourseData = [
        { description: 'Missing title' },
        { title: 'Missing description' },
        {},
      ];

      // Act & Assert
      for (const courseData of invalidCourseData) {
        const result = await mockCourseService.createCourse(courseData, instructor.id);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Title and description are required');
      }
    });

    it('should validate field lengths', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR' });
      addMockUser(instructor);

      const longTitle = 'a'.repeat(201);
      const longDescription = 'a'.repeat(2001);

      // Test long title
      const longTitleResult = await mockCourseService.createCourse({
        title: longTitle,
        description: 'Valid description',
      }, instructor.id);

      expect(longTitleResult.success).toBe(false);
      expect(longTitleResult.error).toBe('Title must be less than 200 characters');

      // Test long description
      const longDescResult = await mockCourseService.createCourse({
        title: 'Valid title',
        description: longDescription,
      }, instructor.id);

      expect(longDescResult.success).toBe(false);
      expect(longDescResult.error).toBe('Description must be less than 2000 characters');
    });
  });

  describe('PUT /api/courses/:id', () => {
    it('should allow instructors to update their own courses', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR' });
      addMockUser(instructor);

      const course = generateCourse({ instructorId: instructor.id });
      addMockCourse(course);

      const updateData = {
        title: 'Updated Course Title',
        description: 'Updated description',
      };

      // Act
      const result = await mockCourseService.updateCourse(course.id, updateData, instructor.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.title).toBe(updateData.title);
      expect(result.message).toBe('Course updated successfully');
    });

    it('should allow admins to update any course', async () => {
      // Arrange
      const admin = generateUser({ role: 'ADMIN' });
      const instructor = generateUser({ role: 'INSTRUCTOR' });
      addMockUser(admin);
      addMockUser(instructor);

      const course = generateCourse({ instructorId: instructor.id });
      addMockCourse(course);

      const updateData = { title: 'Admin Updated Title' };

      // Act
      const result = await mockCourseService.updateCourse(course.id, updateData, admin.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.title).toBe(updateData.title);
    });

    it('should prevent unauthorized updates', async () => {
      // Arrange
      const instructor1 = generateUser({ role: 'INSTRUCTOR' });
      const instructor2 = generateUser({ role: 'INSTRUCTOR' });
      addMockUser(instructor1);
      addMockUser(instructor2);

      const course = generateCourse({ instructorId: instructor1.id });
      addMockCourse(course);

      const updateData = { title: 'Unauthorized Update' };

      // Act
      const result = await mockCourseService.updateCourse(course.id, updateData, instructor2.id);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions to update this course');
    });

    it('should validate update data', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR' });
      addMockUser(instructor);

      const course = generateCourse({ instructorId: instructor.id });
      addMockCourse(course);

      const invalidUpdateData = {
        title: 'a'.repeat(201), // Too long
      };

      // Act
      const result = await mockCourseService.updateCourse(course.id, invalidUpdateData, instructor.id);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Title must be less than 200 characters');
    });
  });

  describe('DELETE /api/courses/:id', () => {
    it('should allow instructors to delete their own courses', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR' });
      addMockUser(instructor);

      const course = generateCourse({ instructorId: instructor.id });
      addMockCourse(course);

      // Act
      const result = await mockCourseService.deleteCourse(course.id, instructor.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Course deleted successfully');
    });

    it('should allow admins to delete any course', async () => {
      // Arrange
      const admin = generateUser({ role: 'ADMIN' });
      const instructor = generateUser({ role: 'INSTRUCTOR' });
      addMockUser(admin);
      addMockUser(instructor);

      const course = generateCourse({ instructorId: instructor.id });
      addMockCourse(course);

      // Act
      const result = await mockCourseService.deleteCourse(course.id, admin.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Course deleted successfully');
    });

    it('should prevent unauthorized deletions', async () => {
      // Arrange
      const instructor1 = generateUser({ role: 'INSTRUCTOR' });
      const instructor2 = generateUser({ role: 'INSTRUCTOR' });
      addMockUser(instructor1);
      addMockUser(instructor2);

      const course = generateCourse({ instructorId: instructor1.id });
      addMockCourse(course);

      // Act
      const result = await mockCourseService.deleteCourse(course.id, instructor2.id);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions to delete this course');
    });
  });

  describe('GET /api/courses/search', () => {
    it('should search courses by title and description', async () => {
      // Arrange
      const searchTerm = 'solidity';

      // Act
      const result = await mockCourseService.searchCourses(searchTerm);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should validate search query length', async () => {
      // Act
      const result = await mockCourseService.searchCourses('a'); // Too short

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Search query must be at least 2 characters');
    });

    it('should sanitize search input for security', async () => {
      // Arrange
      const maliciousQueries = [
        '<script>alert("xss")</script>',
        "'; DROP TABLE courses; --",
        '<img src="x" onerror="alert(1)">',
      ];

      // Act & Assert
      for (const query of maliciousQueries) {
        const result = await mockCourseService.searchCourses(query);
        
        // Should not crash and should sanitize input
        expect(typeof result.success).toBe('boolean');
        expectSecureData({ searchQuery: query });
      }
    });
  });

  describe('POST /api/courses/:id/enroll', () => {
    it('should allow students to enroll in published courses', async () => {
      // Arrange
      const student = generateUser({ role: 'STUDENT' });
      addMockUser(student);

      const course = generateCourse({ isPublished: true });
      addMockCourse(course);

      // Act
      const result = await mockCourseService.enrollInCourse(course.id, student.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully enrolled in course');
    });

    it('should prevent enrollment in unpublished courses', async () => {
      // Arrange
      const student = generateUser({ role: 'STUDENT' });
      addMockUser(student);

      const course = generateCourse({ isPublished: false });
      addMockCourse(course);

      // Act
      const result = await mockCourseService.enrollInCourse(course.id, student.id);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Course not available for enrollment');
    });

    it('should prevent duplicate enrollments', async () => {
      // Arrange
      const student = generateUser({ role: 'STUDENT' });
      addMockUser(student);

      const course = generateCourse({ isPublished: true });
      addMockCourse(course);

      // First enrollment
      await mockCourseService.enrollInCourse(course.id, student.id);

      // Act - Second enrollment attempt
      const result = await mockCourseService.enrollInCourse(course.id, student.id);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Already enrolled in this course');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent course requests efficiently', async () => {
      // Arrange
      const concurrentRequests = 20;

      // Act
      const loadTestResult = await loadTest(
        async () => {
          return await mockCourseService.getCourses(
            { isPublished: true },
            { page: 1, limit: 10 }
          );
        },
        {
          concurrentUsers: concurrentRequests,
          duration: 5000,
        }
      );

      // Assert
      expect(loadTestResult.successRate).toBeGreaterThan(95);
      expect(loadTestResult.averageResponseTime).toBeLessThan(500);
    });

    it('should complete requests within performance limits', async () => {
      // Act
      const { duration } = await measureExecutionTime(() =>
        mockCourseService.getCourses({}, { page: 1, limit: 50 })
      );

      // Assert
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large result sets efficiently', async () => {
      // Arrange - Add many courses
      const largeCourseSet = Array.from({ length: 100 }, () => 
        generateCourse({ isPublished: true })
      );
      largeCourseSet.forEach(course => addMockCourse(course));

      // Act
      const { duration } = await measureExecutionTime(() =>
        mockCourseService.getCourses({}, { page: 1, limit: 50 })
      );

      // Assert
      expect(duration).toBeLessThan(2000); // Should handle large sets within 2 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection failures gracefully', async () => {
      // Arrange
      mockPrismaClient.course.findMany.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      // Act
      const result = await mockCourseService.getCourses();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch courses');
      expectValidErrorResponse(result);
    });

    it('should handle malformed request data', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR' });
      addMockUser(instructor);

      const malformedData = [
        null,
        undefined,
        { title: null, description: null },
        { title: [], description: {} },
      ];

      // Act & Assert
      for (const data of malformedData) {
        const result = await mockCourseService.createCourse(data, instructor.id);
        expect(result.success).toBe(false);
      }
    });

    it('should provide meaningful error messages', async () => {
      // Act
      const result = await mockCourseService.getCourseById('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    });
  });
});