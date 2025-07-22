'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { MobileEditorToolbar } from './MobileEditorToolbar'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { withPerformanceOptimization } from '@/lib/components/PerformanceOptimizer'

// Dynamically import Monaco to reduce initial bundle size
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod: any) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    ),
  },
)

interface MobileCodeEditorProps {
  documentId?: string
  initialContent?: string
  language?: string
  theme?: string
  height?: string | number
  autoSave?: boolean
  showToolbar?: boolean
  className?: string
  onContentChange?: (content: string) => void
  onSave?: (content: string) => void
}

function MobileCodeEditorComponent({
  documentId,
  initialContent = '',
  language = 'solidity',
  theme = 'vs-dark',
  height = '100%',
  autoSave = true,
  showToolbar = true,
  className,
  onContentChange,
  onSave,
}: MobileCodeEditorProps): React.ReactElement {
  const [content, setContent] = useState(initialContent)
  const [isLoading, setIsLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<any>(null)

  // Handle content changes
  const handleContentChange = useCallback(
    (value: string | undefined) => {
      const newContent = value || ''
      setContent(newContent)
      setHasChanges(newContent !== initialContent)
      onContentChange?.(newContent)
    },
    [initialContent, onContentChange],
  )

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !hasChanges) return

    const saveTimeout = setTimeout(() => {
      handleSave()
    }, 2000)

    return () => clearTimeout(saveTimeout)
  }, [content, hasChanges, autoSave])

  // Handle save
  const handleSave = useCallback(async () => {
    if (!hasChanges) return

    setIsSaving(true)
    try {
      await onSave?.(content)
      setHasChanges(false)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [content, hasChanges, onSave])

  // Handle editor mount
  const handleEditorMount = useCallback(
    (editor: any, monaco: any) => {
      editorRef.current = editor
      setIsLoading(false)

      // Configure Solidity language support
      if (language === 'solidity') {
        monaco.languages.register({ id: 'solidity' })
        monaco.languages.setMonarchTokensProvider('solidity', {
          tokenizer: {
            root: [
              [/pragma\b/, 'keyword'],
              [/contract\b/, 'keyword'],
              [/function\b/, 'keyword'],
              [/modifier\b/, 'keyword'],
              [/event\b/, 'keyword'],
              [/struct\b/, 'keyword'],
              [/enum\b/, 'keyword'],
              [/mapping\b/, 'keyword'],
              [/uint\d*\b/, 'type'],
              [/int\d*\b/, 'type'],
              [/address\b/, 'type'],
              [/bool\b/, 'type'],
              [/string\b/, 'type'],
              [/bytes\d*\b/, 'type'],
              [/public\b/, 'keyword'],
              [/private\b/, 'keyword'],
              [/internal\b/, 'keyword'],
              [/external\b/, 'keyword'],
              [/view\b/, 'keyword'],
              [/pure\b/, 'keyword'],
              [/payable\b/, 'keyword'],
              [/\/\/.*$/, 'comment'],
              [/\/\*[\s\S]*?\*\//, 'comment'],
              [/"([^"\\\\]|\\\\.)*$/, 'string.invalid'],
              [/"/, 'string', '@string'],
              [/\d+/, 'number'],
            ],
            string: [
              [/[^\\\\"]+/, 'string'],
              [/\\\\./, 'string.escape'],
              [/"/, 'string', '@pop'],
            ],
          },
        })
      }

      // Mobile-specific optimizations
      editor.updateOptions({
        fontSize: 14,
        lineHeight: 20,
        minimap: { enabled: false },
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
        wordWrap: 'on',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        renderWhitespace: 'none',
        overviewRulerLanes: 0,
      })
    },
    [language],
  )

  // Toolbar actions
  const toolbarActions = {
    onRun: () => {
      console.log('Run code:', content)
    },
    onSave: handleSave,
    onUndo: () => {
      editorRef.current?.trigger('keyboard', 'undo', null)
    },
    onRedo: () => {
      editorRef.current?.trigger('keyboard', 'redo', null)
    },
    onFormat: () => {
      editorRef.current?.getAction('editor.action.formatDocument')?.run()
    },
    onSearch: () => {
      editorRef.current?.getAction('actions.find')?.run()
    },
    onCopy: () => {
      editorRef.current?.trigger(
        'keyboard',
        'editor.action.clipboardCopyAction',
        null,
      )
    },
    onPaste: () => {
      editorRef.current?.trigger(
        'keyboard',
        'editor.action.clipboardPasteAction',
        null,
      )
    },
    onZoomIn: () => {
      editorRef.current?.trigger('keyboard', 'editor.action.fontZoomIn', null)
    },
    onZoomOut: () => {
      editorRef.current?.trigger('keyboard', 'editor.action.fontZoomOut', null)
    },
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {showToolbar && (
        <MobileEditorToolbar
          {...toolbarActions}
          hasChanges={hasChanges}
          isSaving={isSaving}
          canUndo={true}
          canRedo={true}
        />
      )}

      <div className="flex-1 relative">
        <MonacoEditor
          value={content}
          language={language}
          theme={theme}
          height={height}
          onChange={handleContentChange}
          onMount={handleEditorMount}
          options={{
            fontSize: 14,
            lineHeight: 20,
            minimap: { enabled: false },
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'none',
            overviewRulerLanes: 0,
          }}
        />
      </div>
    </div>
  )
}

export const MobileCodeEditor = withPerformanceOptimization(
  MobileCodeEditorComponent,
)
