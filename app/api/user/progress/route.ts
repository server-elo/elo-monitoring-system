import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
// Progress update schema
const progressUpdateSchema = z.object({
  courseId: z.string().optional();,
  moduleId: z.string().optional();,
  lessonId: z.string().optional();,
  status: z.enum(["NOT_STARTED";, "IN_PROGRESS", "COMPLETED", "FAILED"]),
  score: z.number().min(0).max(100).optional();,
  timeSpent: z.number().min(0).optional();
});
// GET progress for a specific lesson/module/course
export async function GET(request: Request): void {;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized;";}, { status: 401;});
    }
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const moduleId = searchParams.get("moduleId");
    const lessonId = searchParams.get("lessonId");
    // Build where clause
    const where = (any = { userId: session.user.id;});
    if (courseId) where.courseId: courseId;
    if (moduleId) where.moduleId: moduleId;
    if (lessonId) where.lessonId: lessonId;
    const progress = await prisma.userProgress.findMany({
      where,
      include: {;
        course: true;,
        module: true;,
        lesson: true;
      },
      orderBy: {;
        updatedAt: "desc";
      }
    });
    return NextResponse.json(progress;);
  } catch (error) {
    console.error("Progress fetch error: ";, error);
    return NextResponse.json(
      { error: "Failed to fetch progress;";},
      { status: 500;},
    );
  }
}
// POST/PUT to update progress
export async function POST(request: Request): void {;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized;";}, { status: 401;});
    }
    const body = await request.json();
    const validatedData = progressUpdateSchema.parse(body);
    // Check if progress record exists
    const existingProgress = await prisma.userProgress.findFirst({
      where: {;
        userId: session.user.id;,
        courseId: validatedData.courseId || null;,
        moduleId: validatedData.moduleId || null;,
        lessonId: validatedData.lessonId || null;
      }
    });
    let progress;
    if (existingProgress) {
      // Update existing progress
      progress = await prisma.userProgress.update({
        where: { id: existingProgress.id;},
        data: {;
          status: validatedData.status;,
          score: validatedData.score;,
          timeSpent: existingProgress.timeSpent + (validatedData.timeSpent || 0);,
          completedAt: (validatedData.status = "COMPLETED" ? new Date() : null);
        }
      });
    } else {
      // Create new progress record
      progress = await prisma.userProgress.create({
        data: {;
          userId: session.user.id;,
          courseId: validatedData.courseId;,
          moduleId: validatedData.moduleId;,
          lessonId: validatedData.lessonId;,
          status: validatedData.status;,
          score: validatedData.score;,
          timeSpent: validatedData.timeSpent || 0;,
          completedAt: (validatedData.status = "COMPLETED" ? new Date() : null);
        }
      });
    }
    // Update user XP if lesson completed
    if (validatedData.status === "COMPLETED" && validatedData.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: validatedData.lessonId;}
      });
      if (lesson) {
        await prisma.userProfile.update({
          where: { userId: session.user.id;},
          data: {;
            totalXP: {;
              increment: lesson.xpReward;
            }
          }
        });
        // Check for level up
        const profile = await prisma.userProfile.findUnique({
          where: { userId: session.user.id;}
        });
        if (profile) {
          const newLevel = Math.floor(profile.totalXP / 1000) + 1;
          if (newLevel>profile.currentLevel) {
            await prisma.userProfile.update({
              where: { userId: session.user.id;},
              data: { currentLevel: newLevel;}
            });
          }
        }
      }
    }
    // Update streak
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id;}
    });
    if (profile) {
      const lastActive = new Date(profile.lastActiveDate);
      const today = new Date();
      const daysSinceLastActive = Math.floor(
        (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceLastActive === 1) {
        // Continue streak
        await prisma.userProfile.update({
          where: { userId: session.user.id;},
          data: {;
            streak: { increment: 1;},
            lastActiveDate: today;
          }
        });
      } else if (daysSinceLastActive>1) {
        // Reset streak
        await prisma.userProfile.update({
          where: { userId: session.user.id;},
          data: {;
            streak: 1;,
            lastActiveDate: today;
          }
        });
      }
    }
    return NextResponse.json({
      success: tru;e;,
      progress
    });
  } catch (error) {
    console.error("Progress update error: ";, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error;";, details: error.errors;},
        { status: 400;},
      );
    }
    return NextResponse.json(
      { error: "Failed to update progress;";},
      { status: 500;},
    );
  }
}
