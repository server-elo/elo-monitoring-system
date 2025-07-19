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
  private eventHandlers: Map<string, ((...args: any[]) => void)[]> = new Map(_);
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(_socket: Socket | null) {
    this.socket = socket;
    this.setupSocketListeners(_);
  }

  /**
   * Update the socket instance
   */
  updateSocket(_socket: Socket | null) {
    if (_this.socket) {
      this.cleanup(_);
    }
    this.socket = socket;
    this.setupSocketListeners(_);
  }

  /**
   * Set up socket event listeners
   */
  private setupSocketListeners(_) {
    if (!this.socket) return;

    this.socket.on( 'connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit( 'connection:established', { timestamp: Date.now() });
    });

    this.socket.on( 'disconnect', (reason) => {
      this.isConnected = false;
      this.emit( 'connection:lost', { reason, timestamp: Date.now() });
      
      // Attempt to reconnect for certain disconnect reasons
      if (_reason === 'io server disconnect') {
        this.attemptReconnect(_);
      }
    });

    this.socket.on( 'connect_error', (error) => {
      this.emit( 'connection:error', { error: error.message, timestamp: Date.now() });
      this.attemptReconnect(_);
    });

    // Notification events
    this.socket.on( 'notification:broadcast', (data: SocketNotificationEvent['data']) => {
      this.emit( 'notification:received', data);
    });

    this.socket.on( 'notification:personal', (data: SocketNotificationEvent['data']) => {
      this.emit( 'notification:personal', data);
    });

    // Collaboration events
    this.socket.on( 'collaboration:user_joined', (data: SocketCollaborationEvent['data']) => {
      this.emit( 'collaboration:user_joined', data);
    });

    this.socket.on( 'collaboration:user_left', (data: SocketCollaborationEvent['data']) => {
      this.emit( 'collaboration:user_left', data);
    });

    this.socket.on( 'collaboration:code_changed', (data: SocketCollaborationEvent['data']) => {
      this.emit( 'collaboration:code_changed', data);
    });

    this.socket.on( 'collaboration:chat_message', (data: SocketCollaborationEvent['data']) => {
      this.emit( 'collaboration:chat_message', data);
    });

    // Gamification events
    this.socket.on( 'gamification:xp_gained', (data: SocketGamificationEvent['data']) => {
      this.emit( 'gamification:xp_gained', data);
    });

    this.socket.on( 'gamification:level_up', (data: SocketGamificationEvent['data']) => {
      this.emit( 'gamification:level_up', data);
    });

    this.socket.on( 'gamification:achievement_unlocked', (data: SocketGamificationEvent['data']) => {
      this.emit( 'gamification:achievement_unlocked', data);
    });

    this.socket.on( 'gamification:streak_updated', (data: SocketGamificationEvent['data']) => {
      this.emit( 'gamification:streak_updated', data);
    });

    // System events
    this.socket.on( 'system:maintenance', (data: SocketSystemEvent['data']) => {
      this.emit( 'system:maintenance', data);
    });

    this.socket.on( 'system:update', (data: SocketSystemEvent['data']) => {
      this.emit( 'system:update', data);
    });

    this.socket.on( 'system:announcement', (data: SocketSystemEvent['data']) => {
      this.emit( 'system:announcement', data);
    });

    this.socket.on( 'system:alert', (data: SocketSystemEvent['data']) => {
      this.emit( 'system:alert', data);
    });
  }

  /**
   * Attempt to reconnect to the socket
   */
  private attemptReconnect(_) {
    if (_this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('connection:max_retries_reached', { 
        attempts: this.reconnectAttempts,
        timestamp: Date.now(_) 
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow( 2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (_this.socket && !this.isConnected) {
        this.socket.connect(_);
        this.emit('connection:retry_attempt', { 
          attempt: this.reconnectAttempts,
          delay,
          timestamp: Date.now(_) 
        });
      }
    }, delay);
  }

  /**
   * Subscribe to a specific event
   */
  on( event: string, handler: (...args: any[]) => void): (_) => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set( event, []);
    }
    this.eventHandlers.get(_event)!.push(_handler);

    // Return unsubscribe function
    return (_) => {
      const handlers = this.eventHandlers.get(_event);
      if (handlers) {
        const index = handlers.indexOf(_handler);
        if (_index > -1) {
          handlers.splice( index, 1);
        }
      }
    };
  }

  /**
   * Emit an event to all subscribers
   */
  private emit( event: string, data: any) {
    const handlers = this.eventHandlers.get(_event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(_data);
        } catch (_error) {
          console.error(`Error in notification socket handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Send a notification to other users in a room
   */
  sendNotificationToRoom( roomId: string, notification: Partial<Notification>) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot send notification: socket not connected');
      return;
    }

    this.socket.emit('notification:send_to_room', {
      roomId,
      notification: {
        ...notification,
        timestamp: Date.now(_)
      }
    });
  }

  /**
   * Send a personal notification to a specific user
   */
  sendPersonalNotification( userId: string, notification: Partial<Notification>) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot send notification: socket not connected');
      return;
    }

    this.socket.emit('notification:send_personal', {
      userId,
      notification: {
        ...notification,
        timestamp: Date.now(_)
      }
    });
  }

  /**
   * Join a notification room (_for receiving room-specific notifications)
   */
  joinRoom(_roomId: string) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot join room: socket not connected');
      return;
    }

    this.socket.emit('notification:join_room', { roomId });
  }

  /**
   * Leave a notification room
   */
  leaveRoom(_roomId: string) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot leave room: socket not connected');
      return;
    }

    this.socket.emit('notification:leave_room', { roomId });
  }

  /**
   * Send collaboration event
   */
  sendCollaborationEvent( action: SocketCollaborationEvent['action'], data: any) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot send collaboration event: socket not connected');
      return;
    }

    this.socket.emit('collaboration:event', {
      action,
      data: {
        ...data,
        timestamp: Date.now(_)
      }
    });
  }

  /**
   * Send gamification event
   */
  sendGamificationEvent( action: SocketGamificationEvent['action'], data: any) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot send gamification event: socket not connected');
      return;
    }

    this.socket.emit('gamification:event', {
      action,
      data: {
        ...data,
        timestamp: Date.now(_)
      }
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(_) {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  /**
   * Clean up event listeners
   */
  cleanup(_) {
    if (_this.socket) {
      this.socket.removeAllListeners(_);
    }
    this.eventHandlers.clear(_);
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Destroy the service
   */
  destroy(_) {
    this.cleanup(_);
    this.socket = null;
  }
}
