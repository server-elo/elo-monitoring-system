# Database Query Optimization & Indexing Strategy

## 📊 Current Schema Analysis

### Existing Indexes (Good)
```prisma
// User model
@@index([role])
@@index([createdAt])
@@index([email, role])

// UserProgress model  
@@index([userId, status])
@@index([userId, completedAt])
@@index([courseId, status])

// UserAchievement model
@@index([userId, isCompleted])
@@index([userId, unlockedAt])

// ChatMessage model
@@index([collaborationId, createdAt])
@@index([userId, createdAt])
```

### Missing Critical Indexes

Based on common query patterns in learning platforms, we need these additional indexes:

## 🎯 High-Impact Indexes to Add

### 1. Course Discovery & Filtering
```prisma
model Course {
  // Current: @@index([isPublished, difficulty])
  // Add compound indexes for common filter combinations
  @@index([isPublished, difficulty, createdAt]) // Browse published courses by difficulty, newest first
  @@index([isPublished, estimatedHours]) // Filter by time commitment
  @@index([difficulty, xpReward]) // Learning path optimization
}
```

### 2. User Learning Progress
```prisma
model CourseEnrollment {
  // Add indexes for dashboard queries
  @@index([userId, progress, lastStudied]) // Student dashboard - current progress
  @@index([courseId, progress]) // Course analytics - completion rates
  @@index([userId, completedAt]) // Certificate generation
}
```

### 3. Submission & Assessment
```prisma
model Submission {
  // Current: Basic indexes on userId, lessonId, projectId
  // Add compound indexes for grading workflows
  @@index([status, submittedAt]) // Instructor grading queue
  @@index([userId, status, score]) // Student progress tracking
  @@index([lessonId, status, submittedAt]) // Lesson-specific analytics
  @@index([projectId, score]) // Project leaderboards
}
```

### 4. Social Features & Collaboration
```prisma
model Collaboration {
  // Current: @@index([status, type, isPublic])
  // Add time-based indexes for active sessions
  @@index([status, updatedAt]) // Recently active collaborations
  @@index([type, isPublic, createdAt]) // Browse public collaborations
}

model Review {
  // Add indexes for review systems
  @@index([submissionId, overall, createdAt]) // Review sorting
  @@index([reviewerId, createdAt]) // Reviewer activity
}
```

### 5. Gamification & Analytics
```prisma
model UserProfile {
  // Add indexes for leaderboards and matchmaking
  @@index([skillLevel, totalXP]) // Skill-based leaderboards
  @@index([currentLevel, lastActiveDate]) // Active users by level
  @@index([currentStreak, totalXP]) // Streak leaderboards
}

model LearningAnalytics {
  // Add indexes for AI recommendations
  @@index([averageScore, improvementRate]) // Performance analytics
  @@index([userId, lastUpdated]) // Analytics refresh queries
}
```

## 🚀 Query Optimization Patterns

### 1. Pagination Optimization
```sql
-- Instead of OFFSET (slow on large datasets)
SELECT * FROM courses 
WHERE created_at < '2024-01-01' 
ORDER BY created_at DESC 
LIMIT 10;

-- Use cursor-based pagination with indexed columns
```

### 2. Dashboard Queries
```sql
-- Student dashboard - single query with joins
SELECT 
  c.title,
  ce.progress,
  ce.last_studied,
  ce.time_spent
FROM course_enrollments ce
JOIN courses c ON c.id = ce.course_id
WHERE ce.user_id = ? 
  AND ce.progress > 0
ORDER BY ce.last_studied DESC
LIMIT 5;
```

### 3. Analytics Aggregations
```sql
-- Course completion rates - optimized with proper indexes
SELECT 
  c.id,
  c.title,
  COUNT(ce.id) as enrollments,
  COUNT(CASE WHEN ce.progress = 1.0 THEN 1 END) as completions,
  AVG(ce.progress) as avg_progress
FROM courses c
LEFT JOIN course_enrollments ce ON c.id = ce.course_id
WHERE c.is_published = true
GROUP BY c.id, c.title
ORDER BY avg_progress DESC;
```

## 📈 Performance Improvements Expected

### Before Optimization:
- Course listing: ~200ms (full table scan)
- User dashboard: ~150ms (multiple queries)
- Leaderboards: ~500ms (sorting without indexes)
- Search queries: ~300ms (no text indexes)

### After Optimization:
- Course listing: ~20ms (index scan)
- User dashboard: ~30ms (single optimized query)  
- Leaderboards: ~50ms (indexed sorting)
- Search queries: ~40ms (with text indexes)

## 🔧 Implementation Strategy

### Phase 1: Critical Performance Indexes
```prisma
// Add these immediately for 80% of performance gains
@@index([isPublished, difficulty, createdAt]) // Course discovery
@@index([userId, progress, lastStudied]) // User dashboards
@@index([status, submittedAt]) // Grading workflows
@@index([skillLevel, totalXP]) // Leaderboards
```

### Phase 2: Advanced Analytics Indexes
```prisma
// Add these for analytics and reporting
@@index([userId, status, score]) // Progress analytics
@@index([courseId, progress]) // Course analytics
@@index([type, isPublic, createdAt]) // Social features
```

### Phase 3: Full-Text Search
```sql
-- Add full-text search capabilities (PostgreSQL)
CREATE INDEX course_search_idx ON courses 
USING GIN(to_tsvector('english', title || ' ' || description));

-- SQLite alternative - add search fields
ALTER TABLE courses ADD COLUMN search_text TEXT;
CREATE INDEX course_search_idx ON courses(search_text);
```

## 📊 Monitoring & Validation

### Query Performance Monitoring
```typescript
// Add query timing to all database operations
const startTime = Date.now();
const result = await prisma.course.findMany({...});
const queryTime = Date.now() - startTime;

logger.info('Database query performance', {
  operation: 'course.findMany',
  duration: queryTime,
  resultCount: result.length
});
```

### Index Usage Analysis
```sql
-- PostgreSQL - Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- SQLite - Use EXPLAIN QUERY PLAN
EXPLAIN QUERY PLAN
SELECT * FROM courses 
WHERE is_published = true 
  AND difficulty = 'INTERMEDIATE'
ORDER BY created_at DESC;
```

## 🎯 Success Metrics

### Performance Targets:
- API response time: < 100ms for 95% of requests
- Database query time: < 50ms for 95% of queries
- Page load time: < 2s for learning content
- Search response: < 200ms for all search queries

### Scalability Targets:
- Support 10,000+ concurrent users
- Handle 1M+ submissions efficiently
- Process 100K+ daily active learners
- Maintain performance with 1TB+ data

## 🔄 Migration Plan

### Week 1: Add Critical Indexes
1. Add performance-critical compound indexes
2. Update most frequent queries to use indexes
3. Monitor query performance improvements

### Week 2: Optimize Query Patterns  
1. Refactor dashboard queries for efficiency
2. Implement cursor-based pagination
3. Add query performance monitoring

### Week 3: Advanced Features
1. Add full-text search indexes
2. Implement analytics query optimizations
3. Add database performance dashboards

### Week 4: Validation & Tuning
1. Load testing with optimized queries
2. Fine-tune index selection based on usage
3. Document query patterns for developers