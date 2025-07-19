'use client';

import { AuditLog } from './types';

export class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLog[] = [];
  private maxLogs = 10000; // Keep last 10k logs in memory
  private retentionPeriod = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

  static getInstance(_): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger(_);
    }
    return AuditLogger.instance;
  }

  constructor(_) {
    this.loadLogsFromStorage(_);
    this.startCleanupTimer(_);
  }

  // Log an admin action
  async logAction(params: {
    action: string;
    resource: string;
    resourceId: string;
    beforeState?: any;
    afterState?: any;
    metadata?: Record<string, any>;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: 'user' | 'content' | 'system' | 'security';
  }): Promise<string> {
    const currentUser = this.getCurrentUser(_);
    
    const log: AuditLog = {
      id: this.generateLogId(_),
      timestamp: new Date(_),
      userId: currentUser?.id || 'unknown',
      userName: currentUser?.name || 'Unknown User',
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      beforeState: params.beforeState,
      afterState: params.afterState,
      ipAddress: this.getClientIP(_),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(_),
      severity: params.severity || 'medium',
      category: params.category || 'system',
      success: true,
      metadata: params.metadata || {}
    };

    this.addLog(_log);
    await this.persistLog(_log);
    
    return log.id;
  }

  // Log a failed action
  async logFailure(params: {
    action: string;
    resource: string;
    resourceId: string;
    error: Error | string;
    metadata?: Record<string, any>;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: 'user' | 'content' | 'system' | 'security';
  }): Promise<string> {
    const currentUser = this.getCurrentUser(_);
    
    const log: AuditLog = {
      id: this.generateLogId(_),
      timestamp: new Date(_),
      userId: currentUser?.id || 'unknown',
      userName: currentUser?.name || 'Unknown User',
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      ipAddress: this.getClientIP(_),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(_),
      severity: params.severity || 'high',
      category: params.category || 'system',
      success: false,
      errorMessage: params.error instanceof Error ? params.error.message : params.error,
      metadata: params.metadata || {}
    };

    this.addLog(_log);
    await this.persistLog(_log);
    
    return log.id;
  }

  // Get logs with filtering and pagination
  getLogs(params: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    action?: string;
    resource?: string;
    severity?: string;
    category?: string;
    success?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'timestamp' | 'severity' | 'action';
    sortOrder?: 'asc' | 'desc';
  } = {}): {
    logs: AuditLog[];
    total: number;
    page: number;
    totalPages: number;
  } {
    let filteredLogs = [...this.logs];

    // Apply filters
    if (_params.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= params.startDate!);
    }
    if (_params.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= params.endDate!);
    }
    if (_params.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === params.userId);
    }
    if (_params.action) {
      filteredLogs = filteredLogs.filter(log => log.action.includes(params.action!));
    }
    if (_params.resource) {
      filteredLogs = filteredLogs.filter(log => log.resource === params.resource);
    }
    if (_params.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === params.severity);
    }
    if (_params.category) {
      filteredLogs = filteredLogs.filter(log => log.category === params.category);
    }
    if (_params.success !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.success === params.success);
    }
    if (_params.search) {
      const searchLower = params.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(searchLower) ||
        log.resource.toLowerCase().includes(searchLower) ||
        log.userName.toLowerCase().includes(searchLower) ||
        (_log.errorMessage && log.errorMessage.toLowerCase().includes(searchLower))
      );
    }

    // Sort logs
    const sortBy = params.sortBy || 'timestamp';
    const sortOrder = params.sortOrder || 'desc';
    
    filteredLogs.sort( (a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (_sortBy === 'timestamp') {
        aValue = aValue.getTime(_);
        bValue = bValue.getTime(_);
      }
      
      if (_sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 50;
    const startIndex = (_page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    return {
      logs: paginatedLogs,
      total: filteredLogs.length,
      page,
      totalPages: Math.ceil(_filteredLogs.length / limit)
    };
  }

  // Export logs to CSV
  exportToCSV(params: {
    startDate?: Date;
    endDate?: Date;
    filters?: any;
  } = {}): string {
    const { logs } = this.getLogs(_params);
    
    const headers = [
      'Timestamp',
      'User',
      'Action',
      'Resource',
      'Resource ID',
      'Success',
      'Severity',
      'Category',
      'IP Address',
      'Error Message'
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.timestamp.toISOString(),
        `"${log.userName}"`,
        `"${log.action}"`,
        `"${log.resource}"`,
        `"${log.resourceId}"`,
        log.success,
        log.severity,
        log.category,
        log.ipAddress,
        log.errorMessage ? `"${log.errorMessage.replace(/"/g, '""')}"` : ''
      ].join(','))
    ];

    return csvRows.join('\n');
  }

  // Export logs to JSON
  exportToJSON(params: {
    startDate?: Date;
    endDate?: Date;
    filters?: any;
  } = {}): string {
    const { logs } = this.getLogs(_params);
    return JSON.stringify( logs, null, 2);
  }

  // Get audit statistics
  getStatistics(params: {
    startDate?: Date;
    endDate?: Date;
  } = {}): {
    totalLogs: number;
    successfulActions: number;
    failedActions: number;
    severityBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; userName: string; count: number }>;
  } {
    const { logs } = this.getLogs(_params);

    const stats = {
      totalLogs: logs.length,
      successfulActions: logs.filter(log => log.success).length,
      failedActions: logs.filter(log => !log.success).length,
      severityBreakdown: {} as Record<string, number>,
      categoryBreakdown: {} as Record<string, number>,
      topActions: [] as Array<{ action: string; count: number }>,
      topUsers: [] as Array<{ userId: string; userName: string; count: number }>
    };

    // Calculate breakdowns
    logs.forEach(log => {
      stats.severityBreakdown[log.severity] = (_stats.severityBreakdown[log.severity] || 0) + 1;
      stats.categoryBreakdown[log.category] = (_stats.categoryBreakdown[log.category] || 0) + 1;
    });

    // Calculate top actions
    const actionCounts = logs.reduce( (acc, log) => {
      acc[log.action] = (_acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    stats.topActions = Object.entries(_actionCounts)
      .sort( ([, a], [, b]) => b - a)
      .slice(0, 10)
      .map( ([action, count]) => ( { action, count }));

    // Calculate top users
    const userCounts = logs.reduce( (acc, log) => {
      const key = `${log.userId}:${log.userName}`;
      acc[key] = (_acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    stats.topUsers = Object.entries(_userCounts)
      .sort( ([, a], [, b]) => b - a)
      .slice(0, 10)
      .map( ([userKey, count]) => {
        const [userId, userName] = userKey.split(':');
        return { userId, userName, count };
      });

    return stats;
  }

  // Private methods
  private addLog(_log: AuditLog): void {
    this.logs.unshift(_log); // Add to beginning for chronological order
    
    // Trim logs if we exceed max
    if (_this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    this.saveLogsToStorage(_);
  }

  private async persistLog(_log: AuditLog): Promise<void> {
    try {
      // In a real implementation, this would send to your audit log API
      console.log('Audit log persisted:', log);
      
      // For demo purposes, we'll just store in localStorage
      // In production, this should be sent to a secure audit log service
    } catch (_error) {
      console.error('Failed to persist audit log:', error);
    }
  }

  private generateLogId(_): string {
    return `audit_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUser(_): { id: string; name: string } | null {
    // In a real implementation, get from auth context
    return {
      id: 'admin1',
      name: 'Admin User'
    };
  }

  private getClientIP(_): string {
    // In a real implementation, this would get the actual client IP
    return '127.0.0.1';
  }

  private getSessionId(_): string {
    // In a real implementation, get from session management
    return `session_${Date.now(_)}`;
  }

  private loadLogsFromStorage(_): void {
    try {
      const stored = localStorage.getItem('admin_audit_logs');
      if (stored) {
        const parsed = JSON.parse(_stored);
        this.logs = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(_log.timestamp)
        }));
      }
    } catch (_error) {
      console.error('Failed to load audit logs from storage:', error);
      this.logs = [];
    }
  }

  private saveLogsToStorage(_): void {
    try {
      localStorage.setItem( 'admin_audit_logs', JSON.stringify(this.logs));
    } catch (_error) {
      console.error('Failed to save audit logs to storage:', error);
    }
  }

  private startCleanupTimer(_): void {
    // Clean up old logs every hour
    setInterval(() => {
      this.cleanupOldLogs(_);
    }, 60 * 60 * 1000);
  }

  private cleanupOldLogs(_): void {
    const cutoffDate = new Date(_Date.now() - this.retentionPeriod);
    const initialCount = this.logs.length;
    
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);
    
    if (_this.logs.length < initialCount) {
      console.log(_`Cleaned up ${initialCount - this.logs.length} old audit logs`);
      this.saveLogsToStorage(_);
    }
  }

  // Clear all logs (_admin only)
  clearAllLogs(_): void {
    this.logs = [];
    this.saveLogsToStorage(_);
    this.logAction({
      action: 'audit_logs_cleared',
      resource: 'audit_system',
      resourceId: 'all',
      severity: 'critical',
      category: 'system'
    });
  }
}

// Singleton instance
export const auditLogger = AuditLogger.getInstance(_);

// Convenience functions for common audit actions
export const auditActions = {
  userCreated: ( userId: string, userData: any) => 
    auditLogger.logAction({
      action: 'user_created',
      resource: 'user',
      resourceId: userId,
      afterState: userData,
      severity: 'medium',
      category: 'user'
    }),

  userUpdated: ( userId: string, beforeState: any, afterState: any) =>
    auditLogger.logAction({
      action: 'user_updated',
      resource: 'user',
      resourceId: userId,
      beforeState,
      afterState,
      severity: 'medium',
      category: 'user'
    }),

  userDeleted: ( userId: string, userData: any) =>
    auditLogger.logAction({
      action: 'user_deleted',
      resource: 'user',
      resourceId: userId,
      beforeState: userData,
      severity: 'high',
      category: 'user'
    }),

  contentCreated: ( contentId: string, contentData: any) =>
    auditLogger.logAction({
      action: 'content_created',
      resource: 'content',
      resourceId: contentId,
      afterState: contentData,
      severity: 'low',
      category: 'content'
    }),

  contentUpdated: ( contentId: string, beforeState: any, afterState: any) =>
    auditLogger.logAction({
      action: 'content_updated',
      resource: 'content',
      resourceId: contentId,
      beforeState,
      afterState,
      severity: 'low',
      category: 'content'
    }),

  contentDeleted: ( contentId: string, contentData: any) =>
    auditLogger.logAction({
      action: 'content_deleted',
      resource: 'content',
      resourceId: contentId,
      beforeState: contentData,
      severity: 'medium',
      category: 'content'
    }),

  securityEvent: ( eventType: string, details: any) =>
    auditLogger.logAction({
      action: `security_${eventType}`,
      resource: 'security',
      resourceId: eventType,
      metadata: details,
      severity: 'critical',
      category: 'security'
    }),

  systemConfigChanged: ( configKey: string, beforeValue: any, afterValue: any) =>
    auditLogger.logAction({
      action: 'system_config_changed',
      resource: 'system_config',
      resourceId: configKey,
      beforeState: { [configKey]: beforeValue },
      afterState: { [configKey]: afterValue },
      severity: 'high',
      category: 'system'
    })
};
