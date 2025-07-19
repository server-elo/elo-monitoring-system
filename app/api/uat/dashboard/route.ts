import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring/simple-logger';
import { analytics } from '@/lib/monitoring/analytics';
import { prisma } from '@/lib/prisma';

/**
 * UAT Dashboard API
 * Provides comprehensive data for UAT monitoring and analysis
 */

// Using extended Prisma client from wrapper

interface UATDashboardData {
  metrics: {
    totalTesters: number;
    activeSessions: number;
    completedTasks: number;
    averageCompletionRate: number;
    averageSatisfactionScore: number;
    criticalIssues: number;
    averageTaskTime: number;
    errorRate: number;
  };
  analytics: {
    taskPerformance: Array<{
      taskId: string;
      taskTitle: string;
      completionRate: number;
      averageTime: number;
      satisfactionScore: number;
      errorCount: number;
      status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    }>;
    testerFeedback: Array<{
      id: string;
      testerId: string;
      taskId: string;
      rating: number;
      comment: string;
      category: string;
      timestamp: Date;
      priority: 'low' | 'medium' | 'high' | 'critical';
    }>;
    performanceTrends: Array<{
      date: string;
      completionRate: number;
      satisfactionScore: number;
      errorRate: number;
    }>;
  };
  sessions: Array<{
    id: string;
    testerId: string;
    testerInfo: {
      name: string;
      email: string;
      experience: string;
      background: string;
      device: string;
      browser: string;
    };
    assignedTasks: string[];
    startTime: Date;
    endTime?: Date;
    status: string;
    metrics: {
      tasksCompleted: number;
      totalTime: number;
      errorsEncountered: number;
      helpRequests: number;
    };
  }>;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const category = searchParams.get('category') || 'all';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all':
        startDate = new Date('2024-01-01');
        break;
    }

    // Fetch UAT sessions
    const sessions = await prisma.uATSession.findMany({
      where: {
        startTime: {
          gte: startDate,
        },
        ...(category !== 'all' && {
          assignedTasks: {
            contains: category,
          },
        }),
      },
      include: {
        tester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        feedback: true,
        taskResults: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Fetch feedback data
    const feedback = await prisma.feedback.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
        ...(category !== 'all' && {
          category: category,
        }),
        uatSessionId: {
          not: null,
        },
      },
      include: {
        uatSession: {
          include: {
            tester: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Calculate metrics
    const metrics = calculateMetrics(sessions, feedback);
    
    // Generate analytics
    const analyticsData = generateAnalytics(sessions, feedback);
    
    // Format sessions data
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      testerId: session.testerId,
      testerInfo: {
        name: ((session as any).tester?.name || 'Anonymous') as string,
        email: ((session as any).tester?.email || '') as string,
        experience: session.testerExperience || 'unknown',
        background: session.testerBackground || '',
        device: session.deviceInfo || 'unknown',
        browser: session.browserInfo || 'unknown',
      },
      assignedTasks: Array.isArray(session.assignedTasks) ? session.assignedTasks as string[] : JSON.parse(session.assignedTasks || '[]') as string[],
      startTime: session.startTime || new Date(),
      endTime: session.endTime || undefined,
      status: session.status || 'unknown',
      metrics: {
        tasksCompleted: ((session as any).taskResults?.length || 0),
        totalTime: session.endTime 
          ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60)
          : Math.floor((Date.now() - session.startTime.getTime()) / 1000 / 60),
        errorsEncountered: session.errorsEncountered || 0,
        helpRequests: session.helpRequests || 0,
      },
    }));

    const dashboardData: UATDashboardData = {
      metrics,
      analytics: analyticsData,
      sessions: formattedSessions,
    };

    // Log analytics
    analytics.trackEvent('uat_dashboard_viewed', {
      timeRange,
      category,
      totalSessions: sessions.length,
      totalFeedback: feedback.length,
    });

    const responseTime = Date.now() - startTime;
    logger.info('UAT dashboard data retrieved', {
      metadata: {
        timeRange,
        category,
        sessionsCount: sessions.length,
        feedbackCount: feedback.length,
        responseTime,
      },
    });

    return NextResponse.json(dashboardData);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to retrieve UAT dashboard data', error as Error, {
      metadata: {
        responseTime,
      },
    });

    return NextResponse.json(
      { error: 'Failed to retrieve dashboard data' },
      { status: 500 }
    );
  }
}

/**
 * Calculate overall UAT metrics
 */
function calculateMetrics(sessions: any[], feedback: any[]) {
  const totalTesters = new Set(sessions.map(s => s.testerId)).size;
  const activeSessions = sessions.filter(s => s.status === 'in_progress').length;
  
  // Calculate completion rates
  const completedTasks = sessions.reduce((sum, session) => 
    sum + (session.taskResults?.length || 0), 0
  );
  const totalAssignedTasks = sessions.reduce((sum, session) => 
    sum + session.assignedTasks.length, 0
  );
  const averageCompletionRate = totalAssignedTasks > 0 
    ? (completedTasks / totalAssignedTasks) * 100 
    : 0;

  // Calculate satisfaction score
  const ratings = feedback.map(f => f.rating).filter(r => r > 0);
  const averageSatisfactionScore = ratings.length > 0
    ? ratings.reduce((sum: number, rating) => sum + rating, 0) / ratings.length
    : 0;

  // Calculate critical issues
  const criticalIssues = feedback.filter(f => f.priority === 'critical').length;

  // Calculate average task time
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalTime = completedSessions.reduce((sum: number, session) => {
    if (session.endTime) {
      return sum + (session.endTime.getTime() - session.startTime.getTime());
    }
    return sum;
  }, 0);
  const averageTaskTime = completedSessions.length > 0
    ? Math.floor(totalTime / completedSessions.length / 1000 / 60)
    : 0;

  // Calculate error rate
  const totalErrors = sessions.reduce((sum: number, session) =>
    sum + (session.errorsEncountered || 0), 0
  );
  const errorRate = totalAssignedTasks > 0
    ? (totalErrors / totalAssignedTasks) * 100
    : 0;

  return {
    totalTesters,
    activeSessions,
    completedTasks,
    averageCompletionRate: Math.round(averageCompletionRate * 10) / 10,
    averageSatisfactionScore: Math.round(averageSatisfactionScore * 10) / 10,
    criticalIssues,
    averageTaskTime,
    errorRate: Math.round(errorRate * 10) / 10,
  };
}

/**
 * Generate detailed analytics
 */
function generateAnalytics(sessions: any[], feedback: any[]) {
  // Task performance analysis
  const taskPerformance = generateTaskPerformance(sessions, feedback);
  
  // Format feedback
  const testerFeedback = feedback.map(f => ({
    id: f.id,
    testerId: f.uatSession?.testerId || 'unknown',
    taskId: f.category, // Use category as task identifier for now
    rating: f.rating,
    comment: f.description,
    category: f.category,
    timestamp: f.timestamp,
    priority: f.priority,
  }));

  // Performance trends (simplified - would use time series data in production)
  const performanceTrends = generatePerformanceTrends(sessions, feedback);

  return {
    taskPerformance,
    testerFeedback,
    performanceTrends,
  };
}

/**
 * Generate task performance metrics
 */
function generateTaskPerformance(sessions: any[], feedback: any[]) {
  const taskStats = new Map();

  // Initialize task stats
  const allTasks = [
    { id: 'onboarding-new-user', title: 'New User Onboarding and First Lesson' },
    { id: 'collaboration-session', title: 'Collaborative Coding Session' },
    { id: 'ai-tutoring-interaction', title: 'AI Tutoring and Code Debugging' },
    { id: 'complete-learning-path', title: 'Complete Learning Path' },
    { id: 'social-features-usage', title: 'Social Features and Community' },
  ];

  allTasks.forEach(task => {
    taskStats.set(task.id, {
      taskId: task.id,
      taskTitle: task.title,
      attempts: 0,
      completions: 0,
      totalTime: 0,
      ratings: [],
      errors: 0,
    });
  });

  // Aggregate data from sessions
  sessions.forEach(session => {
    session.assignedTasks.forEach((taskId: string) => {
      const stats = taskStats.get(taskId);
      if (stats) {
        stats.attempts++;
        
        // Check if task was completed
        const taskResult = session.taskResults?.find((r: any) => r.taskId === taskId);
        if (taskResult?.completed) {
          stats.completions++;
          stats.totalTime += taskResult.timeSpent || 0;
        }
        
        stats.errors += session.errorsEncountered || 0;
      }
    });
  });

  // Aggregate feedback ratings
  feedback.forEach(f => {
    const stats = taskStats.get(f.category); // Use category as task identifier
    if (stats && f.rating && f.rating > 0) {
      stats.ratings.push(f.rating);
    }
  });

  // Calculate final metrics
  return Array.from(taskStats.values()).map(stats => {
    const completionRate = stats.attempts > 0 
      ? (stats.completions / stats.attempts) * 100 
      : 0;
    
    const averageTime = stats.completions > 0
      ? Math.floor(stats.totalTime / stats.completions)
      : 0;
    
    const satisfactionScore = stats.ratings.length > 0
      ? stats.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / stats.ratings.length
      : 0;

    // Determine status based on performance
    let status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    if (completionRate >= 90 && satisfactionScore >= 4.5) {
      status = 'excellent';
    } else if (completionRate >= 75 && satisfactionScore >= 4.0) {
      status = 'good';
    } else if (completionRate >= 60 && satisfactionScore >= 3.0) {
      status = 'needs_improvement';
    } else {
      status = 'critical';
    }

    return {
      taskId: stats.taskId,
      taskTitle: stats.taskTitle,
      completionRate: Math.round(completionRate * 10) / 10,
      averageTime,
      satisfactionScore: Math.round(satisfactionScore * 10) / 10,
      errorCount: stats.errors,
      status,
    };
  });
}

/**
 * Generate performance trends over time
 */
function generatePerformanceTrends(sessions: any[], feedback: any[]) {
  // Simplified implementation - would use proper time series aggregation in production
  const trends = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const daySessions = sessions.filter(s => 
      s.startTime >= dayStart && s.startTime <= dayEnd
    );
    
    const dayFeedback = feedback.filter(f => 
      f.timestamp >= dayStart && f.timestamp <= dayEnd
    );
    
    // Calculate metrics for this day
    const completedTasks = daySessions.reduce((sum: number, session) =>
      sum + (session.taskResults?.length || 0), 0
    );
    const totalTasks = daySessions.reduce((sum: number, session) =>
      sum + session.assignedTasks.length, 0
    );
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const ratings = dayFeedback.map(f => f.rating).filter(r => r > 0);
    const satisfactionScore = ratings.length > 0
      ? ratings.reduce((sum: number, rating) => sum + rating, 0) / ratings.length
      : 0;
    
    const errors = daySessions.reduce((sum: number, session) =>
      sum + (session.errorsEncountered || 0), 0
    );
    const errorRate = totalTasks > 0 ? (errors / totalTasks) * 100 : 0;
    
    trends.push({
      date: date.toISOString().split('T')[0],
      completionRate: Math.round(completionRate * 10) / 10,
      satisfactionScore: Math.round(satisfactionScore * 10) / 10,
      errorRate: Math.round(errorRate * 10) / 10,
    });
  }
  
  return trends;
}

/**
 * Get task IDs by category
 * Currently unused but kept for future UAT task filtering
 */
// async function getTaskIdsByCategory(category: string): Promise<string[]> {
//   const tasksByCategory = {
//     onboarding: ['onboarding-new-user'],
//     collaboration: ['collaboration-session'],
//     'ai-tutoring': ['ai-tutoring-interaction'],
//     'learning-path': ['complete-learning-path'],
//     social: ['social-features-usage'],
//   };
//   
//   return tasksByCategory[category as keyof typeof tasksByCategory] || [];
// }
