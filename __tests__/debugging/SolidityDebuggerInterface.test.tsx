;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { SolidityDebuggerInterface } from '@/components/debugging/SolidityDebuggerInterface';

// Mock the debugger hook
jest.mock( '@/lib/hooks/useSolidityDebugger', () => ({
  useSolidityDebugger: jest.fn(() => ({
    isInitialized: true,
    activeSessionId: null,
    executionState: null,
    breakpoints: [],
    isLoading: false,
    error: null,
    canDebug: true,
    hasActiveSession: false,
    isExecutionPaused: false,
    isExecutionRunning: false,
    currentLine: 0,
    gasUsed: 0,
    gasLimit: 3000000,
    startSession: jest.fn(_),
    stopSession: jest.fn(_),
    setBreakpoint: jest.fn(_),
    removeBreakpoint: jest.fn(_),
    toggleBreakpoint: jest.fn(_),
    stepInto: jest.fn(_),
    stepOver: jest.fn(_),
    stepOut: jest.fn(_),
    continueExecution: jest.fn(_),
    pauseExecution: jest.fn(_),
    getVariableValue: jest.fn(_),
    evaluateExpression: jest.fn(_)
  }))
}));

// Mock notifications
jest.mock( '@/components/ui/NotificationSystem', () => ({
  useNotifications: (_) => ({
    showSuccess: jest.fn(_),
    showError: jest.fn(_),
    showInfo: jest.fn(_),
    showWarning: jest.fn(_)
  })
}));

describe( 'SolidityDebuggerInterface', () => {
  const defaultProps = {
    contractAddress: '0x1234567890123456789012345678901234567890',
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    bytecode: '0x608060405234801561001057600080fd5b50',
    sourceMap: '0:100:0:-:0;;;;;;;;;;;;;;;;;;;',
    abi: []
  };

  beforeEach(() => {
    jest.clearAllMocks(_);
  });

  describe( 'Basic Rendering', () => {
    test( 'renders debugger interface when initialized', () => {
      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      expect(_screen.getByText(/start debug/i)).toBeInTheDocument(_);
      expect(_screen.getByText(/variables/i)).toBeInTheDocument(_);
      expect(_screen.getByText(/call stack/i)).toBeInTheDocument(_);
      expect(_screen.getByText(/console/i)).toBeInTheDocument(_);
      expect(_screen.getByText(/breakpoints/i)).toBeInTheDocument(_);
    });

    test( 'shows loading state when initializing', () => {
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: false,
        isLoading: true,
        error: null
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      expect(_screen.getByText(/initializing debugger/i)).toBeInTheDocument(_);
    });

    test( 'shows error state when initialization fails', () => {
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: false,
        isLoading: false,
        error: 'Failed to initialize debugger'
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      expect(_screen.getByText(/debugger error/i)).toBeInTheDocument(_);
      expect(_screen.getByText(/failed to initialize debugger/i)).toBeInTheDocument(_);
    });
  });

  describe( 'Session Management', () => {
    test( 'starts debug session when button clicked', async () => {
      const mockStartSession = jest.fn(_).mockResolvedValue('session-123');
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        canDebug: true,
        hasActiveSession: false,
        startSession: mockStartSession,
        stopSession: jest.fn(_),
        setBreakpoint: jest.fn(_),
        removeBreakpoint: jest.fn(_),
        toggleBreakpoint: jest.fn(_),
        stepInto: jest.fn(_),
        stepOver: jest.fn(_),
        stepOut: jest.fn(_),
        continueExecution: jest.fn(_),
        pauseExecution: jest.fn(_),
        getVariableValue: jest.fn(_),
        evaluateExpression: jest.fn(_)
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      const startButton = screen.getByText(_/start debug/i);
      fireEvent.click(_startButton);
      
      await waitFor(() => {
        expect(_mockStartSession).toHaveBeenCalledWith(
          defaultProps.contractAddress,
          defaultProps.transactionHash,
          defaultProps.bytecode,
          defaultProps.sourceMap,
          defaultProps.abi
        );
      });
    });

    test( 'shows execution controls when session is active', () => {
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        isExecutionRunning: false,
        isExecutionPaused: true,
        currentLine: 10,
        gasUsed: 21000,
        gasLimit: 3000000,
        startSession: jest.fn(_),
        stopSession: jest.fn(_),
        setBreakpoint: jest.fn(_),
        removeBreakpoint: jest.fn(_),
        toggleBreakpoint: jest.fn(_),
        stepInto: jest.fn(_),
        stepOver: jest.fn(_),
        stepOut: jest.fn(_),
        continueExecution: jest.fn(_),
        pauseExecution: jest.fn(_),
        getVariableValue: jest.fn(_),
        evaluateExpression: jest.fn(_)
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      expect(_screen.getByText(/stop/i)).toBeInTheDocument(_);
      expect(_screen.getByTitle(/step into/i)).toBeInTheDocument(_);
      expect(_screen.getByTitle(/step over/i)).toBeInTheDocument(_);
      expect(_screen.getByTitle(/step out/i)).toBeInTheDocument(_);
      expect(_screen.getByTitle(/continue execution/i)).toBeInTheDocument(_);
    });
  });

  describe( 'Execution Controls', () => {
    test( 'step into calls correct function', async () => {
      const mockStepInto = jest.fn(_);
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        isExecutionRunning: false,
        stepInto: mockStepInto,
        stepOver: jest.fn(_),
        stepOut: jest.fn(_),
        continueExecution: jest.fn(_),
        pauseExecution: jest.fn(_),
        startSession: jest.fn(_),
        stopSession: jest.fn(_),
        setBreakpoint: jest.fn(_),
        removeBreakpoint: jest.fn(_),
        toggleBreakpoint: jest.fn(_),
        getVariableValue: jest.fn(_),
        evaluateExpression: jest.fn(_)
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      const stepIntoButton = screen.getByTitle(_/step into/i);
      fireEvent.click(_stepIntoButton);
      
      expect(_mockStepInto).toHaveBeenCalled(_);
    });

    test( 'continue execution calls correct function', async () => {
      const mockContinue = jest.fn(_);
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        isExecutionRunning: false,
        continueExecution: mockContinue,
        stepInto: jest.fn(_),
        stepOver: jest.fn(_),
        stepOut: jest.fn(_),
        pauseExecution: jest.fn(_),
        startSession: jest.fn(_),
        stopSession: jest.fn(_),
        setBreakpoint: jest.fn(_),
        removeBreakpoint: jest.fn(_),
        toggleBreakpoint: jest.fn(_),
        getVariableValue: jest.fn(_),
        evaluateExpression: jest.fn(_)
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      const continueButton = screen.getByTitle(_/continue execution/i);
      fireEvent.click(_continueButton);
      
      expect(_mockContinue).toHaveBeenCalled(_);
    });

    test( 'disables step controls when execution is running', () => {
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        isExecutionRunning: true,
        stepInto: jest.fn(_),
        stepOver: jest.fn(_),
        stepOut: jest.fn(_),
        continueExecution: jest.fn(_),
        pauseExecution: jest.fn(_),
        startSession: jest.fn(_),
        stopSession: jest.fn(_),
        setBreakpoint: jest.fn(_),
        removeBreakpoint: jest.fn(_),
        toggleBreakpoint: jest.fn(_),
        getVariableValue: jest.fn(_),
        evaluateExpression: jest.fn(_)
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      expect(_screen.getByTitle(/step into/i)).toBeDisabled(_);
      expect(_screen.getByTitle(/step over/i)).toBeDisabled(_);
      expect(_screen.getByTitle(/step out/i)).toBeDisabled(_);
    });
  });

  describe( 'Breakpoint Management', () => {
    test( 'displays breakpoints in panel', () => {
      const mockBreakpoints = [
        {
          id: 'bp-1',
          line: 10,
          enabled: true,
          hitCount: 0,
          condition: undefined,
          logMessage: undefined
        },
        {
          id: 'bp-2',
          line: 25,
          enabled: false,
          hitCount: 2,
          condition: 'x > 100',
          logMessage: undefined
        }
      ];

      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        breakpoints: mockBreakpoints,
        hasActiveSession: true,
        startSession: jest.fn(_),
        stopSession: jest.fn(_),
        setBreakpoint: jest.fn(_),
        removeBreakpoint: jest.fn(_),
        toggleBreakpoint: jest.fn(_),
        stepInto: jest.fn(_),
        stepOver: jest.fn(_),
        stepOut: jest.fn(_),
        continueExecution: jest.fn(_),
        pauseExecution: jest.fn(_),
        getVariableValue: jest.fn(_),
        evaluateExpression: jest.fn(_)
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Switch to breakpoints tab
      fireEvent.click(_screen.getByText(/breakpoints/i));
      
      expect(_screen.getByText(/line 10/i)).toBeInTheDocument(_);
      expect(_screen.getByText(/line 25/i)).toBeInTheDocument(_);
      expect(_screen.getByText(/condition: x > 100/i)).toBeInTheDocument(_);
    });

    test( 'toggles breakpoint when clicked', async () => {
      const mockToggleBreakpoint = jest.fn(_);
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        breakpoints: [{
          id: 'bp-1',
          line: 10,
          enabled: true,
          hitCount: 0
        }],
        toggleBreakpoint: mockToggleBreakpoint,
        startSession: jest.fn(_),
        stopSession: jest.fn(_),
        setBreakpoint: jest.fn(_),
        removeBreakpoint: jest.fn(_),
        stepInto: jest.fn(_),
        stepOver: jest.fn(_),
        stepOut: jest.fn(_),
        continueExecution: jest.fn(_),
        pauseExecution: jest.fn(_),
        getVariableValue: jest.fn(_),
        evaluateExpression: jest.fn(_)
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Switch to breakpoints tab
      fireEvent.click(_screen.getByText(/breakpoints/i));
      
      // Find and click toggle button
      const toggleButton = screen.getByTitle(_/disable/i);
      fireEvent.click(_toggleButton);
      
      expect(_mockToggleBreakpoint).toHaveBeenCalledWith(10);
    });
  });

  describe( 'Variable Inspection', () => {
    test( 'displays variables in variables panel', () => {
      const mockExecutionState = {
        isRunning: false,
        isPaused: true,
        currentLine: 10,
        currentColumn: 5,
        callStack: [],
        variables: [
          {
            name: 'balance',
            type: 'uint256',
            value: '1000',
            scope: 'state' as const,
            isExpandable: false
          },
          {
            name: 'owner',
            type: 'address',
            value: '0x1234...5678',
            scope: 'state' as const,
            isExpandable: false
          }
        ],
        gasUsed: 21000,
        gasLimit: 3000000
      };

      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        executionState: mockExecutionState,
        startSession: jest.fn(_),
        stopSession: jest.fn(_),
        setBreakpoint: jest.fn(_),
        removeBreakpoint: jest.fn(_),
        toggleBreakpoint: jest.fn(_),
        stepInto: jest.fn(_),
        stepOver: jest.fn(_),
        stepOut: jest.fn(_),
        continueExecution: jest.fn(_),
        pauseExecution: jest.fn(_),
        getVariableValue: jest.fn(_),
        evaluateExpression: jest.fn(_)
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Variables tab should be active by default
      expect(_screen.getByText(/balance/i)).toBeInTheDocument(_);
      expect(_screen.getByText(/owner/i)).toBeInTheDocument(_);
      expect(_screen.getByText(/1000/i)).toBeInTheDocument(_);
    });

    test( 'shows empty state when no variables', () => {
      const mockExecutionState = {
        isRunning: false,
        isPaused: true,
        currentLine: 10,
        currentColumn: 5,
        callStack: [],
        variables: [],
        gasUsed: 21000,
        gasLimit: 3000000
      };

      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        executionState: mockExecutionState,
        startSession: jest.fn(_),
        stopSession: jest.fn(_),
        setBreakpoint: jest.fn(_),
        removeBreakpoint: jest.fn(_),
        toggleBreakpoint: jest.fn(_),
        stepInto: jest.fn(_),
        stepOver: jest.fn(_),
        stepOut: jest.fn(_),
        continueExecution: jest.fn(_),
        pauseExecution: jest.fn(_),
        getVariableValue: jest.fn(_),
        evaluateExpression: jest.fn(_)
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      expect(_screen.getByText(/no variables in current scope/i)).toBeInTheDocument(_);
    });
  });

  describe( 'Console Functionality', () => {
    test( 'evaluates expressions in console', async () => {
      const mockEvaluateExpression = jest.fn(_).mockResolvedValue({
        success: true,
        result: '42',
        type: 'uint256'
      });

      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        evaluateExpression: mockEvaluateExpression,
        startSession: jest.fn(_),
        stopSession: jest.fn(_),
        setBreakpoint: jest.fn(_),
        removeBreakpoint: jest.fn(_),
        toggleBreakpoint: jest.fn(_),
        stepInto: jest.fn(_),
        stepOver: jest.fn(_),
        stepOut: jest.fn(_),
        continueExecution: jest.fn(_),
        pauseExecution: jest.fn(_),
        getVariableValue: jest.fn(_)
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Switch to console tab
      fireEvent.click(_screen.getByText(/console/i));
      
      // Enter expression
      const input = screen.getByPlaceholderText(_/enter solidity expression/i);
      fireEvent.change( input, { target: { value: 'balance + 10' } });
      
      // Execute
      const executeButton = screen.getByText(_/execute/i);
      fireEvent.click(_executeButton);
      
      await waitFor(() => {
        expect(_mockEvaluateExpression).toHaveBeenCalledWith('balance + 10');
      });
    });

    test( 'shows console history', async () => {
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        evaluateExpression: jest.fn(_).mockResolvedValue({ result: '42'  }),
        startSession: jest.fn(_),
        stopSession: jest.fn(_),
        setBreakpoint: jest.fn(_),
        removeBreakpoint: jest.fn(_),
        toggleBreakpoint: jest.fn(_),
        stepInto: jest.fn(_),
        stepOver: jest.fn(_),
        stepOut: jest.fn(_),
        continueExecution: jest.fn(_),
        pauseExecution: jest.fn(_),
        getVariableValue: jest.fn(_)
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Switch to console tab
      fireEvent.click(_screen.getByText(/console/i));
      
      // Should show console ready message
      expect(_screen.getByText(/console ready for expressions/i)).toBeInTheDocument(_);
    });
  });

  describe( 'Accessibility', () => {
    test( 'has proper ARIA labels and roles', () => {
      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Check for accessible buttons
      expect(_screen.getByTitle(/step into/i)).toHaveAttribute('title');
      expect(_screen.getByTitle(/step over/i)).toHaveAttribute('title');
      expect(_screen.getByTitle(/continue execution/i)).toHaveAttribute('title');
    });

    test( 'supports keyboard navigation', () => {
      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Tab navigation should work
      const startButton = screen.getByText(_/start debug/i);
      expect(_startButton).toHaveAttribute( 'tabIndex', '0');
    });
  });
});
