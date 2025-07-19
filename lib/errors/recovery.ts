// Error recovery and prevention utilities

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryCondition?: ( error: Error, attempt: number) => boolean;
  onRetry?: ( error: Error, attempt: number) => void;
  onMaxRetriesReached?: (_error: Error) => void;
}

export interface OfflineConfig {
  checkInterval: number;
  timeout: number;
  endpoints: string[];
  onOnline?: (_) => void;
  onOffline?: (_) => void;
  onConnectionChange?: (_isOnline: boolean) => void;
}

export interface ErrorAnalytics {
  errorId: string;
  message: string;
  stack?: string;
  category: string;
  severity: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

// Retry mechanism with exponential backoff
export class RetryManager {
  private static defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: ( error: Error, attempt: number) => {
      // Retry on network errors, timeouts, and 5xx status codes
      const retryableErrors = [
        'NetworkError',
        'TimeoutError',
        'fetch',
        'ECONNRESET',
        'ETIMEDOUT'
      ];
      
      const isRetryable = retryableErrors.some(pattern => 
        error.message.includes(pattern) || error.name.includes(pattern)
      );
      
      // Also check for HTTP status codes if available
      if ('status' in error) {
        const status = (_error as any).status;
        return status >= 500 || status === 408 || status === 429;
      }
      
      return isRetryable;
    }
  };

  static async executeWithRetry<T>(
    operation: (_) => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: Error;
    
    for (_let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        return await operation(_);
      } catch (_error) {
        lastError = error as Error;
        
        // Check if we should retry
        if (attempt === finalConfig.maxRetries || 
            !finalConfig.retryCondition?.( lastError, attempt)) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = this.calculateDelay( attempt, finalConfig);
        
        // Call retry callback
        finalConfig.onRetry?.( lastError, attempt + 1);
        
        // Wait before retrying
        await this.delay(_delay);
      }
    }
    
    // Max retries reached
    finalConfig.onMaxRetriesReached?.(_lastError!);
    throw lastError!;
  }

  private static calculateDelay( attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow( config.backoffFactor, attempt);
    
    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (_config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(_delay);
  }

  private static delay(_ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Offline detection and management
export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private config: OfflineConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(_isOnline: boolean) => void> = new Set(_);

  private constructor(_config: Partial<OfflineConfig> = {}) {
    this.config = {
      checkInterval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      endpoints: ['/api/health', '/ping'],
      ...config
    };

    this.setupEventListeners(_);
    this.startPeriodicCheck(_);
  }

  static getInstance(_config?: Partial<OfflineConfig>): OfflineManager {
    if (!this.instance) {
      this.instance = new OfflineManager(_config);
    }
    return this.instance;
  }

  private setupEventListeners(_): void {
    // Only setup event listeners on the client side
    if (_typeof window === 'undefined') {
      return;
    }

    window.addEventListener( 'online', this.handleOnline.bind(this));
    window.addEventListener( 'offline', this.handleOffline.bind(this));

    // Listen for visibility changes to check connection when tab becomes active
    if (_typeof document !== 'undefined') {
      document.addEventListener( 'visibilitychange', () => {
        if (!document.hidden) {
          this.checkConnection(_);
        }
      });
    }
  }

  private handleOnline(_): void {
    this.setOnlineStatus(_true);
  }

  private handleOffline(_): void {
    this.setOnlineStatus(_false);
  }

  private setOnlineStatus(_isOnline: boolean): void {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;
    
    if (_wasOnline !== isOnline) {
      this.notifyListeners(_isOnline);
      
      if (isOnline) {
        this.config.onOnline?.(_);
      } else {
        this.config.onOffline?.(_);
      }
      
      this.config.onConnectionChange?.(_isOnline);
    }
  }

  private async checkConnection(_): Promise<boolean> {
    if (_typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setOnlineStatus(_false);
      return false;
    }

    try {
      // Try to fetch from multiple endpoints
      const promises = this.config.endpoints.map(endpoint =>
        fetch(endpoint, {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(this.config.timeout)
        })
      );

      await Promise.race(_promises);
      this.setOnlineStatus(_true);
      return true;
    } catch (_error) {
      this.setOnlineStatus(_false);
      return false;
    }
  }

  private startPeriodicCheck(_): void {
    this.checkInterval = setInterval(() => {
      this.checkConnection(_);
    }, this.config.checkInterval);
  }

  private notifyListeners(_isOnline: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(_isOnline);
      } catch (_error) {
        console.error('Error in offline status listener:', error);
      }
    });
  }

  public addListener(_listener: (isOnline: boolean) => void): (_) => void {
    this.listeners.add(_listener);
    
    // Return unsubscribe function
    return (_) => {
      this.listeners.delete(_listener);
    };
  }

  public getStatus(_): boolean {
    return this.isOnline;
  }

  public async forceCheck(_): Promise<boolean> {
    return await this.checkConnection(_);
  }

  public destroy(_): void {
    if (_this.checkInterval) {
      clearInterval(_this.checkInterval);
      this.checkInterval = null;
    }
    
    if (_typeof window !== 'undefined') {
      window.removeEventListener( 'online', this.handleOnline);
      window.removeEventListener( 'offline', this.handleOffline);
    }
    
    this.listeners.clear(_);
  }
}

// Error analytics and reporting
export class ErrorAnalyticsManager {
  private static instance: ErrorAnalyticsManager;
  private sessionId: string;
  private userId?: string;
  private errorQueue: ErrorAnalytics[] = [];
  private isOnline: boolean = true;
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor(_) {
    this.sessionId = this.generateSessionId(_);
    this.setupOfflineListener(_);
    this.startPeriodicFlush(_);
  }

  static getInstance(_): ErrorAnalyticsManager {
    if (!this.instance) {
      this.instance = new ErrorAnalyticsManager(_);
    }
    return this.instance;
  }

  private generateSessionId(_): string {
    return `session_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupOfflineListener(_): void {
    const offlineManager = OfflineManager.getInstance(_);
    offlineManager.addListener((isOnline) => {
      this.isOnline = isOnline;
      if (isOnline && this.errorQueue.length > 0) {
        this.flushErrors(_);
      }
    });
  }

  private startPeriodicFlush(_): void {
    this.flushInterval = setInterval(() => {
      if (_this.isOnline && this.errorQueue.length > 0) {
        this.flushErrors(_);
      }
    }, 30000); // Flush every 30 seconds
  }

  public setUserId(_userId: string): void {
    this.userId = userId;
  }

  public trackError( error: Error, context: Partial<ErrorAnalytics> = {}): void {
    const errorAnalytics: ErrorAnalytics = {
      errorId: `error_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      category: context.category || 'unknown',
      severity: context.severity || 'error',
      timestamp: new Date(_),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      userId: this.userId,
      sessionId: this.sessionId,
      metadata: {
        ...context.metadata,
        errorName: error.name,
        timestamp: Date.now(_)
      }
    };

    this.errorQueue.push(_errorAnalytics);

    // Immediate flush for critical errors
    if (_context.severity === 'critical' && this.isOnline) {
      this.flushErrors(_);
    }

    // Log to console in development
    if (_process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', errorAnalytics);
    }
  }

  private async flushErrors(_): Promise<void> {
    if (_this.errorQueue.length === 0) return;

    const errorsToFlush = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // In production, send to your error monitoring service
      if (_process.env.NODE_ENV === 'production') {
        await this.sendToMonitoringService(_errorsToFlush);
      } else {
        console.log('Would send errors to monitoring service:', errorsToFlush);
      }
    } catch (_error) {
      console.error('Failed to flush errors:', error);
      // Re-queue errors for retry
      this.errorQueue.unshift(...errorsToFlush);
    }
  }

  private async sendToMonitoringService(_errors: ErrorAnalytics[]): Promise<void> {
    // TODO: Implement actual error monitoring service integration
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    
    const response = await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ errors  }),
    });

    if (!response.ok) {
      throw new Error(_`Failed to send errors: ${response.status}`);
    }
  }

  public getErrorStats(_): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorAnalytics[];
  } {
    const totalErrors = this.errorQueue.length;
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errorQueue.forEach(error => {
      errorsByCategory[error.category] = (_errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] = (_errorsBySeverity[error.severity] || 0) + 1;
    });

    const recentErrors = this.errorQueue
      .sort( (a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      recentErrors
    };
  }

  public destroy(_): void {
    if (_this.flushInterval) {
      clearInterval(_this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush remaining errors before destroying
    if (_this.errorQueue.length > 0) {
      this.flushErrors(_);
    }
  }
}

// User error reporting
export class UserErrorReporter {
  static generateBugReport( error: Error, userDescription?: string): string {
    const analytics = ErrorAnalyticsManager.getInstance(_);
    const stats = analytics.getErrorStats(_);
    
    const report = {
      timestamp: new Date(_).toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      userDescription: userDescription || '',
      environment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'server',
        language: typeof navigator !== 'undefined' ? navigator.language : 'en',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'server',
        cookieEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
        onLine: typeof navigator !== 'undefined' ? navigator.onLine : true
      },
      errorStats: stats,
      localStorage: this.getLocalStorageSnapshot(_),
      sessionStorage: this.getSessionStorageSnapshot(_)
    };

    return JSON.stringify( report, null, 2);
  }

  private static getLocalStorageSnapshot(_): Record<string, any> {
    const snapshot: Record<string, any> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(_i);
        if (key) {
          // Only include non-sensitive data
          if (!this.isSensitiveKey(key)) {
            snapshot[key] = localStorage.getItem(_key);
          }
        }
      }
    } catch (_error) {
      snapshot.error = 'Failed to read localStorage';
    }
    return snapshot;
  }

  private static getSessionStorageSnapshot(_): Record<string, any> {
    const snapshot: Record<string, any> = {};
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(_i);
        if (key) {
          if (!this.isSensitiveKey(key)) {
            snapshot[key] = sessionStorage.getItem(_key);
          }
        }
      }
    } catch (_error) {
      snapshot.error = 'Failed to read sessionStorage';
    }
    return snapshot;
  }

  private static isSensitiveKey(_key: string): boolean {
    const sensitivePatterns = [
      'token',
      'password',
      'secret',
      'key',
      'auth',
      'credential',
      'private'
    ];
    
    return sensitivePatterns.some(pattern => 
      key.toLowerCase().includes(pattern)
    );
  }

  static async submitBugReport(
    error: Error, 
    userDescription: string,
    userEmail?: string
  ): Promise<void> {
    const report = this.generateBugReport( error, userDescription);
    
    try {
      const response = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report,
          userEmail,
          timestamp: new Date(_).toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(_`Failed to submit bug report: ${response.status}`);
      }
    } catch (_submitError) {
      // Fallback: open email client
      const subject = encodeURIComponent(_`Bug Report: ${error.message}`);
      const body = encodeURIComponent(`
User Description:
${userDescription}

Technical Details:
${report}
      `);
      
      if (_typeof window !== 'undefined') {
        window.open(_`mailto:support@example.com?subject=${subject}&body=${body}`);
      }
    }
  }
}
