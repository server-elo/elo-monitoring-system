/**
 * SECURE CORS Configuration
 * Implements strict origin validation and comprehensive security measures
 */

interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

/**
 * Secure CORS configuration with environment-based origin validation
 */
export class SecureCorsManager {
  private readonly config: CorsConfig;
  private readonly allowedOrigins: Set<string>;
  
  constructor() {
    // Define allowed origins from environment with secure fallbacks
    const envOrigins = this.parseOrigins(process.env.CORS_ORIGINS);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const vercelUrl = process.env.VERCEL_URL;
    
    // Build secure origin list
    const origins = new Set<string>();
    
    // Add environment origins
    envOrigins.forEach(origin => origins.add(origin));
    
    // Add application URL if set
    if (appUrl && this.isValidUrl(appUrl)) {
      origins.add(appUrl);
    }
    
    // Add Vercel URL if set (for preview deployments)
    if (vercelUrl && this.isValidUrl(`https://${vercelUrl}`)) {
      origins.add(`https://${vercelUrl}`);
    }
    
    // Development origins (only in development)
    if (process.env.NODE_ENV === 'development') {
      origins.add('http://localhost:3000');
      origins.add('http://127.0.0.1:3000');
      origins.add('http://localhost:3001');
    }
    
    // Never allow wildcard in production
    if (process.env.NODE_ENV === 'production') {
      origins.delete('*');
    }
    
    // Ensure we have at least one valid origin
    if (origins.size === 0) {
      throw new Error('No valid CORS origins configured. Please set CORS_ORIGINS or NEXT_PUBLIC_APP_URL.');
    }
    
    this.allowedOrigins = origins;
    this.config = {
      allowedOrigins: Array.from(origins),
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'X-File-Name'
      ],
      maxAge: 86400, // 24 hours
      credentials: true
    };
    
    console.log('CORS Configuration initialized:', {
      origins: Array.from(origins),
      environment: process.env.NODE_ENV
    });
  }
  
  /**
   * Validate origin against allowed list
   */
  isOriginAllowed(origin: string | null): boolean {
    if (!origin) {
      return false; // Reject requests with no origin
    }
    
    try {
      // Validate URL format
      new URL(origin);
      
      // Check against allowed origins
      return this.allowedOrigins.has(origin);
    } catch {
      return false; // Invalid URL format
    }
  }
  
  /**
   * Get CORS headers for a specific origin
   */
  getCorsHeaders(origin: string | null): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Set origin if allowed
    if (origin && this.isOriginAllowed(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    // Set other CORS headers
    headers['Access-Control-Allow-Methods'] = this.config.allowedMethods.join(', ');
    headers['Access-Control-Allow-Headers'] = this.config.allowedHeaders.join(', ');
    headers['Access-Control-Max-Age'] = this.config.maxAge.toString();
    
    // Vary header for proper caching
    headers['Vary'] = 'Origin';
    
    return headers;
  }
  
  /**
   * Handle preflight OPTIONS request
   */
  handlePreflight(origin: string | null): { allowed: boolean; headers: Record<string, string> } {
    const allowed = this.isOriginAllowed(origin);
    const headers = allowed ? this.getCorsHeaders(origin) : {};
    
    return { allowed, headers };
  }
  
  /**
   * Parse origins from environment variable
   */
  private parseOrigins(corsOrigins?: string): string[] {
    if (!corsOrigins) {
      return [];
    }
    
    return corsOrigins
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0 && this.isValidUrl(origin));
  }
  
  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  /**
   * Get configuration summary for logging
   */
  getConfigSummary(): {
    allowedOrigins: string[];
    allowedMethods: string[];
    environment: string;
    securityLevel: 'strict' | 'development';
  } {
    return {
      allowedOrigins: this.config.allowedOrigins,
      allowedMethods: this.config.allowedMethods,
      environment: process.env.NODE_ENV || 'unknown',
      securityLevel: process.env.NODE_ENV === 'production' ? 'strict' : 'development'
    };
  }
}

// Singleton instance
export const corsManager = new SecureCorsManager();

/**
 * Express-style CORS middleware (for socket server)
 */
export function createExpressCorsMiddleware() {
  return (req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    const headers = corsManager.getCorsHeaders(origin);
    
    // Set headers
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    
    next();
  };
}

/**
 * Socket.io CORS configuration
 */
export function getSocketIOCorsConfig() {
  return {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      if (corsManager.isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
    optionsSuccessStatus: 200
  };
}

/**
 * Validate current CORS configuration
 */
export function validateCorsConfig(): { valid: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  const config = corsManager.getConfigSummary();
  
  // Check for development-specific warnings
  if (config.environment === 'development') {
    warnings.push('Development CORS policy is more permissive');
  }
  
  // Check for production-specific requirements
  if (config.environment === 'production') {
    if (config.allowedOrigins.includes('*')) {
      errors.push('Wildcard origin (*) not allowed in production');
    }
    
    if (config.allowedOrigins.some(origin => origin.startsWith('http://'))) {
      warnings.push('HTTP origins detected in production - consider HTTPS only');
    }
    
    if (config.allowedOrigins.length === 0) {
      errors.push('No allowed origins configured for production');
    }
  }
  
  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
}