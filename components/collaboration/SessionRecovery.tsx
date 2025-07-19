'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Wifi, WifiOff, Download, Upload, Database, Shield, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';

interface RecoveryProgress {
  current: number;
  total: number;
  stage: 'connecting' | 'syncing' | 'resolving' | 'complete';
  message: string;
}

interface SessionRecoveryProps {
  isVisible: boolean;
  isRecovering: boolean;
  progress?: RecoveryProgress;
  offlineQueueSize: number;
  lastSyncTime?: Date;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'critical';
  onReconnect: () => Promise<void>;
  onForceSync: () => Promise<void>;
  onClearOfflineData: () => void;
  onDismiss: () => void;
  className?: string;
}

export function SessionRecovery({
  isVisible,
  isRecovering,
  progress,
  offlineQueueSize,
  lastSyncTime,
  connectionQuality,
  onReconnect,
  onForceSync,
  onClearOfflineData,
  onDismiss,
  className
}: SessionRecoveryProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent':
        return 'text-green-400';
      case 'good':
        return 'text-blue-400';
      case 'poor':
        return 'text-yellow-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getQualityIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
      case 'good':
        return Wifi;
      case 'poor':
      case 'critical':
        return WifiOff;
      default:
        return WifiOff;
    }
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await onReconnect();
    } catch (error) {
      console.error('Reconnection failed:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await onForceSync();
    } catch (error) {
      console.error('Force sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'connecting':
        return RefreshCw;
      case 'syncing':
        return Download;
      case 'resolving':
        return Database;
      case 'complete':
        return CheckCircle;
      default:
        return RefreshCw;
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn('fixed top-4 right-4 z-50 w-96', className)}
      >
        <Card className="p-4 bg-gray-900/95 backdrop-blur-md border border-white/20 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                {React.createElement(getQualityIcon(), {
                  className: cn('w-5 h-5', getQualityColor())
                })}
                {isRecovering && (
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="w-5 h-5 text-blue-400" />
                  </motion.div>
                )}
              </div>
              <h3 className="font-semibold text-white">
                {isRecovering ? 'Recovering Session...' : 'Connection Status'}
              </h3>
            </div>
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Recovery Progress */}
          {isRecovering && progress && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {React.createElement(getStageIcon(progress.stage), {
                    className: cn(
                      'w-4 h-4',
                      progress.stage === 'complete' ? 'text-green-400' : 'text-blue-400',
                      progress.stage !== 'complete' && 'animate-spin'
                    )
                  })}
                  <span className="text-sm text-white">{progress.message}</span>
                </div>
                <span className="text-sm text-gray-400">
                  {progress.current}/{progress.total}
                </span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Status Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Connection Quality</span>
              <span className={cn('text-sm font-medium capitalize', getQualityColor())}>
                {connectionQuality}
              </span>
            </div>

            {offlineQueueSize > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Pending Changes</span>
                <div className="flex items-center space-x-1">
                  <Upload className="w-3 h-3 text-orange-400" />
                  <span className="text-sm text-orange-400">{offlineQueueSize}</span>
                </div>
              </div>
            )}

            {lastSyncTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Last Sync</span>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-sm text-gray-400">{formatTimeAgo(lastSyncTime)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 space-y-2">
            <div className="flex space-x-2">
              <Button
                onClick={handleReconnect}
                disabled={isReconnecting || isRecovering}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isReconnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Reconnecting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reconnect
                  </>
                )}
              </Button>

              <Button
                onClick={handleForceSync}
                disabled={isSyncing || isRecovering || offlineQueueSize === 0}
                variant="outline"
                className="flex-1"
              >
                {isSyncing ? (
                  <>
                    <Download className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Force Sync
                  </>
                )}
              </Button>
            </div>

            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              size="sm"
              className="w-full text-xs"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>

          {/* Detailed Information */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/10"
              >
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-white mb-2">Recovery Options</h4>
                    <div className="space-y-2">
                      <Button
                        onClick={onClearOfflineData}
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-red-400 hover:text-red-300"
                      >
                        <AlertTriangle className="w-3 h-3 mr-2" />
                        Clear Offline Data
                      </Button>
                    </div>
                  </div>

                  {offlineQueueSize > 0 && (
                    <div className="p-3 bg-orange-500/10 border border-orange-400/30 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-orange-400">
                            Offline Changes Detected
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {offlineQueueSize} change{offlineQueueSize > 1 ? 's' : ''} will be synced when connection is restored.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    <div className="flex items-center space-x-1 mb-1">
                      <Shield className="w-3 h-3" />
                      <span>Your work is automatically saved locally</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Database className="w-3 h-3" />
                      <span>Changes will sync when connection is restored</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for managing session recovery state
export function useSessionRecovery() {
  const [isRecovering, setIsRecovering] = useState(false);
  const [progress, setProgress] = useState<RecoveryProgress | undefined>();
  const [showRecovery, setShowRecovery] = useState(false);

  const startRecovery = (totalSteps: number) => {
    setIsRecovering(true);
    setShowRecovery(true);
    setProgress({
      current: 0,
      total: totalSteps,
      stage: 'connecting',
      message: 'Establishing connection...'
    });
  };

  const updateProgress = (current: number, stage: RecoveryProgress['stage'], message: string) => {
    setProgress(prev => prev ? {
      ...prev,
      current,
      stage,
      message
    } : undefined);
  };

  const completeRecovery = () => {
    setProgress(prev => prev ? {
      ...prev,
      current: prev.total,
      stage: 'complete',
      message: 'Recovery complete'
    } : undefined);

    setTimeout(() => {
      setIsRecovering(false);
      setShowRecovery(false);
      setProgress(undefined);
    }, 2000);
  };

  const cancelRecovery = () => {
    setIsRecovering(false);
    setShowRecovery(false);
    setProgress(undefined);
  };

  return {
    isRecovering,
    progress,
    showRecovery,
    startRecovery,
    updateProgress,
    completeRecovery,
    cancelRecovery,
    setShowRecovery
  };
}
