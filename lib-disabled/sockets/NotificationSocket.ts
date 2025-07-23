/**
 * Notification Socket Hook
 * 
 * Provides WebSocket-based real-time notifications and collaboration features
 */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface NotificationSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

interface CollaborationEvent {
  type: string;
  data: any;
  userId?: string;
  roomId?: string;
}

export function useNotificationSocket(options: NotificationSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl = options.url || process.env.NEXT_PUBLIC_SOCKET_URL || '';
    
    if (!socketUrl) {
      console.warn('No socket URL provided');
      return;
    }

    const socket = io(socketUrl, {
      autoConnect: options.autoConnect ?? true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    socket.on('notification', (data: any) => {
      setLastMessage(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [options.url, options.autoConnect]);

  const sendNotification = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('notification', { event, data });
    }
  }, []);

  const sendNotificationToRoom = useCallback((roomId: string, event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('room-notification', { roomId, event, data });
    }
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-room', { roomId });
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-room', { roomId });
    }
  }, []);

  const sendCollaborationEvent = useCallback((type: string, data: any) => {
    if (socketRef.current?.connected) {
      const event: CollaborationEvent = {
        type,
        data,
        userId: data.userId,
        roomId: data.roomId,
      };
      socketRef.current.emit('collaboration-event', event);
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    sendNotification,
    sendNotificationToRoom,
    joinRoom,
    leaveRoom,
    sendCollaborationEvent,
    socket: socketRef.current,
  };
}