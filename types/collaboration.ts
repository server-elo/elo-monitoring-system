/**
 * Collaboration Types
 * 
 * Type definitions for real-time collaboration features including
 * user presence, document synchronization, and collaborative editing.
 */

export interface CollaborationUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  color?: string;
  role?: 'owner' | 'editor' | 'viewer';
}

export interface CollaborationSession {
  id: string;
  documentId: string;
  participants: CollaborationUser[];
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
  };
}

export interface DocumentChange {
  id: string;
  sessionId: string;
  userId: string;
  operation: 'insert' | 'delete' | 'replace';
  position: {
    line: number;
    column: number;
  };
  content: string;
  timestamp: Date;
  version: number;
}

export interface CursorPosition {
  userId: string;
  line: number;
  column: number;
  timestamp: Date;
}

export interface UserSelection {
  userId: string;
  start: { line: number; column: number };
  end: { line: number; column: number };
  timestamp: Date;
}

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'document_changed' | 'cursor_moved' | 'selection_changed' | 'comment_added';
  sessionId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

export interface CollaborationComment {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  content: string;
  position: {
    line: number;
    column: number;
  };
  timestamp: Date;
  resolved: boolean;
  replies?: CollaborationComment[];
}

export interface CollaborationSettings {
  enableRealTimeEditing: boolean;
  enableCursorSync: boolean;
  enablePresenceIndicators: boolean;
  enableComments: boolean;
  autoSaveInterval: number;
  maxParticipants: number;
  permissions: {
    defaultRole: 'editor' | 'viewer';
    allowGuestAccess: boolean;
    requireInvitation: boolean;
  };
}

export interface CollaborationMetrics {
  activeUsers: number;
  totalSessions: number;
  documentsShared: number;
  averageSessionDuration: number;
  collaborationEvents: number;
  syncLatency: number;
  conflictResolutions: number;
}

export type CollaborationStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'syncing';