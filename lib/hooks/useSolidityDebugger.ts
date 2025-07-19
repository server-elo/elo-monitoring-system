'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  SolidityDebugger, 
  BreakpointInfo, 
  ExecutionState, 
  VariableInfo, 
  StepResult 
} from '../debugging/SolidityDebugger';
import { useNotifications } from '@/components/ui/NotificationSystem';

export interface DebuggerState {
  isInitialized: boolean;
  activeSessionId: string | null;
  executionState: ExecutionState | null;
  breakpoints: BreakpointInfo[];
  isLoading: boolean;
  error: string | null;
}

export interface UseDebuggerOptions {
  autoInitialize?: boolean;
  onBreakpointHit?: (breakpoint: BreakpointInfo) => void;
  onExecutionComplete?: (result: StepResult) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for managing Solidity debugging sessions
 */
export function useSolidityDebugger(options: UseDebuggerOptions = {}) {
  const { autoInitialize = true, onBreakpointHit: _onBreakpointHit, onExecutionComplete, onError } = options;
  
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
          setState(prev => ({
            ...prev,
            isInitialized: true,
            isLoading: false
          }));
          showSuccess('Debugger Ready', 'Solidity debugger initialized successfully');
        });

        solidityDebugger.on('session-started', ({ sessionId }) => {
          setState(prev => ({
            ...prev,
            activeSessionId: sessionId
          }));
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

        solidityDebugger.on('breakpoint-set', ({ breakpoint }) => {
          setState(prev => ({
            ...prev,
            breakpoints: [...prev.breakpoints.filter(bp => bp.line !== breakpoint.line), breakpoint]
          }));
        });

        solidityDebugger.on('breakpoint-removed', ({ breakpoint }) => {
          setState(prev => ({
            ...prev,
            breakpoints: prev.breakpoints.filter(bp => bp.id !== breakpoint.id)
          }));
        });

        solidityDebugger.on('step-completed', ({ result }) => {
          setState(prev => ({
            ...prev,
            executionState: result.newState
          }));
          onExecutionComplete?.(result);
        });

        solidityDebugger.on('execution-paused', () => {
          showWarning('Execution Paused', 'Debug execution has been paused');
        });

        solidityDebugger.on('execution-continued', () => {
          showInfo('Execution Continued', 'Debug execution is continuing');
        });

        solidityDebugger.on('error', ({ message, error }) => {
          const errorMessage = `${message}: ${error?.message || 'Unknown error'}`;
          setState(prev => ({
            ...prev,
            error: errorMessage,
            isLoading: false
          }));
          showError('Debugger Error', errorMessage);
          onError?.(errorMessage);
        });

        debuggerRef.current = solidityDebugger;
        await solidityDebugger.initialize();
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize debugger';
        setState(prev => ({ 
          ...prev, 
          error: errorMessage, 
          isLoading: false 
        }));
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
  }, [autoInitialize, showSuccess, showError, showInfo, showWarning, onExecutionComplete, onError]);

  // Start debugging session
  const startSession = useCallback(async (
    contractAddress: string,
    transactionHash: string,
    bytecode: string,
    sourceMap: string,
    abi: any[]
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
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }));
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

  // Breakpoint management
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
      return debuggerRef.current.setBreakpoint(
        state.activeSessionId,
        line,
        condition,
        logMessage
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set breakpoint';
      showError('Breakpoint Error', errorMessage);
      return null;
    }
  }, [state.activeSessionId, showError]);

  const removeBreakpoint = useCallback((line: number): void => {
    if (!debuggerRef.current || !state.activeSessionId) {
      return;
    }

    try {
      debuggerRef.current.removeBreakpoint(state.activeSessionId, line);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove breakpoint';
      showError('Breakpoint Error', errorMessage);
    }
  }, [state.activeSessionId, showError]);

  const toggleBreakpoint = useCallback((line: number): void => {
    if (!debuggerRef.current || !state.activeSessionId) {
      return;
    }

    try {
      debuggerRef.current.toggleBreakpoint(state.activeSessionId, line);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle breakpoint';
      showError('Breakpoint Error', errorMessage);
    }
  }, [state.activeSessionId, showError]);

  // Execution control
  const stepInto = useCallback(async (): Promise<StepResult | null> => {
    if (!debuggerRef.current || !state.activeSessionId) {
      showError('No Active Session', 'Please start a debug session first');
      return null;
    }

    try {
      return await debuggerRef.current.stepInto(state.activeSessionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Step into failed';
      showError('Step Error', errorMessage);
      return null;
    }
  }, [state.activeSessionId, showError]);

  const stepOver = useCallback(async (): Promise<StepResult | null> => {
    if (!debuggerRef.current || !state.activeSessionId) {
      showError('No Active Session', 'Please start a debug session first');
      return null;
    }

    try {
      return await debuggerRef.current.stepOver(state.activeSessionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Step over failed';
      showError('Step Error', errorMessage);
      return null;
    }
  }, [state.activeSessionId, showError]);

  const stepOut = useCallback(async (): Promise<StepResult | null> => {
    if (!debuggerRef.current || !state.activeSessionId) {
      showError('No Active Session', 'Please start a debug session first');
      return null;
    }

    try {
      return await debuggerRef.current.stepOut(state.activeSessionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Step out failed';
      showError('Step Error', errorMessage);
      return null;
    }
  }, [state.activeSessionId, showError]);

  const continueExecution = useCallback(async (): Promise<StepResult | null> => {
    if (!debuggerRef.current || !state.activeSessionId) {
      showError('No Active Session', 'Please start a debug session first');
      return null;
    }

    try {
      return await debuggerRef.current.continue(state.activeSessionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Continue execution failed';
      showError('Execution Error', errorMessage);
      return null;
    }
  }, [state.activeSessionId, showError]);

  const pauseExecution = useCallback((): void => {
    if (!debuggerRef.current || !state.activeSessionId) {
      return;
    }

    try {
      debuggerRef.current.pause(state.activeSessionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Pause execution failed';
      showError('Execution Error', errorMessage);
    }
  }, [state.activeSessionId, showError]);

  // Variable inspection
  const getVariableValue = useCallback(async (variableName: string): Promise<VariableInfo | null> => {
    if (!debuggerRef.current || !state.activeSessionId) {
      return null;
    }

    try {
      return await debuggerRef.current.getVariableValue(state.activeSessionId, variableName);
    } catch (error) {
      console.error('Failed to get variable value:', error);
      return null;
    }
  }, [state.activeSessionId]);

  const evaluateExpression = useCallback(async (expression: string): Promise<any> => {
    if (!debuggerRef.current || !state.activeSessionId) {
      showError('No Active Session', 'Please start a debug session first');
      return null;
    }

    try {
      return await debuggerRef.current.evaluateExpression(state.activeSessionId, expression);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Expression evaluation failed';
      showError('Evaluation Error', errorMessage);
      return null;
    }
  }, [state.activeSessionId, showError]);

  return {
    // State
    ...state,
    
    // Session management
    startSession,
    stopSession,
    
    // Breakpoint management
    setBreakpoint,
    removeBreakpoint,
    toggleBreakpoint,
    
    // Execution control
    stepInto,
    stepOver,
    stepOut,
    continueExecution,
    pauseExecution,
    
    // Variable inspection
    getVariableValue,
    evaluateExpression,
    
    // Computed values
    canDebug: state.isInitialized && !state.isLoading,
    hasActiveSession: !!state.activeSessionId,
    isExecutionPaused: state.executionState?.isPaused || false,
    isExecutionRunning: state.executionState?.isRunning || false,
    currentLine: state.executionState?.currentLine || 0,
    gasUsed: state.executionState?.gasUsed || 0,
    gasLimit: state.executionState?.gasLimit || 0
  };
}
