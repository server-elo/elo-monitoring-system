import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

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
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  isTyping: boolean;
  typingLocation?: 'chat' | 'code';
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

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinSession: (sessionId: string) => void;
  leaveSession: () => void;
  sendMessage: (content: string, type?: string) => void;
  updateCode: (code: string, changes?: any) => void;
  updateCursor: (line: number, column: number) => void;
  updateSelection: (startLine: number, startColumn: number, endLine: number, endColumn: number) => void;
  startTyping: (location: 'chat' | 'code') => void;
  stopTyping: (location: 'chat' | 'code') => void;
  updateUserStatus: (status: 'online' | 'away' | 'offline') => void;
  session: CollaborationSession | null;
  messages: ChatMessage[];
  presence: UserPresence[];
  participants: User[];
  typingUsers: UserPresence[];
}

export const useSocket = (): UseSocketReturn => {
  const { data: sessionData } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [presence, setPresence] = useState<UserPresence[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<UserPresence[]>([]);
  const currentSessionId = useRef<string | null>(null);
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!sessionData?.user) return;

    // Initialize socket connection
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://ezekaj.github.io' 
      : 'http://localhost:3001';

    const newSocket = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to Socket.io server');
      setIsConnected(true);
      
      // Authenticate with the server
      newSocket.emit('authenticate', {
        userId: sessionData.user.id,
        sessionToken: 'temp-token', // In production, use actual session token
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      setIsConnected(false);
    });

    newSocket.on('authenticated', (data: { user: User }) => {
      console.log('Authenticated successfully:', data.user);
    });

    newSocket.on('authentication_failed', () => {
      console.error('Authentication failed');
    });

    // Session event handlers
    newSocket.on('session_joined', (data: {
      session: CollaborationSession;
      messages: ChatMessage[];
      presence: UserPresence[];
    }) => {
      console.log('Joined session:', data.session);
      setSession(data.session);
      setMessages(data.messages);
      setPresence(data.presence);
      setParticipants(data.session.participants);
    });

    newSocket.on('user_joined', (data: { user: User; presence: UserPresence[] }) => {
      console.log('User joined:', data.user);
      setParticipants(prev => [...prev.filter(p => p.id !== data.user.id), data.user]);
      setPresence(data.presence);
    });

    newSocket.on('user_left', (data: { userId: string; presence: UserPresence[] }) => {
      console.log('User left:', data.userId);
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
      setPresence(data.presence);
    });

    // Code collaboration event handlers
    newSocket.on('code_updated', (data: {
      code: string;
      changes: any;
      userId: string;
      timestamp: Date;
    }) => {
      if (session) {
        setSession(prev => prev ? { ...prev, code: data.code } : null);
      }
    });

    newSocket.on('cursor_updated', (data: { userId: string; cursor: { line: number; column: number } }) => {
      setPresence(prev => prev.map(p => 
        p.userId === data.userId 
          ? { ...p, cursor: data.cursor, lastSeen: new Date() }
          : p
      ));
    });

    newSocket.on('selection_updated', (data: { 
      userId: string; 
      selection: { startLine: number; startColumn: number; endLine: number; endColumn: number } 
    }) => {
      setPresence(prev => prev.map(p => 
        p.userId === data.userId 
          ? { ...p, selection: data.selection, lastSeen: new Date() }
          : p
      ));
    });

    // Chat event handlers
    newSocket.on('message_received', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    // Typing indicator event handlers
    newSocket.on('user_typing', (data: { userId: string; location: 'chat' | 'code'; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId || u.typingLocation !== data.location);
        if (data.isTyping) {
          const userPresence = presence.find(p => p.userId === data.userId);
          if (userPresence) {
            return [...filtered, {
              ...userPresence,
              isTyping: true,
              typingLocation: data.location,
              lastSeen: new Date()
            }];
          }
        }
        return filtered;
      });

      // Auto-clear typing indicator after 3 seconds
      const timeoutKey = `${data.userId}-${data.location}`;
      const existingTimeout = typingTimeouts.current.get(timeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      if (data.isTyping) {
        const timeout = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u =>
            !(u.userId === data.userId && u.typingLocation === data.location)
          ));
          typingTimeouts.current.delete(timeoutKey);
        }, 3000);
        typingTimeouts.current.set(timeoutKey, timeout);
      }
    });

    // User status updates
    newSocket.on('user_status_updated', (data: { userId: string; status: 'online' | 'away' | 'offline' }) => {
      setPresence(prev => prev.map(p =>
        p.userId === data.userId
          ? { ...p, status: data.status, lastSeen: new Date() }
          : p
      ));
    });

    // Error handling
    newSocket.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [sessionData]);

  const joinSession = (sessionId: string) => {
    if (socket && isConnected) {
      currentSessionId.current = sessionId;
      socket.emit('join_session', sessionId);
    }
  };

  const leaveSession = () => {
    if (socket && currentSessionId.current) {
      socket.emit('leave_session');
      currentSessionId.current = null;
      setSession(null);
      setMessages([]);
      setPresence([]);
      setParticipants([]);
    }
  };

  const sendMessage = (content: string, type: string = 'TEXT') => {
    if (socket && currentSessionId.current) {
      socket.emit('send_message', {
        sessionId: currentSessionId.current,
        content,
        type,
      });
    }
  };

  const updateCode = (code: string, changes?: any) => {
    if (socket && currentSessionId.current) {
      socket.emit('code_change', {
        sessionId: currentSessionId.current,
        code,
        changes,
      });
      
      // Update local state immediately for responsiveness
      setSession(prev => prev ? { ...prev, code } : null);
    }
  };

  const updateCursor = (line: number, column: number) => {
    if (socket && currentSessionId.current) {
      socket.emit('cursor_update', { line, column });
    }
  };

  const updateSelection = (startLine: number, startColumn: number, endLine: number, endColumn: number) => {
    if (socket && currentSessionId.current) {
      socket.emit('selection_update', { startLine, startColumn, endLine, endColumn });
    }
  };

  const startTyping = (location: 'chat' | 'code') => {
    if (socket && currentSessionId.current) {
      socket.emit('typing_start', { location });
    }
  };

  const stopTyping = (location: 'chat' | 'code') => {
    if (socket && currentSessionId.current) {
      socket.emit('typing_stop', { location });
    }
  };

  const updateUserStatus = (status: 'online' | 'away' | 'offline') => {
    if (socket) {
      socket.emit('status_update', { status });
    }
  };

  return {
    socket,
    isConnected,
    joinSession,
    leaveSession,
    sendMessage,
    updateCode,
    updateCursor,
    updateSelection,
    startTyping,
    stopTyping,
    updateUserStatus,
    session,
    messages,
    presence,
    participants,
    typingUsers,
  };
};

// Hook for managing collaboration sessions
export const useCollaborationSessions = () => {
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/collaboration');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.collaborations || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (title: string, description: string, type: string) => {
    try {
      const response = await fetch('/api/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, type }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(prev => [data.collaboration, ...prev]);
        return data.collaboration;
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
    return null;
  };

  const joinSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/collaboration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collaborationId: sessionId, action: 'join' }),
      });
      
      if (response.ok) {
        await fetchSessions();
        return true;
      }
    } catch (error) {
      console.error('Error joining session:', error);
    }
    return false;
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    loading,
    fetchSessions,
    createSession,
    joinSession,
  };
};
