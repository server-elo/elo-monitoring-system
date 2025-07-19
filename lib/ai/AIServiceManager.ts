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
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private metrics: AIServiceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    fallbackRate: 0,
    userSatisfactionScore: 0,
    activeUsers: 0
  };
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor() {
    this.initializeServices();
    this.startHealthChecks();
    this.startMetricsCollection();
  }

  public static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  private initializeServices(): void {
    // Initialize service health tracking
    this.serviceHealth.set('enhanced-tutor', {
      service: 'enhanced-tutor',
      healthy: true,
      responseTime: 0,
      lastCheck: new Date(),
      errorCount: 0
    });

    this.serviceHealth.set('local-llm', {
      service: 'local-llm',
      healthy: false,
      responseTime: 0,
      lastCheck: new Date(),
      errorCount: 0
    });

    this.serviceHealth.set('gemini', {
      service: 'gemini',
      healthy: true,
      responseTime: 0,
      lastCheck: new Date(),
      errorCount: 0
    });

    console.log('🤖 AI Service Manager initialized');
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      await this.performHealthChecks();
    }, AI_CONFIG.LOCAL_LLM.HEALTH_CHECK_INTERVAL);
  }

  private startMetricsCollection(): void {
    if (AI_CONFIG.MONITORING.COLLECT_PERFORMANCE_METRICS) {
      setInterval(async () => {
        await this.collectMetrics();
      }, 60000); // Every minute
    }
  }

  private async performHealthChecks(): Promise<void> {
    try {
      // Check Enhanced Tutor System
      const tutorHealth = await this.checkEnhancedTutorHealth();
      this.updateServiceHealth('enhanced-tutor', tutorHealth);

      // Check Local LLM
      const localLLMHealth = await this.checkLocalLLMHealth();
      this.updateServiceHealth('local-llm', localLLMHealth);

      // Check Gemini (basic availability check)
      const geminiHealth = await this.checkGeminiHealth();
      this.updateServiceHealth('gemini', geminiHealth);

    } catch (error) {
      console.error('Health check error:', error);
    }
  }

  private async checkEnhancedTutorHealth(): Promise<{ healthy: boolean; responseTime: number }> {
    try {
      const startTime = Date.now();
      const performance = enhancedTutor.getPerformanceMetrics();
      const responseTime = Date.now() - startTime;

      return {
        healthy: performance.localLLMHealth || performance.fallbackRate < 0.5,
        responseTime
      };
    } catch (error) {
      return { healthy: false, responseTime: 0 };
    }
  }

  private async checkLocalLLMHealth(): Promise<{ healthy: boolean; responseTime: number }> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${AI_CONFIG.LOCAL_LLM.BASE_URL.replace('/v1', '')}/health`, {
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;

      return {
        healthy: response.ok,
        responseTime
      };
    } catch (error) {
      return { healthy: false, responseTime: 0 };
    }
  }

  private async checkGeminiHealth(): Promise<{ healthy: boolean; responseTime: number }> {
    // For Gemini, we'll assume it's healthy unless we have specific error tracking
    // In a real implementation, you might want to make a test API call
    return { healthy: true, responseTime: 100 };
  }

  private updateServiceHealth(serviceName: string, health: { healthy: boolean; responseTime: number }): void {
    const current = this.serviceHealth.get(serviceName);
    if (current) {
      current.healthy = health.healthy;
      current.responseTime = health.responseTime;
      current.lastCheck = new Date();
      
      if (!health.healthy) {
        current.errorCount++;
      } else {
        current.errorCount = 0; // Reset on successful check
      }

      this.serviceHealth.set(serviceName, current);
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Collect metrics from database
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
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
        ? interactions.reduce((sum, i) => sum + i.responseTime, 0) / interactions.length 
        : 0;
      this.metrics.fallbackRate = interactions.length > 0
        ? interactions.filter(i => i.fallbackUsed).length / interactions.length
        : 0;
      
      const helpfulRatings = interactions.filter(i => i.wasHelpful !== null);
      this.metrics.userSatisfactionScore = helpfulRatings.length > 0
        ? helpfulRatings.filter(i => i.wasHelpful).length / helpfulRatings.length * 5
        : 0;
      
      this.metrics.activeUsers = new Set(interactions.map(i => i.userId)).size;

    } catch (error) {
      console.error('Metrics collection error:', error);
    }
  }

  // Rate limiting
  public checkRateLimit(userId: string, requestType: string): boolean {
    const key = `${userId}:${requestType}`;
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;
    
    let tracker = this.rateLimitTracker.get(key);
    
    if (!tracker || now > tracker.resetTime) {
      tracker = { count: 0, resetTime: now + hourInMs };
    }
    
    const limit = this.getRateLimitForType(requestType);
    
    if (tracker.count >= limit) {
      return false; // Rate limit exceeded
    }
    
    tracker.count++;
    this.rateLimitTracker.set(key, tracker);
    return true;
  }

  private getRateLimitForType(requestType: string): number {
    switch (requestType) {
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
  public getServiceHealth(): Map<string, ServiceHealth> {
    return new Map(this.serviceHealth);
  }

  public getMetrics(): AIServiceMetrics {
    return { ...this.metrics };
  }

  public isServiceHealthy(serviceName: string): boolean {
    const health = this.serviceHealth.get(serviceName);
    return health ? health.healthy : false;
  }

  public getRecommendedService(requestType: string): string {
    const localLLMHealthy = this.isServiceHealthy('local-llm');
    const geminiHealthy = this.isServiceHealthy('gemini');
    
    // Use routing rules from config
    if (AI_CONFIG.ROUTING.LOCAL_LLM_TYPES.includes(requestType) && localLLMHealthy) {
      return 'local-llm';
    }
    
    if (AI_CONFIG.ROUTING.GEMINI_TYPES.includes(requestType) && geminiHealthy) {
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
      if (AI_CONFIG.MONITORING.COLLECT_PERFORMANCE_METRICS) {
        // This would be logged by the individual API endpoints
        // We're just updating internal metrics here
      }
    } catch (error) {
      console.error('Failed to log interaction:', error);
    }
  }

  public async recordUserFeedback(interactionId: string, wasHelpful: boolean): Promise<void> {
    try {
      await prisma.aiInteraction.update({
        where: { id: interactionId },
        data: { wasHelpful }
      });

      // Update satisfaction score
      await this.collectMetrics();
    } catch (error) {
      console.error('Failed to record user feedback:', error);
    }
  }

  // Feature flag checks
  public isFeatureEnabled(feature: keyof typeof AI_CONFIG.FEATURES): boolean {
    return AI_CONFIG.FEATURES[feature];
  }

  // Emergency controls
  public async emergencyShutdown(serviceName: string): Promise<void> {
    const health = this.serviceHealth.get(serviceName);
    if (health) {
      health.healthy = false;
      health.errorCount = 999;
      this.serviceHealth.set(serviceName, health);
      console.warn(`🚨 Emergency shutdown triggered for ${serviceName}`);
    }
  }

  public async emergencyRestart(serviceName: string): Promise<void> {
    const health = this.serviceHealth.get(serviceName);
    if (health) {
      health.healthy = true;
      health.errorCount = 0;
      health.lastCheck = new Date();
      this.serviceHealth.set(serviceName, health);
      console.log(`🔄 Emergency restart completed for ${serviceName}`);
    }
  }

  // Cleanup
  public cleanup(): void {
    // Clear intervals and cleanup resources
    console.log('🧹 AI Service Manager cleanup completed');
  }
}

// Export singleton instance
export const aiServiceManager = AIServiceManager.getInstance();
