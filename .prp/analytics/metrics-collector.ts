export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export class MetricsCollector {
  private metrics: Metric[] = [];
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  collect(name: string, value: number, tags?: Record<string, string>) {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      tags
    };
    
    this.metrics.push(metric);
    
    if (this.config.analytics.realtime) {
      this.sendRealtime(metric);
    }
  }

  private sendRealtime(metric: Metric) {
    // Send to analytics endpoint
    console.log(`[Analytics] ${metric.name}: ${metric.value}`);
  }

  getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return this.metrics;
  }

  clear() {
    this.metrics = [];
  }
}