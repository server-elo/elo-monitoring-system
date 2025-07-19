import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PasswordUtils, registrationSchema } from '@/lib/auth/password';
import { logger } from '@/lib/monitoring/simple-logger';
import { rateLimiter, rateLimitConfigs } from '@/lib/security/rateLimiting';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  withErrorHandling,
  generateRequestId,
  getClientIP
} from '@/lib/api/utils';
import { ApiErrorCode, HttpStatus } from '@/lib/api/types';

async function registerHandler(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Apply rate limiting
    const rateLimitMiddleware = rateLimiter.createMiddleware(rateLimitConfigs.registration);
    const rateLimitResult = await rateLimitMiddleware(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await request.json();

    // Validate input data
    const validationResult = registrationSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: 'INVALID_FORMAT'
      }));

      logger.warn('Registration validation failed', {
        metadata: {
          errors: validationResult.error.errors,
          email: body.email,
          requestId
        }
      });

      return validationErrorResponse(errors, requestId);
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      logger.warn('Registration attempt with existing email', {
        metadata: { email, requestId }
      });

      return errorResponse(
        ApiErrorCode.RESOURCE_ALREADY_EXISTS,
        'User with this email already exists',
        HttpStatus.CONFLICT,
        { field: 'email' },
        requestId
      );
    }

    // Hash password
    const hashedPassword = await PasswordUtils.hashPassword(password);

    // Create user first
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'STUDENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    // Create user profile
    await prisma.userProfile.create({
      data: {
        userId: user.id,
        skillLevel: 'BEGINNER',
        totalXP: 0,
        currentLevel: 1,
        streak: 0,
        preferences: {
          theme: 'auto',
          notifications: true,
          language: 'en'
        }
      }
    });

    const result = user;

    logger.info('User registered successfully', {
      metadata: {
        userId: result.id,
        email: result.email,
        name: result.name,
        requestId,
        ip: getClientIP(request)
      }
    });

    // Return user data (without password)
    const responseData = {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
      createdAt: result.createdAt,
    };

    return successResponse(responseData, undefined, HttpStatus.CREATED, requestId);

  } catch (error) {
    logger.error('Registration error', error instanceof Error ? error : new Error('Unknown error'), {
      metadata: { requestId }
    });

    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Internal server error during registration',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// Export handlers
export const POST = withErrorHandling(registerHandler);
