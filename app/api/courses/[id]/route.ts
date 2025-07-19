import { NextRequest } from 'next/server';
import { z } from 'zod';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse,
  withErrorHandling,
  generateRequestId
} from '@/lib/api/utils';
import { ApiErrorCode, HttpStatus, ApiCourse, DifficultyLevel, CourseStatus } from '@/lib/api/types';
import { logger } from '@/lib/monitoring/simple-logger';

// Validation schema for updates
const updateCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters').optional(),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters').max(500, 'Short description must be less than 500 characters').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  estimatedDuration: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  prerequisites: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().url().optional(),
  price: z.number().min(0, 'Price cannot be negative').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  isPublished: z.boolean().optional()
});

// Mock courses data (same as in courses/route.ts)
const mockCourses: ApiCourse[] = [
  {
    id: '1',
    title: 'Solidity Fundamentals',
    description: 'Learn the basics of Solidity programming language and smart contract development. This comprehensive course covers variables, functions, data types, and basic contract structure.',
    shortDescription: 'Master the fundamentals of Solidity programming',
    thumbnail: 'https://example.com/thumbnails/solidity-fundamentals.jpg',
    category: 'Programming',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedDuration: 240,
    totalLessons: 12,
    totalXp: 500,
    prerequisites: [],
    learningObjectives: [
      'Understand Solidity syntax and structure',
      'Create basic smart contracts',
      'Work with variables and data types',
      'Implement functions and modifiers'
    ],
    instructorId: '2',
    instructor: {
      id: '2',
      name: 'Jane Instructor',
      avatar: 'https://example.com/avatars/jane.jpg',
      bio: 'Experienced Solidity developer and educator'
    },
    status: CourseStatus.PUBLISHED,
    isPublished: true,
    publishedAt: '2024-01-01T00:00:00Z',
    createdAt: '2023-12-15T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    enrollmentCount: 1250,
    completionCount: 890,
    averageRating: 4.7,
    ratingCount: 234,
    price: 0,
    currency: 'USD',
    tags: ['solidity', 'blockchain', 'smart-contracts', 'beginner']
  },
  {
    id: '2',
    title: 'Advanced Smart Contract Patterns',
    description: 'Deep dive into advanced Solidity patterns, security best practices, and optimization techniques. Learn about proxy patterns, upgradeable contracts, and gas optimization.',
    shortDescription: 'Master advanced Solidity patterns and security',
    thumbnail: 'https://example.com/thumbnails/advanced-patterns.jpg',
    category: 'Programming',
    difficulty: DifficultyLevel.ADVANCED,
    estimatedDuration: 480,
    totalLessons: 20,
    totalXp: 1000,
    prerequisites: ['1'],
    learningObjectives: [
      'Implement advanced contract patterns',
      'Understand security vulnerabilities',
      'Optimize gas usage',
      'Create upgradeable contracts'
    ],
    instructorId: '2',
    instructor: {
      id: '2',
      name: 'Jane Instructor',
      avatar: 'https://example.com/avatars/jane.jpg',
      bio: 'Experienced Solidity developer and educator'
    },
    status: CourseStatus.PUBLISHED,
    isPublished: true,
    publishedAt: '2024-01-15T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    enrollmentCount: 650,
    completionCount: 320,
    averageRating: 4.9,
    ratingCount: 89,
    price: 99,
    currency: 'USD',
    tags: ['solidity', 'advanced', 'security', 'patterns']
  }
];

// GET /api/courses/[id] - Get a specific course
async function getCourseHandler(_request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateRequestId();
  
  try {
    const { id } = params;
    
    // Find course
    const course = mockCourses.find(c => c.id === id);
    if (!course) {
      return notFoundResponse('Course', requestId);
    }
    
    return successResponse(course, undefined, HttpStatus.OK, requestId);
    
  } catch (error) {
    logger.error('Get course error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to fetch course',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// PUT /api/courses/[id] - Update a specific course
async function updateCourseHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateRequestId();
  
  try {
    const { id } = params;
    const body = await request.json();
    
    // Find course
    const courseIndex = mockCourses.findIndex(c => c.id === id);
    if (courseIndex === -1) {
      return notFoundResponse('Course', requestId);
    }
    
    // Validate input
    const validation = updateCourseSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: 'INVALID_FORMAT'
      }));
      return validationErrorResponse(errors, requestId);
    }
    
    const updateData = validation.data;
    
    // TODO: Check if user has permission to update this course
    // const userId = getUserFromToken(request);
    // if (mockCourses[courseIndex].instructorId !== userId && !isAdmin(userId)) {
    //   return forbiddenResponse('You do not have permission to update this course', requestId);
    // }
    
    // Update course
    const updatedCourse = {
      ...mockCourses[courseIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Handle publishing status change
    if (updateData.isPublished !== undefined) {
      if (updateData.isPublished && !mockCourses[courseIndex].isPublished) {
        updatedCourse.publishedAt = new Date().toISOString();
        updatedCourse.status = CourseStatus.PUBLISHED;
      } else if (!updateData.isPublished && mockCourses[courseIndex].isPublished) {
        updatedCourse.publishedAt = undefined;
        updatedCourse.status = CourseStatus.DRAFT;
      }
    }
    
    mockCourses[courseIndex] = updatedCourse as ApiCourse;
    
    return successResponse(updatedCourse, undefined, HttpStatus.OK, requestId);
    
  } catch (error) {
    logger.error('Update course error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to update course',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// DELETE /api/courses/[id] - Delete a specific course
async function deleteCourseHandler(_request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateRequestId();
  
  try {
    const { id } = params;
    
    // Find course
    const courseIndex = mockCourses.findIndex(c => c.id === id);
    if (courseIndex === -1) {
      return notFoundResponse('Course', requestId);
    }
    
    // TODO: Check if user has permission to delete this course
    // const userId = getUserFromToken(request);
    // if (mockCourses[courseIndex].instructorId !== userId && !isAdmin(userId)) {
    //   return forbiddenResponse('You do not have permission to delete this course', requestId);
    // }
    
    // TODO: Check if course has enrollments
    // if (mockCourses[courseIndex].enrollmentCount > 0) {
    //   return errorResponse(
    //     ApiErrorCode.RESOURCE_CONFLICT,
    //     'Cannot delete course with active enrollments',
    //     HttpStatus.CONFLICT,
    //     { enrollmentCount: mockCourses[courseIndex].enrollmentCount },
    //     requestId
    //   );
    // }
    
    // Remove course
    const deletedCourse = mockCourses.splice(courseIndex, 1)[0];
    
    return successResponse(
      { message: 'Course deleted successfully', course: deletedCourse },
      undefined,
      HttpStatus.OK,
      requestId
    );
    
  } catch (error) {
    logger.error('Delete course error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to delete course',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// Route handlers
export const GET = withErrorHandling(getCourseHandler);
export const PUT = withErrorHandling(updateCourseHandler);
export const DELETE = withErrorHandling(deleteCourseHandler);
