'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  AlertCircle,
  Loader2,
  RefreshCw,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium
} from 'lucide-react';
import { ConnectionStatus } from '@/lib/collaboration/CollaborationClient';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  latency?: number; // in milliseconds
  pendingOperations?: number;
  queuedMessages?: number;
  onReconnect?: () => void;
  onTroubleshoot?: () => void;
  className?: string;
  compact?: boolean;
}

interface ConnectionMetrics {
  latency: number;
  packetsLost: number;
  reconnectAttempts: number;
  lastConnected?: Date;
  uptime: number; // in seconds
}

export function ConnectionStatusIndicator({
  status,
  latency = 0,
  pendingOperations = 0,
  queuedMessages = 0,
  onReconnect,
  onTroubleshoot,
  className,
  compact = false
}: ConnectionStatusIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    latency: 0,
    packetsLost: 0,
    reconnectAttempts: 0,
    uptime: 0
  });

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'connected') {
        setMetrics(prev => ({
          ...prev,
          uptime: prev.uptime + 1,
          latency: latency
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, latency]);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-400/30',
          pulseColor: 'bg-green-400'
        };
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Connecting...',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-400/30',
          pulseColor: 'bg-blue-400'
        };
      case 'reconnecting':
        return {
          icon: RefreshCw,
          text: 'Reconnecting...',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-400/30',
          pulseColor: 'bg-yellow-400'
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Disconnected',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-400/30',
          pulseColor: 'bg-gray-400'
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Connection Error',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-400/30',
          pulseColor: 'bg-red-400'
        };
      default:
        return {
          icon: WifiOff,
          text: 'Unknown',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-400/30',
          pulseColor: 'bg-gray-400'
        };
    }
  };

  const getSignalIcon = () => {
    if (status !== 'connected') return Signal;
    
    if (latency < 50) return SignalHigh;
    if (latency < 150) return SignalMedium;
    return SignalLow;
  };

  const getLatencyColor = () => {
    if (latency < 50) return 'text-green-400';
    if (latency < 150) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const SignalIcon = getSignalIcon();

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className="relative">
          <Icon 
            className={cn(
              'w-4 h-4',
              config.color,
              (status === 'connecting' || status === 'reconnecting') && 'animate-spin'
            )} 
          />
          {status === 'connected' && (
            <motion.div
              className={cn('absolute -top-1 -right-1 w-2 h-2 rounded-full', config.pulseColor)}
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        {status === 'connected' && latency > 0 && (
          <div className="flex items-center space-x-1">
            <SignalIcon className={cn('w-3 h-3', getLatencyColor())} />
            <span className={cn('text-xs', getLatencyColor())}>{latency}ms</span>
          </div>
        )}

        {(pendingOperations > 0 || queuedMessages > 0) && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span className="text-xs text-orange-400">
              {pendingOperations + queuedMessages}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('p-4 bg-white/10 backdrop-blur-md border border-white/20', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn(
            'p-2 rounded-full border',
            config.bgColor,
            config.borderColor
          )}>
            <Icon 
              className={cn(
                'w-5 h-5',
                config.color,
                (status === 'connecting' || status === 'reconnecting') && 'animate-spin'
              )} 
            />
          </div>

          <div>
            <div className={cn('font-medium', config.color)}>
              {config.text}
            </div>
            
            {status === 'connected' && (
              <div className="flex items-center space-x-3 text-sm text-gray-400 mt-1">
                <div className="flex items-center space-x-1">
                  <SignalIcon className={cn('w-3 h-3', getLatencyColor())} />
                  <span className={getLatencyColor()}>{latency}ms</span>
                </div>
                <span>Uptime: {formatUptime(metrics.uptime)}</span>
              </div>
            )}

            {(status === 'reconnecting' || status === 'error') && metrics.reconnectAttempts > 0 && (
              <div className="text-sm text-gray-400 mt-1">
                Attempt {metrics.reconnectAttempts}/5
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Pending operations indicator */}
          {(pendingOperations > 0 || queuedMessages > 0) && (
            <div className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-400/30">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              <span className="text-xs text-orange-400">
                {pendingOperations + queuedMessages} pending
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-1">
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Show details"
            >
              <Signal className="w-4 h-4" />
            </Button>

            {(status === 'disconnected' || status === 'error') && onReconnect && (
              <Button
                onClick={onReconnect}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Reconnect"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Detailed metrics */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Latency</div>
                <div className={cn('font-medium', getLatencyColor())}>
                  {latency}ms
                </div>
              </div>

              <div>
                <div className="text-gray-400">Uptime</div>
                <div className="font-medium text-white">
                  {formatUptime(metrics.uptime)}
                </div>
              </div>

              <div>
                <div className="text-gray-400">Pending Ops</div>
                <div className="font-medium text-white">
                  {pendingOperations}
                </div>
              </div>

              <div>
                <div className="text-gray-400">Queued Msgs</div>
                <div className="font-medium text-white">
                  {queuedMessages}
                </div>
              </div>

              {metrics.reconnectAttempts > 0 && (
                <>
                  <div>
                    <div className="text-gray-400">Reconnects</div>
                    <div className="font-medium text-yellow-400">
                      {metrics.reconnectAttempts}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400">Packets Lost</div>
                    <div className="font-medium text-red-400">
                      {metrics.packetsLost}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Troubleshooting */}
            {(status === 'error' || status === 'disconnected') && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-400/30">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-400 mb-1">
                      Connection Issues
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      {status === 'error' 
                        ? 'Unable to establish connection to collaboration server'
                        : 'Connection to collaboration server was lost'
                      }
                    </div>
                    <div className="flex space-x-2">
                      {onReconnect && (
                        <Button
                          onClick={onReconnect}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                      )}
                      {onTroubleshoot && (
                        <Button
                          onClick={onTroubleshoot}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6"
                        >
                          Troubleshoot
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Connection quality indicator */}
            {status === 'connected' && (
              <div className="mt-4">
                <div className="text-xs text-gray-400 mb-2">Connection Quality</div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map(bar => (
                    <div
                      key={bar}
                      className={cn(
                        'w-2 h-4 rounded-sm',
                        latency < 50 && bar <= 5 ? 'bg-green-400' :
                        latency < 100 && bar <= 4 ? 'bg-green-400' :
                        latency < 150 && bar <= 3 ? 'bg-yellow-400' :
                        latency < 200 && bar <= 2 ? 'bg-orange-400' :
                        bar <= 1 ? 'bg-red-400' : 'bg-gray-600'
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
