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
  private connections = new Map<string, ConnectionState>();
  private messageBuffer = new Map<string, WebSocketMessage[]>();
  private bufferFlushInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private performanceMetrics = {
    connectionsCount: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    bufferSize: 0
  };

  constructor() {
    this.startPerformanceMonitoring();
  }

  // Initialize server-side WebSocket
  initialize(server: any): void {
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

    this.setupEventHandlers();
    this.startBufferFlushTimer();
    this.startCleanupTimer();
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const socketId = socket.id;
      
      // Initialize connection state
      this.connections.set(socketId, {
        lastActivity: Date.now(),
        messageCount: 0,
        joinedAt: Date.now()
      });

      this.performanceMetrics.connectionsCount++;

      // Authentication
      socket.on('authenticate', async (data: { token: string; userId: string }) => {
        try {
          // Verify JWT token here
          const isValid = await this.verifyToken(data.token);
          
          if (isValid) {
            const state = this.connections.get(socketId);
            if (state) {
              state.userId = data.userId;
              this.connections.set(socketId, state);
            }
            
            socket.emit('authenticated', { success: true });
            await this.cacheUserConnection(data.userId, socketId);
          } else {
            socket.emit('authenticated', { success: false, error: 'Invalid token' });
            socket.disconnect();
          }
        } catch (error) {
          console.error('Authentication error:', error);
          socket.disconnect();
        }
      });

      // Join room for collaboration
      socket.on('join_room', async (data: { roomId: string; roomType: 'lesson' | 'course' | 'exercise' }) => {
        const state = this.connections.get(socketId);
        if (!state?.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        await socket.join(data.roomId);
        state.roomId = data.roomId;
        this.connections.set(socketId, state);

        // Notify others in room
        socket.to(data.roomId).emit('user_joined', {
          userId: state.userId,
          timestamp: Date.now()
        });

        // Send current room state
        const roomState = await this.getRoomState(data.roomId);
        socket.emit('room_state', roomState);
      });

      // Handle real-time messages with batching
      socket.on('message', (message: WebSocketMessage) => {
        this.handleMessage(socketId, message);
      });

      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        await this.handleDisconnection(socketId, reason);
      });

      // Rate limiting
      socket.use((packet, next) => {
        const state = this.connections.get(socketId);
        if (state) {
          state.messageCount++;
          state.lastActivity = Date.now();
          
          // Rate limit: max 100 messages per minute
          const now = Date.now();
          const minuteAgo = now - 60 * 1000;
          
          if (state.messageCount > 100 && (now - state.joinedAt) < 60 * 1000) {
            next(new Error('Rate limit exceeded'));
            return;
          }
          
          this.connections.set(socketId, state);
        }
        next();
      });
    });
  }

  private async handleMessage(socketId: string, message: WebSocketMessage): Promise<void> {
    const state = this.connections.get(socketId);
    if (!state?.userId || !state.roomId) return;

    // Add user context
    message.userId = state.userId;
    message.roomId = state.roomId;
    message.timestamp = Date.now();

    // Buffer messages for batch processing
    if (!this.messageBuffer.has(state.roomId)) {
      this.messageBuffer.set(state.roomId, []);
    }

    this.messageBuffer.get(state.roomId)!.push(message);
    this.performanceMetrics.bufferSize++;

    // Handle high-priority messages immediately
    if (this.isHighPriority(message)) {
      await this.processMessage(message);
    }
  }

  private isHighPriority(message: WebSocketMessage): boolean {
    // Cursor updates and progress updates are high priority
    return message.type === 'cursor_update' || message.type === 'progress_update';
  }

  private async processMessage(message: WebSocketMessage): Promise<void> {
    if (!this.io || !message.roomId) return;

    switch (message.type) {
      case 'cursor_update':
        // Broadcast cursor position to others in room
        this.io.to(message.roomId).emit('cursor_update', {
          userId: message.userId,
          ...message.data,
          timestamp: message.timestamp
        });
        break;

      case 'code_change':
        // Broadcast code changes and persist
        this.io.to(message.roomId).emit('code_change', message);
        await this.persistCodeChange(message);
        break;

      case 'progress_update':
        // Update progress and broadcast to relevant users
        await this.handleProgressUpdate(message);
        break;

      case 'leaderboard_update':
        // Broadcast leaderboard changes
        this.io.emit('leaderboard_update', message.data);
        break;
    }
  }

  private async handleProgressUpdate(message: ProgressUpdateMessage): Promise<void> {
    if (!message.userId) return;

    // Update Redis cache
    await redis.set(
      `progress:${message.userId}:${message.data.lessonId}`,
      message.data,
      300 // 5 minutes TTL
    );

    // Broadcast to user's connections
    const userConnections = await this.getUserConnections(message.userId);
    userConnections.forEach(socketId => {
      this.io?.to(socketId).emit('progress_update', message.data);
    });

    // Update leaderboard if lesson completed
    if (message.data.completed) {
      await this.updateLeaderboard(message.userId, message.data.lessonId);
    }
  }

  private async persistCodeChange(message: CodeChangeMessage): Promise<void> {
    if (!message.roomId || !message.userId) return;

    // Store code changes in Redis for collaboration recovery
    const key = `collaboration:${message.roomId}:changes`;
    const changes = await redis.get<CodeChangeMessage[]>(key) || [];
    
    changes.push(message);
    
    // Keep only last 100 changes
    if (changes.length > 100) {
      changes.splice(0, changes.length - 100);
    }

    await redis.set(key, changes, 3600); // 1 hour TTL
  }

  private async updateLeaderboard(userId: string, lessonId: string): Promise<void> {
    // Calculate points and update leaderboard
    const points = await this.calculateLessonPoints(lessonId);
    
    // Increment user's total points
    await redis.increment(`leaderboard:global:${userId}`, points);
    
    // Update weekly leaderboard
    const weekKey = `leaderboard:weekly:${this.getWeekKey()}:${userId}`;
    await redis.increment(weekKey, points);
    await redis.setExpiry(weekKey, 7 * 24 * 3600); // 1 week expiry

    // Broadcast leaderboard update
    const newRank = await this.getUserRank(userId);
    this.io?.emit('leaderboard_update', {
      userId,
      newRank,
      points: await redis.get(`leaderboard:global:${userId}`) || 0
    });
  }

  private startBufferFlushTimer(): void {
    this.bufferFlushInterval = setInterval(async () => {
      for (const [roomId, messages] of this.messageBuffer.entries()) {
        if (messages.length === 0) continue;

        // Process batched messages
        for (const message of messages) {
          if (!this.isHighPriority(message)) {
            await this.processMessage(message);
          }
        }

        // Clear buffer
        this.messageBuffer.set(roomId, []);
        this.performanceMetrics.bufferSize = 0;
      }
    }, 100); // Flush every 100ms
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleTimeout = 5 * 60 * 1000; // 5 minutes

      for (const [socketId, state] of this.connections.entries()) {
        if (now - state.lastActivity > staleTimeout) {
          this.connections.delete(socketId);
          this.performanceMetrics.connectionsCount--;
        }
      }
    }, 60 * 1000); // Cleanup every minute
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      // Calculate messages per second
      const totalMessages = Array.from(this.connections.values())
        .reduce((sum, state) => sum + state.messageCount, 0);
      
      this.performanceMetrics.messagesPerSecond = totalMessages / 60; // Average over last minute

      // Reset message counts
      for (const [socketId, state] of this.connections.entries()) {
        state.messageCount = 0;
        this.connections.set(socketId, state);
      }

      // Log performance metrics
      if (process.env.NODE_ENV === 'development') {
        console.log('WebSocket Performance:', this.performanceMetrics);
      }
    }, 60 * 1000); // Every minute
  }

  // Utility methods
  private async verifyToken(token: string): Promise<boolean> {
    // Implement JWT verification logic
    try {
      // This would use your JWT verification logic
      return true; // Placeholder
    } catch {
      return false;
    }
  }

  private async cacheUserConnection(userId: string, socketId: string): Promise<void> {
    const connections = await redis.get<string[]>(`user_connections:${userId}`) || [];
    connections.push(socketId);
    await redis.set(`user_connections:${userId}`, connections, 3600);
  }

  private async getUserConnections(userId: string): Promise<string[]> {
    return await redis.get<string[]>(`user_connections:${userId}`) || [];
  }

  private async getRoomState(roomId: string): Promise<any> {
    // Get current room state from Redis
    return await redis.get(`room_state:${roomId}`) || {};
  }

  private async calculateLessonPoints(lessonId: string): Promise<number> {
    // Implement point calculation logic
    return 100; // Placeholder
  }

  private async getUserRank(userId: string): Promise<number> {
    // Calculate user rank from leaderboard
    return 1; // Placeholder
  }

  private getWeekKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  }

  private async handleDisconnection(socketId: string, reason: string): Promise<void> {
    const state = this.connections.get(socketId);
    
    if (state?.userId && state.roomId) {
      // Notify room about user leaving
      this.io?.to(state.roomId).emit('user_left', {
        userId: state.userId,
        timestamp: Date.now()
      });

      // Remove from user connections
      const connections = await redis.get<string[]>(`user_connections:${state.userId}`) || [];
      const filtered = connections.filter(id => id !== socketId);
      await redis.set(`user_connections:${state.userId}`, filtered, 3600);
    }

    this.connections.delete(socketId);
    this.performanceMetrics.connectionsCount--;
  }

  // Public API
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  async broadcastToRoom(roomId: string, event: string, data: any): Promise<void> {
    this.io?.to(roomId).emit(event, data);
  }

  async broadcastToUser(userId: string, event: string, data: any): Promise<void> {
    const connections = await this.getUserConnections(userId);
    connections.forEach(socketId => {
      this.io?.to(socketId).emit(event, data);
    });
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Process remaining buffered messages
    for (const messages of this.messageBuffer.values()) {
      for (const message of messages) {
        await this.processMessage(message);
      }
    }

    if (this.io) {
      this.io.close();
    }
  }
}

// Export singleton instance
export const websocketManager = new OptimizedWebSocketManager();

// Client-side optimization utilities
export class OptimizedWebSocketClient {
  private socket: SocketIOClient | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private url: string) {}

  connect(token: string, userId: string): Promise<void> {
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

      this.socket.on('connect', () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Authenticate
        this.socket!.emit('authenticate', { token, userId });
      });

      this.socket.on('authenticated', (data: { success: boolean; error?: string }) => {
        if (data.success) {
          // Flush queued messages
          this.flushMessageQueue();
          resolve();
        } else {
          reject(new Error(data.error || 'Authentication failed'));
        }
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
      });

      this.socket.on('reconnect', (attemptNumber: number) => {
        console.log(`Reconnected after ${attemptNumber} attempts`);
        this.connected = true;
        this.flushMessageQueue();
      });

      this.socket.on('reconnect_failed', () => {
        console.error('Failed to reconnect after maximum attempts');
        this.connected = false;
      });
    });
  }

  send(message: Omit<WebSocketMessage, 'id' | 'timestamp'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      id: this.generateId(),
      timestamp: Date.now()
    };

    if (this.connected && this.socket) {
      this.socket.emit('message', fullMessage);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(fullMessage);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.connected && this.socket) {
      const message = this.messageQueue.shift()!;
      this.socket.emit('message', message);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.socket?.on(event, handler);
  }

  off(event: string, handler?: (...args: any[]) => void): void {
    this.socket?.off(event, handler);
  }
}