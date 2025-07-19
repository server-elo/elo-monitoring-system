'use client';

import { TextOperation, OperationalTransform } from './OperationalTransform';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'instructor' | 'student' | 'observer';
  status: 'online' | 'idle' | 'offline';
  cursor?: {
    line: number;
    column: number;
    selection?: {
      startLine: number;
      startColumn: number;
      endLine: number;
      endColumn: number;
    };
  };
  lastActivity: Date;
  color: string; // Unique color for this user's cursor/selections
}

export interface CollaborationMessage {
  type: 'operation' | 'cursor' | 'presence' | 'chat' | 'compilation' | 'system';
  data: any;
  userId: string;
  timestamp: number;
  sessionId: string;
}

export interface CollaborationSession {
  id: string;
  name: string;
  lessonId?: string;
  createdBy: string;
  createdAt: Date;
  users: CollaborationUser[];
  isActive: boolean;
  maxUsers: number;
  settings: {
    allowGuestUsers: boolean;
    requireApproval: boolean;
    enableChat: boolean;
    enableVoice: boolean;
    autoSave: boolean;
  };
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export class CollaborationClient {
  private ws: WebSocket | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: CollaborationMessage[] = [];
  private pendingOperations: TextOperation[] = [];
  // Acknowledged operations kept for future OT implementation
  // private acknowledgedOperations: TextOperation[] = [];
  
  // Event handlers
  private onConnectionStatusChange?: (_status: ConnectionStatus) => void;
  private onOperationReceived?: (_operation: TextOperation) => void;
  private onCursorUpdate?: ( userId: string, cursor: any) => void;
  // Presence update handler kept for future presence features
  // private onPresenceUpdate?: (_users: CollaborationUser[]) => void;
  private onChatMessage?: (_message: any) => void;
  private onCompilationResult?: (_result: any) => void;
  private onError?: (_error: Error) => void;

  constructor(
    private wsUrl: string,
    private userId: string,
    private sessionId: string
  ) {}

  // Connect to collaboration server
  async connect(_): Promise<void> {
    if (_this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setConnectionStatus('connecting');

    try {
      this.ws = new WebSocket(_`${this.wsUrl}?userId=${this.userId}&sessionId=${this.sessionId}`);
      
      this.ws.onopen = this.handleOpen.bind(_this);
      this.ws.onmessage = this.handleMessage.bind(_this);
      this.ws.onclose = this.handleClose.bind(_this);
      this.ws.onerror = this.handleError.bind(_this);

    } catch (_error) {
      this.setConnectionStatus('error');
      this.onError?.(_error as Error);
    }
  }

  // Disconnect from collaboration server
  disconnect(_): void {
    if (_this.heartbeatInterval) {
      clearInterval(_this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (_this.ws) {
      this.ws.close( 1000, 'Client disconnect');
      this.ws = null;
    }

    this.setConnectionStatus('disconnected');
  }

  // Send operation to other collaborators
  sendOperation(_operation: TextOperation): void {
    this.pendingOperations.push(_operation);
    
    const message: CollaborationMessage = {
      type: 'operation',
      data: operation,
      userId: this.userId,
      timestamp: Date.now(_),
      sessionId: this.sessionId
    };

    this.sendMessage(_message);
  }

  // Send cursor position update
  sendCursorUpdate(_cursor: any): void {
    const message: CollaborationMessage = {
      type: 'cursor',
      data: cursor,
      userId: this.userId,
      timestamp: Date.now(_),
      sessionId: this.sessionId
    };

    this.sendMessage(_message);
  }

  // Send presence update (_status change)
  sendPresenceUpdate(_status: 'online' | 'idle' | 'offline'): void {
    const message: CollaborationMessage = {
      type: 'presence',
      data: { status },
      userId: this.userId,
      timestamp: Date.now(_),
      sessionId: this.sessionId
    };

    this.sendMessage(_message);
  }

  // Send chat message
  sendChatMessage( content: string, type: 'text' | 'file' = 'text'): void {
    const message: CollaborationMessage = {
      type: 'chat',
      data: { content, messageType: type },
      userId: this.userId,
      timestamp: Date.now(_),
      sessionId: this.sessionId
    };

    this.sendMessage(_message);
  }

  // Send compilation request
  sendCompilationRequest(_code: string): void {
    const message: CollaborationMessage = {
      type: 'compilation',
      data: { code, action: 'compile' },
      userId: this.userId,
      timestamp: Date.now(_),
      sessionId: this.sessionId
    };

    this.sendMessage(_message);
  }

  // Private methods
  private handleOpen(_): void {
    this.setConnectionStatus('connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat(_);
    this.flushMessageQueue(_);
  }

  private handleMessage(_event: MessageEvent): void {
    try {
      const message: CollaborationMessage = JSON.parse(_event.data);
      
      switch (_message.type) {
        case 'operation':
          this.handleOperationMessage(_message);
          break;
        case 'cursor':
          this.onCursorUpdate?.( message.userId, message.data);
          break;
        case 'presence':
          this.handlePresenceMessage(_message);
          break;
        case 'chat':
          this.onChatMessage?.(_message);
          break;
        case 'compilation':
          this.onCompilationResult?.(_message.data);
          break;
        case 'system':
          this.handleSystemMessage(_message);
          break;
      }
    } catch (_error) {
      console.error('Failed to parse collaboration message:', error);
    }
  }

  private handleClose(_event: CloseEvent): void {
    this.setConnectionStatus('disconnected');
    
    if (_this.heartbeatInterval) {
      clearInterval(_this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Attempt reconnection if not a clean close
    if (_event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect(_);
    }
  }

  private handleError(_error: Event): void {
    console.error('WebSocket error:', error);
    this.setConnectionStatus('error');
    this.onError?.(_new Error('WebSocket connection error'));
  }

  private handleOperationMessage(_message: CollaborationMessage): void {
    const operation = message.data as TextOperation;
    
    // Transform against pending operations
    let transformedOp = operation;
    for (_const pendingOp of this.pendingOperations) {
      const [, transformed] = OperationalTransform.transform( pendingOp, transformedOp, 'left');
      transformedOp = transformed;
    }

    this.onOperationReceived?.(_transformedOp);
  }

  private handlePresenceMessage(_message: CollaborationMessage): void {
    // This would typically update the user list
    // Implementation depends on how presence data is structured
    console.log('Presence update:', message.data);
  }

  private handleSystemMessage(_message: CollaborationMessage): void {
    switch (_message.data.type) {
      case 'operation_ack':
        this.handleOperationAck(_message.data.operationId);
        break;
      case 'user_joined':
      case 'user_left':
        // Handle user presence changes
        break;
      case 'session_ended':
        this.disconnect(_);
        break;
    }
  }

  private handleOperationAck( operationId: string): void {
    // Remove acknowledged operation from pending list
    // This would require operations to have IDs
    this.pendingOperations.shift(_); // Simplified for now
  }

  private attemptReconnect(_): void {
    this.reconnectAttempts++;
    this.setConnectionStatus('reconnecting');

    const delay = this.reconnectDelay * Math.pow( 2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      this.connect(_).catch(() => {
        if (_this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(_);
        } else {
          this.setConnectionStatus('error');
          this.onError?.(_new Error('Max reconnection attempts reached'));
        }
      });
    }, delay);
  }

  private startHeartbeat(_): void {
    this.heartbeatInterval = setInterval(() => {
      if (_this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(_JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private sendMessage(_message: CollaborationMessage): void {
    if (_this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(_JSON.stringify(message));
    } else {
      // Queue message for later sending
      this.messageQueue.push(_message);
    }
  }

  private flushMessageQueue(_): void {
    while (_this.messageQueue.length > 0) {
      const message = this.messageQueue.shift(_);
      if (message) {
        this.sendMessage(_message);
      }
    }
  }

  private setConnectionStatus(_status: ConnectionStatus): void {
    if (_this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.onConnectionStatusChange?.(_status);
    }
  }

  // Get pending operations count
  getPendingOperationsCount(_): number {
    return this.pendingOperations.length;
  }

  // Clear pending operations (_for session recovery)
  clearPendingOperations(_): void {
    this.pendingOperations = [];
  }

  // Get queued messages count
  getQueuedMessagesCount(_): number {
    return this.messageQueue.length;
  }

  // Public getters
  getConnectionStatus(_): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(_): boolean {
    return this.connectionStatus === 'connected';
  }

  // Event handler setters
  onConnectionStatus(_handler: (status: ConnectionStatus) => void): void {
    this.onConnectionStatusChange = handler;
  }

  onOperation(_handler: (operation: TextOperation) => void): void {
    this.onOperationReceived = handler;
  }

  onCursor( handler: (userId: string, cursor: any) => void): void {
    this.onCursorUpdate = handler;
  }

  onPresence(_handler: (users: CollaborationUser[]) => void): void {
    this.onPresenceUpdate = handler;
  }

  onChat(_handler: (message: any) => void): void {
    this.onChatMessage = handler;
  }

  onCompilation(_handler: (result: any) => void): void {
    this.onCompilationResult = handler;
  }

  onErrorEvent(_handler: (error: Error) => void): void {
    this.onError = handler;
  }
}
