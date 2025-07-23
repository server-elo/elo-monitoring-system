export interface CollaborationSession {
  id: string;
  name: string;
  participants: Participant[];
  createdAt: Date;
  isActive: boolean;
  maxParticipants: number;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
  isOnline: boolean;
  cursor?: {
    x: number;
    y: number;
    color: string;
  };
}

export interface CollaborationMessage {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  type: 'chat' | 'system';
  timestamp: Date;
}

export interface CodeChange {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  position: {
    line: number;
    column: number;
  };
  timestamp: Date;
}
