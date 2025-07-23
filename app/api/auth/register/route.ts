import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
// Registration schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number and special character",
    ),
  username: z.string().min(3).max(20).optional(),
});
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    // Validate input
    const validatedData = registerSchema.parse(body);
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 },
      );
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    // Create user with profile
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        role: UserRole.STUDENT,
        profile: {
          create: {
            bio: "",
            totalXP: 0,
            currentLevel: 1,
            streak: 0,
          },
        },
      },
      include: {
        profile: true,
      },
    });
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 },
    );
  }
}
