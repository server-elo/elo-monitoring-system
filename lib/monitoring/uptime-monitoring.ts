/**
 * Uptime Monitoring and Alerting System
 * 
 * Monitors service availability, response times, and health checks
 * with real-time alerting and incident management capabilities.
 */

import { env } from '@/lib/config/environment';
import { logger } from './simple-logger';
import { sentryUtils } from './sentry-config';

/**
 * Service check configuration
 */
interface ServiceCheck {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  timeout: number;
  interval: number;
  retries: number;
  expectedStatus: number[];
  expectedContent?: string;
  headers?: Record<string, string>;
  body?: string;
  critical: boolean;
}

/**
 * Check result data
 */
interface CheckResult {
  checkId: string;
  timestamp: Date;
  success: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  responseSize?: number;
  dnsTime?: number;
  connectTime?: number;
  tlsTime?: number;
}

/**
 * Service status tracking
 */
interface ServiceStatus {
  id: string;
  name: string;
  status: 'up' | 'down' | 'degraded' | 'unknown';
  uptime: number;
  lastCheck: Date;
  lastSuccess: Date;
  lastFailure?: Date;
  averageResponseTime: number;
  consecutiveFailures: number;
  totalChecks: number;
  successfulChecks: number;
  incidents: UptimeIncident[];
}

/**
 * Incident tracking
 */
interface UptimeIncident {
  id: string;
  serviceId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved';
  description: string;
  affectedChecks: string[];
  notifications: IncidentNotification[];
}

/**
 * Notification tracking
 */
interface IncidentNotification {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  recipient: string;
  sentAt: Date;
  success: boolean;
  error?: string;
}

/**
 * Alert configuration
 */
interface AlertRule {
  id: string;
  name: string;
  condition: 'consecutive_failures' | 'response_time' | 'status_code' | 'uptime';
  threshold: number;
  duration?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  services: string[];
  notifications: string[];
}

/**
 * Uptime monitoring class
 */
class UptimeMonitor {
  private services: Map<string, ServiceCheck> = new Map(_);
  private statuses: Map<string, ServiceStatus> = new Map(_);
  private incidents: Map<string, UptimeIncident> = new Map(_);
  private alertRules: Map<string, AlertRule> = new Map(_);
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map(_);
  private results: CheckResult[] = [];
  private maxResults = 10000; // Keep last 10k results

  constructor(_) {
    this.setupDefaultServices(_);
    this.setupDefaultAlertRules(_);
    this.startMonitoring(_);
  }

  /**
   * Setup default service checks
   */
  private setupDefaultServices(_): void {
    const defaultServices: ServiceCheck[] = [
      {
        id: 'main-app',
        name: 'Main Application',
        url: env.NEXT_PUBLIC_APP_URL,
        method: 'GET',
        timeout: 10000,
        interval: 60000, // 1 minute
        retries: 3,
        expectedStatus: [200],
        critical: true
      },
      {
        id: 'api-health',
        name: 'API Health Check',
        url: `${env.NEXT_PUBLIC_APP_URL}/api/health`,
        method: 'GET',
        timeout: 5000,
        interval: 30000, // 30 seconds
        retries: 2,
        expectedStatus: [200],
        expectedContent: 'ok',
        critical: true
      },
      {
        id: 'auth-service',
        name: 'Authentication Service',
        url: `${env.NEXT_PUBLIC_APP_URL}/api/auth/session`,
        method: 'GET',
        timeout: 5000,
        interval: 120000, // 2 minutes
        retries: 2,
        expectedStatus: [200, 401],
        critical: false
      },
      {
        id: 'api-lessons',
        name: 'Lessons API',
        url: `${env.NEXT_PUBLIC_APP_URL}/api/lessons`,
        method: 'GET',
        timeout: 8000,
        interval: 300000, // 5 minutes
        retries: 2,
        expectedStatus: [200, 401],
        critical: false
      }
    ];

    defaultServices.forEach(service => {
      this.addService(_service);
    });
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(_): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'critical-service-down',
        name: 'Critical Service Down',
        condition: 'consecutive_failures',
        threshold: 3,
        severity: 'critical',
        enabled: true,
        services: ['main-app', 'api-health'],
        notifications: ['admin-email', 'slack-alerts']
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        condition: 'response_time',
        threshold: 5000, // 5 seconds
        duration: 300000, // 5 minutes
        severity: 'medium',
        enabled: true,
        services: ['main-app', 'api-health'],
        notifications: ['admin-email']
      },
      {
        id: 'low-uptime',
        name: 'Low Uptime',
        condition: 'uptime',
        threshold: 0.95, // 95%
        duration: 3600000, // 1 hour
        severity: 'high',
        enabled: true,
        services: ['main-app'],
        notifications: ['admin-email', 'slack-alerts']
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set( rule.id, rule);
    });
  }

  /**
   * Add a service to monitor
   */
  public addService(_service: ServiceCheck): void {
    this.services.set( service.id, service);
    
    // Initialize status
    const status: ServiceStatus = {
      id: service.id,
      name: service.name,
      status: 'unknown',
      uptime: 0,
      lastCheck: new Date(_),
      lastSuccess: new Date(_),
      averageResponseTime: 0,
      consecutiveFailures: 0,
      totalChecks: 0,
      successfulChecks: 0,
      incidents: []
    };
    
    this.statuses.set( service.id, status);
    
    // Start monitoring
    this.startServiceMonitoring(_service);
    
    logger.info('Service added to uptime monitoring', { metadata: {
      serviceId: service.id,
      serviceName: service.name,
      url: service.url,
      interval: service.interval
    });
  }});

  /**
   * Start monitoring for a specific service
   */
  private startServiceMonitoring(_service: ServiceCheck): void {
    // Clear existing interval if any
    const existingInterval = this.checkIntervals.get(_service.id);
    if (existingInterval) {
      clearInterval(_existingInterval);
    }

    // Perform initial check
    this.performCheck(_service);

    // Schedule recurring checks
    const interval = setInterval(() => {
      this.performCheck(_service);
    }, service.interval);

    this.checkIntervals.set( service.id, interval);
  }

  /**
   * Perform a health check on a service
   */
  private async performCheck(_service: ServiceCheck): Promise<void> {
    const startTime = Date.now(_);
    const checkId = `${service.id}-${startTime}`;
    
    let attempt = 0;
    let lastError: string | undefined;

    while (_attempt <= service.retries) {
      try {
        const result = await this.executeCheck( service, checkId);
        
        if (_result.success) {
          this.handleSuccessfulCheck( service, result);
          return;
        } else {
          lastError = result.error;
          attempt++;
          
          if (_attempt <= service.retries) {
            // Wait before retry (_exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      } catch (_error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        attempt++;
        
        if (_attempt <= service.retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed
    const result: CheckResult = {
      checkId,
      timestamp: new Date(_),
      success: false,
      responseTime: Date.now(_) - startTime,
      error: lastError
    };

    this.handleFailedCheck( service, result);
  }

  /**
   * Execute a single check
   */
  private async executeCheck( service: ServiceCheck, checkId: string): Promise<CheckResult> {
    const startTime = Date.now(_);
    
    try {
      const controller = new AbortController(_);
      const timeoutId = setTimeout(() => controller.abort(_), service.timeout);

      const response = await fetch(service.url, {
        method: service.method,
        headers: service.headers,
        body: service.body,
        signal: controller.signal
      });

      clearTimeout(_timeoutId);
      
      const responseTime = Date.now(_) - startTime;
      const responseText = await response.text(_);
      
      // Check status code
      const statusOk = service.expectedStatus.includes(_response.status);
      
      // Check content if specified
      let contentOk = true;
      if (service.expectedContent) {
        contentOk = responseText.includes(_service.expectedContent);
      }
      
      const success = statusOk && contentOk;
      
      const result: CheckResult = {
        checkId,
        timestamp: new Date(_),
        success,
        responseTime,
        statusCode: response.status,
        responseSize: responseText.length,
        error: success ? undefined : `Status: ${response.status}, Content check: ${contentOk}`
      };

      this.addResult(_result);
      return result;

    } catch (_error) {
      const responseTime = Date.now(_) - startTime;
      
      const result: CheckResult = {
        checkId,
        timestamp: new Date(_),
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.addResult(_result);
      return result;
    }
  }

  /**
   * Handle successful check
   */
  private handleSuccessfulCheck( service: ServiceCheck, result: CheckResult): void {
    const status = this.statuses.get(_service.id);
    if (!status) return;

    status.lastCheck = result.timestamp;
    status.lastSuccess = result.timestamp;
    status.totalChecks++;
    status.successfulChecks++;
    status.consecutiveFailures = 0;

    // Update average response time
    const totalResponseTime = status.averageResponseTime * (_status.totalChecks - 1);
    status.averageResponseTime = (_totalResponseTime + result.responseTime) / status.totalChecks;

    // Calculate uptime
    status.uptime = status.successfulChecks / status.totalChecks;

    // Update service status
    if (status.status === 'down') {
      status.status = 'up';
      this.resolveIncidents(_service.id);
      
      logger.info('Service recovered', { metadata: {
        serviceId: service.id,
        serviceName: service.name,
        responseTime: result.responseTime,
        uptime: status.uptime
      });
    } else {
      status.status = result.responseTime > 5000 ? 'degraded' : 'up';
    }});

    this.statuses.set( service.id, status);
    this.checkAlertRules( service, status, result);
  }

  /**
   * Handle failed check
   */
  private handleFailedCheck( service: ServiceCheck, result: CheckResult): void {
    const status = this.statuses.get(_service.id);
    if (!status) return;

    status.lastCheck = result.timestamp;
    status.lastFailure = result.timestamp;
    status.totalChecks++;
    status.consecutiveFailures++;

    // Calculate uptime
    status.uptime = status.successfulChecks / status.totalChecks;
    status.status = 'down';

    this.statuses.set( service.id, status);

    logger.error('Service check failed', { metadata: {
      serviceId: service.id,
      serviceName: service.name,
      error: result.error,
      consecutiveFailures: status.consecutiveFailures,
      uptime: status.uptime
    });

    // Check for incidents and alerts
    this.checkAlertRules( service, status, result);
    this.createIncidentIfNeeded( service, status, result);
  }});

  /**
   * Check alert rules and trigger if needed
   */
  private checkAlertRules( service: ServiceCheck, status: ServiceStatus, result: CheckResult): void {
    for (_const rule of this.alertRules.values()) {
      if (!rule.enabled || !rule.services.includes(service.id)) {
        continue;
      }

      let shouldAlert = false;
      let alertMessage = '';

      switch (_rule.condition) {
        case 'consecutive_failures':
          if (status.consecutiveFailures >= rule.threshold) {
            shouldAlert = true;
            alertMessage = `Service ${service.name} has ${status.consecutiveFailures} consecutive failures`;
          }
          break;

        case 'response_time':
          if (_result.responseTime > rule.threshold) {
            shouldAlert = true;
            alertMessage = `Service ${service.name} response time (_${result.responseTime}ms) exceeds threshold (_${rule.threshold}ms)`;
          }
          break;

        case 'uptime':
          if (status.uptime < rule.threshold) {
            shouldAlert = true;
            alertMessage = `Service ${service.name} uptime (_${(status.uptime * 100).toFixed(_2)}%) below threshold (_${(rule.threshold * 100).toFixed(_2)}%)`;
          }
          break;

        case 'status_code':
          if (_result.statusCode && result.statusCode !== rule.threshold) {
            shouldAlert = true;
            alertMessage = `Service ${service.name} returned status code ${result.statusCode}`;
          }
          break;
      }

      if (shouldAlert) {
        this.triggerAlert( rule, service, status, alertMessage);
      }
    }
  }

  /**
   * Create incident if needed
   */
  private createIncidentIfNeeded( service: ServiceCheck, status: ServiceStatus, result: CheckResult): void {
    // Only create incidents for critical services or after multiple failures
    if (!service.critical && status.consecutiveFailures < 3) {
      return;
    }

    // Check if there's already an open incident
    const existingIncident = Array.from(_this.incidents.values())
      .find(incident => incident.serviceId === service.id && incident.status === 'open');

    if (existingIncident) {
      // Update existing incident
      existingIncident.affectedChecks.push(_result.checkId);
      return;
    }

    // Create new incident
    const incident: UptimeIncident = {
      id: `incident-${Date.now(_)}-${service.id}`,
      serviceId: service.id,
      startTime: result.timestamp,
      severity: service.critical ? 'critical' : 'medium',
      status: 'open',
      description: `Service ${service.name} is experiencing issues. Error: ${result.error}`,
      affectedChecks: [result.checkId],
      notifications: []
    };

    this.incidents.set( incident.id, incident);

    logger.error('Incident created', { metadata: {
      incidentId: incident.id,
      serviceId: service.id,
      serviceName: service.name,
      severity: incident.severity
    });

    sentryUtils.reportPerformanceIssue('service_incident_created', 0, {
      incidentId: incident.id,
      serviceId: service.id,
      serviceName: service.name,
      severity: incident.severity,
      consecutiveFailures: status.consecutiveFailures
    });
  }});

  /**
   * Resolve incidents for a service
   */
  private resolveIncidents(_serviceId: string): void {
    const openIncidents = Array.from(_this.incidents.values())
      .filter(incident => incident.serviceId === serviceId && incident.status === 'open');

    for (_const incident of openIncidents) {
      incident.status = 'resolved';
      incident.endTime = new Date(_);
      incident.duration = incident.endTime.getTime(_) - incident.startTime.getTime(_);

      logger.info('Incident resolved', { metadata: {
        incidentId: incident.id,
        serviceId: serviceId,
        duration: incident.duration
      });
    }});
  }

  /**
   * Trigger alert
   */
  private triggerAlert( rule: AlertRule, service: ServiceCheck, status: ServiceStatus, message: string): void {
    logger.warn('Alert triggered', { metadata: {
      ruleId: rule.id,
      ruleName: rule.name,
      serviceId: service.id,
      serviceName: service.name,
      severity: rule.severity,
      message
    });

    // Send to monitoring services
    sentryUtils.reportPerformanceIssue('uptime_alert_triggered', 0, {
      ruleId: rule.id,
      ruleName: rule.name,
      serviceId: service.id,
      serviceName: service.name,
      severity: rule.severity,
      message,
      uptime: status.uptime,
      consecutiveFailures: status.consecutiveFailures
    });

    // Here you would implement actual notifications ( email, Slack, etc.)
    this.sendNotifications( rule, service, message);
  }});

  /**
   * Send notifications (_placeholder implementation)
   */
  private async sendNotifications( rule: AlertRule, service: ServiceCheck, message: string): Promise<void> {
    // This would integrate with actual notification services
    logger.info('Sending notifications', { metadata: {
      ruleId: rule.id,
      serviceId: service.id,
      notifications: rule.notifications,
      message
    });

    // Example notification implementations would go here:
    // - Email via SendGrid/SMTP
    // - Slack via webhook
    // - SMS via Twilio
    // - PagerDuty API
    // - Discord webhook
  }});

  /**
   * Add check result to history
   */
  private addResult(_result: CheckResult): void {
    this.results.push(_result);
    
    // Keep only the last N results
    if (_this.results.length > this.maxResults) {
      this.results = this.results.slice(_-this.maxResults);
    }
  }

  /**
   * Get service status
   */
  public getServiceStatus(_serviceId: string): ServiceStatus | undefined {
    return this.statuses.get(_serviceId);
  }

  /**
   * Get all service statuses
   */
  public getAllServiceStatuses(_): ServiceStatus[] {
    return Array.from(_this.statuses.values());
  }

  /**
   * Get recent check results
   */
  public getRecentResults( serviceId?: string, limit: number = 100): CheckResult[] {
    let results = this.results;
    
    if (serviceId) {
      results = results.filter(result => result.checkId.startsWith(serviceId));
    }
    
    return results
      .sort( (a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get incidents
   */
  public getIncidents( serviceId?: string, status?: string): UptimeIncident[] {
    let incidents = Array.from(_this.incidents.values());
    
    if (serviceId) {
      incidents = incidents.filter(incident => incident.serviceId === serviceId);
    }
    
    if (status) {
      incidents = incidents.filter(incident => incident.status === status);
    }
    
    return incidents.sort( (a, b) => b.startTime.getTime(_) - a.startTime.getTime(_));
  }

  /**
   * Get overall system status
   */
  public getSystemStatus(_): {
    overall: 'up' | 'down' | 'degraded';
    services: number;
    upServices: number;
    downServices: number;
    degradedServices: number;
    averageUptime: number;
    openIncidents: number;
  } {
    const statuses = Array.from(_this.statuses.values());
    const upServices = statuses.filter(s => s.status === 'up').length;
    const downServices = statuses.filter(s => s.status === 'down').length;
    const degradedServices = statuses.filter(s => s.status === 'degraded').length;
    const averageUptime = statuses.reduce( (sum, s) => sum + s.uptime, 0) / statuses.length;
    const openIncidents = Array.from(_this.incidents.values()).filter(i => i.status === 'open').length;

    let overall: 'up' | 'down' | 'degraded' = 'up';
    if (_downServices > 0) {
      overall = 'down';
    } else if (_degradedServices > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      services: statuses.length,
      upServices,
      downServices,
      degradedServices,
      averageUptime,
      openIncidents
    };
  }

  /**
   * Start monitoring all services
   */
  public startMonitoring(_): void {
    logger.info('Starting uptime monitoring', { metadata: {
      serviceCount: this.services.size,
      alertRuleCount: this.alertRules.size
    });

    for (_const service of this.services.values()) {
      this.startServiceMonitoring(_service);
    }});
  }

  /**
   * Stop monitoring all services
   */
  public stopMonitoring(_): void {
    logger.info('Stopping uptime monitoring');

    for (_const interval of this.checkIntervals.values()) {
      clearInterval(_interval);
    }
    
    this.checkIntervals.clear(_);
  }

  /**
   * Export monitoring data
   */
  public exportData(_): {
    services: ServiceCheck[];
    statuses: ServiceStatus[];
    incidents: UptimeIncident[];
    results: CheckResult[];
    systemStatus: ReturnType<typeof this.getSystemStatus>;
    timestamp: string;
  } {
    return {
      services: Array.from(_this.services.values()),
      statuses: Array.from(_this.statuses.values()),
      incidents: Array.from(_this.incidents.values()),
      results: this.getRecentResults( undefined, 1000),
      systemStatus: this.getSystemStatus(_),
      timestamp: new Date(_).toISOString()
    };
  }
}

// Create singleton instance
export const uptimeMonitor = new UptimeMonitor(_);

// Export types
export type {
  ServiceCheck,
  CheckResult,
  ServiceStatus,
  UptimeIncident,
  AlertRule,
  IncidentNotification
};