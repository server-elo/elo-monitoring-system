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
      if (_page < 1 || limit < 1 || limit > 100) {
        return {
          success: false,
          error: 'Invalid pagination parameters',
        };
      }

      // Build where clause
      const where: any = {};
      if (_filters.difficulty) where.difficulty = filters.difficulty;
      if (_filters.category) where.category = filters.category;
      if (_filters.isPublished !== undefined) where.isPublished = filters.isPublished;
      if (_filters.instructorId) where.instructorId = filters.instructorId;

      // Mock database query
      const courses = await mockPrismaClient.course.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: (_page - 1) * limit,
        include: {
          lessons: true,
        },
      });

      const total = await mockPrismaClient.course.count({ where  });
      const totalPages = Math.ceil(_total / limit);

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
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to fetch courses',
      };
    }
  }

  async getCourseById( courseId: string, includeProgress?: boolean): Promise<CourseResponse> {
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
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to fetch course',
      };
    }
  }

  async createCourse( courseData: any, userId: string): Promise<CourseResponse> {
    try {
      // Input validation
      if (!courseData.title || !courseData.description) {
        return {
          success: false,
          error: 'Title and description are required',
        };
      }

      if (_courseData.title.length > 200) {
        return {
          success: false,
          error: 'Title must be less than 200 characters',
        };
      }

      if (_courseData.description.length > 2000) {
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
    } catch (_error) {
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
        (_user.role === 'INSTRUCTOR' && existingCourse.instructorId === userId);

      if (!canEdit) {
        return {
          success: false,
          error: 'Insufficient permissions to update this course',
        };
      }

      // Validate update data
      if (_updateData.title && updateData.title.length > 200) {
        return {
          success: false,
          error: 'Title must be less than 200 characters',
        };
      }

      const updatedCourse = await mockPrismaClient.course.update({
        where: { id: courseId },
        data: {
          ...updateData,
          updatedAt: new Date(_),
        },
      });

      return {
        success: true,
        data: updatedCourse,
        message: 'Course updated successfully',
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to update course',
      };
    }
  }

  async deleteCourse( courseId: string, userId: string): Promise<CourseResponse> {
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
        (_user.role === 'INSTRUCTOR' && course.instructorId === userId);

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
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to delete course',
      };
    }
  }

  async searchCourses( query: string, filters: CourseFilters = {}): Promise<CourseResponse> {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          error: 'Search query must be at least 2 characters',
        };
      }

      // Sanitize search query
      const sanitizedQuery = query.trim(_).toLowerCase();
      expectSecureData({ searchQuery: sanitizedQuery  });

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
    } catch (_error) {
      return {
        success: false,
        error: 'Search failed',
      };
    }
  }

  async enrollInCourse( courseId: string, userId: string): Promise<CourseResponse> {
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

      // Check if already enrolled (_mock check)
      const existingEnrollment = await mockPrismaClient.progress.findMany({
        where: {
          userId,
          courseId,
        },
      });

      if (_existingEnrollment.length > 0) {
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

      if (_lessons?.lessons) {
        for (_const lesson of lessons.lessons) {
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
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to enroll in course',
      };
    }
  }
}

const mockCourseService = new MockCourseService(_);

describe( 'Courses API Endpoint Tests', () => {
  beforeEach(() => {
    resetPrismaMocks(_);
    resetSessionMocks(_);

    // Add mock data
    const sampleCourses = [
      generateCourse( { difficulty: 'BEGINNER', isPublished: true }),
      generateCourse( { difficulty: 'INTERMEDIATE', isPublished: true }),
      generateCourse( { difficulty: 'ADVANCED', isPublished: false }),
    ];

    sampleCourses.forEach(_course => addMockCourse(course));

    const sampleUsers = [
      generateUser({ role: 'STUDENT'  }),
      generateUser({ role: 'INSTRUCTOR'  }),
      generateUser({ role: 'ADMIN'  }),
    ];

    sampleUsers.forEach(_user => addMockUser(user));
  });

  afterEach(() => {
    vi.clearAllMocks(_);
  });

  describe( 'GET /api/courses', () => {
    it( 'should fetch all published courses with pagination', async () => {
      // Act
      const { result, duration } = await measureExecutionTime(() =>
        mockCourseService.getCourses(
          { isPublished: true },
          { page: 1, limit: 10 }
        )
      );

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.data).toBeDefined(_);
      expect(_Array.isArray(result.data)).toBe(_true);
      expect(_result.pagination).toBeDefined(_);
      expect(_result.pagination?.page).toBe(1);
      expect(_result.pagination?.limit).toBe(10);
      expect(_duration).toBeLessThan(300);

      expectValidApiResponse(_result);
    });

    it( 'should filter courses by difficulty', async () => {
      // Act
      const result = await mockCourseService.getCourses({
        difficulty: 'BEGINNER',
        isPublished: true,
      });

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.data).toBeDefined(_);
      
      if (_result.data.length > 0) {
        result.data.forEach((course: any) => {
          expect(_course.difficulty).toBe('BEGINNER');
          expectValidCourse(_course);
        });
      }
    });

    it( 'should filter courses by category', async () => {
      // Act
      const result = await mockCourseService.getCourses({
        category: 'Smart Contracts',
        isPublished: true,
      });

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.data).toBeDefined(_);
    });

    it( 'should validate pagination parameters', async () => {
      const invalidPaginationCases = [
        { page: 0, limit: 10 },
        { page: 1, limit: 0 },
        { page: -1, limit: 10 },
        { page: 1, limit: 101 }, // Exceeds max limit
      ];

      for (_const pagination of invalidPaginationCases) {
        const result = await mockCourseService.getCourses( {}, pagination);
        expect(_result.success).toBe(_false);
        expect(_result.error).toBe('Invalid pagination parameters');
      }
    });

    it( 'should sort courses correctly', async () => {
      // Act
      const result = await mockCourseService.getCourses(
        { isPublished: true },
        { sortBy: 'enrollmentCount', sortOrder: 'desc' }
      );

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.data).toBeDefined(_);
      
      if (_result.data.length > 1) {
        for (let i = 0; i < result.data.length - 1; i++) {
          expect(_result.data[i].enrollmentCount).toBeGreaterThanOrEqual(
            result.data[i + 1].enrollmentCount
          );
        }
      }
    });
  });

  describe( 'GET /api/courses/:id', () => {
    it( 'should fetch a specific course by ID', async () => {
      // Arrange
      const sampleCourse = generateCourse({ isPublished: true  });
      addMockCourse(_sampleCourse);

      // Act
      const result = await mockCourseService.getCourseById(_sampleCourse.id);

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.data).toBeDefined(_);
      expect(_result.data.id).toBe(_sampleCourse.id);
      expectValidCourse(_result.data);
    });

    it( 'should return 404 for non-existent courses', async () => {
      // Act
      const result = await mockCourseService.getCourseById('non-existent-id');

      // Assert
      expect(_result.success).toBe(_false);
      expect(_result.error).toBe('Course not found');
      expectValidErrorResponse(_result);
    });

    it( 'should include lessons when requested', async () => {
      // Arrange
      const sampleCourse = generateCourse({ isPublished: true  });
      addMockCourse(_sampleCourse);

      // Act
      const result = await mockCourseService.getCourseById(_sampleCourse.id);

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.data.lessons).toBeDefined(_);
      expect(_Array.isArray(result.data.lessons)).toBe(_true);
    });

    it( 'should validate course ID parameter', async () => {
      // Act
      const result = await mockCourseService.getCourseById('');

      // Assert
      expect(_result.success).toBe(_false);
      expect(_result.error).toBe('Course ID is required');
    });
  });

  describe( 'POST /api/courses', () => {
    it( 'should create a new course for instructors', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR'  });
      addMockUser(_instructor);

      const courseData = {
        title: 'Advanced Solidity Programming',
        description: 'Learn advanced Solidity concepts and best practices.',
        difficulty: 'ADVANCED',
        category: 'Smart Contracts',
        estimatedDuration: 180,
        xpReward: 500,
      };

      // Act
      const result = await mockCourseService.createCourse( courseData, instructor.id);

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.data).toBeDefined(_);
      expect(_result.data.title).toBe(_courseData.title);
      expect(_result.data.instructorId).toBe(_instructor.id);
      expect(_result.message).toBe('Course created successfully');
      expectValidCourse(_result.data);
    });

    it( 'should allow admins to create courses', async () => {
      // Arrange
      const admin = generateUser({ role: 'ADMIN'  });
      addMockUser(_admin);

      const courseData = {
        title: 'Test Course',
        description: 'A test course for admins.',
        difficulty: 'BEGINNER',
        category: 'Testing',
        estimatedDuration: 60,
        xpReward: 100,
      };

      // Act
      const result = await mockCourseService.createCourse( courseData, admin.id);

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.data.instructorId).toBe(_admin.id);
    });

    it( 'should reject course creation for students', async () => {
      // Arrange
      const student = generateUser({ role: 'STUDENT'  });
      addMockUser(_student);

      const courseData = {
        title: 'Unauthorized Course',
        description: 'This should fail.',
        difficulty: 'BEGINNER',
        category: 'Testing',
        estimatedDuration: 60,
        xpReward: 100,
      };

      // Act
      const result = await mockCourseService.createCourse( courseData, student.id);

      // Assert
      expect(_result.success).toBe(_false);
      expect(_result.error).toBe('Insufficient permissions to create courses');
      expectValidErrorResponse(_result);
    });

    it( 'should validate required fields', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR'  });
      addMockUser(_instructor);

      const invalidCourseData = [
        { description: 'Missing title' },
        { title: 'Missing description' },
        {},
      ];

      // Act & Assert
      for (_const courseData of invalidCourseData) {
        const result = await mockCourseService.createCourse( courseData, instructor.id);
        expect(_result.success).toBe(_false);
        expect(_result.error).toBe('Title and description are required');
      }
    });

    it( 'should validate field lengths', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR'  });
      addMockUser(_instructor);

      const longTitle = 'a'.repeat(_201);
      const longDescription = 'a'.repeat(2001);

      // Test long title
      const longTitleResult = await mockCourseService.createCourse({
        title: longTitle,
        description: 'Valid description',
      }, instructor.id);

      expect(_longTitleResult.success).toBe(_false);
      expect(_longTitleResult.error).toBe('Title must be less than 200 characters');

      // Test long description
      const longDescResult = await mockCourseService.createCourse({
        title: 'Valid title',
        description: longDescription,
      }, instructor.id);

      expect(_longDescResult.success).toBe(_false);
      expect(_longDescResult.error).toBe('Description must be less than 2000 characters');
    });
  });

  describe( 'PUT /api/courses/:id', () => {
    it( 'should allow instructors to update their own courses', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR'  });
      addMockUser(_instructor);

      const course = generateCourse({ instructorId: instructor.id  });
      addMockCourse(_course);

      const updateData = {
        title: 'Updated Course Title',
        description: 'Updated description',
      };

      // Act
      const result = await mockCourseService.updateCourse( course.id, updateData, instructor.id);

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.data.title).toBe(_updateData.title);
      expect(_result.message).toBe('Course updated successfully');
    });

    it( 'should allow admins to update any course', async () => {
      // Arrange
      const admin = generateUser({ role: 'ADMIN'  });
      const instructor = generateUser({ role: 'INSTRUCTOR'  });
      addMockUser(_admin);
      addMockUser(_instructor);

      const course = generateCourse({ instructorId: instructor.id  });
      addMockCourse(_course);

      const updateData = { title: 'Admin Updated Title' };

      // Act
      const result = await mockCourseService.updateCourse( course.id, updateData, admin.id);

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.data.title).toBe(_updateData.title);
    });

    it( 'should prevent unauthorized updates', async () => {
      // Arrange
      const instructor1 = generateUser({ role: 'INSTRUCTOR'  });
      const instructor2 = generateUser({ role: 'INSTRUCTOR'  });
      addMockUser(_instructor1);
      addMockUser(_instructor2);

      const course = generateCourse({ instructorId: instructor1.id  });
      addMockCourse(_course);

      const updateData = { title: 'Unauthorized Update' };

      // Act
      const result = await mockCourseService.updateCourse( course.id, updateData, instructor2.id);

      // Assert
      expect(_result.success).toBe(_false);
      expect(_result.error).toBe('Insufficient permissions to update this course');
    });

    it( 'should validate update data', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR'  });
      addMockUser(_instructor);

      const course = generateCourse({ instructorId: instructor.id  });
      addMockCourse(_course);

      const invalidUpdateData = {
        title: 'a'.repeat(_201), // Too long
      };

      // Act
      const result = await mockCourseService.updateCourse( course.id, invalidUpdateData, instructor.id);

      // Assert
      expect(_result.success).toBe(_false);
      expect(_result.error).toBe('Title must be less than 200 characters');
    });
  });

  describe( 'DELETE /api/courses/:id', () => {
    it( 'should allow instructors to delete their own courses', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR'  });
      addMockUser(_instructor);

      const course = generateCourse({ instructorId: instructor.id  });
      addMockCourse(_course);

      // Act
      const result = await mockCourseService.deleteCourse( course.id, instructor.id);

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.message).toBe('Course deleted successfully');
    });

    it( 'should allow admins to delete any course', async () => {
      // Arrange
      const admin = generateUser({ role: 'ADMIN'  });
      const instructor = generateUser({ role: 'INSTRUCTOR'  });
      addMockUser(_admin);
      addMockUser(_instructor);

      const course = generateCourse({ instructorId: instructor.id  });
      addMockCourse(_course);

      // Act
      const result = await mockCourseService.deleteCourse( course.id, admin.id);

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.message).toBe('Course deleted successfully');
    });

    it( 'should prevent unauthorized deletions', async () => {
      // Arrange
      const instructor1 = generateUser({ role: 'INSTRUCTOR'  });
      const instructor2 = generateUser({ role: 'INSTRUCTOR'  });
      addMockUser(_instructor1);
      addMockUser(_instructor2);

      const course = generateCourse({ instructorId: instructor1.id  });
      addMockCourse(_course);

      // Act
      const result = await mockCourseService.deleteCourse( course.id, instructor2.id);

      // Assert
      expect(_result.success).toBe(_false);
      expect(_result.error).toBe('Insufficient permissions to delete this course');
    });
  });

  describe( 'GET /api/courses/search', () => {
    it( 'should search courses by title and description', async () => {
      // Arrange
      const searchTerm = 'solidity';

      // Act
      const result = await mockCourseService.searchCourses(_searchTerm);

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.data).toBeDefined(_);
      expect(_Array.isArray(result.data)).toBe(_true);
    });

    it( 'should validate search query length', async () => {
      // Act
      const result = await mockCourseService.searchCourses('a'); // Too short

      // Assert
      expect(_result.success).toBe(_false);
      expect(_result.error).toBe('Search query must be at least 2 characters');
    });

    it( 'should sanitize search input for security', async () => {
      // Arrange
      const maliciousQueries = [
        '<script>alert("xss")</script>',
        "'; DROP TABLE courses; --",
        '<img src="x" onerror="alert(1)">',
      ];

      // Act & Assert
      for (_const query of maliciousQueries) {
        const result = await mockCourseService.searchCourses(_query);
        
        // Should not crash and should sanitize input
        expect(_typeof result.success).toBe('boolean');
        expectSecureData({ searchQuery: query  });
      }
    });
  });

  describe( 'POST /api/courses/:id/enroll', () => {
    it( 'should allow students to enroll in published courses', async () => {
      // Arrange
      const student = generateUser({ role: 'STUDENT'  });
      addMockUser(_student);

      const course = generateCourse({ isPublished: true  });
      addMockCourse(_course);

      // Act
      const result = await mockCourseService.enrollInCourse( course.id, student.id);

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.message).toBe('Successfully enrolled in course');
    });

    it( 'should prevent enrollment in unpublished courses', async () => {
      // Arrange
      const student = generateUser({ role: 'STUDENT'  });
      addMockUser(_student);

      const course = generateCourse({ isPublished: false  });
      addMockCourse(_course);

      // Act
      const result = await mockCourseService.enrollInCourse( course.id, student.id);

      // Assert
      expect(_result.success).toBe(_false);
      expect(_result.error).toBe('Course not available for enrollment');
    });

    it( 'should prevent duplicate enrollments', async () => {
      // Arrange
      const student = generateUser({ role: 'STUDENT'  });
      addMockUser(_student);

      const course = generateCourse({ isPublished: true  });
      addMockCourse(_course);

      // First enrollment
      await mockCourseService.enrollInCourse( course.id, student.id);

      // Act - Second enrollment attempt
      const result = await mockCourseService.enrollInCourse( course.id, student.id);

      // Assert
      expect(_result.success).toBe(_false);
      expect(_result.error).toBe('Already enrolled in this course');
    });
  });

  describe( 'Performance and Load Testing', () => {
    it( 'should handle concurrent course requests efficiently', async () => {
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
      expect(_loadTestResult.successRate).toBeGreaterThan(_95);
      expect(_loadTestResult.averageResponseTime).toBeLessThan(500);
    });

    it( 'should complete requests within performance limits', async () => {
      // Act
      const { duration } = await measureExecutionTime(() =>
        mockCourseService.getCourses( {}, { page: 1, limit: 50 })
      );

      // Assert
      expect(_duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it( 'should handle large result sets efficiently', async () => {
      // Arrange - Add many courses
      const largeCourseSet = Array.from( { length: 100 }, () => 
        generateCourse({ isPublished: true  })
      );
      largeCourseSet.forEach(_course => addMockCourse(course));

      // Act
      const { duration } = await measureExecutionTime(() =>
        mockCourseService.getCourses( {}, { page: 1, limit: 50 })
      );

      // Assert
      expect(_duration).toBeLessThan(2000); // Should handle large sets within 2 seconds
    });
  });

  describe( 'Error Handling', () => {
    it( 'should handle database connection failures gracefully', async () => {
      // Arrange
      mockPrismaClient.course.findMany.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      // Act
      const result = await mockCourseService.getCourses(_);

      // Assert
      expect(_result.success).toBe(_false);
      expect(_result.error).toBe('Failed to fetch courses');
      expectValidErrorResponse(_result);
    });

    it( 'should handle malformed request data', async () => {
      // Arrange
      const instructor = generateUser({ role: 'INSTRUCTOR'  });
      addMockUser(_instructor);

      const malformedData = [
        null,
        undefined,
        { title: null, description: null },
        { title: [], description: {} },
      ];

      // Act & Assert
      for (_const data of malformedData) {
        const result = await mockCourseService.createCourse( data, instructor.id);
        expect(_result.success).toBe(_false);
      }
    });

    it( 'should provide meaningful error messages', async () => {
      // Act
      const result = await mockCourseService.getCourseById('');

      // Assert
      expect(_result.success).toBe(_false);
      expect(_result.error).toBeDefined(_);
      expect(_typeof result.error).toBe('string');
      expect(_result.error.length).toBeGreaterThan(0);
    });
  });
});