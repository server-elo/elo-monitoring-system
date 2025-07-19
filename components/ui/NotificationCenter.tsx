'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Search, MoreVertical, CheckCircle, Trash2, Settings, History, Pause, Play } from 'lucide-react';
import { GlassContainer } from './Glassmorphism';
import { useNotifications, NotificationType } from './NotificationSystem';
import { cn } from '@/lib/utils';
import { respectsReducedMotion } from '@/lib/accessibility/contrast-utils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'right' | 'left';
}

export const NotificationCenter = React.memo(({ 
  isOpen, 
  onClose, 
  position = 'right' 
}: NotificationCenterProps) => {
  const {
    notifications,
    groups: _groups,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    toggleGroup: _toggleGroup,
    dismissGroup: _dismissGroup,
    isPaused,
    togglePause,
    preferences: _preferences,
    toggleHistory,
    togglePreferences
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<NotificationType | 'all'>('all');
  const [showActions, setShowActions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = respectsReducedMotion();

  // Intersection Observer for performance
  const [visibleItems, setVisibleItems] = useState(new Set<string>());
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-notification-id');
          if (id) {
            if (entry.isIntersecting) {
              setVisibleItems(prev => new Set([...prev, id]));
            } else {
              setVisibleItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
              });
            }
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [isOpen]);

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let items = [...notifications];

    if (searchTerm) {
      items = items.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedFilter !== 'all') {
      items = items.filter(notification => notification.type === selectedFilter);
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [notifications, searchTerm, selectedFilter]);

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setShowActions(false);
  };

  const handleClearAll = () => {
    clearAll();
    setShowActions(false);
  };

  if (!isOpen) return null;

  const slideDirection = position === 'right' ? 1 : -1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: slideDirection * 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: slideDirection * 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'fixed top-0 bottom-0 w-96 max-w-[90vw]',
            position === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <GlassContainer
            intensity="heavy"
            tint="neutral"
            border
            shadow="xl"
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Bell className="w-6 h-6 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                      {unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                    aria-label="More actions"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                    aria-label="Close notification center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Actions Menu */}
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-16 right-4 bg-gray-800/90 backdrop-blur-md border border-gray-600/50 rounded-lg p-2 min-w-[180px] z-10"
                  >
                    <button
                      onClick={togglePause}
                      className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-white">Resume</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-white">Pause</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={unreadCount === 0}
                      className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">Mark All Read</span>
                    </button>
                    
                    <button
                      onClick={handleClearAll}
                      disabled={notifications.length === 0}
                      className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-red-500/20 transition-colors text-left disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-white">Clear All</span>
                    </button>
                    
                    <div className="border-t border-gray-600/50 my-2" />
                    
                    <button
                      onClick={toggleHistory}
                      className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                    >
                      <History className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white">History</span>
                    </button>
                    
                    <button
                      onClick={togglePreferences}
                      className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-white">Settings</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Filter */}
              <div className="flex space-x-2 overflow-x-auto">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'success', label: 'Success' },
                  { value: 'error', label: 'Error' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'info', label: 'Info' },
                  { value: 'achievement', label: 'Achievement' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedFilter(filter.value as any)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                      selectedFilter === filter.value
                        ? 'bg-blue-600/20 border border-blue-500 text-blue-300'
                        : 'bg-white/5 border border-gray-600 text-gray-300 hover:bg-white/10'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div 
              ref={containerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications</p>
                  {searchTerm && (
                    <p className="text-sm mt-2">
                      Try adjusting your search
                    </p>
                  )}
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.map((notification) => (
                    <NotificationCenterItem
                      key={notification.id}
                      notification={notification}
                      isVisible={visibleItems.has(notification.id)}
                      onMarkRead={() => markAsRead(notification.id)}
                      onRemove={() => removeNotification(notification.id)}
                      observer={observerRef.current}
                      reducedMotion={reducedMotion}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </GlassContainer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

NotificationCenter.displayName = 'NotificationCenter';

// Optimized notification item with intersection observer
interface NotificationCenterItemProps {
  notification: any;
  isVisible: boolean;
  onMarkRead: () => void;
  onRemove: () => void;
  observer?: IntersectionObserver;
  reducedMotion: boolean;
}

const NotificationCenterItem = React.memo(({
  notification,
  isVisible,
  onMarkRead,
  onRemove,
  observer,
  reducedMotion
}: NotificationCenterItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = itemRef.current;
    if (element && observer) {
      element.setAttribute('data-notification-id', notification.id);
      observer.observe(element);

      return () => {
        observer.unobserve(element);
      };
    }
  }, [notification.id, observer]);

  const getIcon = () => {
    const iconProps = { className: "w-4 h-4" };

    switch (notification.type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-4 h-4 text-green-400" />;
      case 'error':
        return <X {...iconProps} className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <X {...iconProps} className="w-4 h-4 text-yellow-400" />;
      case 'info':
        return <Bell {...iconProps} className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell {...iconProps} className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  // Only render if visible for performance
  if (!isVisible) {
    return (
      <div
        ref={itemRef}
        className="h-16 bg-transparent"
        data-notification-id={notification.id}
      />
    );
  }

  return (
    <motion.div
      ref={itemRef}
      layout={!reducedMotion}
      initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? {} : { opacity: 0, x: -100 }}
      className={cn(
        'p-3 rounded-lg border transition-all duration-200',
        'bg-white/5 border-white/10 hover:bg-white/10',
        !notification.read && 'border-l-4 border-l-blue-500'
      )}
      data-notification-id={notification.id}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white truncate">
              {notification.title}
              {!notification.read && (
                <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block" />
              )}
            </h4>
            <span className="text-xs text-gray-400 ml-2">
              {formatTime(notification.timestamp)}
            </span>
          </div>

          <p className="text-sm text-gray-300 mt-1 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500 uppercase">
              {notification.type}
            </span>

            <div className="flex items-center space-x-1">
              {!notification.read && (
                <button
                  onClick={onMarkRead}
                  className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                  aria-label={`Mark ${notification.title} as read`}
                >
                  <CheckCircle className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={onRemove}
                className="text-gray-400 hover:text-red-400 transition-colors p-1"
                aria-label={`Remove ${notification.title}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

NotificationCenterItem.displayName = 'NotificationCenterItem';
