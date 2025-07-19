/**
 * Smart Request Router for Multi-LLM Setup
 * 
 * Intelligently routes requests to the best available LLM service
 * based on request type, service health, and performance metrics.
 */

import { HealthMonitor, ServiceHealth, ServiceConfig } from './HealthMonitor';
import { LocalLLMService } from './LocalLLMService';
import { sendMessageToGeminiChat } from '../../services/geminiService';

export interface RoutingRequest {
  prompt: string;
  type: 'code' | 'explanation' | 'quick' | 'analysis' | 'general';
  priority?: 'low' | 'medium' | 'high';
  userId?: string;
  timeout?: number;
  retryAttempts?: number;
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

export interface RoutingStrategy {
  name: string;
  selectService: (
    request: RoutingRequest,
    healthyServices: ServiceHealth[]
  ) => ServiceHealth | null;
}

export class SmartRequestRouter {
  private healthMonitor: HealthMonitor;
  private llmServices = new Map<string, LocalLLMService>();
  private routingStrategies = new Map<string, RoutingStrategy>();
  private requestHistory: Array<{
    request: RoutingRequest;
    response: RoutingResponse;
    timestamp: Date;
  }> = [];

  constructor() {
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

    this.healthMonitor = new HealthMonitor(defaultConfigs);
    this.initializeServices(defaultConfigs);
    this.setupRoutingStrategies();
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
        const suitableServices = healthyServices.filter(s => 
          s.specialty === request.type || s.specialty === 'general'
        );

        if (suitableServices.length === 0) return null;

        // Simple round-robin based on request count
        const requestCount = this.requestHistory.length;
        return suitableServices[requestCount % suitableServices.length];
      }
    });
  }

  public async routeRequest(
    request: RoutingRequest,
    strategy: string = 'specialty'
  ): Promise<RoutingResponse> {
    // Response time is calculated in executeRequest
    let retryCount = 0;
    const maxRetries = request.retryAttempts || 2;
    let lastError: Error | null = null;

    while (retryCount <= maxRetries) {
      try {
        const healthyServices = this.healthMonitor.getHealthyServices();
        
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

        console.log(`🎯 Routing ${request.type} request to ${selectedService.name}`);

        const response = await this.executeRequest(request, selectedService);
        
        // Record successful request
        this.recordRequest(request, response);
        
        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        retryCount++;
        
        if (retryCount <= maxRetries) {
          console.warn(`🔄 Request failed, retrying (${retryCount}/${maxRetries}):`, lastError.message);
          await this.delay(1000 * retryCount); // Exponential backoff
        }
      }
    }

    // All retries failed, try Gemini as final fallback
    console.log('🆘 All services failed, using Gemini fallback');
    try {
      const fallbackResponse = await this.executeGeminiFallback(request);
      this.recordRequest(request, fallbackResponse);
      return fallbackResponse;
    } catch (geminiError) {
      throw new Error(`All services failed. Last error: ${lastError?.message}, Gemini error: ${geminiError}`);
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
      throw new Error(`LLM service ${service.name} not initialized`);
    }

    const content = await llmService.generateResponse(request.prompt);
    const responseTime = Date.now() - startTime;

    return {
      content,
      serviceName: service.name,
      model: service.metadata?.model || service.name,
      responseTime,
      confidence: 0.9,
      fallbackUsed: false,
      retryCount: 0
    };
  }

  private async executeGeminiFallback(request: RoutingRequest): Promise<RoutingResponse> {
    const startTime = Date.now();
    
    const content = await sendMessageToGeminiChat(request.prompt);
    const responseTime = Date.now() - startTime;

    return {
      content,
      serviceName: 'Gemini-Pro',
      model: 'gemini-pro',
      responseTime,
      confidence: 0.8,
      fallbackUsed: true,
      retryCount: 0
    };
  }

  private recordRequest(request: RoutingRequest, response: RoutingResponse): void {
    this.requestHistory.push({
      request,
      response,
      timestamp: new Date()
    });

    // Limit history size
    if (this.requestHistory.length > 1000) {
      this.requestHistory.splice(0, this.requestHistory.length - 1000);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  public getServiceHealth(): ServiceHealth[] {
    return this.healthMonitor.getAllServicesHealth();
  }

  public async checkServiceHealth(serviceName?: string): Promise<void> {
    await this.healthMonitor.forceHealthCheck(serviceName);
  }

  public getRequestHistory(): Array<{
    request: RoutingRequest;
    response: RoutingResponse;
    timestamp: Date;
  }> {
    return [...this.requestHistory];
  }

  public getPerformanceMetrics(): {
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    serviceUsage: Record<string, number>;
    fallbackRate: number;
  } {
    const total = this.requestHistory.length;
    if (total === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        serviceUsage: {},
        fallbackRate: 0
      };
    }

    const totalResponseTime = this.requestHistory.reduce((sum, r) => sum + r.response.responseTime, 0);
    const fallbackCount = this.requestHistory.filter(r => r.response.fallbackUsed).length;
    
    const serviceUsage: Record<string, number> = {};
    this.requestHistory.forEach(r => {
      serviceUsage[r.response.serviceName] = (serviceUsage[r.response.serviceName] || 0) + 1;
    });

    return {
      totalRequests: total,
      averageResponseTime: totalResponseTime / total,
      successRate: 100, // All recorded requests were successful
      serviceUsage,
      fallbackRate: (fallbackCount / total) * 100
    };
  }

  public addService(config: ServiceConfig): void {
    this.healthMonitor.addService(config);
    
    if (config.name !== 'Gemini-Pro') {
      const service = new LocalLLMService({
        baseURL: config.url,
        apiKey: process.env.LOCAL_LLM_API_KEY || 'lm-studio',
        model: config.model || 'default',
        maxTokens: 4096,
        temperature: 0.1
      });
      this.llmServices.set(config.name, service);
    }
  }

  public removeService(serviceName: string): boolean {
    this.llmServices.delete(serviceName);
    return this.healthMonitor.removeService(serviceName);
  }

  public destroy(): void {
    this.healthMonitor.destroy();
    this.llmServices.clear();
    this.requestHistory = [];
  }
}
