'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Editor, Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { MonacoSoliditySetup } from '@/lib/editor/MonacoSoliditySetup';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Wifi,
  WifiOff,
  Save,
  Undo,
  AlertTriangle,
  Eye,
  EyeOff,
  Code,
  CheckCircle,
  XCircle,
  Lightbulb,
  Zap
} from 'lucide-react';
import { useAdvancedCollaborativeEditor } from '@/lib/hooks/useAdvancedCollaborativeEditor';
import { CursorPosition, SelectionRange } from '@/lib/collaboration/OperationalTransform';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

export interface AdvancedCollaborativeMonacoEditorProps {
  documentId: string;
  initialContent?: string;
  language?: string;
  theme?: string;
  height?: string | number;
  width?: string | number;
  autoSave?: boolean;
  autoSaveInterval?: number;
  showCollaborators?: boolean;
  showMinimap?: boolean;
  readOnly?: boolean;
  className?: string;
  onContentChange?: (content: string) => void;
  onCursorChange?: (cursor: CursorPosition, selection?: SelectionRange) => void;
}

export function AdvancedCollaborativeMonacoEditor({
  documentId,
  initialContent = '',
  language = 'solidity',
  theme: _theme = 'vs-dark',
  height = '400px',
  width = '100%',
  autoSave = true,
  autoSaveInterval = 2000,
  showCollaborators = true,
  showMinimap = true,
  readOnly = false,
  className,
  onContentChange,
  onCursorChange
}: AdvancedCollaborativeMonacoEditorProps) {
  // Collaborative editor hook
  const {
    content,
    version: _version,
    collaborators,
    isConnected,
    hasUnsavedChanges,
    conflicts,
    isLoading,
    error,
    applyChange,
    updateCursor,
    undo,
    manualSave,
    resolveConflicts: _resolveConflicts,
    canUndo,
    activeCollaboratorCount
  } = useAdvancedCollaborativeEditor({
    documentId,
    initialContent,
    autoSave,
    autoSaveInterval,
    conflictResolution: 'auto'
  });

  // Monaco editor refs and state
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [showCollaboratorCursors, setShowCollaboratorCursors] = useState(true);
  const [decorations, setDecorations] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const isUpdatingFromCollaboration = useRef(false);

  // Handle editor mount
  const handleEditorDidMount = useCallback((
    editorInstance: editor.IStandaloneCodeEditor,
    monacoInstance: Monaco
  ) => {
    editorRef.current = editorInstance;
    monacoRef.current = monacoInstance;

    // Initialize Solidity language support
    MonacoSoliditySetup.initialize();

    // Setup semantic analysis for the model
    const model = editorInstance.getModel();
    if (model) {
      MonacoSoliditySetup.setupSemanticAnalysis(model);
    }

    setIsEditorReady(true);

    // Configure editor options with enhanced features
    editorInstance.updateOptions({
      minimap: { enabled: showMinimap },
      readOnly: readOnly,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
      wordWrap: 'on',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true
      },
      // Enhanced features
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
        showUsers: true
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
      parameterHints: {
        enabled: true,
        cycle: true
      },
      hover: {
        enabled: true,
        delay: 300
      },
      lightbulb: {
        enabled: true
      }
    });

    // Set up event listeners
    editorInstance.onDidChangeModelContent((_e) => {
      if (isUpdatingFromCollaboration.current) return;

      const newContent = editorInstance.getValue();
      const cursor = editorInstance.getPosition();
      const selection = editorInstance.getSelection();

      if (cursor) {
        const cursorPos: CursorPosition = {
          line: cursor.lineNumber - 1, // Monaco uses 1-based, we use 0-based
          column: cursor.column - 1,
          offset: 0 // Simplified without getOffsetAt
        };

        let selectionRange: SelectionRange | undefined;
        if (selection && !(selection as any).isEmpty()) {
          // Monaco Selection is based on Range, so we can get the values directly
          const startLine = (selection as any).startLineNumber;
          const startCol = (selection as any).startColumn;
          const endLine = (selection as any).endLineNumber;
          const endCol = (selection as any).endColumn;
          
          selectionRange = {
            start: {
              line: startLine - 1,
              column: startCol - 1,
              offset: 0
            },
            end: {
              line: endLine - 1,
              column: endCol - 1,
              offset: 0
            },
            direction: (startLine < endLine || (startLine === endLine && startCol < endCol)) ? 'forward' : 'backward'
          };
        }

        applyChange(newContent, cursorPos, selectionRange);
        onContentChange?.(newContent);
      }
    });

    editorInstance.onDidChangeCursorPosition((e) => {
      if (isUpdatingFromCollaboration.current) return;

      const cursor: CursorPosition = {
        line: e.position.lineNumber - 1,
        column: e.position.column - 1,
        offset: 0 // Simplified without getOffsetAt
      };

      const selection = editorInstance.getSelection();
      let selectionRange: SelectionRange | undefined;
      
      if (selection && !(selection as any).isEmpty()) {
        // Monaco Selection is based on Range, so we can get the values directly
        const startLine = (selection as any).startLineNumber;
        const startCol = (selection as any).startColumn;
        const endLine = (selection as any).endLineNumber;
        const endCol = (selection as any).endColumn;
        
        selectionRange = {
          start: {
            line: startLine - 1,
            column: startCol - 1,
            offset: 0
          },
          end: {
            line: endLine - 1,
            column: endCol - 1,
            offset: 0
          },
          direction: (startLine < endLine || (startLine === endLine && startCol < endCol)) ? 'forward' : 'backward'
        };
      }

      updateCursor(cursor, selectionRange);
      onCursorChange?.(cursor, selectionRange);
    });

    // Add keyboard shortcuts
    editorInstance.addCommand(2048 | 49, () => { // Ctrl+S
      manualSave();
    });

    editorInstance.addCommand(2048 | 56, () => { // Ctrl+Z
      if (canUndo) {
        undo();
      }
    });

    // Add command for formatting
    editorInstance.addCommand(1024 | 512 | 36, () => { // Shift+Alt+F
      editorInstance.getAction('editor.action.formatDocument')?.run();
    });

    // Add command for quick fix
    editorInstance.addCommand(2048 | 84, () => { // Ctrl+Period
      editorInstance.getAction('editor.action.quickFix')?.run();
    });

    // Listen for semantic analysis results
    const handleAnalysisComplete = (event: CustomEvent) => {
      const model = editorInstance.getModel();
      if (model && (model as any).uri && event.detail.modelId === (model as any).uri.toString()) {
        setAnalysisResults(event.detail.result);
      }
    };

    window.addEventListener('solidity-analysis-complete', handleAnalysisComplete as EventListener);

    return () => {
      window.removeEventListener('solidity-analysis-complete', handleAnalysisComplete as EventListener);
    };
  }, [
    showMinimap,
    readOnly,
    applyChange,
    updateCursor,
    manualSave,
    undo,
    canUndo,
    onContentChange,
    onCursorChange
  ]);

  // Update editor content when collaboration changes
  useEffect(() => {
    if (!editorRef.current || !isEditorReady) return;

    const currentContent = editorRef.current.getValue();
    if (currentContent !== content) {
      isUpdatingFromCollaboration.current = true;
      
      // Preserve cursor position
      const position = editorRef.current.getPosition();
      const selection = editorRef.current.getSelection();
      
      editorRef.current.setValue(content);
      
      // Restore cursor position if possible
      if (position) {
        editorRef.current.setPosition(position);
      }
      if (selection) {
        editorRef.current.setSelection(selection);
      }
      
      setTimeout(() => {
        isUpdatingFromCollaboration.current = false;
      }, 100);
    }
  }, [content, isEditorReady]);

  // Render collaborator cursors
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !showCollaboratorCursors) return;

    const newDecorations: Array<any> = [];

    collaborators.forEach(collaborator => {
      if (!collaborator.isActive || !collaborator.cursor) return;

      const position = new monacoRef.current!.Position(
        collaborator.cursor.line + 1, // Convert to 1-based
        collaborator.cursor.column + 1
      );

      // Cursor decoration
      newDecorations.push({
        range: new monacoRef.current!.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ),
        options: {
          className: 'collaborator-cursor',
          beforeContentClassName: 'collaborator-cursor-line',
          afterContentClassName: 'collaborator-cursor-label',
          after: {
            content: collaborator.name,
            inlineClassName: 'collaborator-cursor-name',
            inlineClassNameAffectsLetterSpacing: true
          },
          stickiness: 1
        }
      });

      // Selection decoration
      if (collaborator.selection) {
        const startPos = new monacoRef.current!.Position(
          collaborator.selection.start.line + 1,
          collaborator.selection.start.column + 1
        );
        const endPos = new monacoRef.current!.Position(
          collaborator.selection.end.line + 1,
          collaborator.selection.end.column + 1
        );

        newDecorations.push({
          range: new monacoRef.current!.Range(
            startPos.lineNumber,
            startPos.column,
            endPos.lineNumber,
            endPos.column
          ),
          options: {
            className: 'collaborator-selection',
            stickiness: 1
          }
        });
      }
    });

    const newDecorationIds = editorRef.current.deltaDecorations(decorations, newDecorations);
    setDecorations(newDecorationIds);
  }, [collaborators, showCollaboratorCursors, decorations]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (canUndo) {
      undo();
    }
  }, [canUndo, undo]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <div className="text-gray-400">Loading editor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Editor Toolbar */}
      <GlassContainer
        intensity="light"
        tint="neutral"
        border
        className="flex items-center justify-between p-3 mb-2"
      >
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-sm text-gray-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Collaborators */}
          {showCollaborators && (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">
                {activeCollaboratorCount} active
              </span>
              
              {/* Collaborator Avatars */}
              <div className="flex -space-x-2">
                {collaborators.slice(0, 5).map(collaborator => (
                  <div
                    key={collaborator.id}
                    className="w-6 h-6 rounded-full border-2 border-gray-700 flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: collaborator.color }}
                    title={collaborator.name}
                  >
                    {collaborator.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {collaborators.length > 5 && (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-700 bg-gray-600 flex items-center justify-center text-xs font-medium text-white">
                    +{collaborators.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conflicts Indicator */}
          {conflicts.length > 0 && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{conflicts.length} conflicts</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Cursor Visibility Toggle */}
          <button
            onClick={() => setShowCollaboratorCursors(!showCollaboratorCursors)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title={showCollaboratorCursors ? 'Hide cursors' : 'Show cursors'}
          >
            {showCollaboratorCursors ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>

          {/* Analysis Panel Toggle */}
          <button
            onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
            className={cn(
              'p-1 transition-colors',
              showAnalysisPanel ? 'text-blue-400' : 'text-gray-400 hover:text-white'
            )}
            title="Toggle analysis panel"
          >
            <Code className="w-4 h-4" />
          </button>

          {/* Save Button */}
          <button
            onClick={manualSave}
            disabled={!hasUnsavedChanges}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>

          {/* Unsaved Changes Indicator */}
          {hasUnsavedChanges && (
            <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Unsaved changes" />
          )}
        </div>
      </GlassContainer>

      {/* Main Editor Container */}
      <div className="flex">
        {/* Monaco Editor */}
        <div className="flex-1 relative">
          <Editor
            height={height}
            width={showAnalysisPanel ? '70%' : width}
            language={language}
            theme="solidity-dark"
            value={content}
            onMount={handleEditorDidMount}
            options={{
              readOnly: readOnly,
              minimap: { enabled: showMinimap },
              fontSize: 14,
              lineHeight: 20,
              fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              }
            }}
          />

          {/* Loading Overlay */}
          <AnimatePresence>
            {!isEditorReady && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="text-gray-400">Initializing editor...</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Analysis Panel */}
        <AnimatePresence>
          {showAnalysisPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '30%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-gray-600"
            >
              <AnalysisPanel analysisResults={analysisResults} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom Styles for Collaborator Cursors */}
      <style jsx global>{`
        .collaborator-cursor {
          border-left: 2px solid var(--collaborator-color, #4ECDC4);
          position: relative;
        }
        
        .collaborator-cursor-line::before {
          content: '';
          position: absolute;
          top: 0;
          left: -1px;
          width: 2px;
          height: 100%;
          background-color: var(--collaborator-color, #4ECDC4);
        }
        
        .collaborator-cursor-name {
          background-color: var(--collaborator-color, #4ECDC4);
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 500;
          position: absolute;
          top: -20px;
          left: -1px;
          white-space: nowrap;
          z-index: 1000;
        }
        
        .collaborator-selection {
          background-color: var(--collaborator-color, #4ECDC4);
          opacity: 0.2;
        }
      `}</style>
    </div>
  );
}

// Analysis Panel Component
function AnalysisPanel({ analysisResults }: { analysisResults: any }) {
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings' | 'suggestions' | 'symbols'>('errors');

  if (!analysisResults) {
    return (
      <div className="h-full bg-gray-800/50 backdrop-blur-sm p-4">
        <div className="text-gray-400 text-center">
          <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No analysis results</p>
        </div>
      </div>
    );
  }

  const { errors, warnings, suggestions, symbols } = analysisResults;

  const tabs = [
    { id: 'errors', label: 'Errors', count: errors.length, icon: XCircle, color: 'text-red-400' },
    { id: 'warnings', label: 'Warnings', count: warnings.length, icon: AlertTriangle, color: 'text-yellow-400' },
    { id: 'suggestions', label: 'Suggestions', count: suggestions.length, icon: Lightbulb, color: 'text-blue-400' },
    { id: 'symbols', label: 'Symbols', count: symbols.length, icon: CheckCircle, color: 'text-green-400' },
  ];

  return (
    <div className="h-full bg-gray-800/50 backdrop-blur-sm flex flex-col">
      {/* Tab Header */}
      <div className="border-b border-gray-600 p-2">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors',
                  activeTab === tab.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                )}
              >
                <Icon className={cn('w-4 h-4', tab.color)} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    tab.color.replace('text-', 'bg-').replace('-400', '-500/20'),
                    tab.color
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'errors' && (
          <div className="space-y-3">
            {errors.length === 0 ? (
              <div className="text-center text-gray-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p>No errors found!</p>
              </div>
            ) : (
              errors.map((error: any, index: number) => (
                <div key={index} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{error.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Line {error.startLineNumber}, Column {error.startColumn}
                      </p>
                      {error.code && (
                        <p className="text-xs text-red-300 mt-1">Code: {error.code}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'warnings' && (
          <div className="space-y-3">
            {warnings.length === 0 ? (
              <div className="text-center text-gray-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p>No warnings!</p>
              </div>
            ) : (
              warnings.map((warning: any, index: number) => (
                <div key={index} className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{warning.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Line {warning.startLineNumber}, Column {warning.startColumn}
                      </p>
                      {warning.code && (
                        <p className="text-xs text-yellow-300 mt-1">Code: {warning.code}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-3">
            {suggestions.length === 0 ? (
              <div className="text-center text-gray-400">
                <Zap className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <p>No suggestions available</p>
              </div>
            ) : (
              suggestions.map((suggestion: string, index: number) => (
                <div key={index} className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-white">{suggestion}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'symbols' && (
          <div className="space-y-3">
            {symbols.length === 0 ? (
              <div className="text-center text-gray-400">
                <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No symbols found</p>
              </div>
            ) : (
              symbols.map((symbol: any, index: number) => (
                <div key={index} className="p-3 bg-gray-700/30 border border-gray-600/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      symbol.type === 'contract' ? 'bg-purple-400' :
                      symbol.type === 'function' ? 'bg-blue-400' :
                      symbol.type === 'variable' ? 'bg-green-400' :
                      symbol.type === 'event' ? 'bg-yellow-400' :
                      'bg-gray-400'
                    )} />
                    <span className="text-sm font-medium text-white">{symbol.name}</span>
                    <span className="text-xs text-gray-400">({symbol.type})</span>
                  </div>
                  {symbol.visibility && (
                    <p className="text-xs text-gray-400 mt-1">
                      Visibility: {symbol.visibility}
                    </p>
                  )}
                  {symbol.mutability && (
                    <p className="text-xs text-gray-400">
                      Mutability: {symbol.mutability}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
