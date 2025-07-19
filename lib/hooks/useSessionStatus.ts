'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionManager, SessionStatus, SessionEvent } from '@/lib/auth/sessionManager';
import { useAuth } from './useAuth';
import { useError } from '@/lib/errors/ErrorContext';
import { ErrorFactory } from '@/lib/errors/types';

export interface SessionStatusHookReturn {
  status: SessionStatus | null;
  timeDisplay: string;
  isExpiringSoon: boolean;
  isExpired: boolean;
  needsWarning: boolean;
  refreshSession: () => Promise<boolean>;
  dismissWarning: () => void;
  formatTimeRemaining: (milliseconds: number) => string;
}

export function useSessionStatus(): SessionStatusHookReturn {
  const { isAuthenticated, refreshSession: authRefresh } = useAuth();
  const { showAuthError } = useError();
  const [sessionManager] = useState(() => SessionManager.getInstance());
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [timeDisplay, setTimeDisplay] = useState('');
  const [warningDismissed, setWarningDismissed] = useState(false);
  const lastWarningTime = useRef<number>(0);

  // Format time remaining for display
  const formatTimeRemaining = useCallback((milliseconds: number): string => {
    if (milliseconds <= 0) return 'Expired';
    
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      const seconds = Math.floor(milliseconds / 1000);
      return `${seconds}s`;
    }
  }, []);

  // Update status and time display
  const updateStatus = useCallback(() => {
    if (!isAuthenticated) {
      setStatus(null);
      setTimeDisplay('');
      return;
    }

    const currentStatus = sessionManager.getSessionStatus();
    setStatus(currentStatus);
    
    if (currentStatus.isValid && currentStatus.timeUntilExpiry > 0) {
      setTimeDisplay(formatTimeRemaining(currentStatus.timeUntilExpiry));
    } else {
      setTimeDisplay('Expired');
    }
  }, [isAuthenticated, sessionManager, formatTimeRemaining]);

  // Handle session refresh
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const success = await authRefresh();
      if (success) {
        setWarningDismissed(false);
        updateStatus();
      }
      return success;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }, [authRefresh, updateStatus]);

  // Dismiss warning
  const dismissWarning = useCallback(() => {
    setWarningDismissed(true);
    lastWarningTime.current = Date.now();
  }, []);

  // Setup status monitoring
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial status update
    updateStatus();

    // Listen for status changes
    const unsubscribeStatus = sessionManager.addStatusListener(updateStatus);
    
    // Listen for session events
    const unsubscribeEvents = sessionManager.addEventListener((event: SessionEvent) => {
      switch (event.type) {
        case 'warning':
          // Show warning if not recently dismissed
          if (!warningDismissed && Date.now() - lastWarningTime.current > 5 * 60 * 1000) {
            const authError = ErrorFactory.createAuthError({
              message: 'Session expiring soon',
              authType: 'refresh',
              userMessage: `Your session will expire in ${formatTimeRemaining(event.data?.timeUntilExpiry || 0)}. Please save your work.`
            });
            showAuthError('refresh', authError.userMessage);
          }
          break;
          
        case 'expire':
          const expiredError = ErrorFactory.createAuthError({
            message: 'Session expired',
            authType: 'refresh',
            userMessage: 'Your session has expired. Please log in again to continue.'
          });
          showAuthError('refresh', expiredError.userMessage);
          break;
          
        case 'refresh':
          if (event.data?.action === 'refresh_success') {
            setWarningDismissed(false);
          }
          break;
      }
    });
    
    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000);

    return () => {
      unsubscribeStatus();
      unsubscribeEvents();
      clearInterval(interval);
    };
  }, [isAuthenticated, sessionManager, updateStatus, warningDismissed, formatTimeRemaining, showAuthError]);

  // Reset warning dismissed state when session changes
  useEffect(() => {
    if (status?.isValid && !status.isExpiringSoon) {
      setWarningDismissed(false);
    }
  }, [status?.isValid, status?.isExpiringSoon]);

  return {
    status,
    timeDisplay,
    isExpiringSoon: status?.isExpiringSoon || false,
    isExpired: !status?.isValid || false,
    needsWarning: status?.needsWarning && !warningDismissed || false,
    refreshSession,
    dismissWarning,
    formatTimeRemaining
  };
}

// Hook for session warnings and notifications
export function useSessionWarnings() {
  const { status, needsWarning, dismissWarning } = useSessionStatus();
  const [activeWarnings, setActiveWarnings] = useState<string[]>([]);
  const { showAuthError } = useError();

  useEffect(() => {
    if (!status) return;

    const warnings: string[] = [];

    // Critical expiration warning (< 2 minutes)
    if (status.isValid && status.timeUntilExpiry <= 2 * 60 * 1000) {
      warnings.push('critical_expiration');
    }
    // Standard expiration warning (< 10 minutes)
    else if (needsWarning) {
      warnings.push('expiration_warning');
    }

    // Refresh in progress
    if (status.refreshInProgress) {
      warnings.push('refresh_in_progress');
    }

    // Session expired
    if (!status.isValid) {
      warnings.push('session_expired');
    }

    setActiveWarnings(warnings);
  }, [status, needsWarning]);

  const hasWarning = (type: string) => activeWarnings.includes(type);

  const showCriticalWarning = () => {
    if (hasWarning('critical_expiration')) {
      showAuthError('refresh', 'Your session will expire in less than 2 minutes! Please save your work immediately.');
    }
  };

  return {
    activeWarnings,
    hasWarning,
    showCriticalWarning,
    dismissWarning
  };
}

// Hook for cross-tab session synchronization
export function useSessionSync() {
  const [sessionManager] = useState(() => SessionManager.getInstance());
  const [syncEvents, setSyncEvents] = useState<SessionEvent[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = sessionManager.addEventListener((event: SessionEvent) => {
      if (event.type === 'sync') {
        setSyncEvents(prev => [...prev.slice(-9), event]); // Keep last 10 events
        setLastSyncTime(event.timestamp);
      }
    });

    return unsubscribe;
  }, [sessionManager]);

  const forceSyncCheck = useCallback(() => {
    // Trigger a manual sync check
    sessionManager.loadFromStorage();
  }, [sessionManager]);

  return {
    syncEvents,
    lastSyncTime,
    forceSyncCheck
  };
}

// Hook for session analytics and monitoring
export function useSessionAnalytics() {
  const { status } = useSessionStatus();
  const [sessionManager] = useState(() => SessionManager.getInstance());
  const [analytics, setAnalytics] = useState({
    sessionDuration: 0,
    refreshCount: 0,
    warningCount: 0,
    lastRefreshTime: null as Date | null,
    averageSessionLength: 0
  });

  useEffect(() => {
    const unsubscribe = sessionManager.addEventListener((event: SessionEvent) => {
      setAnalytics(prev => {
        const updated = { ...prev };
        
        switch (event.type) {
          case 'refresh':
            if (event.data?.action === 'refresh_success') {
              updated.refreshCount += 1;
              updated.lastRefreshTime = event.timestamp;
            }
            break;
            
          case 'warning':
            updated.warningCount += 1;
            break;
        }
        
        return updated;
      });
    });

    return unsubscribe;
  }, [sessionManager]);

  // Calculate session duration
  useEffect(() => {
    if (!status?.isValid) return;

    const interval = setInterval(() => {
      const session = sessionManager.getSession();
      if (session) {
        const duration = Date.now() - session.createdAt.getTime();
        setAnalytics(prev => ({ ...prev, sessionDuration: duration }));
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [status?.isValid, sessionManager]);

  const getSessionHealth = () => {
    if (!status) return 'unknown';
    
    if (!status.isValid) return 'expired';
    if (status.timeUntilExpiry <= 5 * 60 * 1000) return 'critical';
    if (status.isExpiringSoon) return 'warning';
    if (status.refreshInProgress) return 'refreshing';
    return 'healthy';
  };

  return {
    analytics,
    sessionHealth: getSessionHealth(),
    formatDuration: (ms: number) => {
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
  };
}
