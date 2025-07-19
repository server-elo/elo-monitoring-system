export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  details?: any;
}

export class HealthMonitor {
  private checks: Map<string, () => Promise<HealthStatus>> = new Map();

  register(service: string, check: () => Promise<HealthStatus>) {
    this.checks.set(service, check);
  }

  async checkAll(): Promise<HealthStatus[]> {
    const results: HealthStatus[] = [];
    
    for (const [service, check] of this.checks) {
      try {
        const status = await check();
        results.push(status);
      } catch (error) {
        results.push({
          service,
          status: 'unhealthy',
          timestamp: new Date(),
          details: { error: error.message }
        });
      }
    }
    
    return results;
  }

  async checkService(service: string): Promise<HealthStatus | null> {
    const check = this.checks.get(service);
    if (!check) return null;
    
    try {
      return await check();
    } catch (error) {
      return {
        service,
        status: 'unhealthy',
        timestamp: new Date(),
        details: { error: error.message }
      };
    }
  }
}