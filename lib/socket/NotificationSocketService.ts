'use client';

import { Socket } from 'socket.io-client';
import { NotificationType, Notification } from '@/components/ui/NotificationSystem';

export interface SocketNotificationEvent {
  type: 'notification';
  data: {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    userId?: string;
    roomId?: string;
    metadata?: any;
    timestamp: number;
  };
}

export interface SocketCollaborationEvent {
  type: 'collaboration';
  action: 'user_joined' | 'user_left' | 'code_changed' | 'cursor_moved' | 'chat_message';
  data: {
    userId: string;
    userName: string;
    roomId: string;
    timestamp: number;
    metadata?: any;
  };
}

export interface SocketGamificationEvent {
  type: 'gamification';
  action: 'xp_gained' | 'level_up' | 'achievement_unlocked' | 'streak_updated';
  data: {
    userId: string;
    xp?: number;
    level?: number;
    achievement?: any;
    streak?: number;
    timestamp: number;
  };
}

export interface SocketSystemEvent {
  type: 'system';
  action: 'maintenance' | 'update' | 'announcement' | 'alert';
  data: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    timestamp: number;
    metadata?: any;
  };
}

export type SocketEvent = 
  | SocketNotificationEvent 
  | SocketCollaborationEvent 
  | SocketGamificationEvent 
  | SocketSystemEvent;

/**
 * Service for handling real-time notification events via Socket.io
 */
export class NotificationSocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, ((...args: any[]) => void)[]> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(socket: Socket | null) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  /**
   * Update the socket instance
   */
  updateSocket(socket: Socket | null) {
    if (this.socket) {
      this.cleanup();
    }
    this.socket = socket;
    this.setupSocketListeners();
  }

  /**
   * Set up socket event listeners
   */
  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection:established', { timestamp: Date.now() });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.emit('connection:lost', { reason, timestamp: Date.now() });
      
      // Attempt to reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.emit('connection:error', { error: error.message, timestamp: Date.now() });
      this.attemptReconnect();
    });

    // Notification events
    this.socket.on('notification:broadcast', (data: SocketNotificationEvent['data']) => {
      this.emit('notification:received', data);
    });

    this.socket.on('notification:personal', (data: SocketNotificationEvent['data']) => {
      this.emit('notification:personal', data);
    });

    // Collaboration events
    this.socket.on('collaboration:user_joined', (data: SocketCollaborationEvent['data']) => {
      this.emit('collaboration:user_joined', data);
    });

    this.socket.on('collaboration:user_left', (data: SocketCollaborationEvent['data']) => {
      this.emit('collaboration:user_left', data);
    });

    this.socket.on('collaboration:code_changed', (data: SocketCollaborationEvent['data']) => {
      this.emit('collaboration:code_changed', data);
    });

    this.socket.on('collaboration:chat_message', (data: SocketCollaborationEvent['data']) => {
      this.emit('collaboration:chat_message', data);
    });

    // Gamification events
    this.socket.on('gamification:xp_gained', (data: SocketGamificationEvent['data']) => {
      this.emit('gamification:xp_gained', data);
    });

    this.socket.on('gamification:level_up', (data: SocketGamificationEvent['data']) => {
      this.emit('gamification:level_up', data);
    });

    this.socket.on('gamification:achievement_unlocked', (data: SocketGamificationEvent['data']) => {
      this.emit('gamification:achievement_unlocked', data);
    });

    this.socket.on('gamification:streak_updated', (data: SocketGamificationEvent['data']) => {
      this.emit('gamification:streak_updated', data);
    });

    // System events
    this.socket.on('system:maintenance', (data: SocketSystemEvent['data']) => {
      this.emit('system:maintenance', data);
    });

    this.socket.on('system:update', (data: SocketSystemEvent['data']) => {
      this.emit('system:update', data);
    });

    this.socket.on('system:announcement', (data: SocketSystemEvent['data']) => {
      this.emit('system:announcement', data);
    });

    this.socket.on('system:alert', (data: SocketSystemEvent['data']) => {
      this.emit('system:alert', data);
    });
  }

  /**
   * Attempt to reconnect to the socket
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('connection:max_retries_reached', { 
        attempts: this.reconnectAttempts,
        timestamp: Date.now() 
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
        this.emit('connection:retry_attempt', { 
          attempt: this.reconnectAttempts,
          delay,
          timestamp: Date.now() 
        });
      }
    }, delay);
  }

  /**
   * Subscribe to a specific event
   */
  on(event: string, handler: (...args: any[]) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit an event to all subscribers
   */
  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in notification socket handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Send a notification to other users in a room
   */
  sendNotificationToRoom(roomId: string, notification: Partial<Notification>) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot send notification: socket not connected');
      return;
    }

    this.socket.emit('notification:send_to_room', {
      roomId,
      notification: {
        ...notification,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Send a personal notification to a specific user
   */
  sendPersonalNotification(userId: string, notification: Partial<Notification>) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot send notification: socket not connected');
      return;
    }

    this.socket.emit('notification:send_personal', {
      userId,
      notification: {
        ...notification,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Join a notification room (for receiving room-specific notifications)
   */
  joinRoom(roomId: string) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot join room: socket not connected');
      return;
    }

    this.socket.emit('notification:join_room', { roomId });
  }

  /**
   * Leave a notification room
   */
  leaveRoom(roomId: string) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot leave room: socket not connected');
      return;
    }

    this.socket.emit('notification:leave_room', { roomId });
  }

  /**
   * Send collaboration event
   */
  sendCollaborationEvent(action: SocketCollaborationEvent['action'], data: any) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot send collaboration event: socket not connected');
      return;
    }

    this.socket.emit('collaboration:event', {
      action,
      data: {
        ...data,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Send gamification event
   */
  sendGamificationEvent(action: SocketGamificationEvent['action'], data: any) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot send gamification event: socket not connected');
      return;
    }

    this.socket.emit('gamification:event', {
      action,
      data: {
        ...data,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  /**
   * Clean up event listeners
   */
  cleanup() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
    this.eventHandlers.clear();
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Destroy the service
   */
  destroy() {
    this.cleanup();
    this.socket = null;
  }
}
