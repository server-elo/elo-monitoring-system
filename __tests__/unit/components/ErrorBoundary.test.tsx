;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

// Mock error tracking
jest.mock('@/lib/monitoring/error-tracking', () => ({
  errorTracker: {
    captureError: jest.fn(),
    addBreadcrumb: jest.fn()
  }
}));

// Mock settings hook
jest.mock('@/lib/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      accessibility: {
        reduceMotion: false
      }
    }
  })
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="success-component">Success</div>;
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('success-component')).toBeInTheDocument();
  });

  it('renders error fallback when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByTestId('success-component')).not.toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('displays role-specific error messages for students', () => {
    render(
      <ErrorBoundary userRole="STUDENT">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/your progress has been saved/i)).toBeInTheDocument();
    expect(screen.getByText(/continue learning/i)).toBeInTheDocument();
  });

  it('displays role-specific error messages for instructors', () => {
    render(
      <ErrorBoundary userRole="INSTRUCTOR">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/course content error/i)).toBeInTheDocument();
    expect(screen.getByText(/course dashboard/i)).toBeInTheDocument();
  });

  it('displays role-specific error messages for admins', () => {
    render(
      <ErrorBoundary userRole="ADMIN">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/system error detected/i)).toBeInTheDocument();
    expect(screen.getByText(/view error logs/i)).toBeInTheDocument();
  });

  it('handles retry functionality', async () => {
    const { rerender } = render(
      <ErrorBoundary maxRetries={2}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show retry button
    const retryButton = screen.getByText(/try again/i);
    expect(retryButton).toBeInTheDocument();

    // Click retry
    fireEvent.click(retryButton);

    // Should show retrying state
    expect(screen.getByText(/retrying/i)).toBeInTheDocument();

    // Wait for retry to complete and rerender with success
    await waitFor(() => {
      rerender(
        <ErrorBoundary maxRetries={2}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
    });

    expect(screen.getByTestId('success-component')).toBeInTheDocument();
  });

  it('shows reset button after max retries', () => {
    render(
      <ErrorBoundary maxRetries={1}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // First retry
    fireEvent.click(screen.getByText(/try again/i));

    // After max retries, should show reset button
    expect(screen.getByText(/reset/i)).toBeInTheDocument();
    expect(screen.queryByText(/try again/i)).not.toBeInTheDocument();
  });

  it('tracks errors with monitoring system', () => {
    const { errorTracker } = require('@/lib/monitoring/error-tracking');

    render(
      <ErrorBoundary userRole="STUDENT" level="component">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(errorTracker.captureError).toHaveBeenCalledWith(
      expect.any(Error),
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

  it('calls onError callback when provided', () => {
    const onErrorMock = jest.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });

  it('provides contextual help based on props', () => {
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

    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    expect(screen.getByText('Custom error description')).toBeInTheDocument();
    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });

  it('handles different error levels appropriately', () => {
    const { rerender } = render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Page level should show full page error
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    rerender(
      <ErrorBoundary level="section">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Section level should show section error
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});

describe('ErrorBoundary Accessibility', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('provides proper ARIA attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = screen.getByRole('alert', { hidden: true }) || 
                          screen.getByText(/something went wrong/i).closest('div');
    
    expect(errorContainer).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText(/try again/i);
    expect(retryButton).toBeInTheDocument();
    
    // Should be focusable
    retryButton.focus();
    expect(retryButton).toHaveFocus();
  });

  it('provides clear error messaging', () => {
    render(
      <ErrorBoundary userRole="STUDENT">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should have clear, actionable error message
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/your progress has been saved/i)).toBeInTheDocument();
  });
});

describe('ErrorBoundary Performance', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles multiple errors efficiently', () => {
    const startTime = performance.now();

    // Render multiple error boundaries
    for (let i = 0; i < 10; i++) {
      render(
        <ErrorBoundary key={i}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
    }

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should handle multiple errors efficiently
    expect(renderTime).toBeLessThan(100);
  });

  it('cleans up properly on unmount', () => {
    const { unmount } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should unmount without errors
    expect(() => unmount()).not.toThrow();
  });
});
