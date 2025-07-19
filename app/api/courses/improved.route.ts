/**
 * Improved Courses API Route
 * 
 * Example of how to use the new centralized error handling
 * and response builder system for consistent API responses.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { ApiResponseBuilder, PaginationHelper, TimingHelper } from '@/lib/api/responseBuilder';
import { withErrorHandler, ErrorHelpers } from '@/lib/api/errorHandler';
import { SkillLevel, CourseStatus } from '@/lib/api/types';
import { logger } from '@/lib/api/logger';
import { CourseData } from '@/app/api/types';

// Validation schemas
const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  shortDescription: z.string().min(10).max(500),
  difficulty: z.nativeEnum(SkillLevel),
  estimatedHours: z.number().min(1).max(1000),
  xpReward: z.number().min(0).max(10000).default(500),
  price: z.number().min(0).default(0),
  currency: z.string().length(3).default('USD'),
  tags: z.array(z.string()).max(10),
  prerequisites: z.array(z.string()).max(5),
});

// Mock database (replace with actual Prisma calls)
const mockCourses: CourseData[] = [];

/**
 * GET /api/courses - List courses with pagination
 */
async function getCourses(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  // Get session for user context
  const session = await getServerSession(authOptions);
  
  // Parse pagination parameters
  const url = new URL(request.url);
  const { page, limit } = PaginationHelper.parseParams(url.searchParams, {
    page: 1,
    limit: 10
  });
  
  // Parse filters
  const difficulty = url.searchParams.get('difficulty') as SkillLevel | null;
  const search = url.searchParams.get('search');
  const published = url.searchParams.get('published') === 'true';
  
  logger.info('Courses list request', {
    requestId,
    userId: session?.user?.id,
    pagination: { page, limit },
    filters: { difficulty, search, published }
  });

  // Filter courses (replace with Prisma query)
  let filteredCourses = mockCourses.filter(course => {
    if (published && !course.isPublished) return false;
    if (difficulty && course.difficulty !== difficulty) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return course.title.toLowerCase().includes(searchLower) ||
             course.description.toLowerCase().includes(searchLower);
    }
    return true;
  });

  // Paginate results
  const total = filteredCourses.length;
  const offset = PaginationHelper.calculateOffset(page, limit);
  const paginatedCourses = filteredCourses.slice(offset, offset + limit);
  
  // Create pagination metadata
  const pagination = PaginationHelper.createMeta(page, limit, total);
  
  // Create timing metadata
  const timing = TimingHelper.create(startTime);
  
  return ApiResponseBuilder.paginated(paginatedCourses, pagination, {
    requestId,
    meta: {
      timing,
      filters: {
        difficulty,
        search,
        published,
        applied: filteredCourses.length !== mockCourses.length
      }
    }
  });
}

/**
 * POST /api/courses - Create a new course
 */
async function createCourse(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  // Require authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw ErrorHelpers.unauthorized();
  }
  
  // Check permissions (instructor or admin only)
  const userRole = session.user.role as string;
  if (!['INSTRUCTOR', 'ADMIN'].includes(userRole)) {
    throw ErrorHelpers.forbidden('Only instructors and admins can create courses');
  }
  
  // Parse and validate request body
  const body = await request.json();
  const validatedData = createCourseSchema.parse(body);
  
  logger.info('Course creation request', {
    requestId,
    userId: session.user.id,
    courseTitle: validatedData.title,
    difficulty: validatedData.difficulty
  });
  
  // Check for duplicate course title
  const existingCourse = mockCourses.find(
    course => course.title.toLowerCase() === validatedData.title.toLowerCase()
  );
  
  if (existingCourse) {
    throw ErrorHelpers.conflict('A course with this title already exists', 'title');
  }
  
  // Create new course
  const newCourse: CourseData = {
    id: crypto.randomUUID(),
    ...validatedData,
    status: CourseStatus.DRAFT,
    isPublished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Save to database (mock)
  mockCourses.push(newCourse);
  
  logger.info('Course created successfully', {
    requestId,
    courseId: newCourse.id,
    userId: session.user.id,
    courseTitle: newCourse.title
  });
  
  // Create timing metadata
  const timing = TimingHelper.create(startTime);
  
  // Return created course with location header
  return ApiResponseBuilder.created(newCourse, {
    requestId,
    location: `/api/courses/${newCourse.id}`,
    meta: { timing }
  });
}

/**
 * Route handlers with error handling
 */
export const GET = withErrorHandler(getCourses);
export const POST = withErrorHandler(createCourse);