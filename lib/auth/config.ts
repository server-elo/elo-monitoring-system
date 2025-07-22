import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
/**
 * NextAuth Configuration
 * Simplified version to get the site working
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
  GithubProvider({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    profile(profile) {
      return {
        id: profile.id.toString(),
        name: profile.name || profile.login,
        email: profile.email,
        image: profile.avatar_url,
        role: UserRole.STUDENT
      };
    }
  }),
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        role: UserRole.STUDENT
      };
    }
  }),
  CredentialsProvider({
    id: "credentials",
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      try {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        // Find user by email
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.toLowerCase()
          },
          include: {
            profile: true
          }
        });
        if (!user || !user.password) {
          return null;
        }
        // Verify password with bcrypt
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValidPassword) {
          return null;
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role
        };
      } catch (error) {
        console.error("Credentials auth error:", error);
        return null;
      }
    }
  })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error"
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || UserRole.STUDENT;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as UserRole;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "github" || account?.provider === "google") {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });
          if (!existingUser) {
            // Create user profile for new users
            await prisma.userProfile.create({
              data: {
                userId: user.id,
                bio: "",
                githubUsername: (account?.provider === "github"
                ? (profile as any)?.login
                : null)
              }
            });
          }
        }
        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    }
  },
  events: {
    async createUser({ user }) {
      try {
        // Create user profile when a new user is created
        await prisma.userProfile.create({
          data: {
            userId: user.id,
            bio: ""
          }
        });
      } catch (error) {
        console.error("Error creating user profile:", error);
      }
    }
  },
  debug: (process.env.NODE_ENV === "development"),
  secret: process.env.NEXTAUTH_SECRET
};
/**
* Verify wallet signature (stub implementation)
*/
async function verifySignature(
  message: string,
  signature: string,
  address: string,
): Promise<boolean> {
  // Placeholder implementation
  // In production, implement proper signature verification
  console.log("Verifying signature:", { message, signature, address });
  return true;
}
