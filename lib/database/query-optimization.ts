/**
 * Database query optimization layer to prevent N+1 queries and improve performance
 * Implements DataLoader pattern, query batching, and connection pooling
 */

import { PrismaClient } from '@prisma/client';

interface QueryBatchConfig {
  maxBatchSize?: number;
  maxWait?: number; // milliseconds
}

interface DataLoaderOptions<K, V> {
  batchLoadFn: (keys: readonly K[]) => Promise<(V | Error)[]>;
  options?: {
    cache?: boolean;
    maxBatchSize?: number;
    batchScheduleFn?: (callback: () => void) => void;
  };
}

class DataLoader<K, V> {
  private batchLoadFn: (keys: readonly K[]) => Promise<(V | Error)[]>;
  private cache: Map<K, Promise<V>>;
  private batch: Array<{ key: K; resolve: (value: V) => void; reject: (error: Error) => void }>;
  private batchScheduleFn: (callback: () => void) => void;
  private maxBatchSize: number;

  constructor({ batchLoadFn, options = {} }: DataLoaderOptions<K, V>) {
    this.batchLoadFn = batchLoadFn;
    this.cache = options.cache !== false ? new Map() : new Map();
    this.batch = [];
    this.maxBatchSize = options.maxBatchSize || 100;
    this.batchScheduleFn = options.batchScheduleFn || this.defaultBatchScheduleFn;
  }

  private defaultBatchScheduleFn(callback: () => void): void {
    process.nextTick(callback);
  }

  async load(key: K): Promise<V> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const promise = new Promise<V>((resolve, reject) => {
      this.batch.push({ key, resolve, reject });

      if (this.batch.length === 1) {
        this.batchScheduleFn(() => this.dispatchBatch());
      } else if (this.batch.length >= this.maxBatchSize) {
        this.dispatchBatch();
      }
    });

    this.cache.set(key, promise);
    return promise;
  }

  async loadMany(keys: K[]): Promise<(V | Error)[]> {
    return Promise.all(keys.map(key => this.load(key).catch(error => error)));
  }

  clear(key: K): this {
    this.cache.delete(key);
    return this;
  }

  clearAll(): this {
    this.cache.clear();
    return this;
  }

  private async dispatchBatch(): Promise<void> {
    const currentBatch = this.batch.splice(0);
    if (currentBatch.length === 0) return;

    try {
      const keys = currentBatch.map(item => item.key);
      const values = await this.batchLoadFn(keys);

      currentBatch.forEach((item, index) => {
        const value = values[index];
        if (value instanceof Error) {
          item.reject(value);
        } else {
          item.resolve(value);
        }
      });
    } catch (error) {
      currentBatch.forEach(item => {
        item.reject(error instanceof Error ? error : new Error('Batch load failed'));
      });
    }
  }
}

export class QueryOptimizer {
  private prisma: PrismaClient;
  private userLoader: DataLoader<string, any>;
  private courseLoader: DataLoader<string, any>;
  private lessonLoader: DataLoader<string, any>;
  private progressLoader: DataLoader<string, any>;
  private leaderboardLoader: DataLoader<string, any>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.setupDataLoaders();
  }

  private setupDataLoaders(): void {
    // User loader - batches user queries
    this.userLoader = new DataLoader<string, any>({
      batchLoadFn: async (userIds) => {
        const users = await this.prisma.user.findMany({
          where: { id: { in: userIds as string[] } },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            experience: true,
            level: true,
            streak: true,
            totalPoints: true,
            createdAt: true
          }
        });

        const userMap = new Map(users.map(user => [user.id, user]));
        return userIds.map(id => userMap.get(id) || new Error(`User not found: ${id}`));
      },
      options: { maxBatchSize: 100 }
    });

    // Course loader - batches course queries with lessons
    this.courseLoader = new DataLoader<string, any>({
      batchLoadFn: async (courseIds) => {
        const courses = await this.prisma.course.findMany({
          where: { id: { in: courseIds as string[] } },
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                order: true,
                difficulty: true,
                estimatedTime: true
              },
              orderBy: { order: 'asc' }
            },
            _count: {
              select: {
                enrollments: true,
                lessons: true
              }
            }
          }
        });

        const courseMap = new Map(courses.map(course => [course.id, course]));
        return courseIds.map(id => courseMap.get(id) || new Error(`Course not found: ${id}`));
      },
      options: { maxBatchSize: 50 }
    });

    // Lesson loader - batches lesson queries with progress
    this.lessonLoader = new DataLoader<string, any>({
      batchLoadFn: async (lessonIds) => {
        const lessons = await this.prisma.lesson.findMany({
          where: { id: { in: lessonIds as string[] } },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                difficulty: true
              }
            },
            exercises: {
              select: {
                id: true,
                title: true,
                type: true,
                difficulty: true
              }
            }
          }
        });

        const lessonMap = new Map(lessons.map(lesson => [lesson.id, lesson]));
        return lessonIds.map(id => lessonMap.get(id) || new Error(`Lesson not found: ${id}`));
      },
      options: { maxBatchSize: 100 }
    });

    // Progress loader - batches user progress queries
    this.progressLoader = new DataLoader<string, any>({
      batchLoadFn: async (keys) => {
        // Keys format: "userId:courseId" or "userId:lessonId"
        const userIds = [...new Set(keys.map(key => (key as string).split(':')[0]))];
        const courseIds = [...new Set(keys.map(key => (key as string).split(':')[1]).filter(Boolean))];

        const [userProgress, lessonProgress] = await Promise.all([
          this.prisma.userCourseProgress.findMany({
            where: {
              userId: { in: userIds },
              courseId: { in: courseIds }
            },
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  _count: {
                    select: { lessons: true }
                  }
                }
              }
            }
          }),
          this.prisma.userLessonProgress.findMany({
            where: {
              userId: { in: userIds },
              lessonId: { in: courseIds } // Reusing courseIds for lessonIds
            },
            include: {
              lesson: {
                select: {
                  id: true,
                  title: true,
                  courseId: true
                }
              }
            }
          })
        ]);

        const progressMap = new Map();
        userProgress.forEach(progress => {
          progressMap.set(`${progress.userId}:${progress.courseId}`, progress);
        });
        lessonProgress.forEach(progress => {
          progressMap.set(`${progress.userId}:${progress.lessonId}`, progress);
        });

        return keys.map(key => progressMap.get(key) || null);
      },
      options: { maxBatchSize: 200 }
    });

    // Leaderboard loader - batches leaderboard queries
    this.leaderboardLoader = new DataLoader<string, any>({
      batchLoadFn: async (keys) => {
        // Keys format: "global", "course:courseId", "weekly", etc.
        const results = await Promise.all(
          keys.map(async (key) => {
            const [type, id] = (key as string).split(':');
            
            switch (type) {
              case 'global':
                return this.prisma.user.findMany({
                  take: 100,
                  orderBy: { totalPoints: 'desc' },
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    totalPoints: true,
                    level: true,
                    streak: true
                  }
                });
              
              case 'course':
                return this.prisma.userCourseProgress.findMany({
                  where: { courseId: id },
                  take: 100,
                  orderBy: { progressPercentage: 'desc' },
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        image: true
                      }
                    }
                  }
                });
              
              case 'weekly':
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return this.prisma.user.findMany({
                  take: 100,
                  orderBy: { totalPoints: 'desc' },
                  where: {
                    updatedAt: { gte: weekAgo }
                  },
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    totalPoints: true,
                    level: true,
                    streak: true
                  }
                });
              
              default:
                return [];
            }
          })
        );

        return results;
      },
      options: { maxBatchSize: 10 }
    });
  }

  // Public API methods that use the optimized loaders
  async getUserById(userId: string) {
    return this.userLoader.load(userId);
  }

  async getUsersByIds(userIds: string[]) {
    return this.userLoader.loadMany(userIds);
  }

  async getCourseById(courseId: string) {
    return this.courseLoader.load(courseId);
  }

  async getCoursesByIds(courseIds: string[]) {
    return this.courseLoader.loadMany(courseIds);
  }

  async getLessonById(lessonId: string) {
    return this.lessonLoader.load(lessonId);
  }

  async getLessonsByIds(lessonIds: string[]) {
    return this.lessonLoader.loadMany(lessonIds);
  }

  async getUserCourseProgress(userId: string, courseId: string) {
    return this.progressLoader.load(`${userId}:${courseId}`);
  }

  async getUserLessonProgress(userId: string, lessonId: string) {
    return this.progressLoader.load(`${userId}:${lessonId}`);
  }

  async getLeaderboard(type: 'global' | 'weekly' | string, courseId?: string) {
    const key = courseId ? `course:${courseId}` : type;
    return this.leaderboardLoader.load(key);
  }

  // Optimized query methods for common use cases
  async getCoursesWithProgress(userId: string, limit = 20, offset = 0) {
    const courses = await this.prisma.course.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });

    // Batch load course details and progress
    const [courseDetails, progressData] = await Promise.all([
      this.getCoursesByIds(courses.map(c => c.id)),
      Promise.all(courses.map(c => this.getUserCourseProgress(userId, c.id)))
    ]);

    return courseDetails.map((course, index) => ({
      ...course,
      userProgress: progressData[index]
    }));
  }

  async getLessonsWithProgress(userId: string, courseId: string) {
    const course = await this.getCourseById(courseId);
    if (!course || course instanceof Error) return [];

    const lessons = course.lessons;
    const progressData = await Promise.all(
      lessons.map((lesson: any) => this.getUserLessonProgress(userId, lesson.id))
    );

    return lessons.map((lesson: any, index: number) => ({
      ...lesson,
      userProgress: progressData[index]
    }));
  }

  async getOptimizedLeaderboard(type: 'global' | 'weekly' | 'course', courseId?: string) {
    const key = courseId ? `course:${courseId}` : type;
    const leaderboard = await this.getLeaderboard(key, courseId);
    
    if (Array.isArray(leaderboard)) {
      // If it's user data, batch load additional user details if needed
      if (leaderboard.length > 0 && 'totalPoints' in leaderboard[0]) {
        return leaderboard.map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
      }
    }

    return leaderboard;
  }

  // Cache management
  clearUserCache(userId: string): void {
    this.userLoader.clear(userId);
    // Clear related progress cache
    this.progressLoader.clearAll(); // Could be more targeted
  }

  clearCourseCache(courseId: string): void {
    this.courseLoader.clear(courseId);
    this.leaderboardLoader.clear(`course:${courseId}`);
  }

  clearAllCaches(): void {
    this.userLoader.clearAll();
    this.courseLoader.clearAll();
    this.lessonLoader.clearAll();
    this.progressLoader.clearAll();
    this.leaderboardLoader.clearAll();
  }

  // Performance monitoring
  getBatchStats() {
    return {
      timestamp: new Date().toISOString(),
      note: 'DataLoader batching reduces N+1 queries by batching database calls',
      loaders: {
        user: 'Batches up to 100 user queries',
        course: 'Batches up to 50 course queries with lessons',
        lesson: 'Batches up to 100 lesson queries with exercises',
        progress: 'Batches up to 200 progress queries',
        leaderboard: 'Batches up to 10 leaderboard queries'
      }
    };
  }
}

// Enhanced Prisma client with query optimization
export class OptimizedPrismaClient extends PrismaClient {
  private queryOptimizer: QueryOptimizer;

  constructor() {
    super({
      // Connection pooling configuration
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      // Query logging in development
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    });

    this.queryOptimizer = new QueryOptimizer(this);

    // Add query performance monitoring
    this.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();

      const duration = after - before;
      
      // Log slow queries in development
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
      }

      return result;
    });
  }

  get optimizer(): QueryOptimizer {
    return this.queryOptimizer;
  }

  // Override common methods to use optimization
  async getUserWithCourses(userId: string) {
    return this.queryOptimizer.getUserById(userId);
  }

  async getCourseWithLessons(courseId: string) {
    return this.queryOptimizer.getCourseById(courseId);
  }

  async getUserProgress(userId: string, courseId: string) {
    return this.queryOptimizer.getUserCourseProgress(userId, courseId);
  }

  async getOptimizedLeaderboard(type: 'global' | 'weekly' | 'course', courseId?: string) {
    return this.queryOptimizer.getOptimizedLeaderboard(type, courseId);
  }
}

// Export singleton instance
export const optimizedPrisma = new OptimizedPrismaClient();

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await optimizedPrisma.$disconnect();
  });
  process.on('SIGTERM', async () => {
    await optimizedPrisma.$disconnect();
  });
}