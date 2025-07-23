/**
 * Smart Request Router for Multi-LLM Setup
 * 
 * Intelligently routes requests to the best available LLM service
 * based on request type, service health, and performance metrics.
 */

import { LocalLLMService } from './LocalLLMService';
import { sendMessageToGeminiChat } from '@/services/geminiService';
import { logger } from '@/lib/api/logger';

export interface RoutingRequest {
  prompt: string;
  context?: any;
  complexity?: number;
  type?: 'code' | 'explanation' | 'quick' | 'analysis' | 'general';
  priority?: 'low' | 'normal' | 'high';
  userId?: string;
  timeout?: number;
  retryAttempts?: number;
  estimatedTokens?: number;
}

export interface RoutingResponse {
  content: string;
  serviceName: string;
  model: string;
  responseTime: number;
  confidence: number;
  fallbackUsed: boolean;
  retryCount: number;
}

export interface RoutingDecision {
  provider: 'local' | 'gemini';
  model: string;
  reason: string;
  confidence: number;
}

export interface ServiceHealth {
  name: string;
  url: string;
  specialty: string;
  isHealthy: boolean;
  uptime: number;
  averageResponseTime: number;
  model?: string;
}

export interface ServiceConfig {
  name: string;
  url: string;
  specialty: string;
  healthEndpoint?: string;
  timeout: number;
  priority: number;
  model?: string;
  capabilities?: string[];
}

export interface RoutingStrategy {
  name: string;
  selectService: (
    request: RoutingRequest,
    healthyServices: ServiceHealth[]
  ) => ServiceHealth | null;
}

interface RouterConfig {
  costThreshold?: number;
  complexityThreshold?: number;
  maxRetries?: number;
}

export class SmartRequestRouter {
  private llmServices = new Map<string, LocalLLMService>();
  private routingStrategies = new Map<string, RoutingStrategy>();
  private serviceConfigs: ServiceConfig[] = [];
  private serviceHealthMap = new Map<string, ServiceHealth>();
  private config: RouterConfig;
  
  private requestHistory: Array<{
    request: RoutingRequest;
    response: RoutingResponse;
    timestamp: Date;
  }> = [];

  constructor(config: RouterConfig = {}) {
    this.config = {
      costThreshold: config.costThreshold || 0.1,
      complexityThreshold: config.complexityThreshold || 0.7,
      maxRetries: config.maxRetries || 3
    };
    
    // Default service configurations
    const defaultConfigs: ServiceConfig[] = [
      {
        name: 'CodeLlama-34B',
        url: process.env.LOCAL_LLM_URL || 'http://localhost:1234/v1',
        specialty: 'code',
        healthEndpoint: 'http://localhost:1234/health',
        timeout: 5000,
        priority: 10,
        model: 'codellama-34b-instruct',
        capabilities: ['code-analysis', 'security-audit', 'gas-optimization']
      },
      {
        name: 'Mixtral-8x7B',
        url: 'http://localhost:1235/v1',
        specialty: 'explanation',
        healthEndpoint: 'http://localhost:1235/health',
        timeout: 5000,
        priority: 8,
        model: 'mixtral-8x7b-instruct',
        capabilities: ['explanations', 'tutorials', 'concept-clarification']
      },
      {
        name: 'Llama-3.1-8B',
        url: 'http://localhost:1236/v1',
        specialty: 'quick',
        healthEndpoint: 'http://localhost:1236/health',
        timeout: 3000,
        priority: 6,
        model: 'llama-3.1-8b-instruct',
        capabilities: ['quick-answers', 'simple-explanations']
      },
      {
        name: 'Gemini-Pro',
        url: 'https://generativelanguage.googleapis.com/v1beta',
        specialty: 'general',
        timeout: 10000,
        priority: 5,
        model: 'gemini-pro',
        capabilities: ['general-purpose', 'fallback', 'complex-reasoning']
      }
    ];
    
    this.serviceConfigs = defaultConfigs;
    this.initializeServices(defaultConfigs);
    this.setupRoutingStrategies();
    this.startHealthMonitoring();
  }

  private initializeServices(configs: ServiceConfig[]): void {
    for (const config of configs) {
      if (config.name !== 'Gemini-Pro') {
        // Initialize local LLM services
        const service = new LocalLLMService({
          baseURL: config.url,
          apiKey: process.env.LOCAL_LLM_API_KEY || 'lm-studio',
          model: config.model || 'default',
          maxTokens: 4096,
          temperature: 0.1
        });
        this.llmServices.set(config.name, service);
      }
      
      // Initialize health status
      this.serviceHealthMap.set(config.name, {
        name: config.name,
        url: config.url,
        specialty: config.specialty,
        isHealthy: false,
        uptime: 0,
        averageResponseTime: 0,
        model: config.model
      });
    }
  }

  private setupRoutingStrategies(): void {
    // Performance-based routing
    this.routingStrategies.set('performance', {
      name: 'performance',
      selectService: (request, healthyServices) => {
        return healthyServices
          .filter(s => s.specialty === request.type || s.specialty === 'general')
          .sort((a, b) => {
            // Sort by uptime first, then response time
            if (a.uptime !== b.uptime) return b.uptime - a.uptime;
            return a.averageResponseTime - b.averageResponseTime;
          })[0] || null;
      }
    });

    // Specialty-based routing
    this.routingStrategies.set('specialty', {
      name: 'specialty',
      selectService: (request, healthyServices) => {
        // First try to find exact specialty match
        const specialtyMatch = healthyServices.find(s => s.specialty === request.type);
        if (specialtyMatch) return specialtyMatch;
        
        // Fallback to general purpose services
        return healthyServices.find(s => s.specialty === 'general') || healthyServices[0] || null;
      }
    });

    // Load-balanced routing
    this.routingStrategies.set('load-balanced', {
      name: 'load-balanced',
      selectService: (request, healthyServices) => {
        const suitableServices = healthyServices.filter(
          s => s.specialty === request.type || s.specialty === 'general'
        );
        
        if (suitableServices.length === 0) return null;
        
        // Simple round-robin based on request count
        const requestCount = this.requestHistory.length;
        return suitableServices[requestCount % suitableServices.length];
      }
    });
  }

  private async startHealthMonitoring(): Promise<void> {
    // Check health of all services periodically
    const checkHealth = async () => {
      for (const config of this.serviceConfigs) {
        if (config.name !== 'Gemini-Pro') {
          const service = this.llmServices.get(config.name);
          if (service) {
            try {
              const isHealthy = await service.isHealthy();
              const health = this.serviceHealthMap.get(config.name);
              if (health) {
                health.isHealthy = isHealthy;
                if (isHealthy) {
                  health.uptime += 1;
                } else {
                  health.uptime = 0;
                }
              }
            } catch (error) {
              const health = this.serviceHealthMap.get(config.name);
              if (health) {
                health.isHealthy = false;
                health.uptime = 0;
              }
            }
          }
        } else {
          // Gemini is always considered healthy
          const health = this.serviceHealthMap.get(config.name);
          if (health) {
            health.isHealthy = true;
            health.uptime += 1;
          }
        }
      }
    };

    // Initial health check
    await checkHealth();
    
    // Schedule periodic health checks
    setInterval(checkHealth, 30000); // Every 30 seconds
  }

  private getHealthyServices(): ServiceHealth[] {
    return Array.from(this.serviceHealthMap.values()).filter(s => s.isHealthy);
  }

  public async route(request: RoutingRequest): Promise<RoutingDecision> {
    // Analyze request complexity
    const complexity = request.complexity || this.calculateComplexity(request.prompt);
    
    // Check if we should use local LLM based on complexity and cost
    if (complexity < this.config.complexityThreshold) {
      const healthyLocalServices = this.getHealthyServices().filter(s => s.name !== 'Gemini-Pro');
      if (healthyLocalServices.length > 0) {
        // Select best local service
        const strategy = this.routingStrategies.get('specialty');
        const service = strategy?.selectService(request, healthyLocalServices);
        
        if (service) {
          return {
            provider: 'local',
            model: service.model || 'unknown',
            reason: `Selected ${service.name} for ${request.type || 'general'} request`,
            confidence: 0.9
          };
        }
      }
    }
    
    // Fallback to Gemini for complex requests or when no local services available
    return {
      provider: 'gemini',
      model: 'gemini-pro',
      reason: 'Using Gemini for complex request or no local services available',
      confidence: 0.8
    };
  }

  public async routeRequest(
    request: RoutingRequest,
    strategy: string = 'specialty'
  ): Promise<RoutingResponse> {
    let retryCount = 0;
    const maxRetries = request.retryAttempts || this.config.maxRetries;
    let lastError: Error | null = null;

    while (retryCount <= maxRetries) {
      try {
        const healthyServices = this.getHealthyServices();
        
        if (healthyServices.length === 0) {
          throw new Error('No healthy services available');
        }

        const routingStrategy = this.routingStrategies.get(strategy);
        if (!routingStrategy) {
          throw new Error(`Unknown routing strategy: ${strategy}`);
        }

        const selectedService = routingStrategy.selectService(request, healthyServices);
        if (!selectedService) {
          throw new Error('No suitable service found for request');
        }

        logger.info(`Routing ${request.type} request to ${selectedService.name}`);
        
        const response = await this.executeRequest(request, selectedService);
        
        // Record successful request
        this.recordRequest(request, response);
        
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        retryCount++;
        
        if (retryCount <= maxRetries) {
          logger.warn(`Request failed, retrying (${retryCount}/${maxRetries}): ${lastError.message}`);
          await this.delay(1000 * retryCount); // Exponential backoff
        }
      }
    }

    // All retries failed, try Gemini as final fallback
    logger.info('All services failed, using Gemini fallback');
    
    try {
      const fallbackResponse = await this.executeGeminiFallback(request);
      this.recordRequest(request, fallbackResponse);
      return fallbackResponse;
    } catch (geminiError) {
      throw new Error(
        `All services failed. Last error: ${lastError?.message}, Gemini error: ${geminiError}`
      );
    }
  }

  private async executeRequest(
    request: RoutingRequest,
    service: ServiceHealth
  ): Promise<RoutingResponse> {
    const startTime = Date.now();
    
    if (service.name === 'Gemini-Pro') {
      return this.executeGeminiFallback(request);
    }

    const llmService = this.llmServices.get(service.name);
    if (!llmService) {
      throw new Error(`Service ${service.name} not found`);
    }

    try {
      const response = await llmService.generateResponse(request.prompt, {
        maxTokens: 2048,
        temperature: 0.1
      });

      const responseTime = Date.now() - startTime;
      
      // Update average response time
      const health = this.serviceHealthMap.get(service.name);
      if (health) {
        health.averageResponseTime = 
          (health.averageResponseTime * 0.9) + (responseTime * 0.1);
      }

      return {
        content: response,
        serviceName: service.name,
        model: service.model || 'unknown',
        responseTime,
        confidence: 0.9,
        fallbackUsed: false,
        retryCount: 0
      };
    } catch (error) {
      logger.error(`Request to ${service.name} failed`, {
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          service: service.name
        }
      });
      throw error;
    }
  }

  private async executeGeminiFallback(request: RoutingRequest): Promise<RoutingResponse> {
    const startTime = Date.now();
    
    try {
      const response = await sendMessageToGeminiChat(request.prompt);
      const responseTime = Date.now() - startTime;

      return {
        content: response,
        serviceName: 'Gemini-Pro',
        model: 'gemini-pro',
        responseTime,
        confidence: 0.8,
        fallbackUsed: true,
        retryCount: 0
      };
    } catch (error) {
      logger.error('Gemini fallback failed', {
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }
  }

  private recordRequest(request: RoutingRequest, response: RoutingResponse): void {
    this.requestHistory.push({
      request,
      response,
      timestamp: new Date()
    });

    // Keep only last 1000 requests
    if (this.requestHistory.length > 1000) {
      this.requestHistory = this.requestHistory.slice(-1000);
    }
  }

  private calculateComplexity(prompt: string): number {
    // Simple complexity calculation based on prompt length and keywords
    let complexity = Math.min(prompt.length / 1000, 0.5);
    
    // Check for complex keywords
    const complexKeywords = [
      'analyze', 'optimize', 'debug', 'architecture',
      'security', 'performance', 'integration', 'migration'
    ];
    
    const keywordCount = complexKeywords.filter(
      keyword => prompt.toLowerCase().includes(keyword)
    ).length;
    
    complexity += keywordCount * 0.1;
    
    return Math.min(complexity, 1.0);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getServiceStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    this.serviceHealthMap.forEach((health, name) => {
      status[name] = {
        healthy: health.isHealthy,
        uptime: health.uptime,
        averageResponseTime: health.averageResponseTime,
        specialty: health.specialty
      };
    });

    return status;
  }

  public getRequestHistory(): typeof this.requestHistory {
    return [...this.requestHistory];
  }
}

// Export singleton instance
export const smartRequestRouter = new SmartRequestRouter();