/**
 * @fileoverview Error Boundary Testing
 * Tests error handling, recovery mechanisms, and fallback UI components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactElement, ReactNode, Component, ErrorInfo } from 'react';

// Mock error boundary implementation
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactElement;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

class MockErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to monitoring service
    this.logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      if (resetKeys.some((key, idx) => key !== prevResetKeys[idx])) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  logErrorToService = (error: Error, errorInfo: ErrorInfo): void => {
    // Mock error logging
    console.error('Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div role="alert" className="error-fallback">
          <h2>Something went wrong</h2>
          <p>Error: {this.state.error?.message}</p>
          <button onClick={this.resetErrorBoundary}>Try again</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Component that throws errors for testing
interface ErrorThrowingComponentProps {
  shouldThrow?: boolean;
  errorType?: 'render' | 'async' | 'network';
  errorMessage?: string;
}

const ErrorThrowingComponent = ({ 
  shouldThrow = false, 
  errorType = 'render',
  errorMessage = 'Test error'
}: ErrorThrowingComponentProps): ReactElement => {
  if (shouldThrow && errorType === 'render') {
    throw new Error(errorMessage);
  }

  if (shouldThrow && errorType === 'async') {
    // Simulate async error (these won't be caught by error boundaries)
    setTimeout(() => {
      throw new Error(errorMessage);
    }, 0);
  }

  if (shouldThrow && errorType === 'network') {
    throw new Error(`Network error: ${errorMessage}`);
  }

  return <div>Component rendered successfully</div>;
};

describe('Error Boundaries', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('Basic Error Boundary Functionality', () => {
    it('should catch and display errors from child components', () => {
      render(
        <MockErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} errorMessage="Child component error" />
        </MockErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Error: Child component error')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('should render children normally when no error occurs', () => {
      render(
        <MockErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </MockErrorBoundary>
      );

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should call onError callback when error is caught', () => {
      const onErrorMock = vi.fn();
      
      render(
        <MockErrorBoundary onError={onErrorMock}>
          <ErrorThrowingComponent shouldThrow={true} errorMessage="Callback test error" />
        </MockErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should use custom fallback component when provided', () => {
      const CustomFallback = (): ReactElement => (
        <div data-testid="custom-fallback">
          <h1>Custom Error Fallback</h1>
          <p>Please contact support</p>
        </div>
      );

      render(
        <MockErrorBoundary fallback={<CustomFallback />}>
          <ErrorThrowingComponent shouldThrow={true} />
        </MockErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error Fallback')).toBeInTheDocument();
      expect(screen.getByText('Please contact support')).toBeInTheDocument();
    });
  });

  describe('Error Recovery Mechanisms', () => {
    it('should reset error boundary when reset button is clicked', async () => {
      const { rerender } = render(
        <MockErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </MockErrorBoundary>
      );

      // Verify error is displayed
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Click reset button
      const resetButton = screen.getByText('Try again');
      resetButton.click();

      // Rerender with non-throwing component
      rerender(
        <MockErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </MockErrorBoundary>
      );

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should reset on props change when resetOnPropsChange is enabled', () => {
      const { rerender } = render(
        <MockErrorBoundary resetOnPropsChange={true}>
          <ErrorThrowingComponent shouldThrow={true} />
        </MockErrorBoundary>
      );

      // Verify error is displayed
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Rerender with different children
      rerender(
        <MockErrorBoundary resetOnPropsChange={true}>
          <ErrorThrowingComponent shouldThrow={false} />
        </MockErrorBoundary>
      );

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should reset when resetKeys change', () => {
      const { rerender } = render(
        <MockErrorBoundary resetKeys={['key1', 'key2']}>
          <ErrorThrowingComponent shouldThrow={true} />
        </MockErrorBoundary>
      );

      // Verify error is displayed
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Rerender with different reset keys
      rerender(
        <MockErrorBoundary resetKeys={['key1', 'key3']}>
          <ErrorThrowingComponent shouldThrow={false} />
        </MockErrorBoundary>
      );

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should log errors to monitoring service', () => {
      render(
        <MockErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} errorMessage="Monitoring test error" />
        </MockErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error Boundary caught an error:',
        expect.objectContaining({
          error: 'Monitoring test error',
          stack: expect.any(String),
          componentStack: expect.any(String)
        })
      );
    });

    it('should include component stack in error reports', () => {
      const onErrorMock = vi.fn();
      
      render(
        <MockErrorBoundary onError={onErrorMock}>
          <div>
            <div>
              <ErrorThrowingComponent shouldThrow={true} />
            </div>
          </div>
        </MockErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.stringContaining('ErrorThrowingComponent')
        })
      );
    });

    it('should handle different error types appropriately', () => {
      const errorTypes = [
        { type: 'render' as const, message: 'Render error' },
        { type: 'network' as const, message: 'Network timeout' }
      ];

      errorTypes.forEach(({ type, message }) => {
        const { unmount } = render(
          <MockErrorBoundary>
            <ErrorThrowingComponent 
              shouldThrow={true} 
              errorType={type}
              errorMessage={message}
            />
          </MockErrorBoundary>
        );

        if (type === 'render' || type === 'network') {
          expect(screen.getByRole('alert')).toBeInTheDocument();
          expect(screen.getByText(`Error: ${message}`)).toBeInTheDocument();
        }

        unmount();
      });
    });
  });

  describe('Nested Error Boundaries', () => {
    it('should handle nested error boundaries correctly', () => {
      const InnerErrorBoundary = (): ReactElement => (
        <MockErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} errorMessage="Inner error" />
        </MockErrorBoundary>
      );

      render(
        <MockErrorBoundary>
          <div>
            <h1>Outer boundary</h1>
            <InnerErrorBoundary />
          </div>
        </MockErrorBoundary>
      );

      // Inner error boundary should catch the error
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error: Inner error')).toBeInTheDocument();
      
      // Outer content should still be visible
      expect(screen.getByText('Outer boundary')).toBeInTheDocument();
    });

    it('should propagate errors to parent boundary if child boundary fails', () => {
      const FailingErrorBoundary = (): ReactElement => {
        // This would be a poorly implemented error boundary that throws in render
        throw new Error('Error boundary itself failed');
      };

      render(
        <MockErrorBoundary>
          <FailingErrorBoundary />
        </MockErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error: Error boundary itself failed')).toBeInTheDocument();
    });
  });

  describe('Specific Error Scenarios', () => {
    it('should handle async errors appropriately', () => {
      // Note: Error boundaries don't catch async errors, but we should test our handling
      const asyncErrorHandler = vi.fn();
      
      // Mock unhandled promise rejection
      const originalHandler = window.addEventListener;
      window.addEventListener = vi.fn((event, handler) => {
        if (event === 'unhandledrejection') {
          asyncErrorHandler();
        }
      });

      render(
        <MockErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} errorType="async" />
        </MockErrorBoundary>
      );

      // Component should render normally since async errors aren't caught
      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
      
      window.addEventListener = originalHandler;
    });

    it('should handle chunk loading errors', () => {
      const ChunkErrorComponent = (): ReactElement => {
        // Simulate chunk loading error
        const error = new Error('Loading chunk 5 failed');
        error.name = 'ChunkLoadError';
        throw error;
      };

      render(
        <MockErrorBoundary>
          <ChunkErrorComponent />
        </MockErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error: Loading chunk 5 failed')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', () => {
      const NetworkErrorComponent = (): ReactElement => {
        const error = new Error('Failed to fetch');
        error.name = 'NetworkError';
        throw error;
      };

      render(
        <MockErrorBoundary>
          <NetworkErrorComponent />
        </MockErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error: Failed to fetch')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Performance', () => {
    it('should not impact performance when no errors occur', () => {
      const renderCount = { count: 0 };
      
      const PerformanceTestComponent = (): ReactElement => {
        renderCount.count++;
        return <div>Performance test component</div>;
      };

      const { rerender } = render(
        <MockErrorBoundary>
          <PerformanceTestComponent />
        </MockErrorBoundary>
      );

      // Multiple rerenders should not impact performance
      for (let i = 0; i < 10; i++) {
        rerender(
          <MockErrorBoundary>
            <PerformanceTestComponent />
          </MockErrorBoundary>
        );
      }

      expect(renderCount.count).toBe(11); // Initial + 10 rerenders
    });

    it('should handle multiple simultaneous errors', () => {
      const MultiErrorComponent = (): ReactElement => {
        return (
          <div>
            <ErrorThrowingComponent shouldThrow={true} errorMessage="Error 1" />
            <ErrorThrowingComponent shouldThrow={true} errorMessage="Error 2" />
          </div>
        );
      };

      render(
        <MockErrorBoundary>
          <MultiErrorComponent />
        </MockErrorBoundary>
      );

      // Should catch the first error and display error boundary
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    it('should cleanup resources in error state', () => {
      const cleanupMock = vi.fn();
      
      const ComponentWithCleanup = (): ReactElement => {
        // Simulate cleanup on unmount
        React.useEffect(() => {
          return cleanupMock;
        }, []);

        throw new Error('Component with cleanup error');
      };

      const { unmount } = render(
        <MockErrorBoundary>
          <ComponentWithCleanup />
        </MockErrorBoundary>
      );

      unmount();

      // Cleanup should still be called even after error
      expect(cleanupMock).toHaveBeenCalled();
    });
  });

  describe('Accessibility in Error States', () => {
    it('should provide proper ARIA attributes for error messages', () => {
      render(
        <MockErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </MockErrorBoundary>
      );

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveAttribute('role', 'alert');
    });

    it('should announce errors to screen readers', () => {
      render(
        <MockErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} errorMessage="Screen reader test" />
        </MockErrorBoundary>
      );

      const errorMessage = screen.getByText('Error: Screen reader test');
      expect(errorMessage).toBeInTheDocument();
      
      // Error should be within an alert region
      const alertRegion = screen.getByRole('alert');
      expect(alertRegion).toContainElement(errorMessage);
    });

    it('should provide keyboard navigation for recovery actions', () => {
      render(
        <MockErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </MockErrorBoundary>
      );

      const retryButton = screen.getByText('Try again');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton.tagName).toBe('BUTTON');
      
      // Button should be focusable
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);
    });
  });
});