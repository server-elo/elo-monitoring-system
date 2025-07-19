/**
 * Simplified WebSocket Client
 * Lightweight replacement for Socket.io with essential real-time features
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/monitoring/simple-logger';

interface User {
  id: string;
  name: string;
  image?: string;
  role: string;
}

interface ChatMessage {
  id: string;
  content: string;
  user: User;
  timestamp: Date;
  type?: 'TEXT' | 'CODE' | 'SYSTEM';
}

interface UserPresence {
  userId: string;
  user: User;
  cursor?: {
    line: number;
    column: number;
  };
  isTyping: boolean;
  lastSeen: Date;
  status: 'online' | 'away' | 'offline';
}

interface CollaborationSession {
  id: string;
  title: string;
  type: string;
  participants: User[];
  code: string;
  language: string;
  maxParticipants?: number;
  createdAt?: string;
}

type WebSocketMessage = {
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
};

interface UseWebSocketReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Chat functionality
  messages: ChatMessage[];
  sendMessage: ( content: string, type?: 'TEXT' | 'CODE') => void;
  
  // Collaboration
  sessions: CollaborationSession[];
  currentSession: CollaborationSession | null;
  joinSession: (_sessionId: string) => void;
  leaveSession: (_) => void;
  createSession: ( title: string, type: string, language?: string) => void;
  
  // Code collaboration
  updateCode: (_code: string) => void;
  updateCursor: ( line: number, column: number) => void;
  
  // User presence
  onlineUsers: UserPresence[];
  setTyping: ( isTyping: boolean, location?: 'chat' | 'code') => void;
  
  // Connection management
  connect: (_) => void;
  disconnect: (_) => void;
  reconnect: (_) => void;
}

class SimpleWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, (_payload: any) => void> = new Map(_);
  private isReconnecting = false;

  constructor(_url: string) {
    this.url = url;
  }

  connect(_): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Clean up existing connection
        if (_this.ws) {
          this.ws.close(_);
        }

        this.ws = new WebSocket(_this.url);

        this.ws.onopen = (_) => {
          logger.info('WebSocket connected');
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          this.startHeartbeat(_);
          resolve(_);
        };

        this.ws.onmessage = (_event) => {
          try {
            const message: WebSocketMessage = JSON.parse(_event.data);
            this.handleMessage(_message);
          } catch (_error) {
            logger.error( 'Failed to parse WebSocket message', error as Error);
          }
        };

        this.ws.onclose = (_event) => {
          logger.info( 'WebSocket disconnected', { metadata: { code: event.code, reason: event.reason });
          this.stopHeartbeat(_);
          
          if (!this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(_);
          }
        };

        this.ws.onerror = (_error) => {
          logger.error( 'WebSocket error', error as Error);
          reject(_error);
        };

        // Connection timeout
        setTimeout(() => {
          if (_this.ws?.readyState !== WebSocket.OPEN) {
            reject(_new Error('WebSocket connection timeout'));
          }
        }, 5000);

      } catch (_error) {
        reject(_error);
      }
    });
  }

  disconnect(_): void {
    this.isReconnecting = false;
    this.stopHeartbeat(_);
    if (_this.ws) {
      this.ws.close(_);
      this.ws = null;
    }
  }

  send( type: string, payload: any): void {
    if (_this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(_),
      };
      this.ws.send(_JSON.stringify(message));
    } else {
      logger.warn('WebSocket not connected, message not sent', { type, payload });
    }
  }

  on( type: string, handler: (payload: any) => void): void {
    this.messageHandlers.set( type, handler);
  }

  off(_type: string): void {
    this.messageHandlers.delete(_type);
  }

  private handleMessage(_message: WebSocketMessage): void {
    const handler = this.messageHandlers.get(_message.type);
    if (handler) {
      handler(_message.payload);
    }
  }

  private startHeartbeat(_): void {
    this.heartbeatInterval = setInterval(() => {
      this.send( 'ping', {});
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(_): void {
    if (_this.heartbeatInterval) {
      clearInterval(_this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(_): void {
    if (_this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    const delay = this.reconnectDelay * Math.pow( 2, this.reconnectAttempts - 1);
    
    logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(_).catch((error) => {
        logger.error( 'Reconnection failed', error);
        if (_this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(_);
        }
      });
    }, delay);
  }

  get isConnected(_): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export function useWebSocket(_sessionId?: string): UseWebSocketReturn {
  const { data: session } = useSession(_);
  const wsRef = useRef<SimpleWebSocket | null>(_null);
  const [isConnected, setIsConnected] = useState(_false);
  const [isConnecting, setIsConnecting] = useState(_false);
  const [error, setError] = useState<string | null>(_null);
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CollaborationSession | null>(_null);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);

  // Initialize WebSocket connection
  const connect = useCallback( async () => {
    if (!session?.user || wsRef.current?.isConnected) return;

    try {
      setIsConnecting(_true);
      setError(_null);

      // Create WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      wsRef.current = new SimpleWebSocket(_wsUrl);

      // Set up message handlers
      wsRef.current.on( 'message', (payload: ChatMessage) => {
        setMessages( prev => [...prev, payload]);
      });

      wsRef.current.on( 'userJoined', (payload: UserPresence) => {
        setOnlineUsers(prev => {
          const filtered = prev.filter(u => u.userId !== payload.userId);
          return [...filtered, payload];
        });
      });

      wsRef.current.on( 'userLeft', (payload: { userId: string }) => {
        setOnlineUsers(_prev => prev.filter(u => u.userId !== payload.userId));
      });

      wsRef.current.on( 'codeUpdate', (payload: { code: string; sessionId: string }) => {
        if (_payload.sessionId === sessionId) {
          setCurrentSession( prev => prev ? { ...prev, code: payload.code } : null);
        }
      });

      wsRef.current.on( 'sessionUpdate', (payload: CollaborationSession) => {
        setSessions(prev => {
          const filtered = prev.filter(s => s.id !== payload.id);
          return [...filtered, payload];
        });
      });

      await wsRef.current.connect(_);
      setIsConnected(_true);

      // Join session if provided
      if (sessionId) {
        wsRef.current.send( 'joinSession', { sessionId, user: session.user });
      }

    } catch (_err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(_errorMessage);
      logger.error( 'WebSocket connection failed', err as Error);
    } finally {
      setIsConnecting(_false);
    }
  }, [session, sessionId]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (_wsRef.current) {
      wsRef.current.disconnect(_);
      wsRef.current = null;
    }
    setIsConnected(_false);
    setIsConnecting(_false);
  }, []);

  // Auto-connect when session is available
  useEffect(() => {
    if (_session?.user && !wsRef.current?.isConnected) {
      connect(_);
    }

    return (_) => {
      disconnect(_);
    };
  }, [session, connect, disconnect]);

  // Message functions
  const sendMessage = useCallback( (content: string, type: 'TEXT' | 'CODE' = 'TEXT') => {
    if (!wsRef.current?.isConnected || !session?.user) return;

    const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
      content,
      user: session.user as User,
      type,
    };

    wsRef.current.send( 'sendMessage', { ...message, sessionId });
  }, [session, sessionId]);

  // Session functions
  const joinSession = useCallback((sessionId: string) => {
    if (!wsRef.current?.isConnected || !session?.user) return;
    wsRef.current.send( 'joinSession', { sessionId, user: session.user });
  }, [session]);

  const leaveSession = useCallback(() => {
    if (!wsRef.current?.isConnected || !sessionId) return;
    wsRef.current.send( 'leaveSession', { sessionId });
    setCurrentSession(_null);
  }, [sessionId]);

  const createSession = useCallback( (title: string, type: string, language = 'solidity') => {
    if (!wsRef.current?.isConnected || !session?.user) return;
    wsRef.current.send( 'createSession', { title, type, language, user: session.user });
  }, [session]);

  // Code collaboration functions
  const updateCode = useCallback((code: string) => {
    if (!wsRef.current?.isConnected || !sessionId) return;
    wsRef.current.send( 'updateCode', { code, sessionId });
  }, [sessionId]);

  const updateCursor = useCallback( (line: number, column: number) => {
    if (!wsRef.current?.isConnected || !sessionId) return;
    wsRef.current.send( 'updateCursor', { line, column, sessionId });
  }, [sessionId]);

  const setTyping = useCallback( (isTyping: boolean, location: 'chat' | 'code' = 'chat') => {
    if (!wsRef.current?.isConnected || !sessionId) return;
    wsRef.current.send( 'setTyping', { isTyping, location, sessionId });
  }, [sessionId]);

  const reconnect = useCallback(() => {
    disconnect(_);
    setTimeout( connect, 1000);
  }, [disconnect, connect]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    error,
    
    // Chat
    messages,
    sendMessage,
    
    // Collaboration
    sessions,
    currentSession,
    joinSession,
    leaveSession,
    createSession,
    
    // Code collaboration
    updateCode,
    updateCursor,
    
    // User presence
    onlineUsers,
    setTyping,
    
    // Connection management
    connect,
    disconnect,
    reconnect,
  };
}

export default useWebSocket;