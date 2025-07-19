import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { PasswordUtils, loginSchema } from '@/lib/auth/password';

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
          role: UserRole.STUDENT,
        };
      },
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
          role: UserRole.STUDENT,
        };
      },
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Validate input
          const validationResult = loginSchema.safeParse({
            email: credentials.email,
            password: credentials.password,
          });

          if (!validationResult.success) {
            return null;
          }

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
            include: {
              profile: true,
            },
          });

          if (!user || !user.password) {
            return null;
          }

          // Verify password
          const isValidPassword = await PasswordUtils.verifyPassword(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error('Credentials auth error:', error);
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: 'metamask',
      name: 'MetaMask',
      credentials: {
        message: { label: 'Message', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
        address: { label: 'Address', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.message || !credentials?.signature || !credentials?.address) {
            return null;
          }

          // Verify the signature (implement your verification logic)
          const isValid = await verifySignature(
            credentials.message,
            credentials.signature,
            credentials.address
          );

          if (!isValid) {
            return null;
          }

          // Find or create user
          let user = await prisma.user.findUnique({
            where: { email: credentials.address },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: credentials.address,
                name: `User ${credentials.address.slice(0, 6)}...${credentials.address.slice(-4)}`,
                role: UserRole.STUDENT,
              },
            });

            // Create user profile
            await prisma.userProfile.create({
              data: {
                userId: user.id,
              },
            });
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error('MetaMask auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github' || account?.provider === 'google') {
        try {
          // Create user profile if it doesn't exist
          const existingProfile = await prisma.userProfile.findUnique({
            where: { userId: user.id },
          });

          if (!existingProfile) {
            await prisma.userProfile.create({
              data: {
                userId: user.id,
                githubUsername: account.provider === 'github' ? (profile as any)?.login : undefined,
              },
            });
          }
        } catch (error) {
          console.error('Error creating user profile:', error);
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        // Send welcome email or perform other onboarding tasks
        console.log(`New user signed up: ${user.email}`);
      }
    },
  },
};

async function verifySignature(message: string, signature: string, address: string): Promise<boolean> {
  try {
    // Implement signature verification using ethers.js
    const { ethers } = await import('ethers');
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
