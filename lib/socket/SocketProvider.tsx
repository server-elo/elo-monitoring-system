'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: any) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinRoom: () => {},
  leaveRoom: () => {},
  sendMessage: () => {},
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only connect if user is authenticated
    if (status === 'loading' || !session?.user) {
      return;
    }

    if (typeof window !== 'undefined') {
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        auth: {
          userId: session.user.id || session.user.email,
          userName: session.user.name || 'Anonymous',
          token: session.user.email, // Use proper JWT token in production
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      });

      socketInstance.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsConnected(false);
      });

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [session, status]);

  const joinRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('join-room', roomId);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-room', roomId);
    }
  };

  const sendMessage = (roomId: string, message: any) => {
    if (socket && isConnected) {
      socket.emit('message', { roomId, message });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinRoom,
        leaveRoom,
        sendMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
