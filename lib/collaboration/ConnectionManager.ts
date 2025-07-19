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
  private onConnectionHealthChange?: (health: ConnectionHealth) => void;
  private onOfflineStateChange?: (isOffline: boolean, queueSize: number) => void;
  private onRecoveryProgress?: (progress: { current: number; total: number }) => void;
  private onDataLoss?: (lostOperations: OfflineOperation[]) => void;

  constructor(client: CollaborationClient) {
    this.client = client;
    this.connectionHealth = {
      latency: 0,
      packetsLost: 0,
      reconnectCount: 0,
      lastSuccessfulPing: new Date(),
      connectionQuality: 'excellent'
    };
    this.recoveryState = {
      lastKnownState: '',
      pendingOperations: [],
      lastSyncTimestamp: Date.now(),
      sessionVersion: 0
    };

    this.setupEventHandlers();
    this.startHealthMonitoring();
    this.loadRecoveryState();
  }

  private setupEventHandlers(): void {
    this.client.onConnectionStatus((status) => {
      this.handleConnectionStatusChange(status);
    });

    this.client.onOperation((operation) => {
      this.handleOperationReceived(operation);
    });

    this.client.onErrorEvent((error) => {
      this.handleConnectionError(error);
    });
  }

  private handleConnectionStatusChange(status: ConnectionStatus): void {
    switch (status) {
      case 'connected':
        this.onConnectionRestored();
        break;
      case 'disconnected':
      case 'error':
        this.onConnectionLost();
        break;
      case 'reconnecting':
        this.connectionHealth.reconnectCount++;
        this.updateConnectionQuality();
        break;
    }
  }

  private async onConnectionRestored(): Promise<void> {
    console.log('Connection restored, starting recovery process...');
    
    // Update health
    this.connectionHealth.lastSuccessfulPing = new Date();
    this.updateConnectionQuality();
    
    // Start recovery process
    await this.performSessionRecovery();
    
    // Flush offline queue
    await this.flushOfflineQueue();
    
    this.onOfflineStateChange?.(false, 0);
  }

  private onConnectionLost(): void {
    console.log('Connection lost, entering offline mode...');
    this.onOfflineStateChange?.(true, this.offlineQueue.length);
  }

  private handleOperationReceived(_operation: TextOperation): void {
    // Update recovery state with received operation
    this.recoveryState.lastSyncTimestamp = Date.now();
    this.recoveryState.sessionVersion++;
    this.saveRecoveryState();
  }

  private handleConnectionError(error: Error): void {
    console.error('Connection error:', error);
    this.connectionHealth.packetsLost++;
    this.updateConnectionQuality();
  }

  // Queue operation for offline processing
  queueOperation(operation: TextOperation): string {
    const offlineOp: OfflineOperation = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.offlineQueue.push(offlineOp);
    this.saveRecoveryState();
    this.onOfflineStateChange?.(true, this.offlineQueue.length);

    return offlineOp.id;
  }

  // Send operation with offline support
  async sendOperationWithFallback(operation: TextOperation): Promise<void> {
    if (this.client.isConnected()) {
      try {
        this.client.sendOperation(operation);
        this.updateRecoveryState(operation);
      } catch (error) {
        console.warn('Failed to send operation, queuing for offline:', error);
        this.queueOperation(operation);
      }
    } else {
      this.queueOperation(operation);
    }
  }

  // Flush offline queue when connection is restored
  private async flushOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    console.log(`Flushing ${this.offlineQueue.length} offline operations...`);
    
    const totalOperations = this.offlineQueue.length;
    let processedCount = 0;

    // Process operations in batches to avoid overwhelming the connection
    const batchSize = 5;
    while (this.offlineQueue.length > 0) {
      const batch = this.offlineQueue.splice(0, batchSize);
      
      for (const offlineOp of batch) {
        try {
          await this.retryOperation(offlineOp);
          processedCount++;
          this.onRecoveryProgress?.({ current: processedCount, total: totalOperations });
        } catch (error) {
          console.error('Failed to flush operation:', error);
          
          if (offlineOp.retryCount < this.maxRetries) {
            offlineOp.retryCount++;
            this.offlineQueue.push(offlineOp);
          } else {
            console.warn('Operation exceeded max retries, discarding:', offlineOp);
            this.onDataLoss?.([offlineOp]);
          }
        }
      }

      // Small delay between batches
      if (this.offlineQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.saveRecoveryState();
    console.log('Offline queue flushed successfully');
  }

  private async retryOperation(offlineOp: OfflineOperation): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.client.sendOperation(offlineOp.operation);
        resolve();
      } catch (error) {
        setTimeout(() => {
          reject(error);
        }, this.retryDelay * (offlineOp.retryCount + 1));
      }
    });
  }

  // Perform session recovery
  private async performSessionRecovery(): Promise<void> {
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
    } catch (error) {
      console.error('Session recovery failed:', error);
      throw error;
    }
  }

  // Update recovery state
  private updateRecoveryState(_operation: TextOperation): void {
    this.recoveryState.lastSyncTimestamp = Date.now();
    this.recoveryState.sessionVersion++;
    this.saveRecoveryState();
  }

  // Save recovery state to localStorage
  private saveRecoveryState(): void {
    try {
      const state = {
        ...this.recoveryState,
        offlineQueue: this.offlineQueue
      };
      localStorage.setItem('collaboration_recovery_state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save recovery state:', error);
    }
  }

  // Load recovery state from localStorage
  private loadRecoveryState(): void {
    try {
      const saved = localStorage.getItem('collaboration_recovery_state');
      if (saved) {
        const state = JSON.parse(saved);
        this.recoveryState = {
          lastKnownState: state.lastKnownState || '',
          pendingOperations: state.pendingOperations || [],
          lastSyncTimestamp: state.lastSyncTimestamp || Date.now(),
          sessionVersion: state.sessionVersion || 0
        };
        this.offlineQueue = state.offlineQueue || [];
      }
    } catch (error) {
      console.error('Failed to load recovery state:', error);
    }
  }

  // Start health monitoring
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckFrequency);

    this.syncInterval = setInterval(() => {
      this.performPeriodicSync();
    }, this.syncFrequency);
  }

  private async performHealthCheck(): Promise<void> {
    if (!this.client.isConnected()) return;

    const startTime = Date.now();
    
    try {
      // Send ping and measure latency
      // This would be implemented with actual ping/pong messages
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50)); // Simulate network delay
      
      const latency = Date.now() - startTime;
      this.connectionHealth.latency = latency;
      this.connectionHealth.lastSuccessfulPing = new Date();
      
      this.updateConnectionQuality();
      this.onConnectionHealthChange?.(this.connectionHealth);
    } catch (error) {
      this.connectionHealth.packetsLost++;
      this.updateConnectionQuality();
    }
  }

  private updateConnectionQuality(): void {
    const { latency, packetsLost, reconnectCount } = this.connectionHealth;
    
    if (latency < 50 && packetsLost < 5 && reconnectCount < 2) {
      this.connectionHealth.connectionQuality = 'excellent';
    } else if (latency < 150 && packetsLost < 10 && reconnectCount < 5) {
      this.connectionHealth.connectionQuality = 'good';
    } else if (latency < 300 && packetsLost < 20 && reconnectCount < 10) {
      this.connectionHealth.connectionQuality = 'poor';
    } else {
      this.connectionHealth.connectionQuality = 'critical';
    }
  }

  private async performPeriodicSync(): Promise<void> {
    if (!this.client.isConnected()) return;

    try {
      // Perform periodic state synchronization
      // This helps detect and resolve any state drift
      console.log('Performing periodic sync...');
      
      this.recoveryState.lastSyncTimestamp = Date.now();
      this.saveRecoveryState();
    } catch (error) {
      console.error('Periodic sync failed:', error);
    }
  }

  // Manual reconnection
  async reconnect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Manual reconnection failed:', error);
      throw error;
    }
  }

  // Force sync with server
  async forceSync(): Promise<void> {
    if (!this.client.isConnected()) {
      throw new Error('Cannot sync while disconnected');
    }

    await this.performSessionRecovery();
    await this.flushOfflineQueue();
  }

  // Get connection statistics
  getConnectionStats(): {
    health: ConnectionHealth;
    offlineQueueSize: number;
    lastSync: Date;
    isOffline: boolean;
  } {
    return {
      health: this.connectionHealth,
      offlineQueueSize: this.offlineQueue.length,
      lastSync: new Date(this.recoveryState.lastSyncTimestamp),
      isOffline: !this.client.isConnected()
    };
  }

  // Clear recovery state
  clearRecoveryState(): void {
    this.recoveryState = {
      lastKnownState: '',
      pendingOperations: [],
      lastSyncTimestamp: Date.now(),
      sessionVersion: 0
    };
    this.offlineQueue = [];
    localStorage.removeItem('collaboration_recovery_state');
  }

  // Cleanup
  dispose(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.saveRecoveryState();
  }

  // Event handler setters
  onHealthChange(handler: (health: ConnectionHealth) => void): void {
    this.onConnectionHealthChange = handler;
  }

  onOfflineChange(handler: (isOffline: boolean, queueSize: number) => void): void {
    this.onOfflineStateChange = handler;
  }

  onRecovery(handler: (progress: { current: number; total: number }) => void): void {
    this.onRecoveryProgress = handler;
  }

  onDataLossDetected(handler: (lostOperations: OfflineOperation[]) => void): void {
    this.onDataLoss = handler;
  }
}
