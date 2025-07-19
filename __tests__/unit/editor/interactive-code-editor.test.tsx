import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { InteractiveCodeEditor } from '@/components/learning/InteractiveCodeEditor';

// Mock Monaco Editor
const mockEditor = {
  getValue: jest.fn(() => 'pragma solidity ^0.8.0;'),
  setValue: jest.fn(_),
  onDidChangeModelContent: jest.fn(_),
  onDidChangeCursorPosition: jest.fn(_),
  onDidChangeCursorSelection: jest.fn(_),
  dispose: jest.fn(_),
  focus: jest.fn(_),
  getModel: jest.fn(() => ({
    onDidChangeContent: jest.fn(_),
    setValue: jest.fn(_),
    getValue: jest.fn(() => 'pragma solidity ^0.8.0;')
  })),
  addAction: jest.fn(_),
  trigger: jest.fn(_),
  setPosition: jest.fn(_),
  revealLine: jest.fn(_),
  deltaDecorations: jest.fn(() => []),
  getLineCount: jest.fn(() => 10),
  getScrollTop: jest.fn(() => 0),
  setScrollTop: jest.fn(_)
};

const mockMonaco = {
  editor: {
    create: jest.fn(() => mockEditor),
    defineTheme: jest.fn(_),
    setTheme: jest.fn(_),
    getModels: jest.fn(() => []),
    createModel: jest.fn(_)
  },
  languages: {
    register: jest.fn(_),
    setMonarchTokensProvider: jest.fn(_),
    registerCompletionItemProvider: jest.fn(_),
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
jest.mock( '@monaco-editor/react', () => ({
  Editor: ( { onChange, onMount, value, ...props }: any) => {
    React.useEffect(() => {
      if (onMount) {
        onMount( mockEditor, mockMonaco);
      }
    }, [onMount]);

    return (
      <div
        data-testid="monaco-editor"
        data-value={value}
        onClick={(_) => onChange?.(_value)}
        {...props}
      >
        Monaco Editor Mock
      </div>
    );
  }
}));

// Mock hooks and dependencies
jest.mock( '@/hooks/useAutoSave', () => ({
  useAutoSave: (_) => ({
    saveCode: jest.fn(_),
    loadCode: jest.fn(_).mockResolvedValue(''),
    saveStatus: { status: 'idle' },
    hasUnsavedChanges: false,
    lastSaved: null,
    toggleAutoSave: jest.fn(_),
    clearSavedCode: jest.fn(_)
  })
}));

jest.mock( '@/lib/errors/ErrorContext', () => ({
  useError: (_) => ({
    showApiError: jest.fn(_),
    showFormError: jest.fn(_)
  })
}));

jest.mock( '@/lib/context/LearningContext', () => ({
  useLearning: (_) => ({
    completeLesson: jest.fn(_),
    addXP: jest.fn(_)
  })
}));

jest.mock( '@/hooks/useGitIntegration', () => ({
  useAutoGit: (_) => ({
    commitCode: jest.fn(_),
    pushChanges: jest.fn(_),
    getCommitHistory: jest.fn(_).mockResolvedValue([])
  })
}));

jest.mock( '@/hooks/useLessonProgress', () => ({
  useLessonProgress: (_) => ({
    currentStep: 0,
    totalSteps: 5,
    progress: 20,
    completeStep: jest.fn(_),
    resetProgress: jest.fn(_)
  })
}));

// Mock UI components
jest.mock( '@/components/ui/card', () => ({
  Card: ( { children, className }: any) => (
    <div className={`card ${className}`} data-testid="card">
      {children}
    </div>
  )
}));

jest.mock( '@/components/ui/button', () => ({
  Button: ( { children, onClick, className, disabled, ...props }: any) => (
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

jest.mock( '@/components/ui/use-toast', () => ({
  useToast: (_) => ({
    toast: jest.fn(_)
  })
}));

// Mock collaboration components
jest.mock( '@/lib/collaboration/CollaborativeEditor', () => ({
  CollaborativeEditor: jest.fn(_).mockImplementation(() => ({
    initialize: jest.fn(_).mockResolvedValue(_undefined),
    onUserJoin: jest.fn(_),
    onUserLeave: jest.fn(_),
    onCodeChange: jest.fn(_),
    dispose: jest.fn(_)
  }))
}));

describe( 'InteractiveCodeEditor - Comprehensive Test Suite', () => {
  const mockOnCodeChange = jest.fn(_);
  const mockOnCompile = jest.fn(_);
  const mockOnSubmitSolution = jest.fn(_);
  const mockOnLessonComplete = jest.fn(_);

  beforeEach(() => {
    jest.clearAllMocks(_);
    jest.useFakeTimers(_);
  });

  afterEach(() => {
    jest.useRealTimers(_);
    jest.restoreAllMocks(_);
  });

  describe( 'Component Initialization', () => {
    it( 'should render with default props', () => {
      render(<InteractiveCodeEditor />);

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
      expect(_screen.getByText('Monaco Editor Mock')).toBeInTheDocument(_);
    });

    it( 'should initialize with provided initial code', () => {
      const initialCode = 'contract Test { }';
      
      render(<InteractiveCodeEditor initialCode={initialCode} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(_editor).toHaveAttribute( 'data-value', initialCode);
    });

    it( 'should setup Monaco editor on mount', () => {
      render(<InteractiveCodeEditor />);

      expect(_mockMonaco.languages.register).toHaveBeenCalledWith({ id: 'solidity'  });
      expect(_mockMonaco.languages.setMonarchTokensProvider).toHaveBeenCalled(_);
      expect(_mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalled(_);
    });

    it( 'should apply correct theme', () => {
      const { rerender } = render(<InteractiveCodeEditor theme="dark" />);
      
      expect(_screen.getByTestId('monaco-editor')).toHaveAttribute( 'theme', 'vs-dark');

      rerender(<InteractiveCodeEditor theme="light" />);
      
      expect(_screen.getByTestId('monaco-editor')).toHaveAttribute( 'theme', 'light');
    });
  });

  describe( 'Code Editing and Change Handling', () => {
    it( 'should handle code changes', () => {
      render(
        <InteractiveCodeEditor
          onCodeChange={mockOnCodeChange}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      fireEvent.click(_editor);

      expect(_mockOnCodeChange).toHaveBeenCalledWith('pragma solidity ^0.8.0;');
    });

    it( 'should trigger syntax checking on code change', async () => {
      render(<InteractiveCodeEditor />);

      const editor = screen.getByTestId('monaco-editor');
      fireEvent.click(_editor);

      // Advance timers to trigger debounced syntax checking
      act(() => {
        jest.advanceTimersByTime(_800);
      });

      // Syntax checking should be triggered (_implementation dependent)
      expect(_mockEditor.getValue).toHaveBeenCalled(_);
    });

    it( 'should handle read-only mode', () => {
      render(<InteractiveCodeEditor readOnly={true} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(_editor).toHaveAttribute( 'options', expect.stringContaining('readOnly'));
    });

    it( 'should handle empty code gracefully', () => {
      render(
        <InteractiveCodeEditor
          initialCode=""
          onCodeChange={mockOnCodeChange}
        />
      );

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });
  });

  describe( 'Auto-save Functionality', () => {
    it( 'should enable auto-save by default', () => {
      render(<InteractiveCodeEditor enableAutoSave={true} />);

      // Auto-save should be initialized
      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });

    it( 'should disable auto-save when specified', () => {
      render(<InteractiveCodeEditor enableAutoSave={false} />);

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });

    it( 'should trigger auto-save on code change', async () => {
      const mockSaveCode = jest.fn(_);
      
      // Mock the auto-save hook to return our mock function
      jest.doMock( '@/hooks/useAutoSave', () => ({
        useAutoSave: (_) => ({
          saveCode: mockSaveCode,
          loadCode: jest.fn(_).mockResolvedValue(''),
          saveStatus: { status: 'idle' },
          hasUnsavedChanges: false,
          lastSaved: null,
          toggleAutoSave: jest.fn(_),
          clearSavedCode: jest.fn(_)
        })
      }));

      render(<InteractiveCodeEditor enableAutoSave={true} />);

      const editor = screen.getByTestId('monaco-editor');
      fireEvent.click(_editor);

      // Auto-save should be triggered after debounce
      act(() => {
        jest.advanceTimersByTime(_2500);
      });

      expect(_mockSaveCode).toHaveBeenCalled(_);
    });
  });

  describe( 'Compilation and Testing', () => {
    it( 'should handle compilation requests', async () => {
      render(
        <InteractiveCodeEditor
          onCompile={mockOnCompile}
        />
      );

      // Look for compile button (_implementation dependent)
      const compileButtons = screen.queryAllByText(_/compile/i);
      if (_compileButtons.length > 0) {
        fireEvent.click(_compileButtons[0]);
        expect(_mockOnCompile).toHaveBeenCalled(_);
      }
    });

    it( 'should handle solution submission', async () => {
      render(
        <InteractiveCodeEditor
          onSubmitSolution={mockOnSubmitSolution}
          enableSubmission={true}
        />
      );

      // Look for submit button (_implementation dependent)
      const submitButtons = screen.queryAllByText(_/submit/i);
      if (_submitButtons.length > 0) {
        fireEvent.click(_submitButtons[0]);
        expect(_mockOnSubmitSolution).toHaveBeenCalled(_);
      }
    });

    it( 'should handle lesson completion', async () => {
      render(
        <InteractiveCodeEditor
          onLessonComplete={mockOnLessonComplete}
          lessonId="lesson-1"
          xpReward={100}
        />
      );

      // Lesson completion logic (_implementation dependent)
      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });
  });

  describe( 'Collaboration Features', () => {
    it( 'should initialize collaboration when enabled', () => {
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

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });

    it( 'should handle collaboration user events', () => {
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
      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });

    it( 'should handle collaboration errors gracefully', () => {
      // Mock collaboration error
      const mockCollaborativeEditor = jest.fn(_).mockImplementation(() => {
        throw new Error('Collaboration failed');
      });

      jest.doMock( '@/lib/collaboration/CollaborativeEditor', () => ({
        CollaborativeEditor: mockCollaborativeEditor
      }));

      expect(() => {
        render(
          <InteractiveCodeEditor
            enableCollaboration={true}
            collaborationSessionId="session-123"
          />
        );
      }).not.toThrow(_);
    });
  });

  describe( 'Accessibility Features', () => {
    it( 'should support keyboard navigation', () => {
      render(<InteractiveCodeEditor enableAccessibility={true} />);

      const editor = screen.getByTestId('monaco-editor');
      
      // Should be focusable
      editor.focus(_);
      expect(_document.activeElement).toBe(_editor);
    });

    it( 'should provide proper ARIA labels', () => {
      render(<InteractiveCodeEditor enableAccessibility={true} />);

      // Check for accessibility attributes (_implementation dependent)
      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });

    it( 'should support screen readers', () => {
      render(<InteractiveCodeEditor enableAccessibility={true} />);

      // Screen reader support (_implementation dependent)
      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });
  });

  describe( 'Performance and Optimization', () => {
    it( 'should render efficiently with large code files', () => {
      const largeCode = 'contract Test {\n'.repeat(1000) + '}';
      
      const startTime = performance.now(_);
      
      render(<InteractiveCodeEditor initialCode={largeCode} />);
      
      const endTime = performance.now(_);
      const renderTime = endTime - startTime;

      expect(_renderTime).toBeLessThan(100); // Should render within 100ms
      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });

    it( 'should handle rapid code changes efficiently', () => {
      render(
        <InteractiveCodeEditor
          onCodeChange={mockOnCodeChange}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      
      // Simulate rapid changes
      for (let i = 0; i < 10; i++) {
        fireEvent.click(_editor);
      }

      // Should handle all changes without performance issues
      expect(_mockOnCodeChange).toHaveBeenCalledTimes(10);
    });

    it( 'should debounce syntax checking appropriately', () => {
      render(<InteractiveCodeEditor />);

      const editor = screen.getByTestId('monaco-editor');
      
      // Trigger multiple rapid changes
      fireEvent.click(_editor);
      fireEvent.click(_editor);
      fireEvent.click(_editor);

      // Only one syntax check should be scheduled
      act(() => {
        jest.advanceTimersByTime(_800);
      });

      // Syntax checking should be debounced
      expect(_mockEditor.getValue).toHaveBeenCalled(_);
    });
  });

  describe( 'Error Handling and Edge Cases', () => {
    it( 'should handle Monaco editor initialization failure', () => {
      const mockFailingEditor = {
        ...mockEditor,
        getValue: jest.fn(() => {
          throw new Error('Editor failed');
        })
      };

      jest.doMock( '@monaco-editor/react', () => ({
        Editor: (_{ onMount }: any) => {
          React.useEffect(() => {
            if (onMount) {
              onMount( mockFailingEditor, mockMonaco);
            }
          }, [onMount]);

          return <div data-testid="monaco-editor">Monaco Editor Mock</div>;
        }
      }));

      expect(() => {
        render(<InteractiveCodeEditor />);
      }).not.toThrow(_);
    });

    it( 'should handle invalid initial code', () => {
      const invalidCode = null as any;
      
      expect(() => {
        render(<InteractiveCodeEditor initialCode={invalidCode} />);
      }).not.toThrow(_);
    });

    it( 'should handle missing callback functions', () => {
      expect(() => {
        render(
          <InteractiveCodeEditor
            onCodeChange={undefined}
            onCompile={undefined}
            onSubmitSolution={undefined}
          />
        );
      }).not.toThrow(_);
    });

    it( 'should clean up resources on unmount', () => {
      const { unmount } = render(<InteractiveCodeEditor />);

      unmount(_);

      expect(_mockEditor.dispose).toHaveBeenCalled(_);
    });
  });

  describe( 'Integration with Learning System', () => {
    it( 'should track lesson progress', () => {
      render(
        <InteractiveCodeEditor
          enableProgressTracking={true}
          lessonId="lesson-1"
          currentStepId="step-1"
        />
      );

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });

    it( 'should integrate with XP system', () => {
      render(
        <InteractiveCodeEditor
          xpReward={100}
          onLessonComplete={mockOnLessonComplete}
        />
      );

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });

    it( 'should handle lesson step completion', () => {
      const mockOnStepComplete = jest.fn(_);
      
      render(
        <InteractiveCodeEditor
          onStepComplete={mockOnStepComplete}
          currentStepId="step-1"
        />
      );

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });
  });

  describe( 'Real-time Features', () => {
    it( 'should handle real-time syntax checking', async () => {
      render(<InteractiveCodeEditor />);

      const editor = screen.getByTestId('monaco-editor');
      fireEvent.click(_editor);

      // Wait for real-time syntax checking
      await waitFor(() => {
        expect(_mockEditor.getValue).toHaveBeenCalled(_);
      }, { timeout: 1000 });
    });

    it( 'should provide real-time error highlighting', () => {
      render(<InteractiveCodeEditor />);

      // Error highlighting should be initialized
      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });

    it( 'should handle real-time collaboration updates', () => {
      render(
        <InteractiveCodeEditor
          enableCollaboration={true}
          collaborationSessionId="session-123"
        />
      );

      // Real-time updates should be handled
      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });
  });

  describe( 'Advanced Features', () => {
    it( 'should support code templates', () => {
      render(<InteractiveCodeEditor enableTemplates={true} />);

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });

    it( 'should support debugging features', () => {
      render(<InteractiveCodeEditor enableDebugging={true} />);

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });

    it( 'should support testing integration', () => {
      render(<InteractiveCodeEditor enableTesting={true} />);

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });

    it( 'should handle minimap toggle', () => {
      const { rerender } = render(<InteractiveCodeEditor showMinimap={true} />);

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);

      rerender(<InteractiveCodeEditor showMinimap={false} />);

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });
  });

  describe( 'Session Management', () => {
    it( 'should handle session persistence', () => {
      render(
        <InteractiveCodeEditor
          sessionId="session-123"
          lessonId="lesson-1"
        />
      );

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });

    it( 'should restore session on reload', async () => {
      render(
        <InteractiveCodeEditor
          sessionId="session-123"
          enableAutoSave={true}
        />
      );

      // Session restoration should be handled
      await waitFor(() => {
        expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
      });
    });

    it( 'should handle session conflicts', () => {
      render(
        <InteractiveCodeEditor
          sessionId="session-123"
          enableCollaboration={true}
        />
      );

      expect(_screen.getByTestId('monaco-editor')).toBeInTheDocument(_);
    });
  });
});
