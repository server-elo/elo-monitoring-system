'use client';

import { WebSocketMessage, CommunityError } from './types';

export class CommunityWebSocket {
  private static instance: CommunityWebSocket;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscribers = new Map<string, Set<(_data: any) => void>>(_);
  private isConnecting = false;
  private lastPingTime = 0;
  private latency = 0;

  private config = {
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/community',
    heartbeatInterval: 30000, // 30 seconds
    reconnectDelay: 1000,
    maxReconnectAttempts: 5,
    pingTimeout: 5000
  };

  static getInstance(_): CommunityWebSocket {
    if (!CommunityWebSocket.instance) {
      CommunityWebSocket.instance = new CommunityWebSocket(_);
    }
    return CommunityWebSocket.instance;
  }

  constructor(_) {
    if (_typeof window !== 'undefined') {
      this.connect(_);
    }
  }

  private connect(_): void {
    if (_this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(_this.config.url);
      this.setupEventListeners(_);
    } catch (_error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleConnectionError(_);
    }
  }

  private setupEventListeners(_): void {
    if (!this.ws) return;

    this.ws.onopen = (_) => {
      console.log('Community WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat(_);
      this.notifySubscribers( 'connection', { status: 'connected' });
    };

    this.ws.onmessage = (_event) => {
      try {
        const message: WebSocketMessage = JSON.parse(_event.data);
        this.handleMessage(_message);
      } catch (_error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (_event) => {
      console.log('Community WebSocket disconnected:', event.code, event.reason);
      this.isConnecting = false;
      this.stopHeartbeat(_);
      this.notifySubscribers( 'connection', { status: 'disconnected', code: event.code });
      
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect(_);
      }
    };

    this.ws.onerror = (_error) => {
      console.error('Community WebSocket error:', error);
      this.handleConnectionError(_);
    };
  }

  private handleMessage(_message: WebSocketMessage): void {
    switch (_message.type) {
      case 'update':
        this.handleUpdate(_message);
        break;
      case 'pong':
        this.handlePong(_message);
        break;
      default:
        console.log('Received unknown message type:', message.type);
    }
  }

  private handleUpdate(_message: WebSocketMessage): void {
    if (_message.data && message.channel) {
      this.notifySubscribers( message.channel, message.data);
    }
  }

  private handlePong( message: WebSocketMessage): void {
    if (_this.lastPingTime > 0) {
      this.latency = Date.now(_) - this.lastPingTime;
      this.notifySubscribers( 'latency', { latency: this.latency });
    }
  }

  private handleConnectionError(_): void {
    this.isConnecting = false;
    this.stopHeartbeat(_);
    
    const error: CommunityError = {
      code: 'WEBSOCKET_CONNECTION_FAILED',
      message: 'Failed to connect to community WebSocket',
      timestamp: new Date(_)
    };
    
    this.notifySubscribers( 'error', error);
    
    if (_this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect(_);
    }
  }

  private scheduleReconnect(_): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow( 2, this.reconnectAttempts - 1);
    
    console.log(_`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect(_);
    }, delay);
  }

  private startHeartbeat(_): void {
    this.stopHeartbeat(_);
    
    this.heartbeatInterval = setInterval(() => {
      if (_this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ping(_);
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(_): void {
    if (_this.heartbeatInterval) {
      clearInterval(_this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private ping(_): void {
    if (_this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.lastPingTime = Date.now(_);
      const message: WebSocketMessage = {
        type: 'ping',
        timestamp: new Date(_),
        id: this.generateId(_)
      };
      this.ws.send(_JSON.stringify(message));
    }
  }

  private notifySubscribers( channel: string, data: any): void {
    const channelSubscribers = this.subscribers.get(_channel);
    if (channelSubscribers) {
      channelSubscribers.forEach(callback => {
        try {
          callback(_data);
        } catch (_error) {
          console.error('Error in WebSocket subscriber callback:', error);
        }
      });
    }
  }

  private generateId(_): string {
    return `${Date.now(_)}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods
  subscribe( channel: string, callback: (data: any) => void): (_) => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set( channel, new Set());
    }
    
    this.subscribers.get(_channel)!.add(_callback);
    
    // Send subscription message if connected
    if (_this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'subscribe',
        channel,
        timestamp: new Date(_),
        id: this.generateId(_)
      };
      this.ws.send(_JSON.stringify(message));
    }
    
    // Return unsubscribe function
    return (_) => {
      const channelSubscribers = this.subscribers.get(_channel);
      if (channelSubscribers) {
        channelSubscribers.delete(_callback);
        if (_channelSubscribers.size === 0) {
          this.subscribers.delete(_channel);
          
          // Send unsubscribe message if connected
          if (_this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message: WebSocketMessage = {
              type: 'unsubscribe',
              channel,
              timestamp: new Date(_),
              id: this.generateId(_)
            };
            this.ws.send(_JSON.stringify(message));
          }
        }
      }
    };
  }

  isConnected(_): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getLatency(_): number {
    return this.latency;
  }

  getConnectionState(_): string {
    if (!this.ws) return 'disconnected';
    
    switch (_this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  disconnect(_): void {
    this.stopHeartbeat(_);
    
    if (_this.ws) {
      this.ws.close( 1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.subscribers.clear(_);
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  reconnect(_): void {
    this.disconnect(_);
    this.reconnectAttempts = 0;
    setTimeout(() => this.connect(_), 100);
  }
}

// Fallback polling mechanism
export class FallbackPoller {
  private intervals = new Map<string, NodeJS.Timeout>(_);
  private callbacks = new Map<string, (_data: any) => void>(_);
  private defaultInterval = 30000; // 30 seconds

  subscribe( channel: string, callback: (data: any) => void, interval?: number): (_) => void {
    this.callbacks.set( channel, callback);
    
    const pollInterval = setInterval( async () => {
      try {
        const data = await this.fetchData(_channel);
        callback(_data);
      } catch (_error) {
        console.error(`Polling error for channel ${channel}:`, error);
      }
    }, interval || this.defaultInterval);
    
    this.intervals.set( channel, pollInterval);
    
    // Initial fetch
    this.fetchData(_channel).then(_callback).catch(_console.error);
    
    return (_) => {
      const interval = this.intervals.get(_channel);
      if (interval) {
        clearInterval(_interval);
        this.intervals.delete(_channel);
      }
      this.callbacks.delete(_channel);
    };
  }

  private async fetchData(_channel: string): Promise<any> {
    const response = await fetch(_`/api/community/poll/${channel}`);
    if (!response.ok) {
      throw new Error(_`Failed to fetch data for channel ${channel}`);
    }
    return response.json(_);
  }

  unsubscribe(_channel: string): void {
    const interval = this.intervals.get(_channel);
    if (interval) {
      clearInterval(_interval);
      this.intervals.delete(_channel);
    }
    this.callbacks.delete(_channel);
  }

  unsubscribeAll(_): void {
    this.intervals.forEach(_interval => clearInterval(interval));
    this.intervals.clear(_);
    this.callbacks.clear(_);
  }
}

// Real-time manager that handles both WebSocket and fallback polling
export class RealTimeManager {
  private static instance: RealTimeManager;
  private websocket: CommunityWebSocket;
  private fallbackPoller: FallbackPoller;
  private useWebSocket = true;
  private subscriptions = new Map<string, (_) => void>(_);

  static getInstance(_): RealTimeManager {
    if (!RealTimeManager.instance) {
      RealTimeManager.instance = new RealTimeManager(_);
    }
    return RealTimeManager.instance;
  }

  constructor(_) {
    this.websocket = CommunityWebSocket.getInstance(_);
    this.fallbackPoller = new FallbackPoller(_);
    
    // Monitor WebSocket connection and switch to polling if needed
    this.websocket.subscribe( 'connection', (data) => {
      if (_data.status === 'disconnected') {
        console.log('WebSocket disconnected, switching to polling');
        this.useWebSocket = false;
        this.switchToPolling(_);
      } else if (_data.status === 'connected') {
        console.log('WebSocket connected, switching from polling');
        this.useWebSocket = true;
        this.switchFromPolling(_);
      }
    });
  }

  subscribe( channel: string, callback: (data: any) => void): (_) => void {
    if (_this.useWebSocket && this.websocket.isConnected()) {
      const unsubscribe = this.websocket.subscribe( channel, callback);
      this.subscriptions.set( channel, unsubscribe);
      return unsubscribe;
    } else {
      const unsubscribe = this.fallbackPoller.subscribe( channel, callback);
      this.subscriptions.set( channel, unsubscribe);
      return unsubscribe;
    }
  }

  private switchToPolling(_): void {
    // Re-subscribe all channels to polling
    this.subscriptions.forEach( (unsubscribe, _channel) => {
      unsubscribe(_);
      // Note: We'd need to store the original callbacks to re-subscribe
      // This is a simplified implementation
    });
  }

  private switchFromPolling(_): void {
    // Re-subscribe all channels to WebSocket
    this.subscriptions.forEach( (unsubscribe, _channel) => {
      unsubscribe(_);
      // Note: We'd need to store the original callbacks to re-subscribe
      // This is a simplified implementation
    });
  }

  isConnected(_): boolean {
    return this.useWebSocket ? this.websocket.isConnected(_) : true;
  }

  getConnectionType(_): 'websocket' | 'polling' {
    return this.useWebSocket ? 'websocket' : 'polling';
  }

  getLatency(_): number {
    return this.useWebSocket ? this.websocket.getLatency(_) : -1;
  }
}

// Export singleton instance
export const realTimeManager = RealTimeManager.getInstance(_);
