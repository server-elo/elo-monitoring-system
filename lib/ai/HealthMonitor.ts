/**
 * Enhanced Health Monitor for Multi-LLM Setup
 * 
 * Provides robust health monitoring and smart request routing
 * for multiple LLM services with automatic failover.
 */

import axios from 'axios';

export interface ServiceHealth {
  name: string;
  url: string;
  specialty: 'code' | 'explanation' | 'quick' | 'general';
  isHealthy: boolean;
  responseTime: number;
  lastCheck: Date;
  consecutiveFailures: number;
  uptime: number; // percentage
  errorRate: number; // percentage
  averageResponseTime: number;
  metadata?: {
    model?: string;
    version?: string;
    capabilities?: string[];
  };
}

export interface HealthCheckResult {
  service: string;
  healthy: boolean;
  responseTime: number;
  error?: string;
  timestamp: Date;
}

export interface ServiceConfig {
  name: string;
  url: string;
  specialty: 'code' | 'explanation' | 'quick' | 'general';
  healthEndpoint?: string;
  timeout?: number;
  retryAttempts?: number;
  priority?: number; // Higher number = higher priority
  model?: string;
  capabilities?: string[];
}

export class HealthMonitor {
  private services = new Map<string, ServiceHealth>();
  private healthHistory = new Map<string, HealthCheckResult[]>();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly checkInterval = 30000; // 30 seconds
  private readonly historyLimit = 100; // Keep last 100 health checks per service
  private readonly maxConsecutiveFailures = 3;

  constructor(private serviceConfigs: ServiceConfig[]) {
    this.initializeServices();
    this.startMonitoring();
  }

  private initializeServices(): void {
    for (const config of this.serviceConfigs) {
      const health: ServiceHealth = {
        name: config.name,
        url: config.url,
        specialty: config.specialty,
        isHealthy: false,
        responseTime: 0,
        lastCheck: new Date(0),
        consecutiveFailures: 0,
        uptime: 0,
        errorRate: 0,
        averageResponseTime: 0,
        metadata: {
          model: config.model,
          capabilities: config.capabilities || []
        }
      };
      
      this.services.set(config.name, health);
      this.healthHistory.set(config.name, []);
    }
  }

  public startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Initial health check
    this.checkAllServices();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.checkAllServices();
    }, this.checkInterval);

    console.log('🔍 Health monitoring started for', this.services.size, 'services');
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('⏹️ Health monitoring stopped');
  }

  private async checkAllServices(): Promise<void> {
    const promises = Array.from(this.services.keys()).map(serviceName =>
      this.checkServiceHealth(serviceName)
    );

    await Promise.allSettled(promises);
    this.updateServiceMetrics();
  }

  private async checkServiceHealth(serviceName: string): Promise<HealthCheckResult> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const config = this.serviceConfigs.find(c => c.name === serviceName);
    if (!config) {
      throw new Error(`Config for service ${serviceName} not found`);
    }

    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      const healthEndpoint = config.healthEndpoint || `${service.url.replace('/v1', '')}/health`;
      const timeout = config.timeout || 5000;

      const response = await axios.get(healthEndpoint, {
        timeout,
        validateStatus: (status) => status < 500 // Accept 2xx, 3xx, 4xx as healthy
      });

      const responseTime = Date.now() - startTime;
      const healthy = response.status >= 200 && response.status < 400;

      result = {
        service: serviceName,
        healthy,
        responseTime,
        timestamp: new Date()
      };

      // Update service health
      service.isHealthy = healthy;
      service.responseTime = responseTime;
      service.lastCheck = new Date();
      service.consecutiveFailures = healthy ? 0 : service.consecutiveFailures + 1;

      if (healthy) {
        console.log(`✅ ${serviceName} is healthy (${responseTime}ms)`);
      } else {
        console.warn(`⚠️ ${serviceName} returned status ${response.status}`);
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      result = {
        service: serviceName,
        healthy: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };

      // Update service health
      service.isHealthy = false;
      service.responseTime = responseTime;
      service.lastCheck = new Date();
      service.consecutiveFailures += 1;

      console.error(`❌ ${serviceName} health check failed:`, error instanceof Error ? error.message : error);
    }

    // Store health check result
    const history = this.healthHistory.get(serviceName) || [];
    history.push(result);
    
    // Limit history size
    if (history.length > this.historyLimit) {
      history.splice(0, history.length - this.historyLimit);
    }
    
    this.healthHistory.set(serviceName, history);

    return result;
  }

  private updateServiceMetrics(): void {
    for (const [serviceName, service] of this.services) {
      const history = this.healthHistory.get(serviceName) || [];
      
      if (history.length === 0) continue;

      // Calculate uptime percentage
      const healthyChecks = history.filter(h => h.healthy).length;
      service.uptime = (healthyChecks / history.length) * 100;

      // Calculate error rate
      service.errorRate = ((history.length - healthyChecks) / history.length) * 100;

      // Calculate average response time
      const totalResponseTime = history.reduce((sum, h) => sum + h.responseTime, 0);
      service.averageResponseTime = totalResponseTime / history.length;
    }
  }

  public getServiceHealth(serviceName: string): ServiceHealth | undefined {
    return this.services.get(serviceName);
  }

  public getAllServicesHealth(): ServiceHealth[] {
    return Array.from(this.services.values());
  }

  public getHealthyServices(specialty?: string): ServiceHealth[] {
    return Array.from(this.services.values())
      .filter(service => {
        const isHealthy = service.isHealthy && service.consecutiveFailures < this.maxConsecutiveFailures;
        const matchesSpecialty = !specialty || service.specialty === specialty || service.specialty === 'general';
        return isHealthy && matchesSpecialty;
      })
      .sort((a, b) => {
        // Sort by uptime, then by response time
        if (a.uptime !== b.uptime) {
          return b.uptime - a.uptime;
        }
        return a.averageResponseTime - b.averageResponseTime;
      });
  }

  public getBestService(specialty: 'code' | 'explanation' | 'quick' | 'general'): ServiceHealth | null {
    const healthyServices = this.getHealthyServices(specialty);
    return healthyServices.length > 0 ? healthyServices[0] : null;
  }

  public getServiceHistory(serviceName: string): HealthCheckResult[] {
    return this.healthHistory.get(serviceName) || [];
  }

  public getOverallHealth(): {
    totalServices: number;
    healthyServices: number;
    averageUptime: number;
    averageResponseTime: number;
  } {
    const services = Array.from(this.services.values());
    const healthyServices = services.filter(s => s.isHealthy).length;
    const totalUptime = services.reduce((sum, s) => sum + s.uptime, 0);
    const totalResponseTime = services.reduce((sum, s) => sum + s.averageResponseTime, 0);

    return {
      totalServices: services.length,
      healthyServices,
      averageUptime: services.length > 0 ? totalUptime / services.length : 0,
      averageResponseTime: services.length > 0 ? totalResponseTime / services.length : 0
    };
  }

  public async forceHealthCheck(serviceName?: string): Promise<HealthCheckResult[]> {
    if (serviceName) {
      const result = await this.checkServiceHealth(serviceName);
      return [result];
    } else {
      const promises = Array.from(this.services.keys()).map(name =>
        this.checkServiceHealth(name)
      );
      const results = await Promise.allSettled(promises);
      return results
        .filter((result): result is PromiseFulfilledResult<HealthCheckResult> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    }
  }

  public addService(config: ServiceConfig): void {
    this.serviceConfigs.push(config);
    
    const health: ServiceHealth = {
      name: config.name,
      url: config.url,
      specialty: config.specialty,
      isHealthy: false,
      responseTime: 0,
      lastCheck: new Date(0),
      consecutiveFailures: 0,
      uptime: 0,
      errorRate: 0,
      averageResponseTime: 0,
      metadata: {
        model: config.model,
        capabilities: config.capabilities || []
      }
    };
    
    this.services.set(config.name, health);
    this.healthHistory.set(config.name, []);

    // Immediate health check for new service
    this.checkServiceHealth(config.name);
  }

  public removeService(serviceName: string): boolean {
    const removed = this.services.delete(serviceName);
    this.healthHistory.delete(serviceName);
    
    // Remove from config
    const configIndex = this.serviceConfigs.findIndex(c => c.name === serviceName);
    if (configIndex >= 0) {
      this.serviceConfigs.splice(configIndex, 1);
    }
    
    return removed;
  }

  public destroy(): void {
    this.stopMonitoring();
    this.services.clear();
    this.healthHistory.clear();
  }
}
