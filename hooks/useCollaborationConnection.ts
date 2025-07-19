'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CollaborationClient, ConnectionStatus } from '@/lib/collaboration/CollaborationClient';
import { ConnectionManager } from '@/lib/collaboration/ConnectionManager';
import { TextOperation } from '@/lib/collaboration/OperationalTransform';
import { CollaborationUser } from '@/types/collaboration';

interface ConnectionState {
  status: ConnectionStatus;
  latency: number;
  isOffline: boolean;
  offlineQueueSize: number;
  lastSyncTime: Date | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'critical';
  isRecovering: boolean;
  recoveryProgress?: {
    current: number;
    total: number;
    stage: 'connecting' | 'syncing' | 'resolving' | 'complete';
    message: string;
  };
}

interface CollaborationConnectionOptions {
  wsUrl: string;
  userId: string;
  sessionId: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  enableOfflineMode?: boolean;
  onConnectionChange?: (state: ConnectionState) => void;
  onOperationReceived?: (operation: TextOperation) => void;
  onUserPresenceUpdate?: (users: CollaborationUser[]) => void;
  onChatMessage?: (message: { id: string; userId: string; content: string; timestamp: Date; type: 'text' | 'code' }) => void;
  onCompilationResult?: (result: { success: boolean; errors: string[]; warnings: string[]; bytecode?: string; gasEstimate?: number }) => void;
  onError?: (error: Error) => void;
}

export function useCollaborationConnection(options: CollaborationConnectionOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    latency: 0,
    isOffline: false,
    offlineQueueSize: 0,
    lastSyncTime: null,
    connectionQuality: 'excellent',
    isRecovering: false
  });

  const clientRef = useRef<CollaborationClient | null>(null);
  const connectionManagerRef = useRef<ConnectionManager | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Initialize collaboration client and connection manager
  useEffect(() => {
    const client = new CollaborationClient(
      options.wsUrl,
      options.userId,
      options.sessionId
    );

    const connectionManager = new ConnectionManager(client);

    // Setup event handlers
    client.onConnectionStatus((status) => {
      setConnectionState(prev => ({ ...prev, status }));
      handleConnectionStatusChange(status);
    });

    client.onOperation((operation) => {
      options.onOperationReceived?.(operation);
    });

    client.onPresence((users) => {
      options.onUserPresenceUpdate?.(users);
    });

    client.onChat((message) => {
      options.onChatMessage?.(message);
    });

    client.onCompilation((result) => {
      options.onCompilationResult?.(result);
    });

    client.onErrorEvent((error) => {
      options.onError?.(error);
    });

    // Setup connection manager handlers
    connectionManager.onHealthChange((health) => {
      setConnectionState(prev => ({
        ...prev,
        latency: health.latency,
        connectionQuality: health.connectionQuality
      }));
    });

    connectionManager.onOfflineChange((isOffline, queueSize) => {
      setConnectionState(prev => ({
        ...prev,
        isOffline,
        offlineQueueSize: queueSize
      }));
    });

    connectionManager.onRecovery((progress) => {
      setConnectionState(prev => ({
        ...prev,
        isRecovering: true,
        recoveryProgress: {
          current: progress.current,
          total: progress.total,
          stage: 'syncing',
          message: `Syncing ${progress.current}/${progress.total} operations...`
        }
      }));
    });

    connectionManager.onDataLossDetected((lostOperations) => {
      console.warn('Data loss detected:', lostOperations);
      options.onError?.(new Error(`${lostOperations.length} operations could not be recovered`));
    });

    clientRef.current = client;
    connectionManagerRef.current = connectionManager;

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      connectionManager.dispose();
      client.disconnect();
    };
  }, [options.wsUrl, options.userId, options.sessionId]);

  // Handle connection status changes
  const handleConnectionStatusChange = useCallback((status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        reconnectAttemptsRef.current = 0;
        setConnectionState(prev => ({
          ...prev,
          isRecovering: false,
          recoveryProgress: undefined,
          lastSyncTime: new Date()
        }));
        break;

      case 'disconnected':
      case 'error':
        if (options.autoReconnect && reconnectAttemptsRef.current < (options.maxReconnectAttempts || 5)) {
          scheduleReconnect();
        }
        break;

      case 'reconnecting':
        setConnectionState(prev => ({ ...prev, isRecovering: true }));
        break;
    }

    // Notify parent component
    options.onConnectionChange?.(connectionState);
  }, [options, connectionState]);

  // Schedule automatic reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = (options.reconnectDelay || 1000) * Math.pow(2, reconnectAttemptsRef.current);
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      reconnectAttemptsRef.current++;
      try {
        await connect();
      } catch (error) {
        console.error('Auto-reconnect failed:', error);
        if (reconnectAttemptsRef.current < (options.maxReconnectAttempts || 5)) {
          scheduleReconnect();
        }
      }
    }, delay);
  }, [options.reconnectDelay, options.maxReconnectAttempts]);

  // Connect to collaboration server
  const connect = useCallback(async () => {
    if (!clientRef.current) return;

    try {
      setConnectionState(prev => ({ ...prev, status: 'connecting' }));
      await clientRef.current.connect();
    } catch (error) {
      setConnectionState(prev => ({ ...prev, status: 'error' }));
      throw error;
    }
  }, []);

  // Disconnect from collaboration server
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    clientRef.current?.disconnect();
  }, []);

  // Send operation with offline support
  const sendOperation = useCallback(async (operation: TextOperation) => {
    if (!connectionManagerRef.current) return;

    if (options.enableOfflineMode) {
      await connectionManagerRef.current.sendOperationWithFallback(operation);
    } else if (clientRef.current?.isConnected()) {
      clientRef.current.sendOperation(operation);
    } else {
      throw new Error('Not connected and offline mode is disabled');
    }
  }, [options.enableOfflineMode]);

  // Send cursor update
  const sendCursorUpdate = useCallback((cursor: { line: number; column: number; selection?: { start: { line: number; column: number }; end: { line: number; column: number } } }) => {
    clientRef.current?.sendCursorUpdate(cursor);
  }, []);

  // Send presence update
  const sendPresenceUpdate = useCallback((status: 'online' | 'idle' | 'offline') => {
    clientRef.current?.sendPresenceUpdate(status);
  }, []);

  // Send chat message
  const sendChatMessage = useCallback((content: string, type: 'text' | 'file' = 'text') => {
    clientRef.current?.sendChatMessage(content, type);
  }, []);

  // Send compilation request
  const sendCompilationRequest = useCallback((code: string) => {
    clientRef.current?.sendCompilationRequest(code);
  }, []);

  // Manual reconnection
  const reconnect = useCallback(async () => {
    reconnectAttemptsRef.current = 0;
    await connect();
  }, [connect]);

  // Force synchronization
  const forceSync = useCallback(async () => {
    if (!connectionManagerRef.current) {
      throw new Error('Connection manager not available');
    }

    setConnectionState(prev => ({
      ...prev,
      isRecovering: true,
      recoveryProgress: {
        current: 0,
        total: prev.offlineQueueSize,
        stage: 'syncing',
        message: 'Force syncing...'
      }
    }));

    try {
      await connectionManagerRef.current.forceSync();
      setConnectionState(prev => ({
        ...prev,
        isRecovering: false,
        recoveryProgress: undefined,
        lastSyncTime: new Date()
      }));
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        isRecovering: false,
        recoveryProgress: undefined
      }));
      throw error;
    }
  }, []);

  // Clear offline data
  const clearOfflineData = useCallback(() => {
    connectionManagerRef.current?.clearRecoveryState();
    setConnectionState(prev => ({
      ...prev,
      offlineQueueSize: 0,
      isOffline: false
    }));
  }, []);

  // Get connection statistics
  const getConnectionStats = useCallback(() => {
    return connectionManagerRef.current?.getConnectionStats() || {
      health: {
        latency: 0,
        packetsLost: 0,
        reconnectCount: 0,
        lastSuccessfulPing: new Date(),
        connectionQuality: 'excellent' as const
      },
      offlineQueueSize: 0,
      lastSync: new Date(),
      isOffline: false
    };
  }, []);

  // Check if connected
  const isConnected = useCallback(() => {
    return clientRef.current?.isConnected() || false;
  }, []);

  // Get current status
  const getStatus = useCallback(() => {
    return clientRef.current?.getConnectionStatus() || 'disconnected';
  }, []);

  return {
    // State
    connectionState,
    isConnected: isConnected(),
    status: getStatus(),

    // Actions
    connect,
    disconnect,
    reconnect,
    forceSync,
    clearOfflineData,

    // Communication
    sendOperation,
    sendCursorUpdate,
    sendPresenceUpdate,
    sendChatMessage,
    sendCompilationRequest,

    // Utilities
    getConnectionStats
  };
}
