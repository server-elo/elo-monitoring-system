# Smart PRP: NextAuth.js + RBAC Authentication System

## Meta Information
- **PRP ID**: authentication-nextauth-rbac-004
- **Created**: 2025-01-20T18:00:00Z
- **Complexity Score**: 8/10
- **Estimated Implementation Time**: 14 hours
- **Dependencies**: [foundation-nextjs15-react19-typescript-001, architecture-feature-vertical-slices-002, database-postgresql-prisma-optimization-003]

## 🎯 Feature Specification
### Core Requirement
Implement a production-ready authentication system using NextAuth.js 5.x with comprehensive role-based access control (RBAC), supporting multiple authentication providers, secure session management, and seamless integration with the feature-based learning platform architecture.

### Success Metrics
- [ ] Functional: Support 4 user roles with granular permissions across all features
- [ ] Performance: Authentication flow completes in <500ms with <1s session validation
- [ ] UX: One-click social login with 95%+ success rate and seamless onboarding
- [ ] Security: Zero authentication vulnerabilities with SOC 2 compliance readiness
- [ ] Integration: All features properly enforce authentication and authorization
- [ ] Quality: 100% test coverage for authentication flows and edge cases

## 🔍 Codebase Intelligence
### Pattern Analysis
```markdown
Authentication requirements analysis:
- User Types: Students (primary), Instructors, Admins, Moderators
- Auth Methods: Email/password, OAuth (Google, GitHub, Discord), Magic links
- Sessions: Persistent learning progress, cross-device synchronization
- Permissions: Feature-based granular access control
- Security: MFA support, audit logging, session management
- Integration: Database user model, real-time collaboration, API access
```

### Architecture Alignment
- **Follows Pattern**: Feature-based authentication with bounded contexts
- **Extends Component**: NextAuth.js 5.x with Prisma adapter and custom providers
- **Integration Points**: All feature slices, database user model, API routes, WebSocket sessions

## 🧠 Implementation Strategy
### Approach Rationale
NextAuth.js 5.x + RBAC chosen over alternatives because:
1. **Next.js Integration**: Native support for App Router and Server Components
2. **Provider Ecosystem**: 50+ built-in OAuth providers with custom provider support
3. **Security**: Production-tested with security best practices built-in
4. **Type Safety**: Full TypeScript support with generated types
5. **Flexibility**: Customizable for complex role-based access patterns

### Risk Mitigation
- **High Risk**: Session hijacking and privilege escalation → JWT encryption, RBAC validation, audit logging
- **Medium Risk**: OAuth provider outages → Multiple auth methods, graceful fallbacks
- **Low Risk**: Migration complexity → Staged rollout with feature flags

### Rollback Plan
1. Feature flags to disable new authentication features
2. Maintain existing session compatibility during migration
3. Database migration rollback scripts for user schema changes
4. Emergency admin backdoor with secure access

## 📋 Execution Blueprint

### Phase 1: Core Authentication Setup
- [ ] Install and configure NextAuth.js 5.x with App Router integration
- [ ] Set up Prisma adapter with optimized user/session schema
- [ ] Configure OAuth providers (Google, GitHub, Discord) with proper scopes
- [ ] Implement magic link authentication with email verification
- [ ] Set up JWT encryption and session security configuration

### Phase 2: Role-Based Access Control (RBAC)
- [ ] Design comprehensive permission system with feature-based granularity
- [ ] Implement role hierarchy (Student < Instructor < Moderator < Admin)
- [ ] Create middleware for route protection and permission validation
- [ ] Build admin interface for user role management
- [ ] Set up audit logging for all permission changes

### Phase 3: Advanced Security Features
- [ ] Implement multi-factor authentication (TOTP, WebAuthn)
- [ ] Set up session management with device tracking
- [ ] Configure rate limiting for authentication attempts
- [ ] Implement account lockout and suspicious activity detection
- [ ] Set up security headers and CSRF protection

### Phase 4: Integration & User Experience
- [ ] Create onboarding flow with profile completion
- [ ] Implement social login with automatic account linking
- [ ] Set up password reset and account recovery flows
- [ ] Build user preference synchronization across devices
- [ ] Create authentication components for all features

## 🔬 Validation Matrix
### Automated Tests
```bash
# Authentication Flow Tests
npm run test:auth -- --coverage  # All auth flows with 100% coverage

# Security Tests
npm run test:security  # RBAC, session security, injection prevention

# Integration Tests
npm run test:auth-integration  # Database, OAuth, email delivery

# Performance Tests
npm run test:auth-performance  # Login speed, session validation time

# End-to-End Tests
npm run test:e2e:auth  # Complete user journeys across all features
```

### Manual Verification
- [ ] Social login works for all configured providers
- [ ] Role-based access properly restricts feature access
- [ ] Session persistence maintains state across browser restarts
- [ ] Multi-factor authentication flows work correctly
- [ ] Account recovery and password reset function properly

## 📚 Context References
### Documentation
- https://authjs.dev/getting-started/migrating-to-v5: NextAuth.js 5.x migration guide
- https://next-auth.js.org/adapters/prisma: Prisma adapter configuration
- https://authjs.dev/getting-started/providers: OAuth provider setup
- https://owasp.org/www-project-top-ten/: Security best practices

### Code References
- `/PRPs/database-postgresql-prisma-optimization.md`: User schema and relationships
- `/PRPs/architecture-feature-vertical-slices.md`: Feature-based integration patterns
- `/new-platform/src/features/auth/`: Authentication feature directory

## 🎯 Confidence Score: 8/10
**Reasoning**: High confidence due to:
- Extensive experience with NextAuth.js and RBAC systems
- Well-defined requirements from competitive analysis
- Proven integration patterns with Next.js and Prisma
- Comprehensive testing and security validation strategy
- Clear rollback and migration procedures

## 🔄 Post-Implementation
### Monitoring
- Authentication success/failure rates with alerting
- Session duration and activity patterns
- Failed login attempts and security events
- OAuth provider availability and response times
- Performance metrics for authentication flows

### Future Enhancements
- Biometric authentication (Face ID, Touch ID) for mobile
- Advanced behavioral analytics for fraud detection
- Single Sign-On (SSO) integration for enterprise customers
- Passwordless authentication with WebAuthn
- Integration with identity providers (Active Directory, Okta)

## 🚀 Implementation Steps

### Step 1: NextAuth.js 5.x Configuration
```typescript
// lib/auth/config.ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Discord from "next-auth/providers/discord"
import Nodemailer from "next-auth/providers/nodemailer"
import { prisma } from "@/lib/database/client"
import { UserRole } from "@prisma/client"

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Discord({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),
    Nodemailer({
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: env.EMAIL_SERVER_PORT,
        auth: {
          user: env.EMAIL_SERVER_USER,
          pass: env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Custom sign-in logic with security checks
      return await validateSignIn(user, account, profile);
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = await getUserPermissions(user.id);
      }
      return token;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      await auditLogger.log('user_signin', {
        userId: user.id,
        provider: account?.provider,
        isNewUser,
        timestamp: new Date(),
      });
    },
    async signOut({ token }) {
      await auditLogger.log('user_signout', {
        userId: token?.id,
        timestamp: new Date(),
      });
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

### Step 2: Role-Based Access Control System
```typescript
// lib/auth/rbac.ts
export enum Permission {
  // Learning permissions
  VIEW_COURSES = "courses:view",
  CREATE_COURSES = "courses:create",
  EDIT_COURSES = "courses:edit",
  DELETE_COURSES = "courses:delete",
  
  // User management
  VIEW_USERS = "users:view",
  EDIT_USERS = "users:edit",
  DELETE_USERS = "users:delete",
  MANAGE_ROLES = "users:manage_roles",
  
  // Collaboration permissions
  CREATE_SESSIONS = "collaboration:create",
  JOIN_SESSIONS = "collaboration:join",
  MODERATE_SESSIONS = "collaboration:moderate",
  
  // Admin permissions
  VIEW_ANALYTICS = "analytics:view",
  MANAGE_SYSTEM = "system:manage",
  ACCESS_AUDIT_LOGS = "audit:view",
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.STUDENT]: [
    Permission.VIEW_COURSES,
    Permission.CREATE_SESSIONS,
    Permission.JOIN_SESSIONS,
  ],
  [UserRole.INSTRUCTOR]: [
    Permission.VIEW_COURSES,
    Permission.CREATE_COURSES,
    Permission.EDIT_COURSES,
    Permission.CREATE_SESSIONS,
    Permission.JOIN_SESSIONS,
    Permission.MODERATE_SESSIONS,
    Permission.VIEW_USERS,
  ],
  [UserRole.MODERATOR]: [
    ...ROLE_PERMISSIONS[UserRole.INSTRUCTOR],
    Permission.DELETE_COURSES,
    Permission.EDIT_USERS,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.ADMIN]: [
    ...ROLE_PERMISSIONS[UserRole.MODERATOR],
    Permission.DELETE_USERS,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_SYSTEM,
    Permission.ACCESS_AUDIT_LOGS,
  ],
};

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

export function checkPermissions(userRole: UserRole, requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userRole, permission));
}
```

### Step 3: Middleware for Route Protection
```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Permission } from "@/lib/auth/rbac";

export default withAuth(
  function middleware(req: NextRequest) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/courses"];
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Admin routes protection
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Instructor routes protection
    if (pathname.startsWith("/instructor")) {
      const allowedRoles = ["INSTRUCTOR", "MODERATOR", "ADMIN"];
      if (!allowedRoles.includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // API routes permission checking
    if (pathname.startsWith("/api/")) {
      const requiredPermission = getRequiredPermission(pathname);
      if (requiredPermission && !hasPermission(token?.role, requiredPermission)) {
        return new NextResponse(
          JSON.stringify({ error: "Insufficient permissions" }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/instructor/:path*",
    "/profile/:path*",
    "/api/admin/:path*",
    "/api/instructor/:path*",
    "/api/user/:path*",
  ],
};
```

### Step 4: Authentication Components
```typescript
// src/features/auth/components/AuthProvider.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { createContext, useContext, ReactNode } from "react";
import { User, UserRole } from "@prisma/client";
import { Permission, hasPermission } from "@/lib/auth/rbac";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
  isRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  session: any;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  const user = session?.user ?? null;
  const isAuthenticated = !!user;

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    hasPermission: (permission: Permission) => {
      if (!user?.role) return false;
      return hasPermission(user.role, permission);
    },
    isRole: (role: UserRole) => user?.role === role,
  };

  return (
    <SessionProvider session={session}>
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

### Step 5: Protected Route Component
```typescript
// src/features/auth/components/ProtectedRoute.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { UserRole } from "@prisma/client";
import { Permission, checkPermissions } from "@/lib/auth/rbac";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  fallback?: ReactNode;
}

export async function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions = [],
  fallback = null,
}: ProtectedRouteProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userRole = session.user.role as UserRole;

  // Check role requirement
  if (requiredRole && userRole !== requiredRole) {
    const roleHierarchy = {
      [UserRole.STUDENT]: 0,
      [UserRole.INSTRUCTOR]: 1,
      [UserRole.MODERATOR]: 2,
      [UserRole.ADMIN]: 3,
    };

    if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
      return fallback || <div>Access denied</div>;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = checkPermissions(userRole, requiredPermissions);
    if (!hasRequiredPermissions) {
      return fallback || <div>Insufficient permissions</div>;
    }
  }

  return <>{children}</>;
}
```

### Step 6: Audit Logging System
```typescript
// lib/auth/audit.ts
export interface AuditEvent {
  id: string;
  userId?: string;
  action: string;
  resource?: string;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export class AuditLogger {
  async log(action: string, metadata: Record<string, any> = {}): Promise<void> {
    const event: Omit<AuditEvent, 'id'> = {
      userId: metadata.userId,
      action,
      resource: metadata.resource,
      metadata,
      ipAddress: metadata.ipAddress || 'unknown',
      userAgent: metadata.userAgent || 'unknown',
      timestamp: new Date(),
    };

    await prisma.auditLog.create({
      data: event,
    });

    // Send to external monitoring if configured
    if (env.AUDIT_WEBHOOK_URL) {
      await this.sendToWebhook(event);
    }
  }

  private async sendToWebhook(event: Omit<AuditEvent, 'id'>): Promise<void> {
    try {
      await fetch(env.AUDIT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send audit log to webhook:', error);
    }
  }
}

export const auditLogger = new AuditLogger();
```

This comprehensive Authentication PRP establishes a production-ready authentication system that can securely handle millions of users while providing granular access control and comprehensive audit capabilities for the Solidity learning platform.