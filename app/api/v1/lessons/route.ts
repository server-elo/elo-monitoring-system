import { NextRequest } from 'next/server';
import { protectedEndpoint } from '@/lib/api/middleware';
import { ApiResponseBuilder } from '@/lib/api/response';
import { validateQuery, validateBody, PaginationSchema, SearchSchema, CreateLessonSchema } from '@/lib/api/validation';
import { ApiLesson, LessonType, DifficultyLevel, LessonStatus, UserRole } from '@/lib/api/types';
import { MiddlewareContext } from '@/lib/api/middleware';
import { createPaginationMeta } from '@/lib/api/response';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/monitoring/simple-logger';
import { z } from 'zod';

// Type for search filters
type SearchFilters = z.infer<typeof SearchSchema>;

// Mock lessons database
const mockLessons: ApiLesson[] = [
  {
    id: 'lesson_1',
    title: 'Introduction to Solidity',
    description: 'Learn the basics of Solidity programming language for smart contracts',
    content: 'Solidity is a statically-typed programming language designed for developing smart contracts that run on the Ethereum Virtual Machine (EVM)...',
    type: LessonType.THEORY,
    difficulty: DifficultyLevel.BEGINNER,
    estimatedDuration: 30,
    xpReward: 100,
    prerequisites: [],
    tags: ['solidity', 'basics', 'introduction'],
    courseId: 'course_1',
    instructorId: 'user_2',
    status: LessonStatus.PUBLISHED,
    isPublished: true,
    publishedAt: '2024-01-01T00:00:00Z',
    createdAt: '2023-12-15T10:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    completionCount: 245,
    averageRating: 4.7,
    ratingCount: 89
  },
  {
    id: 'lesson_2',
    title: 'Variables and Data Types',
    description: 'Understanding Solidity variables, data types, and storage',
    content: 'In Solidity, variables are used to store data. There are several data types available...',
    type: LessonType.PRACTICAL,
    difficulty: DifficultyLevel.BEGINNER,
    estimatedDuration: 45,
    xpReward: 150,
    prerequisites: ['lesson_1'],
    tags: ['solidity', 'variables', 'data-types'],
    courseId: 'course_1',
    instructorId: 'user_2',
    status: LessonStatus.PUBLISHED,
    isPublished: true,
    publishedAt: '2024-01-02T00:00:00Z',
    createdAt: '2023-12-16T10:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    completionCount: 198,
    averageRating: 4.5,
    ratingCount: 67
  },
  {
    id: 'lesson_3',
    title: 'Functions and Modifiers',
    description: 'Learn how to create and use functions and modifiers in Solidity',
    content: 'Functions are the executable units of code within a contract...',
    type: LessonType.PRACTICAL,
    difficulty: DifficultyLevel.INTERMEDIATE,
    estimatedDuration: 60,
    xpReward: 200,
    prerequisites: ['lesson_1', 'lesson_2'],
    tags: ['solidity', 'functions', 'modifiers'],
    courseId: 'course_1',
    instructorId: 'user_2',
    status: LessonStatus.PUBLISHED,
    isPublished: true,
    publishedAt: '2024-01-03T00:00:00Z',
    createdAt: '2023-12-17T10:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    completionCount: 156,
    averageRating: 4.8,
    ratingCount: 45
  }
];

// Generate more mock lessons
for (let i = 4; i <= 25; i++) {
  mockLessons.push({
    id: `lesson_${i}`,
    title: `Lesson ${i}: Advanced Topic`,
    description: `Advanced lesson covering topic ${i}`,
    content: `This is the content for lesson ${i}...`,
    type: i % 3 === 0 ? LessonType.QUIZ : i % 2 === 0 ? LessonType.PRACTICAL : LessonType.THEORY,
    difficulty: i <= 8 ? DifficultyLevel.BEGINNER : i <= 16 ? DifficultyLevel.INTERMEDIATE : DifficultyLevel.ADVANCED,
    estimatedDuration: 30 + (i * 5),
    xpReward: 100 + (i * 25),
    prerequisites: i > 1 ? [`lesson_${i - 1}`] : [],
    tags: ['solidity', `topic-${i}`],
    courseId: 'course_1',
    instructorId: 'user_2',
    status: LessonStatus.PUBLISHED,
    isPublished: true,
    publishedAt: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000).toISOString(),
    completionCount: Math.floor(Math.random() * 200) + 50,
    averageRating: 4 + Math.random(),
    ratingCount: Math.floor(Math.random() * 100) + 20
  });
}

function filterLessons(lessons: ApiLesson[], filters: SearchFilters): ApiLesson[] {
  let filtered = [...lessons];

  // Only show published lessons to students
  filtered = filtered.filter(lesson => lesson.isPublished);

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(lesson => 
      lesson.title.toLowerCase().includes(searchLower) ||
      lesson.description.toLowerCase().includes(searchLower) ||
      lesson.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  if (filters.category) {
    // Category could be difficulty or type
    filtered = filtered.filter(lesson => 
      lesson.difficulty === filters.category || 
      lesson.type === filters.category
    );
  }

  if (filters.status) {
    filtered = filtered.filter(lesson => lesson.status === filters.status);
  }

  return filtered;
}

function sortLessons(lessons: ApiLesson[], sortBy: string, sortOrder: 'asc' | 'desc'): ApiLesson[] {
  return lessons.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'difficulty':
        const difficultyOrder = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };
        aValue = difficultyOrder[a.difficulty];
        bValue = difficultyOrder[b.difficulty];
        break;
      case 'duration':
        aValue = a.estimatedDuration;
        bValue = b.estimatedDuration;
        break;
      case 'xp':
        aValue = a.xpReward;
        bValue = b.xpReward;
        break;
      case 'rating':
        aValue = a.averageRating;
        bValue = b.averageRating;
        break;
      case 'popularity':
        aValue = a.completionCount;
        bValue = b.completionCount;
        break;
      default:
        aValue = new Date(a.publishedAt || a.createdAt);
        bValue = new Date(b.publishedAt || b.createdAt);
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

// GET /api/v1/lessons - List lessons
export const GET = protectedEndpoint(async (request: NextRequest, context: MiddlewareContext) => {
  try {
    const url = new URL(request.url);
    const pagination = validateQuery(PaginationSchema, url.searchParams);
    const filters = validateQuery(SearchSchema, url.searchParams);

    // Filter lessons based on user role and filters
    let filteredLessons = filterLessons(mockLessons, filters);

    // Instructors and admins can see all lessons including drafts
    if (context.user!.role === UserRole.INSTRUCTOR || context.user!.role === UserRole.ADMIN) {
      filteredLessons = mockLessons.filter(lesson => {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          return lesson.title.toLowerCase().includes(searchLower) ||
                 lesson.description.toLowerCase().includes(searchLower) ||
                 lesson.tags.some(tag => tag.toLowerCase().includes(searchLower));
        }
        return true;
      });
    }

    // Sort lessons
    const sortedLessons = sortLessons(filteredLessons, pagination.sortBy || 'publishedAt', pagination.sortOrder || 'asc');

    // Apply pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLessons = sortedLessons.slice(startIndex, endIndex);

    // Create pagination metadata
    const paginationMeta = createPaginationMeta(
      page,
      limit,
      filteredLessons.length
    );

    return ApiResponseBuilder.paginated(paginatedLessons, paginationMeta);
  } catch (error) {
    logger.error('Get lessons error', error as Error);
    return ApiResponseBuilder.internalServerError('Failed to fetch lessons');
  }
});

// POST /api/v1/lessons - Create lesson (instructors and admins only)
export const POST = protectedEndpoint(
  async (request: NextRequest, context: MiddlewareContext) => {
    try {
      // Check if user can create lessons
      if (context.user!.role !== UserRole.INSTRUCTOR && context.user!.role !== UserRole.ADMIN) {
        return ApiResponseBuilder.forbidden('Only instructors and administrators can create lessons');
      }

      const body = await validateBody(CreateLessonSchema, request);

      // Create new lesson
      const now = new Date().toISOString();
      const newLesson: ApiLesson = {
        id: uuidv4(),
        title: body.title,
        description: body.description,
        content: body.content,
        type: body.type,
        difficulty: body.difficulty,
        estimatedDuration: body.estimatedDuration,
        xpReward: body.xpReward,
        prerequisites: body.prerequisites || [],
        tags: body.tags || [],
        courseId: body.courseId,
        instructorId: context.user!.id,
        status: LessonStatus.DRAFT,
        isPublished: false,
        createdAt: now,
        updatedAt: now,
        completionCount: 0,
        averageRating: 0,
        ratingCount: 0
      };

      mockLessons.push(newLesson);

      return ApiResponseBuilder.created(newLesson);
    } catch (error) {
      logger.error('Create lesson error', error as Error);
      
      if (error instanceof Error) {
        return ApiResponseBuilder.validationError(error.message, []);
      }
      
      return ApiResponseBuilder.internalServerError('Failed to create lesson');
    }
  },
  ['lessons:write']
);

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
