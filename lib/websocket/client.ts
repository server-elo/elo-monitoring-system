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
  sendMessage: (content: string, type?: 'TEXT' | 'CODE') => void;
  
  // Collaboration
  sessions: CollaborationSession[];
  currentSession: CollaborationSession | null;
  joinSession: (sessionId: string) => void;
  leaveSession: () => void;
  createSession: (title: string, type: string, language?: string) => void;
  
  // Code collaboration
  updateCode: (code: string) => void;
  updateCursor: (line: number, column: number) => void;
  
  // User presence
  onlineUsers: UserPresence[];
  setTyping: (isTyping: boolean, location?: 'chat' | 'code') => void;
  
  // Connection management
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

class SimpleWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, (payload: any) => void> = new Map();
  private isReconnecting = false;

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Clean up existing connection
        if (this.ws) {
          this.ws.close();
        }

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          logger.info('WebSocket connected');
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            logger.error('Failed to parse WebSocket message', error as Error);
          }
        };

        this.ws.onclose = (event) => {
          logger.info('WebSocket disconnected', { code: event.code, reason: event.reason });
          this.stopHeartbeat();
          
          if (!this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          logger.error('WebSocket error', error as Error);
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isReconnecting = false;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type: string, payload: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(message));
    } else {
      logger.warn('WebSocket not connected, message not sent', { type, payload });
    }
  }

  on(type: string, handler: (payload: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  off(type: string): void {
    this.messageHandlers.delete(type);
  }

  private handleMessage(message: WebSocketMessage): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.payload);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send('ping', {});
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch((error) => {
        logger.error('Reconnection failed', error);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      });
    }, delay);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export function useWebSocket(sessionId?: string): UseWebSocketReturn {
  const { data: session } = useSession();
  const wsRef = useRef<SimpleWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CollaborationSession | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    if (!session?.user || wsRef.current?.isConnected) return;

    try {
      setIsConnecting(true);
      setError(null);

      // Create WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      wsRef.current = new SimpleWebSocket(wsUrl);

      // Set up message handlers
      wsRef.current.on('message', (payload: ChatMessage) => {
        setMessages(prev => [...prev, payload]);
      });

      wsRef.current.on('userJoined', (payload: UserPresence) => {
        setOnlineUsers(prev => {
          const filtered = prev.filter(u => u.userId !== payload.userId);
          return [...filtered, payload];
        });
      });

      wsRef.current.on('userLeft', (payload: { userId: string }) => {
        setOnlineUsers(prev => prev.filter(u => u.userId !== payload.userId));
      });

      wsRef.current.on('codeUpdate', (payload: { code: string; sessionId: string }) => {
        if (payload.sessionId === sessionId) {
          setCurrentSession(prev => prev ? { ...prev, code: payload.code } : null);
        }
      });

      wsRef.current.on('sessionUpdate', (payload: CollaborationSession) => {
        setSessions(prev => {
          const filtered = prev.filter(s => s.id !== payload.id);
          return [...filtered, payload];
        });
      });

      await wsRef.current.connect();
      setIsConnected(true);

      // Join session if provided
      if (sessionId) {
        wsRef.current.send('joinSession', { sessionId, user: session.user });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      logger.error('WebSocket connection failed', err as Error);
    } finally {
      setIsConnecting(false);
    }
  }, [session, sessionId]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Auto-connect when session is available
  useEffect(() => {
    if (session?.user && !wsRef.current?.isConnected) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [session, connect, disconnect]);

  // Message functions
  const sendMessage = useCallback((content: string, type: 'TEXT' | 'CODE' = 'TEXT') => {
    if (!wsRef.current?.isConnected || !session?.user) return;

    const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
      content,
      user: session.user as User,
      type,
    };

    wsRef.current.send('sendMessage', { ...message, sessionId });
  }, [session, sessionId]);

  // Session functions
  const joinSession = useCallback((sessionId: string) => {
    if (!wsRef.current?.isConnected || !session?.user) return;
    wsRef.current.send('joinSession', { sessionId, user: session.user });
  }, [session]);

  const leaveSession = useCallback(() => {
    if (!wsRef.current?.isConnected || !sessionId) return;
    wsRef.current.send('leaveSession', { sessionId });
    setCurrentSession(null);
  }, [sessionId]);

  const createSession = useCallback((title: string, type: string, language = 'solidity') => {
    if (!wsRef.current?.isConnected || !session?.user) return;
    wsRef.current.send('createSession', { title, type, language, user: session.user });
  }, [session]);

  // Code collaboration functions
  const updateCode = useCallback((code: string) => {
    if (!wsRef.current?.isConnected || !sessionId) return;
    wsRef.current.send('updateCode', { code, sessionId });
  }, [sessionId]);

  const updateCursor = useCallback((line: number, column: number) => {
    if (!wsRef.current?.isConnected || !sessionId) return;
    wsRef.current.send('updateCursor', { line, column, sessionId });
  }, [sessionId]);

  const setTyping = useCallback((isTyping: boolean, location: 'chat' | 'code' = 'chat') => {
    if (!wsRef.current?.isConnected || !sessionId) return;
    wsRef.current.send('setTyping', { isTyping, location, sessionId });
  }, [sessionId]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
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