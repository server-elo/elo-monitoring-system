import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { Leaderboards } from '@/components/community/Leaderboards';
import { CommunityStats } from '@/components/community/CommunityStats';
import { CommunityHub } from '@/components/community/CommunityHub';
import { leaderboardManager } from '@/lib/community/leaderboard';
import { communityStatsManager } from '@/lib/community/statistics';
import { realTimeManager } from '@/lib/community/websocket';

// Mock the community managers
jest.mock('@/lib/community/leaderboard', () => ({
  leaderboardManager: {
    getLeaderboard: jest.fn(),
    getLeaderboardCategories: jest.fn(),
    getUserRank: jest.fn(),
    refreshLeaderboard: jest.fn(),
    subscribeToUpdates: jest.fn(),
    getDefaultCategories: jest.fn(),
    getDefaultFilters: jest.fn()
  },
  LeaderboardUtils: {
    calculateRankChange: jest.fn(),
    formatXP: jest.fn(),
    formatTimeSpent: jest.fn(),
    getRankIcon: jest.fn(),
    getRankColor: jest.fn(),
    getStreakColor: jest.fn()
  }
}));

jest.mock('@/lib/community/statistics', () => ({
  communityStatsManager: {
    getCommunityStats: jest.fn(),
    getTrendingTopics: jest.fn(),
    getCommunityMilestones: jest.fn(),
    exportStats: jest.fn(),
    subscribe: jest.fn(),
    getDefaultFilters: jest.fn()
  },
  StatsUtils: {
    formatNumber: jest.fn(),
    formatPercentage: jest.fn(),
    formatDuration: jest.fn(),
    calculateGrowthRate: jest.fn(),
    formatGrowthRate: jest.fn(),
    getGrowthColor: jest.fn(),
    getTrendIcon: jest.fn(),
    formatTimeRange: jest.fn(),
    generateExportFilename: jest.fn()
  }
}));

jest.mock('@/lib/community/websocket', () => ({
  realTimeManager: {
    subscribe: jest.fn(),
    isConnected: jest.fn(),
    getConnectionType: jest.fn(),
    getLatency: jest.fn()
  }
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-1',
      name: 'Test User',
      email: 'test@example.com'
    }
  })
}));

// Mock data
const mockLeaderboardData = {
  users: [
    {
      id: 'user_1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      xpTotal: 15420,
      xpWeekly: 2340,
      xpDaily: 450,
      rank: 1,
      previousRank: 2,
      lessonsCompleted: 45,
      coursesCompleted: 8,
      currentStreak: 12,
      longestStreak: 25,
      badges: [],
      recentAchievements: [],
      joinedAt: new Date('2023-06-01'),
      lastActiveAt: new Date(),
      region: 'US',
      role: 'student' as const,
      completionRate: 92,
      averageScore: 88,
      contributionScore: 156,
      timeSpent: 2340
    }
  ],
  total: 1,
  page: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  lastUpdated: new Date(),
  category: {
    id: 'global_xp',
    name: 'Global XP Leaders',
    description: 'Top users by total XP earned',
    icon: '🏆',
    sortBy: 'xpTotal' as const,
    timeframe: 'all-time' as const,
    enabled: true
  },
  filters: {
    timeframe: 'all-time' as const,
    category: 'global_xp',
    userRole: 'all' as const
  }
};

const mockCategories = [
  {
    id: 'global_xp',
    name: 'Global XP Leaders',
    description: 'Top users by total XP earned',
    icon: '🏆',
    sortBy: 'xpTotal' as const,
    timeframe: 'all-time' as const,
    enabled: true
  }
];

const mockStats = {
  totalUsers: 1247,
  activeUsers: {
    today: 187,
    thisWeek: 563,
    thisMonth: 934
  },
  lessonsCompleted: {
    today: 156,
    thisWeek: 1089,
    thisMonth: 4567,
    total: 23456
  },
  averageCompletionTime: {
    daily: 45,
    weekly: 52,
    monthly: 48
  },
  engagementMetrics: {
    dailyActiveUsers: 187,
    weeklyActiveUsers: 563,
    monthlyActiveUsers: 934,
    averageSessionTime: 34,
    bounceRate: 0.12,
    retentionRate: 0.78
  },
  trendingTopics: [],
  communityMilestones: [],
  recentAchievements: [],
  platformGrowth: {
    userGrowthRate: 8.5,
    contentGrowthRate: 12.3,
    engagementGrowthRate: 6.7
  },
  lastUpdated: new Date()
};

describe('Community Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (leaderboardManager.getLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboardData);
    (leaderboardManager.getLeaderboardCategories as jest.Mock).mockResolvedValue(mockCategories);
    (leaderboardManager.getDefaultCategories as jest.Mock).mockReturnValue(mockCategories);
    (leaderboardManager.getDefaultFilters as jest.Mock).mockReturnValue({
      timeframe: 'all-time',
      category: 'global_xp',
      userRole: 'all'
    });
    (leaderboardManager.subscribeToUpdates as jest.Mock).mockReturnValue(() => {});
    
    (communityStatsManager.getCommunityStats as jest.Mock).mockResolvedValue(mockStats);
    (communityStatsManager.getTrendingTopics as jest.Mock).mockResolvedValue([]);
    (communityStatsManager.getCommunityMilestones as jest.Mock).mockResolvedValue([]);
    (communityStatsManager.getDefaultFilters as jest.Mock).mockReturnValue({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    });
    (communityStatsManager.subscribe as jest.Mock).mockReturnValue(() => {});
    
    (realTimeManager.subscribe as jest.Mock).mockReturnValue(() => {});
    (realTimeManager.isConnected as jest.Mock).mockReturnValue(true);
    (realTimeManager.getConnectionType as jest.Mock).mockReturnValue('websocket');
    (realTimeManager.getLatency as jest.Mock).mockReturnValue(50);
  });

  describe('Leaderboards Component', () => {
    test('should render leaderboards with loading state', async () => {
      render(<Leaderboards />);

      expect(screen.getByText('Leaderboards')).toBeInTheDocument();
      expect(screen.getByText('Compete with the community and track your progress')).toBeInTheDocument();
      
      // Should show loading initially
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    test('should load and display leaderboard data', async () => {
      render(<Leaderboards />);

      await waitFor(() => {
        expect(leaderboardManager.getLeaderboardCategories).toHaveBeenCalled();
        expect(leaderboardManager.getLeaderboard).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
    });

    test('should handle filter changes', async () => {
      render(<Leaderboards />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Time')).toBeInTheDocument();
      });

      const timeframeSelect = screen.getByDisplayValue('All Time');
      fireEvent.change(timeframeSelect, { target: { value: 'weekly' } });

      await waitFor(() => {
        expect(leaderboardManager.getLeaderboard).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ timeframe: 'weekly' }),
          expect.any(Number),
          expect.any(Number)
        );
      });
    });

    test('should handle refresh action', async () => {
      render(<Leaderboards />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(leaderboardManager.refreshLeaderboard).toHaveBeenCalled();
      });
    });

    test('should handle search functionality', async () => {
      render(<Leaderboards />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search users...');
        expect(searchInput).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      await waitFor(() => {
        expect(leaderboardManager.getLeaderboard).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ search: 'Alice' }),
          expect.any(Number),
          expect.any(Number)
        );
      });
    });

    test('should handle real-time updates', async () => {
      const mockSubscribe = jest.fn();
      (leaderboardManager.subscribeToUpdates as jest.Mock).mockReturnValue(mockSubscribe);

      render(<Leaderboards />);

      await waitFor(() => {
        expect(leaderboardManager.subscribeToUpdates).toHaveBeenCalled();
      });
    });
  });

  describe('Community Statistics Component', () => {
    test('should render statistics dashboard', async () => {
      render(<CommunityStats />);

      expect(screen.getByText('Community Statistics')).toBeInTheDocument();
      expect(screen.getByText('Track community engagement and platform growth')).toBeInTheDocument();
    });

    test('should load and display statistics data', async () => {
      render(<CommunityStats />);

      await waitFor(() => {
        expect(communityStatsManager.getCommunityStats).toHaveBeenCalled();
        expect(communityStatsManager.getTrendingTopics).toHaveBeenCalled();
        expect(communityStatsManager.getCommunityMilestones).toHaveBeenCalled();
      });
    });

    test('should handle export functionality', async () => {
      (communityStatsManager.exportStats as jest.Mock).mockResolvedValue('csv,data');
      
      render(<CommunityStats />);

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(communityStatsManager.exportStats).toHaveBeenCalledWith(
          expect.objectContaining({ format: 'csv' })
        );
      });
    });

    test('should handle date filter changes', async () => {
      render(<CommunityStats />);

      await waitFor(() => {
        const startDateInput = screen.getByLabelText('Start Date');
        expect(startDateInput).toBeInTheDocument();
      });

      const startDateInput = screen.getByLabelText('Start Date');
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

      await waitFor(() => {
        expect(communityStatsManager.getCommunityStats).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: expect.any(Date)
          })
        );
      });
    });

    test('should handle refresh action', async () => {
      render(<CommunityStats />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(communityStatsManager.getCommunityStats).toHaveBeenCalled();
      });
    });
  });

  describe('Community Hub Component', () => {
    test('should render community hub with all tabs', async () => {
      render(<CommunityHub />);

      expect(screen.getByText('Community Hub')).toBeInTheDocument();
      expect(screen.getByText('Connect, compete, and grow with the Solidity learning community')).toBeInTheDocument();
      
      // Check tab navigation
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Leaderboards')).toBeInTheDocument();
      expect(screen.getByText('Statistics')).toBeInTheDocument();
    });

    test('should display connection status', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect(screen.getByText(/Connected via websocket/)).toBeInTheDocument();
      });
    });

    test('should handle tab switching', async () => {
      render(<CommunityHub />);

      const leaderboardsTab = screen.getByText('Leaderboards');
      fireEvent.click(leaderboardsTab);

      await waitFor(() => {
        expect(screen.getByText('Compete with the community and track your progress')).toBeInTheDocument();
      });

      const statisticsTab = screen.getByText('Statistics');
      fireEvent.click(statisticsTab);

      await waitFor(() => {
        expect(screen.getByText('Track community engagement and platform growth')).toBeInTheDocument();
      });
    });

    test('should display quick stats', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('Online Now')).toBeInTheDocument();
        expect(screen.getByText('Lessons Today')).toBeInTheDocument();
        expect(screen.getByText('XP Earned')).toBeInTheDocument();
      });
    });

    test('should display welcome message for authenticated user', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument();
      });
    });

    test('should display top performers section', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect(screen.getByText('Top Performers This Week')).toBeInTheDocument();
        expect(screen.getByText('View Full Leaderboard')).toBeInTheDocument();
      });
    });

    test('should display recent achievements section', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
        expect(screen.getByText('View All Statistics')).toBeInTheDocument();
      });
    });

    test('should display live activity feed', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect(screen.getByText('Live Activity Feed')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    test('should subscribe to real-time updates', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect(realTimeManager.subscribe).toHaveBeenCalledWith('connection', expect.any(Function));
      });
    });

    test('should handle connection status changes', async () => {
      (realTimeManager.isConnected as jest.Mock).mockReturnValue(false);
      (realTimeManager.getConnectionType as jest.Mock).mockReturnValue('polling');

      render(<CommunityHub />);

      await waitFor(() => {
        expect(screen.getByText(/Disconnected via polling/)).toBeInTheDocument();
      });
    });

    test('should update connection latency', async () => {
      (realTimeManager.getLatency as jest.Mock).mockReturnValue(150);

      render(<CommunityHub />);

      await waitFor(() => {
        expect(screen.getByText(/Connected via websocket \(150ms\)/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle leaderboard fetch errors gracefully', async () => {
      (leaderboardManager.getLeaderboard as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<Leaderboards />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load leaderboard:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    test('should handle statistics fetch errors gracefully', async () => {
      (communityStatsManager.getCommunityStats as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<CommunityStats />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load community stats:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    test('should handle export errors gracefully', async () => {
      (communityStatsManager.exportStats as jest.Mock).mockRejectedValue(new Error('Export failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<CommunityStats />);

      await waitFor(() => {
        const exportButton = screen.getByText('Export CSV');
        fireEvent.click(exportButton);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to export stats:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    test('should render components within reasonable time', async () => {
      const startTime = performance.now();
      
      render(<CommunityHub />);
      
      await waitFor(() => {
        expect(screen.getByText('Community Hub')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 2 seconds
      expect(renderTime).toBeLessThan(2000);
    });

    test('should handle large leaderboard datasets efficiently', async () => {
      const largeDataset = {
        ...mockLeaderboardData,
        users: Array.from({ length: 1000 }, (_, i) => ({
          ...mockLeaderboardData.users[0],
          id: `user_${i}`,
          name: `User ${i}`,
          rank: i + 1
        })),
        total: 1000
      };

      (leaderboardManager.getLeaderboard as jest.Mock).mockResolvedValue(largeDataset);

      const startTime = performance.now();
      
      render(<Leaderboards />);
      
      await waitFor(() => {
        expect(screen.getByText('Leaderboards')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should handle large datasets efficiently
      expect(renderTime).toBeLessThan(3000);
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        // Check for proper semantic elements
        expect(screen.getByRole('main') || screen.getByRole('region')).toBeInTheDocument();
      });
    });

    test('should support keyboard navigation', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        // Should have focusable tab elements
        const tabs = screen.getAllByRole('button');
        expect(tabs.length).toBeGreaterThan(0);
      });
    });

    test('should have proper form labels', async () => {
      render(<CommunityStats />);

      await waitFor(() => {
        expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
        expect(screen.getByLabelText('End Date')).toBeInTheDocument();
      });
    });
  });
});
