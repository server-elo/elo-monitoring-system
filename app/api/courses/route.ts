import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, validationErrorResponse, withErrorHandling, generateRequestId, createPaginationMeta } from '@/lib/api/utils';
import { ApiErrorCode, HttpStatus, ApiCourse, DifficultyLevel, CourseStatus } from '@/lib/api/types';
import { logger } from '@/lib/api/logger';

// Validation schemas
const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters').max(500, 'Short description must be less than 500 characters'),
  category: z.string().min(1, 'Category is required'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  estimatedDuration: z.number().min(1, 'Duration must be at least 1 minute'),
  prerequisites: z.array(z.string()).optional().default([]),
  learningObjectives: z.array(z.string()).min(1, 'At least one learning objective is required'),
  tags: z.array(z.string()).optional().default([]),
  thumbnail: z.string().url().optional(),
  price: z.number().min(0, 'Price cannot be negative').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional()
});

// const updateCourseSchema = createCourseSchema.partial();

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  instructorId: z.string().optional()
});

// Mock courses data
const mockCourses: ApiCourse[] = [
  {
    id: '1',
    title: 'Solidity Fundamentals',
    description: 'Learn the basics of Solidity programming language and smart contract development. This comprehensive course covers variables, functions, data types, and basic contract structure.',
    shortDescription: 'Master the fundamentals of Solidity programming',
    thumbnail: 'https://example.com/thumbnails/solidity-fundamentals.jpg',
    category: 'Programming',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedDuration: 240, // 4 hours
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
    estimatedDuration: 480, // 8 hours
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
  },
  {
    id: '3',
    title: 'DeFi Development with Solidity',
    description: 'Build decentralized finance applications using Solidity. Learn about tokens, liquidity pools, yield farming, and DeFi protocols.',
    shortDescription: 'Create DeFi applications with Solidity',
    thumbnail: 'https://example.com/thumbnails/defi-development.jpg',
    category: 'DeFi',
    difficulty: DifficultyLevel.INTERMEDIATE,
    estimatedDuration: 360, // 6 hours
    totalLessons: 15,
    totalXp: 750,
    prerequisites: ['1'],
    learningObjectives: [
      'Understand DeFi protocols',
      'Create ERC-20 tokens',
      'Build liquidity pools',
      'Implement yield farming'
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
    publishedAt: '2024-02-01T00:00:00Z',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    enrollmentCount: 890,
    completionCount: 445,
    averageRating: 4.6,
    ratingCount: 156,
    price: 149,
    currency: 'USD',
    tags: ['solidity', 'defi', 'tokens', 'intermediate']
  }
];

// GET /api/courses - List courses with filtering and pagination
async function getCoursesHandler(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Validate query parameters
    const validation = querySchema.safeParse(queryParams);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: 'INVALID_FORMAT'
      }));
      return validationErrorResponse(errors, requestId);
    }
    
    const { page, limit, sortBy, sortOrder, search, category, difficulty, status, instructorId } = validation.data;
    
    // Filter courses
    const filteredCourses = mockCourses.filter(course => {
      if (search) {
        const searchLower = search.toLowerCase();
        if (!course.title.toLowerCase().includes(searchLower) && 
            !course.description.toLowerCase().includes(searchLower) &&
            !course.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
          return false;
        }
      }
      
      if (category && course.category !== category) return false;
      if (difficulty && course.difficulty !== difficulty) return false;
      if (status && course.status !== status) return false;
      if (instructorId && course.instructorId !== instructorId) return false;
      
      return true;
    });
    
    // Sort courses
    filteredCourses.sort((a, b) => {
      const aValue = a[sortBy as keyof ApiCourse];
      const bValue = b[sortBy as keyof ApiCourse];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    // Paginate
    const total = filteredCourses.length;
    const offset = (page - 1) * limit;
    const paginatedCourses = filteredCourses.slice(offset, offset + limit);
    
    // Create pagination metadata
    const meta = createPaginationMeta(page, limit, total);
    
    return successResponse(paginatedCourses, meta, HttpStatus.OK, requestId);
    
  } catch (error) {
    logger.error('Get courses error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'get-courses',
      requestId
    }, error instanceof Error ? error : undefined);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to fetch courses',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// POST /api/courses - Create a new course
async function createCourseHandler(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body = await request.json();
    
    // Validate input
    const validation = createCourseSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: 'INVALID_FORMAT'
      }));
      return validationErrorResponse(errors, requestId);
    }
    
    const courseData = validation.data;
    
    // TODO: Get instructor ID from authentication
    const instructorId = '2'; // Mock instructor ID
    
    // Create new course
    const newCourse: ApiCourse = {
      id: (mockCourses.length + 1).toString(),
      ...courseData,
      difficulty: courseData.difficulty as DifficultyLevel,
      totalLessons: 0,
      totalXp: 0,
      instructorId,
      instructor: {
        id: instructorId,
        name: 'Jane Instructor',
        avatar: 'https://example.com/avatars/jane.jpg',
        bio: 'Experienced Solidity developer and educator'
      },
      status: CourseStatus.DRAFT,
      isPublished: false,
      publishedAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enrollmentCount: 0,
      completionCount: 0,
      averageRating: 0,
      ratingCount: 0,
      price: courseData.price || 0,
      currency: courseData.currency || 'USD',
      tags: courseData.tags || []
    };
    
    // Add to mock database
    mockCourses.push(newCourse);
    
    return successResponse(newCourse, undefined, HttpStatus.CREATED, requestId);
    
  } catch (error) {
    logger.error('Create course error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'create-course',
      requestId
    }, error instanceof Error ? error : undefined);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to create course',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// Route handlers
export const GET = withErrorHandling(getCoursesHandler);
export const POST = withErrorHandling(createCourseHandler);
