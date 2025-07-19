import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/api/logger';

// Configure for dynamic API routes
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with progress data
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          include: {
            progress: {
              include: {
                course: true,
                module: true,
                lesson: true,
              },
            },
            achievements: {
              include: {
                achievement: true,
              },
            },
          },
        },
      },
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Calculate progress statistics
    const totalProgress = userProfile.user.progress;
    const completedLessons = totalProgress.filter((p: any) => p.status === 'COMPLETED').length;
    const totalLessons = totalProgress.length;
    const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Get project statistics
    const projectStats = await prisma.projectSubmission.findMany({
      where: { userId: session.user.id },
      select: {
        status: true,
        score: true
      }
    });

    const completedProjects = projectStats.filter(p => p.status === 'APPROVED').length;
    
    // Get challenge statistics (using PersonalizedChallenge model)
    const challengeStats = await prisma.personalizedChallenge.findMany({
      where: { 
        userId: session.user.id,
        isCompleted: true
      },
      select: {
        bestScore: true
      }
    });

    const challengesWon = challengeStats.filter(c => (c.bestScore || 0) >= 70).length;

    // Get course progress
    const courseProgress = await prisma.course.findMany({
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
        progress: {
          where: { userId: session.user.id },
        },
      },
    });

    const progressData = {
      profile: {
        totalXP: userProfile.totalXP,
        currentLevel: userProfile.currentLevel,
        streak: userProfile.streak,
      },
      stats: {
        completionRate,
        completedLessons,
        totalLessons,
        completedProjects,
        challengesWon,
        rank: Math.floor(userProfile.totalXP / 1000) + 1 // Simple ranking system
      },
      achievements: userProfile.user.achievements.map((ua: any) => ({
        id: ua.achievement.id,
        title: ua.achievement.title,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        unlockedAt: ua.unlockedAt,
        isCompleted: ua.isCompleted,
      })),
      courses: courseProgress.map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        difficulty: course.difficulty,
        totalModules: course.modules.length,
        totalLessons: course.modules.reduce((acc: any, module: any) => acc + module.lessons.length, 0),
        completedLessons: course.progress.filter((p: any) => p.status === 'COMPLETED').length,
        progress: course.progress.length > 0
          ? (course.progress.filter((p: any) => p.status === 'COMPLETED').length / course.progress.length) * 100
          : 0,
      })),
    };

    return NextResponse.json(progressData);
  } catch (error) {
    logger.error('Error fetching user progress', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'get-user-progress'
    }, error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, progress, type = 'lesson' } = await _request.json();

    if (!id || progress === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update or create progress record
    const progressRecord = await prisma.userProgress.upsert({
      where: {
        userId_courseId_moduleId_lessonId: {
          userId: session.user.id,
          courseId: type === 'course' ? id : null,
          moduleId: type === 'module' ? id : null,
          lessonId: type === 'lesson' ? id : null,
        },
      },
      update: {
        status: progress >= 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        score: progress,
        completedAt: progress >= 100 ? new Date() : null,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        courseId: type === 'course' ? id : null,
        moduleId: type === 'module' ? id : null,
        lessonId: type === 'lesson' ? id : null,
        status: progress >= 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        score: progress,
        completedAt: progress >= 100 ? new Date() : null,
      },
    });

    // Update streak if lesson completed
    if (progress >= 100 && type === 'lesson') {
      const today = new Date();
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (userProfile) {
        const lastActiveDate = new Date(userProfile.lastActiveDate);
        const daysDiff = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let newStreak = userProfile.streak;
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
      }
    }

    return NextResponse.json({ success: true, progress: progressRecord });
  } catch (error) {
    logger.error('Error updating progress', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'update-user-progress'
    }, error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
