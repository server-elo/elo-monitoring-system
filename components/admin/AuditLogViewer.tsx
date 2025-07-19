'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Search, Download, RefreshCw, User, Shield, CheckCircle, XCircle, FileText, Settings, Activity } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { AuditLog } from '@/lib/admin/types';
import { auditLogger } from '@/lib/admin/auditLogger';

interface AuditLogViewerProps {
  className?: string;
}

interface LogDetailModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

function LogDetailModal({ log, isOpen, onClose }: LogDetailModalProps) {
  if (!isOpen || !log) return null;

  const formatJSON = (obj: any): string => {
    if (!obj) return 'N/A';
    return JSON.stringify(obj, null, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-lg border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Audit Log Details</h2>
            <p className="text-gray-400 text-sm mt-1">Log ID: {log.id}</p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-medium text-white mb-4">Basic Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Timestamp:</span>
                  <span className="text-white">{log.timestamp.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User:</span>
                  <span className="text-white">{log.userName} ({log.userId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Action:</span>
                  <span className="text-white">{log.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resource:</span>
                  <span className="text-white">{log.resource}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resource ID:</span>
                  <span className="text-white font-mono text-xs">{log.resourceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success:</span>
                  <span className={cn('flex items-center space-x-1', log.success ? 'text-green-400' : 'text-red-400')}>
                    {log.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{log.success ? 'Yes' : 'No'}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Severity:</span>
                  <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    log.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    log.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    log.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  )}>
                    {log.severity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Category:</span>
                  <span className="text-white capitalize">{log.category}</span>
                </div>
              </div>
            </Card>

            {/* Session Information */}
            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-medium text-white mb-4">Session Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">IP Address:</span>
                  <span className="text-white font-mono">{log.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Session ID:</span>
                  <span className="text-white font-mono text-xs">{log.sessionId}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-2">User Agent:</span>
                  <span className="text-white text-xs break-all">{log.userAgent}</span>
                </div>
              </div>
            </Card>

            {/* Error Information */}
            {log.errorMessage && (
              <Card className="bg-red-500/10 border-red-400/30 p-4 lg:col-span-2">
                <h3 className="font-medium text-red-400 mb-4">Error Information</h3>
                <div className="bg-black/20 rounded p-3">
                  <pre className="text-red-300 text-sm whitespace-pre-wrap">{log.errorMessage}</pre>
                </div>
              </Card>
            )}

            {/* Before State */}
            {log.beforeState && (
              <Card className="bg-white/5 border-white/10 p-4">
                <h3 className="font-medium text-white mb-4">Before State</h3>
                <div className="bg-black/20 rounded p-3 overflow-auto max-h-40">
                  <pre className="text-gray-300 text-xs">{formatJSON(log.beforeState)}</pre>
                </div>
              </Card>
            )}

            {/* After State */}
            {log.afterState && (
              <Card className="bg-white/5 border-white/10 p-4">
                <h3 className="font-medium text-white mb-4">After State</h3>
                <div className="bg-black/20 rounded p-3 overflow-auto max-h-40">
                  <pre className="text-gray-300 text-xs">{formatJSON(log.afterState)}</pre>
                </div>
              </Card>
            )}

            {/* Metadata */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <Card className="bg-white/5 border-white/10 p-4 lg:col-span-2">
                <h3 className="font-medium text-white mb-4">Metadata</h3>
                <div className="bg-black/20 rounded p-3 overflow-auto max-h-40">
                  <pre className="text-gray-300 text-xs">{formatJSON(log.metadata)}</pre>
                </div>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AuditLogViewer({ className }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    severity: 'all',
    success: 'all',
    startDate: '',
    endDate: '',
    userId: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [sortBy] = useState<'timestamp' | 'severity' | 'action'>('timestamp');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadLogs();
  }, [filters, pagination.page, sortBy, sortOrder]);

  const loadLogs = async () => {
    setLoading(true);
    
    try {
      const params = {
        search: filters.search || undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        severity: filters.severity !== 'all' ? filters.severity : undefined,
        success: filters.success !== 'all' ? filters.success === 'true' : undefined,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        userId: filters.userId || undefined,
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder
      };

      const result = auditLogger.getLogs(params);
      
      setLogs(result.logs);
      setPagination(prev => ({
        ...prev,
        total: result.total,
        totalPages: result.totalPages
      }));
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csv = auditLogger.exportToCSV({
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const json = auditLogger.exportToJSON({
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined
    });
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10';
      case 'high': return 'text-orange-400 bg-orange-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'low': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user': return User;
      case 'content': return FileText;
      case 'system': return Settings;
      case 'security': return Shield;
      default: return Activity;
    }
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-400 mt-1">Track all administrative actions and system events</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={handleExportJSON}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button
            onClick={loadLogs}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search logs..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            >
              <option value="all">All Categories</option>
              <option value="user">User</option>
              <option value="content">Content</option>
              <option value="system">System</option>
              <option value="security">Security</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={filters.success}
              onChange={(e) => setFilters(prev => ({ ...prev, success: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            >
              <option value="all">All</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
            <input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
            <input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-600 animate-pulse rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="w-1/2 h-4 bg-gray-600 animate-pulse rounded" />
                    <div className="w-1/3 h-3 bg-gray-600 animate-pulse rounded" />
                  </div>
                  <div className="w-20 h-6 bg-gray-600 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Timestamp</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Action</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Resource</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Severity</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {logs.map((log) => {
                  const CategoryIcon = getCategoryIcon(log.category);
                  
                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{formatRelativeTime(log.timestamp)}</div>
                        <div className="text-xs text-gray-400">{log.timestamp.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-white">{log.userName}</div>
                            <div className="text-xs text-gray-400">{log.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-white">{log.action}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{log.resource}</div>
                        <div className="text-xs text-gray-400 font-mono">{log.resourceId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn('flex items-center space-x-1', log.success ? 'text-green-400' : 'text-red-400')}>
                          {log.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          <span className="text-sm">{log.success ? 'Success' : 'Failed'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getSeverityColor(log.severity)
                        )}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailModal(true);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            Previous
          </Button>
          <Button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        <LogDetailModal
          log={selectedLog}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLog(null);
          }}
        />
      </AnimatePresence>
    </div>
  );
}
