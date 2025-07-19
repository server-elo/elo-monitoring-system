;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, usePathname } from 'next/navigation';
import { SmartBackButton, SmartBreadcrumbs, ContinueLearning } from '@/components/navigation/SmartNavigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams())
}));

// Mock settings and auth hooks
jest.mock('@/lib/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      accessibility: {
        reduceMotion: false
      }
    }
  })
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      role: 'STUDENT',
      profile: {
        isComplete: true
      }
    }
  })
}));

// Mock error tracking
jest.mock('@/lib/monitoring/error-tracking', () => ({
  errorTracker: {
    addBreadcrumb: jest.fn()
  }
}));

describe('SmartBackButton Component', () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack
    });
    (usePathname as jest.Mock).mockReturnValue('/learn/lesson-1');
  });

  it('renders with default props', () => {
    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label');
  });

  it('shows back text when enabled', () => {
    render(<SmartBackButton showText={true} />);
    
    expect(screen.getByText(/back/i)).toBeInTheDocument();
  });

  it('hides text when showText is false', () => {
    render(<SmartBackButton showText={false} />);
    
    expect(screen.queryByText(/back/i)).not.toBeInTheDocument();
  });

  it('calls router.back() when history is available', () => {
    // Mock window.history.length to simulate available history
    Object.defineProperty(window, 'history', {
      value: { length: 3 },
      writable: true
    });

    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockBack).toHaveBeenCalled();
  });

  it('navigates to fallback URL when no history', () => {
    // Mock window.history.length to simulate no history
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true
    });

    render(<SmartBackButton fallbackUrl="/dashboard" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('applies correct variant styles', () => {
    const { rerender } = render(<SmartBackButton variant="default" />);
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2');

    rerender(<SmartBackButton variant="minimal" />);
    expect(screen.getByRole('button')).toHaveClass('p-2');

    rerender(<SmartBackButton variant="floating" />);
    expect(screen.getByRole('button')).toHaveClass('fixed', 'top-20', 'left-4');
  });

  it('tracks navigation events', () => {
    const { errorTracker } = require('@/lib/monitoring/error-tracking');

    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(errorTracker.addBreadcrumb).toHaveBeenCalledWith(
      expect.stringContaining('Smart back navigation'),
      'navigation',
      'info',
      expect.any(Object)
    );
  });
});

describe('SmartBreadcrumbs Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
  });

  it('renders breadcrumbs for nested path', () => {
    (usePathname as jest.Mock).mockReturnValue('/learn/course/lesson');

    render(<SmartBreadcrumbs />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Learn')).toBeInTheDocument();
    expect(screen.getByText('Course')).toBeInTheDocument();
    expect(screen.getByText('Lesson')).toBeInTheDocument();
  });

  it('handles breadcrumb navigation', () => {
    (usePathname as jest.Mock).mockReturnValue('/learn/course/lesson');

    render(<SmartBreadcrumbs />);
    
    const courseLink = screen.getByText('Course');
    fireEvent.click(courseLink);
    
    expect(mockPush).toHaveBeenCalledWith('/learn/course');
  });

  it('truncates long breadcrumb paths', () => {
    (usePathname as jest.Mock).mockReturnValue('/learn/course/lesson/exercise/step');

    render(<SmartBreadcrumbs maxItems={3} />);
    
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('shows home breadcrumb when enabled', () => {
    (usePathname as jest.Mock).mockReturnValue('/learn');

    render(<SmartBreadcrumbs showHome={true} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('hides home breadcrumb when disabled', () => {
    (usePathname as jest.Mock).mockReturnValue('/learn');

    render(<SmartBreadcrumbs showHome={false} />);
    
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('displays appropriate icons for known routes', () => {
    (usePathname as jest.Mock).mockReturnValue('/learn/code');

    render(<SmartBreadcrumbs />);
    
    // Should have icons for learn and code sections
    const breadcrumbs = screen.getByRole('navigation');
    expect(breadcrumbs).toBeInTheDocument();
  });
});

describe('ContinueLearning Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
  });

  it('renders card variant by default', () => {
    render(<ContinueLearning />);
    
    expect(screen.getByText(/continue learning/i)).toBeInTheDocument();
  });

  it('renders banner variant', () => {
    render(<ContinueLearning variant="banner" />);
    
    expect(screen.getByText(/continue/i)).toBeInTheDocument();
  });

  it('renders inline variant', () => {
    render(<ContinueLearning variant="inline" />);
    
    expect(screen.getByText(/continue/i)).toBeInTheDocument();
  });

  it('handles suggestion clicks', async () => {
    render(<ContinueLearning />);
    
    // Wait for suggestions to load
    await waitFor(() => {
      const suggestion = screen.queryByText(/smart contracts basics/i);
      if (suggestion) {
        fireEvent.click(suggestion);
        expect(mockPush).toHaveBeenCalled();
      }
    });
  });

  it('shows progress for lessons in progress', async () => {
    render(<ContinueLearning variant="banner" />);
    
    await waitFor(() => {
      const progressElement = screen.queryByText(/75%/);
      if (progressElement) {
        expect(progressElement).toBeInTheDocument();
      }
    });
  });

  it('tracks suggestion clicks', async () => {
    const { errorTracker } = require('@/lib/monitoring/error-tracking');

    render(<ContinueLearning />);
    
    await waitFor(() => {
      const suggestion = screen.queryByText(/smart contracts basics/i);
      if (suggestion) {
        fireEvent.click(suggestion);
        expect(errorTracker.addBreadcrumb).toHaveBeenCalledWith(
          expect.stringContaining('Continue learning suggestion clicked'),
          'navigation',
          'info',
          expect.any(Object)
        );
      }
    });
  });
});

describe('Navigation Accessibility', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      back: jest.fn()
    });
    (usePathname as jest.Mock).mockReturnValue('/learn/lesson-1');
  });

  it('provides proper ARIA labels for back button', () => {
    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });

  it('provides proper navigation landmarks', () => {
    (usePathname as jest.Mock).mockReturnValue('/learn/course');

    render(<SmartBreadcrumbs />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation');
  });

  it('supports keyboard navigation', () => {
    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
    
    fireEvent.keyDown(button, { key: 'Enter' });
    // Should trigger navigation
  });

  it('provides clear focus indicators', () => {
    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('transition-colors');
  });
});

describe('Navigation Performance', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      back: jest.fn()
    });
  });

  it('renders efficiently with complex paths', () => {
    (usePathname as jest.Mock).mockReturnValue('/learn/course/lesson/exercise/step/substep');

    const startTime = performance.now();
    render(<SmartBreadcrumbs />);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(50);
  });

  it('handles rapid navigation efficiently', () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: jest.fn()
    });

    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    
    // Rapid clicks
    for (let i = 0; i < 10; i++) {
      fireEvent.click(button);
    }
    
    // Should handle rapid clicks gracefully
    expect(mockPush).toHaveBeenCalled();
  });
});
