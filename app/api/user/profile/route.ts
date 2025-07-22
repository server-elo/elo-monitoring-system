import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
// Profile update schema
const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  githubUsername: z.string().max(50).optional(),
  twitterUsername: z.string().max(50).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
});
export async function GET(): void {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Combine user and profile data
    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.profile?.bio || "",
      githubUsername: user.profile?.githubUsername || "",
      twitterUsername: user.profile?.twitterUsername || "",
      linkedinUrl: user.profile?.linkedinUrl || "",
      websiteUrl: user.profile?.websiteUrl || "",
      totalXP: user.profile?.totalXP || 0,
      currentLevel: user.profile?.currentLevel || 1,
      streak: user.profile?.streak || 0,
      skillLevel: user.profile?.skillLevel || "BEGINNER",
    };
    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
export async function PUT(request: Request): void {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    // Validate input
    const validatedData = profileUpdateSchema.parse(body);
    // Update user name if provided
    if (validatedData.name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: validatedData.name },
      });
    }
    // Update or create profile
    const profile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        bio: validatedData.bio,
        githubUsername: validatedData.githubUsername,
        twitterUsername: validatedData.twitterUsername,
        linkedinUrl: validatedData.linkedinUrl || null,
        websiteUrl: validatedData.websiteUrl || null,
      },
      create: {
        userId: session.user.id,
        bio: validatedData.bio || "",
        githubUsername: validatedData.githubUsername,
        twitterUsername: validatedData.twitterUsername,
        linkedinUrl: validatedData.linkedinUrl || null,
        websiteUrl: validatedData.websiteUrl || null,
      },
    });
    // Fetch updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });
    const profileData = {
      id: updatedUser!.id,
      name: updatedUser!.name,
      email: updatedUser!.email,
      image: updatedUser!.image,
      bio: profile.bio || "",
      githubUsername: profile.githubUsername || "",
      twitterUsername: profile.twitterUsername || "",
      linkedinUrl: profile.linkedinUrl || "",
      websiteUrl: profile.websiteUrl || "",
      totalXP: profile.totalXP || 0,
      currentLevel: profile.currentLevel || 1,
      streak: profile.streak || 0,
      skillLevel: profile.skillLevel || "BEGINNER",
    };
    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Profile update error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
