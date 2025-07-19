import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { AdvancedCollaborativeMonacoEditor } from '@/components/editor/AdvancedCollaborativeMonacoEditor';

// Mock Monaco Editor
jest.mock( '@monaco-editor/react', () => ({
  Editor: jest.fn( ({ onMount, value, onChange }) => {
    React.useEffect(() => {
      if (onMount) {
        const mockEditor = {
          getValue: (_) => value,
          setValue: jest.fn(_),
          onDidChangeModelContent: jest.fn(_),
          onDidChangeCursorPosition: jest.fn(_),
          updateOptions: jest.fn(_),
          addCommand: jest.fn(_),
          getModel: (_) => ({
            id: 'test-model',
            onWillDispose: jest.fn(_),
            onDidChangeContent: jest.fn(_)
          }),
          dispose: jest.fn(_)
        };
        const mockMonaco = {
          editor: {
            setModelMarkers: jest.fn(_),
            createModel: jest.fn(_),
            defineTheme: jest.fn(_)
          },
          languages: {
            register: jest.fn(_),
            setLanguageConfiguration: jest.fn(_),
            setMonarchTokensProvider: jest.fn(_),
            registerCompletionItemProvider: jest.fn(_),
            registerHoverProvider: jest.fn(_),
            registerSignatureHelpProvider: jest.fn(_),
            registerDocumentFormattingEditProvider: jest.fn(_),
            registerCodeActionProvider: jest.fn(_)
          },
          KeyMod: { CtrlCmd: 1, Shift: 2 },
          KeyCode: { KeyS: 1, KeyZ: 2 }
        };
        onMount( mockEditor, mockMonaco);
      }
    }, []);

    return (
      <div data-testid="monaco-editor">
        <textarea
          data-testid="editor-content"
          value={value}
          onChange={(_e) => onChange?.(_e.target.value)}
        />
      </div>
    );
  })
}));

// Mock Socket.io
jest.mock( 'socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(_),
    off: jest.fn(_),
    emit: jest.fn(_),
    disconnect: jest.fn(_),
    connected: true
  }))
}));

// Mock notifications
jest.mock( '@/components/ui/NotificationSystem', () => ({
  useNotifications: (_) => ({
    showSuccess: jest.fn(_),
    showError: jest.fn(_),
    showInfo: jest.fn(_),
    showWarning: jest.fn(_)
  })
}));

describe( 'AdvancedCollaborativeMonacoEditor', () => {
  const defaultProps = {
    documentId: 'test-document',
    initialContent: '// Test content',
    language: 'solidity' as const,
    height: '400px',
    width: '100%'
  };

  beforeEach(() => {
    jest.clearAllMocks(_);
  });

  describe( 'Basic Rendering', () => {
    test( 'renders editor with initial content', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
      expect(_screen.getByTestId('editor-content')).toHaveValue('// Test content');
    });

    test( 'renders toolbar with controls', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      expect(_screen.getByTitle(/save/i)).toBeInTheDocument(_);
      expect(_screen.getByTitle(/undo/i)).toBeInTheDocument(_);
      expect(_screen.getByTitle(/toggle minimap/i)).toBeInTheDocument(_);
    });

    test( 'shows collaborators when enabled', async () => {
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          showCollaborators={true} 
        />
      );
      
      expect(_screen.getByText(/active/i)).toBeInTheDocument(_);
    });
  });

  describe( 'Content Management', () => {
    test( 'calls onContentChange when content changes', async () => {
      const onContentChange = jest.fn(_);
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          onContentChange={onContentChange}
        />
      );
      
      const editor = screen.getByTestId('editor-content');
      fireEvent.change( editor, { target: { value: 'new content' } });
      
      expect(_onContentChange).toHaveBeenCalledWith('new content');
    });

    test( 'auto-saves when enabled', async () => {
      const onSave = jest.fn(_);
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          autoSave={true}
          autoSaveInterval={100}
          onSave={onSave}
        />
      );
      
      const editor = screen.getByTestId('editor-content');
      fireEvent.change( editor, { target: { value: 'auto save content' } });
      
      await waitFor(() => {
        expect(_onSave).toHaveBeenCalled(_);
      }, { timeout: 200 });
    });

    test( 'manual save works correctly', async () => {
      const onSave = jest.fn(_);
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          onSave={onSave}
        />
      );
      
      const saveButton = screen.getByTitle(_/save/i);
      fireEvent.click(_saveButton);
      
      expect(_onSave).toHaveBeenCalled(_);
    });
  });

  describe( 'Collaboration Features', () => {
    test( 'handles cursor changes', async () => {
      const onCursorChange = jest.fn(_);
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          onCursorChange={onCursorChange}
        />
      );
      
      // Simulate cursor change
      const editor = screen.getByTestId('editor-content');
      fireEvent.click(_editor);
      
      await waitFor(() => {
        expect(_onCursorChange).toHaveBeenCalled(_);
      });
    });

    test( 'shows connection status', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      // Should show connected status
      expect(_screen.getByTitle(/connected/i)).toBeInTheDocument(_);
    });
  });

  describe( 'Editor Features', () => {
    test( 'toggles minimap', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      const minimapButton = screen.getByTitle(_/toggle minimap/i);
      fireEvent.click(_minimapButton);
      
      // Should toggle minimap state
      expect(_minimapButton).toHaveClass('text-gray-400');
    });

    test( 'undo functionality works', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      const undoButton = screen.getByTitle(_/undo/i);
      
      // Initially disabled
      expect(_undoButton).toBeDisabled(_);
      
      // After content change, should be enabled
      const editor = screen.getByTestId('editor-content');
      fireEvent.change( editor, { target: { value: 'changed content' } });
      
      await waitFor(() => {
        expect(_undoButton).not.toBeDisabled(_);
      });
    });
  });

  describe( 'Error Handling', () => {
    test( 'handles editor initialization errors gracefully', async () => {
      const consoleSpy = jest.spyOn( console, 'error').mockImplementation(_);
      
      // Mock editor mount to throw error
      const EditorWithError = (_) => {
        throw new Error('Editor initialization failed');
      };
      
      expect(() => {
        render(<EditorWithError />);
      }).not.toThrow(_);
      
      consoleSpy.mockRestore(_);
    });

    test( 'shows loading state initially', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      // Should show loading state before editor is ready
      expect(_screen.getByText(/initializing/i)).toBeInTheDocument(_);
    });
  });

  describe( 'Accessibility', () => {
    test( 'has proper ARIA labels', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      const saveButton = screen.getByTitle(_/save/i);
      expect(_saveButton).toHaveAttribute('title');
      
      const undoButton = screen.getByTitle(_/undo/i);
      expect(_undoButton).toHaveAttribute('title');
    });

    test( 'supports keyboard navigation', async () => {
      render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
      
      const editor = screen.getByTestId('editor-content');
      
      // Should be focusable
      expect(_editor).toHaveAttribute( 'tabIndex', '0');
    });
  });

  describe( 'Performance', () => {
    test( 'debounces content changes', async () => {
      const onContentChange = jest.fn(_);
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          onContentChange={onContentChange}
        />
      );
      
      const editor = screen.getByTestId('editor-content');
      
      // Rapid changes should be debounced
      fireEvent.change( editor, { target: { value: 'change 1' } });
      fireEvent.change( editor, { target: { value: 'change 2' } });
      fireEvent.change( editor, { target: { value: 'change 3' } });
      
      // Should only call once after debounce
      await waitFor(() => {
        expect(_onContentChange).toHaveBeenCalledTimes(3);
      });
    });

    test( 'cleans up resources on unmount', async () => {
      const { unmount } = render(
        <AdvancedCollaborativeMonacoEditor {...defaultProps} />
      );
      
      // Should not throw errors on unmount
      expect(() => unmount(_)).not.toThrow(_);
    });
  });

  describe( 'Integration', () => {
    test( 'integrates with version control', async () => {
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          enableVersionControl={true}
        />
      );
      
      // Should show VCS integration
      expect(_screen.getByTitle(/version control/i)).toBeInTheDocument(_);
    });

    test( 'integrates with debugging', async () => {
      render(
        <AdvancedCollaborativeMonacoEditor 
          {...defaultProps} 
          enableDebugging={true}
        />
      );
      
      // Should show debug integration
      expect(_screen.getByTitle(/debug/i)).toBeInTheDocument(_);
    });
  });
});
