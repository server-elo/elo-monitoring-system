import { NextRequest, NextResponse } from 'next/server';
import { adminEndpoint } from '@/lib/api/middleware';
import { ApiResponseBuilder } from '@/lib/api/response';
import { validateBody } from '@/lib/api/validation';
import { MiddlewareContext } from '@/lib/api/middleware';
import { maintenanceScheduler } from '@/lib/database/maintenance';
import { cleanupManager } from '@/lib/database/cleanup';
import { migrationManager } from '@/lib/database/migrations';
import { z } from 'zod';
import { logger } from '@/lib/monitoring/simple-logger';

// Validation schemas
const MaintenanceActionSchema = z.object({
  action: z.enum( ['run_cleanup', 'run_schedule', 'test_migration', 'apply_migration']),
  target: z.string().optional(),
  options: z.object({
    dryRun: z.boolean().default(true),
    force: z.boolean().default(false),
    batchSize: z.number(_).int(_).min(1).max(10000).default(1000),
    maxExecutionTime: z.number(_).int(_).min(_60).max(_7200).default(1800)
  }).optional()
});

// const ScheduleCreateSchema = z.object({
//   name: z.string().min(1).max(100),
//   description: z.string().min(1).max(500),
//   operations: z.array(z.string()).min(1),
//   schedule: z.object({
//     minute: z.string(),
//     hour: z.string(),
//     dayOfMonth: z.string(),
//     month: z.string(),
//     dayOfWeek: z.string(),
//     timezone: z.string().default('UTC')
//   }),
//   enabled: z.boolean().default(true),
//   options: z.object({
//     dryRun: z.boolean().default(false),
//     force: z.boolean().default(false),
//     batchSize: z.number(_).int(_).min(1).max(10000).default(1000),
//     maxExecutionTime: z.number(_).int(_).min(_60).max(_7200).default(1800)
//   }),
//   notifications: z.object({
//     onSuccess: z.boolean().default(false),
//     onFailure: z.boolean().default(true),
//     onWarnings: z.boolean().default(true),
//     recipients: z.array(z.string().email(_)),
//     channels: z.array(z.enum(['email', 'slack', 'webhook']))
//   })
// });

// GET /api/v1/admin/maintenance - Get maintenance status and operations
export const GET = adminEndpoint(async (request: NextRequest, context: MiddlewareContext) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status':
        const status = await maintenanceScheduler.getMaintenanceStatus(_);
        const migrationStatus = await migrationManager.getMigrationStatus(_);
        
        return ApiResponseBuilder.success({
          scheduler: status,
          migrations: migrationStatus,
          timestamp: new Date().toISOString()
        }) as NextResponse;

      case 'schedules':
        const schedules = maintenanceScheduler.getSchedules(_);
        return ApiResponseBuilder.success(_schedules) as NextResponse;

      case 'operations':
        const operations = cleanupManager.getRegisteredOperations(_).map(op => ({
          id: op.id,
          name: op.name,
          description: op.description,
          category: op.category,
          severity: op.severity,
          estimatedDuration: op.estimatedDuration,
          requiresBackup: op.requiresBackup,
          dryRunSupported: op.dryRunSupported
        }));
        return ApiResponseBuilder.success(_operations);

      case 'migrations':
        const appliedMigrations = await migrationManager.getAppliedMigrations(_);
        const pendingMigrations = await migrationManager.getPendingMigrations(_);
        
        return ApiResponseBuilder.success({
          applied: appliedMigrations,
          pending: pendingMigrations.map(m => ({
            id: m.id,
            name: m.name,
            description: m.description,
            version: m.version,
            dependencies: m.dependencies,
            estimatedDuration: m.estimatedDuration,
            requiresBackup: m.requiresBackup,
            dataTransformation: m.dataTransformation
          }))
        });

      default:
        // Return general maintenance overview
        const overview = {
          scheduler: await maintenanceScheduler.getMaintenanceStatus(_),
          operations: {
            total: cleanupManager.getRegisteredOperations(_).length,
            byCategory: cleanupManager.getRegisteredOperations(_).reduce((acc, op) => {
              acc[op.category] = (_acc[op.category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          },
          migrations: await migrationManager.getMigrationStatus(_)
        };

        return ApiResponseBuilder.success(_overview);
    }
  } catch (error) {
    logger.error('Get maintenance status error', error as Error);
    return ApiResponseBuilder.internalServerError('Failed to get maintenance status');
  }
});

// POST /api/v1/admin/maintenance - Execute maintenance actions
export const POST = adminEndpoint(async (request: NextRequest, context: MiddlewareContext) => {
  try {
    const body = await validateBody( MaintenanceActionSchema, request);
    const { action, target, options } = body;

    const defaultOptions = {
      dryRun: true,
      force: false,
      batchSize: 1000,
      maxExecutionTime: 1800,
      userId: context.user!.id,
      requestId: context.requestId,
      ...options
    };

    switch (action) {
      case 'run_cleanup':
        if (!target) {
          return ApiResponseBuilder.validationError( 'Target operation required for cleanup', []);
        }

        const operation = cleanupManager.getOperation(_target);
        if (!operation) {
          return ApiResponseBuilder.notFound(_`Cleanup operation not found: ${target}`);
        }

        const cleanupResult = await cleanupManager.executeOperation( target, defaultOptions);
        
        return ApiResponseBuilder.success({
          action: 'cleanup',
          operation: target,
          result: cleanupResult
        });

      case 'run_schedule':
        if (!target) {
          return ApiResponseBuilder.validationError( 'Target schedule required', []);
        }

        const schedule = maintenanceScheduler.getSchedule(_target);
        if (!schedule) {
          return ApiResponseBuilder.notFound(_`Maintenance schedule not found: ${target}`);
        }

        const scheduleResult = await maintenanceScheduler.runMaintenanceNow(_target);
        
        return ApiResponseBuilder.success({
          action: 'schedule',
          schedule: target,
          result: scheduleResult
        });

      case 'test_migration':
        if (!target) {
          return ApiResponseBuilder.validationError( 'Target migration required', []);
        }

        const testResult = await migrationManager.testMigration(_target);
        
        return ApiResponseBuilder.success({
          action: 'test_migration',
          migration: target,
          result: testResult
        });

      case 'apply_migration':
        if (!target) {
          return ApiResponseBuilder.validationError( 'Target migration required', []);
        }

        const migrationResult = await migrationManager.applyMigration( target, defaultOptions.dryRun);
        
        return ApiResponseBuilder.success({
          action: 'apply_migration',
          migration: target,
          result: migrationResult
        });

      default:
        return ApiResponseBuilder.validationError( 'Invalid action', []);
    }
  } catch (error) {
    logger.error('Execute maintenance action error', error as Error);
    
    if (error instanceof Error) {
      return ApiResponseBuilder.validationError( error.message, []);
    }
    
    return ApiResponseBuilder.internalServerError('Failed to execute maintenance action');
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response( null, { status: 200 });
}
