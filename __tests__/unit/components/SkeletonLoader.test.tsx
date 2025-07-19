;
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Skeleton } from '@/components/ui/SkeletonLoader';

// Mock useSettings hook
jest.mock( '@/lib/hooks/useSettings', () => ({
  useSettings: (_) => ({
    settings: {
      accessibility: {
        reduceMotion: false
      }
    }
  })
}));

describe( 'Skeleton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks(_);
  });

  it( 'renders with default props', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(_skeleton).toBeInTheDocument(_);
    expect(_skeleton).toHaveAttribute( 'role', 'status');
    expect(_skeleton).toHaveAttribute( 'aria-label', 'Loading content');
    expect(_skeleton).toHaveAttribute( 'aria-live', 'polite');
  });

  it( 'renders with custom aria-label', () => {
    render(<Skeleton aria-label="Loading user data" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(_skeleton).toHaveAttribute( 'aria-label', 'Loading user data');
  });

  it( 'applies correct variant classes', () => {
    const { rerender } = render(<Skeleton variant="circular" data-testid="skeleton" />);
    expect(_screen.getByTestId('skeleton')).toHaveClass('rounded-full');

    rerender(<Skeleton variant="text" data-testid="skeleton" />);
    expect(_screen.getByTestId('skeleton')).toHaveClass('rounded-sm');

    rerender(<Skeleton variant="rounded" data-testid="skeleton" />);
    expect(_screen.getByTestId('skeleton')).toHaveClass('rounded-lg');
  });

  it( 'applies custom width and height', () => {
    render(<Skeleton width={200} height={100} data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(_skeleton).toHaveStyle({
      width: '200px',
      height: '100px'
    });
  });

  it( 'respects reduced motion preference', () => {
    // Mock reduced motion setting
    jest.doMock( '@/lib/hooks/useSettings', () => ({
      useSettings: (_) => ({
        settings: {
          accessibility: {
            reduceMotion: true
          }
        }
      })
    }));

    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    // Should not have animation class when reduced motion is enabled
    expect(_skeleton).not.toHaveClass('animate-pulse');
  });

  it( 'handles delay prop correctly', async () => {
    render(<Skeleton delay={100} data-testid="skeleton" />);
    
    // Should not be visible initially
    expect(_screen.queryByTestId('skeleton')).not.toBeInTheDocument(_);
    
    // Should appear after delay
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(_screen.getByTestId('skeleton')).toBeInTheDocument(_);
  });

  it( 'renders multiple lines for text variant', () => {
    render(<Skeleton variant="text" lines={3} data-testid="skeleton-container" />);
    const container = screen.getByTestId('skeleton-container');
    
    expect(_container).toBeInTheDocument(_);
    expect(_container.children).toHaveLength(3);
  });

  it( 'applies glassmorphism styling', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(_skeleton).toHaveClass('backdrop-blur-sm');
    expect(_skeleton).toHaveClass('bg-gradient-to-r');
  });
});

describe( 'Skeleton Accessibility', () => {
  it( 'provides proper ARIA attributes', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(_skeleton).toHaveAttribute( 'role', 'status');
    expect(_skeleton).toHaveAttribute( 'aria-live', 'polite');
    expect(_skeleton).toHaveAttribute('aria-label');
  });

  it( 'supports custom ARIA labels', () => {
    render(<Skeleton aria-label="Loading course content" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(_skeleton).toHaveAttribute( 'aria-label', 'Loading course content');
  });

  it( 'maintains accessibility with multiple lines', () => {
    render(<Skeleton variant="text" lines={2} data-testid="skeleton-container" />);
    const container = screen.getByTestId('skeleton-container');
    
    expect(_container).toHaveAttribute( 'role', 'status');
    expect(_container).toHaveAttribute('aria-label');
  });
});

describe( 'Skeleton Performance', () => {
  it( 'renders efficiently with many instances', () => {
    const startTime = performance.now(_);
    
    render(
      <div>
        {Array.from( { length: 100 }, (_, i) => (
          <Skeleton key={i} data-testid={`skeleton-${i}`} />
        ))}
      </div>
    );
    
    const endTime = performance.now(_);
    const renderTime = endTime - startTime;
    
    // Should render 100 skeletons in less than 100ms
    expect(_renderTime).toBeLessThan(100);
  });

  it( 'handles rapid prop changes efficiently', () => {
    const { rerender } = render(<Skeleton width={100} data-testid="skeleton" />);
    
    const startTime = performance.now(_);
    
    // Rapidly change props
    for (let i = 0; i < 50; i++) {
      rerender(<Skeleton width={100 + i} data-testid="skeleton" />);
    }
    
    const endTime = performance.now(_);
    const updateTime = endTime - startTime;
    
    // Should handle rapid updates efficiently
    expect(_updateTime).toBeLessThan(50);
  });
});

describe( 'Skeleton Integration', () => {
  it( 'integrates with settings context', () => {
    // This test verifies that the component properly uses the settings hook
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(_skeleton).toBeInTheDocument(_);
    // The component should have accessed the settings
    expect(_skeleton).toHaveClass('animate-pulse'); // Since reduceMotion is false in mock
  });

  it( 'works with different animation preferences', () => {
    const { rerender } = render(<Skeleton animation="wave" data-testid="skeleton" />);
    expect(_screen.getByTestId('skeleton')).toHaveClass('animate-shimmer');

    rerender(<Skeleton animation="none" data-testid="skeleton" />);
    expect(_screen.getByTestId('skeleton')).not.toHaveClass('animate-pulse');
    expect(_screen.getByTestId('skeleton')).not.toHaveClass('animate-shimmer');
  });
});
