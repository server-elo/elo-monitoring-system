import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/monitoring/simple-logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid XP amount' }, { status: 400 });
    }

    // Get current user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Calculate new XP and level
    const newTotalXP = userProfile.totalXP + amount;
    const newLevel = Math.floor(newTotalXP / 1000) + 1;
    const leveledUp = newLevel > userProfile.currentLevel;

    // Update user profile
    await prisma.userProfile.update({
      where: { userId: session.user.id },
      data: {
        totalXP: newTotalXP,
        currentLevel: newLevel,
        updatedAt: new Date(),
      },
    });

    // Check for level-based achievements
    if (leveledUp) {
      const levelAchievements = [
        { level: 5, achievementId: 'level-5' },
        { level: 10, achievementId: 'level-10' },
        { level: 25, achievementId: 'level-25' },
        { level: 50, achievementId: 'level-50' },
        { level: 100, achievementId: 'level-100' },
      ];

      for (const { level, achievementId } of levelAchievements) {
        if (newLevel >= level) {
          // Check if achievement exists and user doesn't have it
          const achievement = await prisma.achievement.findFirst({
            where: { id: achievementId },
          });

          if (achievement) {
            const existingUserAchievement = await prisma.userAchievement.findUnique({
              where: {
                userId_achievementId: {
                  userId: session.user.id,
                  achievementId: achievement.id,
                },
              },
            });

            if (!existingUserAchievement) {
              await prisma.userAchievement.create({
                data: {
                  userId: session.user.id,
                  achievementId: achievement.id,
                  isCompleted: true,
                  progress: 100,
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalXP: newTotalXP,
      currentLevel: newLevel,
      leveledUp,
      xpGained: amount,
    });
  } catch (error) {
    logger.error('Error updating XP', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
