import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
// Optimized query patterns
export const optimizedQueries = {
  // Use select to limit fields
  getUserWithProgress: async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        progress: {
          select: {
            lessonId: true,
            completed: true,
            completedAt: true,
          },
          where: {
            completed: true,
          },
          orderBy: {
            completedAt: "desc",
          },
          take: 10, // Limit results
        },
      },
    });
  },
  // Use pagination for large datasets
  getLeaderboard: async (page: 1, limit = 20) => {
    const skip = (page - 1) * limit;
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        xp: true,
        level: true,
      },
      orderBy: {
        xp: "desc",
      },
      skip,
      take: limit,
    });
  },
  // Use aggregation for statistics
  getUserStats: async (userId: string) => {
    const [completedLessons, totalXP, achievements] = await Promise.all([
      prisma.progress.count({
        where: {
          userId,
          completed: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true },
      }),
      prisma.achievement.count({
        where: {
          users: {
            some: { id: userId },
          },
        },
      }),
    ]);
    return {
      completedLessons,
      totalXP: totalXP?.xp || 0,
      achievements,
    };
  },
  // Use indexes effectively
  searchLessons: async (query: string) => {
    return prisma.lesson.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
      },
      take: 10,
    });
  },
};
// Connection pooling configuration
export const dbConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  errorFormat: "minimal",
};
// Query result caching
const queryCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export const cachedQuery = async <T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: CACHE_TTL,
): Promise<T> => {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T;
  }
  const data = await queryFn();
  queryCache.set(key, { data, timestamp: Date.now() });
  return data;
};
