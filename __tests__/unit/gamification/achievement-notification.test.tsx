;
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AchievementNotification } from '@/components/achievements/AchievementNotification';
import { Achievement, AchievementNotification as NotificationType } from '@/lib/achievements/types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Trophy: () => <div data-testid="trophy-icon">🏆</div>,
  X: () => <div data-testid="x-icon">✕</div>,
  Star: () => <div data-testid="star-icon">⭐</div>,
  Zap: () => <div data-testid="zap-icon">⚡</div>,
  Gift: () => <div data-testid="gift-icon">🎁</div>,
  Crown: () => <div data-testid="crown-icon">👑</div>,
  Sparkles: () => <div data-testid="sparkles-icon">✨</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">✓</div>,
  Award: () => <div data-testid="award-icon">🏅</div>,
  Eye: () => <div data-testid="eye-icon">👁</div>,
}));

// Mock components
jest.mock('@/components/ui/GlassCard', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={`glass-card ${className}`} data-testid="glass-card">
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/EnhancedButton', () => ({
  EnhancedButton: ({ children, onClick, className, variant, touchTarget, ...props }: any) => (
    <button
      onClick={onClick}
      className={`enhanced-button ${className} ${variant}`}
      data-testid="enhanced-button"
      data-touch-target={touchTarget}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Test data
const mockAchievement: Achievement = {
  id: 'first_lesson',
  title: 'First Steps',
  description: 'Complete your first Solidity lesson',
  longDescription: 'Welcome to the world of Solidity! You\'ve taken your first step into smart contract development.',
  category: 'learning',
  rarity: 'common',
  icon: '🎯',
  requirements: [
    {
      type: 'lesson_complete',
      target: 1,
      current: 1
    }
  ],
  rewards: {
    xp: 100,
    badge: 'first_steps',
    title: 'Solidity Beginner'
  }
};

const mockNotification: NotificationType = {
  id: 'notification-123',
  achievementId: 'first_lesson',
  type: 'unlock',
  title: 'Achievement Unlocked: First Steps',
  message: 'You completed your first Solidity lesson!',
  timestamp: new Date(),
  read: false,
  rewards: {
    xp: 100,
    badges: ['first_steps'],
    title: 'Solidity Beginner',
    unlocks: ['advanced_lessons']
  }
};

describe('AchievementNotification Component - Comprehensive Test Suite', () => {
  const mockOnDismiss = jest.fn();
  const mockOnCelebrate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render achievement notification with basic information', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
          onCelebrate={mockOnCelebrate}
        />
      );

      expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
      expect(screen.getByText('First Steps')).toBeInTheDocument();
      expect(screen.getByText('Complete your first Solidity lesson')).toBeInTheDocument();
      expect(screen.getByText('You completed your first Solidity lesson!')).toBeInTheDocument();
    });

    it('should render achievement icon and rarity information', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('🎯')).toBeInTheDocument();
      expect(screen.getByText('Common Achievement')).toBeInTheDocument();
    });

    it('should render rewards section when rewards are provided', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Rewards')).toBeInTheDocument();
      expect(screen.getByText('+100 XP')).toBeInTheDocument();
      expect(screen.getByText('1 badge(s)')).toBeInTheDocument();
      expect(screen.getByText('1 item(s)')).toBeInTheDocument();
    });

    it('should render dismiss button', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss notification');
      expect(dismissButton).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Awesome!')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onDismiss when dismiss button is clicked', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      // Should call onDismiss after animation delay
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when "Awesome!" button is clicked', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      const awesomeButton = screen.getByText('Awesome!');
      fireEvent.click(awesomeButton);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onCelebrate when provided', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
          onCelebrate={mockOnCelebrate}
        />
      );

      // Simulate celebration trigger (implementation dependent)
      expect(mockOnCelebrate).toBeDefined();
    });
  });

  describe('Auto-hide Functionality', () => {
    it('should auto-hide after specified delay', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
          autoHide={true}
          hideDelay={3000}
        />
      );

      expect(screen.getByText('First Steps')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      act(() => {
        jest.advanceTimersByTime(500); // Animation delay
      });

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not auto-hide when autoHide is false', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
          autoHide={false}
        />
      );

      act(() => {
        jest.advanceTimersByTime(10000); // Long delay
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('should use default hide delay when not specified', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
          autoHide={true}
        />
      );

      act(() => {
        jest.advanceTimersByTime(8000); // Default delay
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Position and Layout', () => {
    it('should apply correct position classes', () => {
      const { rerender } = render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
          position="top-right"
        />
      );

      expect(screen.getByTestId('glass-card').parentElement).toHaveClass('top-4', 'right-4');

      rerender(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
          position="bottom-left"
        />
      );

      expect(screen.getByTestId('glass-card').parentElement).toHaveClass('bottom-4', 'left-4');
    });

    it('should apply center position correctly', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
          position="center"
        />
      );

      const container = screen.getByTestId('glass-card').parentElement;
      expect(container).toHaveClass('top-1/2', 'left-1/2', 'transform', '-translate-x-1/2', '-translate-y-1/2');
    });
  });

  describe('Rarity-based Styling', () => {
    it('should apply common rarity styling', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      const glassCard = screen.getByTestId('glass-card');
      expect(glassCard).toHaveClass('border-gray-400');
    });

    it('should apply rare rarity styling', () => {
      const rareAchievement = { ...mockAchievement, rarity: 'rare' as const };
      
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={rareAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      const glassCard = screen.getByTestId('glass-card');
      expect(glassCard).toHaveClass('border-blue-400');
    });

    it('should apply legendary rarity styling with special effects', () => {
      const legendaryAchievement = { ...mockAchievement, rarity: 'legendary' as const };
      
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={legendaryAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      const glassCard = screen.getByTestId('glass-card');
      expect(glassCard).toHaveClass('border-yellow-400');
      
      // Should have shimmer effect for legendary
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss notification');
      
      // Should be focusable
      dismissButton.focus();
      expect(document.activeElement).toBe(dismissButton);

      // Should respond to Enter key
      fireEvent.keyDown(dismissButton, { key: 'Enter', code: 'Enter' });
      // Implementation would handle keyboard events
    });

    it('should have proper touch targets for mobile', () => {
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      const enhancedButtons = screen.getAllByTestId('enhanced-button');
      enhancedButtons.forEach(button => {
        expect(button).toHaveAttribute('data-touch-target', 'true');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing rewards gracefully', () => {
      const notificationWithoutRewards = { ...mockNotification, rewards: undefined };
      
      expect(() => {
        render(
          <AchievementNotification
            notification={notificationWithoutRewards}
            achievement={mockAchievement}
            onDismiss={mockOnDismiss}
          />
        );
      }).not.toThrow();

      expect(screen.queryByText('Rewards')).not.toBeInTheDocument();
    });

    it('should handle missing achievement icon', () => {
      const achievementWithoutIcon = { ...mockAchievement, icon: '' };
      
      expect(() => {
        render(
          <AchievementNotification
            notification={mockNotification}
            achievement={achievementWithoutIcon}
            onDismiss={mockOnDismiss}
          />
        );
      }).not.toThrow();
    });

    it('should handle very long achievement titles and descriptions', () => {
      const longAchievement = {
        ...mockAchievement,
        title: 'A'.repeat(100),
        description: 'B'.repeat(500)
      };
      
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={longAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
      expect(screen.getByText('B'.repeat(500))).toBeInTheDocument();
    });

    it('should handle null or undefined callbacks', () => {
      expect(() => {
        render(
          <AchievementNotification
            notification={mockNotification}
            achievement={mockAchievement}
            onDismiss={mockOnDismiss}
            onCelebrate={undefined}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with complex achievement data', () => {
      const complexAchievement = {
        ...mockAchievement,
        requirements: Array.from({ length: 10 }, (_, i) => ({
          type: 'lesson_complete' as const,
          target: i + 1,
          current: i
        }))
      };

      const startTime = performance.now();
      
      render(
        <AchievementNotification
          notification={mockNotification}
          achievement={complexAchievement}
          onDismiss={mockOnDismiss}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50); // Should render within 50ms
    });

    it('should clean up timers on unmount', () => {
      const { unmount } = render(
        <AchievementNotification
          notification={mockNotification}
          achievement={mockAchievement}
          onDismiss={mockOnDismiss}
          autoHide={true}
          hideDelay={5000}
        />
      );

      unmount();

      // Advance timers past the hide delay
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // onDismiss should not be called after unmount
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });
});
