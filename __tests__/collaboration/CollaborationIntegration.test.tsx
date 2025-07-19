import { render, screen, fireEvent, waitFor } from '@testing-library/react';
;
import InteractiveCodeEditor from '@/components/learning/InteractiveCodeEditor';
import { CollaborationProvider } from '@/lib/context/CollaborationContext';
import { LearningProvider } from '@/lib/context/LearningContext';
import { ErrorProvider } from '@/lib/errors/ErrorContext';

// Mock Monaco Editor
const mockMonaco = {
  editor: {
    create: jest.fn(() => ({
      getValue: jest.fn(() => 'contract Test {}'),
      setValue: jest.fn(),
      getPosition: jest.fn(() => ({ lineNumber: 1, column: 1 })),
      setPosition: jest.fn(),
      onDidChangeModelContent: jest.fn(),
      onDidChangeCursorPosition: jest.fn(),
      onDidChangeCursorSelection: jest.fn(),
      onDidFocusEditorText: jest.fn(),
      onDidBlurEditorText: jest.fn(),
      deltaDecorations: jest.fn(() => ['decoration-1']),
      dispose: jest.fn(),
      layout: jest.fn(),
      focus: jest.fn()
    })),
    defineTheme: jest.fn(),
    setTheme: jest.fn()
  },
  languages: {
    register: jest.fn(),
    setMonarchTokensProvider: jest.fn(),
    setLanguageConfiguration: jest.fn(),
    registerCompletionItemProvider: jest.fn(),
    registerHoverProvider: jest.fn()
  },
  Range: class {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number
    ) {}
  }
};

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

// Mock global objects
global.WebSocket = MockWebSocket as any;
global.window = {
  ...global.window,
  monaco: mockMonaco
} as any;

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    result: {
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          get: jest.fn(() => ({ onsuccess: null, result: null })),
          put: jest.fn(() => ({ onsuccess: null })),
          delete: jest.fn(() => ({ onsuccess: null }))
        }))
      }))
    }
  }))
};

global.indexedDB = mockIndexedDB as any;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorProvider>
    <LearningProvider>
      <CollaborationProvider
        userId="test-user"
        userName="Test User"
        userEmail="test@example.com"
      >
        {children}
      </CollaborationProvider>
    </LearningProvider>
  </ErrorProvider>
);

describe('Collaboration Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render editor with collaboration disabled', () => {
    render(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test {}"
          language="solidity"
          enableCollaboration={false}
        />
      </TestWrapper>
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByText('Show Collaboration')).not.toBeInTheDocument();
  });

  test('should render editor with collaboration enabled', async () => {
    render(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test {}"
          language="solidity"
          enableCollaboration={true}
          collaborationSessionId="test-session"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Should show collaboration toggle button
    expect(screen.getByText('Show Collaboration')).toBeInTheDocument();
  });

  test('should toggle collaboration panel', async () => {
    render(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test {}"
          language="solidity"
          enableCollaboration={true}
          collaborationSessionId="test-session"
        />
      </TestWrapper>
    );

    const toggleButton = await screen.findByText('Show Collaboration');
    
    // Click to show collaboration panel
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Hide Collaboration')).toBeInTheDocument();
    });

    // Should show collaboration components
    expect(screen.getByText('Participants')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  test('should handle collaboration session start', async () => {
    render(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test {}"
          language="solidity"
          enableCollaboration={true}
          collaborationSessionId="test-session"
          lessonId="lesson-1"
        />
      </TestWrapper>
    );

    // Wait for collaboration to initialize
    await waitFor(() => {
      expect(screen.getByText('Show Collaboration')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show connection status
    const toggleButton = screen.getByText('Show Collaboration');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Connection Status')).toBeInTheDocument();
    });
  });

  test('should handle user presence updates', async () => {
    render(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test {}"
          language="solidity"
          enableCollaboration={true}
          collaborationSessionId="test-session"
          collaborationUsers={[
            {
              id: 'user1',
              name: 'Alice',
              email: 'alice@example.com',
              role: 'instructor',
              status: 'online',
              lastActivity: new Date(),
              color: '#007bff'
            },
            {
              id: 'user2',
              name: 'Bob',
              email: 'bob@example.com',
              role: 'student',
              status: 'idle',
              lastActivity: new Date(),
              color: '#28a745'
            }
          ]}
        />
      </TestWrapper>
    );

    const toggleButton = await screen.findByText('Show Collaboration');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Participants')).toBeInTheDocument();
    });

    // Should show user presence
    expect(screen.getByText('(0 online)')).toBeInTheDocument(); // Initially no users online in context
  });

  test('should handle chat functionality', async () => {
    render(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test {}"
          language="solidity"
          enableCollaboration={true}
          collaborationSessionId="test-session"
        />
      </TestWrapper>
    );

    const toggleButton = await screen.findByText('Show Collaboration');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Chat')).toBeInTheDocument();
    });

    // Should have chat input
    const chatInput = screen.getByPlaceholderText('Type a message...');
    expect(chatInput).toBeInTheDocument();

    // Should be able to type in chat
    fireEvent.change(chatInput, { target: { value: 'Hello world!' } });
    expect(chatInput).toHaveValue('Hello world!');
  });

  test('should handle file sharing', async () => {
    render(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test {}"
          language="solidity"
          enableCollaboration={true}
          collaborationSessionId="test-session"
        />
      </TestWrapper>
    );

    const toggleButton = await screen.findByText('Show Collaboration');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Shared Files')).toBeInTheDocument();
    });

    // Should have file upload functionality
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('browse')).toBeInTheDocument();
  });

  test('should handle connection status changes', async () => {
    render(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test {}"
          language="solidity"
          enableCollaboration={true}
          collaborationSessionId="test-session"
        />
      </TestWrapper>
    );

    const toggleButton = await screen.findByText('Show Collaboration');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Connection Status')).toBeInTheDocument();
    });

    // Should show connection quality indicator
    expect(screen.getByText('Disconnected')).toBeInTheDocument(); // Initially disconnected
  });

  test('should handle compilation in collaborative mode', async () => {
    render(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test { function test() public {} }"
          language="solidity"
          enableCollaboration={true}
          collaborationSessionId="test-session"
          enableCompilation={true}
        />
      </TestWrapper>
    );

    // Should have compile button
    const compileButton = await screen.findByText('Compile');
    expect(compileButton).toBeInTheDocument();

    // Click compile button
    fireEvent.click(compileButton);

    // Should show compilation in progress
    await waitFor(() => {
      expect(screen.getByText('Compiling...')).toBeInTheDocument();
    });
  });

  test('should handle code synchronization', async () => {
    const { rerender } = render(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test {}"
          language="solidity"
          enableCollaboration={true}
          collaborationSessionId="test-session"
        />
      </TestWrapper>
    );

    // Wait for editor to initialize
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Simulate code change from another user
    rerender(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test { function newFunction() {} }"
          language="solidity"
          enableCollaboration={true}
          collaborationSessionId="test-session"
        />
      </TestWrapper>
    );

    // Editor should handle the code change
    expect(mockMonaco.editor.create).toHaveBeenCalled();
  });

  test('should handle session recovery', async () => {
    render(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test {}"
          language="solidity"
          enableCollaboration={true}
          collaborationSessionId="test-session"
        />
      </TestWrapper>
    );

    // Wait for collaboration to initialize
    await waitFor(() => {
      expect(screen.getByText('Show Collaboration')).toBeInTheDocument();
    });

    // Session recovery should be available but not visible initially
    expect(screen.queryByText('Recovering Session...')).not.toBeInTheDocument();
  });

  test('should handle offline mode', async () => {
    // Mock offline scenario
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    render(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test {}"
          language="solidity"
          enableCollaboration={true}
          collaborationSessionId="test-session"
        />
      </TestWrapper>
    );

    const toggleButton = await screen.findByText('Show Collaboration');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Connection Status')).toBeInTheDocument();
    });

    // Should show offline status
    expect(screen.getByText('Disconnected')).toBeInTheDocument();

    // Restore online status
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });
});
