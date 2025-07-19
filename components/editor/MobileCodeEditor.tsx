'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MobileEditorToolbar } from './MobileEditorToolbar';
;
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { withPerformanceOptimization } from '@/lib/components/PerformanceOptimizer';

// Dynamically import Monaco to reduce initial bundle size
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }
);

interface MobileCodeEditorProps {
  documentId?: string;
  initialContent?: string;
  language?: string;
  theme?: string;
  height?: string | number;
  autoSave?: boolean;
  autoSaveInterval?: number;
  readOnly?: boolean;
  className?: string;
  onContentChange?: (content: string) => void;
  onRun?: () => void;
  onShare?: () => void;
  showLineNumbers?: boolean;
  fontSize?: number;
}

function MobileCodeEditorComponent({
  documentId: _documentId,
  initialContent = '',
  language = 'solidity',
  theme = 'vs-dark',
  height = '100%',
  autoSave = true,
  autoSaveInterval = 2000,
  readOnly = false,
  className,
  onContentChange,
  onRun,
  onShare,
  showLineNumbers = true,
  fontSize = 14
}: MobileCodeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(fontSize);
  const [showNumbers, setShowNumbers] = useState(showLineNumbers);
  const [isFullscreen] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([initialContent]);
  const [_redoStack, setRedoStack] = useState<string[]>([]);
  const [currentUndoIndex, setCurrentUndoIndex] = useState(0);
  
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedContent = useRef(initialContent);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && hasChanges) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, autoSaveInterval);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, hasChanges, autoSave, autoSaveInterval]);

  // Handle content changes
  const handleContentChange = useCallback((value: string | undefined) => {
    if (value !== undefined && value !== content) {
      setContent(value);
      setHasChanges(value !== lastSavedContent.current);
      
      // Update undo stack
      setUndoStack(prev => [...prev.slice(0, currentUndoIndex + 1), value]);
      setCurrentUndoIndex(prev => prev + 1);
      setRedoStack([]);
      
      onContentChange?.(value);
    }
  }, [content, currentUndoIndex, onContentChange]);

  // Save functionality
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      lastSavedContent.current = content;
      setHasChanges(false);
      
      // Show success feedback with haptic
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content]);

  // Run functionality
  const handleRun = useCallback(async () => {
    setIsRunning(true);
    
    try {
      await handleSave();
      await onRun?.();
    } finally {
      setIsRunning(false);
    }
  }, [handleSave, onRun]);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (currentUndoIndex > 0) {
      const newIndex = currentUndoIndex - 1;
      const previousContent = undoStack[newIndex];
      
      setCurrentUndoIndex(newIndex);
      setContent(previousContent);
      editorRef.current?.setValue(previousContent);
      
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
  }, [currentUndoIndex, undoStack]);

  const handleRedo = useCallback(() => {
    if (currentUndoIndex < undoStack.length - 1) {
      const newIndex = currentUndoIndex + 1;
      const nextContent = undoStack[newIndex];
      
      setCurrentUndoIndex(newIndex);
      setContent(nextContent);
      editorRef.current?.setValue(nextContent);
      
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
  }, [currentUndoIndex, undoStack]);

  // Format code
  const handleFormat = useCallback(() => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
    
    if ('vibrate' in navigator) {
      navigator.vibrate(40);
    }
  }, []);

  // Copy/Paste
  const handleCopy = useCallback(async () => {
    const selection = editorRef.current?.getSelection();
    const model = editorRef.current?.getModel();
    
    if (selection && model) {
      const text = model.getValueInRange(selection);
      
      try {
        await navigator.clipboard.writeText(text);
        
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }
      } catch (error) {
        console.error('Copy failed:', error);
      }
    }
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      editorRef.current?.trigger('keyboard', 'type', { text });
      
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    } catch (error) {
      console.error('Paste failed:', error);
    }
  }, []);

  // Search
  const handleSearch = useCallback(() => {
    editorRef.current?.getAction('actions.find')?.run();
  }, []);

  // Zoom
  const handleZoomIn = useCallback(() => {
    setEditorFontSize(prev => Math.min(prev + 2, 24));
  }, []);

  const handleZoomOut = useCallback(() => {
    setEditorFontSize(prev => Math.max(prev - 2, 10));
  }, []);

  // Settings
  const handleSettings = useCallback(() => {
    setShowNumbers(prev => !prev);
  }, []);

  // Download
  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_${Date.now()}.sol`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content]);

  // Fullscreen toggle - handled by toolbar button
  // const _toggleFullscreen = useCallback(() => {
  //   if (!document.fullscreenElement) {
  //     containerRef.current?.requestFullscreen();
  //     setIsFullscreen(true);
  //   } else {
  //     document.exitFullscreen();
  //     setIsFullscreen(false);
  //   }
  // }, []);

  // Touch pinch to zoom
  useEffect(() => {
    let initialDistance = 0;
    let initialFontSize = editorFontSize;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        initialFontSize = editorFontSize;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance > 0) {
        e.preventDefault();
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        const scale = currentDistance / initialDistance;
        const newFontSize = Math.max(10, Math.min(24, initialFontSize * scale));
        
        setEditorFontSize(Math.round(newFontSize));
      }
    };

    const handleTouchEnd = () => {
      initialDistance = 0;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [editorFontSize]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex flex-col h-full bg-gray-900",
        isFullscreen && "fixed inset-0 z-50",
        className
      )}
    >
      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          height={height}
          language={language}
          theme={theme}
          value={content}
          onChange={handleContentChange}
          onMount={(editor) => {
            editorRef.current = editor;
            
            // Mobile optimizations
            editor.updateOptions({
              fontSize: editorFontSize,
              lineNumbers: showNumbers ? 'on' : 'off',
              minimap: { enabled: false },
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8
              },
              overviewRulerLanes: 0,
              glyphMargin: false,
              folding: false,
              renderLineHighlight: 'none',
              renderWhitespace: 'none',
              quickSuggestions: false,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              fixedOverflowWidgets: true,
              contextmenu: false,
              // Touch optimizations
              dragAndDrop: false,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true
            });
          }}
          options={{
            readOnly,
            fontSize: editorFontSize,
            lineNumbers: showNumbers ? 'on' : 'off',
            minimap: { enabled: false }
          }}
        />
      </div>

      {/* Mobile Toolbar */}
      <MobileEditorToolbar
        onRun={handleRun}
        onSave={handleSave}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onFormat={handleFormat}
        onShare={onShare}
        onSettings={handleSettings}
        onDownload={handleDownload}
        onSearch={handleSearch}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        canUndo={currentUndoIndex > 0}
        canRedo={currentUndoIndex < undoStack.length - 1}
        isSaving={isSaving}
        isRunning={isRunning}
        hasChanges={hasChanges}
      />
    </div>
  );
}

// Apply performance optimization HOC for expensive editor component
export const MobileCodeEditor = withPerformanceOptimization(MobileCodeEditorComponent, {
  memo: true,
  trackRenders: true,
  displayName: 'MobileCodeEditor',
  ignoreProps: ['onContentChange'], // This changes frequently
  watchProps: ['initialContent', 'language', 'theme', 'readOnly', 'height'],
  debounceMs: 16 // One frame at 60fps
});