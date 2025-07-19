import { NextRequest, NextResponse } from 'next/server';
import { CommunityMilestone } from '@/lib/community/types';
import { logger } from '@/lib/monitoring/simple-logger';

// Mock community milestones data
const mockMilestones: CommunityMilestone[] = [
  {
    id: 'milestone_1',
    title: '1000+ Active Users',
    description: 'Community reached 1000 active users this month',
    icon: '👥',
    achievedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    value: 1000,
    type: 'users'
  },
  {
    id: 'milestone_2',
    title: '20K Lessons Completed',
    description: 'Community completed 20,000 lessons total',
    icon: '📚',
    achievedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    value: 20000,
    type: 'lessons'
  },
  {
    id: 'milestone_3',
    title: '500K Total XP',
    description: 'Community earned 500,000 total XP points',
    icon: '⭐',
    achievedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    value: 500000,
    type: 'xp'
  },
  {
    id: 'milestone_4',
    title: '100 Achievements Unlocked',
    description: 'Community unlocked 100 different achievements',
    icon: '🏆',
    achievedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    value: 100,
    type: 'achievements'
  },
  {
    id: 'milestone_5',
    title: '50 Study Groups Created',
    description: 'Community formed 50 active study groups',
    icon: '👨‍👩‍👧‍👦',
    achievedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    value: 50,
    type: 'community'
  },
  {
    id: 'milestone_6',
    title: '10K Forum Posts',
    description: 'Community created 10,000 forum posts and discussions',
    icon: '💬',
    achievedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
    value: 10000,
    type: 'community'
  },
  {
    id: 'milestone_7',
    title: '1M Total Minutes Learned',
    description: 'Community spent 1 million minutes learning',
    icon: '⏰',
    achievedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), // 4 weeks ago
    value: 1000000,
    type: 'lessons'
  },
  {
    id: 'milestone_8',
    title: '500 Smart Contracts Deployed',
    description: 'Community deployed 500 smart contracts to testnet',
    icon: '📜',
    achievedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 5 weeks ago
    value: 500,
    type: 'achievements'
  },
  {
    id: 'milestone_9',
    title: '100 Course Completions',
    description: 'Community achieved 100 full course completions',
    icon: '🎓',
    achievedAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000), // 6 weeks ago
    value: 100,
    type: 'lessons'
  },
  {
    id: 'milestone_10',
    title: '1K Community Contributions',
    description: 'Community made 1,000 helpful contributions',
    icon: '🤝',
    achievedAt: new Date(Date.now() - 49 * 24 * 60 * 60 * 1000), // 7 weeks ago
    value: 1000,
    type: 'community'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const type = searchParams.get('type') as 'users' | 'lessons' | 'xp' | 'achievements' | 'community' | null;
    const since = searchParams.get('since'); // ISO date string

    let filteredMilestones = [...mockMilestones];

    // Apply type filter
    if (type) {
      filteredMilestones = filteredMilestones.filter(milestone => milestone.type === type);
    }

    // Apply date filter
    if (since) {
      const sinceDate = new Date(since);
      filteredMilestones = filteredMilestones.filter(milestone => 
        milestone.achievedAt >= sinceDate
      );
    }

    // Sort by achievement date (most recent first)
    filteredMilestones.sort((a, b) => b.achievedAt.getTime() - a.achievedAt.getTime());

    // Apply limit
    const limitedMilestones = filteredMilestones.slice(0, limit);

    return NextResponse.json(limitedMilestones);
  } catch (error) {
    logger.error('Error fetching community milestones', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch community milestones' },
      { status: 500 }
    );
  }
}
