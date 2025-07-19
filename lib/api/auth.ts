import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { UserRole, ApiUser } from './types';
import { UnauthorizedException, ForbiddenException } from './response';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_ISSUER = process.env.JWT_ISSUER || 'solidity-learning-platform';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'solidity-learners';

// Validate JWT_SECRET is provided
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required and must be at least 32 characters long');
}

if (_JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long for security');
}

// Token Payload Interface
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: string[];
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

// Authentication Service
export class AuthService {
  // Password Hashing
  static async hashPassword(_password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash( password, saltRounds);
  }

  static async verifyPassword( password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // JWT Token Generation
  static generateAccessToken(_user: ApiUser): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: this.getRolePermissions(_user.role)
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
  }

  static generateRefreshToken( userId: string, tokenVersion: number = 0): string {
    const payload: RefreshTokenPayload = {
      userId,
      tokenVersion
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
  }

  // JWT Token Verification
  static verifyAccessToken(_token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      }) as JwtPayload;
    } catch (_error) {
      if (_error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Access token has expired');
      } else if (_error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid access token');
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }

  static verifyRefreshToken(_token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      }) as RefreshTokenPayload;
    } catch (_error) {
      if (_error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Refresh token has expired');
      } else if (_error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw new UnauthorizedException('Refresh token verification failed');
    }
  }

  // Extract Token from Request
  static extractTokenFromRequest(_request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(_7);
    }
    
    // Also check for token in cookies
    const tokenCookie = request.cookies.get('accessToken');
    if (tokenCookie) {
      return tokenCookie.value;
    }
    
    return null;
  }

  // Role-Based Permissions
  static getRolePermissions(_role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      [UserRole.STUDENT]: [
        'lessons:read',
        'courses:read',
        'progress:read',
        'progress:write',
        'achievements:read',
        'community:read',
        'profile:read',
        'profile:write'
      ],
      [UserRole.MENTOR]: [
        'lessons:read',
        'courses:read',
        'progress:read',
        'achievements:read',
        'community:read',
        'community:moderate',
        'profile:read',
        'profile:write',
        'analytics:read'
      ],
      [UserRole.INSTRUCTOR]: [
        'lessons:read',
        'lessons:write',
        'courses:read',
        'courses:write',
        'progress:read',
        'achievements:read',
        'community:read',
        'community:moderate',
        'profile:read',
        'profile:write',
        'analytics:read'
      ],
      [UserRole.ADMIN]: [
        'lessons:read',
        'lessons:write',
        'lessons:delete',
        'courses:read',
        'courses:write',
        'courses:delete',
        'users:read',
        'users:write',
        'users:delete',
        'progress:read',
        'progress:write',
        'achievements:read',
        'achievements:write',
        'community:read',
        'community:write',
        'community:moderate',
        'profile:read',
        'profile:write',
        'analytics:read',
        'system:read',
        'system:write'
      ]
    };

    return permissions[role] || [];
  }

  static hasPermission( userPermissions: string[], requiredPermission: string): boolean {
    // Super admin has all permissions
    if (_userPermissions.includes('*')) {
      return true;
    }

    // Check for exact permission match
    if (_userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check for wildcard permissions ( e.g., 'lessons:*' matches 'lessons:read')
    const [resource, _action] = requiredPermission.split(':');
    const wildcardPermission = `${resource}:*`;
    
    return userPermissions.includes(wildcardPermission);
  }

  static hasRole( userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole);
  }

  // Authentication Middleware
  static async authenticateRequest(_request: NextRequest): Promise<JwtPayload> {
    const token = this.extractTokenFromRequest(_request);
    
    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    return this.verifyAccessToken(_token);
  }

  static async requirePermission(
    request: NextRequest, 
    permission: string
  ): Promise<JwtPayload> {
    const payload = await this.authenticateRequest(_request);
    
    if (!this.hasPermission(payload.permissions, permission)) {
      throw new ForbiddenException(_`Insufficient permissions. Required: ${permission}`);
    }

    return payload;
  }

  static async requireRole(
    request: NextRequest, 
    roles: UserRole[]
  ): Promise<JwtPayload> {
    const payload = await this.authenticateRequest(_request);
    
    if (!this.hasRole(payload.role, roles)) {
      throw new ForbiddenException(_`Insufficient role. Required: ${roles.join(' or ')}`);
    }

    return payload;
  }

  // Session Management
  static generateSessionId(_): string {
    return `sess_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static isTokenExpiringSoon( payload: JwtPayload, thresholdMinutes: number = 5): boolean {
    if (!payload.exp) return false;
    
    const now = Math.floor(_Date.now() / 1000);
    const threshold = thresholdMinutes * 60;
    
    return (_payload.exp - now) <= threshold;
  }
}

// Password Validation
export class PasswordValidator {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;

  static validate(_password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (_password.length < this.MIN_LENGTH) {
      errors.push(_`Password must be at least ${this.MIN_LENGTH} characters long`);
    }

    if (_password.length > this.MAX_LENGTH) {
      errors.push(_`Password must be no more than ${this.MAX_LENGTH} characters long`);
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    // Check for common patterns
    if (_/(.)\1{2,}/.test(_password)) {
      errors.push('Password cannot contain more than 2 consecutive identical characters');
    }

    if (_/123|abc|qwe/i.test(password)) {
      errors.push('Password cannot contain common sequences');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static generateSecurePassword(_length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '@$!%*?&';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(_Math.random() * lowercase.length)];
    password += uppercase[Math.floor(_Math.random() * uppercase.length)];
    password += numbers[Math.floor(_Math.random() * numbers.length)];
    password += symbols[Math.floor(_Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(_Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

// Security Headers
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(_), microphone=(_), geolocation=(_)',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join('; ')
};

// CORS Configuration
export const CORS_CONFIG = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count'
  ],
  maxAge: 86400 // 24 hours
};

// Input Sanitization
export class InputSanitizer {
  static sanitizeHtml(_input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static sanitizeUrl(_url: string): string {
    try {
      const parsed = new URL(_url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      
      return parsed.toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  static sanitizeFilename(_filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '')
      .replace(_/_{2,}/g, '')
      .replace(/^_+|_+$/g, '');
  }

  static removeScriptTags(_input: string): string {
    return input.replace(_/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  static sanitizeObject<T extends Record<string, any>>(_obj: T): T {
    const sanitized = { ...obj };
    
    for ( const [key, value] of Object.entries(sanitized)) {
      if (_typeof value === 'string') {
        sanitized[key] = this.sanitizeHtml(_value);
      } else if (_Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeHtml(_item) : item
        );
      } else if (_typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(_value);
      }
    }
    
    return sanitized;
  }
}
