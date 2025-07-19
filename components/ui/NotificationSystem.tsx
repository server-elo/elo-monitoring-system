'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, Trophy, Star, Zap, Users, Bell, Settings, History, Volume2, VolumeX, Pause, Play, Shield } from 'lucide-react';
import { CelebrationModal, QuickSuccessAnimation, ConfettiExplosion } from './CelebrationAnimations';
import { notificationVariants } from '@/lib/animations/micro-interactions';
import { cn } from '@/lib/utils';
import { respectsReducedMotion } from '@/lib/accessibility/contrast-utils';
import { announceToScreenReader } from '@/lib/utils/accessibility';
import { NotificationPreferencesModal } from './NotificationPreferences';
import { NotificationHistoryModal } from './NotificationHistory';

// Enhanced notification types
export type NotificationType =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | 'achievement'
  | 'collaboration'
  | 'xp'
  | 'level-up'
  | 'system'
  | 'security';

export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export type NotificationVariant = 'toast' | 'banner' | 'inline';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export interface NotificationMetadata {
  xp?: number;
  level?: number;
  achievement?: string;
  user?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  source?: string;
  timestamp?: number;
  groupKey?: string;
  rarity?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  variant?: NotificationVariant;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  dismissible?: boolean;
  action?: NotificationAction;
  actions?: NotificationAction[];
  metadata?: NotificationMetadata;
  timestamp: number;
  read?: boolean;
  archived?: boolean;
  groupId?: string;
  groupCount?: number;
}

export interface NotificationGroup {
  id: string;
  type: NotificationType;
  title: string;
  count: number;
  latestNotification: Notification;
  notifications: Notification[];
  collapsed: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  position: NotificationPosition;
  maxVisible: number;
  groupSimilar: boolean;
  showBanners: boolean;
  types: {
    [K in NotificationType]: {
      enabled: boolean;
      sound: boolean;
      vibration: boolean;
      duration?: number;
    };
  };
}

interface NotificationContextType {
  // Core notification management
  notifications: Notification[];
  groups: NotificationGroup[];
  history: Notification[];
  unreadCount: number;

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  clearHistory: () => void;

  // Group management
  toggleGroup: (groupId: string) => void;
  dismissGroup: (groupId: string) => void;

  // Preferences
  preferences: NotificationPreferences;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;

  // Quick notification methods
  showSuccess: (title: string, message: string, options?: Partial<Notification>) => string;
  showError: (title: string, message: string, options?: Partial<Notification>) => string;
  showInfo: (title: string, message: string, options?: Partial<Notification>) => string;
  showWarning: (title: string, message: string, options?: Partial<Notification>) => string;
  showAchievement: (title: string, message: string, metadata?: NotificationMetadata) => string;
  showXPGain: (xp: number, message?: string) => string;
  showLevelUp: (level: number, message?: string) => string;
  showCollaboration: (message: string, user?: string) => string;
  showBanner: (title: string, message: string, type?: NotificationType) => string;

  // Celebration methods
  showCelebration: (config: {
    type: 'achievement' | 'level-up' | 'course-complete' | 'streak' | 'milestone';
    title: string;
    description?: string;
    xp?: number;
    level?: number;
    badge?: string;
  }) => void;
  showQuickSuccess: (message?: string, icon?: React.ComponentType<{ className?: string }>) => void;
  triggerConfetti: (particleCount?: number) => void;

  // State management
  isPaused: boolean;
  togglePause: () => void;
  isHistoryOpen: boolean;
  toggleHistory: () => void;
  isPreferencesOpen: boolean;
  togglePreferences: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  position: 'top-right',
  maxVisible: 5,
  groupSimilar: true,
  showBanners: true,
  types: {
    success: { enabled: true, sound: true, vibration: true, duration: 4000 },
    error: { enabled: true, sound: true, vibration: true, duration: 8000 },
    info: { enabled: true, sound: false, vibration: false, duration: 5000 },
    warning: { enabled: true, sound: true, vibration: true, duration: 6000 },
    achievement: { enabled: true, sound: true, vibration: true, duration: 8000 },
    collaboration: { enabled: true, sound: true, vibration: false, duration: 6000 },
    xp: { enabled: true, sound: false, vibration: false, duration: 4000 },
    'level-up': { enabled: true, sound: true, vibration: true, duration: 10000 },
    system: { enabled: true, sound: false, vibration: false, duration: 5000 },
    security: { enabled: true, sound: true, vibration: true, duration: 0 }, // Persistent
  },
};

// Utility functions
const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

const getGroupKey = (notification: Partial<Notification>): string => {
  if (notification.metadata?.groupKey) {
    return notification.metadata.groupKey;
  }
  return `${notification.type}-${notification.title}`;
};

const shouldGroupNotifications = (
  existing: Notification,
  incoming: Partial<Notification>
): boolean => {
  return (
    existing.type === incoming.type &&
    existing.title === incoming.title &&
    getGroupKey(existing) === getGroupKey(incoming) &&
    Date.now() - existing.timestamp < 30000 // Group within 30 seconds
  );
};

// Throttling utility
class NotificationThrottle {
  private counts = new Map<string, { count: number; lastReset: number }>();
  private readonly maxPerMinute = 5;
  private readonly resetInterval = 60000; // 1 minute

  canShow(type: NotificationType): boolean {
    const now = Date.now();
    const key = type;
    const current = this.counts.get(key) || { count: 0, lastReset: now };

    // Reset count if interval has passed
    if (now - current.lastReset >= this.resetInterval) {
      current.count = 0;
      current.lastReset = now;
    }

    if (current.count >= this.maxPerMinute) {
      return false;
    }

    current.count++;
    this.counts.set(key, current);
    return true;
  }

  reset(): void {
    this.counts.clear();
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Core state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [history, setHistory] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  // Celebration state
  const [celebrationConfig, setCelebrationConfig] = useState<{
    isOpen: boolean;
    type: 'achievement' | 'level-up' | 'course-complete' | 'streak' | 'milestone';
    title: string;
    description?: string;
    xp?: number;
    level?: number;
    badge?: string;
  } | null>(null);
  const [quickSuccessConfig, setQuickSuccessConfig] = useState<{
    trigger: boolean;
    message: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>({ trigger: false, message: '' });
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Refs and utilities
  const throttle = useRef(new NotificationThrottle());
  // Queue functionality is handled by state management
  // const queueRef = useRef<Notification[]>([]);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notification-preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error);
    }
  }, []);

  // Save preferences to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('notification-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save notification preferences:', error);
    }
  }, [preferences]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notification-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed.slice(-100)); // Keep last 100 notifications
      }
    } catch (error) {
      console.warn('Failed to load notification history:', error);
    }
  }, []);

  // Save history to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('notification-history', JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save notification history:', error);
    }
  }, [history]);

  // Computed values
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length +
           groups.reduce((sum, g) => sum + g.notifications.filter(n => !n.read).length, 0);
  }, [notifications, groups]);

  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp'>
  ): string => {
    if (!preferences.enabled || isPaused) {
      return '';
    }

    const typePrefs = preferences.types[notification.type];
    if (!typePrefs?.enabled) {
      return '';
    }

    // Check throttling
    if (!throttle.current.canShow(notification.type)) {
      console.warn(`Notification throttled: ${notification.type}`);
      return '';
    }

    const id = generateId();
    const timestamp = Date.now();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp,
      duration: notification.duration ?? typePrefs.duration ?? 5000,
      dismissible: notification.dismissible ?? true,
      variant: notification.variant ?? 'toast',
      read: false,
      archived: false,
    };

    // Add to history immediately
    setHistory(prev => [...prev.slice(-99), newNotification]);

    // Check for grouping
    if (preferences.groupSimilar) {
      const existingGroup = groups.find(g =>
        shouldGroupNotifications(g.latestNotification, newNotification)
      );

      if (existingGroup) {
        setGroups(prev => prev.map(g =>
          g.id === existingGroup.id
            ? {
                ...g,
                count: g.count + 1,
                latestNotification: newNotification,
                notifications: [...g.notifications, newNotification],
              }
            : g
        ));

        // Announce grouped notification
        announceNotification(newNotification, true);
        return id;
      }
    }

    // Add as individual notification
    setNotifications(prev => {
      const updated = [...prev, newNotification];
      // Limit visible notifications
      if (updated.length > preferences.maxVisible) {
        return updated.slice(-preferences.maxVisible);
      }
      return updated;
    });

    // Auto-remove notification after duration
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      const timeout = setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);

      timeoutsRef.current.set(id, timeout);
    }

    // Play notification sound and vibration
    if (typePrefs.sound && preferences.soundEnabled) {
      playNotificationSound(newNotification.type);
    }

    if (typePrefs.vibration && preferences.vibrationEnabled && 'vibrate' in navigator) {
      const vibrationPattern = getVibrationPattern(newNotification.type);
      navigator.vibrate(vibrationPattern);
    }

    // Announce to screen readers
    announceNotification(newNotification);

    return id;
  }, [preferences, isPaused, groups]);

  // Announcement helper
  const announceNotification = useCallback((notification: Notification, isGrouped = false) => {
    if (!liveRegionRef.current) return;

    const priority = notification.metadata?.priority === 'critical' ? 'assertive' : 'polite';
    const groupText = isGrouped ? ' (grouped)' : '';
    const message = `${notification.type} notification: ${notification.title}. ${notification.message}${groupText}`;

    announceToScreenReader(message, priority);
  }, []);

  const removeNotification = useCallback((id: string) => {
    // Clear timeout if exists
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }

    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
    setGroups(prev => prev.map(g => ({
      ...g,
      notifications: g.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    })));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setGroups(prev => prev.map(g => ({
      ...g,
      notifications: g.notifications.map(n => ({ ...n, read: true }))
    })));
  }, []);

  const clearAll = useCallback(() => {
    // Clear all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();

    setNotifications([]);
    setGroups([]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem('notification-history');
    } catch (error) {
      console.warn('Failed to clear notification history:', error);
    }
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
    ));
  }, []);

  const dismissGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
  }, []);

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const toggleHistory = useCallback(() => {
    setIsHistoryOpen(prev => !prev);
  }, []);

  const togglePreferences = useCallback(() => {
    setIsPreferencesOpen(prev => !prev);
  }, []);

  // Quick notification methods
  const showSuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const showAchievement = useCallback((title: string, message: string, metadata?: NotificationMetadata) => {
    return addNotification({
      type: 'achievement',
      title,
      message,
      duration: 8000,
      metadata,
    });
  }, [addNotification]);

  const showXPGain = useCallback((xp: number, message?: string) => {
    return addNotification({
      type: 'xp',
      title: `+${xp} XP Gained!`,
      message: message || 'Great job! Keep learning!',
      duration: 4000,
      metadata: { xp },
    });
  }, [addNotification]);

  const showLevelUp = useCallback((level: number, message?: string) => {
    return addNotification({
      type: 'level-up',
      title: 'Level Up!',
      message: message || `Congratulations! You've reached level ${level}!`,
      duration: 10000,
      metadata: { level },
    });
  }, [addNotification]);

  const showCollaboration = useCallback((message: string, user?: string) => {
    return addNotification({
      type: 'collaboration',
      title: 'Collaboration Update',
      message,
      duration: 6000,
      metadata: { user },
    });
  }, [addNotification]);

  const showBanner = useCallback((title: string, message: string, type: NotificationType = 'info') => {
    return addNotification({
      type,
      variant: 'banner',
      title,
      message,
      persistent: true,
      dismissible: true,
    });
  }, [addNotification]);

  // Celebration methods
  const showCelebration = useCallback((config: {
    type: 'achievement' | 'level-up' | 'course-complete' | 'streak' | 'milestone';
    title: string;
    description?: string;
    xp?: number;
    level?: number;
    badge?: string;
  }) => {
    setCelebrationConfig({
      isOpen: true,
      ...config
    });
  }, []);

  const showQuickSuccess = useCallback((message: string = 'Success!', icon?: React.ComponentType<{ className?: string }>) => {
    setQuickSuccessConfig({
      trigger: true,
      message,
      icon
    });

    // Reset trigger after animation
    setTimeout(() => {
      setQuickSuccessConfig(prev => ({ ...prev, trigger: false }));
    }, 2000);
  }, []);

  const triggerConfetti = useCallback((_particleCount: number = 50) => {
    setConfettiTrigger(true);
    setTimeout(() => setConfettiTrigger(false), 100);
  }, []);

  const playNotificationSound = (type: Notification['type']) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different notification types
      const frequencies = {
        success: [523, 659, 784], // C, E, G
        error: [392, 311], // G, Eb
        info: [440], // A
        warning: [466, 415], // Bb, Ab
        achievement: [523, 659, 784, 1047], // C, E, G, C
        collaboration: [440, 554], // A, C#
        xp: [659, 784], // E, G
        'level-up': [523, 659, 784, 1047, 1319], // C, E, G, C, E
      };

      const freqs = frequencies[type] || [440];
      
      freqs.forEach((freq, index) => {
        setTimeout(() => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.frequency.setValueAtTime(freq, audioContext.currentTime);
          gain.gain.setValueAtTime(0.1, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.2);
        }, index * 100);
      });
    } catch (error) {
      // Fallback: silent operation
    }
  };

  const getVibrationPattern = (type: Notification['type']): number[] => {
    const patterns = {
      success: [100],
      error: [200, 100, 200],
      info: [50],
      warning: [150, 50, 150],
      achievement: [200, 100, 200, 100, 200],
      collaboration: [100, 50, 100],
      xp: [50, 50, 50],
      'level-up': [300, 100, 300, 100, 300],
    };
    return patterns[type] || [100];
  };

  return (
    <NotificationContext.Provider
      value={{
        // Core state
        notifications,
        groups,
        history,
        unreadCount,

        // Actions
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        clearHistory,

        // Group management
        toggleGroup,
        dismissGroup,

        // Preferences
        preferences,
        updatePreferences,

        // Quick methods
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showAchievement,
        showXPGain,
        showLevelUp,
        showCollaboration,
        showBanner,

        // Celebration methods
        showCelebration,
        showQuickSuccess,
        triggerConfetti,

        // State management
        isPaused,
        togglePause,
        isHistoryOpen,
        toggleHistory,
        isPreferencesOpen,
        togglePreferences,
      }}
    >
      {children}

      {/* ARIA Live Region for Screen Reader Announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />

      {/* Enhanced Notification Container */}
      <EnhancedNotificationContainer />

      {/* Notification Control Panel */}
      <NotificationControlPanel />

      {/* Modals */}
      <NotificationPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={togglePreferences}
      />
      <NotificationHistoryModal
        isOpen={isHistoryOpen}
        onClose={toggleHistory}
      />

      {/* Celebration Components */}
      {celebrationConfig && (
        <CelebrationModal
          isOpen={celebrationConfig.isOpen}
          onClose={() => setCelebrationConfig(null)}
          type={celebrationConfig.type}
          title={celebrationConfig.title}
          description={celebrationConfig.description}
          xp={celebrationConfig.xp}
          level={celebrationConfig.level}
          badge={celebrationConfig.badge}
        />
      )}

      <QuickSuccessAnimation
        trigger={quickSuccessConfig.trigger}
        message={quickSuccessConfig.message}
        icon={quickSuccessConfig.icon}
      />

      <ConfettiExplosion trigger={confettiTrigger} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Enhanced notification container with accessibility and positioning
function EnhancedNotificationContainer() {
  const {
    notifications,
    groups,
    preferences,
    removeNotification,
    markAsRead,
    toggleGroup,
    dismissGroup,
    isPaused,
    togglePause,
    unreadCount
  } = useNotifications();

  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const reducedMotion = respectsReducedMotion();

  // Position classes based on preferences
  const getPositionClasses = (position: NotificationPosition): string => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    };
    return positions[position] || positions['top-right'];
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      const totalItems = notifications.length + groups.length;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => (prev + 1) % totalItems);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => (prev - 1 + totalItems) % totalItems);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0) {
            if (focusedIndex < notifications.length) {
              markAsRead(notifications[focusedIndex].id);
            } else {
              const groupIndex = focusedIndex - notifications.length;
              if (groups[groupIndex]) {
                toggleGroup(groups[groupIndex].id);
              }
            }
          }
          break;
        case 'Escape':
          event.preventDefault();
          setFocusedIndex(-1);
          break;
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          if (focusedIndex >= 0) {
            if (focusedIndex < notifications.length) {
              removeNotification(notifications[focusedIndex].id);
            } else {
              const groupIndex = focusedIndex - notifications.length;
              if (groups[groupIndex]) {
                dismissGroup(groups[groupIndex].id);
              }
            }
          }
          break;
      }
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('keydown', handleKeyDown);
      return () => {
        containerRef.current?.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [notifications, groups, focusedIndex, removeNotification, markAsRead, toggleGroup, dismissGroup]);

  // Don't render if notifications are disabled
  if (!preferences.enabled) {
    return null;
  }

  const allItems = [...notifications, ...groups];
  const visibleItems = allItems.slice(0, preferences.maxVisible);

  return (
    <>
      {/* Main notification container */}
      <div
        ref={containerRef}
        className={cn(
          'fixed z-50 space-y-2 max-w-sm',
          getPositionClasses(preferences.position)
        )}
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        tabIndex={-1}
      >
        {/* Pause indicator */}
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center p-2 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 rounded-lg text-yellow-300 text-sm"
          >
            <Pause className="w-4 h-4 mr-2" />
            Notifications Paused
            <button
              onClick={togglePause}
              className="ml-2 text-yellow-200 hover:text-white"
              aria-label="Resume notifications"
            >
              <Play className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Notification count indicator */}
        {unreadCount > preferences.maxVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center p-2 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 rounded-lg text-blue-300 text-sm"
          >
            <Bell className="w-4 h-4 mr-2" />
            {unreadCount - preferences.maxVisible} more notifications
          </motion.div>
        )}

        {/* Notifications and groups */}
        <AnimatePresence mode="popLayout">
          {visibleItems.map((item, index) => {
            const isGroup = 'count' in item;
            const isFocused = index === focusedIndex;

            if (isGroup) {
              return (
                <NotificationGroup
                  key={item.id}
                  group={item as NotificationGroup}
                  isFocused={isFocused}
                  onToggle={() => toggleGroup(item.id)}
                  onDismiss={() => dismissGroup(item.id)}
                  reducedMotion={reducedMotion}
                />
              );
            } else {
              return (
                <NotificationCard
                  key={item.id}
                  notification={item as Notification}
                  isFocused={isFocused}
                  onRemove={() => removeNotification(item.id)}
                  onMarkRead={() => markAsRead(item.id)}
                  reducedMotion={reducedMotion}
                />
              );
            }
          })}
        </AnimatePresence>
      </div>

      {/* Banner notifications */}
      <BannerNotifications />
    </>
  );
}

// Enhanced notification card with accessibility and performance optimizations
const NotificationCard = React.memo(({
  notification,
  isFocused = false,
  onRemove,
  onMarkRead,
  reducedMotion = false
}: {
  notification: Notification;
  isFocused?: boolean;
  onRemove: () => void;
  onMarkRead: () => void;
  reducedMotion?: boolean;
}) => {
  const [_isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.focus();
    }
  }, [isFocused]);

  const getIcon = () => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (notification.type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle {...iconProps} className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle {...iconProps} className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info {...iconProps} className="w-5 h-5 text-blue-400" />;
      case 'achievement':
        return <Trophy {...iconProps} className="w-5 h-5 text-yellow-400" />;
      case 'collaboration':
        return <Users {...iconProps} className="w-5 h-5 text-purple-400" />;
      case 'xp':
        return <Zap {...iconProps} className="w-5 h-5 text-blue-400" />;
      case 'level-up':
        return <Star {...iconProps} className="w-5 h-5 text-yellow-400" />;
      default:
        return <Bell {...iconProps} className="w-5 h-5 text-gray-400" />;
    }
  };

  const getBackgroundColor = () => {
    const colors = {
      success: 'from-green-500/20 to-green-600/20 border-green-500/30',
      error: 'from-red-500/20 to-red-600/20 border-red-500/30',
      warning: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
      info: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      achievement: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
      collaboration: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      xp: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
      'level-up': 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    };
    return colors[notification.type] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
  };

  // Animation variants with reduced motion support
  const cardVariants = useMemo(() => {
    if (reducedMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
      };
    }
    return notificationVariants;
  }, [reducedMotion]);

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative p-4 rounded-lg backdrop-blur-md border shadow-lg',
        'bg-gradient-to-r focus:outline-none focus:ring-2 focus:ring-blue-500/50',
        'transition-all duration-200',
        getBackgroundColor(),
        isFocused && 'ring-2 ring-blue-500/50',
        !notification.read && 'border-l-4 border-l-blue-500'
      )}
      role="alert"
      aria-live={notification.metadata?.priority === 'critical' ? 'assertive' : 'polite'}
      aria-labelledby={`notification-title-${notification.id}`}
      aria-describedby={`notification-message-${notification.id}`}
      tabIndex={0}
    >
      {/* Special effects for achievements and level-ups */}
      {(notification.type === 'achievement' || notification.type === 'level-up') && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-lg"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4
            id={`notification-title-${notification.id}`}
            className="text-sm font-semibold text-white mb-1"
          >
            {notification.title}
            {!notification.read && (
              <span className="sr-only"> (unread)</span>
            )}
          </h4>
          <p
            id={`notification-message-${notification.id}`}
            className="text-sm text-gray-300"
          >
            {notification.message}
          </p>
          
          {/* Metadata display */}
          {notification.metadata && (
            <div className="mt-2 flex items-center space-x-2 text-xs text-gray-400">
              {notification.metadata.xp && (
                <span className="flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>+{notification.metadata.xp} XP</span>
                </span>
              )}
              {notification.metadata.level && (
                <span className="flex items-center space-x-1">
                  <Star className="w-3 h-3" />
                  <span>Level {notification.metadata.level}</span>
                </span>
              )}
              {notification.metadata.user && (
                <span className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{notification.metadata.user}</span>
                </span>
              )}
            </div>
          )}
          
          {/* Action buttons */}
          {(notification.action || notification.actions) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  disabled={notification.action.disabled}
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded transition-colors',
                    'focus:outline-none focus:ring-1 focus:ring-white/50',
                    notification.action.variant === 'danger'
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
                      : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/20',
                    notification.action.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  aria-label={`${notification.action.label} for ${notification.title}`}
                >
                  {notification.action.label}
                </button>
              )}
              {notification.actions?.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded transition-colors',
                    'focus:outline-none focus:ring-1 focus:ring-white/50',
                    action.variant === 'danger'
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
                      : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/20',
                    action.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  aria-label={`${action.label} for ${notification.title}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex flex-col space-y-1">
          {!notification.read && (
            <button
              onClick={onMarkRead}
              className="flex-shrink-0 text-gray-400 hover:text-blue-400 transition-colors p-1"
              aria-label={`Mark ${notification.title} as read`}
              title="Mark as read"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          {notification.dismissible && (
            <button
              onClick={onRemove}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1"
              aria-label={`Dismiss ${notification.title}`}
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for timed notifications */}
      {!notification.persistent && notification.duration && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-lg"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: notification.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
});

// Notification Group Component with performance optimizations
const NotificationGroup = React.memo(({
  group,
  isFocused = false,
  onToggle,
  onDismiss,
  reducedMotion = false
}: {
  group: NotificationGroup;
  isFocused?: boolean;
  onToggle: () => void;
  onDismiss: () => void;
  reducedMotion?: boolean;
}) => {
  const groupRef = useRef<HTMLDivElement>(null);
  const { markAsRead, removeNotification } = useNotifications();

  useEffect(() => {
    if (isFocused && groupRef.current) {
      groupRef.current.focus();
    }
  }, [isFocused]);

  const getIcon = () => {
    const iconProps = { className: "w-5 h-5" };

    switch (group.type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle {...iconProps} className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle {...iconProps} className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info {...iconProps} className="w-5 h-5 text-blue-400" />;
      case 'achievement':
        return <Trophy {...iconProps} className="w-5 h-5 text-yellow-400" />;
      case 'collaboration':
        return <Users {...iconProps} className="w-5 h-5 text-purple-400" />;
      case 'xp':
        return <Zap {...iconProps} className="w-5 h-5 text-blue-400" />;
      case 'level-up':
        return <Star {...iconProps} className="w-5 h-5 text-yellow-400" />;
      default:
        return <Bell {...iconProps} className="w-5 h-5 text-gray-400" />;
    }
  };

  const getBackgroundColor = () => {
    const colors = {
      success: 'from-green-500/20 to-green-600/20 border-green-500/30',
      error: 'from-red-500/20 to-red-600/20 border-red-500/30',
      warning: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
      info: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      achievement: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
      collaboration: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      xp: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
      'level-up': 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
      system: 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
      security: 'from-red-500/20 to-red-600/20 border-red-500/30',
    };
    return colors[group.type] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
  };

  const cardVariants = useMemo(() => {
    if (reducedMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
      };
    }
    return notificationVariants;
  }, [reducedMotion]);

  return (
    <motion.div
      ref={groupRef}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'relative p-4 rounded-lg backdrop-blur-md border shadow-lg',
        'bg-gradient-to-r focus:outline-none focus:ring-2 focus:ring-blue-500/50',
        'transition-all duration-200 cursor-pointer',
        getBackgroundColor(),
        isFocused && 'ring-2 ring-blue-500/50'
      )}
      role="button"
      aria-expanded={!group.collapsed}
      aria-label={`${group.count} ${group.type} notifications. Click to ${group.collapsed ? 'expand' : 'collapse'}`}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">
              {group.title} ({group.count})
            </h4>
            <span className="text-xs text-gray-400">
              {group.collapsed ? 'Expand' : 'Collapse'}
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            {group.latestNotification.message}
          </p>

          {!group.collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 space-y-2 border-t border-white/10 pt-3"
            >
              {group.notifications.slice(0, 3).map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between text-xs text-gray-400"
                >
                  <span className="truncate flex-1">
                    {notification.message}
                  </span>
                  <div className="flex items-center space-x-1 ml-2">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="text-blue-400 hover:text-blue-300"
                        aria-label={`Mark as read: ${notification.message}`}
                      >
                        <CheckCircle className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-white"
                      aria-label={`Remove: ${notification.message}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {group.notifications.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{group.notifications.length - 3} more
                </div>
              )}
            </motion.div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1"
          aria-label={`Dismiss ${group.title} group`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
});

// Banner Notifications Component
function BannerNotifications() {
  const { notifications, removeNotification, markAsRead, preferences } = useNotifications();
  const reducedMotion = respectsReducedMotion();

  const bannerNotifications = notifications.filter(n => n.variant === 'banner');

  if (!preferences.showBanners || bannerNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 space-y-1">
      <AnimatePresence>
        {bannerNotifications.map((notification) => (
          <BannerCard
            key={notification.id}
            notification={notification}
            onRemove={() => removeNotification(notification.id)}
            onMarkRead={() => markAsRead(notification.id)}
            reducedMotion={reducedMotion}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Banner Card Component with performance optimizations
const BannerCard = React.memo(({
  notification,
  onRemove,
  onMarkRead,
  reducedMotion = false
}: {
  notification: Notification;
  onRemove: () => void;
  onMarkRead: () => void;
  reducedMotion?: boolean;
}) => {
  const getIcon = () => {
    const iconProps = { className: "w-5 h-5" };

    switch (notification.type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle {...iconProps} className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle {...iconProps} className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info {...iconProps} className="w-5 h-5 text-blue-400" />;
      case 'security':
        return <Shield {...iconProps} className="w-5 h-5 text-red-400" />;
      case 'system':
        return <Settings {...iconProps} className="w-5 h-5 text-gray-400" />;
      default:
        return <Bell {...iconProps} className="w-5 h-5 text-gray-400" />;
    }
  };

  const getBackgroundColor = () => {
    const colors = {
      success: 'bg-green-500/90 border-green-400',
      error: 'bg-red-500/90 border-red-400',
      warning: 'bg-yellow-500/90 border-yellow-400',
      info: 'bg-blue-500/90 border-blue-400',
      security: 'bg-red-600/90 border-red-400',
      system: 'bg-gray-500/90 border-gray-400',
      achievement: 'bg-yellow-500/90 border-yellow-400',
      collaboration: 'bg-purple-500/90 border-purple-400',
      xp: 'bg-blue-500/90 border-blue-400',
      'level-up': 'bg-yellow-500/90 border-yellow-400',
    };
    return colors[notification.type] || 'bg-gray-500/90 border-gray-400';
  };

  const bannerVariants = useMemo(() => {
    if (reducedMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
      };
    }
    return {
      hidden: { y: -100, opacity: 0 },
      visible: { y: 0, opacity: 1 },
      exit: { y: -100, opacity: 0 }
    };
  }, [reducedMotion]);

  return (
    <motion.div
      variants={bannerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'w-full p-4 backdrop-blur-md border-b shadow-lg',
        getBackgroundColor()
      )}
      role="alert"
      aria-live={notification.metadata?.priority === 'critical' ? 'assertive' : 'polite'}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white">
              {notification.title}
              {!notification.read && (
                <span className="sr-only"> (unread)</span>
              )}
            </h4>
            <p className="text-sm text-white/90">
              {notification.message}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              disabled={notification.action.disabled}
              className={cn(
                'text-sm font-medium px-3 py-1 rounded transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-white/50',
                'bg-white/20 hover:bg-white/30 text-white',
                notification.action.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {notification.action.label}
            </button>
          )}

          {!notification.read && (
            <button
              onClick={onMarkRead}
              className="text-white/70 hover:text-white transition-colors p-1"
              aria-label={`Mark ${notification.title} as read`}
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          {notification.dismissible && (
            <button
              onClick={onRemove}
              className="text-white/70 hover:text-white transition-colors p-1"
              aria-label={`Dismiss ${notification.title}`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// Notification Control Panel
function NotificationControlPanel() {
  const {
    unreadCount,
    isPaused,
    togglePause,
    toggleHistory,
    togglePreferences,
    preferences,
    clearAll
  } = useNotifications();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!preferences.enabled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        {/* Main Control Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'relative p-3 rounded-full backdrop-blur-md border shadow-lg transition-all duration-200',
            'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30',
            'hover:from-blue-500/30 hover:to-purple-500/30',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
            isExpanded && 'ring-2 ring-blue-500/50'
          )}
          aria-label={`Notification controls. ${unreadCount} unread notifications`}
        >
          <Bell className="w-5 h-5 text-white" />

          {/* Unread count badge */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}

          {/* Pause indicator */}
          {isPaused && (
            <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
              <Pause className="w-2 h-2 text-white" />
            </div>
          )}
        </button>

        {/* Expanded Controls */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-16 left-0 p-3 rounded-lg backdrop-blur-md border shadow-lg bg-gradient-to-r from-gray-800/90 to-gray-900/90 border-gray-600/50 min-w-[200px]"
            >
              <div className="space-y-2">
                {/* Pause/Resume */}
                <button
                  onClick={togglePause}
                  className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">Resume Notifications</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-white">Pause Notifications</span>
                    </>
                  )}
                </button>

                {/* History */}
                <button
                  onClick={toggleHistory}
                  className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <History className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">View History</span>
                </button>

                {/* Preferences */}
                <button
                  onClick={togglePreferences}
                  className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white">Preferences</span>
                </button>

                {/* Clear All */}
                {unreadCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-red-500/20 transition-colors text-left"
                  >
                    <X className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-white">Clear All</span>
                  </button>
                )}

                {/* Sound Toggle */}
                <button
                  onClick={() => {
                    // This would be handled by preferences, but we can add a quick toggle
                  }}
                  className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  {preferences.soundEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">Sound On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white">Sound Off</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
