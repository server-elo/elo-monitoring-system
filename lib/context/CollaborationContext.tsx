'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CollaborationUser } from '@/lib/collaboration/CollaborationClient';
import { TextOperation } from '@/lib/collaboration/OperationalTransform';
import { useCollaborationConnection } from '@/hooks/useCollaborationConnection';
import { useUserPresence, useUserColors } from '@/hooks/useUserPresence';
import { useChatMessages } from '@/components/collaboration/CollaborationChat';
import { useSessionRecovery } from '@/components/collaboration/SessionRecovery';

interface CollaborationSession {
  id: string;
  code: string;
  title: string;
  language: string;
  participants: {
    id: string;
    name: string;
    image?: string;
    cursor?: any;
  }[];
  createdAt: Date;
}

interface CollaborationState {
  isEnabled: boolean;
  sessionId: string | null;
  currentSession: CollaborationSession | null;
  currentUser: CollaborationUser | null;
  users: CollaborationUser[];
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'critical';
  latency: number;
  isOffline: boolean;
  offlineQueueSize: number;
  lastSyncTime: Date | null;
  typingUsers: string[];
  chatMessages: any[];
  sharedFiles: any[];
  sessionDuration: number;
  isRecovering: boolean;
  recoveryProgress?: {
    current: number;
    total: number;
    stage: 'connecting' | 'syncing' | 'resolving' | 'complete';
    message: string;
  };
}

interface CollaborationActions {
  // Session management
  startCollaboration: ( sessionId: string, lessonId?: string) => Promise<void>;
  endCollaboration: (_) => void;
  joinSession: (_sessionId: string) => Promise<void>;
  leaveSession: (_) => void;

  // Code collaboration
  sendCodeOperation: (_operation: TextOperation) => Promise<void>;
  sendCursorUpdate: (_cursor: any) => void;
  sendCompilationRequest: (_code: string) => void;

  // User management
  updateUserStatus: (_status: 'online' | 'idle' | 'offline') => void;
  setTyping: (_isTyping: boolean) => void;
  kickUser: (_userId: string) => void;
  promoteUser: ( userId: string, role: 'instructor' | 'student' | 'observer') => void;

  // Chat
  sendChatMessage: ( content: string, type?: 'text' | 'code' | 'file') => void;
  addChatReaction: ( messageId: string, emoji: string) => void;
  markChatAsRead: (_messageId: string) => void;

  // File sharing
  uploadFile: ( file: File, description?: string) => Promise<any>;
  downloadFile: (_fileId: string) => void;
  deleteFile: (_fileId: string) => void;

  // Connection management
  reconnect: (_) => Promise<void>;
  forceSync: (_) => Promise<void>;
  clearOfflineData: (_) => void;

  // Integration with learning systems
  syncLessonProgress: ( lessonId: string, progress: any) => void;
  shareXPReward: ( amount: number, reason: string) => void;
  triggerCollaborativeAchievement: ( achievementId: string, participants: string[]) => void;
}

interface CollaborationContextType {
  state: CollaborationState;
  actions: CollaborationActions;
  // Direct property access for convenience
  currentSession: CollaborationSession | null;
  isConnected: boolean;
  updateCode: (_code: string) => void;
  updateCursor: (_cursor: any) => void;
  sendChatMessage: ( content: string, type?: 'text' | 'code' | 'file') => void;
  chatMessages: any[];
  leaveSession: (_) => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(_null);

// Reducer for managing collaboration state
function collaborationReducer( state: CollaborationState, action: any): CollaborationState {
  switch (_action.type) {
    case 'SET_SESSION':
      return { ...state, sessionId: action.payload, isEnabled: true };

    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };

    case 'UPDATE_USERS':
      return { ...state, users: action.payload };

    case 'UPDATE_CONNECTION':
      return {
        ...state,
        isConnected: action.payload.isConnected,
        connectionQuality: action.payload.connectionQuality,
        latency: action.payload.latency,
        isOffline: action.payload.isOffline,
        offlineQueueSize: action.payload.offlineQueueSize,
        lastSyncTime: action.payload.lastSyncTime
      };

    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload };

    case 'UPDATE_CHAT_MESSAGES':
      return { ...state, chatMessages: action.payload };

    case 'UPDATE_SHARED_FILES':
      return { ...state, sharedFiles: action.payload };

    case 'SET_SESSION_DURATION':
      return { ...state, sessionDuration: action.payload };

    case 'SET_RECOVERY_STATE':
      return {
        ...state,
        isRecovering: action.payload.isRecovering,
        recoveryProgress: action.payload.progress
      };

    case 'RESET':
      return {
        ...state,
        isEnabled: false,
        sessionId: null,
        currentUser: null,
        users: [],
        isConnected: false,
        typingUsers: [],
        chatMessages: [],
        sharedFiles: [],
        sessionDuration: 0,
        isRecovering: false,
        recoveryProgress: undefined
      };

    default:
      return state;
  }
}

const initialState: CollaborationState = {
  isEnabled: false,
  sessionId: null,
  currentUser: null,
  users: [],
  isConnected: false,
  connectionQuality: 'excellent',
  latency: 0,
  isOffline: false,
  offlineQueueSize: 0,
  lastSyncTime: null,
  typingUsers: [],
  chatMessages: [],
  sharedFiles: [],
  sessionDuration: 0,
  isRecovering: false
};

interface CollaborationProviderProps {
  children: React.ReactNode;
  wsUrl?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole?: 'instructor' | 'student' | 'observer';
}

export function CollaborationProvider({
  children,
  wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
  userId,
  userName,
  userEmail,
  userRole = 'student'
}: CollaborationProviderProps) {
  const [state, dispatch] = useReducer( collaborationReducer, initialState);

  // Initialize collaboration connection
  const connection = useCollaborationConnection({
    wsUrl,
    userId,
    sessionId: state.sessionId || '',
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    enableOfflineMode: true,
    onConnectionChange: (_connectionState) => {
      dispatch({
        type: 'UPDATE_CONNECTION',
        payload: connectionState
      });
    },
    onOperationReceived: (_operation) => {
      // Handle received operations - would integrate with editor
      console.log('Received operation:', operation);
    },
    onUserPresenceUpdate: (_users) => {
      dispatch( { type: 'UPDATE_USERS', payload: users });
    },
    onChatMessage: (_message) => {
      // Handle chat messages
      console.log('Received chat message:', message);
    },
    onCompilationResult: (_result) => {
      // Handle compilation results
      console.log('Received compilation result:', result);
    },
    onError: (_error) => {
      console.error('Collaboration error:', error);
    }
  });

  // User presence management
  const userPresence = useUserPresence({
    currentUserId: userId,
    onUserJoined: (_user) => {
      console.log('User joined:', user);
    },
    onUserLeft: (_userId) => {
      console.log('User left:', userId);
    },
    onUserStatusChanged: ( userId, status) => {
      console.log('User status changed:', userId, status);
    },
    onTypingChanged: ( userId, isTyping) => {
      const currentTyping = state.typingUsers;
      if (isTyping && !currentTyping.includes(userId)) {
        dispatch( { type: 'SET_TYPING_USERS', payload: [...currentTyping, userId] });
      } else if (!isTyping) {
        dispatch( { type: 'SET_TYPING_USERS', payload: currentTyping.filter(id => id !== userId) });
      }
    }
  });

  // User color management
  const userColors = useUserColors(_);

  // Chat message management
  const chatMessages = useChatMessages(_state.sessionId || '');

  // Session recovery - kept for future session recovery implementation
  // const sessionRecovery = useSessionRecovery(_);

  // Update session duration
  useEffect(() => {
    if (_state.isEnabled) {
      const interval = setInterval(() => {
        dispatch( { type: 'SET_SESSION_DURATION', payload: userPresence.sessionDuration });
      }, 1000);
      return (_) => clearInterval(_interval);
    }
  }, [state.isEnabled, userPresence.sessionDuration]);

  // Actions implementation
  const actions: CollaborationActions = {
    // Session management
    startCollaboration: async (sessionId: string, _lessonId?: string) => {
      dispatch( { type: 'SET_SESSION', payload: sessionId });

      // Create current user
      const currentUser: CollaborationUser = {
        id: userId,
        name: userName,
        email: userEmail,
        role: userRole,
        status: 'online',
        lastActivity: new Date(_),
        color: userColors.assignColor(_userId)
      };

      dispatch( { type: 'SET_CURRENT_USER', payload: currentUser });
      userPresence.addUser(_currentUser);

      await connection.connect(_);
    },

    endCollaboration: (_) => {
      connection.disconnect(_);
      userPresence.resetSession(_);
      userColors.resetColors(_);
      dispatch({ type: 'RESET'  });
    },

    joinSession: async (_sessionId: string) => {
      await actions.startCollaboration(_sessionId);
    },

    leaveSession: (_) => {
      actions.endCollaboration(_);
    },

    // Code collaboration
    sendCodeOperation: async (_operation: TextOperation) => {
      await connection.sendOperation(_operation);
    },

    sendCursorUpdate: (_cursor: any) => {
      connection.sendCursorUpdate(_cursor);
      userPresence.updateUserCursor( userId, cursor);
    },

    sendCompilationRequest: (_code: string) => {
      connection.sendCompilationRequest(_code);
    },

    // User management
    updateUserStatus: (_status: 'online' | 'idle' | 'offline') => {
      userPresence.updateUserStatus( userId, status);
      connection.sendPresenceUpdate(_status);
    },

    setTyping: (_isTyping: boolean) => {
      userPresence.setTyping( userId, isTyping);
    },

    kickUser: (_userId: string) => {
      userPresence.removeUser(_userId);
      // Would send kick command to server
    },

    promoteUser: ( userId: string, role: 'instructor' | 'student' | 'observer') => {
      userPresence.updateUserRole( userId, role);
      // Would send promotion command to server
    },

    // Chat
    sendChatMessage: ( content: string, type: 'text' | 'code' | 'file' = 'text') => {
      connection.sendChatMessage( content, type);

      // Add to local chat
      chatMessages.addMessage({
        userId,
        userName,
        userColor: userColors.assignColor(_userId),
        content,
        type
      });
    },

    addChatReaction: ( messageId: string, emoji: string) => {
      chatMessages.addReaction( messageId, emoji, userId);
    },

    markChatAsRead: (_messageId: string) => {
      chatMessages.markAsRead( messageId, userId);
    },

    // File sharing
    uploadFile: async (file: File, description?: string) => {
      // Simulate file upload
      const fileUrl = URL.createObjectURL(_file);
      return {
        id: `file_${Date.now(_)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
        uploadedBy: userId,
        uploadedAt: new Date(_),
        downloadCount: 0,
        isPublic: true,
        description
      };
    },

    downloadFile: (_fileId: string) => {
      // Handle file download
      console.log('Downloading file:', fileId);
    },

    deleteFile: (_fileId: string) => {
      // Handle file deletion
      console.log('Deleting file:', fileId);
    },

    // Connection management
    reconnect: async () => {
      await connection.reconnect(_);
    },

    forceSync: async () => {
      await connection.forceSync(_);
    },

    clearOfflineData: (_) => {
      connection.clearOfflineData(_);
    },

    // Integration with learning systems
    syncLessonProgress: ( lessonId: string, progress: any) => {
      // Sync lesson progress with other participants
      console.log('Syncing lesson progress:', lessonId, progress);
    },

    shareXPReward: ( amount: number, reason: string) => {
      // Share XP rewards with collaborators
      console.log('Sharing XP reward:', amount, reason);
    },

    triggerCollaborativeAchievement: ( achievementId: string, participants: string[]) => {
      // Trigger achievements for all participants
      console.log('Triggering collaborative achievement:', achievementId, participants);
    }
  };

  return (
    <CollaborationContext.Provider value={{ state, actions }}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(_CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  
  // Return the context with convenient property access
  return {
    ...context,
    currentSession: context.state.currentSession,
    isConnected: context.state.isConnected,
    updateCode: (_code: string) => context.actions.sendCodeOperation( { type: 'insert', payload: code } as any),
    updateCursor: context.actions.sendCursorUpdate,
    sendChatMessage: context.actions.sendChatMessage,
    chatMessages: context.state.chatMessages,
    leaveSession: context.actions.leaveSession
  };
}
