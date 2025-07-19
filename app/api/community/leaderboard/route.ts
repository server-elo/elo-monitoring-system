import { NextRequest, NextResponse } from 'next/server';
import { LeaderboardUser, LeaderboardResponse, LeaderboardFilters } from '@/lib/community/types';
import { logger } from '@/lib/monitoring/simple-logger';

// Mock data for demonstration - in production, this would come from your database
const mockUsers: LeaderboardUser[] = [
  {
    id: 'user_1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    avatar: '/avatars/alice.jpg',
    xpTotal: 15420,
    xpWeekly: 2340,
    xpDaily: 450,
    rank: 1,
    previousRank: 2,
    lessonsCompleted: 45,
    coursesCompleted: 8,
    currentStreak: 12,
    longestStreak: 25,
    badges: [
      {
        id: 'badge_1',
        name: 'Solidity Master',
        description: 'Completed advanced Solidity course',
        icon: '🏆',
        color: 'gold',
        earnedAt: new Date('2024-01-15'),
        rarity: 'legendary'
      }
    ],
    recentAchievements: [
      {
        id: 'achievement_1',
        title: 'Smart Contract Expert',
        description: 'Deployed 10 smart contracts',
        icon: '📜',
        xpReward: 500,
        earnedAt: new Date('2024-01-20'),
        category: 'learning'
      }
    ],
    joinedAt: new Date('2023-06-01'),
    lastActiveAt: new Date(),
    region: 'US',
    role: 'student',
    completionRate: 92,
    averageScore: 88,
    contributionScore: 156,
    timeSpent: 2340
  },
  {
    id: 'user_2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    xpTotal: 14890,
    xpWeekly: 1980,
    xpDaily: 320,
    rank: 2,
    previousRank: 1,
    lessonsCompleted: 42,
    coursesCompleted: 7,
    currentStreak: 8,
    longestStreak: 18,
    badges: [],
    recentAchievements: [],
    joinedAt: new Date('2023-07-15'),
    lastActiveAt: new Date(Date.now() - 3600000),
    region: 'EU',
    role: 'student',
    completionRate: 85,
    averageScore: 82,
    contributionScore: 134,
    timeSpent: 1980
  },
  {
    id: 'user_3',
    name: 'Carol Davis',
    email: 'carol@example.com',
    xpTotal: 13560,
    xpWeekly: 2100,
    xpDaily: 380,
    rank: 3,
    lessonsCompleted: 38,
    coursesCompleted: 6,
    currentStreak: 15,
    longestStreak: 22,
    badges: [],
    recentAchievements: [],
    joinedAt: new Date('2023-08-01'),
    lastActiveAt: new Date(Date.now() - 1800000),
    region: 'AS',
    role: 'instructor',
    completionRate: 78,
    averageScore: 90,
    contributionScore: 189,
    timeSpent: 2100
  }
];

// Generate more mock users
for (let i = 4; i <= 100; i++) {
  mockUsers.push({
    id: `user_${i}`,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    xpTotal: Math.floor(Math.random() * 10000) + 1000,
    xpWeekly: Math.floor(Math.random() * 1000) + 100,
    xpDaily: Math.floor(Math.random() * 200) + 50,
    rank: i,
    lessonsCompleted: Math.floor(Math.random() * 30) + 5,
    coursesCompleted: Math.floor(Math.random() * 5) + 1,
    currentStreak: Math.floor(Math.random() * 20),
    longestStreak: Math.floor(Math.random() * 30) + 5,
    badges: [],
    recentAchievements: [],
    joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    lastActiveAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    region: ['US', 'EU', 'AS', 'OTHER'][Math.floor(Math.random() * 4)],
    role: ['student', 'instructor'][Math.floor(Math.random() * 2)] as any,
    completionRate: Math.floor(Math.random() * 40) + 60,
    averageScore: Math.floor(Math.random() * 30) + 70,
    contributionScore: Math.floor(Math.random() * 100) + 50,
    timeSpent: Math.floor(Math.random() * 2000) + 500
  });
}

function applyFilters(users: LeaderboardUser[], filters: LeaderboardFilters): LeaderboardUser[] {
  let filtered = [...users];

  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }

  // Apply role filter
  if (filters.userRole && filters.userRole !== 'all') {
    filtered = filtered.filter(user => user.role === filters.userRole);
  }

  // Apply region filter
  if (filters.region) {
    filtered = filtered.filter(user => user.region === filters.region);
  }

  // Apply XP range filters
  if (filters.minXP !== undefined) {
    filtered = filtered.filter(user => user.xpTotal >= filters.minXP!);
  }

  if (filters.maxXP !== undefined) {
    filtered = filtered.filter(user => user.xpTotal <= filters.maxXP!);
  }

  return filtered;
}

function sortUsers(users: LeaderboardUser[], category: string, _timeframe: string): LeaderboardUser[] {
  const sorted = [...users];

  switch (category) {
    case 'global_xp':
      sorted.sort((a, b) => b.xpTotal - a.xpTotal);
      break;
    case 'weekly_xp':
      sorted.sort((a, b) => b.xpWeekly - a.xpWeekly);
      break;
    case 'completion_rate':
      sorted.sort((a, b) => b.completionRate - a.completionRate);
      break;
    case 'streak_leaders':
      sorted.sort((a, b) => b.currentStreak - a.currentStreak);
      break;
    case 'top_contributors':
      sorted.sort((a, b) => b.contributionScore - a.contributionScore);
      break;
    default:
      sorted.sort((a, b) => b.xpTotal - a.xpTotal);
  }

  // Update ranks
  sorted.forEach((user, index) => {
    user.rank = index + 1;
  });

  return sorted;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, filters, page = 1, limit = 50 } = body;

    // Apply filters
    let filteredUsers = applyFilters(mockUsers, filters);

    // Sort users based on category
    filteredUsers = sortUsers(filteredUsers, category, filters.timeframe);

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    const response: LeaderboardResponse = {
      users: paginatedUsers,
      total: filteredUsers.length,
      page,
      totalPages: Math.ceil(filteredUsers.length / limit),
      hasNextPage: endIndex < filteredUsers.length,
      hasPreviousPage: page > 1,
      lastUpdated: new Date(),
      category: {
        id: category,
        name: getCategoryName(category),
        description: getCategoryDescription(category),
        icon: getCategoryIcon(category),
        sortBy: 'xpTotal',
        timeframe: filters.timeframe,
        enabled: true
      },
      filters
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching leaderboard', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    global_xp: 'Global XP Leaders',
    weekly_xp: 'Weekly XP Leaders',
    completion_rate: 'Course Completion',
    streak_leaders: 'Streak Leaders',
    top_contributors: 'Top Contributors'
  };
  return names[category] || 'Unknown Category';
}

function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    global_xp: 'Top users by total XP earned',
    weekly_xp: 'Top users by XP earned this week',
    completion_rate: 'Users with highest completion rates',
    streak_leaders: 'Users with longest learning streaks',
    top_contributors: 'Users with highest contribution scores'
  };
  return descriptions[category] || 'Unknown category';
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    global_xp: '🏆',
    weekly_xp: '📅',
    completion_rate: '✅',
    streak_leaders: '🔥',
    top_contributors: '🌟'
  };
  return icons[category] || '📊';
}
