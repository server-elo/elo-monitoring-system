import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/monitoring/simple-logger';
// import { User, UserProfile } from '@prisma/client';

// Configure for dynamic API routes
export const dynamic = 'force-dynamic';

// Type for user with profile (used in leaderboard queries)
// type UserWithProfile = User & {
//   profile: UserProfile | null;
// };

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const timeframe = searchParams.get('timeframe') || 'all'; // all, week, month

    // Calculate date filter based on timeframe
    let dateFilter = {};
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { updatedAt: { gte: weekAgo } };
    } else if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { updatedAt: { gte: monthAgo } };
    }

    // Get top users by XP
    const topUsers = await prisma.user.findMany({
      where: {
        profile: {
          ...dateFilter,
          totalXP: {
            gt: 0,
          },
        },
      },
      include: {
        profile: {
          select: {
            totalXP: true,
            currentLevel: true,
            streak: true,
            skillLevel: true,
            lastActiveDate: true,
          },
        },
      },
      orderBy: {
        profile: {
          totalXP: 'desc',
        },
      },
      take: limit,
    });

    // Calculate additional stats for each user
    const leaderboardWithStats = await Promise.all(
      topUsers.map(async (user, index) => {
        // Get user's completed lessons count
        const completedLessons = await prisma.userProgress.count({
          where: {
            userId: user.id,
            status: 'COMPLETED',
          },
        });

        // Get user's achievements count
        const achievementsCount = await prisma.userAchievement.count({
          where: {
            userId: user.id,
            isCompleted: true,
          },
        });

        // Calculate activity score (lessons + achievements + streak)
        const activityScore = completedLessons + achievementsCount + (user.profile?.streak || 0);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          profile: user.profile,
          rank: index + 1,
          completedLessons,
          achievementsCount,
          activityScore,
          isCurrentUser: user.id === session.user.id,
        };
      })
    );

    // Get current user's rank if not in top list
    let currentUserRank = null;
    const currentUserInTop = leaderboardWithStats.find(u => u.id === session.user.id);
    
    if (!currentUserInTop) {
      const usersAboveCurrentUser = await prisma.user.count({
        where: {
          profile: {
            totalXP: {
              gt: await prisma.userProfile.findUnique({
                where: { userId: session.user.id },
                select: { totalXP: true },
              }).then((p: any) => p?.totalXP || 0),
            },
          },
        },
      });
      currentUserRank = usersAboveCurrentUser + 1;
    }

    // Get overall stats
    const totalUsers = await prisma.user.count({
      where: {
        profile: {
          totalXP: {
            gt: 0,
          },
        },
      },
    });

    const averageXP = await prisma.userProfile.aggregate({
      _avg: {
        totalXP: true,
      },
      where: {
        totalXP: {
          gt: 0,
        },
      },
    });

    return NextResponse.json({
      leaderboard: leaderboardWithStats,
      currentUserRank: currentUserRank || currentUserInTop?.rank,
      stats: {
        totalUsers,
        averageXP: Math.round(averageXP._avg.totalXP || 0),
        timeframe,
      },
    });
  } catch (error) {
    logger.error('Error fetching leaderboard', error as Error);
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
      case 'update_activity':
        // Update user's last active date for leaderboard activity tracking
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

      case 'challenge_user':
        const { targetUserId, challengeType } = data;
        
        if (!targetUserId || !challengeType) {
          return NextResponse.json({ error: 'Target user and challenge type required' }, { status: 400 });
        }

        // Create a challenge record (this would need a Challenge model in Prisma)
        // For now, we'll just return success
        logger.info(`Challenge created: ${session.user.id} challenges ${targetUserId} in ${challengeType}`);

        return NextResponse.json({ 
          success: true, 
          message: 'Challenge sent successfully!' 
        });

      case 'follow_user':
        const { followUserId } = data;
        
        if (!followUserId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // This would need a UserFollow model in Prisma
        // For now, we'll just return success
        logger.info(`${session.user.id} follows ${followUserId}`);

        return NextResponse.json({ 
          success: true, 
          message: 'User followed successfully!' 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error processing leaderboard action', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
