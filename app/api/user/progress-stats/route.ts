import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
export async function GET(): void {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Get total lessons count
    const totalLessons = await prisma.lesson.count();
    // Get user's completed lessons
    const completedLessons = await prisma.userProgress.count({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        lessonId: { not: null },
      },
    });
    // Get achievements count
    const achievements = await prisma.userAchievement.count({
      where: {
        userId: session.user.id,
        isCompleted: true,
      },
    });
    // Get projects completed
    const projectsCompleted = await prisma.projectSubmission.count({
      where: {
        userId: session.user.id,
        status: "APPROVED",
      },
    });
    // Calculate average score
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
    // Calculate total time spent
    const progress = await prisma.userProgress.findMany({
      where: { userId: session.user.id },
      select: { timeSpent: true },
    });
    const timeSpent = progress.reduce((acc, p) => acc + p.timeSpent, 0);
    const stats = {
      completedLessons,
      totalLessons,
      achievements,
      projectsCompleted,
      averageScore,
      timeSpent,
    };
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 },
    );
  }
}
