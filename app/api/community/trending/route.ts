import { NextRequest, NextResponse } from 'next/server';
import { TrendingTopic } from '@/lib/community/types';
import { logger } from '@/lib/monitoring/simple-logger';

// Mock trending topics data
const mockTrendingTopics: TrendingTopic[] = [
  {
    id: 'topic_1',
    title: 'Smart Contract Security',
    category: 'Security',
    mentions: 234,
    engagement: 89,
    trend: 'up',
    trendPercentage: 15.6
  },
  {
    id: 'topic_2',
    title: 'DeFi Protocols',
    category: 'DeFi',
    mentions: 189,
    engagement: 76,
    trend: 'up',
    trendPercentage: 8.3
  },
  {
    id: 'topic_3',
    title: 'Gas Optimization',
    category: 'Optimization',
    mentions: 156,
    engagement: 92,
    trend: 'stable',
    trendPercentage: 2.1
  },
  {
    id: 'topic_4',
    title: 'NFT Development',
    category: 'NFTs',
    mentions: 134,
    engagement: 67,
    trend: 'down',
    trendPercentage: -5.2
  },
  {
    id: 'topic_5',
    title: 'Layer 2 Solutions',
    category: 'Scaling',
    mentions: 98,
    engagement: 84,
    trend: 'up',
    trendPercentage: 12.4
  },
  {
    id: 'topic_6',
    title: 'Solidity Best Practices',
    category: 'Development',
    mentions: 87,
    engagement: 91,
    trend: 'up',
    trendPercentage: 6.8
  },
  {
    id: 'topic_7',
    title: 'Web3 Integration',
    category: 'Frontend',
    mentions: 76,
    engagement: 73,
    trend: 'stable',
    trendPercentage: 1.2
  },
  {
    id: 'topic_8',
    title: 'Ethereum 2.0',
    category: 'Blockchain',
    mentions: 65,
    engagement: 88,
    trend: 'down',
    trendPercentage: -3.4
  },
  {
    id: 'topic_9',
    title: 'Testing Frameworks',
    category: 'Testing',
    mentions: 54,
    engagement: 79,
    trend: 'up',
    trendPercentage: 9.1
  },
  {
    id: 'topic_10',
    title: 'Deployment Strategies',
    category: 'DevOps',
    mentions: 43,
    engagement: 82,
    trend: 'stable',
    trendPercentage: 0.8
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const trend = searchParams.get('trend') as 'up' | 'down' | 'stable' | null;

    let filteredTopics = [...mockTrendingTopics];

    // Apply category filter
    if (category) {
      filteredTopics = filteredTopics.filter(topic => 
        topic.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Apply trend filter
    if (trend) {
      filteredTopics = filteredTopics.filter(topic => topic.trend === trend);
    }

    // Sort by engagement and mentions
    filteredTopics.sort((a, b) => {
      const scoreA = a.engagement * 0.6 + a.mentions * 0.4;
      const scoreB = b.engagement * 0.6 + b.mentions * 0.4;
      return scoreB - scoreA;
    });

    // Apply limit
    const limitedTopics = filteredTopics.slice(0, limit);

    // Add some randomness to simulate real-time changes
    const updatedTopics = limitedTopics.map(topic => ({
      ...topic,
      mentions: topic.mentions + Math.floor(Math.random() * 10) - 5,
      engagement: Math.max(0, Math.min(100, topic.engagement + Math.floor(Math.random() * 10) - 5)),
      trendPercentage: topic.trendPercentage + (Math.random() * 2) - 1
    }));

    return NextResponse.json(updatedTopics);
  } catch (error) {
    logger.error('Error fetching trending topics', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch trending topics' },
      { status: 500 }
    );
  }
}
