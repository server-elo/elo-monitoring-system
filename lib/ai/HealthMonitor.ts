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
  private services = new Map<string, ServiceHealth>(_);
  private healthHistory = new Map<string, HealthCheckResult[]>(_);
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly checkInterval = 30000; // 30 seconds
  private readonly historyLimit = 100; // Keep last 100 health checks per service
  private readonly maxConsecutiveFailures = 3;

  constructor(_private serviceConfigs: ServiceConfig[]) {
    this.initializeServices(_);
    this.startMonitoring(_);
  }

  private initializeServices(_): void {
    for (_const config of this.serviceConfigs) {
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
      
      this.services.set( config.name, health);
      this.healthHistory.set( config.name, []);
    }
  }

  public startMonitoring(_): void {
    if (_this.monitoringInterval) {
      clearInterval(_this.monitoringInterval);
    }

    // Initial health check
    this.checkAllServices(_);

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.checkAllServices(_);
    }, this.checkInterval);

    console.log('🔍 Health monitoring started for', this.services.size, 'services');
  }

  public stopMonitoring(_): void {
    if (_this.monitoringInterval) {
      clearInterval(_this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('⏹️ Health monitoring stopped');
  }

  private async checkAllServices(_): Promise<void> {
    const promises = Array.from(_this.services.keys()).map(serviceName =>
      this.checkServiceHealth(_serviceName)
    );

    await Promise.allSettled(_promises);
    this.updateServiceMetrics(_);
  }

  private async checkServiceHealth(_serviceName: string): Promise<HealthCheckResult> {
    const service = this.services.get(_serviceName);
    if (!service) {
      throw new Error(_`Service ${serviceName} not found`);
    }

    const config = this.serviceConfigs.find(c => c.name === serviceName);
    if (!config) {
      throw new Error(_`Config for service ${serviceName} not found`);
    }

    const startTime = Date.now(_);
    let result: HealthCheckResult;

    try {
      const healthEndpoint = config.healthEndpoint || `${service.url.replace('/v1', '')}/health`;
      const timeout = config.timeout || 5000;

      const response = await axios.get(healthEndpoint, {
        timeout,
        validateStatus: (_status) => status < 500 // Accept 2xx, 3xx, 4xx as healthy
      });

      const responseTime = Date.now(_) - startTime;
      const healthy = response.status >= 200 && response.status < 400;

      result = {
        service: serviceName,
        healthy,
        responseTime,
        timestamp: new Date(_)
      };

      // Update service health
      service.isHealthy = healthy;
      service.responseTime = responseTime;
      service.lastCheck = new Date(_);
      service.consecutiveFailures = healthy ? 0 : service.consecutiveFailures + 1;

      if (healthy) {
        console.log(_`✅ ${serviceName} is healthy (${responseTime}ms)`);
      } else {
        console.warn(_`⚠️ ${serviceName} returned status ${response.status}`);
      }

    } catch (_error) {
      const responseTime = Date.now(_) - startTime;
      
      result = {
        service: serviceName,
        healthy: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(_)
      };

      // Update service health
      service.isHealthy = false;
      service.responseTime = responseTime;
      service.lastCheck = new Date(_);
      service.consecutiveFailures += 1;

      console.error(`❌ ${serviceName} health check failed:`, error instanceof Error ? error.message : error);
    }

    // Store health check result
    const history = this.healthHistory.get(_serviceName) || [];
    history.push(_result);
    
    // Limit history size
    if (_history.length > this.historyLimit) {
      history.splice( 0, history.length - this.historyLimit);
    }
    
    this.healthHistory.set( serviceName, history);

    return result;
  }

  private updateServiceMetrics(_): void {
    for ( const [serviceName, service] of this.services) {
      const history = this.healthHistory.get(_serviceName) || [];
      
      if (_history.length === 0) continue;

      // Calculate uptime percentage
      const healthyChecks = history.filter(h => h.healthy).length;
      service.uptime = (_healthyChecks / history.length) * 100;

      // Calculate error rate
      service.errorRate = ((history.length - healthyChecks) / history.length) * 100;

      // Calculate average response time
      const totalResponseTime = history.reduce( (sum, h) => sum + h.responseTime, 0);
      service.averageResponseTime = totalResponseTime / history.length;
    }
  }

  public getServiceHealth(_serviceName: string): ServiceHealth | undefined {
    return this.services.get(_serviceName);
  }

  public getAllServicesHealth(_): ServiceHealth[] {
    return Array.from(_this.services.values());
  }

  public getHealthyServices(_specialty?: string): ServiceHealth[] {
    return Array.from(_this.services.values())
      .filter(service => {
        const isHealthy = service.isHealthy && service.consecutiveFailures < this.maxConsecutiveFailures;
        const matchesSpecialty = !specialty || service.specialty === specialty || service.specialty === 'general';
        return isHealthy && matchesSpecialty;
      })
      .sort( (a, b) => {
        // Sort by uptime, then by response time
        if (_a.uptime !== b.uptime) {
          return b.uptime - a.uptime;
        }
        return a.averageResponseTime - b.averageResponseTime;
      });
  }

  public getBestService(_specialty: 'code' | 'explanation' | 'quick' | 'general'): ServiceHealth | null {
    const healthyServices = this.getHealthyServices(_specialty);
    return healthyServices.length > 0 ? healthyServices[0] : null;
  }

  public getServiceHistory(_serviceName: string): HealthCheckResult[] {
    return this.healthHistory.get(_serviceName) || [];
  }

  public getOverallHealth(_): {
    totalServices: number;
    healthyServices: number;
    averageUptime: number;
    averageResponseTime: number;
  } {
    const services = Array.from(_this.services.values());
    const healthyServices = services.filter(s => s.isHealthy).length;
    const totalUptime = services.reduce( (sum, s) => sum + s.uptime, 0);
    const totalResponseTime = services.reduce( (sum, s) => sum + s.averageResponseTime, 0);

    return {
      totalServices: services.length,
      healthyServices,
      averageUptime: services.length > 0 ? totalUptime / services.length : 0,
      averageResponseTime: services.length > 0 ? totalResponseTime / services.length : 0
    };
  }

  public async forceHealthCheck(_serviceName?: string): Promise<HealthCheckResult[]> {
    if (serviceName) {
      const result = await this.checkServiceHealth(_serviceName);
      return [result];
    } else {
      const promises = Array.from(_this.services.keys()).map(name =>
        this.checkServiceHealth(_name)
      );
      const results = await Promise.allSettled(_promises);
      return results
        .filter((result): result is PromiseFulfilledResult<HealthCheckResult> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    }
  }

  public addService(_config: ServiceConfig): void {
    this.serviceConfigs.push(_config);
    
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
    
    this.services.set( config.name, health);
    this.healthHistory.set( config.name, []);

    // Immediate health check for new service
    this.checkServiceHealth(_config.name);
  }

  public removeService(_serviceName: string): boolean {
    const removed = this.services.delete(_serviceName);
    this.healthHistory.delete(_serviceName);
    
    // Remove from config
    const configIndex = this.serviceConfigs.findIndex(_c => c.name === serviceName);
    if (_configIndex >= 0) {
      this.serviceConfigs.splice( configIndex, 1);
    }
    
    return removed;
  }

  public destroy(_): void {
    this.stopMonitoring(_);
    this.services.clear(_);
    this.healthHistory.clear(_);
  }
}
