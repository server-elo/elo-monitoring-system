import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { Leaderboards } from '@/components/community/Leaderboards';
import { CommunityStats } from '@/components/community/CommunityStats';
import { CommunityHub } from '@/components/community/CommunityHub';
import { leaderboardManager } from '@/lib/community/leaderboard';
import { communityStatsManager } from '@/lib/community/statistics';
import { realTimeManager } from '@/lib/community/websocket';

// Mock the community managers
jest.mock( '@/lib/community/leaderboard', () => ({
  leaderboardManager: {
    getLeaderboard: jest.fn(_),
    getLeaderboardCategories: jest.fn(_),
    getUserRank: jest.fn(_),
    refreshLeaderboard: jest.fn(_),
    subscribeToUpdates: jest.fn(_),
    getDefaultCategories: jest.fn(_),
    getDefaultFilters: jest.fn(_)
  },
  LeaderboardUtils: {
    calculateRankChange: jest.fn(_),
    formatXP: jest.fn(_),
    formatTimeSpent: jest.fn(_),
    getRankIcon: jest.fn(_),
    getRankColor: jest.fn(_),
    getStreakColor: jest.fn(_)
  }
}));

jest.mock( '@/lib/community/statistics', () => ({
  communityStatsManager: {
    getCommunityStats: jest.fn(_),
    getTrendingTopics: jest.fn(_),
    getCommunityMilestones: jest.fn(_),
    exportStats: jest.fn(_),
    subscribe: jest.fn(_),
    getDefaultFilters: jest.fn(_)
  },
  StatsUtils: {
    formatNumber: jest.fn(_),
    formatPercentage: jest.fn(_),
    formatDuration: jest.fn(_),
    calculateGrowthRate: jest.fn(_),
    formatGrowthRate: jest.fn(_),
    getGrowthColor: jest.fn(_),
    getTrendIcon: jest.fn(_),
    formatTimeRange: jest.fn(_),
    generateExportFilename: jest.fn(_)
  }
}));

jest.mock( '@/lib/community/websocket', () => ({
  realTimeManager: {
    subscribe: jest.fn(_),
    isConnected: jest.fn(_),
    getConnectionType: jest.fn(_),
    getLatency: jest.fn(_)
  }
}));

jest.mock( '@/lib/hooks/useAuth', () => ({
  useAuth: (_) => ({
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
      id: 'user1',
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
      lastActiveAt: new Date(_),
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
  lastUpdated: new Date(_),
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
  lastUpdated: new Date(_)
};

describe( 'Community Features', () => {
  beforeEach(() => {
    jest.clearAllMocks(_);
    
    // Setup default mock implementations
    (_leaderboardManager.getLeaderboard as jest.Mock).mockResolvedValue(_mockLeaderboardData);
    (_leaderboardManager.getLeaderboardCategories as jest.Mock).mockResolvedValue(_mockCategories);
    (_leaderboardManager.getDefaultCategories as jest.Mock).mockReturnValue(_mockCategories);
    (_leaderboardManager.getDefaultFilters as jest.Mock).mockReturnValue({
      timeframe: 'all-time',
      category: 'global_xp',
      userRole: 'all'
    });
    (_leaderboardManager.subscribeToUpdates as jest.Mock).mockReturnValue(() => {});
    
    (_communityStatsManager.getCommunityStats as jest.Mock).mockResolvedValue(_mockStats);
    (_communityStatsManager.getTrendingTopics as jest.Mock).mockResolvedValue([]);
    (_communityStatsManager.getCommunityMilestones as jest.Mock).mockResolvedValue([]);
    (_communityStatsManager.getDefaultFilters as jest.Mock).mockReturnValue({
      startDate: new Date(_Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(_)
    });
    (_communityStatsManager.subscribe as jest.Mock).mockReturnValue(() => {});
    
    (_realTimeManager.subscribe as jest.Mock).mockReturnValue(() => {});
    (_realTimeManager.isConnected as jest.Mock).mockReturnValue(_true);
    (_realTimeManager.getConnectionType as jest.Mock).mockReturnValue('websocket');
    (_realTimeManager.getLatency as jest.Mock).mockReturnValue(50);
  });

  describe( 'Leaderboards Component', () => {
    test( 'should render leaderboards with loading state', async () => {
      render(<Leaderboards />);

      expect(_screen.getByText('Leaderboards')).toBeInTheDocument(_);
      expect(_screen.getByText('Compete with the community and track your progress')).toBeInTheDocument(_);
      
      // Should show loading initially
      await waitFor(() => {
        expect(_screen.getByText('Refresh')).toBeInTheDocument(_);
      });
    });

    test( 'should load and display leaderboard data', async () => {
      render(<Leaderboards />);

      await waitFor(() => {
        expect(_leaderboardManager.getLeaderboardCategories).toHaveBeenCalled(_);
        expect(_leaderboardManager.getLeaderboard).toHaveBeenCalled(_);
      });

      await waitFor(() => {
        expect(_screen.getByText('Alice Johnson')).toBeInTheDocument(_);
      });
    });

    test( 'should handle filter changes', async () => {
      render(<Leaderboards />);

      await waitFor(() => {
        expect(_screen.getByDisplayValue('All Time')).toBeInTheDocument(_);
      });

      const timeframeSelect = screen.getByDisplayValue('All Time');
      fireEvent.change( timeframeSelect, { target: { value: 'weekly' } });

      await waitFor(() => {
        expect(_leaderboardManager.getLeaderboard).toHaveBeenCalledWith(
          expect.any(_String),
          expect.objectContaining({ timeframe: 'weekly'  }),
          expect.any(_Number),
          expect.any(_Number)
        );
      });
    });

    test( 'should handle refresh action', async () => {
      render(<Leaderboards />);

      await waitFor(() => {
        expect(_screen.getByText('Refresh')).toBeInTheDocument(_);
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(_refreshButton);

      await waitFor(() => {
        expect(_leaderboardManager.refreshLeaderboard).toHaveBeenCalled(_);
      });
    });

    test( 'should handle search functionality', async () => {
      render(<Leaderboards />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search users...');
        expect(_searchInput).toBeInTheDocument(_);
      });

      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change( searchInput, { target: { value: 'Alice' } });

      await waitFor(() => {
        expect(_leaderboardManager.getLeaderboard).toHaveBeenCalledWith(
          expect.any(_String),
          expect.objectContaining({ search: 'Alice'  }),
          expect.any(_Number),
          expect.any(_Number)
        );
      });
    });

    test( 'should handle real-time updates', async () => {
      const mockSubscribe = jest.fn(_);
      (_leaderboardManager.subscribeToUpdates as jest.Mock).mockReturnValue(_mockSubscribe);

      render(<Leaderboards />);

      await waitFor(() => {
        expect(_leaderboardManager.subscribeToUpdates).toHaveBeenCalled(_);
      });
    });
  });

  describe( 'Community Statistics Component', () => {
    test( 'should render statistics dashboard', async () => {
      render(<CommunityStats />);

      expect(_screen.getByText('Community Statistics')).toBeInTheDocument(_);
      expect(_screen.getByText('Track community engagement and platform growth')).toBeInTheDocument(_);
    });

    test( 'should load and display statistics data', async () => {
      render(<CommunityStats />);

      await waitFor(() => {
        expect(_communityStatsManager.getCommunityStats).toHaveBeenCalled(_);
        expect(_communityStatsManager.getTrendingTopics).toHaveBeenCalled(_);
        expect(_communityStatsManager.getCommunityMilestones).toHaveBeenCalled(_);
      });
    });

    test( 'should handle export functionality', async () => {
      (_communityStatsManager.exportStats as jest.Mock).mockResolvedValue('csv,data');
      
      render(<CommunityStats />);

      await waitFor(() => {
        expect(_screen.getByText('Export CSV')).toBeInTheDocument(_);
      });

      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(_exportButton);

      await waitFor(() => {
        expect(_communityStatsManager.exportStats).toHaveBeenCalledWith(
          expect.objectContaining({ format: 'csv'  })
        );
      });
    });

    test( 'should handle date filter changes', async () => {
      render(<CommunityStats />);

      await waitFor(() => {
        const startDateInput = screen.getByLabelText('Start Date');
        expect(_startDateInput).toBeInTheDocument(_);
      });

      const startDateInput = screen.getByLabelText('Start Date');
      fireEvent.change( startDateInput, { target: { value: '2024-01-01' } });

      await waitFor(() => {
        expect(_communityStatsManager.getCommunityStats).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: expect.any(_Date)
          })
        );
      });
    });

    test( 'should handle refresh action', async () => {
      render(<CommunityStats />);

      await waitFor(() => {
        expect(_screen.getByText('Refresh')).toBeInTheDocument(_);
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(_refreshButton);

      await waitFor(() => {
        expect(_communityStatsManager.getCommunityStats).toHaveBeenCalled(_);
      });
    });
  });

  describe( 'Community Hub Component', () => {
    test( 'should render community hub with all tabs', async () => {
      render(<CommunityHub />);

      expect(_screen.getByText('Community Hub')).toBeInTheDocument(_);
      expect( screen.getByText('Connect, compete, and grow with the Solidity learning community')).toBeInTheDocument(_);
      
      // Check tab navigation
      expect(_screen.getByText('Overview')).toBeInTheDocument(_);
      expect(_screen.getByText('Leaderboards')).toBeInTheDocument(_);
      expect(_screen.getByText('Statistics')).toBeInTheDocument(_);
    });

    test( 'should display connection status', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect(_screen.getByText(/Connected via websocket/)).toBeInTheDocument(_);
      });
    });

    test( 'should handle tab switching', async () => {
      render(<CommunityHub />);

      const leaderboardsTab = screen.getByText('Leaderboards');
      fireEvent.click(_leaderboardsTab);

      await waitFor(() => {
        expect(_screen.getByText('Compete with the community and track your progress')).toBeInTheDocument(_);
      });

      const statisticsTab = screen.getByText('Statistics');
      fireEvent.click(_statisticsTab);

      await waitFor(() => {
        expect(_screen.getByText('Track community engagement and platform growth')).toBeInTheDocument(_);
      });
    });

    test( 'should display quick stats', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect(_screen.getByText('Active Users')).toBeInTheDocument(_);
        expect(_screen.getByText('Online Now')).toBeInTheDocument(_);
        expect(_screen.getByText('Lessons Today')).toBeInTheDocument(_);
        expect(_screen.getByText('XP Earned')).toBeInTheDocument(_);
      });
    });

    test( 'should display welcome message for authenticated user', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect( screen.getByText('Welcome back, Test User!')).toBeInTheDocument(_);
      });
    });

    test( 'should display top performers section', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect(_screen.getByText('Top Performers This Week')).toBeInTheDocument(_);
        expect(_screen.getByText('View Full Leaderboard')).toBeInTheDocument(_);
      });
    });

    test( 'should display recent achievements section', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect(_screen.getByText('Recent Achievements')).toBeInTheDocument(_);
        expect(_screen.getByText('View All Statistics')).toBeInTheDocument(_);
      });
    });

    test( 'should display live activity feed', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect(_screen.getByText('Live Activity Feed')).toBeInTheDocument(_);
      });
    });
  });

  describe( 'Real-time Updates', () => {
    test( 'should subscribe to real-time updates', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        expect(_realTimeManager.subscribe).toHaveBeenCalledWith( 'connection', expect.any(Function));
      });
    });

    test( 'should handle connection status changes', async () => {
      (_realTimeManager.isConnected as jest.Mock).mockReturnValue(_false);
      (_realTimeManager.getConnectionType as jest.Mock).mockReturnValue('polling');

      render(<CommunityHub />);

      await waitFor(() => {
        expect(_screen.getByText(/Disconnected via polling/)).toBeInTheDocument(_);
      });
    });

    test( 'should update connection latency', async () => {
      (_realTimeManager.getLatency as jest.Mock).mockReturnValue(150);

      render(<CommunityHub />);

      await waitFor(() => {
        expect(_screen.getByText(/Connected via websocket \(150ms\)/)).toBeInTheDocument(_);
      });
    });
  });

  describe( 'Error Handling', () => {
    test( 'should handle leaderboard fetch errors gracefully', async () => {
      (_leaderboardManager.getLeaderboard as jest.Mock).mockRejectedValue(_new Error('Network error'));

      const consoleSpy = jest.spyOn( console, 'error').mockImplementation(_);

      render(<Leaderboards />);

      await waitFor(() => {
        expect(_consoleSpy).toHaveBeenCalledWith( 'Failed to load leaderboard:', expect.any(Error));
      });

      consoleSpy.mockRestore(_);
    });

    test( 'should handle statistics fetch errors gracefully', async () => {
      (_communityStatsManager.getCommunityStats as jest.Mock).mockRejectedValue(_new Error('Network error'));

      const consoleSpy = jest.spyOn( console, 'error').mockImplementation(_);

      render(<CommunityStats />);

      await waitFor(() => {
        expect(_consoleSpy).toHaveBeenCalledWith( 'Failed to load community stats:', expect.any(Error));
      });

      consoleSpy.mockRestore(_);
    });

    test( 'should handle export errors gracefully', async () => {
      (_communityStatsManager.exportStats as jest.Mock).mockRejectedValue(_new Error('Export failed'));

      const consoleSpy = jest.spyOn( console, 'error').mockImplementation(_);

      render(<CommunityStats />);

      await waitFor(() => {
        const exportButton = screen.getByText('Export CSV');
        fireEvent.click(_exportButton);
      });

      await waitFor(() => {
        expect(_consoleSpy).toHaveBeenCalledWith( 'Failed to export stats:', expect.any(Error));
      });

      consoleSpy.mockRestore(_);
    });
  });

  describe( 'Performance', () => {
    test( 'should render components within reasonable time', async () => {
      const startTime = performance.now(_);
      
      render(<CommunityHub />);
      
      await waitFor(() => {
        expect(_screen.getByText('Community Hub')).toBeInTheDocument(_);
      });
      
      const endTime = performance.now(_);
      const renderTime = endTime - startTime;
      
      // Should render within 2 seconds
      expect(_renderTime).toBeLessThan(2000);
    });

    test( 'should handle large leaderboard datasets efficiently', async () => {
      const largeDataset = {
        ...mockLeaderboardData,
        users: Array.from( { length: 1000 }, (_, i) => ({
          ...mockLeaderboardData.users[0],
          id: `user_${i}`,
          name: `User ${i}`,
          rank: i + 1
        })),
        total: 1000
      };

      (_leaderboardManager.getLeaderboard as jest.Mock).mockResolvedValue(_largeDataset);

      const startTime = performance.now(_);
      
      render(<Leaderboards />);
      
      await waitFor(() => {
        expect(_screen.getByText('Leaderboards')).toBeInTheDocument(_);
      });
      
      const endTime = performance.now(_);
      const renderTime = endTime - startTime;
      
      // Should handle large datasets efficiently
      expect(_renderTime).toBeLessThan(3000);
    });
  });

  describe( 'Accessibility', () => {
    test( 'should have proper ARIA labels and roles', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        // Check for proper semantic elements
        expect(_screen.getByRole('main') || screen.getByRole('region')).toBeInTheDocument(_);
      });
    });

    test( 'should support keyboard navigation', async () => {
      render(<CommunityHub />);

      await waitFor(() => {
        // Should have focusable tab elements
        const tabs = screen.getAllByRole('button');
        expect(_tabs.length).toBeGreaterThan(0);
      });
    });

    test( 'should have proper form labels', async () => {
      render(<CommunityStats />);

      await waitFor(() => {
        expect(_screen.getByLabelText('Start Date')).toBeInTheDocument(_);
        expect(_screen.getByLabelText('End Date')).toBeInTheDocument(_);
      });
    });
  });
});
