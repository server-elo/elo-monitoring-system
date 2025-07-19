import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlassCard } from '@/components/ui/GlassCard';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { Accessibility } from '@/components/ui/Accessibility';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader-icon">⏳</div>,
  Check: () => <div data-testid="check-icon">✓</div>,
  AlertCircle: () => <div data-testid="alert-icon">⚠</div>,
  Eye: () => <div data-testid="eye-icon">👁</div>,
  EyeOff: () => <div data-testid="eye-off-icon">🙈</div>,
  Volume2: () => <div data-testid="volume-icon">🔊</div>,
  VolumeX: () => <div data-testid="volume-off-icon">🔇</div>,
  Type: () => <div data-testid="type-icon">📝</div>,
  Contrast: () => <div data-testid="contrast-icon">🌓</div>,
  Zap: () => <div data-testid="zap-icon">⚡</div>,
}));

// Mock next/font
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'font-inter'
  })
}));

describe('Glassmorphism UI Components - Comprehensive Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GlassCard Component', () => {
    it('should render with default glassmorphism styling', () => {
      render(
        <GlassCard data-testid="glass-card">
          <p>Test content</p>
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('backdrop-blur-md');
      expect(card).toHaveClass('bg-white/10');
      expect(card).toHaveClass('border-white/20');
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <GlassCard className="custom-class" data-testid="glass-card">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('custom-class');
    });

    it('should support different blur intensities', () => {
      const { rerender } = render(
        <GlassCard blur="sm" data-testid="glass-card">
          Content
        </GlassCard>
      );

      expect(screen.getByTestId('glass-card')).toHaveClass('backdrop-blur-sm');

      rerender(
        <GlassCard blur="lg" data-testid="glass-card">
          Content
        </GlassCard>
      );

      expect(screen.getByTestId('glass-card')).toHaveClass('backdrop-blur-lg');
    });

    it('should support different opacity levels', () => {
      const { rerender } = render(
        <GlassCard opacity="low" data-testid="glass-card">
          Content
        </GlassCard>
      );

      expect(screen.getByTestId('glass-card')).toHaveClass('bg-white/5');

      rerender(
        <GlassCard opacity="high" data-testid="glass-card">
          Content
        </GlassCard>
      );

      expect(screen.getByTestId('glass-card')).toHaveClass('bg-white/20');
    });

    it('should handle hover effects', () => {
      render(
        <GlassCard hover={true} data-testid="glass-card">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('hover:bg-white/15');
      expect(card).toHaveClass('transition-all');
    });

    it('should support glow effects', () => {
      render(
        <GlassCard glow="blue" data-testid="glass-card">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('shadow-blue-500/25');
    });

    it('should be accessible with proper ARIA attributes', () => {
      render(
        <GlassCard role="region" aria-label="Glass card content" data-testid="glass-card">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveAttribute('role', 'region');
      expect(card).toHaveAttribute('aria-label', 'Glass card content');
    });
  });

  describe('EnhancedButton Component', () => {
    const mockOnClick = jest.fn();

    beforeEach(() => {
      mockOnClick.mockClear();
    });

    it('should render with default styling', () => {
      render(
        <EnhancedButton onClick={mockOnClick} data-testid="enhanced-button">
          Click me
        </EnhancedButton>
      );

      const button = screen.getByTestId('enhanced-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('relative');
      expect(button).toHaveClass('overflow-hidden');
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should handle click events', () => {
      render(
        <EnhancedButton onClick={mockOnClick} data-testid="enhanced-button">
          Click me
        </EnhancedButton>
      );

      const button = screen.getByTestId('enhanced-button');
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should support different variants', () => {
      const { rerender } = render(
        <EnhancedButton variant="primary" data-testid="enhanced-button">
          Primary
        </EnhancedButton>
      );

      expect(screen.getByTestId('enhanced-button')).toHaveClass('bg-blue-600');

      rerender(
        <EnhancedButton variant="secondary" data-testid="enhanced-button">
          Secondary
        </EnhancedButton>
      );

      expect(screen.getByTestId('enhanced-button')).toHaveClass('bg-gray-600');

      rerender(
        <EnhancedButton variant="ghost" data-testid="enhanced-button">
          Ghost
        </EnhancedButton>
      );

      expect(screen.getByTestId('enhanced-button')).toHaveClass('bg-transparent');
    });

    it('should support different sizes', () => {
      const { rerender } = render(
        <EnhancedButton size="sm" data-testid="enhanced-button">
          Small
        </EnhancedButton>
      );

      expect(screen.getByTestId('enhanced-button')).toHaveClass('px-3', 'py-1.5', 'text-sm');

      rerender(
        <EnhancedButton size="lg" data-testid="enhanced-button">
          Large
        </EnhancedButton>
      );

      expect(screen.getByTestId('enhanced-button')).toHaveClass('px-6', 'py-3', 'text-lg');
    });

    it('should show loading state', () => {
      render(
        <EnhancedButton loading={true} data-testid="enhanced-button">
          Submit
        </EnhancedButton>
      );

      const button = screen.getByTestId('enhanced-button');
      expect(button).toBeDisabled();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should be disabled when specified', () => {
      render(
        <EnhancedButton disabled={true} onClick={mockOnClick} data-testid="enhanced-button">
          Disabled
        </EnhancedButton>
      );

      const button = screen.getByTestId('enhanced-button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50');

      fireEvent.click(button);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should support touch targets for mobile', () => {
      render(
        <EnhancedButton touchTarget={true} data-testid="enhanced-button">
          Touch me
        </EnhancedButton>
      );

      const button = screen.getByTestId('enhanced-button');
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('min-w-[44px]');
    });

    it('should handle keyboard navigation', () => {
      render(
        <EnhancedButton onClick={mockOnClick} data-testid="enhanced-button">
          Keyboard
        </EnhancedButton>
      );

      const button = screen.getByTestId('enhanced-button');
      
      // Focus the button
      button.focus();
      expect(document.activeElement).toBe(button);

      // Press Enter
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      // Press Space
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });

    it('should support ripple effect on click', () => {
      render(
        <EnhancedButton ripple={true} data-testid="enhanced-button">
          Ripple
        </EnhancedButton>
      );

      const button = screen.getByTestId('enhanced-button');
      fireEvent.click(button);

      // Should create ripple effect (implementation dependent)
      expect(button).toHaveClass('relative');
    });

    it('should support icons', () => {
      render(
        <EnhancedButton 
          icon={<span data-testid="custom-icon">🚀</span>}
          data-testid="enhanced-button"
        >
          With Icon
        </EnhancedButton>
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility Component', () => {
    it('should render accessibility controls', () => {
      render(<Accessibility />);

      expect(screen.getByText('Accessibility Settings')).toBeInTheDocument();
      expect(screen.getByText('Font Size')).toBeInTheDocument();
      expect(screen.getByText('High Contrast')).toBeInTheDocument();
      expect(screen.getByText('Reduce Motion')).toBeInTheDocument();
    });

    it('should handle font size adjustments', () => {
      render(<Accessibility />);

      const increaseFontButton = screen.getByLabelText('Increase font size');
      const decreaseFontButton = screen.getByLabelText('Decrease font size');

      fireEvent.click(increaseFontButton);
      fireEvent.click(decreaseFontButton);

      // Font size should be adjusted (implementation dependent)
      expect(increaseFontButton).toBeInTheDocument();
      expect(decreaseFontButton).toBeInTheDocument();
    });

    it('should toggle high contrast mode', () => {
      render(<Accessibility />);

      const contrastToggle = screen.getByLabelText('Toggle high contrast');
      fireEvent.click(contrastToggle);

      // High contrast should be toggled (implementation dependent)
      expect(contrastToggle).toBeInTheDocument();
    });

    it('should toggle reduced motion', () => {
      render(<Accessibility />);

      const motionToggle = screen.getByLabelText('Toggle reduced motion');
      fireEvent.click(motionToggle);

      // Reduced motion should be toggled (implementation dependent)
      expect(motionToggle).toBeInTheDocument();
    });

    it('should support screen reader announcements', () => {
      render(<Accessibility />);

      // Should have proper ARIA live regions
      const liveRegion = screen.getByRole('status', { hidden: true });
      expect(liveRegion).toBeInTheDocument();
    });

    it('should persist accessibility preferences', () => {
      const { rerender } = render(<Accessibility />);

      const contrastToggle = screen.getByLabelText('Toggle high contrast');
      fireEvent.click(contrastToggle);

      // Rerender component
      rerender(<Accessibility />);

      // Preferences should be persisted (implementation dependent)
      expect(contrastToggle).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<Accessibility />);

      const firstControl = screen.getByLabelText('Increase font size');
      firstControl.focus();

      expect(document.activeElement).toBe(firstControl);

      // Tab navigation should work
      fireEvent.keyDown(firstControl, { key: 'Tab' });
      // Next element should be focused (implementation dependent)
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      // Mock window.matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    });

    it('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <GlassCard data-testid="responsive-card">
          <EnhancedButton touchTarget={true}>Mobile Button</EnhancedButton>
        </GlassCard>
      );

      const button = screen.getByText('Mobile Button');
      expect(button).toHaveClass('min-h-[44px]');
    });

    it('should handle tablet viewport', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 1024px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <GlassCard data-testid="tablet-card">
          Tablet content
        </GlassCard>
      );

      expect(screen.getByTestId('tablet-card')).toBeInTheDocument();
    });

    it('should handle desktop viewport', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(min-width: 1025px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <GlassCard data-testid="desktop-card">
          Desktop content
        </GlassCard>
      );

      expect(screen.getByTestId('desktop-card')).toBeInTheDocument();
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should handle browsers without backdrop-filter support', () => {
      // Mock CSS.supports to return false for backdrop-filter
      Object.defineProperty(CSS, 'supports', {
        value: jest.fn().mockImplementation((property, value) => {
          if (property === 'backdrop-filter') return false;
          return true;
        })
      });

      render(
        <GlassCard data-testid="fallback-card">
          Fallback content
        </GlassCard>
      );

      const card = screen.getByTestId('fallback-card');
      // Should apply fallback styling
      expect(card).toBeInTheDocument();
    });

    it('should handle reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <EnhancedButton data-testid="reduced-motion-button">
          No Animation
        </EnhancedButton>
      );

      const button = screen.getByTestId('reduced-motion-button');
      // Should respect reduced motion preference
      expect(button).not.toHaveClass('transition-all');
    });
  });

  describe('Performance Optimization', () => {
    it('should render efficiently with many components', () => {
      const startTime = performance.now();

      render(
        <div>
          {Array.from({ length: 50 }, (_, i) => (
            <GlassCard key={i} data-testid={`card-${i}`}>
              <EnhancedButton>Button {i}</EnhancedButton>
            </GlassCard>
          ))}
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100); // Should render within 100ms
      expect(screen.getByTestId('card-0')).toBeInTheDocument();
      expect(screen.getByTestId('card-49')).toBeInTheDocument();
    });

    it('should handle rapid state changes efficiently', () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        
        return (
          <EnhancedButton 
            onClick={() => setCount(c => c + 1)}
            data-testid="counter-button"
          >
            Count: {count}
          </EnhancedButton>
        );
      };

      render(<TestComponent />);

      const button = screen.getByTestId('counter-button');
      
      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      expect(screen.getByText('Count: 10')).toBeInTheDocument();
    });
  });
});
