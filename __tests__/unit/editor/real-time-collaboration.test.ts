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

  constructor(_public url: string) {
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(_new Event('open'));
    }, 10);
  }

  send(_data: string) {
    // Mock sending data
    console.log('WebSocket send:', data);
  }

  close(_) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(_new CloseEvent('close'));
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

// Mock Monaco Editor
const mockEditor = {
  getValue: jest.fn(() => 'pragma solidity ^0.8.0;'),
  setValue: jest.fn(_),
  onDidChangeModelContent: jest.fn(_),
  onDidChangeCursorPosition: jest.fn(_),
  onDidChangeCursorSelection: jest.fn(_),
  getModel: jest.fn(() => ({
    onDidChangeContent: jest.fn(_),
    setValue: jest.fn(_),
    getValue: jest.fn(() => 'pragma solidity ^0.8.0;'),
    getLineCount: jest.fn(() => 10),
    getLineContent: jest.fn((line: number) => `Line ${line}`)
  })),
  deltaDecorations: jest.fn(() => []),
  setPosition: jest.fn(_),
  revealLine: jest.fn(_),
  focus: jest.fn(_),
  dispose: jest.fn(_)
};

const mockMonaco = {
  editor: {
    create: jest.fn(() => mockEditor),
    defineTheme: jest.fn(_),
    setTheme: jest.fn(_)
  },
  Range: jest.fn( (startLine, startCol, endLine, endCol) => ({
    startLineNumber: startLine,
    startColumn: startCol,
    endLineNumber: endLine,
    endColumn: endCol
  })),
  Selection: jest.fn(_)
};

describe( 'Real-time Collaboration System - Comprehensive Test Suite', () => {
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
    jest.clearAllMocks(_);
    jest.useFakeTimers(_);
  });

  afterEach(() => {
    if (collaborativeEditor) {
      collaborativeEditor.dispose(_);
    }
    jest.useRealTimers(_);
    jest.restoreAllMocks(_);
  });

  describe( 'Collaborative Editor Initialization', () => {
    it( 'should initialize collaborative editor with correct options', () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);

      expect(_collaborativeEditor).toBeInstanceOf(_CollaborativeEditor);
      expect(_collaborativeEditor['options']).toEqual(_mockOptions);
    });

    it( 'should establish WebSocket connection', async () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);

      await collaborativeEditor.initialize(_);

      // WebSocket should be connected
      expect(_collaborativeEditor['client']).toBeDefined(_);
    });

    it( 'should setup editor event listeners', () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);

      expect(_mockEditor.onDidChangeModelContent).toHaveBeenCalled(_);
      expect(_mockEditor.onDidChangeCursorPosition).toHaveBeenCalled(_);
      expect(_mockEditor.onDidChangeCursorSelection).toHaveBeenCalled(_);
    });

    it( 'should handle initialization errors gracefully', async () => {
      const failingOptions = { ...mockOptions, wsUrl: 'invalid-url' };
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, failingOptions);

      await expect(_collaborativeEditor.initialize()).resolves.not.toThrow(_);
    });
  });

  describe( 'Real-time Text Synchronization', () => {
    beforeEach( async () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);
      await collaborativeEditor.initialize(_);
    });

    it( 'should send text changes to other collaborators', () => {
      const mockSend = jest.spyOn( collaborativeEditor['client'], 'sendOperation');
      
      // Simulate text change
      const changeEvent = {
        changes: [{
          range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
          text: 'new text',
          rangeLength: 0
        }]
      };

      collaborativeEditor['handleTextChange'](_changeEvent);

      expect(_mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'text-change',
        changes: expect.any(_Array)
      }));
    });

    it( 'should apply remote text changes to local editor', () => {
      const remoteOperation = {
        type: 'text-change',
        userId: 'remote-user',
        changes: [{
          range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
          text: 'remote text'
        }]
      };

      collaborativeEditor['applyRemoteOperation'](_remoteOperation);

      expect(_mockEditor.getModel().setValue).toHaveBeenCalled(_);
    });

    it( 'should handle conflicting changes with operational transformation', () => {
      const localChange = {
        range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 },
        text: 'local'
      };

      const remoteChange = {
        range: { startLineNumber: 1, startColumn: 3, endLineNumber: 1, endColumn: 7 },
        text: 'remote'
      };

      // Apply both changes
      collaborativeEditor['handleTextChange']({ changes: [localChange]  });
      collaborativeEditor['applyRemoteOperation']({
        type: 'text-change',
        userId: 'remote-user',
        changes: [remoteChange]
      });

      // Should resolve conflicts using operational transformation
      expect(_mockEditor.getModel().setValue).toHaveBeenCalled(_);
    });

    it( 'should debounce rapid text changes', () => {
      const mockSend = jest.spyOn( collaborativeEditor['client'], 'sendOperation');
      
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
      expect(_mockSend).toHaveBeenCalledTimes(1);

      // Advance timers to trigger debounced calls
      jest.advanceTimersByTime(300);

      expect(_mockSend).toHaveBeenCalledTimes(5);
    });
  });

  describe( 'Cursor and Selection Synchronization', () => {
    beforeEach( async () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);
      await collaborativeEditor.initialize(_);
    });

    it( 'should send cursor position changes', () => {
      const mockSend = jest.spyOn( collaborativeEditor['client'], 'sendOperation');
      
      const cursorEvent = {
        position: { lineNumber: 5, column: 10 }
      };

      collaborativeEditor['handleCursorChange'](_cursorEvent);

      expect(_mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'cursor-change',
        position: { lineNumber: 5, column: 10 }
      }));
    });

    it( 'should display remote cursors', () => {
      const remoteCursor = {
        type: 'cursor-change',
        userId: 'remote-user',
        userName: 'Remote User',
        userColor: '#ff0000',
        position: { lineNumber: 3, column: 5 }
      };

      collaborativeEditor['applyRemoteOperation'](_remoteCursor);

      expect(_mockEditor.deltaDecorations).toHaveBeenCalledWith(
        [],
        expect.arrayContaining([
          expect.objectContaining({
            range: expect.any(_Object),
            options: expect.objectContaining({
              className: expect.stringContaining('cursor')
            })
          })
        ])
      );
    });

    it( 'should handle selection changes', () => {
      const mockSend = jest.spyOn( collaborativeEditor['client'], 'sendOperation');
      
      const selectionEvent = {
        selection: {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 2,
          endColumn: 10
        }
      };

      collaborativeEditor['handleSelectionChange'](_selectionEvent);

      expect(_mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'selection-change',
        selection: expect.any(_Object)
      }));
    });

    it( 'should display remote selections', () => {
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

      collaborativeEditor['applyRemoteOperation'](_remoteSelection);

      expect(_mockEditor.deltaDecorations).toHaveBeenCalledWith(
        [],
        expect.arrayContaining([
          expect.objectContaining({
            range: expect.any(_Object),
            options: expect.objectContaining({
              className: expect.stringContaining('selection')
            })
          })
        ])
      );
    });
  });

  describe( 'User Presence Management', () => {
    beforeEach( async () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);
      await collaborativeEditor.initialize(_);
    });

    it( 'should handle user join events', () => {
      const mockOnUserJoin = jest.fn(_);
      collaborativeEditor.onUserJoin(_mockOnUserJoin);

      const userJoinEvent = {
        type: 'user-join',
        user: {
          id: 'new-user',
          name: 'New User',
          color: '#ff00ff'
        }
      };

      collaborativeEditor['handleUserEvent'](_userJoinEvent);

      expect(_mockOnUserJoin).toHaveBeenCalledWith(_userJoinEvent.user);
    });

    it( 'should handle user leave events', () => {
      const mockOnUserLeave = jest.fn(_);
      collaborativeEditor.onUserLeave(_mockOnUserLeave);

      const userLeaveEvent = {
        type: 'user-leave',
        userId: 'leaving-user'
      };

      collaborativeEditor['handleUserEvent'](_userLeaveEvent);

      expect(_mockOnUserLeave).toHaveBeenCalledWith('leaving-user');
    });

    it( 'should clean up user decorations when user leaves', () => {
      // Add user decorations
      const userJoinEvent = {
        type: 'user-join',
        user: { id: 'temp-user', name: 'Temp User', color: '#123456' }
      };
      collaborativeEditor['handleUserEvent'](_userJoinEvent);

      // User leaves
      const userLeaveEvent = {
        type: 'user-leave',
        userId: 'temp-user'
      };
      collaborativeEditor['handleUserEvent'](_userLeaveEvent);

      // Decorations should be cleaned up
      expect(_mockEditor.deltaDecorations).toHaveBeenCalledWith(
        expect.any(_Array),
        []
      );
    });

    it( 'should handle typing indicators', () => {
      const mockOnTyping = jest.fn(_);
      collaborativeEditor.onTypingIndicator(_mockOnTyping);

      const typingEvent = {
        type: 'typing-indicator',
        userId: 'typing-user',
        isTyping: true
      };

      collaborativeEditor['handleUserEvent'](_typingEvent);

      expect(_mockOnTyping).toHaveBeenCalledWith( 'typing-user', true);
    });
  });

  describe( 'Connection Management', () => {
    it( 'should handle connection loss', () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);
      const mockOnConnectionChange = jest.fn(_);
      collaborativeEditor.onConnectionStatusChange(_mockOnConnectionChange);

      // Simulate connection loss
      collaborativeEditor['client']['ws'].close(_);

      expect(_mockOnConnectionChange).toHaveBeenCalledWith('disconnected');
    });

    it( 'should attempt reconnection on connection loss', async () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);
      await collaborativeEditor.initialize(_);

      const mockReconnect = jest.spyOn( collaborativeEditor['client'], 'reconnect');

      // Simulate connection loss
      collaborativeEditor['client']['ws'].close(_);

      // Should attempt reconnection
      jest.advanceTimersByTime(5000);

      expect(_mockReconnect).toHaveBeenCalled(_);
    });

    it( 'should queue operations during disconnection', () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);
      
      // Disconnect
      collaborativeEditor['client']['isConnected'] = false;

      // Try to send operation
      const operation = {
        type: 'text-change',
        changes: [{ range: {}, text: 'test' }]
      };

      collaborativeEditor['client'].sendOperation(_operation);

      // Operation should be queued
      expect(_collaborativeEditor['client']['operationQueue']).toContain(_operation);
    });

    it( 'should flush queued operations on reconnection', () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);
      
      // Queue operations while disconnected
      collaborativeEditor['client']['isConnected'] = false;
      collaborativeEditor['client'].sendOperation({ type: 'test-op'  });

      // Reconnect
      collaborativeEditor['client']['isConnected'] = true;
      collaborativeEditor['client']['flushOperationQueue'](_);

      // Queue should be empty
      expect(_collaborativeEditor['client']['operationQueue']).toHaveLength(0);
    });
  });

  describe( 'Performance and Optimization', () => {
    beforeEach( async () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);
      await collaborativeEditor.initialize(_);
    });

    it( 'should handle high-frequency operations efficiently', () => {
      const startTime = performance.now(_);

      // Simulate many rapid operations
      for (let i = 0; i < 100; i++) {
        collaborativeEditor['handleTextChange']({
          changes: [{
            range: { startLineNumber: 1, startColumn: i, endLineNumber: 1, endColumn: i },
            text: `char${i}`
          }]
        });
      }

      const endTime = performance.now(_);
      const duration = endTime - startTime;

      expect(_duration).toBeLessThan(100); // Should handle efficiently
    });

    it( 'should limit decoration updates for performance', () => {
      // Add many remote cursors
      for (let i = 0; i < 50; i++) {
        collaborativeEditor['applyRemoteOperation']({
          type: 'cursor-change',
          userId: `user-${i}`,
          position: { lineNumber: i + 1, column: 1 }
        });
      }

      // Should batch decoration updates
      expect(_mockEditor.deltaDecorations).toHaveBeenCalled(_);
    });

    it( 'should clean up old operations to prevent memory leaks', () => {
      // Simulate many operations over time
      for (let i = 0; i < 1000; i++) {
        collaborativeEditor['addToHistory']({
          type: 'text-change',
          timestamp: Date.now(_) - i * 1000
        });
      }

      // Should clean up old operations
      collaborativeEditor['cleanupHistory'](_);

      expect(_collaborativeEditor['operationHistory'].length).toBeLessThan(1000);
    });
  });

  describe( 'Error Handling and Recovery', () => {
    it( 'should handle malformed operations gracefully', () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);

      const malformedOperation = {
        type: 'invalid-type',
        data: null
      };

      expect(() => {
        collaborativeEditor['applyRemoteOperation'](_malformedOperation);
      }).not.toThrow(_);
    });

    it( 'should recover from editor errors', () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);

      // Mock editor error
      mockEditor.getModel(_).setValue.mockImplementation(() => {
        throw new Error('Editor error');
      });

      expect(() => {
        collaborativeEditor['applyRemoteOperation']({
          type: 'text-change',
          changes: [{ range: {}, text: 'test' }]
        });
      }).not.toThrow(_);
    });

    it( 'should handle WebSocket errors', () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);
      const mockOnError = jest.fn(_);
      collaborativeEditor.onConnectionStatusChange(_mockOnError);

      // Simulate WebSocket error
      collaborativeEditor['client']['ws'].onerror?.(_new Event('error'));

      expect(_mockOnError).toHaveBeenCalledWith('error');
    });
  });

  describe( 'Resource Cleanup', () => {
    it( 'should dispose resources properly', () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);

      collaborativeEditor.dispose(_);

      expect(_collaborativeEditor['client']['ws'].close).toHaveBeenCalled(_);
      expect(_collaborativeEditor['disposed']).toBe(_true);
    });

    it( 'should remove all decorations on dispose', () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);

      // Add some decorations
      collaborativeEditor['userDecorations'].set( 'user1', ['decoration1']);

      collaborativeEditor.dispose(_);

      expect(_mockEditor.deltaDecorations).toHaveBeenCalledWith(
        ['decoration1'],
        []
      );
    });

    it( 'should clear all timers on dispose', () => {
      collaborativeEditor = new CollaborativeEditor( mockEditor, mockMonaco, mockOptions);

      const clearTimeoutSpy = jest.spyOn( global, 'clearTimeout');

      collaborativeEditor.dispose(_);

      expect(_clearTimeoutSpy).toHaveBeenCalled(_);
    });
  });
});
