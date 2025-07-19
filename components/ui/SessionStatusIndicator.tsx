'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, RefreshCw, WifiOff, X } from 'lucide-react';
import { SessionManager, SessionStatus, SessionEvent } from '@/lib/auth/sessionManager';
import { useAuth } from '@/lib/hooks/useAuth';
import { EnhancedButton } from './EnhancedButton';
import { cn } from '@/lib/utils';

interface SessionStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHide?: boolean;
  hideDelay?: number;
}

export function SessionStatusIndicator({
  className,
  showDetails = false,
  position = 'top-right',
  autoHide = true,
  hideDelay = 5000
}: SessionStatusIndicatorProps) {
  const { isAuthenticated, refreshSession } = useAuth();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [sessionManager] = useState(() => SessionManager.getInstance());
  const [_showWarning, setShowWarning] = useState(false);
  const [timeDisplay, setTimeDisplay] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Session status monitoring
  useEffect(() => {
    if (!isAuthenticated) {
      setIsVisible(false);
      return;
    }

    const updateStatus = () => {
      const status = sessionManager.getSessionStatus();
      setSessionStatus(status);
      
      // Update time display
      if (status.isValid && status.timeUntilExpiry > 0) {
        const minutes = Math.floor(status.timeUntilExpiry / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
          setTimeDisplay(`${hours}h ${minutes % 60}m`);
        } else {
          setTimeDisplay(`${minutes}m`);
        }
      } else {
        setTimeDisplay('Expired');
      }

      // Show indicator for warnings or errors
      const shouldShow = !status.isValid || status.isExpiringSoon || status.refreshInProgress;
      setIsVisible(shouldShow);
      
      // Auto-hide after delay if configured
      if (shouldShow && autoHide && status.isValid) {
        setTimeout(() => {
          if (status.isValid && !status.isExpiringSoon) {
            setIsVisible(false);
          }
        }, hideDelay);
      }
    };

    // Initial status
    updateStatus();

    // Listen for status changes
    const unsubscribeStatus = sessionManager.addStatusListener(updateStatus);
    
    // Listen for session events
    const unsubscribeEvents = sessionManager.addEventListener((event: SessionEvent) => {
      if (event.type === 'warning') {
        setShowWarning(true);
        setIsVisible(true);
      } else if (event.type === 'refresh') {
        updateStatus();
      }
    });
    
    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000);

    return () => {
      unsubscribeStatus();
      unsubscribeEvents();
      clearInterval(interval);
    };
  }, [isAuthenticated, sessionManager, autoHide, hideDelay]);

  // Get status info for display
  const getStatusInfo = () => {
    if (!sessionStatus) {
      return {
        icon: WifiOff,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        borderColor: 'border-gray-500/30',
        message: 'No session',
        severity: 'info' as const
      };
    }

    if (!sessionStatus.isValid) {
      return {
        icon: AlertTriangle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        message: 'Session expired',
        severity: 'error' as const
      };
    }

    if (sessionStatus.refreshInProgress) {
      return {
        icon: RefreshCw,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        message: 'Refreshing session...',
        severity: 'info' as const
      };
    }

    if (sessionStatus.timeUntilExpiry <= 5 * 60 * 1000) { // 5 minutes
      return {
        icon: AlertTriangle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        message: `Session expires in ${timeDisplay}`,
        severity: 'error' as const
      };
    }

    if (sessionStatus.isExpiringSoon) {
      return {
        icon: Clock,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        message: `Session expires in ${timeDisplay}`,
        severity: 'warning' as const
      };
    }

    return {
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      message: 'Session active',
      severity: 'success' as const
    };
  };

  const handleRefresh = async () => {
    try {
      await refreshSession();
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowWarning(false);
  };

  if (!isAuthenticated || !isVisible) {
    return null;
  }

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: position.includes('top') ? -20 : 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: position.includes('top') ? -20 : 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'fixed z-50 max-w-sm',
          positionClasses[position],
          className
        )}
      >
        <div className={cn(
          'relative p-4 rounded-xl backdrop-blur-md border',
          'bg-gradient-to-br from-slate-900/90 to-slate-800/90',
          statusInfo.borderColor,
          'shadow-lg shadow-black/20'
        )}>
          {/* Glass shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 rounded-xl pointer-events-none" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center',
                  statusInfo.bgColor
                )}>
                  <StatusIcon className={cn(
                    'w-3 h-3',
                    statusInfo.color,
                    statusInfo.icon === RefreshCw && 'animate-spin'
                  )} />
                </div>
                <span className="text-sm font-medium text-white">
                  Session Status
                </span>
              </div>
              
              <EnhancedButton
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0 text-gray-400 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="w-3 h-3" />
              </EnhancedButton>
            </div>

            {/* Message */}
            <p className={cn('text-sm mb-3', statusInfo.color)}>
              {statusInfo.message}
            </p>

            {/* Details */}
            {showDetails && sessionStatus && (
              <div className="bg-black/20 rounded-lg p-3 mb-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Status:</span>
                  <span className={statusInfo.color}>
                    {sessionStatus.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                
                {sessionStatus.isValid && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Expires in:</span>
                      <span className="text-white font-mono">{timeDisplay}</span>
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Last activity:</span>
                      <span className="text-white font-mono">
                        {Math.floor(sessionStatus.timeSinceActivity / (1000 * 60))}m ago
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            {sessionStatus && (sessionStatus.needsRefresh || !sessionStatus.isValid) && (
              <div className="flex space-x-2">
                <EnhancedButton
                  onClick={handleRefresh}
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  loading={sessionStatus.refreshInProgress}
                  loadingText="Refreshing..."
                  touchTarget
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh Session
                </EnhancedButton>
              </div>
            )}

            {/* Warning for critical expiration */}
            {sessionStatus && sessionStatus.timeUntilExpiry <= 2 * 60 * 1000 && sessionStatus.isValid && (
              <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-300">
                    Your session will expire very soon. Please save your work!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Compact version for navigation bar
export function SessionStatusBadge({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [sessionManager] = useState(() => SessionManager.getInstance());

  useEffect(() => {
    if (!isAuthenticated) return;

    const updateStatus = () => {
      const status = sessionManager.getSessionStatus();
      setSessionStatus(status);
    };

    updateStatus();
    const unsubscribe = sessionManager.addStatusListener(updateStatus);
    const interval = setInterval(updateStatus, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isAuthenticated, sessionManager]);

  if (!isAuthenticated || !sessionStatus) {
    return null;
  }

  const getStatusColor = () => {
    if (!sessionStatus.isValid) return 'bg-red-500';
    if (sessionStatus.refreshInProgress) return 'bg-blue-500 animate-pulse';
    if (sessionStatus.timeUntilExpiry <= 5 * 60 * 1000) return 'bg-red-500';
    if (sessionStatus.isExpiringSoon) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Only show badge if there's an issue or activity
  const shouldShow = !sessionStatus.isValid || 
                   sessionStatus.isExpiringSoon || 
                   sessionStatus.refreshInProgress;

  if (!shouldShow) return null;

  return (
    <div className={cn('w-2 h-2 rounded-full', getStatusColor(), className)} 
         title={`Session status: ${sessionStatus.isValid ? 'Active' : 'Expired'}`} />
  );
}
