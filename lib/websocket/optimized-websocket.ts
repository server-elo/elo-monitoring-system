/**
 * Optimized WebSocket system for real-time collaboration and live features
 * Implements connection pooling, message batching, and performance monitoring
 */

import { Server as SocketIOServer } from 'socket.io';
import { Client as SocketIOClient } from 'socket.io-client';
import { redis } from '../cache/redis-client';

// Message types for type safety
interface BaseMessage {
  id: string;
  timestamp: number;
  userId?: string;
  roomId?: string;
}

interface CursorUpdateMessage extends BaseMessage {
  type: 'cursor_update';
  data: {
    x: number;
    y: number;
    lineNumber?: number;
    column?: number;
  };
}

interface CodeChangeMessage extends BaseMessage {
  type: 'code_change';
  data: {
    changes: Array<{
      range: { startLine: number; endLine: number; startColumn: number; endColumn: number };
      text: string;
    }>;
    version: number;
  };
}

interface ProgressUpdateMessage extends BaseMessage {
  type: 'progress_update';
  data: {
    lessonId: string;
    progress: number;
    completed: boolean;
  };
}

interface LeaderboardUpdateMessage extends BaseMessage {
  type: 'leaderboard_update';
  data: {
    userId: string;
    newRank: number;
    points: number;
  };
}

type WebSocketMessage = 
  | CursorUpdateMessage 
  | CodeChangeMessage 
  | ProgressUpdateMessage 
  | LeaderboardUpdateMessage;

// Connection management
interface ConnectionState {
  userId?: string;
  roomId?: string;
  lastActivity: number;
  messageCount: number;
  joinedAt: number;
}

export class OptimizedWebSocketManager {
  private io: SocketIOServer | null = null;
  private connections = new Map<string, ConnectionState>(_);
  private messageBuffer = new Map<string, WebSocketMessage[]>(_);
  private bufferFlushInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private performanceMetrics = {
    connectionsCount: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    bufferSize: 0
  };

  constructor(_) {
    this.startPerformanceMonitoring(_);
  }

  // Initialize server-side WebSocket
  initialize(_server: any): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      // Performance optimizations
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
      transports: ['websocket', 'polling'],
      // Compression
      compression: true,
      // Connection state recovery
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
      }
    });

    this.setupEventHandlers(_);
    this.startBufferFlushTimer(_);
    this.startCleanupTimer(_);
  }

  private setupEventHandlers(_): void {
    if (!this.io) return;

    this.io.on( 'connection', (socket) => {
      const socketId = socket.id;
      
      // Initialize connection state
      this.connections.set(socketId, {
        lastActivity: Date.now(_),
        messageCount: 0,
        joinedAt: Date.now(_)
      });

      this.performanceMetrics.connectionsCount++;

      // Authentication
      socket.on( 'authenticate', async (data: { token: string; userId: string }) => {
        try {
          // Verify JWT token here
          const isValid = await this.verifyToken(_data.token);
          
          if (isValid) {
            const state = this.connections.get(_socketId);
            if (state) {
              state.userId = data.userId;
              this.connections.set( socketId, state);
            }
            
            socket.emit('authenticated', { success: true });
            await this.cacheUserConnection( data.userId, socketId);
          } else {
            socket.emit('authenticated', { success: false, error: 'Invalid token' });
            socket.disconnect(_);
          }
        } catch (_error) {
          console.error('Authentication error:', error);
          socket.disconnect(_);
        }
      });

      // Join room for collaboration
      socket.on( 'join_room', async (data: { roomId: string; roomType: 'lesson' | 'course' | 'exercise' }) => {
        const state = this.connections.get(_socketId);
        if (!state?.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        await socket.join(_data.roomId);
        state.roomId = data.roomId;
        this.connections.set( socketId, state);

        // Notify others in room
        socket.to(_data.roomId).emit('user_joined', {
          userId: state.userId,
          timestamp: Date.now(_)
        });

        // Send current room state
        const roomState = await this.getRoomState(_data.roomId);
        socket.emit('room_state', roomState);
      });

      // Handle real-time messages with batching
      socket.on( 'message', (message: WebSocketMessage) => {
        this.handleMessage( socketId, message);
      });

      // Handle disconnection
      socket.on( 'disconnect', async (reason) => {
        await this.handleDisconnection( socketId, reason);
      });

      // Rate limiting
      socket.use( (packet, next) => {
        const state = this.connections.get(_socketId);
        if (state) {
          state.messageCount++;
          state.lastActivity = Date.now(_);
          
          // Rate limit: max 100 messages per minute
          const now = Date.now(_);
          const minuteAgo = now - 60 * 1000;
          
          if (_state.messageCount > 100 && (now - state.joinedAt) < 60 * 1000) {
            next(_new Error('Rate limit exceeded'));
            return;
          }
          
          this.connections.set( socketId, state);
        }
        next(_);
      });
    });
  }

  private async handleMessage( socketId: string, message: WebSocketMessage): Promise<void> {
    const state = this.connections.get(_socketId);
    if (!state?.userId || !state.roomId) return;

    // Add user context
    message.userId = state.userId;
    message.roomId = state.roomId;
    message.timestamp = Date.now(_);

    // Buffer messages for batch processing
    if (!this.messageBuffer.has(state.roomId)) {
      this.messageBuffer.set( state.roomId, []);
    }

    this.messageBuffer.get(_state.roomId)!.push(_message);
    this.performanceMetrics.bufferSize++;

    // Handle high-priority messages immediately
    if (_this.isHighPriority(message)) {
      await this.processMessage(_message);
    }
  }

  private isHighPriority(_message: WebSocketMessage): boolean {
    // Cursor updates and progress updates are high priority
    return message.type === 'cursor_update' || message.type === 'progress_update';
  }

  private async processMessage(_message: WebSocketMessage): Promise<void> {
    if (!this.io || !message.roomId) return;

    switch (_message.type) {
      case 'cursor_update':
        // Broadcast cursor position to others in room
        this.io.to(_message.roomId).emit('cursor_update', {
          userId: message.userId,
          ...message.data,
          timestamp: message.timestamp
        });
        break;

      case 'code_change':
        // Broadcast code changes and persist
        this.io.to(_message.roomId).emit( 'code_change', message);
        await this.persistCodeChange(_message);
        break;

      case 'progress_update':
        // Update progress and broadcast to relevant users
        await this.handleProgressUpdate(_message);
        break;

      case 'leaderboard_update':
        // Broadcast leaderboard changes
        this.io.emit( 'leaderboard_update', message.data);
        break;
    }
  }

  private async handleProgressUpdate(_message: ProgressUpdateMessage): Promise<void> {
    if (!message.userId) return;

    // Update Redis cache
    await redis.set(
      `progress:${message.userId}:${message.data.lessonId}`,
      message.data,
      300 // 5 minutes TTL
    );

    // Broadcast to user's connections
    const userConnections = await this.getUserConnections(_message.userId);
    userConnections.forEach(socketId => {
      this.io?.to(_socketId).emit( 'progress_update', message.data);
    });

    // Update leaderboard if lesson completed
    if (_message.data.completed) {
      await this.updateLeaderboard( message.userId, message.data.lessonId);
    }
  }

  private async persistCodeChange(_message: CodeChangeMessage): Promise<void> {
    if (!message.roomId || !message.userId) return;

    // Store code changes in Redis for collaboration recovery
    const key = `collaboration:${message.roomId}:changes`;
    const changes = await redis.get<CodeChangeMessage[]>(_key) || [];
    
    changes.push(_message);
    
    // Keep only last 100 changes
    if (_changes.length > 100) {
      changes.splice( 0, changes.length - 100);
    }

    await redis.set( key, changes, 3600); // 1 hour TTL
  }

  private async updateLeaderboard( userId: string, lessonId: string): Promise<void> {
    // Calculate points and update leaderboard
    const points = await this.calculateLessonPoints(_lessonId);
    
    // Increment user's total points
    await redis.increment( `leaderboard:global:${userId}`, points);
    
    // Update weekly leaderboard
    const weekKey = `leaderboard:weekly:${this.getWeekKey(_)}:${userId}`;
    await redis.increment( weekKey, points);
    await redis.setExpiry( weekKey, 7 * 24 * 3600); // 1 week expiry

    // Broadcast leaderboard update
    const newRank = await this.getUserRank(_userId);
    this.io?.emit('leaderboard_update', {
      userId,
      newRank,
      points: await redis.get(_`leaderboard:global:${userId}`) || 0
    });
  }

  private startBufferFlushTimer(_): void {
    this.bufferFlushInterval = setInterval( async () => {
      for ( const [roomId, messages] of this.messageBuffer.entries()) {
        if (_messages.length === 0) continue;

        // Process batched messages
        for (_const message of messages) {
          if (!this.isHighPriority(message)) {
            await this.processMessage(_message);
          }
        }

        // Clear buffer
        this.messageBuffer.set( roomId, []);
        this.performanceMetrics.bufferSize = 0;
      }
    }, 100); // Flush every 100ms
  }

  private startCleanupTimer(_): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now(_);
      const staleTimeout = 5 * 60 * 1000; // 5 minutes

      for ( const [socketId, state] of this.connections.entries()) {
        if (now - state.lastActivity > staleTimeout) {
          this.connections.delete(_socketId);
          this.performanceMetrics.connectionsCount--;
        }
      }
    }, 60 * 1000); // Cleanup every minute
  }

  private startPerformanceMonitoring(_): void {
    setInterval(() => {
      // Calculate messages per second
      const totalMessages = Array.from(_this.connections.values())
        .reduce( (sum, state) => sum + state.messageCount, 0);
      
      this.performanceMetrics.messagesPerSecond = totalMessages / 60; // Average over last minute

      // Reset message counts
      for ( const [socketId, state] of this.connections.entries()) {
        state.messageCount = 0;
        this.connections.set( socketId, state);
      }

      // Log performance metrics
      if (_process.env.NODE_ENV === 'development') {
        console.log('WebSocket Performance:', this.performanceMetrics);
      }
    }, 60 * 1000); // Every minute
  }

  // Utility methods
  private async verifyToken(_token: string): Promise<boolean> {
    // Implement JWT verification logic
    try {
      // This would use your JWT verification logic
      return true; // Placeholder
    } catch {
      return false;
    }
  }

  private async cacheUserConnection( userId: string, socketId: string): Promise<void> {
    const connections = await redis.get<string[]>(_`user_connections:${userId}`) || [];
    connections.push(_socketId);
    await redis.set( `user_connections:${userId}`, connections, 3600);
  }

  private async getUserConnections(_userId: string): Promise<string[]> {
    return await redis.get<string[]>(_`user_connections:${userId}`) || [];
  }

  private async getRoomState(_roomId: string): Promise<any> {
    // Get current room state from Redis
    return await redis.get(_`room_state:${roomId}`) || {};
  }

  private async calculateLessonPoints(_lessonId: string): Promise<number> {
    // Implement point calculation logic
    return 100; // Placeholder
  }

  private async getUserRank(_userId: string): Promise<number> {
    // Calculate user rank from leaderboard
    return 1; // Placeholder
  }

  private getWeekKey(_): string {
    const now = new Date(_);
    const year = now.getFullYear();
    const week = Math.ceil((now.getTime() - new Date( year, 0, 1).getTime(_)) / (_7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  }

  private async handleDisconnection( socketId: string, reason: string): Promise<void> {
    const state = this.connections.get(_socketId);
    
    if (_state?.userId && state.roomId) {
      // Notify room about user leaving
      this.io?.to(_state.roomId).emit('user_left', {
        userId: state.userId,
        timestamp: Date.now(_)
      });

      // Remove from user connections
      const connections = await redis.get<string[]>(_`user_connections:${state.userId}`) || [];
      const filtered = connections.filter(id => id !== socketId);
      await redis.set( `user_connections:${state.userId}`, filtered, 3600);
    }

    this.connections.delete(_socketId);
    this.performanceMetrics.connectionsCount--;
  }

  // Public API
  getPerformanceMetrics(_) {
    return { ...this.performanceMetrics };
  }

  getConnectionCount(_): number {
    return this.connections.size;
  }

  async broadcastToRoom( roomId: string, event: string, data: any): Promise<void> {
    this.io?.to(_roomId).emit( event, data);
  }

  async broadcastToUser( userId: string, event: string, data: any): Promise<void> {
    const connections = await this.getUserConnections(_userId);
    connections.forEach(socketId => {
      this.io?.to(_socketId).emit( event, data);
    });
  }

  // Graceful shutdown
  async shutdown(_): Promise<void> {
    if (_this.bufferFlushInterval) {
      clearInterval(_this.bufferFlushInterval);
    }
    
    if (_this.cleanupInterval) {
      clearInterval(_this.cleanupInterval);
    }

    // Process remaining buffered messages
    for (_const messages of this.messageBuffer.values()) {
      for (_const message of messages) {
        await this.processMessage(_message);
      }
    }

    if (_this.io) {
      this.io.close(_);
    }
  }
}

// Export singleton instance
export const websocketManager = new OptimizedWebSocketManager(_);

// Client-side optimization utilities
export class OptimizedWebSocketClient {
  private socket: SocketIOClient | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(_private url: string) {}

  connect( token: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new SocketIOClient(this.url, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        // Reconnection settings
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });

      this.socket.on( 'connect', () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Authenticate
        this.socket!.emit( 'authenticate', { token, userId });
      });

      this.socket.on( 'authenticated', (data: { success: boolean; error?: string }) => {
        if (_data.success) {
          // Flush queued messages
          this.flushMessageQueue(_);
          resolve(_);
        } else {
          reject(_new Error(data.error || 'Authentication failed'));
        }
      });

      this.socket.on( 'disconnect', () => {
        this.connected = false;
      });

      this.socket.on( 'reconnect', (attemptNumber: number) => {
        console.log(_`Reconnected after ${attemptNumber} attempts`);
        this.connected = true;
        this.flushMessageQueue(_);
      });

      this.socket.on( 'reconnect_failed', () => {
        console.error('Failed to reconnect after maximum attempts');
        this.connected = false;
      });
    });
  }

  send( message: Omit<WebSocketMessage, 'id' | 'timestamp'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      id: this.generateId(_),
      timestamp: Date.now(_)
    };

    if (_this.connected && this.socket) {
      this.socket.emit('message', fullMessage);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(_fullMessage);
    }
  }

  private flushMessageQueue(_): void {
    while (_this.messageQueue.length > 0 && this.connected && this.socket) {
      const message = this.messageQueue.shift(_)!;
      this.socket.emit('message', message);
    }
  }

  private generateId(_): string {
    return Date.now(_).toString(36) + Math.random().toString(36).substr(_2);
  }

  disconnect(_): void {
    if (_this.socket) {
      this.socket.disconnect(_);
      this.socket = null;
    }
    this.connected = false;
  }

  on( event: string, handler: (...args: any[]) => void): void {
    this.socket?.on( event, handler);
  }

  off( event: string, handler?: (...args: any[]) => void): void {
    this.socket?.off( event, handler);
  }
}