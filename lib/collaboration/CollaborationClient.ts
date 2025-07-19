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
  private onConnectionStatusChange?: (status: ConnectionStatus) => void;
  private onOperationReceived?: (operation: TextOperation) => void;
  private onCursorUpdate?: (userId: string, cursor: any) => void;
  // Presence update handler kept for future presence features
  // private onPresenceUpdate?: (users: CollaborationUser[]) => void;
  private onChatMessage?: (message: any) => void;
  private onCompilationResult?: (result: any) => void;
  private onError?: (error: Error) => void;

  constructor(
    private wsUrl: string,
    private userId: string,
    private sessionId: string
  ) {}

  // Connect to collaboration server
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setConnectionStatus('connecting');

    try {
      this.ws = new WebSocket(`${this.wsUrl}?userId=${this.userId}&sessionId=${this.sessionId}`);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

    } catch (error) {
      this.setConnectionStatus('error');
      this.onError?.(error as Error);
    }
  }

  // Disconnect from collaboration server
  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setConnectionStatus('disconnected');
  }

  // Send operation to other collaborators
  sendOperation(operation: TextOperation): void {
    this.pendingOperations.push(operation);
    
    const message: CollaborationMessage = {
      type: 'operation',
      data: operation,
      userId: this.userId,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.sendMessage(message);
  }

  // Send cursor position update
  sendCursorUpdate(cursor: any): void {
    const message: CollaborationMessage = {
      type: 'cursor',
      data: cursor,
      userId: this.userId,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.sendMessage(message);
  }

  // Send presence update (status change)
  sendPresenceUpdate(status: 'online' | 'idle' | 'offline'): void {
    const message: CollaborationMessage = {
      type: 'presence',
      data: { status },
      userId: this.userId,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.sendMessage(message);
  }

  // Send chat message
  sendChatMessage(content: string, type: 'text' | 'file' = 'text'): void {
    const message: CollaborationMessage = {
      type: 'chat',
      data: { content, messageType: type },
      userId: this.userId,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.sendMessage(message);
  }

  // Send compilation request
  sendCompilationRequest(code: string): void {
    const message: CollaborationMessage = {
      type: 'compilation',
      data: { code, action: 'compile' },
      userId: this.userId,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.sendMessage(message);
  }

  // Private methods
  private handleOpen(): void {
    this.setConnectionStatus('connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.flushMessageQueue();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: CollaborationMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'operation':
          this.handleOperationMessage(message);
          break;
        case 'cursor':
          this.onCursorUpdate?.(message.userId, message.data);
          break;
        case 'presence':
          this.handlePresenceMessage(message);
          break;
        case 'chat':
          this.onChatMessage?.(message);
          break;
        case 'compilation':
          this.onCompilationResult?.(message.data);
          break;
        case 'system':
          this.handleSystemMessage(message);
          break;
      }
    } catch (error) {
      console.error('Failed to parse collaboration message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    this.setConnectionStatus('disconnected');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Attempt reconnection if not a clean close
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.setConnectionStatus('error');
    this.onError?.(new Error('WebSocket connection error'));
  }

  private handleOperationMessage(message: CollaborationMessage): void {
    const operation = message.data as TextOperation;
    
    // Transform against pending operations
    let transformedOp = operation;
    for (const pendingOp of this.pendingOperations) {
      const [, transformed] = OperationalTransform.transform(pendingOp, transformedOp, 'left');
      transformedOp = transformed;
    }

    this.onOperationReceived?.(transformedOp);
  }

  private handlePresenceMessage(message: CollaborationMessage): void {
    // This would typically update the user list
    // Implementation depends on how presence data is structured
    console.log('Presence update:', message.data);
  }

  private handleSystemMessage(message: CollaborationMessage): void {
    switch (message.data.type) {
      case 'operation_ack':
        this.handleOperationAck(message.data.operationId);
        break;
      case 'user_joined':
      case 'user_left':
        // Handle user presence changes
        break;
      case 'session_ended':
        this.disconnect();
        break;
    }
  }

  private handleOperationAck(_operationId: string): void {
    // Remove acknowledged operation from pending list
    // This would require operations to have IDs
    this.pendingOperations.shift(); // Simplified for now
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    this.setConnectionStatus('reconnecting');

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      this.connect().catch(() => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else {
          this.setConnectionStatus('error');
          this.onError?.(new Error('Max reconnection attempts reached'));
        }
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private sendMessage(message: CollaborationMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later sending
      this.messageQueue.push(message);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.onConnectionStatusChange?.(status);
    }
  }

  // Get pending operations count
  getPendingOperationsCount(): number {
    return this.pendingOperations.length;
  }

  // Clear pending operations (for session recovery)
  clearPendingOperations(): void {
    this.pendingOperations = [];
  }

  // Get queued messages count
  getQueuedMessagesCount(): number {
    return this.messageQueue.length;
  }

  // Public getters
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  // Event handler setters
  onConnectionStatus(handler: (status: ConnectionStatus) => void): void {
    this.onConnectionStatusChange = handler;
  }

  onOperation(handler: (operation: TextOperation) => void): void {
    this.onOperationReceived = handler;
  }

  onCursor(handler: (userId: string, cursor: any) => void): void {
    this.onCursorUpdate = handler;
  }

  onPresence(handler: (users: CollaborationUser[]) => void): void {
    this.onPresenceUpdate = handler;
  }

  onChat(handler: (message: any) => void): void {
    this.onChatMessage = handler;
  }

  onCompilation(handler: (result: any) => void): void {
    this.onCompilationResult = handler;
  }

  onErrorEvent(handler: (error: Error) => void): void {
    this.onError = handler;
  }
}
