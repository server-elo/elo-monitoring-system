'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Search, Trash2, CheckCircle, AlertCircle, Info, Trophy, Star, Zap, Users, Bell, Settings, Shield, Clock } from 'lucide-react';
import { GlassContainer } from './Glassmorphism';
import { useNotifications, Notification, NotificationType } from './NotificationSystem';
import { cn } from '@/lib/utils';

interface NotificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationHistoryModal({ isOpen, onClose }: NotificationHistoryModalProps) {
  const { history, clearHistory } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'type'>('newest');

  const notificationTypes: { type: NotificationType | 'all'; label: string; icon: React.ReactNode }[] = [
    { type: 'all', label: 'All', icon: <Bell className="w-4 h-4" /> },
    { type: 'success', label: 'Success', icon: <CheckCircle className="w-4 h-4 text-green-400" /> },
    { type: 'error', label: 'Error', icon: <AlertCircle className="w-4 h-4 text-red-400" /> },
    { type: 'warning', label: 'Warning', icon: <AlertCircle className="w-4 h-4 text-yellow-400" /> },
    { type: 'info', label: 'Info', icon: <Info className="w-4 h-4 text-blue-400" /> },
    { type: 'achievement', label: 'Achievement', icon: <Trophy className="w-4 h-4 text-yellow-400" /> },
    { type: 'collaboration', label: 'Collaboration', icon: <Users className="w-4 h-4 text-purple-400" /> },
    { type: 'xp', label: 'XP', icon: <Zap className="w-4 h-4 text-blue-400" /> },
    { type: 'level-up', label: 'Level Up', icon: <Star className="w-4 h-4 text-yellow-400" /> },
    { type: 'system', label: 'System', icon: <Settings className="w-4 h-4 text-gray-400" /> },
    { type: 'security', label: 'Security', icon: <Shield className="w-4 h-4 text-red-400" /> },
  ];

  const filteredAndSortedHistory = useMemo(() => {
    let filtered = history;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(notification => notification.type === selectedType);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'type':
        filtered.sort((a, b) => a.type.localeCompare(b.type));
        break;
    }

    return filtered;
  }, [history, searchTerm, selectedType, sortBy]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getIcon = (type: NotificationType) => {
    const typeData = notificationTypes.find(t => t.type === type);
    return typeData?.icon || <Bell className="w-4 h-4 text-gray-400" />;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          <GlassContainer
            intensity="medium"
            tint="neutral"
            border
            shadow="lg"
            rounded="lg"
            className="p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <History className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">
                  Notification History
                </h2>
                <span className="text-sm text-gray-400">
                  ({filteredAndSortedHistory.length} of {history.length})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearHistory}
                  className="text-red-400 hover:text-red-300 transition-colors p-2"
                  aria-label="Clear all history"
                  title="Clear all history"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                  aria-label="Close history"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4 mb-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Type Filter */}
              <div className="flex flex-wrap gap-2">
                {notificationTypes.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => setSelectedType(type.type)}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors',
                      selectedType === type.type
                        ? 'bg-blue-600/20 border border-blue-500 text-blue-300'
                        : 'bg-white/5 border border-gray-600 text-gray-300 hover:bg-white/10'
                    )}
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">Sort by:</span>
                <div className="flex space-x-2">
                  {[
                    { value: 'newest', label: 'Newest' },
                    { value: 'oldest', label: 'Oldest' },
                    { value: 'type', label: 'Type' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as any)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-sm transition-colors',
                        sortBy === option.value
                          ? 'bg-blue-600/20 border border-blue-500 text-blue-300'
                          : 'bg-white/5 border border-gray-600 text-gray-300 hover:bg-white/10'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* History List */}
            <div className="max-h-[50vh] overflow-y-auto space-y-2">
              {filteredAndSortedHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications found</p>
                  {searchTerm && (
                    <p className="text-sm mt-2">
                      Try adjusting your search or filters
                    </p>
                  )}
                </div>
              ) : (
                filteredAndSortedHistory.map((notification) => (
                  <HistoryItem
                    key={notification.id}
                    notification={notification}
                    formatTimestamp={formatTimestamp}
                    getIcon={getIcon}
                  />
                ))
              )}
            </div>
          </GlassContainer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface HistoryItemProps {
  notification: Notification;
  formatTimestamp: (timestamp: number) => string;
  getIcon: (type: NotificationType) => React.ReactNode;
}

function HistoryItem({ notification, formatTimestamp, getIcon }: HistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getBackgroundColor = () => {
    const colors = {
      success: 'border-l-green-500 bg-green-500/5',
      error: 'border-l-red-500 bg-red-500/5',
      warning: 'border-l-yellow-500 bg-yellow-500/5',
      info: 'border-l-blue-500 bg-blue-500/5',
      achievement: 'border-l-yellow-500 bg-yellow-500/5',
      collaboration: 'border-l-purple-500 bg-purple-500/5',
      xp: 'border-l-blue-500 bg-blue-500/5',
      'level-up': 'border-l-yellow-500 bg-yellow-500/5',
      system: 'border-l-gray-500 bg-gray-500/5',
      security: 'border-l-red-500 bg-red-500/5',
    };
    return colors[notification.type] || 'border-l-gray-500 bg-gray-500/5';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-lg border-l-4 cursor-pointer transition-all duration-200',
        'hover:bg-white/5',
        getBackgroundColor()
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white truncate">
              {notification.title}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatTimestamp(notification.timestamp)}</span>
            </div>
          </div>
          
          <p className={cn(
            'text-sm text-gray-300 mt-1',
            !isExpanded && 'truncate'
          )}>
            {notification.message}
          </p>
          
          {isExpanded && notification.metadata && (
            <div className="mt-2 text-xs text-gray-400 space-y-1">
              {notification.metadata.xp && (
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>+{notification.metadata.xp} XP</span>
                </div>
              )}
              {notification.metadata.level && (
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3" />
                  <span>Level {notification.metadata.level}</span>
                </div>
              )}
              {notification.metadata.user && (
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{notification.metadata.user}</span>
                </div>
              )}
              {notification.metadata.category && (
                <div className="flex items-center space-x-1">
                  <span>Category: {notification.metadata.category}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={cn(
            'px-2 py-1 rounded text-xs font-medium',
            notification.read ? 'bg-gray-600 text-gray-300' : 'bg-blue-600 text-blue-100'
          )}>
            {notification.read ? 'Read' : 'Unread'}
          </span>
          <span className="text-xs text-gray-500 uppercase">
            {notification.type}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
