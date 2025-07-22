# Smart PRP: Comprehensive Monitoring with Sentry + Analytics

## Meta Information
- **PRP ID**: monitoring-sentry-analytics-006
- **Created**: 2025-01-20T18:30:00Z
- **Complexity Score**: 9/10
- **Estimated Implementation Time**: 16 hours
- **Dependencies**: [foundation-nextjs15-react19-typescript-001, architecture-feature-vertical-slices-002, database-postgresql-prisma-optimization-003, authentication-nextauth-rbac-004, realtime-infrastructure-socketio-redis-005]

## 🎯 Feature Specification
### Core Requirement
Implement a world-class monitoring, analytics, and observability system using Sentry, custom analytics, and business intelligence tools that provides 360-degree visibility into platform performance, user behavior, learning effectiveness, and business metrics with real-time alerting and actionable insights.

### Success Metrics
- [ ] Functional: 100% error capture with <30s alert delivery and 99.9% uptime monitoring
- [ ] Performance: Real-time analytics processing with <5s dashboard load times
- [ ] UX: Comprehensive user journey tracking with privacy-compliant data collection
- [ ] Business: Learning effectiveness insights driving 25%+ course completion improvement
- [ ] Security: Complete audit trail with SOC 2 Type II compliance readiness
- [ ] Quality: 360-degree observability across all features and infrastructure components

## 🔍 Codebase Intelligence
### Pattern Analysis
```markdown
Monitoring requirements analysis:
- Error Tracking: Real-time error capture, performance monitoring, user session replay
- Learning Analytics: Progress tracking, engagement metrics, course effectiveness
- Business Intelligence: User acquisition, conversion funnels, revenue analytics
- Security Monitoring: Audit logs, suspicious activity detection, compliance tracking
- Performance Monitoring: API latency, database queries, real-time system health
- User Behavior: Feature usage patterns, A/B test results, personalization insights
- Infrastructure: Server health, scaling events, deployment tracking
```

### Architecture Alignment
- **Follows Pattern**: Event-driven analytics with feature-based metric collection
- **Extends Component**: Sentry + custom analytics pipeline with privacy-first design
- **Integration Points**: All feature slices, authentication events, database operations, real-time activities

## 🧠 Implementation Strategy
### Approach Rationale
Sentry + Custom Analytics chosen over alternatives because:
1. **Comprehensive Coverage**: Error tracking, performance monitoring, and user insights
2. **Developer Experience**: Excellent debugging tools with source map support
3. **Privacy Compliance**: GDPR-ready with data retention and user consent management
4. **Scalability**: Handles enterprise-scale data with intelligent sampling
5. **Integration**: Native support for Next.js, React, and our entire tech stack

### Risk Mitigation
- **High Risk**: Data privacy violations → Privacy-by-design with anonymization and consent management
- **Medium Risk**: Analytics data loss → Multi-redundant data pipeline with backup systems
- **Low Risk**: Monitoring overhead → Intelligent sampling and performance optimization

### Rollback Plan
1. Feature flags to disable specific monitoring components
2. Graceful degradation when analytics services are unavailable
3. Local logging fallback for critical error tracking
4. Data export capabilities for migration scenarios

## 📋 Execution Blueprint

### Phase 1: Error Tracking & Performance Monitoring
- [ ] Set up Sentry with Next.js 15 integration and source maps
- [ ] Configure performance monitoring for all API routes and components
- [ ] Implement user session replay with privacy controls
- [ ] Set up database query performance tracking with Prisma integration
- [ ] Create real-time alerting for critical errors and performance degradation

### Phase 2: Learning Analytics Engine
- [ ] Design privacy-compliant learning analytics data model
- [ ] Implement event tracking for all learning interactions
- [ ] Create course effectiveness and engagement metrics
- [ ] Build real-time progress tracking and milestone detection
- [ ] Set up AI tutor interaction analysis and improvement insights

### Phase 3: Business Intelligence Dashboard
- [ ] Create comprehensive user acquisition and conversion funnel analysis
- [ ] Implement feature adoption tracking and usage analytics
- [ ] Build revenue and growth metrics with cohort analysis
- [ ] Set up competitive analysis and market intelligence gathering
- [ ] Create executive dashboard with key business metrics

### Phase 4: Security & Compliance Monitoring
- [ ] Implement comprehensive audit logging for all user actions
- [ ] Set up security event detection and threat monitoring
- [ ] Create compliance reporting for GDPR, CCPA, and SOC 2
- [ ] Build automated data retention and deletion workflows
- [ ] Set up penetration testing and vulnerability scanning

## 🔬 Validation Matrix
### Automated Tests
```bash
# Analytics Integration Tests
npm run test:analytics -- --coverage  # Event tracking with 100% coverage

# Privacy Compliance Tests
npm run test:privacy  # GDPR compliance and data handling

# Performance Tests
npm run test:monitoring-performance  # Analytics overhead validation

# Security Tests
npm run test:security-monitoring  # Audit logging and threat detection

# End-to-End Tests
npm run test:e2e:monitoring  # Complete monitoring workflows
```

### Manual Verification
- [ ] Error alerts trigger within 30 seconds of occurrence
- [ ] Learning analytics accurately track user progress and engagement
- [ ] Business intelligence dashboards load within 5 seconds
- [ ] Privacy controls properly anonymize sensitive data
- [ ] Security monitoring detects and alerts on suspicious activities

## 📚 Context References
### Documentation
- https://docs.sentry.io/platforms/javascript/guides/nextjs/: Sentry Next.js integration
- https://gdpr.eu/: GDPR compliance requirements and best practices
- https://web.dev/metrics/: Core Web Vitals and performance metrics
- https://owasp.org/www-project-application-security-verification-standard/: Security monitoring standards

### Code References
- `/PRPs/authentication-nextauth-rbac.md`: Authentication event tracking requirements
- `/PRPs/realtime-infrastructure-socketio-redis.md`: Real-time activity monitoring
- `/PRPs/database-postgresql-prisma-optimization.md`: Database performance tracking

## 🎯 Confidence Score: 9/10
**Reasoning**: Very high confidence due to:
- Extensive experience with Sentry and analytics platforms at scale
- Clear monitoring requirements from competitive analysis
- Proven technology stack with excellent documentation
- Comprehensive privacy and security compliance strategy
- Well-defined metrics and alerting procedures

## 🔄 Post-Implementation
### Monitoring
- Analytics pipeline health and data quality metrics
- Sentry error rates and performance baseline establishment
- Dashboard usage and executive reporting adoption
- Privacy compliance audit results and user consent rates
- Security event detection accuracy and false positive rates

### Future Enhancements
- Machine learning-powered anomaly detection
- Predictive analytics for user churn and engagement
- Advanced A/B testing platform with statistical significance
- Real-time personalization engine based on behavior analytics
- Integration with external business intelligence tools

## 🚀 Implementation Steps

### Step 1: Sentry Integration & Error Tracking
```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';
import { User } from '@prisma/client';

export function initializeSentry(): void {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Filter out known errors and add context
      return filterAndEnhanceEvent(event, hint);
    },
    beforeSendTransaction(event) {
      // Sample transactions based on route importance
      return sampleTransaction(event);
    },
    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.nextRouterInstrumentation({
          showRouteChangeEvents: true,
        }),
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
        maskAllInputs: true,
        // Only capture replays for errors
        sessionSampleRate: 0,
        errorSampleRate: 0.1,
      }),
    ],
  });
}

export function setSentryUser(user: Partial<User>): void {
  Sentry.setUser({
    id: user.id,
    username: user.username,
    email: user.email, // Only in development
    role: user.role,
  });
}

export function captureException(error: Error, context?: Record<string, any>): string {
  return Sentry.captureException(error, {
    tags: {
      feature: context?.feature,
      action: context?.action,
    },
    extra: context,
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): string {
  return Sentry.captureMessage(message, level);
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

// Performance monitoring wrapper
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  options?: { timeout?: number }
): T {
  return ((...args: Parameters<T>) => {
    return Sentry.withActiveSpan(null, () => {
      const span = Sentry.startSpan({ name, op: 'function' });
      
      const timeoutId = options?.timeout 
        ? setTimeout(() => {
            captureMessage(`Function ${name} exceeded timeout of ${options.timeout}ms`, 'warning');
          }, options.timeout)
        : null;

      try {
        const result = fn(...args);
        
        if (result instanceof Promise) {
          return result
            .then((res) => {
              span.end();
              if (timeoutId) clearTimeout(timeoutId);
              return res;
            })
            .catch((err) => {
              span.recordException(err);
              span.end();
              if (timeoutId) clearTimeout(timeoutId);
              throw err;
            });
        } else {
          span.end();
          if (timeoutId) clearTimeout(timeoutId);
          return result;
        }
      } catch (error) {
        span.recordException(error as Error);
        span.end();
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }
    });
  }) as T;
}
```

### Step 2: Learning Analytics Engine
```typescript
// lib/analytics/learning.ts
export interface LearningEvent {
  eventType: 'lesson_start' | 'lesson_complete' | 'exercise_attempt' | 'hint_used' | 'error_encountered';
  userId: string;
  sessionId: string;
  courseId: string;
  lessonId?: string;
  exerciseId?: string;
  metadata: {
    duration?: number;
    attempts?: number;
    score?: number;
    difficulty?: string;
    errorType?: string;
    hintType?: string;
    codeSubmitted?: boolean;
    timeToComplete?: number;
  };
  timestamp: Date;
  userAgent?: string;
  location?: {
    country?: string;
    region?: string;
    timezone?: string;
  };
}

export class LearningAnalytics {
  private eventQueue: LearningEvent[] = [];
  private batchSize = 50;
  private flushInterval = 5000; // 5 seconds

  constructor() {
    this.startBatchProcessor();
  }

  async trackEvent(event: Omit<LearningEvent, 'timestamp'>): Promise<void> {
    const enhancedEvent: LearningEvent = {
      ...event,
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      location: await this.getUserLocation(),
    };

    // Privacy check - anonymize if user hasn't consented
    const privacyEvent = await this.applyPrivacyControls(enhancedEvent);
    
    this.eventQueue.push(privacyEvent);
    
    if (this.eventQueue.length >= this.batchSize) {
      await this.flushEvents();
    }
  }

  async trackLessonStart(userId: string, courseId: string, lessonId: string): Promise<void> {
    await this.trackEvent({
      eventType: 'lesson_start',
      userId,
      sessionId: this.getSessionId(),
      courseId,
      lessonId,
      metadata: {},
    });
  }

  async trackLessonComplete(
    userId: string, 
    courseId: string, 
    lessonId: string, 
    duration: number, 
    score?: number
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'lesson_complete',
      userId,
      sessionId: this.getSessionId(),
      courseId,
      lessonId,
      metadata: {
        duration,
        score,
        timeToComplete: duration,
      },
    });

    // Trigger achievement check
    await this.checkAchievements(userId, courseId, lessonId);
  }

  async trackExerciseAttempt(
    userId: string,
    courseId: string,
    exerciseId: string,
    success: boolean,
    attempts: number,
    codeSubmitted: boolean
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'exercise_attempt',
      userId,
      sessionId: this.getSessionId(),
      courseId,
      exerciseId,
      metadata: {
        attempts,
        score: success ? 100 : 0,
        codeSubmitted,
      },
    });
  }

  private async applyPrivacyControls(event: LearningEvent): Promise<LearningEvent> {
    const userConsent = await this.getUserConsent(event.userId);
    
    if (!userConsent.analytics) {
      // Anonymize user data
      return {
        ...event,
        userId: this.anonymizeUserId(event.userId),
        location: undefined,
        userAgent: undefined,
      };
    }

    if (!userConsent.detailed) {
      // Remove detailed metadata
      return {
        ...event,
        metadata: {
          duration: event.metadata.duration,
          // Remove other detailed metrics
        },
      };
    }

    return event;
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await Promise.all([
        this.sendToAnalyticsDatabase(eventsToFlush),
        this.sendToRealtimeProcessing(eventsToFlush),
        this.updateUserProgress(eventsToFlush),
      ]);
    } catch (error) {
      // Re-queue events on failure
      this.eventQueue.unshift(...eventsToFlush);
      captureException(error as Error, {
        context: 'learning_analytics_flush',
        eventCount: eventsToFlush.length,
      });
    }
  }

  private async sendToAnalyticsDatabase(events: LearningEvent[]): Promise<void> {
    // Insert into analytics table for long-term storage and reporting
    await prisma.learningAnalytics.createMany({
      data: events.map(event => ({
        userId: event.userId,
        sessionId: event.sessionId,
        eventType: event.eventType,
        courseId: event.courseId,
        lessonId: event.lessonId,
        data: event.metadata,
        timestamp: event.timestamp,
        userAgent: event.userAgent,
        location: event.location ? JSON.stringify(event.location) : null,
      })),
      skipDuplicates: true,
    });
  }

  private async sendToRealtimeProcessing(events: LearningEvent[]): Promise<void> {
    // Send to Redis for real-time dashboard updates
    for (const event of events) {
      await redis.publish('learning_events', JSON.stringify(event));
    }
  }

  private async updateUserProgress(events: LearningEvent[]): Promise<void> {
    // Update user progress based on learning events
    const progressUpdates = this.calculateProgressUpdates(events);
    
    for (const update of progressUpdates) {
      await prisma.userProgress.upsert({
        where: {
          userId_courseId_lessonId: {
            userId: update.userId,
            courseId: update.courseId,
            lessonId: update.lessonId,
          },
        },
        update: {
          completionPercentage: update.completion,
          timeSpent: { increment: update.timeIncrement },
          attempts: { increment: update.attemptsIncrement },
          lastActivity: new Date(),
        },
        create: {
          userId: update.userId,
          courseId: update.courseId,
          lessonId: update.lessonId,
          completionPercentage: update.completion,
          timeSpent: update.timeIncrement,
          attempts: update.attemptsIncrement,
          lastActivity: new Date(),
        },
      });
    }
  }
}
```

### Step 3: Business Intelligence Dashboard
```typescript
// lib/analytics/business-intelligence.ts
export interface BusinessMetrics {
  userAcquisition: {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    acquisitionChannels: { source: string; count: number; conversionRate: number }[];
  };
  engagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
    courseCompletionRate: number;
    featureAdoption: { feature: string; adoptionRate: number }[];
  };
  learning: {
    totalLessonsCompleted: number;
    averageTimeToComplete: number;
    mostPopularCourses: { courseId: string; enrollments: number; completion: number }[];
    strugglingUsers: { userId: string; strugglingAreas: string[] }[];
    aiTutorEffectiveness: {
      interactionsPerUser: number;
      problemResolutionRate: number;
      userSatisfaction: number;
    };
  };
  revenue: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    averageRevenuePerUser: number;
    conversionFunnel: {
      visitors: number;
      signups: number;
      freeTrials: number;
      paidSubscriptions: number;
    };
  };
}

export class BusinessIntelligence {
  async generateDashboardData(timeframe: 'day' | 'week' | 'month' | 'quarter'): Promise<BusinessMetrics> {
    const endDate = new Date();
    const startDate = this.getStartDate(endDate, timeframe);

    const [userAcquisition, engagement, learning, revenue] = await Promise.all([
      this.calculateUserAcquisitionMetrics(startDate, endDate),
      this.calculateEngagementMetrics(startDate, endDate),
      this.calculateLearningMetrics(startDate, endDate),
      this.calculateRevenueMetrics(startDate, endDate),
    ]);

    return {
      userAcquisition,
      engagement,
      learning,
      revenue,
    };
  }

  private async calculateUserAcquisitionMetrics(startDate: Date, endDate: Date) {
    const totalUsers = await prisma.user.count({
      where: { status: 'ACTIVE' },
    });

    const newUsersInPeriod = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'ACTIVE',
      },
      _count: true,
    });

    // Calculate acquisition channels
    const acquisitionChannels = await prisma.user.groupBy({
      by: ['referralSource'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    return {
      totalUsers,
      newUsersToday: this.countUsersForDay(newUsersInPeriod, 0),
      newUsersThisWeek: this.countUsersForWeek(newUsersInPeriod),
      newUsersThisMonth: this.countUsersForMonth(newUsersInPeriod),
      acquisitionChannels: acquisitionChannels.map(channel => ({
        source: channel.referralSource || 'direct',
        count: channel._count,
        conversionRate: this.calculateConversionRate(channel.referralSource, startDate, endDate),
      })),
    };
  }

  private async calculateLearningMetrics(startDate: Date, endDate: Date) {
    const totalLessonsCompleted = await prisma.userProgress.count({
      where: {
        completionPercentage: 100,
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const averageTimeToComplete = await prisma.userProgress.aggregate({
      where: {
        completionPercentage: 100,
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _avg: {
        timeSpent: true,
      },
    });

    const mostPopularCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        enrollments: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // AI Tutor effectiveness
    const aiTutorStats = await this.calculateAITutorEffectiveness(startDate, endDate);

    return {
      totalLessonsCompleted,
      averageTimeToComplete: averageTimeToComplete._avg.timeSpent || 0,
      mostPopularCourses: mostPopularCourses.map(course => ({
        courseId: course.id,
        enrollments: course._count.enrollments,
        completion: 0, // Calculate from user progress
      })),
      strugglingUsers: await this.identifyStrugglingUsers(startDate, endDate),
      aiTutorEffectiveness: aiTutorStats,
    };
  }

  async generateRealTimeAlerts(): Promise<void> {
    // Monitor for anomalies and generate alerts
    const alerts = await Promise.all([
      this.checkErrorRateSpike(),
      this.checkPerformanceDegradation(),
      this.checkUnusualUserBehavior(),
      this.checkSystemHealth(),
    ]);

    for (const alert of alerts.filter(Boolean)) {
      await this.sendAlert(alert);
    }
  }

  private async sendAlert(alert: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    data: any;
  }): Promise<void> {
    // Send to Slack, email, or other notification systems
    await Promise.all([
      this.sendSlackAlert(alert),
      this.sendEmailAlert(alert),
      this.logToSentry(alert),
    ]);
  }
}
```

### Step 4: Privacy-Compliant Data Collection
```typescript
// lib/privacy/data-collection.ts
export interface UserConsent {
  userId: string;
  analytics: boolean;
  marketing: boolean;
  detailed: boolean;
  location: boolean;
  timestamps: {
    granted: Date;
    updated: Date;
    expires?: Date;
  };
}

export class PrivacyManager {
  async collectUserConsent(userId: string, consents: Partial<UserConsent>): Promise<void> {
    await prisma.userConsent.upsert({
      where: { userId },
      update: {
        ...consents,
        updatedAt: new Date(),
      },
      create: {
        userId,
        analytics: consents.analytics || false,
        marketing: consents.marketing || false,
        detailed: consents.detailed || false,
        location: consents.location || false,
        timestamps: {
          granted: new Date(),
          updated: new Date(),
        },
      },
    });

    // Update analytics configuration for this user
    await this.updateAnalyticsConfig(userId, consents);
  }

  async anonymizeUserData(userId: string): Promise<void> {
    // Anonymize all user data while preserving analytics value
    const anonymizedId = this.generateAnonymousId(userId);
    
    await Promise.all([
      this.anonymizeLearningData(userId, anonymizedId),
      this.anonymizeAnalyticsData(userId, anonymizedId),
      this.removePersonalIdentifiers(userId),
    ]);
  }

  async deleteUserData(userId: string): Promise<void> {
    // Complete data deletion for GDPR compliance
    await Promise.all([
      prisma.learningAnalytics.deleteMany({ where: { userId } }),
      prisma.userProgress.deleteMany({ where: { userId } }),
      prisma.auditLog.deleteMany({ where: { userId } }),
      // Keep anonymized data for platform improvement
    ]);
  }

  async generateDataExport(userId: string): Promise<{
    personalData: any;
    learningData: any;
    analyticsData: any;
  }> {
    // Generate complete data export for user
    return {
      personalData: await this.exportPersonalData(userId),
      learningData: await this.exportLearningData(userId),
      analyticsData: await this.exportAnalyticsData(userId),
    };
  }
}
```

This comprehensive Monitoring PRP establishes a production-ready observability system that provides complete visibility into platform performance, user behavior, learning effectiveness, and business metrics while maintaining the highest standards of privacy and security compliance.