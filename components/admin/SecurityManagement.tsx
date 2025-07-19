'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Key, Eye, AlertTriangle, CheckCircle, XCircle, Settings, Database, Search, Download, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { SecurityEvent } from '@/lib/admin/types';
import { adminAuth } from '@/lib/admin/auth';

interface SecurityManagementProps {
  className?: string;
}

interface SecurityEventDetailProps {
  event: SecurityEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (eventId: string, resolution: string) => void;
}

function SecurityEventDetail({ event, isOpen, onClose, onResolve }: SecurityEventDetailProps) {
  const [resolution, setResolution] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  if (!isOpen || !event) return null;

  const handleResolve = async () => {
    if (!resolution.trim()) return;

    setIsResolving(true);
    try {
      await onResolve(event.id, resolution);
      onClose();
    } catch (error) {
      console.error('Failed to resolve security event:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-400/30';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-400/30';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-400/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-400/30';
    }
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
        className="bg-gray-900 rounded-lg border border-white/20 w-full max-w-3xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Security Event Details</h2>
            <p className="text-gray-400 text-sm mt-1">Event ID: {event.id}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={cn('px-3 py-1 rounded-full text-xs font-medium border', getSeverityColor(event.severity))}>
              {event.severity} severity
            </span>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Information */}
            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-medium text-white mb-4">Event Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">{event.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Timestamp:</span>
                  <span className="text-white">{event.timestamp.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">IP Address:</span>
                  <span className="text-white font-mono">{event.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User ID:</span>
                  <span className="text-white">{event.userId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={cn('flex items-center space-x-1', event.resolved ? 'text-green-400' : 'text-red-400')}>
                    {event.resolved ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    <span>{event.resolved ? 'Resolved' : 'Unresolved'}</span>
                  </span>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-medium text-white mb-4">Description</h3>
              <div className="bg-black/20 rounded p-3">
                <p className="text-gray-300 text-sm">{event.description}</p>
              </div>
            </Card>

            {/* User Agent */}
            <Card className="bg-white/5 border-white/10 p-4 lg:col-span-2">
              <h3 className="font-medium text-white mb-4">User Agent</h3>
              <div className="bg-black/20 rounded p-3">
                <p className="text-gray-300 text-xs break-all">{event.userAgent}</p>
              </div>
            </Card>

            {/* Metadata */}
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <Card className="bg-white/5 border-white/10 p-4 lg:col-span-2">
                <h3 className="font-medium text-white mb-4">Additional Information</h3>
                <div className="bg-black/20 rounded p-3 overflow-auto max-h-40">
                  <pre className="text-gray-300 text-xs">{JSON.stringify(event.metadata, null, 2)}</pre>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Actions */}
        {!event.resolved && (
          <div className="p-6 border-t border-white/10">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resolution Notes
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
                placeholder="Describe how this security event was resolved..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                disabled={!resolution.trim() || isResolving}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isResolving ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Resolving...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Resolved
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function SecurityManagement({ className }: SecurityManagementProps) {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'access' | 'settings'>('events');
  const [filters, setFilters] = useState({
    type: 'all',
    severity: 'all',
    resolved: 'all',
    search: ''
  });

  useEffect(() => {
    loadSecurityEvents();
  }, [filters]);

  const loadSecurityEvents = async () => {
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock security events
    const mockEvents: SecurityEvent[] = [
      {
        id: 'sec_001',
        type: 'login_failure',
        severity: 'medium',
        userId: 'user123',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        description: 'Multiple failed login attempts detected from this IP address',
        metadata: {
          attemptCount: 5,
          lastAttempt: new Date(Date.now() - 300000),
          targetAccount: 'admin@example.com'
        },
        resolved: false
      },
      {
        id: 'sec_002',
        type: 'suspicious_activity',
        severity: 'high',
        userId: 'user456',
        ipAddress: '10.0.0.50',
        userAgent: 'curl/7.68.0',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        description: 'Unusual API access pattern detected - potential automated attack',
        metadata: {
          requestCount: 1000,
          timeWindow: '5 minutes',
          endpoints: ['/api/users', '/api/content', '/api/admin']
        },
        resolved: true,
        resolvedAt: new Date(Date.now() - 3600000),
        resolvedBy: 'admin_1'
      },
      {
        id: 'sec_003',
        type: 'unauthorized_access',
        severity: 'critical',
        userId: undefined,
        ipAddress: '203.0.113.42',
        userAgent: 'Python-requests/2.25.1',
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
        description: 'Attempt to access admin panel without proper authentication',
        metadata: {
          attemptedEndpoint: '/admin/users',
          method: 'POST',
          payload: 'suspicious'
        },
        resolved: false
      }
    ];

    // Apply filters
    let filteredEvents = mockEvents;

    if (filters.type !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.type === filters.type);
    }
    if (filters.severity !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.severity === filters.severity);
    }
    if (filters.resolved !== 'all') {
      filteredEvents = filteredEvents.filter(event =>
        filters.resolved === 'true' ? event.resolved : !event.resolved
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredEvents = filteredEvents.filter(event =>
        event.description.toLowerCase().includes(searchLower) ||
        event.ipAddress.includes(searchLower) ||
        event.type.toLowerCase().includes(searchLower)
      );
    }

    setSecurityEvents(filteredEvents);
    setLoading(false);
  };

  const handleResolveEvent = async (eventId: string, _resolution: string) => {
    setSecurityEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: adminAuth.getCurrentUser()?.id || 'unknown'
        };
      }
      return event;
    }));
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login_failure': return Lock;
      case 'suspicious_activity': return AlertTriangle;
      case 'unauthorized_access': return Shield;
      case 'data_breach': return Database;
      case 'permission_escalation': return Key;
      default: return AlertTriangle;
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
          <h1 className="text-3xl font-bold text-white">Security Management</h1>
          <p className="text-gray-400 mt-1">Monitor security events and manage access controls</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={loadSecurityEvents}
            disabled={loading}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-1">
        {[
          { id: 'events', label: 'Security Events', icon: AlertTriangle },
          { id: 'access', label: 'Access Control', icon: Lock },
          { id: 'settings', label: 'Security Settings', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Security Events Tab */}
      {activeTab === 'events' && (
        <>
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
                    placeholder="Search events..."
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Types</option>
                  <option value="login_failure">Login Failure</option>
                  <option value="suspicious_activity">Suspicious Activity</option>
                  <option value="unauthorized_access">Unauthorized Access</option>
                  <option value="data_breach">Data Breach</option>
                  <option value="permission_escalation">Permission Escalation</option>
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
                  value={filters.resolved}
                  onChange={(e) => setFilters(prev => ({ ...prev, resolved: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All</option>
                  <option value="false">Unresolved</option>
                  <option value="true">Resolved</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Events List */}
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
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Event</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Severity</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Source</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Time</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {securityEvents.map((event) => {
                      const TypeIcon = getTypeIcon(event.type);

                      return (
                        <motion.tr
                          key={event.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <TypeIcon className="w-5 h-5 text-red-400" />
                              <div>
                                <div className="font-medium text-white">Security Event</div>
                                <div className="text-sm text-gray-400 max-w-xs truncate">{event.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-white capitalize">{event.type.replace('_', ' ')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              getSeverityColor(event.severity)
                            )}>
                              {event.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className="text-white font-mono">{event.ipAddress}</div>
                              {event.userId && (
                                <div className="text-gray-400 text-xs">User: {event.userId}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={cn('flex items-center space-x-1', event.resolved ? 'text-green-400' : 'text-red-400')}>
                              {event.resolved ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                              <span className="text-sm">{event.resolved ? 'Resolved' : 'Unresolved'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white">{formatRelativeTime(event.timestamp)}</div>
                            <div className="text-xs text-gray-400">{event.timestamp.toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              onClick={() => {
                                setSelectedEvent(event);
                                setShowEventModal(true);
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
        </>
      )}

      {/* Access Control Tab */}
      {activeTab === 'access' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Role-Based Access Control</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Admin Role</div>
                  <div className="text-sm text-gray-400">Full system access</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-400">3 users</span>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Instructor Role</div>
                  <div className="text-sm text-gray-400">Content management access</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-blue-400">12 users</span>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Student Role</div>
                  <div className="text-sm text-gray-400">Learning access only</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">1,247 users</span>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create New Role
            </Button>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">IP Whitelist</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="font-mono text-white">192.168.1.0/24</div>
                  <div className="text-sm text-gray-400">Office network</div>
                </div>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="font-mono text-white">10.0.0.0/8</div>
                  <div className="text-sm text-gray-400">VPN range</div>
                </div>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add IP Range
            </Button>
          </Card>
        </div>
      )}

      {/* Security Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Authentication Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-400">Require 2FA for admin accounts</div>
                </div>
                <div className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Session Timeout</div>
                  <div className="text-sm text-gray-400">Auto-logout after inactivity</div>
                </div>
                <select className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                  <option>4 hours</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Password Policy</div>
                  <div className="text-sm text-gray-400">Minimum 12 characters, mixed case</div>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Security Monitoring</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Failed Login Alerts</div>
                  <div className="text-sm text-gray-400">Alert after 5 failed attempts</div>
                </div>
                <div className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Suspicious Activity Detection</div>
                  <div className="text-sm text-gray-400">AI-powered threat detection</div>
                </div>
                <div className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Audit Log Retention</div>
                  <div className="text-sm text-gray-400">Keep logs for compliance</div>
                </div>
                <select className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm">
                  <option>1 year</option>
                  <option>2 years</option>
                  <option>5 years</option>
                  <option>Forever</option>
                </select>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Security Event Detail Modal */}
      <AnimatePresence>
        <SecurityEventDetail
          event={selectedEvent}
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          onResolve={handleResolveEvent}
        />
      </AnimatePresence>
    </div>
  );
}