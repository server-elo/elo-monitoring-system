import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/monitoring/simple-logger';
import { AchievementWithProgress } from '../types';

// Configure for dynamic API routes
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all achievements with user progress
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
      include: {
        userAchievements: {
          where: { userId: session.user.id },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const achievementsWithProgress = achievements.map((achievement): AchievementWithProgress => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      xpReward: achievement.xpReward,
      badgeUrl: achievement.badgeUrl,
      requirement: achievement.requirement as Record<string, unknown>,
      userProgress: achievement.userAchievements[0] || null,
      isUnlocked: achievement.userAchievements.length > 0,
      isCompleted: achievement.userAchievements[0]?.isCompleted || false,
      unlockedAt: achievement.userAchievements[0]?.unlockedAt || null,
      progress: achievement.userAchievements[0]?.progress || 0,
    }));

    return NextResponse.json({ achievements: achievementsWithProgress });
  } catch (error) {
    logger.error('Error fetching achievements', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { achievementId, action = 'claim' } = await request.json();

    if (!achievementId) {
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 });
    }

    if (action === 'claim') {
      // Check if achievement exists and user has unlocked it
      const userAchievement = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId: session.user.id,
            achievementId,
          },
        },
        include: {
          achievement: true,
        },
      });

      if (!userAchievement) {
        return NextResponse.json({ error: 'Achievement not unlocked' }, { status: 400 });
      }

      if (userAchievement.isCompleted) {
        return NextResponse.json({ error: 'Achievement already claimed' }, { status: 400 });
      }

      // Mark achievement as completed and award XP
      const updatedAchievement = await prisma.userAchievement.update({
        where: {
          userId_achievementId: {
            userId: session.user.id,
            achievementId,
          },
        },
        data: {
          isCompleted: true,
          progress: 100,
        },
      });

      // Award XP to user profile
      await prisma.userProfile.update({
        where: { userId: session.user.id },
        data: {
          totalXP: {
            increment: userAchievement.achievement.xpReward,
          },
        },
      });

      return NextResponse.json({ 
        success: true, 
        achievement: updatedAchievement,
        xpAwarded: userAchievement.achievement.xpReward,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('Error processing achievement', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
