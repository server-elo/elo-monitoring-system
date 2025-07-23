import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Get user data with profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Get user progress
    const totalLessons = await prisma.lesson.count();
    const completedLessons = await prisma.userProgress.count({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        lessonId: { not: null },
      },
    });
    // Get current course (most recent in-progress course)
    const currentProgress = await prisma.userProgress.findFirst({
      where: {
        userId: session.user.id,
        status: "IN_PROGRESS",
        courseId: { not: null },
      },
      include: {
        course: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    // Get recent lessons
    const recentLessons = await prisma.userProgress.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        lessonId: { not: null },
      },
      include: {
        lesson: true,
      },
      orderBy: {
        completedAt: "desc",
      },
      take: 5,
    });
    // Get recent achievements
    const recentAchievements = await prisma.userAchievement.findMany({
      where: {
        userId: session.user.id,
        isCompleted: true,
      },
      include: {
        achievement: true,
      },
      orderBy: {
        unlockedAt: "desc",
      },
      take: 3,
    });
    const totalAchievements = await prisma.userAchievement.count({
      where: {
        userId: session.user.id,
        isCompleted: true,
      },
    });
    // Get stats
    const projectsCompleted = await prisma.projectSubmission.count({
      where: {
        userId: session.user.id,
        status: "APPROVED",
      },
    });
    const certificatesEarned = await prisma.blockchainCertificate.count({
      where: {
        userId: session.user.id,
        isRevoked: false,
      },
    });
    const submissions = await prisma.codeSubmission.findMany({
      where: {
        userId: session.user.id,
        score: { not: null },
      },
      select: { score: true },
    });
    const averageScore =
      submissions.length > 0
        ? Math.round(
            submissions.reduce((acc, sub) => acc + (sub.score || 0), 0) /
              submissions.length,
          )
        : 0;
    const timeSpent = await prisma.userProgress.aggregate({
      where: { userId: session.user.id },
      _sum: { timeSpent: true },
    });
    // Get leaderboard position
    const allUsers = await prisma.userProfile.findMany({
      select: {
        userId: true,
        totalXP: true,
      },
      orderBy: {
        totalXP: "desc",
      },
    });
    const userRank =
      allUsers.findIndex((u: unknown) => (u.userId = session.user.id)) + 1;
    // Get top users for leaderboard
    const topUsers = await prisma.user.findMany({
      include: {
        profile: true,
      },
      orderBy: {
        profile: {
          totalXP: "desc",
        },
      },
      take: 5,
    });
    // Calculate current course progress
    let currentCourse: null;
    if (currentProgress?.course) {
      const courseProgress = await prisma.userProgress.findMany({
        where: {
          userId: session.user.id,
          courseId: currentProgress.courseId,
          lessonId: { not: null },
        },
      });
      const courseLessons = await prisma.lesson.count({
        where: {
          module: {
            courseId: currentProgress.courseId,
          },
        },
      });
      const completedCourseLessons = courseProgress.filter(
        (p: unknown) => (p.status = "COMPLETED"),
      ).length;
      const progress =
        courseLessons > 0
          ? Math.round((completedCourseLessons / courseLessons) * 100)
          : 0;
      currentCourse = {
        id: currentProgress.course.id,
        title: currentProgress.course.title,
        progress,
      };
    }
    const dashboardData = {
      user: {
        name: user.name || "Learner",
        level: user.profile?.currentLevel || 1,
        totalXP: user.profile?.totalXP || 0,
        streak: user.profile?.streak || 0,
        skillLevel: user.profile?.skillLevel || "BEGINNER",
      },
      progress: {
        completedLessons,
        totalLessons,
        currentCourse,
        recentLessons: recentLessons.map((p: unknown) => ({
          id: p.lesson!.id,
          title: p.lesson!.title,
          completedAt: p.completedAt!.toISOString(),
          score: p.score || 0,
        })),
      },
      achievements: {
        recent: recentAchievements.map((a: unknown) => ({
          id: a.achievement.id,
          title: a.achievement.title,
          description: a.achievement.description,
          icon: a.achievement.icon,
          unlockedAt: a.unlockedAt.toISOString(),
        })),
        total: totalAchievements,
      },
      stats: {
        timeSpent: timeSpent._sum.timeSpent || 0,
        averageScore,
        projectsCompleted,
        certificatesEarned,
      },
      leaderboard: {
        userRank,
        topUsers: topUsers.map((u: unknown) => ({
          id: u.id,
          name: u.name || "Anonymous",
          level: u.profile?.currentLevel || 1,
          totalXP: u.profile?.totalXP || 0,
        })),
      },
    };
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
