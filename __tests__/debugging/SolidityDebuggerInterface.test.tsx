;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { SolidityDebuggerInterface } from '@/components/debugging/SolidityDebuggerInterface';

// Mock the debugger hook
jest.mock('@/lib/hooks/useSolidityDebugger', () => ({
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
    startSession: jest.fn(),
    stopSession: jest.fn(),
    setBreakpoint: jest.fn(),
    removeBreakpoint: jest.fn(),
    toggleBreakpoint: jest.fn(),
    stepInto: jest.fn(),
    stepOver: jest.fn(),
    stepOut: jest.fn(),
    continueExecution: jest.fn(),
    pauseExecution: jest.fn(),
    getVariableValue: jest.fn(),
    evaluateExpression: jest.fn()
  }))
}));

// Mock notifications
jest.mock('@/components/ui/NotificationSystem', () => ({
  useNotifications: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn()
  })
}));

describe('SolidityDebuggerInterface', () => {
  const defaultProps = {
    contractAddress: '0x1234567890123456789012345678901234567890',
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    bytecode: '0x608060405234801561001057600080fd5b50',
    sourceMap: '0:100:0:-:0;;;;;;;;;;;;;;;;;;;',
    abi: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders debugger interface when initialized', () => {
      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      expect(screen.getByText(/start debug/i)).toBeInTheDocument();
      expect(screen.getByText(/variables/i)).toBeInTheDocument();
      expect(screen.getByText(/call stack/i)).toBeInTheDocument();
      expect(screen.getByText(/console/i)).toBeInTheDocument();
      expect(screen.getByText(/breakpoints/i)).toBeInTheDocument();
    });

    test('shows loading state when initializing', () => {
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: false,
        isLoading: true,
        error: null
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      expect(screen.getByText(/initializing debugger/i)).toBeInTheDocument();
    });

    test('shows error state when initialization fails', () => {
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: false,
        isLoading: false,
        error: 'Failed to initialize debugger'
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      expect(screen.getByText(/debugger error/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to initialize debugger/i)).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    test('starts debug session when button clicked', async () => {
      const mockStartSession = jest.fn().mockResolvedValue('session-123');
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        canDebug: true,
        hasActiveSession: false,
        startSession: mockStartSession,
        stopSession: jest.fn(),
        setBreakpoint: jest.fn(),
        removeBreakpoint: jest.fn(),
        toggleBreakpoint: jest.fn(),
        stepInto: jest.fn(),
        stepOver: jest.fn(),
        stepOut: jest.fn(),
        continueExecution: jest.fn(),
        pauseExecution: jest.fn(),
        getVariableValue: jest.fn(),
        evaluateExpression: jest.fn()
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      const startButton = screen.getByText(/start debug/i);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(mockStartSession).toHaveBeenCalledWith(
          defaultProps.contractAddress,
          defaultProps.transactionHash,
          defaultProps.bytecode,
          defaultProps.sourceMap,
          defaultProps.abi
        );
      });
    });

    test('shows execution controls when session is active', () => {
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        isExecutionRunning: false,
        isExecutionPaused: true,
        currentLine: 10,
        gasUsed: 21000,
        gasLimit: 3000000,
        startSession: jest.fn(),
        stopSession: jest.fn(),
        setBreakpoint: jest.fn(),
        removeBreakpoint: jest.fn(),
        toggleBreakpoint: jest.fn(),
        stepInto: jest.fn(),
        stepOver: jest.fn(),
        stepOut: jest.fn(),
        continueExecution: jest.fn(),
        pauseExecution: jest.fn(),
        getVariableValue: jest.fn(),
        evaluateExpression: jest.fn()
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      expect(screen.getByText(/stop/i)).toBeInTheDocument();
      expect(screen.getByTitle(/step into/i)).toBeInTheDocument();
      expect(screen.getByTitle(/step over/i)).toBeInTheDocument();
      expect(screen.getByTitle(/step out/i)).toBeInTheDocument();
      expect(screen.getByTitle(/continue execution/i)).toBeInTheDocument();
    });
  });

  describe('Execution Controls', () => {
    test('step into calls correct function', async () => {
      const mockStepInto = jest.fn();
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        isExecutionRunning: false,
        stepInto: mockStepInto,
        stepOver: jest.fn(),
        stepOut: jest.fn(),
        continueExecution: jest.fn(),
        pauseExecution: jest.fn(),
        startSession: jest.fn(),
        stopSession: jest.fn(),
        setBreakpoint: jest.fn(),
        removeBreakpoint: jest.fn(),
        toggleBreakpoint: jest.fn(),
        getVariableValue: jest.fn(),
        evaluateExpression: jest.fn()
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      const stepIntoButton = screen.getByTitle(/step into/i);
      fireEvent.click(stepIntoButton);
      
      expect(mockStepInto).toHaveBeenCalled();
    });

    test('continue execution calls correct function', async () => {
      const mockContinue = jest.fn();
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        isExecutionRunning: false,
        continueExecution: mockContinue,
        stepInto: jest.fn(),
        stepOver: jest.fn(),
        stepOut: jest.fn(),
        pauseExecution: jest.fn(),
        startSession: jest.fn(),
        stopSession: jest.fn(),
        setBreakpoint: jest.fn(),
        removeBreakpoint: jest.fn(),
        toggleBreakpoint: jest.fn(),
        getVariableValue: jest.fn(),
        evaluateExpression: jest.fn()
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      const continueButton = screen.getByTitle(/continue execution/i);
      fireEvent.click(continueButton);
      
      expect(mockContinue).toHaveBeenCalled();
    });

    test('disables step controls when execution is running', () => {
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        isExecutionRunning: true,
        stepInto: jest.fn(),
        stepOver: jest.fn(),
        stepOut: jest.fn(),
        continueExecution: jest.fn(),
        pauseExecution: jest.fn(),
        startSession: jest.fn(),
        stopSession: jest.fn(),
        setBreakpoint: jest.fn(),
        removeBreakpoint: jest.fn(),
        toggleBreakpoint: jest.fn(),
        getVariableValue: jest.fn(),
        evaluateExpression: jest.fn()
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      expect(screen.getByTitle(/step into/i)).toBeDisabled();
      expect(screen.getByTitle(/step over/i)).toBeDisabled();
      expect(screen.getByTitle(/step out/i)).toBeDisabled();
    });
  });

  describe('Breakpoint Management', () => {
    test('displays breakpoints in panel', () => {
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
        startSession: jest.fn(),
        stopSession: jest.fn(),
        setBreakpoint: jest.fn(),
        removeBreakpoint: jest.fn(),
        toggleBreakpoint: jest.fn(),
        stepInto: jest.fn(),
        stepOver: jest.fn(),
        stepOut: jest.fn(),
        continueExecution: jest.fn(),
        pauseExecution: jest.fn(),
        getVariableValue: jest.fn(),
        evaluateExpression: jest.fn()
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Switch to breakpoints tab
      fireEvent.click(screen.getByText(/breakpoints/i));
      
      expect(screen.getByText(/line 10/i)).toBeInTheDocument();
      expect(screen.getByText(/line 25/i)).toBeInTheDocument();
      expect(screen.getByText(/condition: x > 100/i)).toBeInTheDocument();
    });

    test('toggles breakpoint when clicked', async () => {
      const mockToggleBreakpoint = jest.fn();
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
        startSession: jest.fn(),
        stopSession: jest.fn(),
        setBreakpoint: jest.fn(),
        removeBreakpoint: jest.fn(),
        stepInto: jest.fn(),
        stepOver: jest.fn(),
        stepOut: jest.fn(),
        continueExecution: jest.fn(),
        pauseExecution: jest.fn(),
        getVariableValue: jest.fn(),
        evaluateExpression: jest.fn()
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Switch to breakpoints tab
      fireEvent.click(screen.getByText(/breakpoints/i));
      
      // Find and click toggle button
      const toggleButton = screen.getByTitle(/disable/i);
      fireEvent.click(toggleButton);
      
      expect(mockToggleBreakpoint).toHaveBeenCalledWith(10);
    });
  });

  describe('Variable Inspection', () => {
    test('displays variables in variables panel', () => {
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
        startSession: jest.fn(),
        stopSession: jest.fn(),
        setBreakpoint: jest.fn(),
        removeBreakpoint: jest.fn(),
        toggleBreakpoint: jest.fn(),
        stepInto: jest.fn(),
        stepOver: jest.fn(),
        stepOut: jest.fn(),
        continueExecution: jest.fn(),
        pauseExecution: jest.fn(),
        getVariableValue: jest.fn(),
        evaluateExpression: jest.fn()
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Variables tab should be active by default
      expect(screen.getByText(/balance/i)).toBeInTheDocument();
      expect(screen.getByText(/owner/i)).toBeInTheDocument();
      expect(screen.getByText(/1000/i)).toBeInTheDocument();
    });

    test('shows empty state when no variables', () => {
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
        startSession: jest.fn(),
        stopSession: jest.fn(),
        setBreakpoint: jest.fn(),
        removeBreakpoint: jest.fn(),
        toggleBreakpoint: jest.fn(),
        stepInto: jest.fn(),
        stepOver: jest.fn(),
        stepOut: jest.fn(),
        continueExecution: jest.fn(),
        pauseExecution: jest.fn(),
        getVariableValue: jest.fn(),
        evaluateExpression: jest.fn()
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      expect(screen.getByText(/no variables in current scope/i)).toBeInTheDocument();
    });
  });

  describe('Console Functionality', () => {
    test('evaluates expressions in console', async () => {
      const mockEvaluateExpression = jest.fn().mockResolvedValue({
        success: true,
        result: '42',
        type: 'uint256'
      });

      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        evaluateExpression: mockEvaluateExpression,
        startSession: jest.fn(),
        stopSession: jest.fn(),
        setBreakpoint: jest.fn(),
        removeBreakpoint: jest.fn(),
        toggleBreakpoint: jest.fn(),
        stepInto: jest.fn(),
        stepOver: jest.fn(),
        stepOut: jest.fn(),
        continueExecution: jest.fn(),
        pauseExecution: jest.fn(),
        getVariableValue: jest.fn()
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Switch to console tab
      fireEvent.click(screen.getByText(/console/i));
      
      // Enter expression
      const input = screen.getByPlaceholderText(/enter solidity expression/i);
      fireEvent.change(input, { target: { value: 'balance + 10' } });
      
      // Execute
      const executeButton = screen.getByText(/execute/i);
      fireEvent.click(executeButton);
      
      await waitFor(() => {
        expect(mockEvaluateExpression).toHaveBeenCalledWith('balance + 10');
      });
    });

    test('shows console history', async () => {
      const mockHook = require('@/lib/hooks/useSolidityDebugger').useSolidityDebugger;
      mockHook.mockReturnValue({
        isInitialized: true,
        hasActiveSession: true,
        evaluateExpression: jest.fn().mockResolvedValue({ result: '42' }),
        startSession: jest.fn(),
        stopSession: jest.fn(),
        setBreakpoint: jest.fn(),
        removeBreakpoint: jest.fn(),
        toggleBreakpoint: jest.fn(),
        stepInto: jest.fn(),
        stepOver: jest.fn(),
        stepOut: jest.fn(),
        continueExecution: jest.fn(),
        pauseExecution: jest.fn(),
        getVariableValue: jest.fn()
      });

      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Switch to console tab
      fireEvent.click(screen.getByText(/console/i));
      
      // Should show console ready message
      expect(screen.getByText(/console ready for expressions/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Check for accessible buttons
      expect(screen.getByTitle(/step into/i)).toHaveAttribute('title');
      expect(screen.getByTitle(/step over/i)).toHaveAttribute('title');
      expect(screen.getByTitle(/continue execution/i)).toHaveAttribute('title');
    });

    test('supports keyboard navigation', () => {
      render(<SolidityDebuggerInterface {...defaultProps} />);
      
      // Tab navigation should work
      const startButton = screen.getByText(/start debug/i);
      expect(startButton).toHaveAttribute('tabIndex', '0');
    });
  });
});
