# 🔧 Phase 1 PRP: Critical Infrastructure & Security

## 🎯 Objective
Establish a stable foundation by migrating from SQLite to PostgreSQL and eliminating all critical security vulnerabilities to ensure platform reliability and safety.

## 📋 Requirements

### Functional Requirements
1. **Database Migration**: Complete migration from SQLite to PostgreSQL with zero data loss
2. **WebSocket Security**: Implement proper JWT-based authentication for real-time features
3. **XSS Protection**: Comprehensive input sanitization and output encoding
4. **Dependency Security**: Update all vulnerable packages to secure versions
5. **Authentication Hardening**: Strengthen session management and token validation

### Non-Functional Requirements
- **Performance**: Database queries must execute in <50ms (95th percentile)
- **Security**: Zero critical vulnerabilities in security scan
- **Reliability**: 99.9% uptime during migration process
- **Rollback**: Complete rollback capability within 5 minutes

## 🏗️ Technical Architecture

### Database Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                 Connection Pool                              │
│                (PgBouncer/Prisma)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│              PostgreSQL Primary                              │
│            (Supabase/Neon/RDS)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│              Read Replicas (2+)                             │
│           (Read-heavy operations)                           │
└─────────────────────────────────────────────────────────────┘
```

### Security Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    WAF/CloudFlare                           │
│              (DDoS + Basic Protection)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                 API Gateway                                  │
│            (Rate Limiting + Auth)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│              Application Server                              │
│        (Input Validation + Sanitization)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│             Secure Database                                  │
│        (Encryption at Rest + Transit)                      │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Implementation Plan

### Task 1: Database Migration Setup (Day 1)
**Priority**: CRITICAL  
**Estimated Time**: 6-8 hours  
**Dependencies**: None

#### Steps:
1. **Set up PostgreSQL instance**
```bash
# Option 1: Supabase (Recommended for rapid setup)
npx supabase start
npx supabase db reset

# Option 2: Local PostgreSQL
docker run --name postgres-learning-sol \
  -e POSTGRES_DB=learning_sol \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=secure_password \
  -p 5432:5432 \
  -d postgres:15
```

2. **Update Prisma configuration**
```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [uuid_ossp, pgcrypto]
}
```

3. **Create environment variables**
```env
# .env.local
DATABASE_URL="postgresql://postgres:secure_password@localhost:5432/learning_sol?schema=public"
SHADOW_DATABASE_URL="postgresql://postgres:secure_password@localhost:5432/learning_sol_shadow?schema=public"
```

#### Validation:
- [ ] PostgreSQL instance running
- [ ] Prisma client generates successfully
- [ ] Test connection established

### Task 2: Schema Migration (Day 1-2)
**Priority**: CRITICAL  
**Estimated Time**: 8-10 hours  
**Dependencies**: Task 1 completion

#### Steps:
1. **Optimize schema for PostgreSQL**
```sql
-- Add PostgreSQL-specific optimizations
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Optimized indexes
CREATE INDEX CONCURRENTLY idx_users_email_username ON users(email, username);
CREATE INDEX CONCURRENTLY idx_user_progress_user_lesson ON user_progress(user_id, lesson_id);
CREATE INDEX CONCURRENTLY idx_achievements_user_created ON user_achievement(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_collaboration_session_active ON collaboration_session(active, created_at);

-- Partial indexes for performance
CREATE INDEX CONCURRENTLY idx_users_active ON users(id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_lessons_published ON lessons(id) WHERE published = true;
```

2. **Create migration script**
```typescript
// scripts/migrate-to-postgresql.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const sqlitePrisma = new PrismaClient({
  datasources: { db: { url: 'file:./dev.db' } }
});

const postgresqlPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

export async function migrateData() {
  console.log('Starting data migration...');
  
  try {
    // 1. Migrate users
    const users = await sqlitePrisma.user.findMany();
    console.log(`Migrating ${users.length} users...`);
    
    for (const user of users) {
      await postgresqlPrisma.user.create({
        data: {
          ...user,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      });
    }
    
    // 2. Migrate courses
    const courses = await sqlitePrisma.course.findMany();
    console.log(`Migrating ${courses.length} courses...`);
    
    await postgresqlPrisma.course.createMany({
      data: courses.map(course => ({
        ...course,
        createdAt: new Date(course.createdAt),
        updatedAt: new Date(course.updatedAt)
      }))
    });
    
    // 3. Migrate progress (with relations)
    const progress = await sqlitePrisma.userProgress.findMany();
    console.log(`Migrating ${progress.length} progress records...`);
    
    await postgresqlPrisma.userProgress.createMany({
      data: progress.map(p => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }))
    });
    
    console.log('Data migration completed successfully!');
    
    // Verify data integrity
    const postgresUsers = await postgresqlPrisma.user.count();
    const sqliteUsers = await sqlitePrisma.user.count();
    
    if (postgresUsers !== sqliteUsers) {
      throw new Error(`User count mismatch: SQLite=${sqliteUsers}, PostgreSQL=${postgresUsers}`);
    }
    
    console.log('Data integrity verified!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sqlitePrisma.$disconnect();
    await postgresqlPrisma.$disconnect();
  }
}
```

3. **Create rollback script**
```typescript
// scripts/rollback-to-sqlite.ts
export async function rollbackToSQLite() {
  console.log('Rolling back to SQLite...');
  
  // Update .env to use SQLite
  const envContent = fs.readFileSync('.env', 'utf8');
  const updatedEnv = envContent.replace(
    /DATABASE_URL=.*/,
    'DATABASE_URL="file:./prisma/dev.db"'
  );
  fs.writeFileSync('.env', updatedEnv);
  
  // Regenerate Prisma client
  execSync('npx prisma generate');
  
  console.log('Rollback completed!');
}
```

#### Validation:
- [ ] All tables migrated successfully
- [ ] Data counts match between databases
- [ ] Foreign key relationships intact
- [ ] Indexes created and optimized

### Task 3: WebSocket Security Implementation (Day 2)
**Priority**: CRITICAL  
**Estimated Time**: 6-8 hours  
**Dependencies**: None

#### Steps:
1. **Implement JWT validation for WebSocket**
```typescript
// socket-server/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    role: string;
    sessionId: string;
  };
}

export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    
    if (!decoded.userId) {
      return next(new Error('Invalid token: missing userId'));
    }
    
    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, deletedAt: true }
    });
    
    if (!user || user.deletedAt) {
      return next(new Error('User not found or inactive'));
    }
    
    // Attach user data to socket
    (socket as AuthenticatedSocket).data = {
      userId: user.id,
      role: user.role,
      sessionId: decoded.sessionId || crypto.randomUUID()
    };
    
    console.log(`User ${user.id} authenticated for WebSocket`);
    next();
    
  } catch (error) {
    console.error('WebSocket authentication failed:', error);
    next(new Error('Authentication failed'));
  }
};
```

2. **Add rate limiting for WebSocket connections**
```typescript
// socket-server/middleware/rateLimit.ts
import { RateLimiterMemory } from 'rate-limiter-flexible';

const connectionLimiter = new RateLimiterMemory({
  keyPrefix: 'ws_connect',
  points: 5, // 5 connections
  duration: 60, // per 60 seconds
});

const messageLimiter = new RateLimiterMemory({
  keyPrefix: 'ws_message',
  points: 100, // 100 messages
  duration: 60, // per 60 seconds
});

export const rateLimitConnection = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const clientIP = socket.handshake.address;
    await connectionLimiter.consume(clientIP);
    next();
  } catch (error) {
    next(new Error('Too many connection attempts. Please try again later.'));
  }
};

export const rateLimitMessage = async (socket: AuthenticatedSocket) => {
  const userId = socket.data.userId;
  
  socket.use(async ([event, ...args], next) => {
    try {
      await messageLimiter.consume(userId);
      next();
    } catch (error) {
      socket.emit('error', { message: 'Rate limit exceeded' });
    }
  });
};
```

3. **Secure room management**
```typescript
// socket-server/handlers/collaboration.ts
export const handleJoinRoom = async (socket: AuthenticatedSocket, data: { roomId: string; courseId: string }) => {
  const { roomId, courseId } = data;
  const userId = socket.data.userId;
  
  try {
    // Verify user has access to the course
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE'
      }
    });
    
    if (!enrollment) {
      socket.emit('error', { message: 'Access denied: Not enrolled in course' });
      return;
    }
    
    // Check room capacity
    const roomSockets = await io.in(roomId).fetchSockets();
    if (roomSockets.length >= 50) { // Max 50 users per room
      socket.emit('error', { message: 'Room is full' });
      return;
    }
    
    // Join room
    await socket.join(roomId);
    
    // Track active session
    await prisma.collaborationSession.create({
      data: {
        userId,
        roomId,
        courseId,
        joinedAt: new Date()
      }
    });
    
    // Notify other users
    socket.to(roomId).emit('user:joined', {
      userId,
      username: enrollment.user.username,
      joinedAt: new Date()
    });
    
    socket.emit('room:joined', { roomId, userCount: roomSockets.length + 1 });
    
  } catch (error) {
    console.error('Join room error:', error);
    socket.emit('error', { message: 'Failed to join room' });
  }
};
```

#### Validation:
- [ ] JWT tokens properly validated
- [ ] Rate limiting prevents abuse
- [ ] Room access control working
- [ ] Error handling comprehensive

### Task 4: XSS Protection Enhancement (Day 2-3)
**Priority**: HIGH  
**Estimated Time**: 6-8 hours  
**Dependencies**: None

#### Steps:
1. **Implement comprehensive input sanitization**
```typescript
// lib/security/sanitization.ts
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  maxLength?: number;
  stripHtml?: boolean;
}

export const sanitizeInput = (
  input: string,
  options: SanitizationOptions = {}
): string => {
  if (!input || typeof input !== 'string') return '';
  
  const {
    allowedTags = ['b', 'i', 'em', 'strong', 'code', 'pre'],
    allowedAttributes = ['href', 'title'],
    maxLength = 10000,
    stripHtml = false
  } = options;
  
  // Truncate if too long
  let sanitized = input.length > maxLength ? input.substring(0, maxLength) : input;
  
  if (stripHtml) {
    // Strip all HTML
    sanitized = validator.stripLow(sanitized);
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } else {
    // Sanitize HTML but keep allowed tags
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttributes,
      ALLOW_DATA_ATTR: false,
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'iframe'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });
  }
  
  // Additional security checks
  if (sanitized.includes('javascript:') || sanitized.includes('data:')) {
    sanitized = sanitized.replace(/javascript:/gi, '').replace(/data:/gi, '');
  }
  
  return sanitized;
};

// Specific sanitizers for different contexts
export const sanitizers = {
  code: (input: string) => sanitizeInput(input, { 
    stripHtml: true, 
    maxLength: 50000 
  }),
  
  username: (input: string) => sanitizeInput(input, { 
    stripHtml: true, 
    maxLength: 50 
  }),
  
  message: (input: string) => sanitizeInput(input, { 
    allowedTags: ['b', 'i', 'em', 'strong', 'code'],
    maxLength: 1000 
  }),
  
  description: (input: string) => sanitizeInput(input, { 
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'code', 'pre'],
    maxLength: 5000 
  })
};
```

2. **Create validation middleware**
```typescript
// lib/api/middleware/validation.ts
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput, sanitizers } from '../security/sanitization';

export interface ValidationRule {
  field: string;
  type: 'string' | 'email' | 'url' | 'code' | 'username' | 'message';
  required?: boolean;
  maxLength?: number;
  pattern?: RegExp;
}

export const createValidationMiddleware = (rules: ValidationRule[]) => {
  return async (req: NextRequest) => {
    try {
      const body = await req.json();
      const sanitized: any = {};
      const errors: string[] = [];
      
      for (const rule of rules) {
        const value = body[rule.field];
        
        // Check required fields
        if (rule.required && (!value || value.trim() === '')) {
          errors.push(`${rule.field} is required`);
          continue;
        }
        
        if (value) {
          // Sanitize based on type
          let sanitizedValue: string;
          
          switch (rule.type) {
            case 'email':
              if (!validator.isEmail(value)) {
                errors.push(`${rule.field} must be a valid email`);
                continue;
              }
              sanitizedValue = validator.normalizeEmail(value) || '';
              break;
              
            case 'url':
              if (!validator.isURL(value)) {
                errors.push(`${rule.field} must be a valid URL`);
                continue;
              }
              sanitizedValue = value;
              break;
              
            case 'code':
              sanitizedValue = sanitizers.code(value);
              break;
              
            case 'username':
              sanitizedValue = sanitizers.username(value);
              if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedValue)) {
                errors.push(`${rule.field} can only contain letters, numbers, underscore and dash`);
                continue;
              }
              break;
              
            case 'message':
              sanitizedValue = sanitizers.message(value);
              break;
              
            default:
              sanitizedValue = sanitizeInput(value, { maxLength: rule.maxLength });
          }
          
          // Check pattern if provided
          if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
            errors.push(`${rule.field} format is invalid`);
            continue;
          }
          
          sanitized[rule.field] = sanitizedValue;
        }
      }
      
      if (errors.length > 0) {
        return NextResponse.json(
          { error: 'Validation failed', details: errors },
          { status: 400 }
        );
      }
      
      // Attach sanitized data to request
      (req as any).sanitizedBody = sanitized;
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }
  };
};
```

3. **Update Content Security Policy**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Enhanced Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' ws: wss: https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### Validation:
- [ ] All user inputs properly sanitized
- [ ] XSS injection attempts blocked
- [ ] CSP headers configured correctly
- [ ] Validation middleware working

### Task 5: Dependency Security Updates (Day 3)
**Priority**: HIGH  
**Estimated Time**: 4-6 hours  
**Dependencies**: None

#### Steps:
1. **Update vulnerable packages**
```bash
# Run security audit
npm audit

# Update specific vulnerable packages
npm update @eslint/plugin-kit
npm update cookie
npm update prismjs

# For packages that can't be updated, add overrides
# package.json
{
  "overrides": {
    "@eslint/plugin-kit": "^0.2.0",
    "cookie": "^0.7.0",
    "prismjs": "^1.29.0"
  }
}
```

2. **Implement automated dependency scanning**
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1' # Weekly on Mondays

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --audit-level=high
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

3. **Create security monitoring script**
```typescript
// scripts/security-monitor.ts
import { execSync } from 'child_process';
import fs from 'fs';

export async function runSecurityChecks() {
  const results = {
    timestamp: new Date().toISOString(),
    npmAudit: null as any,
    dependencyCheck: null as any,
    codeScanning: null as any
  };
  
  try {
    // NPM Audit
    console.log('Running npm audit...');
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
    results.npmAudit = JSON.parse(auditOutput);
    
    // Dependency vulnerability check
    console.log('Running dependency check...');
    try {
      execSync('dependency-check --project "Learning Solidity" --scan . --format JSON --out dependency-check-report.json');
      results.dependencyCheck = JSON.parse(fs.readFileSync('dependency-check-report.json', 'utf8'));
    } catch (error) {
      console.log('Dependency check not available, skipping...');
    }
    
    // Generate report
    const report = {
      critical: results.npmAudit?.metadata?.vulnerabilities?.critical || 0,
      high: results.npmAudit?.metadata?.vulnerabilities?.high || 0,
      moderate: results.npmAudit?.metadata?.vulnerabilities?.moderate || 0,
      low: results.npmAudit?.metadata?.vulnerabilities?.low || 0,
      total: results.npmAudit?.metadata?.vulnerabilities?.total || 0
    };
    
    console.log('Security Report:', report);
    
    // Save detailed report
    fs.writeFileSync('security-report.json', JSON.stringify(results, null, 2));
    
    if (report.critical > 0 || report.high > 0) {
      console.error('❌ Critical or high severity vulnerabilities found!');
      process.exit(1);
    } else {
      console.log('✅ No critical or high severity vulnerabilities found');
    }
    
  } catch (error) {
    console.error('Security check failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSecurityChecks();
}
```

#### Validation:
- [ ] No high/critical vulnerabilities remain
- [ ] Automated scanning configured
- [ ] Security monitoring active
- [ ] Dependency updates completed

## 🧪 Testing & Validation

### Database Migration Testing
```typescript
// __tests__/migration/database.test.ts
describe('Database Migration', () => {
  let sqliteClient: PrismaClient;
  let postgresqlClient: PrismaClient;
  
  beforeAll(async () => {
    sqliteClient = new PrismaClient({
      datasources: { db: { url: 'file:./test.db' } }
    });
    
    postgresqlClient = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } }
    });
  });
  
  it('should migrate all data without loss', async () => {
    // Create test data in SQLite
    const testUser = await sqliteClient.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword'
      }
    });
    
    // Run migration
    await migrateData();
    
    // Verify data in PostgreSQL
    const migratedUser = await postgresqlClient.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    expect(migratedUser).toBeTruthy();
    expect(migratedUser!.username).toBe(testUser.username);
    expect(migratedUser!.id).toBe(testUser.id);
  });
  
  it('should maintain referential integrity', async () => {
    const userCount = await postgresqlClient.user.count();
    const progressCount = await postgresqlClient.userProgress.count();
    
    // Check for orphaned records
    const orphanedProgress = await postgresqlClient.userProgress.findMany({
      where: {
        user: null
      }
    });
    
    expect(orphanedProgress).toHaveLength(0);
  });
  
  afterAll(async () => {
    await sqliteClient.$disconnect();
    await postgresqlClient.$disconnect();
  });
});
```

### Security Testing
```typescript
// __tests__/security/websocket.test.ts
describe('WebSocket Security', () => {
  let io: Server;
  let clientSocket: Socket;
  
  beforeAll(async () => {
    io = new Server(8080);
    io.use(authenticateSocket);
  });
  
  it('should reject connections without valid JWT', (done) => {
    const client = ioc('http://localhost:8080');
    
    client.on('connect_error', (error) => {
      expect(error.message).toContain('Authentication');
      done();
    });
  });
  
  it('should accept connections with valid JWT', (done) => {
    const token = jwt.sign(
      { userId: 'test-user-id' },
      process.env.NEXTAUTH_SECRET!
    );
    
    const client = ioc('http://localhost:8080', {
      auth: { token }
    });
    
    client.on('connect', () => {
      expect(client.connected).toBe(true);
      client.disconnect();
      done();
    });
  });
  
  afterAll(() => {
    io.close();
  });
});
```

## 📊 Success Metrics

### Database Performance
- Query response time < 50ms (95th percentile)
- Connection pool utilization < 80%
- Zero failed migrations

### Security Metrics
- Zero critical/high vulnerabilities
- 100% input sanitization coverage
- JWT validation success rate > 99%

### Reliability Metrics
- Migration uptime > 99.9%
- Zero data loss incidents
- Rollback time < 5 minutes

## 🚀 Deployment Strategy

### Pre-deployment Checklist
- [ ] PostgreSQL instance configured
- [ ] Environment variables updated
- [ ] Migration scripts tested
- [ ] Rollback procedures verified
- [ ] Security scan passed
- [ ] Performance benchmarks met

### Deployment Steps
1. **Preparation**
   - Create PostgreSQL instance
   - Update environment variables
   - Test migration scripts

2. **Migration Window**
   - Enable maintenance mode
   - Run data migration
   - Verify data integrity
   - Update application configuration

3. **Validation**
   - Run health checks
   - Verify all functionality
   - Monitor error rates
   - Performance validation

4. **Go-Live**
   - Disable maintenance mode
   - Monitor system metrics
   - Have rollback ready

### Rollback Plan
```bash
# Emergency rollback procedure
#!/bin/bash
echo "Initiating emergency rollback..."

# 1. Enable maintenance mode
curl -X POST "$APP_URL/api/maintenance" -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. Switch back to SQLite
export DATABASE_URL="file:./prisma/dev.db"

# 3. Restart application
pm2 restart learning-solidity

# 4. Verify rollback
curl "$APP_URL/api/health"

echo "Rollback completed"
```

## 📈 Monitoring & Alerting

### Key Metrics to Monitor
- Database connection count
- Query response times
- Authentication success rate
- WebSocket connection count
- Security incident count

### Alerts Configuration
```yaml
# Prometheus alerting rules
groups:
  - name: phase1-critical
    rules:
      - alert: DatabaseConnectionHigh
        expr: db_connections_active / db_connections_max > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High database connection usage
          
      - alert: AuthenticationFailureHigh
        expr: rate(auth_failures_total[5m]) > 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: High authentication failure rate
```

---

**Timeline**: 3 days  
**Team**: 1-2 developers  
**Risk Level**: Medium (with proper rollback procedures)  
**Success Criteria**: Zero data loss, <50ms query times, zero critical vulnerabilities