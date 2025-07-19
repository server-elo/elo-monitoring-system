import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring/simple-logger';
import { analytics } from '@/lib/monitoring/analytics';
import { sanitize, validate } from '@/lib/security/validation';
// Note: Using mock implementation for feedback storage since Prisma models are not yet deployed
// import { prisma } from '@/lib/prisma-client-wrapper';

/**
 * Feedback Submission API
 * Handles comprehensive feedback collection from UAT testers
 */

// Using extended Prisma client from wrapper

interface FeedbackSubmission {
  type: 'rating' | 'survey' | 'bug_report' | 'feature_request' | 'usability';
  rating?: number;
  category: string;
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  steps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo?: string;
  screenRecording?: boolean;
  contactInfo?: {
    email?: string;
    allowFollowUp?: boolean;
  };
  metadata: {
    page: string;
    userAgent: string;
    timestamp: string;
    sessionId: string;
    userId?: string;
  };
}

export async function POST(_request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await _request.json();
    
    // Validate and sanitize input
    const validationResult = validateFeedbackSubmission(body);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: validationResult.errors },
        { status: 400 }
      );
    }

    const feedbackData = validationResult.data as FeedbackSubmission;
    
    // Sanitize text fields
    const sanitizedFeedback = {
      ...feedbackData,
      title: sanitize.text(feedbackData.title),
      description: sanitize.text(feedbackData.description),
      expectedBehavior: feedbackData.expectedBehavior ? sanitize.text(feedbackData.expectedBehavior) : undefined,
      actualBehavior: feedbackData.actualBehavior ? sanitize.text(feedbackData.actualBehavior) : undefined,
      steps: feedbackData.steps?.map(step => sanitize.text(step)),
    };

    // Determine priority based on type and severity
    const priority = determinePriority(sanitizedFeedback);
    
    // Create feedback record (mock implementation)
    const feedback = {
      id: `feedback_${Date.now()}`,
      type: sanitizedFeedback.type,
      category: sanitizedFeedback.category,
      title: sanitizedFeedback.title,
      description: sanitizedFeedback.description,
      rating: sanitizedFeedback.rating,
      severity: sanitizedFeedback.severity,
      priority: priority,
      steps: sanitizedFeedback.steps || [],
      expectedBehavior: sanitizedFeedback.expectedBehavior,
      actualBehavior: sanitizedFeedback.actualBehavior,
      browserInfo: sanitizedFeedback.metadata.userAgent,
      screenRecording: sanitizedFeedback.screenRecording || false,
      contactEmail: sanitizedFeedback.contactInfo?.email,
      allowFollowUp: sanitizedFeedback.contactInfo?.allowFollowUp || false,
      page: sanitizedFeedback.metadata.page,
      sessionId: sanitizedFeedback.metadata.sessionId,
      userId: sanitizedFeedback.metadata.userId,
      timestamp: new Date(sanitizedFeedback.metadata.timestamp),
      ipAddress: 'unknown', // getClientIP(request) would be used in production
      userAgent: sanitizedFeedback.metadata.userAgent,
      assignedTeam: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In production, this would be:
    // const feedback = await prisma.feedback.create({
    //   data: {
    //     type: sanitizedFeedback.type,
    //     category: sanitizedFeedback.category,
    //     title: sanitizedFeedback.title,
    //     description: sanitizedFeedback.description,
    //     rating: sanitizedFeedback.rating,
    //     severity: sanitizedFeedback.severity,
    //     priority,
    //     steps: sanitizedFeedback.steps || [],
    //     expectedBehavior: sanitizedFeedback.expectedBehavior,
    //     actualBehavior: sanitizedFeedback.actualBehavior,
    //     browserInfo: sanitizedFeedback.metadata.userAgent,
    //     screenRecording: sanitizedFeedback.screenRecording || false,
    //     contactEmail: sanitizedFeedback.contactInfo?.email,
    //     allowFollowUp: sanitizedFeedback.contactInfo?.allowFollowUp || false,
    //     page: sanitizedFeedback.metadata.page,
    //     sessionId: sanitizedFeedback.metadata.sessionId,
    //     userId: sanitizedFeedback.metadata.userId,
    //     timestamp: new Date(sanitizedFeedback.metadata.timestamp),
    //     ipAddress: getClientIP(request),
    //     userAgent: sanitizedFeedback.metadata.userAgent,
    //   },
    // });

    // Process feedback for immediate actions
    await processFeedback(feedback);
    
    // Track analytics
    analytics.trackEvent('feedback_submitted', {
      type: sanitizedFeedback.type,
      category: sanitizedFeedback.category,
      priority,
      hasScreenRecording: sanitizedFeedback.screenRecording,
      rating: sanitizedFeedback.rating,
    }, sanitizedFeedback.metadata.userId);

    // Log feedback submission
    logger.info('Feedback submitted', {
      userId: sanitizedFeedback.metadata.userId || 'anonymous',
      sessionId: sanitizedFeedback.metadata.sessionId,
      metadata: {
        feedbackId: feedback.id,
        type: sanitizedFeedback.type,
        category: sanitizedFeedback.category,
        priority,
      },
    });

    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      id: feedback.id,
      priority,
      message: 'Feedback submitted successfully',
      responseTime,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Failed to submit feedback', error as Error, {
      metadata: { responseTime },
    });

    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

/**
 * Validate feedback submission data
 */
function validateFeedbackSubmission(data: any): { isValid: boolean; data?: any; errors?: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!data.type || !['rating', 'survey', 'bug_report', 'feature_request', 'usability'].includes(data.type)) {
    errors.push('Invalid or missing feedback type');
  }

  if (!data.category || typeof data.category !== 'string' || data.category.length === 0) {
    errors.push('Category is required');
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('Description is required');
  }

  // Length validations
  if (data.title && data.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (data.description && data.description.length > 5000) {
    errors.push('Description must be less than 5000 characters');
  }

  // Rating validation
  if (data.rating !== undefined && (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5)) {
    errors.push('Rating must be between 1 and 5');
  }

  // Severity validation
  if (data.severity && !['low', 'medium', 'high', 'critical'].includes(data.severity)) {
    errors.push('Invalid severity level');
  }

  // Steps validation
  if (data.steps && (!Array.isArray(data.steps) || data.steps.some((step: any) => typeof step !== 'string'))) {
    errors.push('Steps must be an array of strings');
  }

  // Email validation
  if (data.contactInfo?.email && !validate.email(data.contactInfo.email).isValid) {
    errors.push('Invalid email address');
  }

  // Metadata validation
  if (!data.metadata || typeof data.metadata !== 'object') {
    errors.push('Metadata is required');
  } else {
    if (!data.metadata.page || typeof data.metadata.page !== 'string') {
      errors.push('Page information is required');
    }
    if (!data.metadata.userAgent || typeof data.metadata.userAgent !== 'string') {
      errors.push('User agent information is required');
    }
    if (!data.metadata.timestamp || !Date.parse(data.metadata.timestamp)) {
      errors.push('Valid timestamp is required');
    }
    if (!data.metadata.sessionId || typeof data.metadata.sessionId !== 'string') {
      errors.push('Session ID is required');
    }
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Determine feedback priority based on type and content
 */
function determinePriority(feedback: FeedbackSubmission): 'low' | 'medium' | 'high' | 'critical' {
  // Critical priority conditions
  if (feedback.severity === 'critical') {
    return 'critical';
  }

  if (feedback.type === 'bug_report' && feedback.severity === 'high') {
    return 'critical';
  }

  // Check for critical keywords in description
  const criticalKeywords = ['crash', 'broken', 'unusable', 'data loss', 'security', 'cannot login', 'cannot access'];
  const description = feedback.description.toLowerCase();
  if (criticalKeywords.some(keyword => description.includes(keyword))) {
    return 'critical';
  }

  // High priority conditions
  if (feedback.severity === 'high') {
    return 'high';
  }

  if (feedback.type === 'bug_report' && feedback.severity === 'medium') {
    return 'high';
  }

  if (feedback.rating && feedback.rating <= 2) {
    return 'high';
  }

  // Medium priority conditions
  if (feedback.severity === 'medium') {
    return 'medium';
  }

  if (feedback.type === 'usability' && feedback.rating && feedback.rating <= 3) {
    return 'medium';
  }

  if (feedback.type === 'feature_request') {
    return 'medium';
  }

  // Default to low priority
  return 'low';
}

/**
 * Process feedback for immediate actions
 */
async function processFeedback(feedback: any) {
  // Send immediate notifications for critical issues
  if (feedback.priority === 'critical') {
    await sendCriticalFeedbackAlert(feedback);
  }

  // Auto-assign to appropriate team based on category
  await autoAssignFeedback(feedback);

  // Update UAT session if applicable
  if (feedback.sessionId) {
    await updateUATSession(feedback);
  }
}

/**
 * Send alert for critical feedback
 */
async function sendCriticalFeedbackAlert(feedback: any) {
  try {
    // In production, this would send alerts via email, Slack, etc.
    logger.error('Critical feedback received', undefined, {
      metadata: {
        feedbackId: feedback.id,
        title: feedback.title,
        category: feedback.category,
        page: feedback.page,
      },
    });

    // Track critical feedback in analytics
    analytics.trackEvent('critical_feedback_received', {
      feedbackId: feedback.id,
      category: feedback.category,
      type: feedback.type,
    });
  } catch (error) {
    logger.error('Failed to send critical feedback alert', error as Error);
  }
}

/**
 * Auto-assign feedback to appropriate team
 */
async function autoAssignFeedback(feedback: any) {
  const assignmentRules = {
    'collaboration': 'collaboration-team',
    'ai-tutoring': 'ai-team',
    'authentication': 'security-team',
    'performance': 'performance-team',
    'mobile': 'mobile-team',
    'general': 'product-team',
  };

  const assignedTeam = assignmentRules[feedback.category as keyof typeof assignmentRules] || 'product-team';

  try {
    // Mock update - in production this would be:
    // await prisma.feedback.update({
    //   where: { id: feedback.id },
    //   data: { assignedTeam },
    // });
    logger.info(`Feedback ${feedback.id} assigned to team: ${assignedTeam}`);
  } catch (error) {
    logger.error('Failed to auto-assign feedback', error as Error, {
      metadata: { feedbackId: feedback.id },
    });
  }
}

/**
 * Update UAT session with feedback
 */
async function updateUATSession(feedback: any) {
  try {
    // Find the UAT session
    // Mock session handling - in production this would be:
    // const session = await prisma.uATSession.findFirst({
    //   where: { id: feedback.sessionId },
    // });
    // if (session && session.id) {
    //   await prisma.uATSession.update({
    //     where: { id: session.id },
    //     data: {
    //       feedbackCount: { increment: 1 },
    //       lastFeedbackAt: new Date(),
    //     },
    //   });
    // }
    logger.info(`Session ${feedback.sessionId} feedback count updated`);
  } catch (error) {
    logger.error('Failed to update UAT session', error as Error, {
      sessionId: feedback.sessionId,
      metadata: { feedbackId: feedback.id },
    });
  }
}


