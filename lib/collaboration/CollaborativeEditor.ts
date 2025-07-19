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
  private cursorDecorations: Map<string, string[]> = new Map(_);
  private selectionDecorations: Map<string, string[]> = new Map(_);
  private typingIndicators: Map<string, NodeJS.Timeout> = new Map(_);
  private lastCursorPosition: any = null;
  private debounceTimeout: NodeJS.Timeout | null = null;

  // Event handlers
  private onUserJoined?: (_user: CollaborationUser) => void;
  private onUserLeft?: (_userId: string) => void;
  private onTypingIndicator?: ( userId: string, isTyping: boolean) => void;
  private onConnectionStatusChanged?: (_status: string) => void;
  private onCollaborativeCompilation?: (_result: any) => void;

  constructor(
    editor: any,
    monaco: any,
    private options: CollaborativeEditorOptions
  ) {
    this.editor = editor;
    this.monaco = monaco;
    this.currentText = editor.getValue(_);
    
    this.client = new CollaborationClient(
      options.wsUrl,
      options.userId,
      options.sessionId
    );

    this.setupEventHandlers(_);
    this.setupEditorListeners(_);
  }

  // Initialize collaboration
  async initialize(_): Promise<void> {
    try {
      await this.client.connect(_);
      this.installCursorStyles(_);
    } catch (_error) {
      console.error('Failed to initialize collaborative editor:', error);
      throw error;
    }
  }

  // Cleanup and disconnect
  dispose(_): void {
    this.client.disconnect(_);
    this.clearAllDecorations(_);
    this.clearAllTypingIndicators(_);
    
    if (_this.debounceTimeout) {
      clearTimeout(_this.debounceTimeout);
    }
  }

  // Setup event handlers for collaboration client
  private setupEventHandlers(_): void {
    this.client.onConnectionStatus((status) => {
      this.onConnectionStatusChanged?.(_status);
    });

    this.client.onOperation((operation) => {
      this.applyRemoteOperation(_operation);
    });

    this.client.onCursor( (userId, cursor) => {
      this.updateRemoteCursor( userId, cursor);
    });

    this.client.onPresence((users) => {
      this.updateUserPresence(_users);
    });

    this.client.onCompilation((result) => {
      this.onCollaborativeCompilation?.(_result);
    });

    this.client.onErrorEvent((error) => {
      console.error('Collaboration error:', error);
    });
  }

  // Setup Monaco Editor event listeners
  private setupEditorListeners(_): void {
    // Listen for content changes
    this.editor.onDidChangeModelContent((event: any) => {
      if (!this.isApplyingRemoteOperation) {
        this.handleLocalChange(_event);
      }
    });

    // Listen for cursor position changes
    this.editor.onDidChangeCursorPosition((event: any) => {
      if (_this.options.enableCursorSync) {
        this.handleCursorChange(_event);
      }
    });

    // Listen for selection changes
    this.editor.onDidChangeCursorSelection((event: any) => {
      if (_this.options.enableSelectionSync) {
        this.handleSelectionChange(_event);
      }
    });

    // Listen for focus/blur events for typing indicators
    this.editor.onDidFocusEditorText(() => {
      this.sendTypingIndicator(_true);
    });

    this.editor.onDidBlurEditorText(() => {
      this.sendTypingIndicator(_false);
    });
  }

  // Handle local text changes
  private handleLocalChange( event: any): void {
    const newText = this.editor.getValue(_);
    const operation = OperationalTransform.fromTextChange(
      this.currentText,
      newText,
      this.editor.getPosition(_)
    );

    operation.meta = {
      userId: this.options.userId,
      timestamp: Date.now(_),
      cursor: this.editor.getPosition(_)
    };

    this.currentText = newText;
    this.client.sendOperation(_operation);

    // Send typing indicator
    this.sendTypingIndicator(_true);
    this.scheduleTypingIndicatorStop(_);
  }

  // Handle cursor position changes
  private handleCursorChange(_event: any): void {
    const position = event.position;
    
    // Debounce cursor updates to avoid spam
    if (_this.debounceTimeout) {
      clearTimeout(_this.debounceTimeout);
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
  private handleSelectionChange(_event: any): void {
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
  private applyRemoteOperation(_operation: TextOperation): void {
    this.isApplyingRemoteOperation = true;

    try {
      const newText = OperationalTransform.apply( this.currentText, operation);
      
      // Calculate cursor position adjustment
      const currentPosition = this.editor.getPosition(_);
      const newPosition = this.transformCursorPosition( currentPosition, operation);

      // Update editor content
      this.editor.setValue(_newText);
      this.editor.setPosition(_newPosition);
      
      this.currentText = newText;
    } catch (_error) {
      console.error('Failed to apply remote operation:', error);
    } finally {
      this.isApplyingRemoteOperation = false;
    }
  }

  // Transform cursor position based on operation
  private transformCursorPosition( position: any, operation: TextOperation): any {
    // Simplified cursor transformation - in production, this would be more sophisticated
    const line = position.lineNumber;
    const column = position.column;
    
    // This is a basic implementation - real cursor transformation is complex
    // and depends on the specific changes made by the operation
    
    return { lineNumber: line, column: column };
  }

  // Update remote user cursor
  private updateRemoteCursor( userId: string, cursor: any): void {
    if (userId === this.options.userId) return;

    // Clear existing decorations for this user
    this.clearUserDecorations(_userId);

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
    if (_cursor.selection) {
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
      decorations.push(_selectionDecoration);
    }

    const decorationIds = this.editor.deltaDecorations( [], decorations);
    this.cursorDecorations.set( userId, decorationIds);

    // Update typing indicator
    this.updateTypingIndicator( userId, true);
  }

  // Clear decorations for a specific user
  private clearUserDecorations(_userId: string): void {
    const cursorDecorations = this.cursorDecorations.get(_userId);
    if (cursorDecorations) {
      this.editor.deltaDecorations( cursorDecorations, []);
      this.cursorDecorations.delete(_userId);
    }

    const selectionDecorations = this.selectionDecorations.get(_userId);
    if (selectionDecorations) {
      this.editor.deltaDecorations( selectionDecorations, []);
      this.selectionDecorations.delete(_userId);
    }
  }

  // Clear all decorations
  private clearAllDecorations(_): void {
    for (_const userId of this.cursorDecorations.keys()) {
      this.clearUserDecorations(_userId);
    }
  }

  // Update user presence
  private updateUserPresence(_users: CollaborationUser[]): void {
    // Remove decorations for users who left
    for (_const userId of this.cursorDecorations.keys()) {
      if (!users.find(user => user.id === userId)) {
        this.clearUserDecorations(_userId);
        this.onUserLeft?.(_userId);
      }
    }

    // Notify about new users
    users.forEach(user => {
      if (_user.id !== this.options.userId) {
        this.onUserJoined?.(_user);
      }
    });
  }

  // Send typing indicator
  private sendTypingIndicator(_isTyping: boolean): void {
    this.client.sendCursorUpdate({
      position: this.editor.getPosition(_),
      userName: this.options.userName,
      color: this.options.userColor,
      isTyping
    });
  }

  // Schedule typing indicator stop
  private scheduleTypingIndicatorStop(_): void {
    // Clear existing timeout
    const existingTimeout = this.typingIndicators.get(_this.options.userId);
    if (existingTimeout) {
      clearTimeout(_existingTimeout);
    }

    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      this.sendTypingIndicator(_false);
      this.typingIndicators.delete(_this.options.userId);
    }, 2000); // Stop typing indicator after 2 seconds of inactivity

    this.typingIndicators.set( this.options.userId, timeout);
  }

  // Update typing indicator for remote user
  private updateTypingIndicator( userId: string, isTyping: boolean): void {
    this.onTypingIndicator?.( userId, isTyping);

    if (isTyping) {
      // Clear existing timeout
      const existingTimeout = this.typingIndicators.get(_userId);
      if (existingTimeout) {
        clearTimeout(_existingTimeout);
      }

      // Set timeout to automatically stop typing indicator
      const timeout = setTimeout(() => {
        this.onTypingIndicator?.( userId, false);
        this.typingIndicators.delete(_userId);
      }, 5000); // Auto-stop after 5 seconds

      this.typingIndicators.set( userId, timeout);
    } else {
      // Clear timeout and stop indicator
      const timeout = this.typingIndicators.get(_userId);
      if (timeout) {
        clearTimeout(_timeout);
        this.typingIndicators.delete(_userId);
      }
    }
  }

  // Clear all typing indicators
  private clearAllTypingIndicators(_): void {
    for (_const timeout of this.typingIndicators.values()) {
      clearTimeout(_timeout);
    }
    this.typingIndicators.clear(_);
  }

  // Install CSS styles for cursors and selections
  private installCursorStyles(_): void {
    if (_typeof document === 'undefined') return;

    const styleId = 'collaboration-cursor-styles';
    if (_document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .collaboration-cursor {
        position: relative;
        border-left: 2px solid;
        animation: collaboration-cursor-blink 1s infinite;
      }
      
      .collaboration-selection {
        background-color: rgba( 0, 123, 255, 0.2);
        border: 1px solid rgba( 0, 123, 255, 0.4);
      }
      
      @keyframes collaboration-cursor-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      
      .collaboration-cursor::after {
        content: attr(_data-user-name);
        position: absolute;
        top: -20px;
        left: 0;
        background: var( --user-color, #007bff);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        white-space: nowrap;
        z-index: 1000;
      }
    `;
    
    document.head.appendChild(_style);
  }

  // Public methods for external control
  sendCompilationRequest(_code: string): void {
    this.client.sendCompilationRequest(_code);
  }

  getConnectionStatus(_): string {
    return this.client.getConnectionStatus(_);
  }

  isConnected(_): boolean {
    return this.client.isConnected(_);
  }

  // Event handler setters
  onUserJoin(_handler: (user: CollaborationUser) => void): void {
    this.onUserJoined = handler;
  }

  onUserLeave(_handler: (userId: string) => void): void {
    this.onUserLeft = handler;
  }

  onTyping( handler: (userId: string, isTyping: boolean) => void): void {
    this.onTypingIndicator = handler;
  }

  onConnectionStatus(_handler: (status: string) => void): void {
    this.onConnectionStatusChanged = handler;
  }

  onCompilation(_handler: (result: any) => void): void {
    this.onCollaborativeCompilation = handler;
  }
}
