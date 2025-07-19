import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Editor, Monaco } from '@monaco-editor/react';
// import type { editor } from 'monaco-editor';
// import { ShowLightbulbIconMode } from 'monaco-editor';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Save, 
  Download, 
  Copy, 
  Play, 
  Settings, 
  Maximize2, 
  Minimize2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/lib/socket/client';
import { useAuth } from '@/components/auth/EnhancedAuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { announceToScreenReader } from '@/lib/utils/accessibility';

interface MonacoCollaborativeEditorProps {
  sessionId: string;
  initialCode?: string;
  language?: string;
  readOnly?: boolean;
  onCodeChange?: (code: string) => void;
  onSave?: (code: string) => void;
}

interface Operation {
  type: 'insert' | 'delete' | 'replace';
  position: { line: number; column: number };
  content: string;
  length?: number;
  userId: string;
  timestamp: number;
  id: string;
}

interface UserCursor {
  userId: string;
  userName: string;
  position: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  color: string;
}

interface ConflictResolution {
  operationId: string;
  resolution: 'accept' | 'reject' | 'merge';
  mergedContent?: string;
}

const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export const MonacoCollaborativeEditor: React.FC<MonacoCollaborativeEditorProps> = ({
  sessionId, // Used for session-specific operations and analytics
  initialCode = '',
  language = 'solidity',
  readOnly = false,
  onCodeChange,
  onSave
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    socket,
    isConnected,
    session, // Used for session context and metadata
    participants,
    updateCode,
    updateCursor,
    updateSelection
  } = useSocket();

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [code, setCode] = useState(initialCode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userCursors, setUserCursors] = useState<UserCursor[]>([]);
  const [pendingOperations, setPendingOperations] = useState<Operation[]>([]);
  const [conflicts, setConflicts] = useState<Operation[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Session analytics and tracking using sessionId
  const trackSessionActivity = useCallback((activity: string, metadata?: Record<string, unknown>) => {
    const activityData = {
      sessionId,
      activity,
      userId: user?.id,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        sessionTitle: (session as any)?.title,
        participantCount: participants.length,
        codeLength: code.length,
        language
      }
    };

    // Store session activity for analytics
    const activities = JSON.parse(localStorage.getItem(`session_${sessionId}_activities`) || '[]');
    activities.push(activityData);
    localStorage.setItem(`session_${sessionId}_activities`, JSON.stringify(activities.slice(-100)));

    console.log('Session activity tracked:', activityData);
  }, [sessionId, user?.id, session, participants.length, code.length, language]);

  // Enhanced pending operations management
  const addPendingOperation = useCallback((operation: Operation) => {
    setPendingOperations(prev => {
      const updated = [...prev, operation];

      // Track operation analytics
      trackSessionActivity('operation_added', {
        operationType: operation.type,
        operationId: operation.id,
        pendingCount: updated.length
      });

      // Auto-cleanup old operations (keep last 50)
      return updated.slice(-50);
    });
  }, [trackSessionActivity]);

  const removePendingOperation = useCallback((operationId: string) => {
    setPendingOperations(prev => {
      const updated = prev.filter(op => op.id !== operationId);

      trackSessionActivity('operation_completed', {
        operationId,
        remainingCount: updated.length
      });

      return updated;
    });
  }, [trackSessionActivity]);

  // Operational Transformation functions
  const transformOperation = useCallback((op1: Operation, op2: Operation): Operation => {
    // Simple operational transformation for concurrent edits
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position.line < op2.position.line || 
          (op1.position.line === op2.position.line && op1.position.column <= op2.position.column)) {
        return op2; // No transformation needed
      } else {
        // Adjust position based on inserted content
        const lines = op1.content.split('\n');
        if (lines.length > 1) {
          return {
            ...op2,
            position: {
              line: op2.position.line + lines.length - 1,
              column: op2.position.line === op1.position.line 
                ? op2.position.column + lines[lines.length - 1].length
                : op2.position.column
            }
          };
        } else {
          return {
            ...op2,
            position: {
              ...op2.position,
              column: op2.position.line === op1.position.line 
                ? op2.position.column + op1.content.length 
                : op2.position.column
            }
          };
        }
      }
    }
    
    // Add more transformation logic for delete and replace operations
    return op2;
  }, []);

  const applyOperation = useCallback((operation: Operation) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    
    if (!model) return;

    try {
      switch (operation.type) {
        case 'insert':
          const insertPosition = new monacoRef.current!.Position(
            operation.position.line,
            operation.position.column
          );
          model.pushEditOperations(
            [],
            [{
              range: new monacoRef.current!.Range(
                insertPosition.lineNumber,
                insertPosition.column,
                insertPosition.lineNumber,
                insertPosition.column
              ),
              text: operation.content
            }],
            () => null
          );
          break;

        case 'delete':
          const deleteRange = new monacoRef.current!.Range(
            operation.position.line,
            operation.position.column,
            operation.position.line,
            operation.position.column + (operation.length || 1)
          );
          model.pushEditOperations(
            [],
            [{
              range: deleteRange,
              text: ''
            }],
            () => null
          );
          break;

        case 'replace':
          const replaceRange = new monacoRef.current!.Range(
            operation.position.line,
            operation.position.column,
            operation.position.line,
            operation.position.column + (operation.length || 0)
          );
          model.pushEditOperations(
            [],
            [{
              range: replaceRange,
              text: operation.content
            }],
            () => null
          );
          break;
      }
    } catch (error) {
      console.error('Error applying operation:', error);
      // Add to conflicts for manual resolution
      setConflicts(prev => [...prev, operation]);
    }
  }, []);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Enhanced accessibility configuration
    editor.updateOptions({
      accessibilitySupport: 'on',
      ariaLabel: 'Solidity code editor. Press F1 for keyboard shortcuts and accessibility help.',
      screenReaderAnnounceInlineSuggestions: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      mouseWheelScrollSensitivity: 1,
      fastScrollSensitivity: 5,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      wordWrapColumn: 80,
      wrappingIndent: 'indent',
      lineNumbers: 'on',
      lineNumbersMinChars: 3,
      glyphMargin: true,
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      unfoldOnClickAfterEndOfLine: true,
      links: true,
      colorDecorators: true,
      lightbulb: {
        enabled: true
      },
      codeActionsOnSave: {
        'source.organizeImports': true
      }
    });

    // Configure Solidity language support
    monaco.languages.register({ id: 'solidity' });
    monaco.languages.setMonarchTokensProvider('solidity', {
      tokenizer: {
        root: [
          [/pragma\s+solidity/, 'keyword'],
          [/contract\s+\w+/, 'keyword'],
          [/function\s+\w+/, 'keyword'],
          [/\b(uint|int|bool|string|address|bytes)\d*\b/, 'type'],
          [/\b(public|private|internal|external|pure|view|payable)\b/, 'keyword'],
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          [/\d+/, 'number'],
        ],
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop']
        ]
      }
    });

    // Set up cursor and selection tracking with accessibility announcements
    editor.onDidChangeCursorPosition((e: any) => {
      if (!readOnly && user) {
        updateCursor(e.position.lineNumber, e.position.column);

        // Announce cursor position for screen readers (throttled)
        if (e.reason === monaco.editor.CursorChangeReason.Explicit) {
          const position = e.position;
          const lineContent = editor.getModel()?.getLineContent(position.lineNumber) || '';
          const currentChar = lineContent.charAt(position.column - 1) || 'end of line';

          // Create announcement for screen readers
          setTimeout(() => {
            const announcement = `Line ${position.lineNumber}, Column ${position.column}. ${currentChar !== 'end of line' ? `Character: ${currentChar}` : 'End of line'}`;
            announceToScreenReader(announcement, 'polite');
          }, 100);
        }
      }
    });

    editor.onDidChangeCursorSelection((e: any) => {
      if (!readOnly && user) {
        const selection = e.selection;
        updateSelection(
          selection.startLineNumber,
          selection.startColumn,
          selection.endLineNumber,
          selection.endColumn
        );

        // Announce selection for screen readers
        if (!selection.isEmpty()) {
          const selectedText = editor.getModel()?.getValueInRange(selection) || '';
          if (selectedText.length > 0 && selectedText.length < 100) {
            setTimeout(() => {
              announceToScreenReader(`Selected: ${selectedText}`, 'polite');
            }, 100);
          } else if (selectedText.length >= 100) {
            setTimeout(() => {
              announceToScreenReader(`Selected ${selectedText.length} characters`, 'polite');
            }, 100);
          }
        }
      }
    });

    // Set up content change tracking
    editor.onDidChangeModelContent((e: any) => {
      if (!readOnly) {
        const newCode = editor.getValue();
        setCode(newCode);
        setHasUnsavedChanges(true);
        onCodeChange?.(newCode);

        // Create operations for each change
        e.changes.forEach((change: any) => {
          const operation: Operation = {
            type: change.text ? 'insert' : 'delete',
            position: {
              line: change.range.startLineNumber,
              column: change.range.startColumn
            },
            content: change.text || '',
            length: change.rangeLength,
            userId: user?.id || 'anonymous',
            timestamp: Date.now(),
            id: `${user?.id}-${Date.now()}-${Math.random()}`
          };

          // Add to pending operations for tracking
          addPendingOperation(operation);

          // Send operation to other users
          updateCode(newCode, operation);
        });
      }
    });
  };

  // Handle incoming operations from other users
  useEffect(() => {
    if (socket) {
      const handleRemoteOperation = (operation: Operation) => {
        if (operation.userId !== user?.id) {
          // Transform operation against pending operations
          let transformedOp = operation;
          pendingOperations.forEach(pendingOp => {
            transformedOp = transformOperation(pendingOp, transformedOp);
          });

          applyOperation(transformedOp);

          // Track remote operation
          trackSessionActivity('remote_operation_applied', {
            operationType: transformedOp.type,
            fromUserId: operation.userId,
            transformationCount: pendingOperations.length
          });
        } else {
          // Remove our own operation from pending when acknowledged
          removePendingOperation(operation.id);
        }
      };

      socket.on('code_operation', handleRemoteOperation);
      return () => {
        socket.off('code_operation', handleRemoteOperation);
      };
    }
  }, [socket, user?.id, pendingOperations, transformOperation, applyOperation]);

  // Update user cursors from presence data
  useEffect(() => {
    const cursors: UserCursor[] = participants
      .filter(p => p.id !== user?.id)
      .map((participant, index) => ({
        userId: participant.id,
        userName: participant.name || 'Anonymous',
        position: { line: 1, column: 1 }, // Would come from presence data
        color: CURSOR_COLORS[index % CURSOR_COLORS.length]
      }));
    
    setUserCursors(cursors);
  }, [participants, user?.id]);

  const handleSave = async () => {
    try {
      await onSave?.(code);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast({
        title: 'Code Saved',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save your changes. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleCompile = async () => {
    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Compilation Successful',
          description: 'Your code compiled without errors!',
        });
      } else {
        toast({
          title: 'Compilation Failed',
          description: result.error || 'Unknown compilation error',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Compilation Error',
        description: 'Failed to compile code',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code Copied',
      description: 'Code copied to clipboard!',
    });
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_${Date.now()}.sol`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resolveConflict = (operationId: string, resolution: ConflictResolution) => {
    setConflicts(prev => prev.filter(c => c.id !== operationId));
    
    if (resolution.resolution === 'accept' && resolution.mergedContent) {
      setCode(resolution.mergedContent);
      if (editorRef.current) {
        editorRef.current.setValue(resolution.mergedContent);
      }
    }
    
    toast({
      title: 'Conflict Resolved',
      description: `Conflict resolved with ${resolution.resolution} strategy.`,
    });
  };

  return (
    <div className={`flex flex-col bg-slate-900 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-white">Collaborative Editor</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              <Clock className="w-3 h-3 mr-1" />
              Unsaved
            </Badge>
          )}
          {lastSaved && (
            <span className="text-xs text-gray-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Participants */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">{participants.length}</span>
            <div className="flex -space-x-2">
              {participants.slice(0, 3).map((participant) => (
                <div
                  key={participant.id}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-slate-800"
                  title={participant.name}
                >
                  {participant.name?.charAt(0) || 'A'}
                </div>
              ))}
            </div>
          </div>
          
          {/* Action buttons */}
          <Button size="sm" onClick={handleSave} disabled={!hasUnsavedChanges}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            onClick={handleCompile}
            className="bg-green-600 hover:bg-green-700 min-h-[44px]"
            aria-label="Compile Solidity code"
            aria-describedby="compile-help"
          >
            <Play className="w-4 h-4 mr-1" aria-hidden="true" />
            Compile
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
            aria-label="Copy code to clipboard"
            className="min-h-[44px]"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={downloadCode}
            aria-label="Download code as file"
            className="min-h-[44px]"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFullscreen(!isFullscreen)}
            aria-label={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
            className="min-h-[44px]"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="w-4 h-4" aria-hidden="true" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Settings functionality
              console.log('Open editor settings');
            }}
            aria-label="Open editor settings"
            className="min-h-[44px]"
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
          </Button>
          {lastSaved && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-400 border-green-400 min-h-[44px]"
              disabled
              aria-label="Code saved successfully"
            >
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Conflicts notification */}
      <AnimatePresence>
        {conflicts.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-yellow-600/20 border-b border-yellow-600/30 p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-200">
                  {conflicts.length} merge conflict{conflicts.length > 1 ? 's' : ''} detected
                </span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  // Auto-resolve conflicts by accepting all
                  conflicts.forEach(conflict => {
                    resolveConflict(conflict.id, { 
                      operationId: conflict.id, 
                      resolution: 'accept',
                      mergedContent: code 
                    });
                  });
                }}
              >
                Auto-resolve
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <div
        className="flex-1 relative"
        role="region"
        aria-label="Code editor"
      >
        <Editor
          height="100%"
          language={language}
          value={code}
          onMount={handleEditorDidMount}
          options={{
            theme: 'vs-dark',
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            readOnly,
            automaticLayout: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            folding: true,
            lineNumbers: 'on',
            glyphMargin: true,
            renderWhitespace: 'selection',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            // Enhanced accessibility options
            accessibilitySupport: 'on',
            ariaLabel: readOnly
              ? 'Read-only Solidity code editor. Use arrow keys to navigate.'
              : 'Solidity code editor. Type to edit code. Press F1 for help.',
            screenReaderAnnounceInlineSuggestion: true,
            tabFocusMode: false,
            unfoldOnClickAfterEndOfLine: true,
            links: true,
            colorDecorators: true,
            lightbulb: {
              enabled: !readOnly
            },
            hover: {
              enabled: true,
              delay: 300,
              sticky: true
            },
            parameterHints: {
              enabled: true,
              cycle: true
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showFunctions: true,
              showConstructors: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showStructs: true,
              showInterfaces: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showConstants: true,
              showEnums: true,
              showEnumMembers: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showIssues: true,
              showUsers: true,
              filterGraceful: true,
              snippetsPreventQuickSuggestions: false
            }
          }}
        />
        
        {/* User cursors overlay */}
        {userCursors.map((cursor) => (
          <div
            key={cursor.userId}
            className="absolute pointer-events-none z-10"
            style={{
              // This would need proper calculation based on Monaco's line height and character width
              top: `${cursor.position.line * 19}px`,
              left: `${cursor.position.column * 7.2}px`,
            }}
          >
            <div
              className="w-0.5 h-5 animate-pulse"
              style={{ backgroundColor: cursor.color }}
            />
            <div
              className="absolute -top-6 left-0 px-1 py-0.5 rounded text-xs text-white whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.userName}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonacoCollaborativeEditor;
