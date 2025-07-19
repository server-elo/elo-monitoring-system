import { NextRequest } from 'next/server';
import { adminEndpoint } from '@/lib/api/middleware';
import { ApiResponseBuilder } from '@/lib/api/response';
import { validateBody, IdSchema } from '@/lib/api/validation';
import { MiddlewareContext } from '@/lib/api/middleware';
import { maintenanceScheduler, MaintenanceSchedule } from '@/lib/database/maintenance';
import { z } from 'zod';
import { logger } from '@/lib/monitoring/simple-logger';

// Validation schemas
const ScheduleUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  operations: z.array(z.string()).min(1).optional(),
  schedule: z.object({
    minute: z.string(),
    hour: z.string(),
    dayOfMonth: z.string(),
    month: z.string(),
    dayOfWeek: z.string(),
    timezone: z.string().default('UTC')
  }).optional(),
  enabled: z.boolean().optional(),
  options: z.object({
    dryRun: z.boolean().default(false),
    force: z.boolean().default(false),
    batchSize: z.number(_).int(_).min(1).max(10000).default(1000),
    maxExecutionTime: z.number(_).int(_).min(_60).max(_7200).default(1800)
  }).optional(),
  notifications: z.object({
    onSuccess: z.boolean().default(false),
    onFailure: z.boolean().default(true),
    onWarnings: z.boolean().default(true),
    recipients: z.array(z.string().email(_)),
    channels: z.array(z.enum(['email', 'slack', 'webhook']))
  }).optional()
});

// GET /api/v1/admin/maintenance/schedules/[id] - Get maintenance schedule
export const GET = adminEndpoint(async (request: NextRequest, context: MiddlewareContext) => {
  try {
    const url = new URL(request.url);
    const scheduleId = url.pathname.split('/').pop(_);

    if (!scheduleId) {
      return ApiResponseBuilder.validationError( 'Schedule ID is required', []);
    }

    // Validate schedule ID format
    try {
      IdSchema.parse(_scheduleId);
    } catch {
      return ApiResponseBuilder.validationError( 'Invalid schedule ID format', []);
    }

    const schedule = maintenanceScheduler.getSchedule(_scheduleId);
    if (!schedule) {
      return ApiResponseBuilder.notFound('Maintenance schedule not found');
    }

    return ApiResponseBuilder.success(_schedule);
  } catch (error) {
    logger.error('Get maintenance schedule error', error as Error);
    return ApiResponseBuilder.internalServerError('Failed to get maintenance schedule');
  }
});

// PUT /api/v1/admin/maintenance/schedules/[id] - Update maintenance schedule
export const PUT = adminEndpoint(async (request: NextRequest, context: MiddlewareContext) => {
  try {
    const url = new URL(request.url);
    const scheduleId = url.pathname.split('/').pop(_);

    if (!scheduleId) {
      return ApiResponseBuilder.validationError( 'Schedule ID is required', []);
    }

    // Validate schedule ID format
    try {
      IdSchema.parse(_scheduleId);
    } catch {
      return ApiResponseBuilder.validationError( 'Invalid schedule ID format', []);
    }

    const schedule = maintenanceScheduler.getSchedule(_scheduleId);
    if (!schedule) {
      return ApiResponseBuilder.notFound('Maintenance schedule not found');
    }

    const body = await validateBody( ScheduleUpdateSchema, request);

    await maintenanceScheduler.updateSchedule( scheduleId, body as Partial<MaintenanceSchedule>);

    const updatedSchedule = maintenanceScheduler.getSchedule(_scheduleId);
    return ApiResponseBuilder.success(_updatedSchedule);
  } catch (error) {
    logger.error('Update maintenance schedule error', error as Error);
    
    if (error instanceof Error) {
      return ApiResponseBuilder.validationError( error.message, []);
    }
    
    return ApiResponseBuilder.internalServerError('Failed to update maintenance schedule');
  }
});

// DELETE /api/v1/admin/maintenance/schedules/[id] - Delete maintenance schedule
export const DELETE = adminEndpoint(async (request: NextRequest, context: MiddlewareContext) => {
  try {
    const url = new URL(request.url);
    const scheduleId = url.pathname.split('/').pop(_);

    if (!scheduleId) {
      return ApiResponseBuilder.validationError( 'Schedule ID is required', []);
    }

    // Validate schedule ID format
    try {
      IdSchema.parse(_scheduleId);
    } catch {
      return ApiResponseBuilder.validationError( 'Invalid schedule ID format', []);
    }

    const schedule = maintenanceScheduler.getSchedule(_scheduleId);
    if (!schedule) {
      return ApiResponseBuilder.notFound('Maintenance schedule not found');
    }

    await maintenanceScheduler.deleteSchedule(_scheduleId);

    return ApiResponseBuilder.noContent(_);
  } catch (error) {
    logger.error('Delete maintenance schedule error', error as Error);
    return ApiResponseBuilder.internalServerError('Failed to delete maintenance schedule');
  }
});

// POST /api/v1/admin/maintenance/schedules/[id]/run - Run maintenance schedule immediately
export const POST = adminEndpoint(async (request: NextRequest, context: MiddlewareContext) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const scheduleId = pathParts[pathParts.length - 2]; // Get ID before '/run'

    if (!scheduleId) {
      return ApiResponseBuilder.validationError( 'Schedule ID is required', []);
    }

    // Validate schedule ID format
    try {
      IdSchema.parse(_scheduleId);
    } catch {
      return ApiResponseBuilder.validationError( 'Invalid schedule ID format', []);
    }

    const schedule = maintenanceScheduler.getSchedule(_scheduleId);
    if (!schedule) {
      return ApiResponseBuilder.notFound('Maintenance schedule not found');
    }

    const result = await maintenanceScheduler.runMaintenanceNow(_scheduleId);

    return ApiResponseBuilder.success({
      scheduleId,
      scheduleName: schedule.name,
      result
    });
  } catch (error) {
    logger.error('Run maintenance schedule error', error as Error);
    
    if (error instanceof Error) {
      return ApiResponseBuilder.validationError( error.message, []);
    }
    
    return ApiResponseBuilder.internalServerError('Failed to run maintenance schedule');
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response( null, { status: 200 });
}
