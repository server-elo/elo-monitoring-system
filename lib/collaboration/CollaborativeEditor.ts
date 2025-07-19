'use client';

import { TextOperation, OperationalTransform } from './OperationalTransform';
import { CollaborationClient, CollaborationUser } from './CollaborationClient';

export interface CursorDecoration {
  userId: string;
  userName: string;
  color: string;
  position: {
    lineNumber: number;
    column: number;
  };
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

export interface CollaborativeEditorOptions {
  wsUrl: string;
  userId: string;
  sessionId: string;
  userName: string;
  userColor: string;
  enableCursorSync: boolean;
  enableSelectionSync: boolean;
  debounceMs: number;
}

export class CollaborativeEditor {
  private editor: any;
  private monaco: any;
  private client: CollaborationClient;
  private currentText: string = '';
  private isApplyingRemoteOperation = false;
  private cursorDecorations: Map<string, string[]> = new Map();
  private selectionDecorations: Map<string, string[]> = new Map();
  private typingIndicators: Map<string, NodeJS.Timeout> = new Map();
  private lastCursorPosition: any = null;
  private debounceTimeout: NodeJS.Timeout | null = null;

  // Event handlers
  private onUserJoined?: (user: CollaborationUser) => void;
  private onUserLeft?: (userId: string) => void;
  private onTypingIndicator?: (userId: string, isTyping: boolean) => void;
  private onConnectionStatusChanged?: (status: string) => void;
  private onCollaborativeCompilation?: (result: any) => void;

  constructor(
    editor: any,
    monaco: any,
    private options: CollaborativeEditorOptions
  ) {
    this.editor = editor;
    this.monaco = monaco;
    this.currentText = editor.getValue();
    
    this.client = new CollaborationClient(
      options.wsUrl,
      options.userId,
      options.sessionId
    );

    this.setupEventHandlers();
    this.setupEditorListeners();
  }

  // Initialize collaboration
  async initialize(): Promise<void> {
    try {
      await this.client.connect();
      this.installCursorStyles();
    } catch (error) {
      console.error('Failed to initialize collaborative editor:', error);
      throw error;
    }
  }

  // Cleanup and disconnect
  dispose(): void {
    this.client.disconnect();
    this.clearAllDecorations();
    this.clearAllTypingIndicators();
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }

  // Setup event handlers for collaboration client
  private setupEventHandlers(): void {
    this.client.onConnectionStatus((status) => {
      this.onConnectionStatusChanged?.(status);
    });

    this.client.onOperation((operation) => {
      this.applyRemoteOperation(operation);
    });

    this.client.onCursor((userId, cursor) => {
      this.updateRemoteCursor(userId, cursor);
    });

    this.client.onPresence((users) => {
      this.updateUserPresence(users);
    });

    this.client.onCompilation((result) => {
      this.onCollaborativeCompilation?.(result);
    });

    this.client.onErrorEvent((error) => {
      console.error('Collaboration error:', error);
    });
  }

  // Setup Monaco Editor event listeners
  private setupEditorListeners(): void {
    // Listen for content changes
    this.editor.onDidChangeModelContent((event: any) => {
      if (!this.isApplyingRemoteOperation) {
        this.handleLocalChange(event);
      }
    });

    // Listen for cursor position changes
    this.editor.onDidChangeCursorPosition((event: any) => {
      if (this.options.enableCursorSync) {
        this.handleCursorChange(event);
      }
    });

    // Listen for selection changes
    this.editor.onDidChangeCursorSelection((event: any) => {
      if (this.options.enableSelectionSync) {
        this.handleSelectionChange(event);
      }
    });

    // Listen for focus/blur events for typing indicators
    this.editor.onDidFocusEditorText(() => {
      this.sendTypingIndicator(true);
    });

    this.editor.onDidBlurEditorText(() => {
      this.sendTypingIndicator(false);
    });
  }

  // Handle local text changes
  private handleLocalChange(_event: any): void {
    const newText = this.editor.getValue();
    const operation = OperationalTransform.fromTextChange(
      this.currentText,
      newText,
      this.editor.getPosition()
    );

    operation.meta = {
      userId: this.options.userId,
      timestamp: Date.now(),
      cursor: this.editor.getPosition()
    };

    this.currentText = newText;
    this.client.sendOperation(operation);

    // Send typing indicator
    this.sendTypingIndicator(true);
    this.scheduleTypingIndicatorStop();
  }

  // Handle cursor position changes
  private handleCursorChange(event: any): void {
    const position = event.position;
    
    // Debounce cursor updates to avoid spam
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      if (this.lastCursorPosition?.lineNumber !== position.lineNumber ||
          this.lastCursorPosition?.column !== position.column) {
        
        this.client.sendCursorUpdate({
          position: {
            lineNumber: position.lineNumber,
            column: position.column
          },
          userName: this.options.userName,
          color: this.options.userColor
        });

        this.lastCursorPosition = position;
      }
    }, this.options.debounceMs);
  }

  // Handle selection changes
  private handleSelectionChange(event: any): void {
    const selection = event.selection;
    
    if (!selection.isEmpty()) {
      this.client.sendCursorUpdate({
        position: {
          lineNumber: selection.endLineNumber,
          column: selection.endColumn
        },
        selection: {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn
        },
        userName: this.options.userName,
        color: this.options.userColor
      });
    }
  }

  // Apply remote operation to editor
  private applyRemoteOperation(operation: TextOperation): void {
    this.isApplyingRemoteOperation = true;

    try {
      const newText = OperationalTransform.apply(this.currentText, operation);
      
      // Calculate cursor position adjustment
      const currentPosition = this.editor.getPosition();
      const newPosition = this.transformCursorPosition(currentPosition, operation);

      // Update editor content
      this.editor.setValue(newText);
      this.editor.setPosition(newPosition);
      
      this.currentText = newText;
    } catch (error) {
      console.error('Failed to apply remote operation:', error);
    } finally {
      this.isApplyingRemoteOperation = false;
    }
  }

  // Transform cursor position based on operation
  private transformCursorPosition(position: any, _operation: TextOperation): any {
    // Simplified cursor transformation - in production, this would be more sophisticated
    const line = position.lineNumber;
    const column = position.column;
    
    // This is a basic implementation - real cursor transformation is complex
    // and depends on the specific changes made by the operation
    
    return { lineNumber: line, column: column };
  }

  // Update remote user cursor
  private updateRemoteCursor(userId: string, cursor: any): void {
    if (userId === this.options.userId) return;

    // Clear existing decorations for this user
    this.clearUserDecorations(userId);

    // Create cursor decoration
    const cursorDecoration = {
      range: new this.monaco.Range(
        cursor.position.lineNumber,
        cursor.position.column,
        cursor.position.lineNumber,
        cursor.position.column
      ),
      options: {
        className: `collaboration-cursor-${userId}`,
        hoverMessage: { value: `${cursor.userName}'s cursor` },
        stickiness: this.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    };

    // Create selection decoration if present
    let selectionDecoration = null;
    if (cursor.selection) {
      selectionDecoration = {
        range: new this.monaco.Range(
          cursor.selection.startLineNumber,
          cursor.selection.startColumn,
          cursor.selection.endLineNumber,
          cursor.selection.endColumn
        ),
        options: {
          className: `collaboration-selection-${userId}`,
          hoverMessage: { value: `${cursor.userName}'s selection` }
        }
      };
    }

    // Apply decorations
    const decorations = [cursorDecoration];
    if (selectionDecoration) {
      decorations.push(selectionDecoration);
    }

    const decorationIds = this.editor.deltaDecorations([], decorations);
    this.cursorDecorations.set(userId, decorationIds);

    // Update typing indicator
    this.updateTypingIndicator(userId, true);
  }

  // Clear decorations for a specific user
  private clearUserDecorations(userId: string): void {
    const cursorDecorations = this.cursorDecorations.get(userId);
    if (cursorDecorations) {
      this.editor.deltaDecorations(cursorDecorations, []);
      this.cursorDecorations.delete(userId);
    }

    const selectionDecorations = this.selectionDecorations.get(userId);
    if (selectionDecorations) {
      this.editor.deltaDecorations(selectionDecorations, []);
      this.selectionDecorations.delete(userId);
    }
  }

  // Clear all decorations
  private clearAllDecorations(): void {
    for (const userId of this.cursorDecorations.keys()) {
      this.clearUserDecorations(userId);
    }
  }

  // Update user presence
  private updateUserPresence(users: CollaborationUser[]): void {
    // Remove decorations for users who left
    for (const userId of this.cursorDecorations.keys()) {
      if (!users.find(user => user.id === userId)) {
        this.clearUserDecorations(userId);
        this.onUserLeft?.(userId);
      }
    }

    // Notify about new users
    users.forEach(user => {
      if (user.id !== this.options.userId) {
        this.onUserJoined?.(user);
      }
    });
  }

  // Send typing indicator
  private sendTypingIndicator(isTyping: boolean): void {
    this.client.sendCursorUpdate({
      position: this.editor.getPosition(),
      userName: this.options.userName,
      color: this.options.userColor,
      isTyping
    });
  }

  // Schedule typing indicator stop
  private scheduleTypingIndicatorStop(): void {
    // Clear existing timeout
    const existingTimeout = this.typingIndicators.get(this.options.userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      this.sendTypingIndicator(false);
      this.typingIndicators.delete(this.options.userId);
    }, 2000); // Stop typing indicator after 2 seconds of inactivity

    this.typingIndicators.set(this.options.userId, timeout);
  }

  // Update typing indicator for remote user
  private updateTypingIndicator(userId: string, isTyping: boolean): void {
    this.onTypingIndicator?.(userId, isTyping);

    if (isTyping) {
      // Clear existing timeout
      const existingTimeout = this.typingIndicators.get(userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set timeout to automatically stop typing indicator
      const timeout = setTimeout(() => {
        this.onTypingIndicator?.(userId, false);
        this.typingIndicators.delete(userId);
      }, 5000); // Auto-stop after 5 seconds

      this.typingIndicators.set(userId, timeout);
    } else {
      // Clear timeout and stop indicator
      const timeout = this.typingIndicators.get(userId);
      if (timeout) {
        clearTimeout(timeout);
        this.typingIndicators.delete(userId);
      }
    }
  }

  // Clear all typing indicators
  private clearAllTypingIndicators(): void {
    for (const timeout of this.typingIndicators.values()) {
      clearTimeout(timeout);
    }
    this.typingIndicators.clear();
  }

  // Install CSS styles for cursors and selections
  private installCursorStyles(): void {
    if (typeof document === 'undefined') return;

    const styleId = 'collaboration-cursor-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .collaboration-cursor {
        position: relative;
        border-left: 2px solid;
        animation: collaboration-cursor-blink 1s infinite;
      }
      
      .collaboration-selection {
        background-color: rgba(0, 123, 255, 0.2);
        border: 1px solid rgba(0, 123, 255, 0.4);
      }
      
      @keyframes collaboration-cursor-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      
      .collaboration-cursor::after {
        content: attr(data-user-name);
        position: absolute;
        top: -20px;
        left: 0;
        background: var(--user-color, #007bff);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        white-space: nowrap;
        z-index: 1000;
      }
    `;
    
    document.head.appendChild(style);
  }

  // Public methods for external control
  sendCompilationRequest(code: string): void {
    this.client.sendCompilationRequest(code);
  }

  getConnectionStatus(): string {
    return this.client.getConnectionStatus();
  }

  isConnected(): boolean {
    return this.client.isConnected();
  }

  // Event handler setters
  onUserJoin(handler: (user: CollaborationUser) => void): void {
    this.onUserJoined = handler;
  }

  onUserLeave(handler: (userId: string) => void): void {
    this.onUserLeft = handler;
  }

  onTyping(handler: (userId: string, isTyping: boolean) => void): void {
    this.onTypingIndicator = handler;
  }

  onConnectionStatus(handler: (status: string) => void): void {
    this.onConnectionStatusChanged = handler;
  }

  onCompilation(handler: (result: any) => void): void {
    this.onCollaborativeCompilation = handler;
  }
}
