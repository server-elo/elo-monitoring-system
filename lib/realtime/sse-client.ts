/**
 * Server-Sent Events Client
 * Lightweight alternative to WebSocket for real-time updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/monitoring/simple-logger';

interface SSEMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface UseSSEReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (type: string, data: any) => Promise<void>;
}

export function useSSE(endpoint = '/api/sse'): UseSSEReturn {
  const { data: session } = useSession();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map());

  const connect = useCallback(() => {
    if (!session?.user || eventSourceRef.current) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Create EventSource with authentication
      const url = new URL(endpoint, window.location.origin);
      if (session.user.id) {
        url.searchParams.set('userId', session.user.id);
      }

      eventSourceRef.current = new EventSource(url.toString());

      eventSourceRef.current.onopen = () => {
        logger.info('SSE connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          const handler = messageHandlers.current.get(message.type);
          if (handler) {
            handler(message.data);
          }
        } catch (err) {
          logger.error('Failed to parse SSE message', err as Error);
        }
      };

      eventSourceRef.current.onerror = (event) => {
        logger.error('SSE error', event as Error);
        setError('Connection error');
        setIsConnected(false);
        setIsConnecting(false);
        
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            connect();
          }
        }, 5000);
      };

    } catch (err) {
      logger.error('Failed to create SSE connection', err as Error);
      setError('Failed to connect');
      setIsConnecting(false);
    }
  }, [session, endpoint]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (type: string, data: any): Promise<void> => {
    if (!session?.user) throw new Error('Not authenticated');

    try {
      const response = await fetch('/api/sse/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }
    } catch (err) {
      logger.error('Failed to send SSE message', err as Error);
      throw err;
    }
  }, [session]);

  // Subscribe to message types
  const on = useCallback((type: string, handler: (data: any) => void) => {
    messageHandlers.current.set(type, handler);
  }, []);

  const off = useCallback((type: string) => {
    messageHandlers.current.delete(type);
  }, []);

  // Auto-connect when session is available
  useEffect(() => {
    if (session?.user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [session, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage,
    // Expose subscription methods
    on: on as any,
    off: off as any,
  };
}

// Higher-level hooks for specific features
export function useRealtimeCollaboration(sessionId: string) {
  const sse = useSSE('/api/sse/collaboration');
  const [participants, setParticipants] = useState<any[]>([]);
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!sse.isConnected) return;

    sse.on('userJoined', (data: any) => {
      if (data.sessionId === sessionId) {
        setParticipants(prev => [...prev.filter(p => p.id !== data.user.id), data.user]);
      }
    });

    sse.on('userLeft', (data: any) => {
      if (data.sessionId === sessionId) {
        setParticipants(prev => prev.filter(p => p.id !== data.userId));
      }
    });

    sse.on('codeUpdate', (data: any) => {
      if (data.sessionId === sessionId) {
        setCode(data.code);
      }
    });

    return () => {
      sse.off('userJoined');
      sse.off('userLeft');
      sse.off('codeUpdate');
    };
  }, [sse, sessionId]);

  const updateCode = useCallback(async (newCode: string) => {
    await sse.sendMessage('updateCode', { sessionId, code: newCode });
  }, [sse, sessionId]);

  const joinSession = useCallback(async () => {
    await sse.sendMessage('joinSession', { sessionId });
  }, [sse, sessionId]);

  const leaveSession = useCallback(async () => {
    await sse.sendMessage('leaveSession', { sessionId });
  }, [sse, sessionId]);

  return {
    isConnected: sse.isConnected,
    participants,
    code,
    updateCode,
    joinSession,
    leaveSession,
  };
}

export function useRealtimeChat(channelId?: string) {
  const sse = useSSE('/api/sse/chat');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!sse.isConnected) return;

    sse.on('message', (data: any) => {
      if (!channelId || data.channelId === channelId) {
        setMessages(prev => [...prev, data]);
      }
    });

    return () => {
      sse.off('message');
    };
  }, [sse, channelId]);

  const sendMessage = useCallback(async (content: string, type = 'text') => {
    await sse.sendMessage('sendMessage', { 
      channelId, 
      content, 
      type 
    });
  }, [sse, channelId]);

  return {
    isConnected: sse.isConnected,
    messages,
    sendMessage,
  };
}