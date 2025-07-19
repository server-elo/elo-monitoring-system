;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

// Mock error tracking
jest.mock( '@/lib/monitoring/error-tracking', () => ({
  errorTracker: {
    captureError: jest.fn(_),
    addBreadcrumb: jest.fn(_)
  }
}));

// Mock settings hook
jest.mock( '@/lib/hooks/useSettings', () => ({
  useSettings: (_) => ({
    settings: {
      accessibility: {
        reduceMotion: false
      }
    }
  })
}));

// Component that throws an error
const ThrowError = (_{ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="success-component">Success</div>;
};

describe( 'ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks(_);
    // Suppress console.error for cleaner test output
    jest.spyOn( console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks(_);
  });

  it( 'renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(_screen.getByTestId('success-component')).toBeInTheDocument(_);
  });

  it( 'renders error fallback when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(_screen.queryByTestId('success-component')).not.toBeInTheDocument(_);
    expect(_screen.getByText(/something went wrong/i)).toBeInTheDocument(_);
  });

  it( 'displays role-specific error messages for students', () => {
    render(
      <ErrorBoundary userRole="STUDENT">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(_screen.getByText(/something went wrong/i)).toBeInTheDocument(_);
    expect(_screen.getByText(/your progress has been saved/i)).toBeInTheDocument(_);
    expect(_screen.getByText(/continue learning/i)).toBeInTheDocument(_);
  });

  it( 'displays role-specific error messages for instructors', () => {
    render(
      <ErrorBoundary userRole="INSTRUCTOR">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(_screen.getByText(/course content error/i)).toBeInTheDocument(_);
    expect(_screen.getByText(/course dashboard/i)).toBeInTheDocument(_);
  });

  it( 'displays role-specific error messages for admins', () => {
    render(
      <ErrorBoundary userRole="ADMIN">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(_screen.getByText(/system error detected/i)).toBeInTheDocument(_);
    expect(_screen.getByText(/view error logs/i)).toBeInTheDocument(_);
  });

  it( 'handles retry functionality', async () => {
    const { rerender } = render(
      <ErrorBoundary maxRetries={2}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show retry button
    const retryButton = screen.getByText(_/try again/i);
    expect(_retryButton).toBeInTheDocument(_);

    // Click retry
    fireEvent.click(_retryButton);

    // Should show retrying state
    expect(_screen.getByText(/retrying/i)).toBeInTheDocument(_);

    // Wait for retry to complete and rerender with success
    await waitFor(() => {
      rerender(
        <ErrorBoundary maxRetries={2}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
    });

    expect(_screen.getByTestId('success-component')).toBeInTheDocument(_);
  });

  it( 'shows reset button after max retries', () => {
    render(
      <ErrorBoundary maxRetries={1}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // First retry
    fireEvent.click(_screen.getByText(/try again/i));

    // After max retries, should show reset button
    expect(_screen.getByText(/reset/i)).toBeInTheDocument(_);
    expect(_screen.queryByText(/try again/i)).not.toBeInTheDocument(_);
  });

  it( 'tracks errors with monitoring system', () => {
    const { errorTracker } = require('@/lib/monitoring/error-tracking');

    render(
      <ErrorBoundary userRole="STUDENT" level="component">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(_errorTracker.captureError).toHaveBeenCalledWith(
      expect.any(_Error),
      expect.objectContaining({
        component: 'ErrorBoundary',
        action: 'component_error',
        metadata: expect.objectContaining({
          level: 'component',
          userRole: 'STUDENT'
        })
      })
    );
  });

  it( 'calls onError callback when provided', () => {
    const onErrorMock = jest.fn(_);

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(_onErrorMock).toHaveBeenCalledWith(
      expect.any(_Error),
      expect.any(_Object)
    );
  });

  it( 'renders custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(_screen.getByTestId('custom-fallback')).toBeInTheDocument(_);
    expect(_screen.getByText('Custom Error UI')).toBeInTheDocument(_);
  });

  it( 'provides contextual help based on props', () => {
    const contextualHelp = {
      title: 'Custom Error Title',
      description: 'Custom error description',
      actions: [
        { label: 'Custom Action', href: '/custom', icon: undefined }
      ]
    };

    render(
      <ErrorBoundary contextualHelp={contextualHelp}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(_screen.getByText('Custom Error Title')).toBeInTheDocument(_);
    expect(_screen.getByText('Custom error description')).toBeInTheDocument(_);
    expect(_screen.getByText('Custom Action')).toBeInTheDocument(_);
  });

  it( 'handles different error levels appropriately', () => {
    const { rerender } = render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Page level should show full page error
    expect(_screen.getByText(/something went wrong/i)).toBeInTheDocument(_);

    rerender(
      <ErrorBoundary level="section">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Section level should show section error
    expect(_screen.getByText(/something went wrong/i)).toBeInTheDocument(_);
  });
});

describe( 'ErrorBoundary Accessibility', () => {
  beforeEach(() => {
    jest.spyOn( console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks(_);
  });

  it( 'provides proper ARIA attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = screen.getByRole( 'alert', { hidden: true }) || 
                          screen.getByText(_/something went wrong/i).closest('div');
    
    expect(_errorContainer).toBeInTheDocument(_);
  });

  it( 'supports keyboard navigation', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText(_/try again/i);
    expect(_retryButton).toBeInTheDocument(_);
    
    // Should be focusable
    retryButton.focus(_);
    expect(_retryButton).toHaveFocus(_);
  });

  it( 'provides clear error messaging', () => {
    render(
      <ErrorBoundary userRole="STUDENT">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should have clear, actionable error message
    expect(_screen.getByText(/something went wrong/i)).toBeInTheDocument(_);
    expect(_screen.getByText(/your progress has been saved/i)).toBeInTheDocument(_);
  });
});

describe( 'ErrorBoundary Performance', () => {
  beforeEach(() => {
    jest.spyOn( console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks(_);
  });

  it( 'handles multiple errors efficiently', () => {
    const startTime = performance.now(_);

    // Render multiple error boundaries
    for (let i = 0; i < 10; i++) {
      render(
        <ErrorBoundary key={i}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
    }

    const endTime = performance.now(_);
    const renderTime = endTime - startTime;

    // Should handle multiple errors efficiently
    expect(_renderTime).toBeLessThan(100);
  });

  it( 'cleans up properly on unmount', () => {
    const { unmount } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should unmount without errors
    expect(() => unmount(_)).not.toThrow(_);
  });
});
