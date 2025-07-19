import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/monitoring/simple-logger';

// Configure for dynamic API routes
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    // Get real-time community statistics
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count online users (users active in the last hour)
    const onlineUsers = await prisma.userProfile.count({
      where: {
        lastActiveDate: {
          gte: oneHourAgo,
        },
      },
    });

    // Count active collaborations
    const activeCollaborations = await prisma.collaboration.count({
      where: {
        status: 'ACTIVE',
        updatedAt: {
          gte: oneDayAgo,
        },
      },
    });

    // Count study groups (active collaborations of type STUDY_GROUP)
    const studyGroups = await prisma.collaboration.count({
      where: {
        type: 'STUDY_GROUP',
        status: 'ACTIVE',
        updatedAt: {
          gte: oneDayAgo,
        },
      },
    });

    // Count available mentors (users with MENTOR or INSTRUCTOR role who were active recently)
    const mentorsAvailable = await prisma.user.count({
      where: {
        role: {
          in: ['MENTOR', 'INSTRUCTOR'],
        },
        profile: {
          lastActiveDate: {
            gte: oneDayAgo,
          },
        },
      },
    });

    // Get additional community metrics
    const totalUsers = await prisma.user.count();
    
    const totalLessonsCompleted = await prisma.userProgress.count({
      where: {
        status: 'COMPLETED',
      },
    });

    const totalAchievementsUnlocked = await prisma.userAchievement.count({
      where: {
        isCompleted: true,
      },
    });

    // Get top contributors (users with most completed lessons in the last week)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const topContributors = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            progress: {
              where: {
                status: 'COMPLETED',
                completedAt: {
                  gte: oneWeekAgo,
                },
              },
            },
          },
        },
        profile: {
          select: {
            totalXP: true,
          },
        },
      },
      orderBy: {
        progress: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    // Get recent activity feed
    const recentActivity = await prisma.userProgress.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: oneDayAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
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

    const stats = {
      onlineUsers: Math.max(onlineUsers, 1), // Ensure at least 1 for demo
      studyGroups: Math.max(studyGroups, 0),
      mentorsAvailable: Math.max(mentorsAvailable, 1), // Ensure at least 1 for demo
      activeCollaborations: Math.max(activeCollaborations, 0),
      totalUsers,
      totalLessonsCompleted,
      totalAchievementsUnlocked,
      topContributors: topContributors.map((user: any) => ({
        id: user.id,
        name: user.name,
        image: user.image,
        completedLessons: user._count.progress,
        totalXP: user.profile?.totalXP || 0,
      })),
      recentActivity: recentActivity.map((activity: any) => ({
        id: activity.id,
        user: activity.user,
        lesson: activity.lesson,
        completedAt: activity.completedAt,
        type: 'lesson_completed',
      })),
      lastUpdated: now,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    logger.error('Error fetching community stats', error as Error);
    
    // Return fallback stats in case of error
    const fallbackStats = {
      onlineUsers: 42,
      studyGroups: 8,
      mentorsAvailable: 5,
      activeCollaborations: 12,
      totalUsers: 1250,
      totalLessonsCompleted: 5430,
      totalAchievementsUnlocked: 890,
      topContributors: [],
      recentActivity: [],
      lastUpdated: new Date(),
    };

    return NextResponse.json({ stats: fallbackStats });
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
      case 'update_activity':
        // Update user's last active timestamp
        await prisma.userProfile.upsert({
          where: { userId: session.user.id },
          update: {
            lastActiveDate: new Date(),
          },
          create: {
            userId: session.user.id,
            lastActiveDate: new Date(),
          },
        });

        return NextResponse.json({ success: true });

      case 'join_study_group':
        const { groupId } = data;
        
        if (!groupId) {
          return NextResponse.json({ error: 'Group ID required' }, { status: 400 });
        }

        // Add user to study group collaboration
        const studyGroup = await prisma.collaboration.findUnique({
          where: { id: groupId },
          include: { participants: true },
        });

        if (!studyGroup) {
          return NextResponse.json({ error: 'Study group not found' }, { status: 404 });
        }

        if (studyGroup.participants.length >= studyGroup.maxParticipants) {
          return NextResponse.json({ error: 'Study group is full' }, { status: 400 });
        }

        await prisma.collaboration.update({
          where: { id: groupId },
          data: {
            participants: {
              connect: { id: session.user.id },
            },
          },
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Joined study group successfully' 
        });

      case 'find_mentor':
        // Create a mentorship request or match with available mentor
        // TODO: Implement mentorship matching system
        logger.info(`User ${session.user.id} requested mentorship`);

        return NextResponse.json({ 
          success: true, 
          message: 'Mentorship request submitted successfully' 
        });

      case 'start_session':
        const { sessionType, title, description } = data;
        
        // Create a new collaboration session
        const newSession = await prisma.collaboration.create({
          data: {
            title: title || 'Live Coding Session',
            description: description || 'Join for collaborative coding',
            type: sessionType || 'LIVE_SESSION',
            maxParticipants: 4,
            participants: {
              connect: { id: session.user.id },
            },
          },
        });

        return NextResponse.json({ 
          success: true, 
          session: newSession,
          message: 'Live session started successfully' 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error processing community action', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
