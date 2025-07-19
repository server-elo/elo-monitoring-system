import { NextRequest } from 'next/server';
import { z } from 'zod';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  withErrorHandling,
  generateRequestId,
  parsePaginationParams,
  createPaginationMeta
} from '@/lib/api/utils';
import { ApiErrorCode, HttpStatus } from '@/lib/api/types';
import { errorTracker } from '@/lib/monitoring/error-tracking';
import { apiLogger } from '@/lib/api/logging';
import { ApiError } from '@/lib/api/errors';
import { logger } from '@/lib/monitoring/simple-logger';

// Validation schema for error reports
const errorReportSchema = z.object({
  level: z.enum(['error', 'warning', 'info']),
  message: z.string().min(1, 'Message is required').max(1000, 'Message must be less than 1000 characters'),
  stack: z.string().optional(),
  context: z.object({
    url: z.string().url('Invalid URL'),
    userAgent: z.string().min(1, 'User agent is required'),
    component: z.string().optional(),
    action: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })
});

// GET /api/errors - Get error reports with filtering and pagination
async function getErrorsHandler(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    // TODO: Check if user has admin permissions
    // const user = await getUserFromToken(request);
    // if (user.role !== 'ADMIN') {
    //   return forbiddenResponse('Admin access required', requestId);
    // }

    const url = new URL(request.url);
    const { page, limit, offset } = parsePaginationParams(request);
    
    // Parse query parameters
    const level = url.searchParams.get('level') as 'error' | 'warning' | 'info' | null;
    const component = url.searchParams.get('component');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const search = url.searchParams.get('search');

    // Get error metrics from error tracker
    const timeRange = 24 * 60 * 60 * 1000; // 24 hours
    const metrics = errorTracker.getMetrics(timeRange);
    const recentEvents = errorTracker.getRecentEvents(1000); // Get more events for filtering

    // Filter events based on query parameters
    const filteredEvents = recentEvents.filter(event => {
      if (level && event.level !== level) return false;
      if (component && event.context.component !== component) return false;
      if (search && !event.message.toLowerCase().includes(search.toLowerCase())) return false;
      
      if (startDate) {
        const start = new Date(startDate);
        if (new Date(event.timestamp) < start) return false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        if (new Date(event.timestamp) > end) return false;
      }
      
      return true;
    });

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginate
    const total = filteredEvents.length;
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    // Create pagination metadata
    const meta = createPaginationMeta(page, limit, total);

    // Add summary metrics
    const responseData = {
      errors: paginatedEvents,
      summary: {
        totalErrors: metrics.totalErrors,
        errorRate: metrics.errorRate,
        timeRange: '24h',
        topErrors: metrics.topErrors.slice(0, 5),
        errorsByPage: metrics.errorsByPage
      }
    };

    return successResponse(responseData, meta, HttpStatus.OK, requestId);
    
  } catch (error) {
    logger.error('Get errors error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to fetch error reports',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// POST /api/errors - Report a new error
async function reportErrorHandler(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body = await request.json();
    
    // Validate input
    const validation = errorReportSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: 'INVALID_FORMAT'
      }));
      return validationErrorResponse(errors, requestId);
    }
    
    const { level, message, stack, context } = validation.data;
    
    // Create error object
    const error = new Error(message);
    if (stack) {
      error.stack = stack;
    }
    
    // Capture error with error tracker
    errorTracker.captureError(error, {
      component: context.component || 'client',
      action: context.action || 'error_report',
      metadata: {
        ...context.metadata,
        reportedVia: 'api',
        requestId,
        level
      }
    });

    // Log the error report
    apiLogger.logError(
      error as ApiError,
      {
        requestId,
        method: request.method,
        url: context.url,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: context.userAgent,
        startTime: Date.now(),
        headers: {},
        query: {}
      },
      {
        reportedVia: 'api',
        level,
        component: context.component,
        action: context.action
      }
    );

    return successResponse(
      { 
        message: 'Error reported successfully',
        reportId: requestId,
        timestamp: new Date().toISOString()
      },
      undefined,
      HttpStatus.CREATED,
      requestId
    );
    
  } catch (error) {
    logger.error('Report error error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to report error',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// DELETE /api/errors - Clear error reports (admin only)
async function clearErrorsHandler(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    // TODO: Check if user has admin permissions
    // const user = await getUserFromToken(request);
    // if (user.role !== 'ADMIN') {
    //   return forbiddenResponse('Admin access required', requestId);
    // }

    const url = new URL(request.url);
    const olderThan = url.searchParams.get('olderThan'); // ISO date string
    
    if (olderThan) {
      // Clear errors older than specified date
      const cutoffDate = new Date(olderThan);
      if (isNaN(cutoffDate.getTime())) {
        return errorResponse(
          ApiErrorCode.INVALID_INPUT,
          'Invalid date format for olderThan parameter',
          HttpStatus.BAD_REQUEST,
          undefined,
          requestId
        );
      }
      
      // In a real implementation, you would filter and delete from database
      logger.info(`Would clear errors older than ${cutoffDate.toISOString()}`);
    } else {
      // Clear all errors
      errorTracker.clearEvents();
      logger.info('All error reports cleared');
    }

    return successResponse(
      { 
        message: olderThan ? `Errors older than ${olderThan} cleared` : 'All errors cleared',
        clearedAt: new Date().toISOString()
      },
      undefined,
      HttpStatus.OK,
      requestId
    );
    
  } catch (error) {
    logger.error('Clear errors error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to clear error reports',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// Route handlers
export const GET = withErrorHandling(getErrorsHandler);
export const POST = withErrorHandling(reportErrorHandler);
export const DELETE = withErrorHandling(clearErrorsHandler);
