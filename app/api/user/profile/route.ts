import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/monitoring/simple-logger';

// Configure for dynamic API routes
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with profile and achievements
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        achievements: {
          include: {
            achievement: true,
          },
          where: {
            isCompleted: true,
          },
        },
        progress: {
          include: {
            course: true,
            module: true,
            lesson: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate level based on XP
    const totalXP = user.profile?.totalXP || 0;
    let currentLevel = 1;
    let skillLevel = 'BEGINNER';
    
    if (totalXP >= 10000) {
      currentLevel = Math.floor(totalXP / 2000) + 1;
      skillLevel = 'EXPERT';
    } else if (totalXP >= 5000) {
      currentLevel = Math.floor((totalXP - 5000) / 1000) + 6;
      skillLevel = 'ADVANCED';
    } else if (totalXP >= 1000) {
      currentLevel = Math.floor((totalXP - 1000) / 800) + 2;
      skillLevel = 'INTERMEDIATE';
    }

    // Update profile with calculated level if it has changed
    if (user.profile && (user.profile.currentLevel !== currentLevel || user.profile.skillLevel !== skillLevel)) {
      await prisma.userProfile.update({
        where: { userId: session.user.id },
        data: {
          currentLevel,
          skillLevel: skillLevel as any,
        },
      });
    }

    const profileData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
      profile: user.profile ? {
        ...user.profile,
        currentLevel,
        skillLevel,
      } : null,
      achievements: user.achievements,
      progress: user.progress,
      stats: {
        totalLessons: user.progress.length,
        completedLessons: user.progress.filter((p: any) => p.status === 'COMPLETED').length,
        totalXP: totalXP,
        currentLevel,
        streak: user.profile?.streak || 0,
      },
    };

    return NextResponse.json(profileData);
  } catch (error) {
    logger.error('Error fetching user profile', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    // Get or create user profile
    let userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    // Update profile
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: session.user.id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile 
    });
  } catch (error) {
    logger.error('Error updating user profile', error as Error);
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
      case 'updateXP':
        const { xpGained } = data;
        
        // Update user XP
        const updatedProfile = await prisma.userProfile.upsert({
          where: { userId: session.user.id },
          update: {
            totalXP: {
              increment: xpGained,
            },
            lastActiveDate: new Date(),
          },
          create: {
            userId: session.user.id,
            totalXP: xpGained,
            lastActiveDate: new Date(),
          },
        });

        // Check for level up
        const newLevel = Math.floor(updatedProfile.totalXP / 1000) + 1;
        if (newLevel > updatedProfile.currentLevel) {
          await prisma.userProfile.update({
            where: { userId: session.user.id },
            data: { currentLevel: newLevel },
          });
        }

        return NextResponse.json({ 
          success: true, 
          newXP: updatedProfile.totalXP,
          levelUp: newLevel > updatedProfile.currentLevel,
          newLevel: Math.max(newLevel, updatedProfile.currentLevel),
        });

      case 'updateStreak':
        const today = new Date();
        const profile = await prisma.userProfile.findUnique({
          where: { userId: session.user.id },
        });

        if (profile) {
          const lastActiveDate = new Date(profile.lastActiveDate);
          const daysDiff = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
          
          let newStreak = profile.streak;
          if (daysDiff === 1) {
            newStreak += 1;
          } else if (daysDiff > 1) {
            newStreak = 1;
          }

          await prisma.userProfile.update({
            where: { userId: session.user.id },
            data: {
              streak: newStreak,
              lastActiveDate: today,
            },
          });

          return NextResponse.json({ 
            success: true, 
            streak: newStreak 
          });
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Action not processed' }, { status: 400 });
  } catch (error) {
    logger.error('Error processing profile action', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
