/**
 * Solidity Debugger Hook
 * 
 * Provides debugging capabilities for Solidity smart contracts
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { SolidityDebugger } from '@/lib/debugging/SolidityDebugger';

interface DebuggerState {
  isInitialized: boolean;
  activeSessionId: string | null;
  executionState: any | null;
  breakpoints: any[];
  isLoading: boolean;
  error: string | null;
}

interface UseDebuggerOptions {
  autoInitialize?: boolean;
  onBreakpointHit?: (breakpoint: any) => void;
  onExecutionComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

interface UseDebuggerReturn {
  state: DebuggerState;
  startSession: (
    contractAddress: string,
    transactionHash: string,
    bytecode: string,
    sourceMap: string,
    abi: unknown[]
  ) => Promise<string | null>;
  stopSession: () => Promise<void>;
  setBreakpoint: (line: number, condition?: string, logMessage?: string) => string | null;
  removeBreakpoint: (breakpointId: string) => boolean;
  stepOver: () => Promise<void>;
  stepInto: () => Promise<void>;
  stepOut: () => Promise<void>;
  continue: () => Promise<void>;
  pause: () => void;
  getVariableValue: (variableName: string) => any;
  evaluateExpression: (expression: string) => Promise<any>;
}

/**
 * Hook for managing Solidity debugging sessions
 */
export function useSolidityDebugger(options: UseDebuggerOptions = {}): UseDebuggerReturn {
  const { autoInitialize = true, onBreakpointHit, onExecutionComplete, onError } = options;
  const debuggerRef = useRef<SolidityDebugger | null>(null);
  const { showSuccess, showError, showInfo, showWarning } = useNotifications();

  const [state, setState] = useState<DebuggerState>({
    isInitialized: false,
    activeSessionId: null,
    executionState: null,
    breakpoints: [],
    isLoading: false,
    error: null
  });

  // Initialize debugger
  useEffect(() => {
    if (!autoInitialize) return;

    const initializeDebugger = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const solidityDebugger = new SolidityDebugger();

        // Set up event listeners
        solidityDebugger.on('initialized', () => {
          setState(prev => ({ ...prev, isInitialized: true, isLoading: false }));
          showSuccess('Debugger Ready', 'Solidity debugger initialized successfully');
        });

        solidityDebugger.on('session-started', ({ sessionId }) => {
          setState(prev => ({ ...prev, activeSessionId: sessionId }));
          showInfo('Debug Session Started', `Session ${sessionId} is now active`);
        });

        solidityDebugger.on('session-stopped', ({ sessionId }) => {
          setState(prev => ({
            ...prev,
            activeSessionId: prev.activeSessionId === sessionId ? null : prev.activeSessionId,
            executionState: null,
            breakpoints: []
          }));
          showInfo('Debug Session Stopped', `Session ${sessionId} has been terminated`);
        });

        solidityDebugger.on('breakpoint-hit', ({ breakpoint }) => {
          onBreakpointHit?.(breakpoint);
          showWarning('Breakpoint Hit', `Execution paused at line ${breakpoint.line}`);
        });

        solidityDebugger.on('error', ({ message, error }) => {
          const errorMessage = `${message}: ${error?.message || 'Unknown error'}`;
          setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
          showError('Debugger Error', errorMessage);
          onError?.(errorMessage);
        });

        debuggerRef.current = solidityDebugger;
        await solidityDebugger.initialize();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize debugger';
        setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        showError('Initialization Failed', errorMessage);
        onError?.(errorMessage);
      }
    };

    initializeDebugger();

    return () => {
      if (debuggerRef.current) {
        debuggerRef.current.removeAllListeners();
      }
    };
  }, [autoInitialize, showSuccess, showError, showInfo, showWarning, onBreakpointHit, onExecutionComplete, onError]);

  // Start debugging session
  const startSession = useCallback(async (
    contractAddress: string,
    transactionHash: string,
    bytecode: string,
    sourceMap: string,
    abi: unknown[]
  ): Promise<string | null> => {
    if (!debuggerRef.current || !state.isInitialized) {
      showError('Debugger Not Ready', 'Please wait for debugger to initialize');
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const sessionId = await debuggerRef.current.startSession(
        contractAddress,
        transactionHash,
        bytecode,
        sourceMap,
        abi
      );

      const executionState = debuggerRef.current.getExecutionState(sessionId);
      setState(prev => ({
        ...prev,
        activeSessionId: sessionId,
        executionState,
        isLoading: false
      }));

      return sessionId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start debug session';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showError('Session Start Failed', errorMessage);
      return null;
    }
  }, [state.isInitialized, showError]);

  // Stop debugging session
  const stopSession = useCallback(async (): Promise<void> => {
    if (!debuggerRef.current || !state.activeSessionId) {
      return;
    }

    try {
      await debuggerRef.current.stopSession(state.activeSessionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop debug session';
      showError('Session Stop Failed', errorMessage);
    }
  }, [state.activeSessionId, showError]);

  // Set breakpoint
  const setBreakpoint = useCallback((
    line: number,
    condition?: string,
    logMessage?: string
  ): string | null => {
    if (!debuggerRef.current || !state.activeSessionId) {
      showError('No Active Session', 'Please start a debug session first');
      return null;
    }

    try {
      const breakpointId = debuggerRef.current.setBreakpoint(
        state.activeSessionId,
        line,
        condition,
        logMessage
      );

      const breakpoint = debuggerRef.current.getBreakpoint(state.activeSessionId, breakpointId);
      if (breakpoint) {
        setState(prev => ({
          ...prev,
          breakpoints: [...prev.breakpoints.filter(bp => bp.line !== line), breakpoint]
        }));
      }

      return breakpointId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set breakpoint';
      showError('Breakpoint Error', errorMessage);
      return null;
    }
  }, [state.activeSessionId, showError]);

  // Remove breakpoint
  const removeBreakpoint = useCallback((breakpointId: string): boolean => {
    if (!debuggerRef.current || !state.activeSessionId) {
      return false;
    }

    try {
      const removed = debuggerRef.current.removeBreakpoint(state.activeSessionId, breakpointId);
      if (removed) {
        setState(prev => ({
          ...prev,
          breakpoints: prev.breakpoints.filter(bp => bp.id !== breakpointId)
        }));
      }
      return removed;
    } catch (error) {
      return false;
    }
  }, [state.activeSessionId]);

  // Stepping functions
  const stepOver = useCallback(async (): Promise<void> => {
    if (!debuggerRef.current || !state.activeSessionId) return;
    
    try {
      const result = await debuggerRef.current.stepOver(state.activeSessionId);
      setState(prev => ({ ...prev, executionState: result.newState }));
      onExecutionComplete?.(result);
    } catch (error) {
      showError('Step Error', 'Failed to step over');
    }
  }, [state.activeSessionId, onExecutionComplete, showError]);

  const stepInto = useCallback(async (): Promise<void> => {
    if (!debuggerRef.current || !state.activeSessionId) return;
    
    try {
      const result = await debuggerRef.current.stepInto(state.activeSessionId);
      setState(prev => ({ ...prev, executionState: result.newState }));
      onExecutionComplete?.(result);
    } catch (error) {
      showError('Step Error', 'Failed to step into');
    }
  }, [state.activeSessionId, onExecutionComplete, showError]);

  const stepOut = useCallback(async (): Promise<void> => {
    if (!debuggerRef.current || !state.activeSessionId) return;
    
    try {
      const result = await debuggerRef.current.stepOut(state.activeSessionId);
      setState(prev => ({ ...prev, executionState: result.newState }));
      onExecutionComplete?.(result);
    } catch (error) {
      showError('Step Error', 'Failed to step out');
    }
  }, [state.activeSessionId, onExecutionComplete, showError]);

  const continueExecution = useCallback(async (): Promise<void> => {
    if (!debuggerRef.current || !state.activeSessionId) return;
    
    try {
      await debuggerRef.current.continue(state.activeSessionId);
    } catch (error) {
      showError('Continue Error', 'Failed to continue execution');
    }
  }, [state.activeSessionId, showError]);

  const pause = useCallback((): void => {
    if (!debuggerRef.current || !state.activeSessionId) return;
    
    try {
      debuggerRef.current.pause(state.activeSessionId);
    } catch (error) {
      showError('Pause Error', 'Failed to pause execution');
    }
  }, [state.activeSessionId, showError]);

  // Variable inspection
  const getVariableValue = useCallback((variableName: string): any => {
    if (!debuggerRef.current || !state.activeSessionId || !state.executionState) {
      return undefined;
    }

    try {
      return debuggerRef.current.getVariableValue(
        state.activeSessionId,
        variableName,
        state.executionState.currentFrame
      );
    } catch (error) {
      return undefined;
    }
  }, [state.activeSessionId, state.executionState]);

  // Expression evaluation
  const evaluateExpression = useCallback(async (expression: string): Promise<any> => {
    if (!debuggerRef.current || !state.activeSessionId || !state.executionState) {
      throw new Error('No active debug session');
    }

    try {
      return await debuggerRef.current.evaluateExpression(
        state.activeSessionId,
        expression,
        state.executionState.currentFrame
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to evaluate expression';
      showError('Evaluation Error', errorMessage);
      throw error;
    }
  }, [state.activeSessionId, state.executionState, showError]);

  return {
    state,
    startSession,
    stopSession,
    setBreakpoint,
    removeBreakpoint,
    stepOver,
    stepInto,
    stepOut,
    continue: continueExecution,
    pause,
    getVariableValue,
    evaluateExpression
  };
}