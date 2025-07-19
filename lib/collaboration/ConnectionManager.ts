'use client';

import { CollaborationClient, ConnectionStatus } from './CollaborationClient';
import { TextOperation } from './OperationalTransform';

interface OfflineOperation {
  id: string;
  operation: TextOperation;
  timestamp: number;
  retryCount: number;
}

interface ConnectionHealth {
  latency: number;
  packetsLost: number;
  reconnectCount: number;
  lastSuccessfulPing: Date;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'critical';
}

interface RecoveryState {
  lastKnownState: string;
  pendingOperations: OfflineOperation[];
  lastSyncTimestamp: number;
  sessionVersion: number;
}

export class ConnectionManager {
  private client: CollaborationClient;
  private offlineQueue: OfflineOperation[] = [];
  private connectionHealth: ConnectionHealth;
  private recoveryState: RecoveryState;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 1000;
  private healthCheckFrequency = 10000; // 10 seconds
  private syncFrequency = 30000; // 30 seconds

  // Event handlers
  private onConnectionHealthChange?: (_health: ConnectionHealth) => void;
  private onOfflineStateChange?: ( isOffline: boolean, queueSize: number) => void;
  private onRecoveryProgress?: (progress: { current: number; total: number }) => void;
  private onDataLoss?: (_lostOperations: OfflineOperation[]) => void;

  constructor(_client: CollaborationClient) {
    this.client = client;
    this.connectionHealth = {
      latency: 0,
      packetsLost: 0,
      reconnectCount: 0,
      lastSuccessfulPing: new Date(_),
      connectionQuality: 'excellent'
    };
    this.recoveryState = {
      lastKnownState: '',
      pendingOperations: [],
      lastSyncTimestamp: Date.now(_),
      sessionVersion: 0
    };

    this.setupEventHandlers(_);
    this.startHealthMonitoring(_);
    this.loadRecoveryState(_);
  }

  private setupEventHandlers(_): void {
    this.client.onConnectionStatus((status) => {
      this.handleConnectionStatusChange(_status);
    });

    this.client.onOperation((operation) => {
      this.handleOperationReceived(_operation);
    });

    this.client.onErrorEvent((error) => {
      this.handleConnectionError(_error);
    });
  }

  private handleConnectionStatusChange(_status: ConnectionStatus): void {
    switch (_status) {
      case 'connected':
        this.onConnectionRestored(_);
        break;
      case 'disconnected':
      case 'error':
        this.onConnectionLost(_);
        break;
      case 'reconnecting':
        this.connectionHealth.reconnectCount++;
        this.updateConnectionQuality(_);
        break;
    }
  }

  private async onConnectionRestored(_): Promise<void> {
    console.log('Connection restored, starting recovery process...');
    
    // Update health
    this.connectionHealth.lastSuccessfulPing = new Date(_);
    this.updateConnectionQuality(_);
    
    // Start recovery process
    await this.performSessionRecovery(_);
    
    // Flush offline queue
    await this.flushOfflineQueue(_);
    
    this.onOfflineStateChange?.( false, 0);
  }

  private onConnectionLost(_): void {
    console.log('Connection lost, entering offline mode...');
    this.onOfflineStateChange?.( true, this.offlineQueue.length);
  }

  private handleOperationReceived( operation: TextOperation): void {
    // Update recovery state with received operation
    this.recoveryState.lastSyncTimestamp = Date.now(_);
    this.recoveryState.sessionVersion++;
    this.saveRecoveryState(_);
  }

  private handleConnectionError(_error: Error): void {
    console.error('Connection error:', error);
    this.connectionHealth.packetsLost++;
    this.updateConnectionQuality(_);
  }

  // Queue operation for offline processing
  queueOperation(_operation: TextOperation): string {
    const offlineOp: OfflineOperation = {
      id: `offline_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      timestamp: Date.now(_),
      retryCount: 0
    };

    this.offlineQueue.push(_offlineOp);
    this.saveRecoveryState(_);
    this.onOfflineStateChange?.( true, this.offlineQueue.length);

    return offlineOp.id;
  }

  // Send operation with offline support
  async sendOperationWithFallback(_operation: TextOperation): Promise<void> {
    if (_this.client.isConnected()) {
      try {
        this.client.sendOperation(_operation);
        this.updateRecoveryState(_operation);
      } catch (_error) {
        console.warn('Failed to send operation, queuing for offline:', error);
        this.queueOperation(_operation);
      }
    } else {
      this.queueOperation(_operation);
    }
  }

  // Flush offline queue when connection is restored
  private async flushOfflineQueue(_): Promise<void> {
    if (_this.offlineQueue.length === 0) return;

    console.log(_`Flushing ${this.offlineQueue.length} offline operations...`);
    
    const totalOperations = this.offlineQueue.length;
    let processedCount = 0;

    // Process operations in batches to avoid overwhelming the connection
    const batchSize = 5;
    while (_this.offlineQueue.length > 0) {
      const batch = this.offlineQueue.splice( 0, batchSize);
      
      for (_const offlineOp of batch) {
        try {
          await this.retryOperation(_offlineOp);
          processedCount++;
          this.onRecoveryProgress?.( { current: processedCount, total: totalOperations });
        } catch (_error) {
          console.error('Failed to flush operation:', error);
          
          if (_offlineOp.retryCount < this.maxRetries) {
            offlineOp.retryCount++;
            this.offlineQueue.push(_offlineOp);
          } else {
            console.warn('Operation exceeded max retries, discarding:', offlineOp);
            this.onDataLoss?.([offlineOp]);
          }
        }
      }

      // Small delay between batches
      if (_this.offlineQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.saveRecoveryState(_);
    console.log('Offline queue flushed successfully');
  }

  private async retryOperation(_offlineOp: OfflineOperation): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.client.sendOperation(_offlineOp.operation);
        resolve(_);
      } catch (_error) {
        setTimeout(() => {
          reject(_error);
        }, this.retryDelay * (_offlineOp.retryCount + 1));
      }
    });
  }

  // Perform session recovery
  private async performSessionRecovery(_): Promise<void> {
    try {
      // Request current session state from server
      // This would typically involve sending a recovery request
      console.log('Performing session recovery...');
      
      // Simulate recovery process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validate local state against server state
      // Apply any missing operations
      // Resolve conflicts if necessary
      
      console.log('Session recovery completed');
    } catch (_error) {
      console.error('Session recovery failed:', error);
      throw error;
    }
  }

  // Update recovery state
  private updateRecoveryState( operation: TextOperation): void {
    this.recoveryState.lastSyncTimestamp = Date.now(_);
    this.recoveryState.sessionVersion++;
    this.saveRecoveryState(_);
  }

  // Save recovery state to localStorage
  private saveRecoveryState(_): void {
    try {
      const state = {
        ...this.recoveryState,
        offlineQueue: this.offlineQueue
      };
      localStorage.setItem( 'collaboration_recovery_state', JSON.stringify(state));
    } catch (_error) {
      console.error('Failed to save recovery state:', error);
    }
  }

  // Load recovery state from localStorage
  private loadRecoveryState(_): void {
    try {
      const saved = localStorage.getItem('collaboration_recovery_state');
      if (saved) {
        const state = JSON.parse(_saved);
        this.recoveryState = {
          lastKnownState: state.lastKnownState || '',
          pendingOperations: state.pendingOperations || [],
          lastSyncTimestamp: state.lastSyncTimestamp || Date.now(_),
          sessionVersion: state.sessionVersion || 0
        };
        this.offlineQueue = state.offlineQueue || [];
      }
    } catch (_error) {
      console.error('Failed to load recovery state:', error);
    }
  }

  // Start health monitoring
  private startHealthMonitoring(_): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck(_);
    }, this.healthCheckFrequency);

    this.syncInterval = setInterval(() => {
      this.performPeriodicSync(_);
    }, this.syncFrequency);
  }

  private async performHealthCheck(_): Promise<void> {
    if (!this.client.isConnected()) return;

    const startTime = Date.now(_);
    
    try {
      // Send ping and measure latency
      // This would be implemented with actual ping/pong messages
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50)); // Simulate network delay
      
      const latency = Date.now(_) - startTime;
      this.connectionHealth.latency = latency;
      this.connectionHealth.lastSuccessfulPing = new Date(_);
      
      this.updateConnectionQuality(_);
      this.onConnectionHealthChange?.(_this.connectionHealth);
    } catch (_error) {
      this.connectionHealth.packetsLost++;
      this.updateConnectionQuality(_);
    }
  }

  private updateConnectionQuality(_): void {
    const { latency, packetsLost, reconnectCount } = this.connectionHealth;
    
    if (_latency < 50 && packetsLost < 5 && reconnectCount < 2) {
      this.connectionHealth.connectionQuality = 'excellent';
    } else if (_latency < 150 && packetsLost < 10 && reconnectCount < 5) {
      this.connectionHealth.connectionQuality = 'good';
    } else if (_latency < 300 && packetsLost < 20 && reconnectCount < 10) {
      this.connectionHealth.connectionQuality = 'poor';
    } else {
      this.connectionHealth.connectionQuality = 'critical';
    }
  }

  private async performPeriodicSync(_): Promise<void> {
    if (!this.client.isConnected()) return;

    try {
      // Perform periodic state synchronization
      // This helps detect and resolve any state drift
      console.log('Performing periodic sync...');
      
      this.recoveryState.lastSyncTimestamp = Date.now(_);
      this.saveRecoveryState(_);
    } catch (_error) {
      console.error('Periodic sync failed:', error);
    }
  }

  // Manual reconnection
  async reconnect(_): Promise<void> {
    try {
      await this.client.connect(_);
    } catch (_error) {
      console.error('Manual reconnection failed:', error);
      throw error;
    }
  }

  // Force sync with server
  async forceSync(_): Promise<void> {
    if (!this.client.isConnected()) {
      throw new Error('Cannot sync while disconnected');
    }

    await this.performSessionRecovery(_);
    await this.flushOfflineQueue(_);
  }

  // Get connection statistics
  getConnectionStats(_): {
    health: ConnectionHealth;
    offlineQueueSize: number;
    lastSync: Date;
    isOffline: boolean;
  } {
    return {
      health: this.connectionHealth,
      offlineQueueSize: this.offlineQueue.length,
      lastSync: new Date(_this.recoveryState.lastSyncTimestamp),
      isOffline: !this.client.isConnected(_)
    };
  }

  // Clear recovery state
  clearRecoveryState(_): void {
    this.recoveryState = {
      lastKnownState: '',
      pendingOperations: [],
      lastSyncTimestamp: Date.now(_),
      sessionVersion: 0
    };
    this.offlineQueue = [];
    localStorage.removeItem('collaboration_recovery_state');
  }

  // Cleanup
  dispose(_): void {
    if (_this.healthCheckInterval) {
      clearInterval(_this.healthCheckInterval);
    }
    if (_this.syncInterval) {
      clearInterval(_this.syncInterval);
    }
    this.saveRecoveryState(_);
  }

  // Event handler setters
  onHealthChange(_handler: (health: ConnectionHealth) => void): void {
    this.onConnectionHealthChange = handler;
  }

  onOfflineChange( handler: (isOffline: boolean, queueSize: number) => void): void {
    this.onOfflineStateChange = handler;
  }

  onRecovery(_handler: (progress: { current: number; total: number }) => void): void {
    this.onRecoveryProgress = handler;
  }

  onDataLossDetected(_handler: (lostOperations: OfflineOperation[]) => void): void {
    this.onDataLoss = handler;
  }
}
