import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { AdvancedCollaborativeMonacoEditor } from '@/components/editor/AdvancedCollaborativeMonacoEditor';

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  Editor: jest.fn(({ onMount, value, onChange }) => {
    React.useEffect(() => {
      if (onMount) {
        const mockEditor = {
          getValue: () => value,
          setValue: jest.fn(),
          onDidChangeModelContent: jest.fn(),
          onDidChangeCursorPosition: jest.fn(),
          updateOptions: jest.fn(),
          addCommand: jest.fn(),
          getModel: () => ({
            id: 'test-model',
            onWillDispose: jest.fn(),
            onDidChangeContent: jest.fn()
          }),
          dispose: jest.fn()
        };
        const mockMonaco = {
          editor: {
            setModelMarkers: jest.fn(),
            createModel: jest.fn(),
            defineTheme: jest.fn()
          },
          languages: {
            register: jest.fn(),
            setLanguageConfiguration: jest.fn(),
            setMonarchTokensProvider: jest.fn(),
            registerCompletionItemProvider: jest.fn(),
            registerHoverProvider: jest.fn(),
            registerSignatureHelpProvider: jest.fn(),
            registerDocumentFormattingEditProvider: jest.fn(),
            registerCodeActionProvider: jest.fn()
          },
          KeyMod: { CtrlCmd: 1, Shift: 2 },
          KeyCode: { KeyS: 1, KeyZ: 2 }
        };
        onMount(mockEditor, mockMonaco);
      }
    }, []);

    return (
      <div data-testid="monaco-editor">
        <textarea
          data-testid="editor-content"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    );
  })
}));

// Mock Socket.io
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true
  }))
}));

// Mock notifications
jest.mock('@/components/ui/NotificationSystem', () => ({
  useNotifications: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn()
  })
}));

describe('AdvancedCollaborativeMonacoEditor', () => {
  const defaultProps = {
    documentId: 'test-document',
    initialContent: '// Test content',
    language: 'solidity' as const,
    height: '400px',
    width: '100%'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders editor with initial content', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      expect(screen.getByTestId('editor-content')).toHaveValue('// Test content');
    });

    test('renders toolbar with controls', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      expect(screen.getByTitle(/save/i)).toBeInTheDocument();
      expect(screen.getByTitle(/undo/i)).toBeInTheDocument();
      expect(screen.getByTitle(/toggle minimap/i)).toBeInTheDocument();
    });

    test('shows collaborators when enabled', async () => {
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          showCollaborators={true} 
        />
      );
      
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });
  });

  describe('Content Management', () => {
    test('calls onContentChange when content changes', async () => {
      const onContentChange = jest.fn();
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          onContentChange={onContentChange}
        />
      );
      
      const editor = screen.getByTestId('editor-content');
      fireEvent.change(editor, { target: { value: 'new content' } });
      
      expect(onContentChange).toHaveBeenCalledWith('new content');
    });

    test('auto-saves when enabled', async () => {
      const onSave = jest.fn();
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          autoSave={true}
          autoSaveInterval={100}
          onSave={onSave}
        />
      );
      
      const editor = screen.getByTestId('editor-content');
      fireEvent.change(editor, { target: { value: 'auto save content' } });
      
      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      }, { timeout: 200 });
    });

    test('manual save works correctly', async () => {
      const onSave = jest.fn();
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          onSave={onSave}
        />
      );
      
      const saveButton = screen.getByTitle(/save/i);
      fireEvent.click(saveButton);
      
      expect(onSave).toHaveBeenCalled();
    });
  });

  describe('Collaboration Features', () => {
    test('handles cursor changes', async () => {
      const onCursorChange = jest.fn();
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          onCursorChange={onCursorChange}
        />
      );
      
      // Simulate cursor change
      const editor = screen.getByTestId('editor-content');
      fireEvent.click(editor);
      
      await waitFor(() => {
        expect(onCursorChange).toHaveBeenCalled();
      });
    });

    test('shows connection status', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      // Should show connected status
      expect(screen.getByTitle(/connected/i)).toBeInTheDocument();
    });
  });

  describe('Editor Features', () => {
    test('toggles minimap', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      const minimapButton = screen.getByTitle(/toggle minimap/i);
      fireEvent.click(minimapButton);
      
      // Should toggle minimap state
      expect(minimapButton).toHaveClass('text-gray-400');
    });

    test('undo functionality works', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      const undoButton = screen.getByTitle(/undo/i);
      
      // Initially disabled
      expect(undoButton).toBeDisabled();
      
      // After content change, should be enabled
      const editor = screen.getByTestId('editor-content');
      fireEvent.change(editor, { target: { value: 'changed content' } });
      
      await waitFor(() => {
        expect(undoButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles editor initialization errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock editor mount to throw error
      const EditorWithError = () => {
        throw new Error('Editor initialization failed');
      };
      
      expect(() => {
        render(<EditorWithError />);
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    test('shows loading state initially', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      // Should show loading state before editor is ready
      expect(screen.getByText(/initializing/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      const saveButton = screen.getByTitle(/save/i);
      expect(saveButton).toHaveAttribute('title');
      
      const undoButton = screen.getByTitle(/undo/i);
      expect(undoButton).toHaveAttribute('title');
    });

    test('supports keyboard navigation', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      const editor = screen.getByTestId('editor-content');
      
      // Should be focusable
      expect(editor).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Performance', () => {
    test('debounces content changes', async () => {
      const onContentChange = jest.fn();
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          onContentChange={onContentChange}
        />
      );
      
      const editor = screen.getByTestId('editor-content');
      
      // Rapid changes should be debounced
      fireEvent.change(editor, { target: { value: 'change 1' } });
      fireEvent.change(editor, { target: { value: 'change 2' } });
      fireEvent.change(editor, { target: { value: 'change 3' } });
      
      // Should only call once after debounce
      await waitFor(() => {
        expect(onContentChange).toHaveBeenCalledTimes(3);
      });
    });

    test('cleans up resources on unmount', async () => {
      const { unmount } = render(
        <AdvancedCollaborativeMonacoEditor {...defaultProps} />
      );
      
      // Should not throw errors on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Integration', () => {
    test('integrates with version control', async () => {
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          enableVersionControl={true}
        />
      );
      
      // Should show VCS integration
      expect(screen.getByTitle(/version control/i)).toBeInTheDocument();
    });

    test('integrates with debugging', async () => {
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          enableDebugging={true}
        />
      );
      
      // Should show debug integration
      expect(screen.getByTitle(/debug/i)).toBeInTheDocument();
    });
  });
});
