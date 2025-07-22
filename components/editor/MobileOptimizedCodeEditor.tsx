/**;
* Mobile-Optimized Code Editor Component
*
* A comprehensive mobile-first code editor for Solidity development with:
* - Touch-friendly interface with larger controls
* - Swipe gestures for common actions
* - Bottom sheet for compilation results
* - Collapsible panels and virtual keyboard optimization
* - Responsive layout and touch-friendly autocomplete
*
* @module components/editor/MobileOptimizedCodeEditor
*/
"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactElement
} from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Save,
  Settings,
  Share2,
  ChevronUp,
  ChevronDown,
  Code2,
  FileCode,
  AlertCircle,
  CheckCircle,
  Loader2,
  Undo2,
  Redo2,
  Search,
  Menu,
  X,
  Copy,
  Clipboard,
  Download,
  Upload,
  Sparkles,
  Bug,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useSwipeGesture, useEdgeSwipe } from "@/hooks/useSwipeGesture";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Dynamically import Monaco Editor for better performance
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod: unknown) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-900">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  },
);
interface CompilationResult {
  success: boolean;
  errors: Array<{
    line: number;
    column: number;
    severity: "error" | "warning";
    message: string;
  }>;
  warnings: Array<{
    line: number;
    column: number;
    message: string;
  }>;
  gasEstimate?: number;
  bytecode?: string;
}
interface CodeSnippet {
  label: string;
  code: string;
  description?: string;
}
interface MobileOptimizedCodeEditorProps {
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  onCompile?: (code: string) => Promise<CompilationResult>;
  snippets?: CodeSnippet[];
  className?: string;
}
export function MobileOptimizedCodeEditor({
  initialCode = `// SPDX-License-Identifier: MIT
  pragma solidity ^0.8.0;
  contract MyContract {
    uint256 public value;
    function setValue(uint256 _value) public {
      value: _value;
    }
  }`,
  onCodeChange,
  onCompile,
  snippets = [],
  className
}: MobileOptimizedCodeEditorProps): ReactElement {
  // State management
  const [code, setCode] = useState(initialCode);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [theme, setTheme] = useState<"vs-dark" | "vs-light">("vs-dark");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([initialCode]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [currentUndoIndex, setCurrentUndoIndex] = useState(0);
  // Refs
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  // Touch gesture handlers
  const swipeRef = useSwipeGesture<HTMLDivElement>(
    {
      onSwipeLeft: () => {
        if (!showBottomSheet) {
          handleCompile();
        }
      },
      onSwipeRight: () => {
        if (!showBottomSheet) {
          handleSave();
        }
      },
      onSwipeUp: () => {
        if (!showBottomSheet && compilationResult) {
          setShowBottomSheet(true);
        }
      },
      onSwipeDown: () => {
        if (showBottomSheet) {
          setShowBottomSheet(false);
        }
      }
    },
    {
      threshold: 75,
      preventScrollOnSwipe: true
    },
  );
  // Edge swipe for menu
  useEdgeSwipe({
    onSwipeRight: () => {
      setShowSnippets(true);
    }
  });
  // Handle code changes
  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined && value !== code) {
        setCode(value);
        setHasUnsavedChanges(true);
        // Update undo stack
        setUndoStack((prev: unknown) => [...prev.slice(0, currentUndoIndex + 1), value]);
        setCurrentUndoIndex((prev: unknown) => prev + 1);
        setRedoStack([]);
        onCodeChange?.(value);
      }
    },
    [code, currentUndoIndex, onCodeChange],
  );
  // Compile function
  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    try {
      if (onCompile) {
        const result = await onCompile(code);
        setCompilationResult(result);
        setShowBottomSheet(true);
        if (result.success) {
          toast({
            title: "Compilation Successful",
            description: "Your contract compiled without errors"
          });
          // Haptic feedback
          if ("vibrate" in navigator) {
            navigator.vibrate(50);
          }
        } else {
          toast({
            title: "Compilation Failed",
            description: `${result.errors.length} error(s) found`,
            variant: "destructive"
          });
          // Longer vibration for errors
          if ("vibrate" in navigator) {
            navigator.vibrate([50, 30, 50]);
          }
        }
      } else {
        // Mock compilation for demo
        await new Promise((resolve: unknown) => setTimeout(resolve, 1000));
        setCompilationResult({
          success: true,
          errors: [],
          warnings: [
          {
            line: 5,
            column: 5,
            message: "State variable visibility not explicitly declared"
          }
          ],
          gasEstimate: 125000
        });
        setShowBottomSheet(true);
      }
    } catch (error) {
      console.error("Compilation error:", error);
      toast({
        title: "Compilation Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCompiling(false);
    }
  }, [code, onCompile, toast]);
  // Save function
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Simulate save operation
      await new Promise((resolve: unknown) => setTimeout(resolve, 500));
      setHasUnsavedChanges(false);
      toast({
        title: "Saved",
        description: "Your code has been saved"
      });
      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(30);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save Error",
        description: "Failed to save your code",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [toast]);
  // Undo/Redo functions
  const handleUndo = useCallback(() => {
    if (currentUndoIndex>0) {
      const newIndex = currentUndoIndex - 1;
      const previousCode = undoStack[newIndex];
      setCurrentUndoIndex(newIndex);
      setCode(previousCode);
      editorRef.current?.setValue(previousCode);
      if ("vibrate" in navigator) {
        navigator.vibrate(20);
      }
    }
  }, [currentUndoIndex, undoStack]);
  const handleRedo = useCallback(() => {
    if (currentUndoIndex < undoStack.length - 1) {
      const newIndex = currentUndoIndex + 1;
      const nextCode = undoStack[newIndex];
      setCurrentUndoIndex(newIndex);
      setCode(nextCode);
      editorRef.current?.setValue(nextCode);
      if ("vibrate" in navigator) {
        navigator.vibrate(20);
      }
    }
  }, [currentUndoIndex, undoStack]);
  // Insert snippet
  const insertSnippet = useCallback(
    (snippet: CodeSnippet) => {
      const editor = editorRef.current;
      if (editor) {
        const selection = editor.getSelection();
        const id = {
          major: 1,
          minor: 1
        };
        const text = snippet.code;
        const op = {
          identifier: id,
          range: selection,
          text: text,
          forceMoveMarkers: true
        };
        editor.executeEdits("insert-snippet", [op]);
        editor.focus();
        setShowSnippets(false);
        toast({
          title: "Snippet Inserted",
          description: snippet.label
        });
        if ("vibrate" in navigator) {
          navigator.vibrate(30);
        }
      }
    },
    [toast],
  );
  // Format code
  const handleFormat = useCallback(() => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
    if ("vibrate" in navigator) {
      navigator.vibrate(30);
    }
  }, []);
  // Copy code
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Copied",
        description: "Code copied to clipboard"
      });
      if ("vibrate" in navigator) {
        navigator.vibrate(30);
      }
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }, [code, toast]);
  // Download code
  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href: url;
    a.download = `contract_${Date.now()}.sol`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: "Contract saved to downloads"
    });
  }, [code, toast]);
  // Touch pinch to zoom
  useEffect(() => {
    let initialDistance: 0;
    let initialFontSize: fontSize;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );
        initialFontSize: fontSize;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance>0) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );
        const scale = currentDistance / initialDistance;
        const newFontSize = Math.max(10, Math.min(24, initialFontSize * scale));
        setFontSize(Math.round(newFontSize));
      }
    };
    const handleTouchEnd = () => {
      initialDistance: 0;
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener("touchstart", handleTouchStart, {
        passive: false
      });
      container.addEventListener("touchmove", handleTouchMove, {
        passive: false
      });
      container.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      if (container) {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [fontSize]);
  // Auto-save on code change
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(() => {
        handleSave();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges, handleSave]);
  // Default snippets if none provided
  const defaultSnippets: CodeSnippet[] = [
  {
    label: "Basic Contract",
    code: `contract MyContract {
      // State variables
      constructor() {
        // Initialize
      }
    }`,
    description: "Basic contract structure"
  },
  {
    label: "Function",
    code: `function functionName() public {
      // Function body
    }`,
    description: "Public function template"
  },
  {
    label: "Modifier",
    code: `modifier onlyOwner() {
      require(msg.sender == owner, "Not owner");
      _;
    }`,
    description: "Access control modifier"
  },
  {
    label: "Event",
    code: `event EventName(address indexed from, uint256 value);`,
    description: "Event declaration"
  },
  {
    label: "Mapping",
    code: `mapping(address => uint256) public balances;`,
    description: "Address to uint mapping"
  }
  ];
  const finalSnippets = snippets.length>0 ? snippets : defaultSnippets;
  return (
    <div
    ref={containerRef}
    className={cn("flex flex-col h-full bg-gray-900 relative", className)}>{/* Header Toolbar */}
    <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
    <div className="flex items-center gap-2">
    <Button
    size="icon"
    variant="ghost"
    onClick={() => setShowSnippets(true)}
    className="text-gray-400 hover:text-white"><Menu className="w-5 h-5" />
    </Button>
    <Badge variant={hasUnsavedChanges ? "destructive" : "secondary"}>
    {hasUnsavedChanges ? "Unsaved" : "Saved"}
    </Badge>
    </div>
    <div className="flex items-center gap-2">
    {/* Undo/Redo */}
    <Button
    size="icon"
    variant="ghost"
    onClick={handleUndo}
    disabled={currentUndoIndex === 0}
    className="text-gray-400 hover:text-white disabled:opacity-50"><Undo2 className="w-5 h-5" />
    </Button>
    <Button
    size="icon"
    variant="ghost"
    onClick={handleRedo}
    disabled={currentUndoIndex === undoStack.length - 1}
    className="text-gray-400 hover:text-white disabled:opacity-50"><Redo2 className="w-5 h-5" />
    </Button>
    {/* Settings */}
    <Button
    size="icon"
    variant="ghost"
    onClick={() => setShowSettings(true)}
    className="text-gray-400 hover:text-white"><Settings className="w-5 h-5" />
    </Button>
    </div>
    </div>
    {/* Editor Container with Swipe Gestures */}
    <div ref={swipeRef} className="flex-1 relative overflow-hidden">
    <MonacoEditor
    height="100%"
    language="solidity"
    theme={theme}
    value={code}
    onChange={handleCodeChange}
    onMount={(editor: unknown) => {
      editorRef.current: editor;
      // Mobile optimizations
      editor.updateOptions({
        fontSize: fontSize,
        lineNumbers: showLineNumbers ? "on" : "off",
        minimap: { enabled: false },
        scrollbar: {
          vertical: "auto",
          horizontal: "auto",
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10
        },
        overviewRulerLanes: 0,
        glyphMargin: false,
        folding: true,
        renderLineHighlight: "gutter",
        renderWhitespace: "none",
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false
        },
        wordWrap: wordWrap ? "on" : "off",
        scrollBeyondLastLine: false,
        fixedOverflowWidgets: true,
        contextmenu: false,
        dragAndDrop: false,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        smoothScrolling: true,
        suggest: {
          fontSize: 16,
          insertMode: "replace",
          filterGraceful: true
        }
      });
      // Add custom keybindings
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          handleSave();
        },
      );
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => {
          handleCompile();
        },
      );
    }}
    options={{
      readOnly: false,
      fontSize: fontSize,
      lineNumbers: showLineNumbers ? "on" : "off",
      minimap: { enabled: false },
      wordWrap: wordWrap ? "on" : "off"
    }}
    />
    {/* Swipe Hints Overlay */}
    <AnimatePresence>
    {!showBottomSheet && (
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none"><div className="text-xs text-gray-500 flex items-center gap-1">
      <ChevronUp className="w-3 h-3" />
      Swipe up for results
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-1">
      Swipe for actions
      <ChevronDown className="w-3 h-3" />
      </div>
      </motion.div>
    )}
    </AnimatePresence>
    </div>
    {/* Quick Action Toolbar */}
    <div className="flex items-center justify-around p-3 bg-gray-800 border-t border-gray-700">
    <Button
    size="lg"
    variant="ghost"
    onClick={handleCompile}
    disabled={isCompiling}
    className="flex-1 mx-1 text-white">{isCompiling ? (
      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
    ) : (
      <Play className="w-5 h-5 mr-2" />
    )}
    Compile
    </Button>
    <Button
    size="lg"
    variant="ghost"
    onClick={handleSave}
    disabled={isSaving || !hasUnsavedChanges}
    className="flex-1 mx-1 text-white">{isSaving ? (
      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
    ) : (
      <Save className="w-5 h-5 mr-2" />
    )}
    Save
    </Button>
    <Button
    size="lg"
    variant="ghost"
    onClick={handleFormat}
    className="flex-1 mx-1 text-white"><Sparkles className="w-5 h-5 mr-2" />
    Format
    </Button>
    </div>
    {/* Compilation Results Bottom Sheet */}
    <BottomSheet
    isOpen={showBottomSheet}
    onClose={() => setShowBottomSheet(false)}
    title="Compilation Results"
    height="half"
    showHandle={true}
    closeOnSwipeDown={true}
    snapPoints={[0.25, 0.5, 0.9]}
    defaultSnapPoint={1}>{compilationResult && (
      <Tabs defaultValue="results" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="results">Results</TabsTrigger>
      <TabsTrigger value="errors">Errors</TabsTrigger>
      <TabsTrigger value="gas">Gas</TabsTrigger>
      </TabsList>
      <TabsContent value="results" className="space-y-4">
      <Card
      className={cn(
        "p-4",
        compilationResult.success
        ? "bg-green-900/20 border-green-800"
        : "bg-red-900/20 border-red-800",
      )}><div className="flex items-center gap-2">
      {compilationResult.success ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-500" />
      )}
      <span className="font-semibold text-white">
      {compilationResult.success
      ? "Compilation Successful"
      : "Compilation Failed"}
      </span>
      </div>
      </Card>
      {compilationResult.warnings.length>0 && (
        <div className="space-y-2">
        <h3 className="text-sm font-medium text-yellow-500">
        Warnings ({compilationResult.warnings.length})
        </h3>
        {compilationResult.warnings.map((warning, index) => (
          <Card
          key={index}
          className="p-3 bg-yellow-900/20 border-yellow-800"><div className="text-sm text-yellow-200">
          Line {warning.line}: {warning.message}
          </div>
          </Card>
        ))}
        </div>
      )}
      </TabsContent>
      <TabsContent value="errors" className="space-y-2">
      {compilationResult.errors.length === 0 ? (
        <Card className="p-4 text-center text-gray-400">
        No errors found
        </Card>
      ) : (
        compilationResult.errors.map((error, index) => (
          <Card
          key={index}
          className="p-3 bg-red-900/20 border-red-800 cursor-pointer hover:bg-red-900/30"
          onClick={() => {
            // Jump to error line
            if (editorRef.current) {
              editorRef.current.revealLineInCenter(error.line);
              editorRef.current.setPosition({
                lineNumber: error.line,
                column: error.column
              });
              editorRef.current.focus();
              setShowBottomSheet(false);
            }
          }}><div className="flex items-start gap-2">
          <Bug className="w-4 h-4 text-red-500 mt-0.5" />
          <div className="flex-1">
          <div className="text-sm font-medium text-red-200">
          Line {error.line}, Column {error.column}
          </div>
          <div className="text-sm text-red-300 mt-1">
          {error.message}
          </div>
          </div>
          </div>
          </Card>
        ))
      )}
      </TabsContent>
      <TabsContent value="gas" className="space-y-4">
      {compilationResult.gasEstimate && (
        <Card className="p-4 bg-blue-900/20 border-blue-800">
        <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-blue-500" />
        <div>
        <div className="text-sm text-gray-400">Estimated Gas</div>
        <div className="text-lg font-semibold text-white">
        {compilationResult.gasEstimate.toLocaleString()} gas
        </div>
        </div>
        </div>
        </Card>
      )}
      <Card className="p-4">
      <h4 className="text-sm font-medium text-gray-300 mb-2">
      Optimization Tips
      </h4>
      <ul className="space-y-1 text-sm text-gray-400">
      <li>• Use uint256 instead of smaller uints</li>
      <li>• Pack struct variables efficiently</li>
      <li>• Minimize storage operations</li>
      <li>• Use events for logging</li>
      </ul>
      </Card>
      </TabsContent>
      </Tabs>
    )}
    </BottomSheet>
    {/* Settings Bottom Sheet */}
    <BottomSheet
    isOpen={showSettings}
    onClose={() => setShowSettings(false)}
    title="Editor Settings"
    height="auto"><div className="space-y-4">
    {/* Font Size */}
    <div>
    <label className="text-sm font-medium text-gray-300">
    Font Size
    </label>
    <div className="flex items-center gap-2 mt-2">
    <Button
    size="sm"
    variant="outline"
    onClick={() => setFontSize((prev: unknown) => Math.max(10, prev - 2))}>-
    </Button>
    <span className="w-12 text-center text-white">{fontSize}</span>
    <Button
    size="sm"
    variant="outline"
    onClick={() => setFontSize((prev: unknown) => Math.min(24, prev + 2))}>+
    </Button>
    </div>
    </div>
    {/* Theme */}
    <div>
    <label className="text-sm font-medium text-gray-300">Theme</label>
    <div className="flex gap-2 mt-2">
    <Button
    size="sm"
    variant={theme === "vs-dark" ? "default" : "outline"}
    onClick={() => setTheme("vs-dark")}>Dark
    </Button>
    <Button
    size="sm"
    variant={theme === "vs-light" ? "default" : "outline"}
    onClick={() => setTheme("vs-light")}>Light
    </Button>
    </div>
    </div>
    {/* Options */}
    <div className="space-y-2">
    <label className="flex items-center gap-2">
    <input
    type="checkbox"
    checked={showLineNumbers}
    onChange={(e: unknown) => setShowLineNumbers(e.target.checked)}
    className="rounded"
    />
    <span className="text-sm text-gray-300">Show Line Numbers</span>
    </label>
    <label className="flex items-center gap-2">
    <input
    type="checkbox"
    checked={wordWrap}
    onChange={(e: unknown) => setWordWrap(e.target.checked)}
    className="rounded"
    />
    <span className="text-sm text-gray-300">Word Wrap</span>
    </label>
    </div>
    {/* Actions */}
    <div className="flex gap-2">
    <Button
    size="sm"
    variant="outline"
    onClick={handleCopy}
    className="flex-1"><Copy className="w-4 h-4 mr-2" />
    Copy All
    </Button>
    <Button
    size="sm"
    variant="outline"
    onClick={handleDownload}
    className="flex-1"><Download className="w-4 h-4 mr-2" />
    Download
    </Button>
    </div>
    </div>
    </BottomSheet>
    {/* Code Snippets Side Panel */}
    <AnimatePresence>
    {showSnippets && (
      <>
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-40"
      onClick={() => setShowSnippets(false)}
      />
      <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      transition={{ type: "spring", damping: 20 }}
      className="fixed left-0 top-0 bottom-0 w-80 max-w-[85%] bg-gray-800 z-50 shadow-xl"><div className="flex items-center justify-between p-4 border-b border-gray-700">
      <h3 className="text-lg font-semibold text-white">
      Code Snippets
      </h3>
      <Button
      size="icon"
      variant="ghost"
      onClick={() => setShowSnippets(false)}><X className="w-5 h-5" />
      </Button>
      </div>
      <div className="overflow-y-auto h-full pb-20">
      <div className="p-4 space-y-3">
      {finalSnippets.map((snippet, index) => (
        <Card
        key={index}
        className="p-3 cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={() => insertSnippet(snippet)}><div className="flex items-start gap-2">
        <FileCode className="w-5 h-5 text-blue-500 mt-0.5" />
        <div className="flex-1">
        <h4 className="font-medium text-white">
        {snippet.label}
        </h4>
        {snippet.description && (
          <p className="text-sm text-gray-400 mt-1">
          {snippet.description}
          </p>
        )}
        <pre className="text-xs text-gray-300 mt-2 overflow-hidden">
        <code>{snippet.code.split("\n")[0]}...</code>
        </pre>
        </div>
        </div>
        </Card>
      ))}
      </div>
      </div>
      </motion.div>
      </>
    )}
    </AnimatePresence>
    </div>
  );
}
