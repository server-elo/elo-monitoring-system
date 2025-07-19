'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, StepForward, SkipForward, RotateCcw, Bug, Circle, Eye, EyeOff, Terminal, Layers, Variable, AlertCircle, X } from 'lucide-react';
import { useSolidityDebugger } from '@/lib/hooks/useSolidityDebugger';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

export interface SolidityDebuggerInterfaceProps {
  contractAddress?: string;
  transactionHash?: string;
  bytecode?: string;
  sourceMap?: string;
  abi?: any[];
  onBreakpointToggle?: (line: number) => void;
  onCurrentLineChange?: (line: number) => void;
  className?: string;
}

export function SolidityDebuggerInterface({
  contractAddress,
  transactionHash,
  bytecode,
  sourceMap,
  abi,
  onBreakpointToggle,
  onCurrentLineChange,
  className
}: SolidityDebuggerInterfaceProps) {
  const {
    isInitialized,
    activeSessionId: _activeSessionId,
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
    evaluateExpression
  } = useSolidityDebugger({
    onBreakpointHit: (breakpoint) => {
      console.log('Breakpoint hit:', breakpoint);
    }
  });

  const [activeTab, setActiveTab] = useState<'variables' | 'callstack' | 'console' | 'breakpoints'>('variables');
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleHistory, setConsoleHistory] = useState<Array<{ input: string; output: any; timestamp: number }>>([]);
  const [showBreakpointPanel, setShowBreakpointPanel] = useState(true);

  // Update current line callback
  useEffect(() => {
    if (currentLine > 0) {
      onCurrentLineChange?.(currentLine);
    }
  }, [currentLine, onCurrentLineChange]);

  // Handle session start
  const handleStartSession = async () => {
    if (!contractAddress || !transactionHash || !bytecode || !sourceMap || !abi) {
      console.error('Missing required debugging parameters');
      return;
    }

    await startSession(contractAddress, transactionHash, bytecode, sourceMap, abi);
  };

  // Handle console command
  const handleConsoleCommand = async () => {
    if (!consoleInput.trim()) return;

    const input = consoleInput.trim();
    setConsoleInput('');

    try {
      const result = await evaluateExpression(input);
      setConsoleHistory(prev => [...prev, {
        input,
        output: result,
        timestamp: Date.now()
      }]);
    } catch (error) {
      setConsoleHistory(prev => [...prev, {
        input,
        output: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now()
      }]);
    }
  };

  // Handle breakpoint toggle
  const handleBreakpointToggle = (line: number) => {
    const existingBreakpoint = breakpoints.find(bp => bp.line === line);
    
    if (existingBreakpoint) {
      removeBreakpoint(line);
    } else {
      setBreakpoint(line);
    }
    
    onBreakpointToggle?.(line);
  };

  if (!isInitialized && isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <Bug className="w-8 h-8 mx-auto mb-4 text-blue-400 animate-pulse" />
          <p className="text-gray-400">Initializing debugger...</p>
        </div>
      </div>
    );
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
    );
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
                disabled={isExecutionRunning}
                className="p-2 text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Step into"
              >
                <StepForward className="w-4 h-4" />
              </button>

              <button
                onClick={stepOver}
                disabled={isExecutionRunning}
                className="p-2 text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Step over"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={stepOut}
                disabled={isExecutionRunning}
                className="p-2 text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Step out"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Execution Status */}
          {hasActiveSession && (
            <>
              <div className="flex items-center space-x-2 text-sm">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isExecutionRunning ? 'bg-green-400' :
                  isExecutionPaused ? 'bg-yellow-400' : 'bg-gray-400'
                )} />
                <span className="text-gray-300">
                  {isExecutionRunning ? 'Running' :
                   isExecutionPaused ? 'Paused' : 'Stopped'}
                </span>
              </div>

              <div className="text-sm text-gray-300">
                Line: {currentLine}
              </div>

              <div className="text-sm text-gray-300">
                Gas: {gasUsed.toLocaleString()} / {gasLimit.toLocaleString()}
              </div>
            </>
          )}

          {/* Breakpoint Panel Toggle */}
          <button
            onClick={() => setShowBreakpointPanel(!showBreakpointPanel)}
            className={cn(
              'p-2 transition-colors',
              showBreakpointPanel ? 'text-blue-400' : 'text-gray-400 hover:text-white'
            )}
            title="Toggle breakpoint panel"
          >
            {showBreakpointPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </GlassContainer>

      {/* Main Debug Interface */}
      <div className="flex-1 flex">
        {/* Debug Panels */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-600">
            {[
              { id: 'variables', label: 'Variables', icon: Variable },
              { id: 'callstack', label: 'Call Stack', icon: Layers },
              { id: 'console', label: 'Console', icon: Terminal },
              { id: 'breakpoints', label: 'Breakpoints', icon: Circle },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 text-sm transition-colors',
                    activeTab === tab.id
                      ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full p-4 overflow-y-auto"
              >
                {activeTab === 'variables' && (
                  <VariablesPanel 
                    variables={executionState?.variables || []}
                    onVariableInspect={getVariableValue}
                  />
                )}

                {activeTab === 'callstack' && (
                  <CallStackPanel 
                    callStack={executionState?.callStack || []}
                  />
                )}

                {activeTab === 'console' && (
                  <ConsolePanel
                    history={consoleHistory}
                    input={consoleInput}
                    onInputChange={setConsoleInput}
                    onExecute={handleConsoleCommand}
                  />
                )}

                {activeTab === 'breakpoints' && (
                  <BreakpointsPanel
                    breakpoints={breakpoints}
                    onToggle={handleBreakpointToggle}
                    onRemove={removeBreakpoint}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Breakpoint Panel */}
        <AnimatePresence>
          {showBreakpointPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-gray-600 bg-gray-800/50"
            >
              <div className="p-4">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                  <Circle className="w-4 h-4 mr-2 text-red-400" />
                  Breakpoints ({breakpoints.length})
                </h3>
                
                <div className="space-y-2">
                  {breakpoints.length === 0 ? (
                    <p className="text-gray-400 text-sm">No breakpoints set</p>
                  ) : (
                    breakpoints.map((breakpoint) => (
                      <div
                        key={breakpoint.id}
                        className="flex items-center justify-between p-2 bg-gray-700/50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            breakpoint.enabled ? 'bg-red-400' : 'bg-gray-400'
                          )} />
                          <span className="text-sm text-white">
                            Line {breakpoint.line}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-400">
                            {breakpoint.hitCount}
                          </span>
                          <button
                            onClick={() => toggleBreakpoint(breakpoint.line)}
                            className="text-gray-400 hover:text-white"
                          >
                            {breakpoint.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Variables Panel Component
function VariablesPanel({
  variables,
  onVariableInspect: _onVariableInspect
}: {
  variables: any[];
  onVariableInspect: (name: string) => Promise<any>;
}) {
  const [expandedVariables, setExpandedVariables] = useState<Set<string>>(new Set());

  const toggleVariable = (name: string) => {
    setExpandedVariables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  if (variables.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Variable className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No variables in current scope</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {variables.map((variable, index) => (
        <div key={index} className="border border-gray-600 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleVariable(variable.name)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-700/50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className={cn(
                'w-2 h-2 rounded-full',
                variable.scope === 'local' ? 'bg-blue-400' :
                variable.scope === 'state' ? 'bg-green-400' :
                'bg-yellow-400'
              )} />
              <span className="text-white font-medium">{variable.name}</span>
              <span className="text-gray-400 text-sm">({variable.type})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-300 text-sm">{String(variable.value)}</span>
              {variable.isExpandable && (
                <motion.div
                  animate={{ rotate: expandedVariables.has(variable.name) ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <StepForward className="w-4 h-4 text-gray-400" />
                </motion.div>
              )}
            </div>
          </button>

          <AnimatePresence>
            {expandedVariables.has(variable.name) && variable.children && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-600 bg-gray-800/30"
              >
                <div className="p-3 pl-8 space-y-2">
                  {variable.children.map((child: any, childIndex: number) => (
                    <div key={childIndex} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-300">{child.name}</span>
                        <span className="text-gray-500 text-xs">({child.type})</span>
                      </div>
                      <span className="text-gray-400 text-sm">{String(child.value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// Call Stack Panel Component
function CallStackPanel({ callStack }: { callStack: any[] }) {
  if (callStack.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No call stack available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {callStack.map((frame, index) => (
        <div key={frame.id} className="p-3 border border-gray-600 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                #{index}
              </span>
              <span className="text-white font-medium">{frame.functionName}</span>
              {frame.contractName && (
                <span className="text-gray-400 text-sm">in {frame.contractName}</span>
              )}
            </div>
            <span className="text-gray-400 text-sm">
              Line {frame.line}:{frame.column}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Variables: {frame.variables.length}
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">
                Gas Used: {frame.gasUsed.toLocaleString()}
              </span>
              <span className="text-gray-400">
                Remaining: {frame.gasRemaining.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Console Panel Component
function ConsolePanel({
  history,
  input,
  onInputChange,
  onExecute
}: {
  history: Array<{ input: string; output: any; timestamp: number }>;
  input: string;
  onInputChange: (value: string) => void;
  onExecute: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Console History */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {history.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Console ready for expressions</p>
            <p className="text-sm mt-1">Try: msg.sender, block.timestamp, etc.</p>
          </div>
        ) : (
          history.map((entry, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-blue-400 text-sm">{'>'}</span>
                <span className="text-white font-mono text-sm">{entry.input}</span>
              </div>
              <div className="pl-4">
                {entry.output.error ? (
                  <span className="text-red-400 text-sm font-mono">{entry.output.error}</span>
                ) : (
                  <span className="text-green-400 text-sm font-mono">
                    {JSON.stringify(entry.output, null, 2)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Console Input */}
      <div className="flex items-center space-x-2 p-2 border border-gray-600 rounded-lg bg-gray-800/50">
        <span className="text-blue-400">{'>'}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onExecute()}
          placeholder="Enter Solidity expression..."
          className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none"
        />
        <button
          onClick={onExecute}
          disabled={!input.trim()}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
        >
          Execute
        </button>
      </div>
    </div>
  );
}

// Breakpoints Panel Component
function BreakpointsPanel({
  breakpoints,
  onToggle,
  onRemove
}: {
  breakpoints: any[];
  onToggle: (line: number) => void;
  onRemove: (line: number) => void;
}) {
  if (breakpoints.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No breakpoints set</p>
        <p className="text-sm mt-1">Click on line numbers in the editor to set breakpoints</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {breakpoints.map((breakpoint) => (
        <div key={breakpoint.id} className="p-3 border border-gray-600 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                'w-3 h-3 rounded-full',
                breakpoint.enabled ? 'bg-red-400' : 'bg-gray-400'
              )} />
              <div>
                <span className="text-white font-medium">Line {breakpoint.line}</span>
                {breakpoint.condition && (
                  <p className="text-gray-400 text-sm">Condition: {breakpoint.condition}</p>
                )}
                {breakpoint.logMessage && (
                  <p className="text-gray-400 text-sm">Log: {breakpoint.logMessage}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">
                Hits: {breakpoint.hitCount}
              </span>
              <button
                onClick={() => onToggle(breakpoint.line)}
                className="text-gray-400 hover:text-white transition-colors"
                title={breakpoint.enabled ? 'Disable' : 'Enable'}
              >
                {breakpoint.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onRemove(breakpoint.line)}
                className="text-gray-400 hover:text-red-400 transition-colors"
                title="Remove breakpoint"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
