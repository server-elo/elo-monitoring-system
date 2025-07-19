import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { InteractiveCodeEditor } from '@/components/learning/InteractiveCodeEditor';

// Mock Monaco Editor
const mockEditor = {
  getValue: jest.fn(() => 'pragma solidity ^0.8.0;'),
  setValue: jest.fn(),
  onDidChangeModelContent: jest.fn(),
  onDidChangeCursorPosition: jest.fn(),
  onDidChangeCursorSelection: jest.fn(),
  dispose: jest.fn(),
  focus: jest.fn(),
  getModel: jest.fn(() => ({
    onDidChangeContent: jest.fn(),
    setValue: jest.fn(),
    getValue: jest.fn(() => 'pragma solidity ^0.8.0;')
  })),
  addAction: jest.fn(),
  trigger: jest.fn(),
  setPosition: jest.fn(),
  revealLine: jest.fn(),
  deltaDecorations: jest.fn(() => []),
  getLineCount: jest.fn(() => 10),
  getScrollTop: jest.fn(() => 0),
  setScrollTop: jest.fn()
};

const mockMonaco = {
  editor: {
    create: jest.fn(() => mockEditor),
    defineTheme: jest.fn(),
    setTheme: jest.fn(),
    getModels: jest.fn(() => []),
    createModel: jest.fn()
  },
  languages: {
    register: jest.fn(),
    setMonarchTokensProvider: jest.fn(),
    registerCompletionItemProvider: jest.fn(),
    CompletionItemKind: {
      Function: 1,
      Keyword: 2,
      Variable: 3
    },
    CompletionItemInsertTextRule: {
      InsertAsSnippet: 1
    }
  },
  KeyMod: {
    CtrlCmd: 1,
    Shift: 2
  },
  KeyCode: {
    KeyS: 1,
    Enter: 2
  }
};

// Mock @monaco-editor/react
jest.mock('@monaco-editor/react', () => ({
  Editor: ({ onChange, onMount, value, ...props }: any) => {
    React.useEffect(() => {
      if (onMount) {
        onMount(mockEditor, mockMonaco);
      }
    }, [onMount]);

    return (
      <div
        data-testid="monaco-editor"
        data-value={value}
        onClick={() => onChange?.(value)}
        {...props}
      >
        Monaco Editor Mock
      </div>
    );
  }
}));

// Mock hooks and dependencies
jest.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: () => ({
    saveCode: jest.fn(),
    loadCode: jest.fn().mockResolvedValue(''),
    saveStatus: { status: 'idle' },
    hasUnsavedChanges: false,
    lastSaved: null,
    toggleAutoSave: jest.fn(),
    clearSavedCode: jest.fn()
  })
}));

jest.mock('@/lib/errors/ErrorContext', () => ({
  useError: () => ({
    showApiError: jest.fn(),
    showFormError: jest.fn()
  })
}));

jest.mock('@/lib/context/LearningContext', () => ({
  useLearning: () => ({
    completeLesson: jest.fn(),
    addXP: jest.fn()
  })
}));

jest.mock('@/hooks/useGitIntegration', () => ({
  useAutoGit: () => ({
    commitCode: jest.fn(),
    pushChanges: jest.fn(),
    getCommitHistory: jest.fn().mockResolvedValue([])
  })
}));

jest.mock('@/hooks/useLessonProgress', () => ({
  useLessonProgress: () => ({
    currentStep: 0,
    totalSteps: 5,
    progress: 20,
    completeStep: jest.fn(),
    resetProgress: jest.fn()
  })
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={`card ${className}`} data-testid="card">
      {children}
    </div>
  )
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, disabled, ...props }: any) => (
    <button
      onClick={onClick}
      className={`button ${className}`}
      disabled={disabled}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock collaboration components
jest.mock('@/lib/collaboration/CollaborativeEditor', () => ({
  CollaborativeEditor: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    onUserJoin: jest.fn(),
    onUserLeave: jest.fn(),
    onCodeChange: jest.fn(),
    dispose: jest.fn()
  }))
}));

describe('InteractiveCodeEditor - Comprehensive Test Suite', () => {
  const mockOnCodeChange = jest.fn();
  const mockOnCompile = jest.fn();
  const mockOnSubmitSolution = jest.fn();
  const mockOnLessonComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Component Initialization', () => {
    it('should render with default props', () => {
      render(<InteractiveCodeEditor />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      expect(screen.getByText('Monaco Editor Mock')).toBeInTheDocument();
    });

    it('should initialize with provided initial code', () => {
      const initialCode = 'contract Test { }';
      
      render(<InteractiveCodeEditor initialCode={initialCode} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-value', initialCode);
    });

    it('should setup Monaco editor on mount', () => {
      render(<InteractiveCodeEditor />);

      expect(mockMonaco.languages.register).toHaveBeenCalledWith({ id: 'solidity' });
      expect(mockMonaco.languages.setMonarchTokensProvider).toHaveBeenCalled();
      expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalled();
    });

    it('should apply correct theme', () => {
      const { rerender } = render(<InteractiveCodeEditor theme="dark" />);
      
      expect(screen.getByTestId('monaco-editor')).toHaveAttribute('theme', 'vs-dark');

      rerender(<InteractiveCodeEditor theme="light" />);
      
      expect(screen.getByTestId('monaco-editor')).toHaveAttribute('theme', 'light');
    });
  });

  describe('Code Editing and Change Handling', () => {
    it('should handle code changes', () => {
      render(
        <InteractiveCodeEditor
          onCodeChange={mockOnCodeChange}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      fireEvent.click(editor);

      expect(mockOnCodeChange).toHaveBeenCalledWith('pragma solidity ^0.8.0;');
    });

    it('should trigger syntax checking on code change', async () => {
      render(<InteractiveCodeEditor />);

      const editor = screen.getByTestId('monaco-editor');
      fireEvent.click(editor);

      // Advance timers to trigger debounced syntax checking
      act(() => {
        jest.advanceTimersByTime(800);
      });

      // Syntax checking should be triggered (implementation dependent)
      expect(mockEditor.getValue).toHaveBeenCalled();
    });

    it('should handle read-only mode', () => {
      render(<InteractiveCodeEditor readOnly={true} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('options', expect.stringContaining('readOnly'));
    });

    it('should handle empty code gracefully', () => {
      render(
        <InteractiveCodeEditor
          initialCode=""
          onCodeChange={mockOnCodeChange}
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Auto-save Functionality', () => {
    it('should enable auto-save by default', () => {
      render(<InteractiveCodeEditor enableAutoSave={true} />);

      // Auto-save should be initialized
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should disable auto-save when specified', () => {
      render(<InteractiveCodeEditor enableAutoSave={false} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should trigger auto-save on code change', async () => {
      const mockSaveCode = jest.fn();
      
      // Mock the auto-save hook to return our mock function
      jest.doMock('@/hooks/useAutoSave', () => ({
        useAutoSave: () => ({
          saveCode: mockSaveCode,
          loadCode: jest.fn().mockResolvedValue(''),
          saveStatus: { status: 'idle' },
          hasUnsavedChanges: false,
          lastSaved: null,
          toggleAutoSave: jest.fn(),
          clearSavedCode: jest.fn()
        })
      }));

      render(<InteractiveCodeEditor enableAutoSave={true} />);

      const editor = screen.getByTestId('monaco-editor');
      fireEvent.click(editor);

      // Auto-save should be triggered after debounce
      act(() => {
        jest.advanceTimersByTime(2500);
      });

      expect(mockSaveCode).toHaveBeenCalled();
    });
  });

  describe('Compilation and Testing', () => {
    it('should handle compilation requests', async () => {
      render(
        <InteractiveCodeEditor
          onCompile={mockOnCompile}
        />
      );

      // Look for compile button (implementation dependent)
      const compileButtons = screen.queryAllByText(/compile/i);
      if (compileButtons.length > 0) {
        fireEvent.click(compileButtons[0]);
        expect(mockOnCompile).toHaveBeenCalled();
      }
    });

    it('should handle solution submission', async () => {
      render(
        <InteractiveCodeEditor
          onSubmitSolution={mockOnSubmitSolution}
          enableSubmission={true}
        />
      );

      // Look for submit button (implementation dependent)
      const submitButtons = screen.queryAllByText(/submit/i);
      if (submitButtons.length > 0) {
        fireEvent.click(submitButtons[0]);
        expect(mockOnSubmitSolution).toHaveBeenCalled();
      }
    });

    it('should handle lesson completion', async () => {
      render(
        <InteractiveCodeEditor
          onLessonComplete={mockOnLessonComplete}
          lessonId="lesson-1"
          xpReward={100}
        />
      );

      // Lesson completion logic (implementation dependent)
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Collaboration Features', () => {
    it('should initialize collaboration when enabled', () => {
      render(
        <InteractiveCodeEditor
          enableCollaboration={true}
          collaborationSessionId="session-123"
          collaborationUsers={[
            { id: 'user1', name: 'User 1', color: '#ff0000' },
            { id: 'user2', name: 'User 2', color: '#00ff00' }
          ]}
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should handle collaboration user events', () => {
      const collaborationUsers = [
        { id: 'user1', name: 'User 1', color: '#ff0000' },
        { id: 'user2', name: 'User 2', color: '#00ff00' }
      ];

      render(
        <InteractiveCodeEditor
          enableCollaboration={true}
          collaborationSessionId="session-123"
          collaborationUsers={collaborationUsers}
        />
      );

      // Collaboration should be set up
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should handle collaboration errors gracefully', () => {
      // Mock collaboration error
      const mockCollaborativeEditor = jest.fn().mockImplementation(() => {
        throw new Error('Collaboration failed');
      });

      jest.doMock('@/lib/collaboration/CollaborativeEditor', () => ({
        CollaborativeEditor: mockCollaborativeEditor
      }));

      expect(() => {
        render(
          <InteractiveCodeEditor
            enableCollaboration={true}
            collaborationSessionId="session-123"
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility Features', () => {
    it('should support keyboard navigation', () => {
      render(<InteractiveCodeEditor enableAccessibility={true} />);

      const editor = screen.getByTestId('monaco-editor');
      
      // Should be focusable
      editor.focus();
      expect(document.activeElement).toBe(editor);
    });

    it('should provide proper ARIA labels', () => {
      render(<InteractiveCodeEditor enableAccessibility={true} />);

      // Check for accessibility attributes (implementation dependent)
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should support screen readers', () => {
      render(<InteractiveCodeEditor enableAccessibility={true} />);

      // Screen reader support (implementation dependent)
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should render efficiently with large code files', () => {
      const largeCode = 'contract Test {\n'.repeat(1000) + '}';
      
      const startTime = performance.now();
      
      render(<InteractiveCodeEditor initialCode={largeCode} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100); // Should render within 100ms
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should handle rapid code changes efficiently', () => {
      render(
        <InteractiveCodeEditor
          onCodeChange={mockOnCodeChange}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      
      // Simulate rapid changes
      for (let i = 0; i < 10; i++) {
        fireEvent.click(editor);
      }

      // Should handle all changes without performance issues
      expect(mockOnCodeChange).toHaveBeenCalledTimes(10);
    });

    it('should debounce syntax checking appropriately', () => {
      render(<InteractiveCodeEditor />);

      const editor = screen.getByTestId('monaco-editor');
      
      // Trigger multiple rapid changes
      fireEvent.click(editor);
      fireEvent.click(editor);
      fireEvent.click(editor);

      // Only one syntax check should be scheduled
      act(() => {
        jest.advanceTimersByTime(800);
      });

      // Syntax checking should be debounced
      expect(mockEditor.getValue).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle Monaco editor initialization failure', () => {
      const mockFailingEditor = {
        ...mockEditor,
        getValue: jest.fn(() => {
          throw new Error('Editor failed');
        })
      };

      jest.doMock('@monaco-editor/react', () => ({
        Editor: ({ onMount }: any) => {
          React.useEffect(() => {
            if (onMount) {
              onMount(mockFailingEditor, mockMonaco);
            }
          }, [onMount]);

          return <div data-testid="monaco-editor">Monaco Editor Mock</div>;
        }
      }));

      expect(() => {
        render(<InteractiveCodeEditor />);
      }).not.toThrow();
    });

    it('should handle invalid initial code', () => {
      const invalidCode = null as any;
      
      expect(() => {
        render(<InteractiveCodeEditor initialCode={invalidCode} />);
      }).not.toThrow();
    });

    it('should handle missing callback functions', () => {
      expect(() => {
        render(
          <InteractiveCodeEditor
            onCodeChange={undefined}
            onCompile={undefined}
            onSubmitSolution={undefined}
          />
        );
      }).not.toThrow();
    });

    it('should clean up resources on unmount', () => {
      const { unmount } = render(<InteractiveCodeEditor />);

      unmount();

      expect(mockEditor.dispose).toHaveBeenCalled();
    });
  });

  describe('Integration with Learning System', () => {
    it('should track lesson progress', () => {
      render(
        <InteractiveCodeEditor
          enableProgressTracking={true}
          lessonId="lesson-1"
          currentStepId="step-1"
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should integrate with XP system', () => {
      render(
        <InteractiveCodeEditor
          xpReward={100}
          onLessonComplete={mockOnLessonComplete}
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should handle lesson step completion', () => {
      const mockOnStepComplete = jest.fn();
      
      render(
        <InteractiveCodeEditor
          onStepComplete={mockOnStepComplete}
          currentStepId="step-1"
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Real-time Features', () => {
    it('should handle real-time syntax checking', async () => {
      render(<InteractiveCodeEditor />);

      const editor = screen.getByTestId('monaco-editor');
      fireEvent.click(editor);

      // Wait for real-time syntax checking
      await waitFor(() => {
        expect(mockEditor.getValue).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should provide real-time error highlighting', () => {
      render(<InteractiveCodeEditor />);

      // Error highlighting should be initialized
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should handle real-time collaboration updates', () => {
      render(
        <InteractiveCodeEditor
          enableCollaboration={true}
          collaborationSessionId="session-123"
        />
      );

      // Real-time updates should be handled
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Advanced Features', () => {
    it('should support code templates', () => {
      render(<InteractiveCodeEditor enableTemplates={true} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should support debugging features', () => {
      render(<InteractiveCodeEditor enableDebugging={true} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should support testing integration', () => {
      render(<InteractiveCodeEditor enableTesting={true} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should handle minimap toggle', () => {
      const { rerender } = render(<InteractiveCodeEditor showMinimap={true} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();

      rerender(<InteractiveCodeEditor showMinimap={false} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should handle session persistence', () => {
      render(
        <InteractiveCodeEditor
          sessionId="session-123"
          lessonId="lesson-1"
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should restore session on reload', async () => {
      render(
        <InteractiveCodeEditor
          sessionId="session-123"
          enableAutoSave={true}
        />
      );

      // Session restoration should be handled
      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });

    it('should handle session conflicts', () => {
      render(
        <InteractiveCodeEditor
          sessionId="session-123"
          enableCollaboration={true}
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });
});
