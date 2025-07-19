import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/monitoring/simple-logger';
import { ActivityItem } from '@/lib/api/types';

// Configure for dynamic API routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get user's recent activity from various sources
    const activities: ActivityItem[] = [];

    // Recent lesson completions
    const recentLessons = await prisma.userProgress.findMany({
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
      },
      include: {
        lesson: {
          select: {
            title: true,
            module: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 10,
    });

    recentLessons.forEach((progress: any) => {
      if (progress.completedAt) {
        activities.push({
          id: `lesson-${progress.id}`,
          type: 'lesson',
          description: `Completed "${progress.lesson.title}"`,
          timestamp: progress.completedAt,
          metadata: {
            lessonId: progress.lessonId,
            moduleTitle: progress.lesson.module?.title,
          },
        });
      }
    });

    // Recent achievements
    const recentAchievements = await prisma.userAchievement.findMany({
      where: {
        userId: session.user.id,
        isCompleted: true,
      },
      include: {
        achievement: {
          select: {
            title: true,
            description: true,
            xpReward: true,
          },
        },
      },
      orderBy: {
        unlockedAt: 'desc',
      },
      take: 5,
    });

    recentAchievements.forEach((userAchievement: any) => {
      if (userAchievement.unlockedAt) {
        activities.push({
          id: `achievement-${userAchievement.id}`,
          type: 'achievement',
          description: `Earned "${userAchievement.achievement.title}" achievement`,
          timestamp: userAchievement.unlockedAt,
          metadata: {
            achievementId: userAchievement.achievementId,
            xpReward: userAchievement.achievement.xpReward,
          },
        });
      }
    });

    // Recent collaboration participations
    const recentCollaborations = await prisma.collaboration.findMany({
      where: {
        participants: {
          some: {
            id: session.user.id,
          },
        },
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    recentCollaborations.forEach((collaboration: any) => {
      activities.push({
        id: `collaboration-${collaboration.id}`,
        type: 'social',
        description: `Joined collaboration "${collaboration.title}"`,
        timestamp: collaboration.updatedAt,
        metadata: {
          collaborationId: collaboration.id,
          collaborationType: collaboration.type,
        },
      });
    });

    // Sort all activities by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, limit);

    return NextResponse.json({ activities: sortedActivities });
  } catch (error) {
    logger.error('Error fetching activity feed', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await request.json();

    switch (action) {
      case 'mark_activity_read':
        const { activityId } = data;
        
        // TODO: Implement activity read tracking
        logger.info(`User ${session.user.id} marked activity ${activityId} as read`);

        return NextResponse.json({ 
          success: true, 
          message: 'Activity marked as read' 
        });

      case 'hide_activity':
        const { hideActivityId } = data;
        
        // TODO: Implement activity hiding
        logger.info(`User ${session.user.id} hid activity ${hideActivityId}`);

        return NextResponse.json({ 
          success: true, 
          message: 'Activity hidden successfully' 
        });

      case 'share_activity':
        const { shareActivityId, platform } = data;
        
        // TODO: Implement activity sharing
        logger.info(`User ${session.user.id} shared activity ${shareActivityId} on ${platform}`);

        return NextResponse.json({ 
          success: true, 
          message: 'Activity shared successfully' 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error processing activity feed action', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
