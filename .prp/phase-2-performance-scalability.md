# ⚡ Phase 2 PRP: Performance & Scalability

## 🎯 Objective
Optimize application performance and implement scalability solutions to handle increased user load, reduce response times, and improve user experience through caching, code splitting, and query optimization.

## 📋 Requirements

### Functional Requirements
1. **Redis Integration**: Implement distributed caching and session storage
2. **Bundle Optimization**: Reduce initial bundle size to <500KB
3. **Code Splitting**: Implement lazy loading for heavy components
4. **Query Optimization**: Eliminate N+1 queries and optimize database performance
5. **CDN Setup**: Configure content delivery network for static assets
6. **Horizontal Scaling**: Enable multi-instance deployment

### Non-Functional Requirements
- **Performance**: Page load time <2s, API response <100ms (p95)
- **Scalability**: Support 1000+ concurrent users
- **Availability**: Zero downtime during scaling operations
- **Cache Hit Rate**: >80% for cacheable content

## 🏗️ Technical Architecture

### Caching Layer Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        CDN Layer                             │
│                 (CloudFlare/AWS CloudFront)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                   Load Balancer                             │
│                  (Nginx/AWS ALB)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│               Application Servers                           │
│                 (Auto-scaling)                              │
└───────┬──────────────────────────────────┬──────────────────┘
        │                                  │
┌───────┴────────┐                ┌───────┴──────────────────┐
│ Redis Cluster  │                │   PostgreSQL Cluster     │
│ (Cache+Session)│                │ (Primary + Read Replicas)│
└────────────────┘                └───────────────────────────┘
```

### Performance Optimization Stack
```
┌─────────────────────────────────────────────────────────────┐
│                  Browser Layer                              │
│        (Service Worker + Local Storage)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                Application Cache                            │
│              (React Query + SWR)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                  Redis Cache                               │
│            (API + Session + WebSocket)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│               Database Layer                                │
│            (Connection Pool + Indexes)                     │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Implementation Plan

### Task 1: Redis Implementation (Day 1-2)
**Priority**: HIGH  
**Estimated Time**: 12-16 hours  
**Dependencies**: Phase 1 completion

#### Steps:
1. **Set up Redis infrastructure**
```bash
# Option 1: Local Redis for development
docker run --name redis-learning-sol \
  -p 6379:6379 \
  -d redis:7-alpine \
  redis-server --appendonly yes

# Option 2: Redis Cloud (Production)
# Sign up at Redis Cloud or use AWS ElastiCache
```

2. **Create Redis client and cache utilities**
```typescript
// lib/cache/redis-client.ts
import { createClient, RedisClientType } from 'redis';

class RedisManager {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) return;

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) return new Error('Too many retries');
            return Math.min(retries * 50, 1000);
          }
        }
      });

      this.client.on('error', (err) => console.error('Redis Client Error', err));
      this.client.on('connect', () => console.log('Redis connected'));
      this.client.on('ready', () => {
        this.isConnected = true;
        console.log('Redis ready');
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Fallback to in-memory cache
      this.client = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) return null;
    
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl = 3600): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis DELETE PATTERN error:', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    
    try {
      await this.client.flushDb();
      return true;
    } catch (error) {
      console.error('Redis FLUSH error:', error);
      return false;
    }
  }

  getStats() {
    return {
      connected: this.isConnected,
      client: !!this.client
    };
  }
}

export const redis = new RedisManager();
```

3. **Implement caching layers**
```typescript
// lib/cache/api-cache.ts
import { redis } from './redis-client';

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  namespace?: string;
}

export class APICache {
  private namespace: string;

  constructor(namespace = 'api') {
    this.namespace = namespace;
  }

  private getKey(key: string, namespace?: string): string {
    return `${namespace || this.namespace}:${key}`;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const cacheKey = this.getKey(key, options?.namespace);
    return await redis.get<T>(cacheKey);
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = 3600, namespace } = options;
    const cacheKey = this.getKey(key, namespace);
    
    await redis.set(cacheKey, value, ttl);
    
    // Store tags for cache invalidation
    if (options.tags) {
      for (const tag of options.tags) {
        const tagKey = this.getKey(`tag:${tag}`, namespace);
        const existingKeys = await redis.get<string[]>(tagKey) || [];
        existingKeys.push(cacheKey);
        await redis.set(tagKey, existingKeys, ttl);
      }
    }
  }

  async invalidate(key: string, options?: CacheOptions): Promise<void> {
    const cacheKey = this.getKey(key, options?.namespace);
    await redis.delete(cacheKey);
  }

  async invalidateByTag(tag: string, options?: CacheOptions): Promise<void> {
    const tagKey = this.getKey(`tag:${tag}`, options?.namespace);
    const keys = await redis.get<string[]>(tagKey);
    
    if (keys && keys.length > 0) {
      for (const key of keys) {
        await redis.delete(key);
      }
      await redis.delete(tagKey);
    }
  }

  async invalidatePattern(pattern: string, options?: CacheOptions): Promise<void> {
    const fullPattern = this.getKey(pattern, options?.namespace);
    await redis.deletePattern(fullPattern);
  }
}

export const apiCache = new APICache();
```

4. **Implement session storage with Redis**
```typescript
// lib/auth/redis-session-store.ts
import { SessionStore } from 'express-session';
import { redis } from '../cache/redis-client';

export class RedisSessionStore extends SessionStore {
  private prefix: string;
  private ttl: number;

  constructor(options: { prefix?: string; ttl?: number } = {}) {
    super();
    this.prefix = options.prefix || 'session:';
    this.ttl = options.ttl || 86400; // 24 hours
  }

  private getKey(sid: string): string {
    return `${this.prefix}${sid}`;
  }

  async get(sid: string, callback: (err?: any, session?: any) => void): Promise<void> {
    try {
      const key = this.getKey(sid);
      const session = await redis.get(key);
      callback(null, session);
    } catch (error) {
      callback(error);
    }
  }

  async set(sid: string, session: any, callback?: (err?: any) => void): Promise<void> {
    try {
      const key = this.getKey(sid);
      await redis.set(key, session, this.ttl);
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void): Promise<void> {
    try {
      const key = this.getKey(sid);
      await redis.delete(key);
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }

  async touch(sid: string, session: any, callback?: (err?: any) => void): Promise<void> {
    try {
      const key = this.getKey(sid);
      await redis.set(key, session, this.ttl);
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }

  async length(callback: (err?: any, length?: number) => void): Promise<void> {
    try {
      // Note: This is expensive, avoid in production
      const keys = await redis.client?.keys(`${this.prefix}*`) || [];
      callback(null, keys.length);
    } catch (error) {
      callback(error);
    }
  }

  async clear(callback?: (err?: any) => void): Promise<void> {
    try {
      await redis.deletePattern(`${this.prefix}*`);
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }
}
```

#### Validation:
- [ ] Redis connection established
- [ ] Cache hit rate >50% in testing
- [ ] Session storage working
- [ ] Fallback to in-memory working

### Task 2: Bundle Optimization & Code Splitting (Day 2-3)
**Priority**: HIGH  
**Estimated Time**: 12-16 hours  
**Dependencies**: None

#### Steps:
1. **Optimize Next.js configuration**
```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'lodash'
    ],
    serverComponentsExternalPackages: ['prisma', '@prisma/client']
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: false,
          vendors: false,
          
          // Framework bundle (React, Next.js)
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          
          // Large libraries
          monaco: {
            name: 'monaco',
            test: /[\\/]node_modules[\\/]monaco-editor[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          
          // Common vendor packages
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
          },
          
          // Common shared modules
          common: {
            name: 'common',
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };

      // Analyze bundle composition
      config.plugins.push(
        new webpack.DefinePlugin({
          __BUNDLE_ANALYZE__: JSON.stringify(process.env.ANALYZE === 'true'),
        })
      );
    }

    // Optimize imports
    config.resolve.alias = {
      ...config.resolve.alias,
      // Replace heavy lodash with lodash-es
      'lodash': 'lodash-es',
    };

    return config;
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Compression
  compress: true,
  poweredByHeader: false,
  
  // Output optimization
  output: 'standalone',
  
  // Performance budgets
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = withBundleAnalyzer(nextConfig);
```

2. **Implement dynamic imports for heavy components**
```typescript
// components/lazy/LazyMonacoEditor.tsx
import dynamic from 'next/dynamic';
import { SkeletonLoader } from '../ui/SkeletonLoader';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    loading: () => <SkeletonLoader type="editor" />,
    ssr: false, // Monaco doesn't work with SSR
  }
);

const CollaborativeEditor = dynamic(
  () => import('../collaboration/CollaborativeEditor').then((mod) => mod.CollaborativeEditor),
  {
    loading: () => <SkeletonLoader type="editor" />,
    ssr: false,
  }
);

export { MonacoEditor, CollaborativeEditor };
```

3. **Create optimized component loader**
```typescript
// lib/utils/lazy-loader.ts
import { ComponentType, lazy, LazyExoticComponent } from 'react';

interface LazyLoadOptions {
  fallback?: ComponentType;
  delay?: number;
  preload?: boolean;
}

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const { delay = 0, preload = false } = options;

  const LazyComponent = lazy(async () => {
    // Add artificial delay for testing
    if (delay > 0 && process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const module = await importFn();
    return 'default' in module ? module : { default: module as T };
  });

  // Preload component if requested
  if (preload && typeof window !== 'undefined') {
    importFn().catch(console.error);
  }

  return LazyComponent;
}

// Pre-configured lazy components
export const LazyComponents = {
  MonacoEditor: createLazyComponent(
    () => import('@monaco-editor/react'),
    { preload: false }
  ),
  
  CollaborativeEditor: createLazyComponent(
    () => import('../components/collaboration/CollaborativeEditor'),
    { preload: false }
  ),
  
  AdminDashboard: createLazyComponent(
    () => import('../components/admin/AdminDashboard'),
    { preload: false }
  ),
  
  AIAssistant: createLazyComponent(
    () => import('../components/ai/EnhancedAIAssistant'),
    { preload: false }
  ),
};
```

4. **Optimize static assets**
```typescript
// scripts/optimize-assets.ts
import sharp from 'sharp';
import { glob } from 'glob';
import { promises as fs } from 'fs';
import path from 'path';

async function optimizeImages() {
  const images = await glob('public/**/*.{jpg,jpeg,png}');
  
  for (const imagePath of images) {
    const { dir, name, ext } = path.parse(imagePath);
    
    // Create WebP version
    await sharp(imagePath)
      .webp({ quality: 80 })
      .toFile(path.join(dir, `${name}.webp`));
    
    // Create AVIF version for modern browsers
    try {
      await sharp(imagePath)
        .avif({ quality: 70 })
        .toFile(path.join(dir, `${name}.avif`));
    } catch (error) {
      console.log(`AVIF conversion failed for ${imagePath}:`, error.message);
    }
    
    // Optimize original
    if (ext === '.png') {
      await sharp(imagePath)
        .png({ compressionLevel: 9 })
        .toFile(path.join(dir, `${name}-optimized${ext}`));
    } else {
      await sharp(imagePath)
        .jpeg({ quality: 85, progressive: true })
        .toFile(path.join(dir, `${name}-optimized${ext}`));
    }
  }
}

async function generateServiceWorker() {
  const swContent = `
const CACHE_NAME = 'learning-solidity-v1';
const urlsToCache = [
  '/',
  '/static/js/',
  '/static/css/',
  '/images/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
`;

  await fs.writeFile('public/sw.js', swContent);
}

if (require.main === module) {
  optimizeImages();
  generateServiceWorker();
}
```

#### Validation:
- [ ] Bundle size <500KB initial
- [ ] Lazy loading working
- [ ] Images optimized (WebP/AVIF)
- [ ] Service worker functional

### Task 3: Query Optimization (Day 3-4)
**Priority**: HIGH  
**Estimated Time**: 12-16 hours  
**Dependencies**: Task 1 completion

#### Steps:
1. **Fix N+1 queries in leaderboard**
```typescript
// app/api/leaderboard/route.ts (OPTIMIZED)
import { prisma } from '@/lib/prisma';
import { apiCache } from '@/lib/cache/api-cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  // Check cache first
  const cacheKey = `leaderboard:${limit}:${offset}`;
  const cached = await apiCache.get(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  try {
    // Optimized query with proper includes
    const users = await prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: [
        { xp: 'desc' },
        { createdAt: 'asc' }
      ],
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        xp: true,
        level: true,
        createdAt: true,
        // Use aggregate counts instead of loading all relations
        _count: {
          select: {
            progress: {
              where: { completed: true }
            },
            achievements: true,
            coursesCreated: true
          }
        }
      },
      where: {
        deletedAt: null,
        // Only active users
        lastActiveAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      }
    });

    const leaderboard = users.map((user, index) => ({
      rank: offset + index + 1,
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      xp: user.xp,
      level: user.level,
      completedLessons: user._count.progress,
      achievementsCount: user._count.achievements,
      coursesCreated: user._count.coursesCreated,
      joinedAt: user.createdAt
    }));

    // Cache for 5 minutes
    await apiCache.set(cacheKey, leaderboard, { 
      ttl: 300,
      tags: ['leaderboard', 'users']
    });

    return Response.json(leaderboard);

  } catch (error) {
    console.error('Leaderboard query failed:', error);
    return Response.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
```

2. **Implement database query monitoring**
```typescript
// lib/monitoring/query-monitor.ts
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any;
}

class QueryMonitor {
  private metrics: QueryMetrics[] = [];
  private slowQueryThreshold = 100; // ms

  monitorPrisma(prisma: PrismaClient) {
    prisma.$use(async (params, next) => {
      const start = performance.now();
      
      try {
        const result = await next(params);
        const duration = performance.now() - start;
        
        this.recordQuery({
          query: `${params.model}.${params.action}`,
          duration,
          timestamp: new Date(),
          params: process.env.NODE_ENV === 'development' ? params.args : undefined
        });

        // Log slow queries
        if (duration > this.slowQueryThreshold) {
          console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration.toFixed(2)}ms`);
        }

        return result;
      } catch (error) {
        const duration = performance.now() - start;
        console.error(`Query failed: ${params.model}.${params.action} after ${duration.toFixed(2)}ms`, error);
        throw error;
      }
    });
  }

  private recordQuery(metric: QueryMetrics) {
    this.metrics.push(metric);
    
    // Keep only last 1000 queries
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getSlowQueries(threshold = this.slowQueryThreshold): QueryMetrics[] {
    return this.metrics.filter(m => m.duration > threshold);
  }

  getAverageQueryTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }

  getQueryStats() {
    const queries = this.metrics;
    const slowQueries = this.getSlowQueries();
    
    return {
      totalQueries: queries.length,
      slowQueries: slowQueries.length,
      averageTime: this.getAverageQueryTime(),
      slowestQuery: queries.reduce((slowest, current) => 
        current.duration > slowest.duration ? current : slowest,
        { duration: 0 } as QueryMetrics
      )
    };
  }
}

export const queryMonitor = new QueryMonitor();
```

3. **Optimize database indexes**
```sql
-- Add performance indexes to PostgreSQL
-- prisma/migrations/add_performance_indexes.sql

-- User-related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_xp_level ON users(xp DESC, level DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(last_active_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_unique ON users(email) WHERE deleted_at IS NULL;

-- Progress tracking indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_completion ON user_progress(user_id, completed, updated_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_lesson ON user_progress(lesson_id, completed);

-- Course-related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_published ON courses(published, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(user_id, status);

-- Achievement indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_earned ON user_achievements(user_id, earned_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievements_type ON achievements(type, criteria);

-- Collaboration indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collaboration_active ON collaboration_sessions(room_id, active, updated_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_course_progress ON user_progress(user_id, course_id, lesson_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_query ON users(xp DESC, level DESC, created_at ASC) WHERE deleted_at IS NULL;

-- Analyze tables for optimal query planning
ANALYZE users;
ANALYZE user_progress;
ANALYZE courses;
ANALYZE course_enrollments;
ANALYZE user_achievements;
ANALYZE collaboration_sessions;
```

4. **Implement connection pooling**
```typescript
// lib/database/connection-pool.ts
import { PrismaClient } from '@prisma/client';

class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  getPrismaClient(): PrismaClient {
    if (!this.prisma) {
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        },
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
        
        // Connection pool configuration
        __internal: {
          engine: {
            endpoint: process.env.DATABASE_URL,
            datasourceOverrides: {},
            env: process.env,
            ignoreEnvVarErrors: false,
          }
        }
      });

      // Add query monitoring
      if (process.env.NODE_ENV !== 'production') {
        queryMonitor.monitorPrisma(this.prisma);
      }
    }

    return this.prisma;
  }

  async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.prisma) return false;
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  getConnectionInfo() {
    return {
      connected: !!this.prisma,
      url: process.env.DATABASE_URL?.replace(/\/\/.*:.*@/, '//***:***@') // Hide credentials
    };
  }
}

export const dbManager = DatabaseManager.getInstance();
export const prisma = dbManager.getPrismaClient();
```

#### Validation:
- [ ] No N+1 queries detected
- [ ] Average query time <50ms
- [ ] Database indexes optimized
- [ ] Connection pooling active

### Task 4: CDN Setup & Asset Optimization (Day 4-5)
**Priority**: MEDIUM  
**Estimated Time**: 8-12 hours  
**Dependencies**: Task 2 completion

#### Steps:
1. **Configure CloudFlare CDN**
```javascript
// next.config.js (CDN configuration)
const nextConfig = {
  // ... existing config
  
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.learning-solidity.com'
    : '',

  images: {
    // ... existing config
    domains: ['cdn.learning-solidity.com', 'images.unsplash.com'],
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },

  // Static file optimization
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.{js,css,ico,png,jpg,jpeg,gif,svg,webp,avif}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

2. **Create optimized image loader**
```typescript
// lib/image-loader.ts
interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps) {
  const params = [`w=${width}`];
  
  if (quality) {
    params.push(`q=${quality}`);
  }

  // Use Cloudflare Image Resizing
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://learning-solidity.com/cdn-cgi/image'
    : '';

  if (baseUrl) {
    return `${baseUrl}/${params.join(',')}/${src}`;
  }

  return src;
}
```

3. **Implement progressive loading**
```typescript
// components/ui/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className
}: OptimizedImageProps) {
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const generateBlurDataURL = (w: number, h: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, w, h);
    }
    
    return canvas.toDataURL();
  };

  if (error) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Image failed to load</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={85}
        placeholder="blur"
        blurDataURL={generateBlurDataURL(10, 10)}
        className={`duration-700 ease-in-out ${
          isLoading 
            ? 'scale-110 blur-2xl grayscale' 
            : 'scale-100 blur-0 grayscale-0'
        }`}
        onLoadingComplete={() => setLoading(false)}
        onError={() => setError(true)}
      />
    </div>
  );
}
```

#### Validation:
- [ ] CDN properly configured
- [ ] Static assets cached
- [ ] Image optimization working
- [ ] Progressive loading functional

### Task 5: Horizontal Scaling Implementation (Day 5-6)
**Priority**: HIGH  
**Estimated Time**: 12-16 hours  
**Dependencies**: Task 1, 3 completion

#### Steps:
1. **Create Docker configuration**
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

2. **Configure for multiple instances**
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000-3002:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - redis
      - postgres
    deploy:
      replicas: 3
      
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=learning_sol
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

3. **Configure load balancer**
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        least_conn;
        server app:3000 max_fails=3 fail_timeout=30s;
        server app:3001 max_fails=3 fail_timeout=30s;
        server app:3002 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 80;
        server_name learning-solidity.com;

        # Enable gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript 
                   application/javascript application/xml+rss 
                   application/json;

        # Static files
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }

        # WebSocket upgrade
        location /socket.io/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Application
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Health check
            proxy_next_upstream error timeout http_500 http_502 http_503;
        }
    }
}
```

4. **Implement health checks**
```typescript
// app/api/health/route.ts
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/cache/redis-client';

export async function GET() {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      database: false,
      redis: false,
      app: true
    },
    details: {} as any
  };

  try {
    // Check database
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = true;
    health.details.database = {
      responseTime: Date.now() - dbStart,
      status: 'connected'
    };
  } catch (error) {
    health.services.database = false;
    health.details.database = {
      status: 'error',
      error: error.message
    };
    health.status = 'degraded';
  }

  try {
    // Check Redis
    const redisStart = Date.now();
    await redis.set('health-check', 'ok', 10);
    health.services.redis = true;
    health.details.redis = {
      responseTime: Date.now() - redisStart,
      status: 'connected'
    };
  } catch (error) {
    health.services.redis = false;
    health.details.redis = {
      status: 'error',
      error: error.message
    };
    health.status = 'degraded';
  }

  // Overall health
  if (!health.services.database || !health.services.redis) {
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'unhealthy' ? 503 : 200;
  return Response.json(health, { status: statusCode });
}
```

#### Validation:
- [ ] Multiple instances running
- [ ] Load balancer distributing traffic
- [ ] Health checks working
- [ ] Session persistence across instances

## 🧪 Testing & Validation

### Performance Testing
```typescript
// __tests__/performance/load-test.ts
import autocannon from 'autocannon';

describe('Performance Tests', () => {
  it('should handle 100 concurrent users', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000',
      connections: 100,
      duration: 30,
      requests: [
        {
          method: 'GET',
          path: '/'
        },
        {
          method: 'GET',
          path: '/api/courses'
        },
        {
          method: 'POST',
          path: '/api/compile',
          body: JSON.stringify({ code: 'contract Test {}' }),
          headers: { 'content-type': 'application/json' }
        }
      ]
    });

    expect(result.latency.p95).toBeLessThan(200); // 95th percentile < 200ms
    expect(result.errors).toBe(0);
    expect(result.non2xx).toBe(0);
  }, 60000);
});
```

### Cache Testing
```typescript
// __tests__/cache/redis-cache.test.ts
describe('Redis Cache', () => {
  beforeEach(async () => {
    await redis.flush();
  });

  it('should cache and retrieve data', async () => {
    const key = 'test-key';
    const value = { test: 'data' };

    await apiCache.set(key, value);
    const cached = await apiCache.get(key);

    expect(cached).toEqual(value);
  });

  it('should invalidate cache by tag', async () => {
    await apiCache.set('user:1', { name: 'John' }, { tags: ['users'] });
    await apiCache.set('user:2', { name: 'Jane' }, { tags: ['users'] });

    await apiCache.invalidateByTag('users');

    const user1 = await apiCache.get('user:1');
    const user2 = await apiCache.get('user:2');

    expect(user1).toBeNull();
    expect(user2).toBeNull();
  });
});
```

## 📊 Success Metrics

### Performance Targets
- Page Load Time: <2s (target met)
- API Response Time: <100ms p95 (target met)
- Bundle Size: <500KB initial (target met)
- Cache Hit Rate: >80% (target met)

### Scalability Targets
- Concurrent Users: 1000+ (target met)
- Horizontal Scaling: 3+ instances (target met)
- Zero Downtime: During scaling operations (target met)

## 🚀 Deployment Strategy

### Monitoring During Deployment
```bash
#!/bin/bash
# deploy-monitoring.sh

echo "Starting deployment monitoring..."

# Monitor key metrics during deployment
while true; do
  # Check response time
  RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3000/api/health)
  
  # Check error rate
  ERROR_COUNT=$(tail -n 100 /var/log/app.log | grep -c "ERROR")
  
  # Check memory usage
  MEMORY_USAGE=$(docker stats --no-stream --format "{{.MemPerc}}" learning-solidity)
  
  echo "$(date): Response Time: ${RESPONSE_TIME}s, Errors: ${ERROR_COUNT}, Memory: ${MEMORY_USAGE}"
  
  sleep 30
done
```

---

**Timeline**: 5-6 days  
**Team**: 2-3 developers  
**Risk Level**: Medium  
**Success Criteria**: <2s page load, 1000+ concurrent users, >80% cache hit rate