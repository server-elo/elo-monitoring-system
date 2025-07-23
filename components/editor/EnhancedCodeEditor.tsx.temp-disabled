/**
 * Enhanced Code Editor Component
 *
 * Integrates Monaco Editor with real-time security analysis and gas optimization
 * visualization for a comprehensive Solidity development experience.
 */
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as monaco from 'monaco-editor'
import { useSecurityAnalysis } from '@/hooks/useSecurityAnalysis'
import { useGasAnalysis } from '@/hooks/useGasAnalysis'
import { SecurityOverlay } from './SecurityOverlay'
import { GasOptimizationPanel } from './GasOptimizationPanel'

interface EnhancedCodeEditorProps {
  initialCode?: string
  userId: string
  onCodeChange?: (code: string) => void
  className?: string
  height?: string
  theme?: 'vs-dark' | 'vs-light'
  enableSecurity?: boolean
  enableGasAnalysis?: boolean
  enableRealtime?: boolean
}

export const EnhancedCodeEditor: React.FC<EnhancedCodeEditorProps> = ({
  initialCode = '',
  userId,
  onCodeChange,
  className = '',
  height = '600px',
  theme = 'vs-dark',
  enableSecurity = true,
  enableGasAnalysis = true,
  enableRealtime = true,
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [editorInstance, setEditorInstance] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [activePanel, setActivePanel] = useState<'security' | 'gas' | 'both'>(
    'both',
  )
  const [code, setCode] = useState(initialCode)

  // Security analysis hook
  const {
    scanResult,
    securityResult,
    isScanning,
    isSecurityScanning,
    performAnalysis,
    performSecurityAnalysis,
    autoFixIssue,
    jumpToIssue,
  } = useSecurityAnalysis(editorInstance, userId, {
    enableRealtime,
    enableAIAnalysis: true,
    enablePatternMatching: true,
    severityThreshold: 'low',
  })

  // Gas analysis hook
  const {
    analysisResult,
    gasResult,
    isAnalyzing,
    isGasAnalyzing,
    performAnalysis: performGasAnalysis,
    toggleHeatmap,
    applyOptimization,
    jumpToOptimization,
    getGasMetrics,
  } = useGasAnalysis(editorInstance, userId, {
    enableRealtime,
    enableHeatmap: false,
    autoAnalyze: true,
  })

  // Initialize Monaco Editor
  useEffect(() => {
    if (!editorRef.current) return

    // Configure Solidity language support
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
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          [/\d+/, 'number'],
        ],
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop'],
        ],
      },
    })

    // Create editor instance
    const editor = monaco.editor.create(editorRef.current, {
      value: initialCode,
      language: 'solidity',
      theme,
      automaticLayout: true,
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
    })

    setEditorInstance(editor)

    // Handle code changes
    const disposable = editor.onDidChangeModelContent(() => {
      const newCode = editor.getValue()
      setCode(newCode)
      onCodeChange?.(newCode)
    })

    return () => {
      disposable.dispose()
      editor.dispose()
    }
  }, [initialCode, theme, onCodeChange])

  // Handle panel toggle
  const handlePanelToggle = useCallback(
    (panel: 'security' | 'gas' | 'both') => {
      setActivePanel(panel)
    },
    [],
  )

  return (
    <div className={`enhanced-code-editor ${className}`}>
      <div className="editor-container" style={{ height }}>
        <div ref={editorRef} className="monaco-editor" />

        {enableSecurity &&
          (activePanel === 'security' || activePanel === 'both') && (
            <SecurityOverlay
              scanResult={scanResult}
              securityResult={securityResult}
              isScanning={isScanning || isSecurityScanning}
              onAutoFix={autoFixIssue}
              onJumpToIssue={jumpToIssue}
            />
          )}
      </div>

      {enableGasAnalysis &&
        (activePanel === 'gas' || activePanel === 'both') && (
          <GasOptimizationPanel
            analysisResult={analysisResult}
            gasResult={gasResult}
            isAnalyzing={isAnalyzing || isGasAnalyzing}
            onOptimizationClick={applyOptimization}
            onJumpToLine={jumpToOptimization}
            onToggleHeatmap={toggleHeatmap}
          />
        )}

      <div className="editor-controls">
        <button
          onClick={() => handlePanelToggle('security')}
          className={`control-button ${activePanel === 'security' ? 'active' : ''}`}
        >
          Security
        </button>
        <button
          onClick={() => handlePanelToggle('gas')}
          className={`control-button ${activePanel === 'gas' ? 'active' : ''}`}
        >
          Gas Analysis
        </button>
        <button
          onClick={() => handlePanelToggle('both')}
          className={`control-button ${activePanel === 'both' ? 'active' : ''}`}
        >
          Both
        </button>
      </div>
    </div>
  )
}
