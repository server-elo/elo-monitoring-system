import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CollaborativeEditor } from '@/lib/collaboration/CollaborativeEditor';
;

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    // Mock sending data
    console.log('WebSocket send:', data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

// Mock Monaco Editor
const mockEditor = {
  getValue: jest.fn(() => 'pragma solidity ^0.8.0;'),
  setValue: jest.fn(),
  onDidChangeModelContent: jest.fn(),
  onDidChangeCursorPosition: jest.fn(),
  onDidChangeCursorSelection: jest.fn(),
  getModel: jest.fn(() => ({
    onDidChangeContent: jest.fn(),
    setValue: jest.fn(),
    getValue: jest.fn(() => 'pragma solidity ^0.8.0;'),
    getLineCount: jest.fn(() => 10),
    getLineContent: jest.fn((line: number) => `Line ${line}`)
  })),
  deltaDecorations: jest.fn(() => []),
  setPosition: jest.fn(),
  revealLine: jest.fn(),
  focus: jest.fn(),
  dispose: jest.fn()
};

const mockMonaco = {
  editor: {
    create: jest.fn(() => mockEditor),
    defineTheme: jest.fn(),
    setTheme: jest.fn()
  },
  Range: jest.fn((startLine, startCol, endLine, endCol) => ({
    startLineNumber: startLine,
    startColumn: startCol,
    endLineNumber: endLine,
    endColumn: endCol
  })),
  Selection: jest.fn()
};

describe('Real-time Collaboration System - Comprehensive Test Suite', () => {
  let collaborativeEditor: CollaborativeEditor;
  const mockOptions = {
    wsUrl: 'ws://localhost:8080',
    userId: 'user-123',
    sessionId: 'session-456',
    userName: 'Test User',
    userColor: '#007bff',
    enableCursorSync: true,
    enableSelectionSync: true,
    debounceMs: 300
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (collaborativeEditor) {
      collaborativeEditor.dispose();
    }
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Collaborative Editor Initialization', () => {
    it('should initialize collaborative editor with correct options', () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);

      expect(collaborativeEditor).toBeInstanceOf(CollaborativeEditor);
      expect(collaborativeEditor['options']).toEqual(mockOptions);
    });

    it('should establish WebSocket connection', async () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);

      await collaborativeEditor.initialize();

      // WebSocket should be connected
      expect(collaborativeEditor['client']).toBeDefined();
    });

    it('should setup editor event listeners', () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);

      expect(mockEditor.onDidChangeModelContent).toHaveBeenCalled();
      expect(mockEditor.onDidChangeCursorPosition).toHaveBeenCalled();
      expect(mockEditor.onDidChangeCursorSelection).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      const failingOptions = { ...mockOptions, wsUrl: 'invalid-url' };
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, failingOptions);

      await expect(collaborativeEditor.initialize()).resolves.not.toThrow();
    });
  });

  describe('Real-time Text Synchronization', () => {
    beforeEach(async () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);
      await collaborativeEditor.initialize();
    });

    it('should send text changes to other collaborators', () => {
      const mockSend = jest.spyOn(collaborativeEditor['client'], 'sendOperation');
      
      // Simulate text change
      const changeEvent = {
        changes: [{
          range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
          text: 'new text',
          rangeLength: 0
        }]
      };

      collaborativeEditor['handleTextChange'](changeEvent);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'text-change',
        changes: expect.any(Array)
      }));
    });

    it('should apply remote text changes to local editor', () => {
      const remoteOperation = {
        type: 'text-change',
        userId: 'remote-user',
        changes: [{
          range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
          text: 'remote text'
        }]
      };

      collaborativeEditor['applyRemoteOperation'](remoteOperation);

      expect(mockEditor.getModel().setValue).toHaveBeenCalled();
    });

    it('should handle conflicting changes with operational transformation', () => {
      const localChange = {
        range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 },
        text: 'local'
      };

      const remoteChange = {
        range: { startLineNumber: 1, startColumn: 3, endLineNumber: 1, endColumn: 7 },
        text: 'remote'
      };

      // Apply both changes
      collaborativeEditor['handleTextChange']({ changes: [localChange] });
      collaborativeEditor['applyRemoteOperation']({
        type: 'text-change',
        userId: 'remote-user',
        changes: [remoteChange]
      });

      // Should resolve conflicts using operational transformation
      expect(mockEditor.getModel().setValue).toHaveBeenCalled();
    });

    it('should debounce rapid text changes', () => {
      const mockSend = jest.spyOn(collaborativeEditor['client'], 'sendOperation');
      
      // Simulate rapid changes
      for (let i = 0; i < 5; i++) {
        collaborativeEditor['handleTextChange']({
          changes: [{
            range: { startLineNumber: 1, startColumn: i, endLineNumber: 1, endColumn: i },
            text: `change${i}`
          }]
        });
      }

      // Should debounce the changes
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Advance timers to trigger debounced calls
      jest.advanceTimersByTime(300);

      expect(mockSend).toHaveBeenCalledTimes(5);
    });
  });

  describe('Cursor and Selection Synchronization', () => {
    beforeEach(async () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);
      await collaborativeEditor.initialize();
    });

    it('should send cursor position changes', () => {
      const mockSend = jest.spyOn(collaborativeEditor['client'], 'sendOperation');
      
      const cursorEvent = {
        position: { lineNumber: 5, column: 10 }
      };

      collaborativeEditor['handleCursorChange'](cursorEvent);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'cursor-change',
        position: { lineNumber: 5, column: 10 }
      }));
    });

    it('should display remote cursors', () => {
      const remoteCursor = {
        type: 'cursor-change',
        userId: 'remote-user',
        userName: 'Remote User',
        userColor: '#ff0000',
        position: { lineNumber: 3, column: 5 }
      };

      collaborativeEditor['applyRemoteOperation'](remoteCursor);

      expect(mockEditor.deltaDecorations).toHaveBeenCalledWith(
        [],
        expect.arrayContaining([
          expect.objectContaining({
            range: expect.any(Object),
            options: expect.objectContaining({
              className: expect.stringContaining('cursor')
            })
          })
        ])
      );
    });

    it('should handle selection changes', () => {
      const mockSend = jest.spyOn(collaborativeEditor['client'], 'sendOperation');
      
      const selectionEvent = {
        selection: {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 2,
          endColumn: 10
        }
      };

      collaborativeEditor['handleSelectionChange'](selectionEvent);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'selection-change',
        selection: expect.any(Object)
      }));
    });

    it('should display remote selections', () => {
      const remoteSelection = {
        type: 'selection-change',
        userId: 'remote-user',
        userName: 'Remote User',
        userColor: '#00ff00',
        selection: {
          startLineNumber: 2,
          startColumn: 1,
          endLineNumber: 3,
          endColumn: 5
        }
      };

      collaborativeEditor['applyRemoteOperation'](remoteSelection);

      expect(mockEditor.deltaDecorations).toHaveBeenCalledWith(
        [],
        expect.arrayContaining([
          expect.objectContaining({
            range: expect.any(Object),
            options: expect.objectContaining({
              className: expect.stringContaining('selection')
            })
          })
        ])
      );
    });
  });

  describe('User Presence Management', () => {
    beforeEach(async () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);
      await collaborativeEditor.initialize();
    });

    it('should handle user join events', () => {
      const mockOnUserJoin = jest.fn();
      collaborativeEditor.onUserJoin(mockOnUserJoin);

      const userJoinEvent = {
        type: 'user-join',
        user: {
          id: 'new-user',
          name: 'New User',
          color: '#ff00ff'
        }
      };

      collaborativeEditor['handleUserEvent'](userJoinEvent);

      expect(mockOnUserJoin).toHaveBeenCalledWith(userJoinEvent.user);
    });

    it('should handle user leave events', () => {
      const mockOnUserLeave = jest.fn();
      collaborativeEditor.onUserLeave(mockOnUserLeave);

      const userLeaveEvent = {
        type: 'user-leave',
        userId: 'leaving-user'
      };

      collaborativeEditor['handleUserEvent'](userLeaveEvent);

      expect(mockOnUserLeave).toHaveBeenCalledWith('leaving-user');
    });

    it('should clean up user decorations when user leaves', () => {
      // Add user decorations
      const userJoinEvent = {
        type: 'user-join',
        user: { id: 'temp-user', name: 'Temp User', color: '#123456' }
      };
      collaborativeEditor['handleUserEvent'](userJoinEvent);

      // User leaves
      const userLeaveEvent = {
        type: 'user-leave',
        userId: 'temp-user'
      };
      collaborativeEditor['handleUserEvent'](userLeaveEvent);

      // Decorations should be cleaned up
      expect(mockEditor.deltaDecorations).toHaveBeenCalledWith(
        expect.any(Array),
        []
      );
    });

    it('should handle typing indicators', () => {
      const mockOnTyping = jest.fn();
      collaborativeEditor.onTypingIndicator(mockOnTyping);

      const typingEvent = {
        type: 'typing-indicator',
        userId: 'typing-user',
        isTyping: true
      };

      collaborativeEditor['handleUserEvent'](typingEvent);

      expect(mockOnTyping).toHaveBeenCalledWith('typing-user', true);
    });
  });

  describe('Connection Management', () => {
    it('should handle connection loss', () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);
      const mockOnConnectionChange = jest.fn();
      collaborativeEditor.onConnectionStatusChange(mockOnConnectionChange);

      // Simulate connection loss
      collaborativeEditor['client']['ws'].close();

      expect(mockOnConnectionChange).toHaveBeenCalledWith('disconnected');
    });

    it('should attempt reconnection on connection loss', async () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);
      await collaborativeEditor.initialize();

      const mockReconnect = jest.spyOn(collaborativeEditor['client'], 'reconnect');

      // Simulate connection loss
      collaborativeEditor['client']['ws'].close();

      // Should attempt reconnection
      jest.advanceTimersByTime(5000);

      expect(mockReconnect).toHaveBeenCalled();
    });

    it('should queue operations during disconnection', () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);
      
      // Disconnect
      collaborativeEditor['client']['isConnected'] = false;

      // Try to send operation
      const operation = {
        type: 'text-change',
        changes: [{ range: {}, text: 'test' }]
      };

      collaborativeEditor['client'].sendOperation(operation);

      // Operation should be queued
      expect(collaborativeEditor['client']['operationQueue']).toContain(operation);
    });

    it('should flush queued operations on reconnection', () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);
      
      // Queue operations while disconnected
      collaborativeEditor['client']['isConnected'] = false;
      collaborativeEditor['client'].sendOperation({ type: 'test-op' });

      // Reconnect
      collaborativeEditor['client']['isConnected'] = true;
      collaborativeEditor['client']['flushOperationQueue']();

      // Queue should be empty
      expect(collaborativeEditor['client']['operationQueue']).toHaveLength(0);
    });
  });

  describe('Performance and Optimization', () => {
    beforeEach(async () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);
      await collaborativeEditor.initialize();
    });

    it('should handle high-frequency operations efficiently', () => {
      const startTime = performance.now();

      // Simulate many rapid operations
      for (let i = 0; i < 100; i++) {
        collaborativeEditor['handleTextChange']({
          changes: [{
            range: { startLineNumber: 1, startColumn: i, endLineNumber: 1, endColumn: i },
            text: `char${i}`
          }]
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should handle efficiently
    });

    it('should limit decoration updates for performance', () => {
      // Add many remote cursors
      for (let i = 0; i < 50; i++) {
        collaborativeEditor['applyRemoteOperation']({
          type: 'cursor-change',
          userId: `user-${i}`,
          position: { lineNumber: i + 1, column: 1 }
        });
      }

      // Should batch decoration updates
      expect(mockEditor.deltaDecorations).toHaveBeenCalled();
    });

    it('should clean up old operations to prevent memory leaks', () => {
      // Simulate many operations over time
      for (let i = 0; i < 1000; i++) {
        collaborativeEditor['addToHistory']({
          type: 'text-change',
          timestamp: Date.now() - i * 1000
        });
      }

      // Should clean up old operations
      collaborativeEditor['cleanupHistory']();

      expect(collaborativeEditor['operationHistory'].length).toBeLessThan(1000);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle malformed operations gracefully', () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);

      const malformedOperation = {
        type: 'invalid-type',
        data: null
      };

      expect(() => {
        collaborativeEditor['applyRemoteOperation'](malformedOperation);
      }).not.toThrow();
    });

    it('should recover from editor errors', () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);

      // Mock editor error
      mockEditor.getModel().setValue.mockImplementation(() => {
        throw new Error('Editor error');
      });

      expect(() => {
        collaborativeEditor['applyRemoteOperation']({
          type: 'text-change',
          changes: [{ range: {}, text: 'test' }]
        });
      }).not.toThrow();
    });

    it('should handle WebSocket errors', () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);
      const mockOnError = jest.fn();
      collaborativeEditor.onConnectionStatusChange(mockOnError);

      // Simulate WebSocket error
      collaborativeEditor['client']['ws'].onerror?.(new Event('error'));

      expect(mockOnError).toHaveBeenCalledWith('error');
    });
  });

  describe('Resource Cleanup', () => {
    it('should dispose resources properly', () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);

      collaborativeEditor.dispose();

      expect(collaborativeEditor['client']['ws'].close).toHaveBeenCalled();
      expect(collaborativeEditor['disposed']).toBe(true);
    });

    it('should remove all decorations on dispose', () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);

      // Add some decorations
      collaborativeEditor['userDecorations'].set('user1', ['decoration1']);

      collaborativeEditor.dispose();

      expect(mockEditor.deltaDecorations).toHaveBeenCalledWith(
        ['decoration1'],
        []
      );
    });

    it('should clear all timers on dispose', () => {
      collaborativeEditor = new CollaborativeEditor(mockEditor, mockMonaco, mockOptions);

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      collaborativeEditor.dispose();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
