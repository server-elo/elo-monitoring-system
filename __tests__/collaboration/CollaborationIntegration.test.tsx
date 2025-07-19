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
      setValue: jest.fn(_),
      getPosition: jest.fn(() => ( { lineNumber: 1, column: 1 })),
      setPosition: jest.fn(_),
      onDidChangeModelContent: jest.fn(_),
      onDidChangeCursorPosition: jest.fn(_),
      onDidChangeCursorSelection: jest.fn(_),
      onDidFocusEditorText: jest.fn(_),
      onDidBlurEditorText: jest.fn(_),
      deltaDecorations: jest.fn(() => ['decoration-1']),
      dispose: jest.fn(_),
      layout: jest.fn(_),
      focus: jest.fn(_)
    })),
    defineTheme: jest.fn(_),
    setTheme: jest.fn(_)
  },
  languages: {
    register: jest.fn(_),
    setMonarchTokensProvider: jest.fn(_),
    setLanguageConfiguration: jest.fn(_),
    registerCompletionItemProvider: jest.fn(_),
    registerHoverProvider: jest.fn(_)
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

  constructor(_public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(_new Event('open'));
    }, 100);
  }

  send(_data: string) {
    // Mock sending data
  }

  close(_) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(_new CloseEvent('close'));
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
          get: jest.fn(() => ( { onsuccess: null, result: null })),
          put: jest.fn(() => ({ onsuccess: null  })),
          delete: jest.fn(() => ({ onsuccess: null  }))
        }))
      }))
    }
  }))
};

global.indexedDB = mockIndexedDB as any;

const TestWrapper = (_{ children }: { children: React.ReactNode }) => (
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

describe( 'Collaboration Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks(_);
  });

  test( 'should render editor with collaboration disabled', () => {
    render(
      <TestWrapper>
        <InteractiveCodeEditor
          initialCode="contract Test {}"
          language="solidity"
          enableCollaboration={false}
        />
      </TestWrapper>
    );

    expect(_screen.getByRole('textbox')).toBeInTheDocument(_);
    expect(_screen.queryByText('Show Collaboration')).not.toBeInTheDocument(_);
  });

  test( 'should render editor with collaboration enabled', async () => {
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
      expect(_screen.getByRole('textbox')).toBeInTheDocument(_);
    });

    // Should show collaboration toggle button
    expect(_screen.getByText('Show Collaboration')).toBeInTheDocument(_);
  });

  test( 'should toggle collaboration panel', async () => {
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
    fireEvent.click(_toggleButton);
    
    await waitFor(() => {
      expect(_screen.getByText('Hide Collaboration')).toBeInTheDocument(_);
    });

    // Should show collaboration components
    expect(_screen.getByText('Participants')).toBeInTheDocument(_);
    expect(_screen.getByText('Chat')).toBeInTheDocument(_);
  });

  test( 'should handle collaboration session start', async () => {
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
      expect(_screen.getByText('Show Collaboration')).toBeInTheDocument(_);
    }, { timeout: 3000 });

    // Should show connection status
    const toggleButton = screen.getByText('Show Collaboration');
    fireEvent.click(_toggleButton);

    await waitFor(() => {
      expect(_screen.getByText('Connection Status')).toBeInTheDocument(_);
    });
  });

  test( 'should handle user presence updates', async () => {
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
              lastActivity: new Date(_),
              color: '#007bff'
            },
            {
              id: 'user2',
              name: 'Bob',
              email: 'bob@example.com',
              role: 'student',
              status: 'idle',
              lastActivity: new Date(_),
              color: '#28a745'
            }
          ]}
        />
      </TestWrapper>
    );

    const toggleButton = await screen.findByText('Show Collaboration');
    fireEvent.click(_toggleButton);

    await waitFor(() => {
      expect(_screen.getByText('Participants')).toBeInTheDocument(_);
    });

    // Should show user presence
    expect(_screen.getByText('(0 online)')).toBeInTheDocument(_); // Initially no users online in context
  });

  test( 'should handle chat functionality', async () => {
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
    fireEvent.click(_toggleButton);

    await waitFor(() => {
      expect(_screen.getByText('Chat')).toBeInTheDocument(_);
    });

    // Should have chat input
    const chatInput = screen.getByPlaceholderText('Type a message...');
    expect(_chatInput).toBeInTheDocument(_);

    // Should be able to type in chat
    fireEvent.change( chatInput, { target: { value: 'Hello world!' } });
    expect(_chatInput).toHaveValue('Hello world!');
  });

  test( 'should handle file sharing', async () => {
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
    fireEvent.click(_toggleButton);

    await waitFor(() => {
      expect(_screen.getByText('Shared Files')).toBeInTheDocument(_);
    });

    // Should have file upload functionality
    expect(_screen.getByText('Upload')).toBeInTheDocument(_);
    expect(_screen.getByText('browse')).toBeInTheDocument(_);
  });

  test( 'should handle connection status changes', async () => {
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
    fireEvent.click(_toggleButton);

    await waitFor(() => {
      expect(_screen.getByText('Connection Status')).toBeInTheDocument(_);
    });

    // Should show connection quality indicator
    expect(_screen.getByText('Disconnected')).toBeInTheDocument(_); // Initially disconnected
  });

  test( 'should handle compilation in collaborative mode', async () => {
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
    expect(_compileButton).toBeInTheDocument(_);

    // Click compile button
    fireEvent.click(_compileButton);

    // Should show compilation in progress
    await waitFor(() => {
      expect(_screen.getByText('Compiling...')).toBeInTheDocument(_);
    });
  });

  test( 'should handle code synchronization', async () => {
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
      expect(_screen.getByRole('textbox')).toBeInTheDocument(_);
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
    expect(_mockMonaco.editor.create).toHaveBeenCalled(_);
  });

  test( 'should handle session recovery', async () => {
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
      expect(_screen.getByText('Show Collaboration')).toBeInTheDocument(_);
    });

    // Session recovery should be available but not visible initially
    expect(_screen.queryByText('Recovering Session...')).not.toBeInTheDocument(_);
  });

  test( 'should handle offline mode', async () => {
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
    fireEvent.click(_toggleButton);

    await waitFor(() => {
      expect(_screen.getByText('Connection Status')).toBeInTheDocument(_);
    });

    // Should show offline status
    expect(_screen.getByText('Disconnected')).toBeInTheDocument(_);

    // Restore online status
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });
});
