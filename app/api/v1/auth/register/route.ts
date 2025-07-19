import { NextRequest } from 'next/server';
import { authEndpoint } from '@/lib/api/middleware';
import { ApiResponseBuilder, ConflictException } from '@/lib/api/response';
import { validateBody, RegisterSchema } from '@/lib/api/validation';
import { AuthService } from '@/lib/api/auth';
import { ApiUser, UserRole, UserStatus } from '@/lib/api/types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/monitoring/simple-logger';

// Mock user storage - in production, this would be a real database
const mockUsers: Array<ApiUser & { passwordHash: string }> = [];

async function findUserByEmail(email: string): Promise<ApiUser | null> {
  return mockUsers.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
}

async function createUser(userData: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<ApiUser> {
  const now = new Date().toISOString();
  
  const newUser: ApiUser & { passwordHash: string } = {
    id: uuidv4(),
    email: userData.email.toLowerCase(),
    name: userData.name,
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE, // In production, might be PENDING_VERIFICATION
    passwordHash: userData.passwordHash,
    profile: {
      xpTotal: 0,
      level: 1,
      lessonsCompleted: 0,
      coursesCompleted: 0,
      achievementsCount: 0,
      currentStreak: 0,
      longestStreak: 0
    },
    preferences: {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      achievementNotifications: true
    },
    createdAt: now,
    updatedAt: now
  };

  mockUsers.push(newUser);
  
  // Return user without password hash
  const { passwordHash, ...safeUser } = newUser;
  return safeUser;
}

async function sendWelcomeEmail(user: ApiUser): Promise<void> {
  // In production, this would send an actual email
  logger.info(`Welcome email sent to ${user.email}`);
}

async function sendVerificationEmail(user: ApiUser): Promise<void> {
  // In production, this would send an email verification
  logger.info(`Verification email sent to ${user.email}`);
}

export const POST = authEndpoint(async (request: NextRequest) => {
  try {
    // Validate request body
    const body = await validateBody(RegisterSchema, request);
    const { email, password, name, acceptTerms } = body;

    // Check if terms are accepted
    if (!acceptTerms) {
      return ApiResponseBuilder.validationError('Terms and conditions must be accepted', [
        {
          field: 'acceptTerms',
          message: 'You must accept the terms and conditions',
          code: 'required',
          value: acceptTerms
        }
      ]);
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(password);

    // Create user
    const user = await createUser({
      email,
      name,
      passwordHash
    });

    // Send welcome and verification emails
    await Promise.all([
      sendWelcomeEmail(user),
      sendVerificationEmail(user)
    ]);

    // Generate tokens
    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = AuthService.generateRefreshToken(user.id);

    // Prepare response data
    const responseData = {
      user,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
        tokenType: 'Bearer'
      },
      session: {
        id: AuthService.generateSessionId(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        rememberMe: false
      },
      message: 'Registration successful! Please check your email to verify your account.'
    };

    return ApiResponseBuilder.created(responseData);
  } catch (error) {
    logger.error('Registration error', error as Error);
    
    if (error instanceof ConflictException) {
      return ApiResponseBuilder.conflict(error.message);
    }
    
    if (error instanceof Error) {
      return ApiResponseBuilder.validationError(error.message, []);
    }
    
    return ApiResponseBuilder.internalServerError('Registration failed');
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
