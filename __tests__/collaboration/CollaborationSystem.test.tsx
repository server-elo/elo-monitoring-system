import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { CollaborationProvider, useCollaboration } from '@/lib/context/CollaborationContext';
import { CollaborativeEditor } from '@/lib/collaboration/CollaborativeEditor';
import { OperationalTransform, TextOperation } from '@/lib/collaboration/OperationalTransform';
;
import { UserPresencePanel } from '@/components/collaboration/UserPresencePanel';
import { CollaborationChat } from '@/components/collaboration/CollaborationChat';
import { ConnectionStatusIndicator } from '@/components/collaboration/ConnectionStatusIndicator';

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
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 100);
  }

  send(data: string) {
    // Mock sending data
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

// Mock Monaco Editor
const mockMonaco = {
  Range: class {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number
    ) {}
  },
  editor: {
    TrackedRangeStickiness: {
      NeverGrowsWhenTypingAtEdges: 0
    }
  }
};

const mockEditor = {
  getValue: jest.fn(() => 'contract Test {}'),
  setValue: jest.fn(),
  getPosition: jest.fn(() => ({ lineNumber: 1, column: 1 })),
  setPosition: jest.fn(),
  onDidChangeModelContent: jest.fn(),
  onDidChangeCursorPosition: jest.fn(),
  onDidChangeCursorSelection: jest.fn(),
  onDidFocusEditorText: jest.fn(),
  onDidBlurEditorText: jest.fn(),
  deltaDecorations: jest.fn(() => ['decoration-1'])
};

// Mock global objects
global.WebSocket = MockWebSocket as any;
global.window = {
  ...global.window,
  monaco: mockMonaco
} as any;

describe('Collaboration System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OperationalTransform', () => {
    test('should apply insert operation correctly', () => {
      const text = 'Hello World';
      const operation: TextOperation = {
        ops: [
          { type: 'retain', length: 6 },
          { type: 'insert', text: 'Beautiful ' },
          { type: 'retain', length: 5 }
        ],
        baseLength: 11,
        targetLength: 21
      };

      const result = OperationalTransform.apply(text, operation);
      expect(result).toBe('Hello Beautiful World');
    });

    test('should apply delete operation correctly', () => {
      const text = 'Hello Beautiful World';
      const operation: TextOperation = {
        ops: [
          { type: 'retain', length: 6 },
          { type: 'delete', length: 10 },
          { type: 'retain', length: 5 }
        ],
        baseLength: 21,
        targetLength: 11
      };

      const result = OperationalTransform.apply(text, operation);
      expect(result).toBe('Hello World');
    });

    test('should transform concurrent operations correctly', () => {
      const op1: TextOperation = {
        ops: [{ type: 'insert', text: 'A' }],
        baseLength: 0,
        targetLength: 1
      };

      const op2: TextOperation = {
        ops: [{ type: 'insert', text: 'B' }],
        baseLength: 0,
        targetLength: 1
      };

      const [transformed1, transformed2] = OperationalTransform.transform(op1, op2, 'left');

      expect(transformed1.ops).toEqual([{ type: 'insert', text: 'A' }]);
      expect(transformed2.ops).toEqual([
        { type: 'retain', length: 1 },
        { type: 'insert', text: 'B' }
      ]);
    });

    test('should compose sequential operations', () => {
      const op1: TextOperation = {
        ops: [{ type: 'insert', text: 'Hello' }],
        baseLength: 0,
        targetLength: 5
      };

      const op2: TextOperation = {
        ops: [
          { type: 'retain', length: 5 },
          { type: 'insert', text: ' World' }
        ],
        baseLength: 5,
        targetLength: 11
      };

      const composed = OperationalTransform.compose(op1, op2);
      expect(composed.ops).toEqual([{ type: 'insert', text: 'Hello World' }]);
      expect(composed.baseLength).toBe(0);
      expect(composed.targetLength).toBe(11);
    });

    test('should create operation from text changes', () => {
      const oldText = 'Hello World';
      const newText = 'Hello Beautiful World';

      const operation = OperationalTransform.fromTextChange(oldText, newText);

      expect(operation.baseLength).toBe(11);
      expect(operation.targetLength).toBe(21);
      expect(operation.ops).toEqual([
        { type: 'retain', length: 6 },
        { type: 'insert', text: 'Beautiful ' },
        { type: 'retain', length: 5 }
      ]);
    });

    test('should invert operations correctly', () => {
      const text = 'Hello World';
      const operation: TextOperation = {
        ops: [
          { type: 'retain', length: 6 },
          { type: 'insert', text: 'Beautiful ' }
        ],
        baseLength: 11,
        targetLength: 21
      };

      const inverted = OperationalTransform.invert(operation, text);
      expect(inverted.ops).toEqual([
        { type: 'retain', length: 6 },
        { type: 'delete', length: 10 }
      ]);
    });
  });

  describe('CollaborativeEditor', () => {
    test('should initialize collaborative editor', async () => {
      const collaborativeEditor = new CollaborativeEditor(
        mockEditor,
        mockMonaco,
        {
          wsUrl: 'ws://localhost:8080',
          userId: 'user1',
          sessionId: 'session1',
          userName: 'Test User',
          userColor: '#007bff',
          enableCursorSync: true,
          enableSelectionSync: true,
          debounceMs: 300
        }
      );

      await expect(collaborativeEditor.initialize()).resolves.not.toThrow();
      expect(collaborativeEditor.isConnected()).toBe(false); // Initially disconnected
    });

    test('should handle cursor updates', () => {
      const collaborativeEditor = new CollaborativeEditor(
        mockEditor,
        mockMonaco,
        {
          wsUrl: 'ws://localhost:8080',
          userId: 'user1',
          sessionId: 'session1',
          userName: 'Test User',
          userColor: '#007bff',
          enableCursorSync: true,
          enableSelectionSync: true,
          debounceMs: 300
        }
      );

      const mockCursor = {
        position: { lineNumber: 1, column: 5 },
        userName: 'Other User',
        color: '#ff0000'
      };

      // This would normally be called by the collaboration client
      collaborativeEditor['updateRemoteCursor']('user2', mockCursor);

      expect(mockEditor.deltaDecorations).toHaveBeenCalled();
    });
  });

  describe('CollaborationProvider', () => {
    const TestComponent = () => {
      const { state, actions } = useCollaboration();
      
      return (
        <div>
          <div data-testid="session-id">{state.sessionId}</div>
          <div data-testid="is-enabled">{state.isEnabled.toString()}</div>
          <div data-testid="user-count">{state.users.length}</div>
          <button 
            data-testid="start-collaboration"
            onClick={() => actions.startCollaboration('test-session')}
          >
            Start Collaboration
          </button>
          <button 
            data-testid="send-message"
            onClick={() => actions.sendChatMessage('Hello World')}
          >
            Send Message
          </button>
        </div>
      );
    };

    test('should provide collaboration context', () => {
      render(
        <CollaborationProvider
          userId="user1"
          userName="Test User"
          userEmail="test@example.com"
        >
          <TestComponent />
        </CollaborationProvider>
      );

      expect(screen.getByTestId('session-id')).toHaveTextContent('');
      expect(screen.getByTestId('is-enabled')).toHaveTextContent('false');
      expect(screen.getByTestId('user-count')).toHaveTextContent('0');
    });

    test('should start collaboration session', async () => {
      render(
        <CollaborationProvider
          userId="user1"
          userName="Test User"
          userEmail="test@example.com"
        >
          <TestComponent />
        </CollaborationProvider>
      );

      const startButton = screen.getByTestId('start-collaboration');
      
      await act(async () => {
        fireEvent.click(startButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('session-id')).toHaveTextContent('test-session');
        expect(screen.getByTestId('is-enabled')).toHaveTextContent('true');
      });
    });
  });

  describe('UserPresencePanel', () => {
    const mockUsers = [
      {
        id: 'user1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'instructor' as const,
        status: 'online' as const,
        lastActivity: new Date(),
        color: '#007bff'
      },
      {
        id: 'user2',
        name: 'Bob',
        email: 'bob@example.com',
        role: 'student' as const,
        status: 'idle' as const,
        lastActivity: new Date(),
        color: '#28a745'
      }
    ];

    test('should render user presence panel', () => {
      render(
        <UserPresencePanel
          users={mockUsers}
          currentUserId="user1"
          sessionDuration={300}
          isConnected={true}
        />
      );

      expect(screen.getByText('Participants')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('(1 online)')).toBeInTheDocument();
    });

    test('should show compact view', () => {
      render(
        <UserPresencePanel
          users={mockUsers}
          currentUserId="user1"
          sessionDuration={300}
          isConnected={true}
          compact={true}
        />
      );

      expect(screen.queryByText('Participants')).not.toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Online count
    });
  });

  describe('CollaborationChat', () => {
    const mockMessages = [
      {
        id: 'msg1',
        userId: 'user1',
        userName: 'Alice',
        userColor: '#007bff',
        content: 'Hello everyone!',
        type: 'text' as const,
        timestamp: new Date()
      },
      {
        id: 'msg2',
        userId: 'user2',
        userName: 'Bob',
        userColor: '#28a745',
        content: 'Hi Alice!',
        type: 'text' as const,
        timestamp: new Date()
      }
    ];

    test('should render chat messages', () => {
      render(
        <CollaborationChat
          messages={mockMessages}
          currentUserId="user1"
          currentUserName="Alice"
          isConnected={true}
          onSendMessage={jest.fn()}
        />
      );

      expect(screen.getByText('Chat')).toBeInTheDocument();
      expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
      expect(screen.getByText('Hi Alice!')).toBeInTheDocument();
    });

    test('should send chat message', () => {
      const mockSendMessage = jest.fn();
      
      render(
        <CollaborationChat
          messages={mockMessages}
          currentUserId="user1"
          currentUserName="Alice"
          isConnected={true}
          onSendMessage={mockSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'New message' } });
      fireEvent.click(sendButton);

      expect(mockSendMessage).toHaveBeenCalledWith('New message', 'text');
    });
  });

  describe('ConnectionStatusIndicator', () => {
    test('should show connected status', () => {
      render(
        <ConnectionStatusIndicator
          status="connected"
          latency={50}
          pendingOperations={0}
          queuedMessages={0}
        />
      );

      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('50ms')).toBeInTheDocument();
    });

    test('should show disconnected status with reconnect button', () => {
      const mockReconnect = jest.fn();
      
      render(
        <ConnectionStatusIndicator
          status="disconnected"
          latency={0}
          pendingOperations={5}
          queuedMessages={2}
          onReconnect={mockReconnect}
        />
      );

      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      expect(screen.getByText('7 pending')).toBeInTheDocument();
      
      const reconnectButton = screen.getByTitle('Reconnect');
      fireEvent.click(reconnectButton);
      
      expect(mockReconnect).toHaveBeenCalled();
    });
  });
});
