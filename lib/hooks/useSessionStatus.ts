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
  refreshSession: (_) => Promise<boolean>;
  dismissWarning: (_) => void;
  formatTimeRemaining: (_milliseconds: number) => string;
}

export function useSessionStatus(): SessionStatusHookReturn {
  const { isAuthenticated, refreshSession: authRefresh } = useAuth(_);
  const { showAuthError } = useError(_);
  const [sessionManager] = useState(() => SessionManager.getInstance(_));
  const [status, setStatus] = useState<SessionStatus | null>(_null);
  const [timeDisplay, setTimeDisplay] = useState('');
  const [warningDismissed, setWarningDismissed] = useState(_false);
  const lastWarningTime = useRef<number>(0);

  // Format time remaining for display
  const formatTimeRemaining = useCallback((milliseconds: number): string => {
    if (_milliseconds <= 0) return 'Expired';
    
    const totalMinutes = Math.floor(_milliseconds / (1000 * 60));
    const hours = Math.floor(_totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (_hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (_minutes > 0) {
      return `${minutes}m`;
    } else {
      const seconds = Math.floor(_milliseconds / 1000);
      return `${seconds}s`;
    }
  }, []);

  // Update status and time display
  const updateStatus = useCallback(() => {
    if (!isAuthenticated) {
      setStatus(_null);
      setTimeDisplay('');
      return;
    }

    const currentStatus = sessionManager.getSessionStatus(_);
    setStatus(_currentStatus);
    
    if (_currentStatus.isValid && currentStatus.timeUntilExpiry > 0) {
      setTimeDisplay(_formatTimeRemaining(currentStatus.timeUntilExpiry));
    } else {
      setTimeDisplay('Expired');
    }
  }, [isAuthenticated, sessionManager, formatTimeRemaining]);

  // Handle session refresh
  const refreshSession = useCallback( async (): Promise<boolean> => {
    try {
      const success = await authRefresh(_);
      if (success) {
        setWarningDismissed(_false);
        updateStatus(_);
      }
      return success;
    } catch (_error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }, [authRefresh, updateStatus]);

  // Dismiss warning
  const dismissWarning = useCallback(() => {
    setWarningDismissed(_true);
    lastWarningTime.current = Date.now(_);
  }, []);

  // Setup status monitoring
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial status update
    updateStatus(_);

    // Listen for status changes
    const unsubscribeStatus = sessionManager.addStatusListener(_updateStatus);
    
    // Listen for session events
    const unsubscribeEvents = sessionManager.addEventListener((event: SessionEvent) => {
      switch (_event.type) {
        case 'warning':
          // Show warning if not recently dismissed
          if (!warningDismissed && Date.now() - lastWarningTime.current > 5 * 60 * 1000) {
            const authError = ErrorFactory.createAuthError({
              message: 'Session expiring soon',
              authType: 'refresh',
              userMessage: `Your session will expire in ${formatTimeRemaining(_event.data?.timeUntilExpiry || 0)}. Please save your work.`
            });
            showAuthError( 'refresh', authError.userMessage);
          }
          break;
          
        case 'expire':
          const expiredError = ErrorFactory.createAuthError({
            message: 'Session expired',
            authType: 'refresh',
            userMessage: 'Your session has expired. Please log in again to continue.'
          });
          showAuthError( 'refresh', expiredError.userMessage);
          break;
          
        case 'refresh':
          if (_event.data?.action === 'refresh_success') {
            setWarningDismissed(_false);
          }
          break;
      }
    });
    
    // Update every 30 seconds
    const interval = setInterval( updateStatus, 30000);

    return (_) => {
      unsubscribeStatus(_);
      unsubscribeEvents(_);
      clearInterval(_interval);
    };
  }, [isAuthenticated, sessionManager, updateStatus, warningDismissed, formatTimeRemaining, showAuthError]);

  // Reset warning dismissed state when session changes
  useEffect(() => {
    if (status?.isValid && !status.isExpiringSoon) {
      setWarningDismissed(_false);
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
  const { status, needsWarning, dismissWarning } = useSessionStatus(_);
  const [activeWarnings, setActiveWarnings] = useState<string[]>([]);
  const { showAuthError } = useError(_);

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
      warnings.push('refresh_inprogress');
    }

    // Session expired
    if (!status.isValid) {
      warnings.push('session_expired');
    }

    setActiveWarnings(_warnings);
  }, [status, needsWarning]);

  const hasWarning = (_type: string) => activeWarnings.includes(type);

  const showCriticalWarning = (_) => {
    if (_hasWarning('critical_expiration')) {
      showAuthError( 'refresh', 'Your session will expire in less than 2 minutes! Please save your work immediately.');
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
  const [sessionManager] = useState(() => SessionManager.getInstance(_));
  const [syncEvents, setSyncEvents] = useState<SessionEvent[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(_null);

  useEffect(() => {
    const unsubscribe = sessionManager.addEventListener((event: SessionEvent) => {
      if (_event.type === 'sync') {
        setSyncEvents(_prev => [...prev.slice(-9), event]); // Keep last 10 events
        setLastSyncTime(_event.timestamp);
      }
    });

    return unsubscribe;
  }, [sessionManager]);

  const forceSyncCheck = useCallback(() => {
    // Trigger a manual sync check
    sessionManager.loadFromStorage(_);
  }, [sessionManager]);

  return {
    syncEvents,
    lastSyncTime,
    forceSyncCheck
  };
}

// Hook for session analytics and monitoring
export function useSessionAnalytics() {
  const { status } = useSessionStatus(_);
  const [sessionManager] = useState(() => SessionManager.getInstance(_));
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
        
        switch (_event.type) {
          case 'refresh':
            if (_event.data?.action === 'refresh_success') {
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
      const session = sessionManager.getSession(_);
      if (session) {
        const duration = Date.now(_) - session.createdAt.getTime(_);
        setAnalytics( prev => ({ ...prev, sessionDuration: duration }));
      }
    }, 60000); // Update every minute

    return (_) => clearInterval(_interval);
  }, [status?.isValid, sessionManager]);

  const getSessionHealth = (_) => {
    if (!status) return 'unknown';
    
    if (!status.isValid) return 'expired';
    if (status.timeUntilExpiry <= 5 * 60 * 1000) return 'critical';
    if (status.isExpiringSoon) return 'warning';
    if (status.refreshInProgress) return 'refreshing';
    return 'healthy';
  };

  return {
    analytics,
    sessionHealth: getSessionHealth(_),
    formatDuration: (_ms: number) => {
      const hours = Math.floor(_ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
  };
}
