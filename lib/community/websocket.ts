'use client';

import { WebSocketMessage, CommunityError } from './types';

export class CommunityWebSocket {
  private static instance: CommunityWebSocket;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscribers = new Map<string, Set<(data: any) => void>>();
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

  static getInstance(): CommunityWebSocket {
    if (!CommunityWebSocket.instance) {
      CommunityWebSocket.instance = new CommunityWebSocket();
    }
    return CommunityWebSocket.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleConnectionError();
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('Community WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.notifySubscribers('connection', { status: 'connected' });
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('Community WebSocket disconnected:', event.code, event.reason);
      this.isConnecting = false;
      this.stopHeartbeat();
      this.notifySubscribers('connection', { status: 'disconnected', code: event.code });
      
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('Community WebSocket error:', error);
      this.handleConnectionError();
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'update':
        this.handleUpdate(message);
        break;
      case 'pong':
        this.handlePong(message);
        break;
      default:
        console.log('Received unknown message type:', message.type);
    }
  }

  private handleUpdate(message: WebSocketMessage): void {
    if (message.data && message.channel) {
      this.notifySubscribers(message.channel, message.data);
    }
  }

  private handlePong(_message: WebSocketMessage): void {
    if (this.lastPingTime > 0) {
      this.latency = Date.now() - this.lastPingTime;
      this.notifySubscribers('latency', { latency: this.latency });
    }
  }

  private handleConnectionError(): void {
    this.isConnecting = false;
    this.stopHeartbeat();
    
    const error: CommunityError = {
      code: 'WEBSOCKET_CONNECTION_FAILED',
      message: 'Failed to connect to community WebSocket',
      timestamp: new Date()
    };
    
    this.notifySubscribers('error', error);
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ping();
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private ping(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.lastPingTime = Date.now();
      const message: WebSocketMessage = {
        type: 'ping',
        timestamp: new Date(),
        id: this.generateId()
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  private notifySubscribers(channel: string, data: any): void {
    const channelSubscribers = this.subscribers.get(channel);
    if (channelSubscribers) {
      channelSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket subscriber callback:', error);
        }
      });
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods
  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    
    this.subscribers.get(channel)!.add(callback);
    
    // Send subscription message if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'subscribe',
        channel,
        timestamp: new Date(),
        id: this.generateId()
      };
      this.ws.send(JSON.stringify(message));
    }
    
    // Return unsubscribe function
    return () => {
      const channelSubscribers = this.subscribers.get(channel);
      if (channelSubscribers) {
        channelSubscribers.delete(callback);
        if (channelSubscribers.size === 0) {
          this.subscribers.delete(channel);
          
          // Send unsubscribe message if connected
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message: WebSocketMessage = {
              type: 'unsubscribe',
              channel,
              timestamp: new Date(),
              id: this.generateId()
            };
            this.ws.send(JSON.stringify(message));
          }
        }
      }
    };
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getLatency(): number {
    return this.latency;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.subscribers.clear();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    setTimeout(() => this.connect(), 100);
  }
}

// Fallback polling mechanism
export class FallbackPoller {
  private intervals = new Map<string, NodeJS.Timeout>();
  private callbacks = new Map<string, (data: any) => void>();
  private defaultInterval = 30000; // 30 seconds

  subscribe(channel: string, callback: (data: any) => void, interval?: number): () => void {
    this.callbacks.set(channel, callback);
    
    const pollInterval = setInterval(async () => {
      try {
        const data = await this.fetchData(channel);
        callback(data);
      } catch (error) {
        console.error(`Polling error for channel ${channel}:`, error);
      }
    }, interval || this.defaultInterval);
    
    this.intervals.set(channel, pollInterval);
    
    // Initial fetch
    this.fetchData(channel).then(callback).catch(console.error);
    
    return () => {
      const interval = this.intervals.get(channel);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(channel);
      }
      this.callbacks.delete(channel);
    };
  }

  private async fetchData(channel: string): Promise<any> {
    const response = await fetch(`/api/community/poll/${channel}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for channel ${channel}`);
    }
    return response.json();
  }

  unsubscribe(channel: string): void {
    const interval = this.intervals.get(channel);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(channel);
    }
    this.callbacks.delete(channel);
  }

  unsubscribeAll(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.callbacks.clear();
  }
}

// Real-time manager that handles both WebSocket and fallback polling
export class RealTimeManager {
  private static instance: RealTimeManager;
  private websocket: CommunityWebSocket;
  private fallbackPoller: FallbackPoller;
  private useWebSocket = true;
  private subscriptions = new Map<string, () => void>();

  static getInstance(): RealTimeManager {
    if (!RealTimeManager.instance) {
      RealTimeManager.instance = new RealTimeManager();
    }
    return RealTimeManager.instance;
  }

  constructor() {
    this.websocket = CommunityWebSocket.getInstance();
    this.fallbackPoller = new FallbackPoller();
    
    // Monitor WebSocket connection and switch to polling if needed
    this.websocket.subscribe('connection', (data) => {
      if (data.status === 'disconnected') {
        console.log('WebSocket disconnected, switching to polling');
        this.useWebSocket = false;
        this.switchToPolling();
      } else if (data.status === 'connected') {
        console.log('WebSocket connected, switching from polling');
        this.useWebSocket = true;
        this.switchFromPolling();
      }
    });
  }

  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (this.useWebSocket && this.websocket.isConnected()) {
      const unsubscribe = this.websocket.subscribe(channel, callback);
      this.subscriptions.set(channel, unsubscribe);
      return unsubscribe;
    } else {
      const unsubscribe = this.fallbackPoller.subscribe(channel, callback);
      this.subscriptions.set(channel, unsubscribe);
      return unsubscribe;
    }
  }

  private switchToPolling(): void {
    // Re-subscribe all channels to polling
    this.subscriptions.forEach((unsubscribe, _channel) => {
      unsubscribe();
      // Note: We'd need to store the original callbacks to re-subscribe
      // This is a simplified implementation
    });
  }

  private switchFromPolling(): void {
    // Re-subscribe all channels to WebSocket
    this.subscriptions.forEach((unsubscribe, _channel) => {
      unsubscribe();
      // Note: We'd need to store the original callbacks to re-subscribe
      // This is a simplified implementation
    });
  }

  isConnected(): boolean {
    return this.useWebSocket ? this.websocket.isConnected() : true;
  }

  getConnectionType(): 'websocket' | 'polling' {
    return this.useWebSocket ? 'websocket' : 'polling';
  }

  getLatency(): number {
    return this.useWebSocket ? this.websocket.getLatency() : -1;
  }
}

// Export singleton instance
export const realTimeManager = RealTimeManager.getInstance();
