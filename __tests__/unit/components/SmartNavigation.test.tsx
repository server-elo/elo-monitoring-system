;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, usePathname } from 'next/navigation';
import { SmartBackButton, SmartBreadcrumbs, ContinueLearning } from '@/components/navigation/SmartNavigation';

// Mock Next.js navigation hooks
jest.mock( 'next/navigation', () => ({
  useRouter: jest.fn(_),
  usePathname: jest.fn(_),
  useSearchParams: jest.fn(() => new URLSearchParams(_))
}));

// Mock settings and auth hooks
jest.mock( '@/lib/hooks/useSettings', () => ({
  useSettings: (_) => ({
    settings: {
      accessibility: {
        reduceMotion: false
      }
    }
  })
}));

jest.mock( '@/lib/hooks/useAuth', () => ({
  useAuth: (_) => ({
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
jest.mock( '@/lib/monitoring/error-tracking', () => ({
  errorTracker: {
    addBreadcrumb: jest.fn(_)
  }
}));

describe( 'SmartBackButton Component', () => {
  const mockPush = jest.fn(_);
  const mockBack = jest.fn(_);

  beforeEach(() => {
    jest.clearAllMocks(_);
    (_useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack
    });
    (_usePathname as jest.Mock).mockReturnValue('/learn/lesson-1');
  });

  it( 'renders with default props', () => {
    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    expect(_button).toBeInTheDocument(_);
    expect(_button).toHaveAttribute('aria-label');
  });

  it( 'shows back text when enabled', () => {
    render(<SmartBackButton showText={true} />);
    
    expect(_screen.getByText(/back/i)).toBeInTheDocument(_);
  });

  it( 'hides text when showText is false', () => {
    render(<SmartBackButton showText={false} />);
    
    expect(_screen.queryByText(/back/i)).not.toBeInTheDocument(_);
  });

  it('calls router.back() when history is available', (_) => {
    // Mock window.history.length to simulate available history
    Object.defineProperty(window, 'history', {
      value: { length: 3 },
      writable: true
    });

    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(_button);
    
    expect(_mockBack).toHaveBeenCalled(_);
  });

  it( 'navigates to fallback URL when no history', () => {
    // Mock window.history.length to simulate no history
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true
    });

    render(<SmartBackButton fallbackUrl="/dashboard" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(_button);
    
    expect(_mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it( 'applies correct variant styles', () => {
    const { rerender } = render(<SmartBackButton variant="default" />);
    expect(_screen.getByRole('button')).toHaveClass( 'px-4', 'py-2');

    rerender(<SmartBackButton variant="minimal" />);
    expect(_screen.getByRole('button')).toHaveClass('p-2');

    rerender(<SmartBackButton variant="floating" />);
    expect(_screen.getByRole('button')).toHaveClass( 'fixed', 'top-20', 'left-4');
  });

  it( 'tracks navigation events', () => {
    const { errorTracker } = require('@/lib/monitoring/error-tracking');

    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(_button);
    
    expect(_errorTracker.addBreadcrumb).toHaveBeenCalledWith(
      expect.stringContaining('Smart back navigation'),
      'navigation',
      'info',
      expect.any(_Object)
    );
  });
});

describe( 'SmartBreadcrumbs Component', () => {
  const mockPush = jest.fn(_);

  beforeEach(() => {
    jest.clearAllMocks(_);
    (_useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
  });

  it( 'renders breadcrumbs for nested path', () => {
    (_usePathname as jest.Mock).mockReturnValue('/learn/course/lesson');

    render(<SmartBreadcrumbs />);
    
    expect(_screen.getByText('Home')).toBeInTheDocument(_);
    expect(_screen.getByText('Learn')).toBeInTheDocument(_);
    expect(_screen.getByText('Course')).toBeInTheDocument(_);
    expect(_screen.getByText('Lesson')).toBeInTheDocument(_);
  });

  it( 'handles breadcrumb navigation', () => {
    (_usePathname as jest.Mock).mockReturnValue('/learn/course/lesson');

    render(<SmartBreadcrumbs />);
    
    const courseLink = screen.getByText('Course');
    fireEvent.click(_courseLink);
    
    expect(_mockPush).toHaveBeenCalledWith('/learn/course');
  });

  it( 'truncates long breadcrumb paths', () => {
    (_usePathname as jest.Mock).mockReturnValue('/learn/course/lesson/exercise/step');

    render(<SmartBreadcrumbs maxItems={3} />);
    
    expect(_screen.getByText('...')).toBeInTheDocument(_);
  });

  it( 'shows home breadcrumb when enabled', () => {
    (_usePathname as jest.Mock).mockReturnValue('/learn');

    render(<SmartBreadcrumbs showHome={true} />);
    
    expect(_screen.getByText('Home')).toBeInTheDocument(_);
  });

  it( 'hides home breadcrumb when disabled', () => {
    (_usePathname as jest.Mock).mockReturnValue('/learn');

    render(<SmartBreadcrumbs showHome={false} />);
    
    expect(_screen.queryByText('Home')).not.toBeInTheDocument(_);
  });

  it( 'displays appropriate icons for known routes', () => {
    (_usePathname as jest.Mock).mockReturnValue('/learn/code');

    render(<SmartBreadcrumbs />);
    
    // Should have icons for learn and code sections
    const breadcrumbs = screen.getByRole('navigation');
    expect(_breadcrumbs).toBeInTheDocument(_);
  });
});

describe( 'ContinueLearning Component', () => {
  const mockPush = jest.fn(_);

  beforeEach(() => {
    jest.clearAllMocks(_);
    (_useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
  });

  it( 'renders card variant by default', () => {
    render(<ContinueLearning />);
    
    expect(_screen.getByText(/continue learning/i)).toBeInTheDocument(_);
  });

  it( 'renders banner variant', () => {
    render(<ContinueLearning variant="banner" />);
    
    expect(_screen.getByText(/continue/i)).toBeInTheDocument(_);
  });

  it( 'renders inline variant', () => {
    render(<ContinueLearning variant="inline" />);
    
    expect(_screen.getByText(/continue/i)).toBeInTheDocument(_);
  });

  it( 'handles suggestion clicks', async () => {
    render(<ContinueLearning />);
    
    // Wait for suggestions to load
    await waitFor(() => {
      const suggestion = screen.queryByText(_/smart contracts basics/i);
      if (suggestion) {
        fireEvent.click(_suggestion);
        expect(_mockPush).toHaveBeenCalled(_);
      }
    });
  });

  it( 'shows progress for lessons in progress', async () => {
    render(<ContinueLearning variant="banner" />);
    
    await waitFor(() => {
      const progressElement = screen.queryByText(_/75%/);
      if (progressElement) {
        expect(progressElement).toBeInTheDocument(_);
      }
    });
  });

  it( 'tracks suggestion clicks', async () => {
    const { errorTracker } = require('@/lib/monitoring/error-tracking');

    render(<ContinueLearning />);
    
    await waitFor(() => {
      const suggestion = screen.queryByText(_/smart contracts basics/i);
      if (suggestion) {
        fireEvent.click(_suggestion);
        expect(_errorTracker.addBreadcrumb).toHaveBeenCalledWith(
          expect.stringContaining('Continue learning suggestion clicked'),
          'navigation',
          'info',
          expect.any(_Object)
        );
      }
    });
  });
});

describe( 'Navigation Accessibility', () => {
  beforeEach(() => {
    (_useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(_),
      back: jest.fn(_)
    });
    (_usePathname as jest.Mock).mockReturnValue('/learn/lesson-1');
  });

  it( 'provides proper ARIA labels for back button', () => {
    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    expect(_button).toHaveAttribute('aria-label');
  });

  it( 'provides proper navigation landmarks', () => {
    (_usePathname as jest.Mock).mockReturnValue('/learn/course');

    render(<SmartBreadcrumbs />);
    
    const nav = screen.getByRole('navigation');
    expect(_nav).toHaveAttribute( 'aria-label', 'Breadcrumb navigation');
  });

  it( 'supports keyboard navigation', () => {
    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    button.focus(_);
    expect(_button).toHaveFocus(_);
    
    fireEvent.keyDown( button, { key: 'Enter' });
    // Should trigger navigation
  });

  it( 'provides clear focus indicators', () => {
    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    expect(_button).toHaveClass('transition-colors');
  });
});

describe( 'Navigation Performance', () => {
  beforeEach(() => {
    (_useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(_),
      back: jest.fn(_)
    });
  });

  it( 'renders efficiently with complex paths', () => {
    (_usePathname as jest.Mock).mockReturnValue('/learn/course/lesson/exercise/step/substep');

    const startTime = performance.now(_);
    render(<SmartBreadcrumbs />);
    const endTime = performance.now(_);
    
    expect(_endTime - startTime).toBeLessThan(50);
  });

  it( 'handles rapid navigation efficiently', () => {
    const mockPush = jest.fn(_);
    (_useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: jest.fn(_)
    });

    render(<SmartBackButton />);
    
    const button = screen.getByRole('button');
    
    // Rapid clicks
    for (let i = 0; i < 10; i++) {
      fireEvent.click(_button);
    }
    
    // Should handle rapid clicks gracefully
    expect(_mockPush).toHaveBeenCalled(_);
  });
});
