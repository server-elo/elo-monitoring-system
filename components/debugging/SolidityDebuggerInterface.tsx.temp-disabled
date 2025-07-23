'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Square,
  StepForward,
  SkipForward,
  RotateCcw,
  Bug,
  Circle,
  Eye,
  EyeOff,
  Terminal,
  Layers,
  Variable,
  AlertCircle,
  X,
} from 'lucide-react'
import { useSolidityDebugger } from '@/lib/hooks/useSolidityDebugger'
import { GlassContainer } from '@/components/ui/Glass'
import { cn } from '@/lib/utils'

export interface SolidityDebuggerInterfaceProps {
  contractAddress?: string
  transactionHash?: string
  bytecode?: string
  sourceMap?: string
  abi?: unknown[]
  onBreakpointToggle?: (line: number) => void
  onCurrentLineChange?: (line: number) => void
  className?: string
}

export function SolidityDebuggerInterface({
  contractAddress,
  transactionHash,
  bytecode,
  sourceMap,
  abi,
  onBreakpointToggle,
  onCurrentLineChange,
  className,
}: SolidityDebuggerInterfaceProps): React.ReactElement {
  const {
    isInitialized,
    activeSessionId,
    executionState,
    breakpoints,
    isLoading,
    error,
    canDebug,
    hasActiveSession,
    isExecutionPaused,
    isExecutionRunning,
    currentLine,
    gasUsed,
    gasLimit,
    startSession,
    stopSession,
    setBreakpoint,
    removeBreakpoint,
    toggleBreakpoint,
    stepInto,
    stepOver,
    stepOut,
    continueExecution,
    pauseExecution,
    getVariableValue,
    evaluateExpression,
  } = useSolidityDebugger({
    onBreakpointHit: (breakpoint: unknown) => {
      console.log('Breakpoint hit:', breakpoint)
    },
  })

  const [activeTab, setActiveTab] = useState<
    'variables' | 'callstack' | 'console' | 'breakpoints'
  >('variables')
  const [consoleInput, setConsoleInput] = useState('')
  const [consoleHistory, setConsoleHistory] = useState<
    Array<{
      input: string
      output: unknown
      timestamp: number
    }>
  >([])
  const [showBreakpointPanel, setShowBreakpointPanel] = useState(true)

  // Update current line callback
  useEffect(() => {
    if (currentLine > 0) {
      onCurrentLineChange?.(currentLine)
    }
  }, [currentLine, onCurrentLineChange])

  // Handle session start
  const handleStartSession = async () => {
    if (
      !contractAddress ||
      !transactionHash ||
      !bytecode ||
      !sourceMap ||
      !abi
    ) {
      console.error('Missing required debugging parameters')
      return
    }
    await startSession(
      contractAddress,
      transactionHash,
      bytecode,
      sourceMap,
      abi,
    )
  }

  // Handle console command
  const handleConsoleCommand = async () => {
    if (!consoleInput.trim()) return

    const input = consoleInput.trim()
    setConsoleInput('')

    try {
      const result = await evaluateExpression(input)
      setConsoleHistory((prev) => [
        ...prev,
        { input, output: result, timestamp: Date.now() },
      ])
    } catch (error) {
      setConsoleHistory((prev) => [
        ...prev,
        {
          input,
          output: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          timestamp: Date.now(),
        },
      ])
    }
  }

  // Handle breakpoint toggle
  const handleBreakpointToggle = (line: number) => {
    const existingBreakpoint = breakpoints.find((bp) => bp.line === line)
    if (existingBreakpoint) {
      removeBreakpoint(line)
    } else {
      setBreakpoint(line)
    }
    onBreakpointToggle?.(line)
  }

  if (!isInitialized && isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <Bug className="w-8 h-8 mx-auto mb-4 text-blue-400 animate-pulse" />
          <p className="text-gray-400">Initializing debugger...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
          <p className="text-red-400 font-medium">Debugger Error</p>
          <p className="text-gray-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Debugger Toolbar */}
      <GlassContainer
        intensity="light"
        tint="neutral"
        border
        className="flex items-center justify-between p-3 mb-2"
      >
        <div className="flex items-center space-x-2">
          {/* Session Control */}
          {!hasActiveSession ? (
            <button
              onClick={handleStartSession}
              disabled={!canDebug || !contractAddress}
              className="flex items-center space-x-2 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Start Debug</span>
            </button>
          ) : (
            <button
              onClick={stopSession}
              className="flex items-center space-x-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          )}

          {/* Execution Controls */}
          {hasActiveSession && (
            <>
              <div className="w-px h-6 bg-gray-600" />
              {isExecutionRunning ? (
                <button
                  onClick={pauseExecution}
                  className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                  title="Pause execution"
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={continueExecution}
                  className="p-2 text-green-400 hover:text-green-300 transition-colors"
                  title="Continue execution"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={stepInto}
                className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                title="Step into"
              >
                <StepForward className="w-4 h-4" />
              </button>

              <button
                onClick={stepOver}
                className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                title="Step over"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={stepOut}
                className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                title="Step out"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center space-x-4 text-sm">
          {hasActiveSession && (
            <>
              <span className="text-gray-400">
                Gas: {gasUsed?.toLocaleString() || 0} /{' '}
                {gasLimit?.toLocaleString() || 0}
              </span>
              <span className="text-gray-400">Line: {currentLine || 0}</span>
            </>
          )}
        </div>
      </GlassContainer>

      {/* Debug Panels */}
      {hasActiveSession && (
        <div className="flex-1 flex gap-2">
          {/* Left Panel - Variables and Call Stack */}
          <div className="w-1/3 flex flex-col space-y-2">
            <GlassContainer
              intensity="light"
              tint="neutral"
              className="flex-1 p-4"
            >
              <div className="flex space-x-2 mb-3">
                <button
                  onClick={() => setActiveTab('variables')}
                  className={cn(
                    'px-3 py-1 rounded text-sm transition-colors',
                    activeTab === 'variables'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white',
                  )}
                >
                  Variables
                </button>
                <button
                  onClick={() => setActiveTab('callstack')}
                  className={cn(
                    'px-3 py-1 rounded text-sm transition-colors',
                    activeTab === 'callstack'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white',
                  )}
                >
                  Call Stack
                </button>
              </div>

              <div className="flex-1 overflow-auto">
                {activeTab === 'variables' && (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">
                      No variables to display
                    </p>
                  </div>
                )}

                {activeTab === 'callstack' && (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">
                      No call stack data available
                    </p>
                  </div>
                )}
              </div>
            </GlassContainer>
          </div>

          {/* Right Panel - Console and Breakpoints */}
          <div className="flex-1 flex flex-col space-y-2">
            <GlassContainer
              intensity="light"
              tint="neutral"
              className="flex-1 p-4"
            >
              <div className="flex space-x-2 mb-3">
                <button
                  onClick={() => setActiveTab('console')}
                  className={cn(
                    'px-3 py-1 rounded text-sm transition-colors',
                    activeTab === 'console'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white',
                  )}
                >
                  Console
                </button>
                <button
                  onClick={() => setActiveTab('breakpoints')}
                  className={cn(
                    'px-3 py-1 rounded text-sm transition-colors',
                    activeTab === 'breakpoints'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white',
                  )}
                >
                  Breakpoints ({breakpoints.length})
                </button>
              </div>

              <div className="flex-1 flex flex-col">
                {activeTab === 'console' && (
                  <>
                    <div className="flex-1 overflow-auto bg-gray-800 rounded p-2 mb-2">
                      {consoleHistory.map((entry, index) => (
                        <div key={index} className="mb-2 font-mono text-sm">
                          <div className="text-blue-300">› {entry.input}</div>
                          <div className="text-gray-300 ml-2">
                            {typeof entry.output === 'object' &&
                            entry.output !== null
                              ? JSON.stringify(entry.output, null, 2)
                              : String(entry.output)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={consoleInput}
                        onChange={(e) => setConsoleInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleConsoleCommand()
                          }
                        }}
                        placeholder="Enter expression..."
                        className="flex-1 px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                      />
                      <button
                        onClick={handleConsoleCommand}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                      >
                        Execute
                      </button>
                    </div>
                  </>
                )}

                {activeTab === 'breakpoints' && (
                  <div className="space-y-2">
                    {breakpoints.length === 0 ? (
                      <p className="text-gray-400 text-sm">
                        No breakpoints set
                      </p>
                    ) : (
                      breakpoints.map((bp, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-800 rounded"
                        >
                          <span className="text-sm">Line {bp.line}</span>
                          <button
                            onClick={() => handleBreakpointToggle(bp.line)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </GlassContainer>
          </div>
        </div>
      )}
    </div>
  )
}
