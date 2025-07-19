import { NextRequest } from 'next/server';
import { adminEndpoint } from '@/lib/api/middleware';
import { ApiResponseBuilder } from '@/lib/api/response';
import { validateBody } from '@/lib/api/validation';
import { MiddlewareContext } from '@/lib/api/middleware';
import { maintenanceScheduler, MaintenanceSchedule } from '@/lib/database/maintenance';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/monitoring/simple-logger';

// Validation schemas
const ScheduleCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  operations: z.array(z.string()).min(1),
  schedule: z.object({
    minute: z.string(),
    hour: z.string(),
    dayOfMonth: z.string(),
    month: z.string(),
    dayOfWeek: z.string(),
    timezone: z.string().default('UTC')
  }),
  enabled: z.boolean().default(true),
  options: z.object({
    dryRun: z.boolean().default(false),
    force: z.boolean().default(false),
    batchSize: z.number().int().min(1).max(10000).default(1000),
    maxExecutionTime: z.number().int().min(60).max(7200).default(1800)
  }),
  notifications: z.object({
    onSuccess: z.boolean().default(false),
    onFailure: z.boolean().default(true),
    onWarnings: z.boolean().default(true),
    recipients: z.array(z.string().email()),
    channels: z.array(z.enum(['email', 'slack', 'webhook']))
  })
});

// const ScheduleUpdateSchema = ScheduleCreateSchema.partial();

// GET /api/v1/admin/maintenance/schedules - List maintenance schedules
export const GET = adminEndpoint(async (_request: NextRequest, _context: MiddlewareContext) => {
  try {
    const schedules = maintenanceScheduler.getSchedules();
    
    return ApiResponseBuilder.success(schedules);
  } catch (error) {
    logger.error('Get maintenance schedules error', error as Error);
    return ApiResponseBuilder.internalServerError('Failed to get maintenance schedules');
  }
});

// POST /api/v1/admin/maintenance/schedules - Create maintenance schedule
export const POST = adminEndpoint(async (request: NextRequest, _context: MiddlewareContext) => {
  try {
    const body = await validateBody(ScheduleCreateSchema, request);

    const schedule: MaintenanceSchedule = {
      id: uuidv4(),
      name: body.name,
      description: body.description,
      operations: body.operations,
      schedule: body.schedule,
      enabled: body.enabled || true,
      options: {
        dryRun: body.options?.dryRun || false,
        force: body.options?.force || false,
        batchSize: body.options?.batchSize || 1000,
        maxExecutionTime: body.options?.maxExecutionTime || 1800
      },
      notifications: {
        onSuccess: body.notifications?.onSuccess || false,
        onFailure: body.notifications?.onFailure || true,
        onWarnings: body.notifications?.onWarnings || true,
        recipients: body.notifications?.recipients || [],
        channels: body.notifications?.channels || []
      }
    };

    await maintenanceScheduler.addSchedule(schedule);

    return ApiResponseBuilder.created(schedule);
  } catch (error) {
    logger.error('Create maintenance schedule error', error as Error);
    
    if (error instanceof Error) {
      return ApiResponseBuilder.validationError(error.message, []);
    }
    
    return ApiResponseBuilder.internalServerError('Failed to create maintenance schedule');
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
