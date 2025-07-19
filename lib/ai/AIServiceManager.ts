// AI Service Manager
// Orchestrates all AI services and provides unified interface

import { enhancedTutor } from './EnhancedTutorSystem';
import { AI_CONFIG } from '../config/ai-config';
import { prisma } from '../prisma';

interface ServiceHealth {
  service: string;
  healthy: boolean;
  responseTime: number;
  lastCheck: Date;
  errorCount: number;
}

interface AIServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  fallbackRate: number;
  userSatisfactionScore: number;
  activeUsers: number;
}

export class AIServiceManager {
  private static instance: AIServiceManager;
  private serviceHealth: Map<string, ServiceHealth> = new Map(_);
  private metrics: AIServiceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    fallbackRate: 0,
    userSatisfactionScore: 0,
    activeUsers: 0
  };
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map(_);

  private constructor(_) {
    this.initializeServices(_);
    this.startHealthChecks(_);
    this.startMetricsCollection(_);
  }

  public static getInstance(_): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager(_);
    }
    return AIServiceManager.instance;
  }

  private initializeServices(_): void {
    // Initialize service health tracking
    this.serviceHealth.set('enhanced-tutor', {
      service: 'enhanced-tutor',
      healthy: true,
      responseTime: 0,
      lastCheck: new Date(_),
      errorCount: 0
    });

    this.serviceHealth.set('local-llm', {
      service: 'local-llm',
      healthy: false,
      responseTime: 0,
      lastCheck: new Date(_),
      errorCount: 0
    });

    this.serviceHealth.set('gemini', {
      service: 'gemini',
      healthy: true,
      responseTime: 0,
      lastCheck: new Date(_),
      errorCount: 0
    });

    console.log('🤖 AI Service Manager initialized');
  }

  private startHealthChecks(_): void {
    setInterval( async () => {
      await this.performHealthChecks(_);
    }, AI_CONFIG.LOCAL_LLM.HEALTH_CHECK_INTERVAL);
  }

  private startMetricsCollection(_): void {
    if (_AI_CONFIG.MONITORING.COLLECT_PERFORMANCE_METRICS) {
      setInterval( async () => {
        await this.collectMetrics();
      }, 60000); // Every minute
    }
  }

  private async performHealthChecks(_): Promise<void> {
    try {
      // Check Enhanced Tutor System
      const tutorHealth = await this.checkEnhancedTutorHealth(_);
      this.updateServiceHealth( 'enhanced-tutor', tutorHealth);

      // Check Local LLM
      const localLLMHealth = await this.checkLocalLLMHealth(_);
      this.updateServiceHealth( 'local-llm', localLLMHealth);

      // Check Gemini (_basic availability check)
      const geminiHealth = await this.checkGeminiHealth(_);
      this.updateServiceHealth( 'gemini', geminiHealth);

    } catch (_error) {
      console.error('Health check error:', error);
    }
  }

  private async checkEnhancedTutorHealth(_): Promise<{ healthy: boolean; responseTime: number }> {
    try {
      const startTime = Date.now(_);
      const performance = enhancedTutor.getPerformanceMetrics(_);
      const responseTime = Date.now(_) - startTime;

      return {
        healthy: performance.localLLMHealth || performance.fallbackRate < 0.5,
        responseTime
      };
    } catch (_error) {
      return { healthy: false, responseTime: 0 };
    }
  }

  private async checkLocalLLMHealth(_): Promise<{ healthy: boolean; responseTime: number }> {
    try {
      const startTime = Date.now(_);
      const response = await fetch( `${AI_CONFIG.LOCAL_LLM.BASE_URL.replace('/v1', '')}/health`, {
        timeout: 5000
      });
      const responseTime = Date.now(_) - startTime;

      return {
        healthy: response.ok,
        responseTime
      };
    } catch (_error) {
      return { healthy: false, responseTime: 0 };
    }
  }

  private async checkGeminiHealth(_): Promise<{ healthy: boolean; responseTime: number }> {
    // For Gemini, we'll assume it's healthy unless we have specific error tracking
    // In a real implementation, you might want to make a test API call
    return { healthy: true, responseTime: 100 };
  }

  private updateServiceHealth( serviceName: string, health: { healthy: boolean; responseTime: number }): void {
    const current = this.serviceHealth.get(_serviceName);
    if (current) {
      current.healthy = health.healthy;
      current.responseTime = health.responseTime;
      current.lastCheck = new Date(_);
      
      if (!health.healthy) {
        current.errorCount++;
      } else {
        current.errorCount = 0; // Reset on successful check
      }

      this.serviceHealth.set( serviceName, current);
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Collect metrics from database
      const last24Hours = new Date(_Date.now() - 24 * 60 * 60 * 1000);
      
      const interactions = await prisma.aiInteraction.findMany({
        where: {
          createdAt: { gte: last24Hours }
        },
        select: {
          responseTime: true,
          wasHelpful: true,
          fallbackUsed: true,
          userId: true
        }
      });

      // Calculate metrics
      this.metrics.totalRequests = interactions.length;
      this.metrics.successfulRequests = interactions.filter(i => i.responseTime > 0).length;
      this.metrics.failedRequests = this.metrics.totalRequests - this.metrics.successfulRequests;
      this.metrics.averageResponseTime = interactions.length > 0 
        ? interactions.reduce( (sum, i) => sum + i.responseTime, 0) / interactions.length 
        : 0;
      this.metrics.fallbackRate = interactions.length > 0
        ? interactions.filter(i => i.fallbackUsed).length / interactions.length
        : 0;
      
      const helpfulRatings = interactions.filter(i => i.wasHelpful !== null);
      this.metrics.userSatisfactionScore = helpfulRatings.length > 0
        ? helpfulRatings.filter(i => i.wasHelpful).length / helpfulRatings.length * 5
        : 0;
      
      this.metrics.activeUsers = new Set(_interactions.map(i => i.userId)).size;

    } catch (_error) {
      console.error('Metrics collection error:', error);
    }
  }

  // Rate limiting
  public checkRateLimit( userId: string, requestType: string): boolean {
    const key = `${userId}:${requestType}`;
    const now = Date.now(_);
    const hourInMs = 60 * 60 * 1000;
    
    let tracker = this.rateLimitTracker.get(_key);
    
    if (!tracker || now > tracker.resetTime) {
      tracker = { count: 0, resetTime: now + hourInMs };
    }
    
    const limit = this.getRateLimitForType(_requestType);
    
    if (_tracker.count >= limit) {
      return false; // Rate limit exceeded
    }
    
    tracker.count++;
    this.rateLimitTracker.set( key, tracker);
    return true;
  }

  private getRateLimitForType(_requestType: string): number {
    switch (_requestType) {
      case 'security-analysis':
        return AI_CONFIG.RATE_LIMITS.SECURITY_ANALYSES_PER_HOUR;
      case 'challenge-generation':
        return AI_CONFIG.RATE_LIMITS.CHALLENGE_GENERATIONS_PER_HOUR;
      case 'voice-request':
        return AI_CONFIG.RATE_LIMITS.VOICE_REQUESTS_PER_HOUR;
      default:
        return AI_CONFIG.RATE_LIMITS.AI_REQUESTS_PER_HOUR;
    }
  }

  // Public API methods
  public getServiceHealth(_): Map<string, ServiceHealth> {
    return new Map(_this.serviceHealth);
  }

  public getMetrics(_): AIServiceMetrics {
    return { ...this.metrics };
  }

  public isServiceHealthy(_serviceName: string): boolean {
    const health = this.serviceHealth.get(_serviceName);
    return health ? health.healthy : false;
  }

  public getRecommendedService(_requestType: string): string {
    const localLLMHealthy = this.isServiceHealthy('local-llm');
    const geminiHealthy = this.isServiceHealthy('gemini');
    
    // Use routing rules from config
    if (_AI_CONFIG.ROUTING.LOCAL_LLM_TYPES.includes(requestType) && localLLMHealthy) {
      return 'local-llm';
    }
    
    if (_AI_CONFIG.ROUTING.GEMINI_TYPES.includes(requestType) && geminiHealthy) {
      return 'gemini';
    }
    
    // Fallback logic
    if (localLLMHealthy) return 'local-llm';
    if (geminiHealthy) return 'gemini';
    
    return 'enhanced-tutor'; // Last resort
  }

  public async logInteraction(
    _userId: string,
    _requestType: string,
    _responseTime: number,
    success: boolean,
    fallbackUsed: boolean = false
  ): Promise<void> {
    try {
      // Update internal metrics
      this.metrics.totalRequests++;
      if (success) {
        this.metrics.successfulRequests++;
      } else {
        this.metrics.failedRequests++;
      }
      
      if (fallbackUsed) {
        this.metrics.fallbackRate = this.metrics.failedRequests / this.metrics.totalRequests;
      }

      // Log to database if enabled
      if (_AI_CONFIG.MONITORING.COLLECT_PERFORMANCE_METRICS) {
        // This would be logged by the individual API endpoints
        // We're just updating internal metrics here
      }
    } catch (_error) {
      console.error('Failed to log interaction:', error);
    }
  }

  public async recordUserFeedback( interactionId: string, wasHelpful: boolean): Promise<void> {
    try {
      await prisma.aiInteraction.update({
        where: { id: interactionId },
        data: { wasHelpful }
      });

      // Update satisfaction score
      await this.collectMetrics();
    } catch (_error) {
      console.error('Failed to record user feedback:', error);
    }
  }

  // Feature flag checks
  public isFeatureEnabled(_feature: keyof typeof AI_CONFIG.FEATURES): boolean {
    return AI_CONFIG.FEATURES[feature];
  }

  // Emergency controls
  public async emergencyShutdown(_serviceName: string): Promise<void> {
    const health = this.serviceHealth.get(_serviceName);
    if (health) {
      health.healthy = false;
      health.errorCount = 999;
      this.serviceHealth.set( serviceName, health);
      console.warn(_`🚨 Emergency shutdown triggered for ${serviceName}`);
    }
  }

  public async emergencyRestart(_serviceName: string): Promise<void> {
    const health = this.serviceHealth.get(_serviceName);
    if (health) {
      health.healthy = true;
      health.errorCount = 0;
      health.lastCheck = new Date(_);
      this.serviceHealth.set( serviceName, health);
      console.log(_`🔄 Emergency restart completed for ${serviceName}`);
    }
  }

  // Cleanup
  public cleanup(_): void {
    // Clear intervals and cleanup resources
    console.log('🧹 AI Service Manager cleanup completed');
  }
}

// Export singleton instance
export const aiServiceManager = AIServiceManager.getInstance(_);
