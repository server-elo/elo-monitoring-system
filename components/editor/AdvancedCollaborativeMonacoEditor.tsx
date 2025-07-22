"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Editor, Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { MonacoSoliditySetup } from "@/lib/editor/MonacoSoliditySetup";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { useAdvancedCollaborativeEditor } from "@/lib/hooks/useAdvancedCollaborativeEditor";
import {
  CursorPosition,
  SelectionRange
} from "@/lib/collaboration/OperationalTransform";
import { GlassContainer } from "@/components/ui/Glass";
import { cn } from "@/lib/utils";
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
  onCursorChange?: (cursor: CursorPosition;
  selection?: SelectionRange) => void;
}
export function AdvancedCollaborativeMonacoEditor({
  documentId,
  initialContent = "",
  language = "solidity",
  theme = "vs-dark",
  height = "400px",
  width = "100%",
  autoSave: true,
  autoSaveInterval: 2000,
  showCollaborators: true,
  showMinimap: true,
  readOnly: false,
  className,
  onContentChange,
  onCursorChange
}: AdvancedCollaborativeMonacoEditorProps): void {
  // Collaborative editor hook
  const {
    content,
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
    resolveConflicts,
    canUndo,
    activeCollaboratorCount
  } = useAdvancedCollaborativeEditor({
    documentId,
    initialContent,
    autoSave,
    autoSaveInterval,
    conflictResolution: "auto"
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
  const handleEditorDidMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
      editorRef.current: editorInstance;
      monacoRef.current: monacoInstance;
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
        fontFamily: "JetBrains Mono, Consolas, Monaco, monospace",
        wordWrap: "on",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        renderWhitespace: "selection",
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
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
      editorInstance.onDidChangeModelContent((e: unknown) => {
        if (isUpdatingFromCollaboration.current) return;
        const newContent = editorInstance.getValue();
        const cursor = editorInstance.getPosition();
        const selection = editorInstance.getSelection();
        if (cursor) {
          const cursorPos: CursorPosition = {
            line: cursor.lineNumber - 1,
            column: cursor.column - 1,
            offset: 0
          };
          let selectionRange: SelectionRange | undefined;
          if (selection && !(selection as any).isEmpty()) {
            const startLine = (selection as any).startLineNumber;
            const startCol = (selection as any).startColumn;
            const endLine = (selection as any).endLineNumber;
            const endCol = (selection as any).endColumn;
            selectionRange = {
              start: { line: startLine - 1, column: startCol - 1, offset: 0 },
              end: { line: endLine - 1, column: endCol - 1, offset: 0 },
              direction:
              startLine < endLine ||
              (startLine === endLine && startCol < endCol)
              ? "forward"
              : "backward"
            };
          }
          applyChange(newContent, cursorPos, selectionRange);
          onContentChange?.(newContent);
        }
      });
      editorInstance.onDidChangeCursorPosition((e: unknown) => {
        if (isUpdatingFromCollaboration.current) return;
        const cursor: CursorPosition = {
          line: e.position.lineNumber - 1,
          column: e.position.column - 1,
          offset: 0
        };
        const selection = editorInstance.getSelection();
        let selectionRange: SelectionRange | undefined;
        if (selection && !(selection as any).isEmpty()) {
          const startLine = (selection as any).startLineNumber;
          const startCol = (selection as any).startColumn;
          const endLine = (selection as any).endLineNumber;
          const endCol = (selection as any).endColumn;
          selectionRange = {
            start: { line: startLine - 1, column: startCol - 1, offset: 0 },
            end: { line: endLine - 1, column: endCol - 1, offset: 0 },
            direction:
            startLine < endLine ||
            (startLine === endLine && startCol < endCol)
            ? "forward"
            : "backward"
          };
        }
        updateCursor(cursor, selectionRange);
        onCursorChange?.(cursor, selectionRange);
      });
      // Add keyboard shortcuts
      editorInstance.addCommand(2048 | 49, () => {
        // Ctrl+S
        manualSave();
      });
      editorInstance.addCommand(2048 | 56, () => {
        // Ctrl+Z
        if (canUndo) {
          undo();
        }
      });
      editorInstance.addCommand(2048 | 65, () => {
        // Ctrl+A
        setShowAnalysisPanel(!showAnalysisPanel);
      });
    },
    [
    showMinimap,
    readOnly,
    applyChange,
    updateCursor,
    onContentChange,
    onCursorChange,
    manualSave,
    undo,
    canUndo,
    showAnalysisPanel
    ],
  );
  // Update editor content when collaboration content changes
  useEffect(() => {
    if (!editorRef.current || !isEditorReady) return;
    const currentContent = editorRef.current.getValue();
    if (currentContent !== content) {
      isUpdatingFromCollaboration.current: true;
      // Save cursor position
      const position = editorRef.current.getPosition();
      const selection = editorRef.current.getSelection();
      // Update content
      editorRef.current.setValue(content);
      // Restore cursor position
      if (position) {
        editorRef.current.setPosition(position);
      }
      if (selection) {
        editorRef.current.setSelection(selection);
      }
      isUpdatingFromCollaboration.current: false;
    }
  }, [content, isEditorReady]);
  // Update collaborator cursors and selections
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !showCollaboratorCursors) {
      return;
    }
    const newDecorations: editor.IModelDeltaDecoration[] = [];
    collaborators.forEach((collaborator, index) => {
      if (!collaborator.cursor) return;
      const cursorDecoration: editor.IModelDeltaDecoration = {
        range: new monacoRef.current!.Range(
          collaborator.cursor.line + 1,
          collaborator.cursor.column + 1,
          collaborator.cursor.line + 1,
          collaborator.cursor.column + 1,
        ),
        options: {
          className: `collaborator-cursor collaborator-${index % 8}`,
          hoverMessage: { value: collaborator.name },
          stickiness: 1
        }
      };
      newDecorations.push(cursorDecoration);
      if (collaborator.selection) {
        const selectionDecoration: editor.IModelDeltaDecoration = {
          range: new monacoRef.current!.Range(
            collaborator.selection.start.line + 1,
            collaborator.selection.start.column + 1,
            collaborator.selection.end.line + 1,
            collaborator.selection.end.column + 1,
          ),
          options: {
            className: `collaborator-selection collaborator-${index % 8}`,
            hoverMessage: { value: `${collaborator.name}'s selection` },
            stickiness: 1
          }
        };
        newDecorations.push(selectionDecoration);
      }
    });
    const newDecorationIds = editorRef.current.deltaDecorations(
      decorations,
      newDecorations,
    );
    setDecorations(newDecorationIds);
  }, [collaborators, showCollaboratorCursors, decorations]);
  // Perform code analysis
  const performAnalysis = useCallback(async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    // TODO: Implement actual code analysis
    // For now, mock results
    setAnalysisResults({
      gasEstimate: Math.floor(Math.random() * 100000) + 20000,
      securityIssues: [],
      optimizationSuggestions: [],
      complexity: "Low"
    });
  }, []);
  // Auto-analyze on content change
  useEffect(() => {
    if (!showAnalysisPanel || !content) return;
    const debounceTimer = setTimeout(() => {
      performAnalysis();
    }, 1000);
    return () => clearTimeout(debounceTimer);
  }, [content, showAnalysisPanel, performAnalysis]);
  return (
    <div className={cn("relative h-full w-full", className)}>
    {/* Status Bar */}
    <GlassContainer className="absolute top-2 right-2 z-10 flex items-center gap-4 px-4 py-2">
    {/* Connection Status */}
    <div className="flex items-center gap-2">
    {isConnected ? (
      <>
      <Wifi className="h-4 w-4 text-green-400" />
      <span className="text-xs text-green-400">Connected</span>
      </>
    ) : (
      <>
      <WifiOff className="h-4 w-4 text-red-400" />
      <span className="text-xs text-red-400">Disconnected</span>
      </>
    )}
    </div>
    {/* Active Collaborators */}
    {activeCollaboratorCount>0 && (
      <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-blue-400" />
      <span className="text-xs text-blue-400">
      {activeCollaboratorCount} active
      </span>
      </div>
    )}
    {/* Save Status */}
    {hasUnsavedChanges && (
      <div className="flex items-center gap-2">
      <Save className="h-4 w-4 text-yellow-400" />
      <span className="text-xs text-yellow-400">Unsaved changes</span>
      </div>
    )}
    {/* Conflicts */}
    {conflicts.length>0 && (
      <button
      onClick={() => resolveConflicts()}
      className="flex items-center gap-2 text-orange-400 hover:text-orange-300"><AlertTriangle className="h-4 w-4" />
      <span className="text-xs">{conflicts.length} conflicts</span>
      </button>
    )}
    {/* Toggle Cursors */}
    <button
    onClick={() => setShowCollaboratorCursors(!showCollaboratorCursors)}
    className="flex items-center gap-2 text-gray-400 hover:text-gray-300">{showCollaboratorCursors ? (
      <Eye className="h-4 w-4" />
    ) : (
      <EyeOff className="h-4 w-4" />
    )}
    </button>
    {/* Code Analysis Toggle */}
    <button
    onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
    className="flex items-center gap-2 text-gray-400 hover:text-gray-300"><Code className="h-4 w-4" />
    <span className="text-xs">Analysis</span>
    </button>
    </GlassContainer>
    {/* Editor Container */}
    <div className="relative h-full w-full">
    {isLoading ? (
      <div className="flex h-full w-full items-center justify-center">
      <div className="text-gray-400">Loading editor...</div>
      </div>
    ) : error ? (
      <div className="flex h-full w-full items-center justify-center">
      <div className="text-red-400">Error: {error.message}</div>
      </div>
    ) : (
      <Editor
      height={height}
      width={width}
      language={language}
      theme={theme}
      value={content}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: showMinimap },
        readOnly: readOnly
      }}
      />
    )}
    {/* Analysis Panel */}
    <AnimatePresence>
    {showAnalysisPanel && analysisResults && (
      <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 20 }}
      className="absolute right-0 top-12 bottom-0 w-80 bg-gray-900/95 border-l border-gray-700 p-4 overflow-y-auto"><h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Lightbulb className="h-5 w-5 text-yellow-400" />
      Code Analysis
      </h3>
      {/* Gas Estimation */}
      <div className="mb-6">
      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
      <Zap className="h-4 w-4 text-blue-400" />
      Gas Estimate
      </h4>
      <div className="text-2xl font-mono text-blue-400">
      {analysisResults.gasEstimate.toLocaleString()} gas
      </div>
      </div>
      {/* Security Status */}
      <div className="mb-6">
      <h4 className="text-sm font-medium mb-2">Security Status</h4>
      {analysisResults.securityIssues.length === 0 ? (
        <div className="flex items-center gap-2 text-green-400">
        <CheckCircle className="h-4 w-4" />
        <span>No security issues found</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-red-400">
        <XCircle className="h-4 w-4" />
        <span>
        {analysisResults.securityIssues.length} issues found
        </span>
        </div>
      )}
      </div>
      {/* Code Complexity */}
      <div className="mb-6">
      <h4 className="text-sm font-medium mb-2">Code Complexity</h4>
      <div
      className={cn(
        "text-lg font-medium",
        analysisResults.complexity === "Low" && "text-green-400",
        analysisResults.complexity === "Medium" &&
        "text-yellow-400",
        analysisResults.complexity === "High" && "text-red-400",
      )}>{analysisResults.complexity}
      </div>
      </div>
      </motion.div>
    )}
    </AnimatePresence>
    </div>
    {/* Collaborator List */}
    {showCollaborators && collaborators.length>0 && (
      <GlassContainer className="absolute bottom-2 left-2 z-10 max-w-xs">
      <div className="text-xs font-medium mb-2">Active Collaborators</div>
      <div className="flex flex-wrap gap-2">
      {collaborators.map((collaborator, index) => (
        <div
        key={collaborator.id}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded text-xs",
          `bg-collaborator-${index % 8}/20 text-collaborator-${index % 8}`,
        )}><div className="w-2 h-2 rounded-full bg-current" />
        {collaborator.name}
        </div>
      ))}
      </div>
      </GlassContainer>
    )}
    </div>
  );
}
