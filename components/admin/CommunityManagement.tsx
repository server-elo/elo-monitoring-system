'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Flag, Eye, MessageSquare, Ban, CheckCircle, XCircle, Clock, Search, MoreVertical, FileText, User, Calendar, Star, Hash } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { CommunityReport } from '@/lib/admin/types';
;

interface CommunityManagementProps {
  className?: string;
}

interface ReportDetailModalProps {
  report: CommunityReport | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (reportId: string, action: string, resolution?: string) => void;
}

function ReportDetailModal({ report, isOpen, onClose, onAction }: ReportDetailModalProps) {
  const [resolution, setResolution] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !report) return null;

  const handleAction = async (action: string) => {
    setIsProcessing(true);
    try {
      await onAction(report.id, action, resolution);
      onClose();
    } catch (error) {
      console.error('Failed to process report action:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'spam': return 'text-yellow-400 bg-yellow-500/10';
      case 'harassment': return 'text-red-400 bg-red-500/10';
      case 'inappropriate': return 'text-orange-400 bg-orange-500/10';
      case 'copyright': return 'text-purple-400 bg-purple-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
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
        className="bg-gray-900 rounded-lg border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Report Details</h2>
            <p className="text-gray-400 text-sm mt-1">Report ID: {report.id}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={cn('px-2 py-1 rounded text-xs font-medium', getPriorityColor(report.priority))}>
              {report.priority} priority
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
            {/* Report Information */}
            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-medium text-white mb-4">Report Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Reporter:</span>
                  <span className="text-white">{report.reporterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Target Type:</span>
                  <span className="text-white capitalize">{report.targetType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Target ID:</span>
                  <span className="text-white font-mono text-xs">{report.targetId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reason:</span>
                  <span className={cn('px-2 py-1 rounded text-xs font-medium', getReasonColor(report.reason))}>
                    {report.reason}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    report.status === 'resolved' ? 'text-green-400 bg-green-500/10' :
                    report.status === 'investigating' ? 'text-yellow-400 bg-yellow-500/10' :
                    report.status === 'dismissed' ? 'text-gray-400 bg-gray-500/10' :
                    'text-blue-400 bg-blue-500/10'
                  )}>
                    {report.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">{report.createdAt.toLocaleString()}</span>
                </div>
                {report.assignedTo && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Assigned to:</span>
                    <span className="text-white">{report.assignedTo}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Description */}
            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-medium text-white mb-4">Description</h3>
              <div className="bg-black/20 rounded p-3">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{report.description}</p>
              </div>
            </Card>

            {/* Evidence */}
            {report.evidence && report.evidence.length > 0 && (
              <Card className="bg-white/5 border-white/10 p-4 lg:col-span-2">
                <h3 className="font-medium text-white mb-4">Evidence</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {report.evidence.map((_, index) => (
                    <div key={index} className="bg-black/20 rounded p-3 text-center">
                      <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">Evidence {index + 1}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Resolution */}
            {report.status !== 'pending' && (
              <Card className="bg-white/5 border-white/10 p-4 lg:col-span-2">
                <h3 className="font-medium text-white mb-4">Resolution</h3>
                <div className="bg-black/20 rounded p-3">
                  <p className="text-gray-300 text-sm">
                    {report.resolution || 'No resolution provided yet.'}
                  </p>
                  {report.resolvedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Resolved on {report.resolvedAt.toLocaleString()}
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Actions */}
        {report.status === 'pending' && (
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
                placeholder="Enter resolution notes..."
              />
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => handleAction('investigate')}
                disabled={isProcessing}
                variant="outline"
                className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                <Eye className="w-4 h-4 mr-2" />
                Investigate
              </Button>
              <Button
                onClick={() => handleAction('resolve')}
                disabled={isProcessing || !resolution}
                variant="outline"
                className="border-green-400/30 text-green-400 hover:bg-green-500/10"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolve
              </Button>
              <Button
                onClick={() => handleAction('dismiss')}
                disabled={isProcessing}
                variant="outline"
                className="border-gray-400/30 text-gray-400 hover:bg-gray-500/10"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function CommunityManagement({ className }: CommunityManagementProps) {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    reason: 'all',
    targetType: 'all',
    search: ''
  });
  const [activeTab, setActiveTab] = useState<'reports' | 'moderation' | 'analytics'>('reports');

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock reports data
    const mockReports: CommunityReport[] = [
      {
        id: 'report1',
        reporterId: 'user1',
        reporterName: 'Alice Johnson',
        targetType: 'comment',
        targetId: 'comment123',
        reason: 'harassment',
        description: 'User is posting offensive comments and harassing other students in the discussion forum.',
        status: 'pending',
        priority: 'high',
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        evidence: ['screenshot1.png', 'screenshot2.png']
      },
      {
        id: 'report2',
        reporterId: 'user2',
        reporterName: 'Bob Smith',
        targetType: 'user',
        targetId: 'user456',
        reason: 'spam',
        description: 'This user is posting spam links in multiple lesson comments.',
        status: 'investigating',
        priority: 'medium',
        assignedTo: 'moderator1',
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      },
      {
        id: 'report3',
        reporterId: 'user3',
        reporterName: 'Carol Davis',
        targetType: 'forum_post',
        targetId: 'post789',
        reason: 'inappropriate',
        description: 'Post contains inappropriate content not suitable for educational environment.',
        status: 'resolved',
        priority: 'low',
        assignedTo: 'moderator2',
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        resolvedAt: new Date(Date.now() - 3600000),
        resolution: 'Content has been reviewed and removed. User has been warned.'
      }
    ];

    // Apply filters
    let filteredReports = mockReports;
    
    if (filters.status !== 'all') {
      filteredReports = filteredReports.filter(report => report.status === filters.status);
    }
    if (filters.priority !== 'all') {
      filteredReports = filteredReports.filter(report => report.priority === filters.priority);
    }
    if (filters.reason !== 'all') {
      filteredReports = filteredReports.filter(report => report.reason === filters.reason);
    }
    if (filters.targetType !== 'all') {
      filteredReports = filteredReports.filter(report => report.targetType === filters.targetType);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredReports = filteredReports.filter(report =>
        report.description.toLowerCase().includes(searchLower) ||
        report.reporterName.toLowerCase().includes(searchLower)
      );
    }

    setReports(filteredReports);
    setLoading(false);
  };

  const handleReportAction = async (reportId: string, action: string, resolution?: string) => {
    console.log(`Report ${reportId} action: ${action}`, { resolution });
    
    // Update report status
    setReports(prev => prev.map(report => {
      if (report.id === reportId) {
        return {
          ...report,
          status: action === 'investigate' ? 'investigating' : 
                 action === 'resolve' ? 'resolved' : 'dismissed',
          resolution: resolution || report.resolution,
          resolvedAt: action === 'resolve' ? new Date() : report.resolvedAt
        };
      }
      return report;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-400 bg-green-500/10';
      case 'investigating': return 'text-yellow-400 bg-yellow-500/10';
      case 'dismissed': return 'text-gray-400 bg-gray-500/10';
      default: return 'text-blue-400 bg-blue-500/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'spam': return Hash;
      case 'harassment': return AlertTriangle;
      case 'inappropriate': return Flag;
      case 'copyright': return Shield;
      default: return Flag;
    }
  };

  const getTargetTypeIcon = (targetType: string) => {
    switch (targetType) {
      case 'user': return User;
      case 'comment': return MessageSquare;
      case 'forum_post': return FileText;
      case 'content': return FileText;
      default: return FileText;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Community Management</h1>
          <p className="text-gray-400 mt-1">Manage reports, moderation, and community guidelines</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Shield className="w-4 h-4 mr-2" />
            Guidelines
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Flag className="w-4 h-4 mr-2" />
            Create Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-1">
        {[
          { id: 'reports', label: 'Reports', icon: Flag },
          { id: 'moderation', label: 'Moderation', icon: Shield },
          { id: 'analytics', label: 'Analytics', icon: Star }
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

      {/* Moderation Tab */}
      {activeTab === 'moderation' && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Moderation Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Content Filtering */}
            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-medium text-white mb-3">Content Filtering</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Auto-moderation</span>
                  <div className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Spam detection</span>
                  <div className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Profanity filter</span>
                  <div className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline" size="sm">
                Configure Filters
              </Button>
            </Card>

            {/* User Actions */}
            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-medium text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="outline" size="sm">
                  <Ban className="w-4 h-4 mr-2" />
                  Suspend User
                </Button>
                <Button className="w-full justify-start" variant="outline" size="sm">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Issue Warning
                </Button>
                <Button className="w-full justify-start" variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Remove Content
                </Button>
                <Button className="w-full justify-start" variant="outline" size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Escalate to Admin
                </Button>
              </div>
            </Card>

            {/* Community Guidelines */}
            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-medium text-white mb-3">Guidelines</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Be respectful and professional</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>No spam or self-promotion</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Stay on topic</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>No harassment or abuse</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline" size="sm">
                Edit Guidelines
              </Button>
            </Card>
          </div>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Report Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Total Reports</span>
                <span className="text-white font-bold">127</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Pending</span>
                <span className="text-yellow-400 font-bold">23</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Resolved</span>
                <span className="text-green-400 font-bold">89</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Dismissed</span>
                <span className="text-gray-400 font-bold">15</span>
              </div>
            </div>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Issues</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Spam</span>
                </div>
                <span className="text-white">45%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-gray-300">Harassment</span>
                </div>
                <span className="text-white">28%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Flag className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-300">Inappropriate</span>
                </div>
                <span className="text-white">18%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">Copyright</span>
                </div>
                <span className="text-white">9%</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <>
          {/* Filters */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search reports..."
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                <select
                  value={filters.reason}
                  onChange={(e) => setFilters(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Reasons</option>
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="inappropriate">Inappropriate</option>
                  <option value="copyright">Copyright</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Type</label>
                <select
                  value={filters.targetType}
                  onChange={(e) => setFilters(prev => ({ ...prev, targetType: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Types</option>
                  <option value="user">User</option>
                  <option value="comment">Comment</option>
                  <option value="forum_post">Forum Post</option>
                  <option value="content">Content</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Reports List */}
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
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Report</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Target</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Reason</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Priority</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Created</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {reports.map((report) => {
                      const ReasonIcon = getReasonIcon(report.reason);
                      const TargetIcon = getTargetTypeIcon(report.targetType);
                      
                      return (
                        <motion.tr
                          key={report.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <Flag className="w-4 h-4 text-red-400" />
                              <div>
                                <div className="font-medium text-white">Report #{report.id.slice(-6)}</div>
                                <div className="text-sm text-gray-400">by {report.reporterName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <TargetIcon className="w-4 h-4 text-blue-400" />
                              <div>
                                <div className="text-sm text-white capitalize">{report.targetType.replace('_', ' ')}</div>
                                <div className="text-xs text-gray-400 font-mono">{report.targetId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <ReasonIcon className="w-4 h-4 text-orange-400" />
                              <span className="text-sm text-white capitalize">{report.reason}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn('text-sm font-medium', getPriorityColor(report.priority))}>
                              {report.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              getStatusColor(report.status)
                            )}>
                              {report.status === 'resolved' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {report.status === 'investigating' && <Eye className="w-3 h-3 mr-1" />}
                              {report.status === 'dismissed' && <XCircle className="w-3 h-3 mr-1" />}
                              {report.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {report.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-300">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{report.createdAt.toLocaleDateString()}</span>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {report.createdAt.toLocaleTimeString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setShowReportModal(true);
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <div className="relative">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-white"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
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

      {/* Report Detail Modal */}
      <AnimatePresence>
        <ReportDetailModal
          report={selectedReport}
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedReport(null);
          }}
          onAction={handleReportAction}
        />
      </AnimatePresence>
    </div>
  );
}
