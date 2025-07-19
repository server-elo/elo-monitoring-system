'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Lock, ArrowRight, User, Crown } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { SessionManager } from '@/lib/auth/sessionManager';
import { AuthErrorBoundary } from '@/components/errors/SpecializedErrorBoundaries';
;
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { ErrorFactory } from '@/lib/errors/types';
import { useError } from '@/lib/errors/ErrorContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AuthModal } from './AuthModal';
import { cn } from '@/lib/utils';

export type UserRole = 'STUDENT' | 'MENTOR' | 'INSTRUCTOR' | 'ADMIN';

export interface RoutePermission {
  roles?: UserRole[];
  permissions?: string[];
  requireAuth?: boolean;
  allowGuest?: boolean;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  permission: RoutePermission;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showError?: boolean;
  className?: string;
  // Legacy props for backward compatibility
  requireAuth?: boolean;
  requiredRole?: UserRole;
  showLoginPrompt?: boolean;
}

// Route configuration for different protected areas
export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  '/admin': {
    roles: ['ADMIN'],
    permissions: ['admin:access'],
    requireAuth: true
  },
  '/profile': {
    requireAuth: true
  },
  '/settings': {
    requireAuth: true
  },
  '/instructor': {
    roles: ['INSTRUCTOR', 'ADMIN'],
    permissions: ['instructor:access'],
    requireAuth: true
  },
  '/mentor': {
    roles: ['MENTOR', 'INSTRUCTOR', 'ADMIN'],
    permissions: ['mentor:access'],
    requireAuth: true
  },
  '/dashboard': {
    requireAuth: true
  },
  '/courses/create': {
    roles: ['INSTRUCTOR', 'ADMIN'],
    permissions: ['write:courses'],
    requireAuth: true
  },
  '/courses/manage': {
    roles: ['INSTRUCTOR', 'ADMIN'],
    permissions: ['write:courses', 'read:analytics'],
    requireAuth: true
  }
};

export function ProtectedRoute({
  children,
  permission,
  fallback,
  redirectTo,
  showError = true,
  className,
  // Legacy props for backward compatibility
  requireAuth,
  requiredRole,
  showLoginPrompt = true
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [sessionManager] = useState(() => SessionManager.getInstance());
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [_authError, setAuthError] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showAuthError } = useError();

  // Convert legacy props to new permission format
  const finalPermission: RoutePermission = permission || {
    requireAuth: requireAuth ?? true,
    roles: requiredRole ? [requiredRole] : undefined
  };

  // Check session validity on mount
  useEffect(() => {
    const checkSession = async () => {
      setIsCheckingSession(true);

      try {
        // Load session from storage if available
        const hasStoredSession = sessionManager.loadFromStorage();

        if (hasStoredSession && !sessionManager.isSessionValid()) {
          // Session expired
          const authError = ErrorFactory.createAuthError({
            message: 'Session expired',
            authType: 'refresh',
            userMessage: 'Your session has expired. Please log in again to continue.'
          });
          setAuthError(authError);
          showAuthError('refresh', authError.userMessage);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [sessionManager, showAuthError]);

  // Show loading state
  if (isLoading || isCheckingSession) {
    return (
      <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-300">Checking permissions...</span>
      </div>
    );
  }

  // NOTE: Permission checking is done inline below
  // Keeping this for reference of the permission logic
  /*
  const _hasRequiredPermissions = (): boolean => {
    if (!user) return false;

    // Check roles
    if (finalPermission.roles && finalPermission.roles.length > 0) {
      if (!finalPermission.roles.includes(user.role)) {
        return false;
      }
    }

    // Check specific permissions
    if (finalPermission.permissions && finalPermission.permissions.length > 0) {
      const hasAllPermissions = finalPermission.permissions.every(perm =>
        checkPermission(perm)
      );
      if (!hasAllPermissions) {
        return false;
      }
    }

    return true;
  };
  */

  // Handle redirect logic
  const handleRedirect = (reason: 'unauthenticated' | 'unauthorized') => {
    const returnUrl = encodeURIComponent(`${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);

    if (reason === 'unauthenticated') {
      const redirectUrl = redirectTo || `/auth?returnUrl=${returnUrl}`;
      router.push(redirectUrl);
    } else {
      // For unauthorized access, stay on page but show error
      const authError = ErrorFactory.createAuthError({
        message: 'Insufficient permissions',
        authType: 'permission',
        requiredRole: finalPermission.roles?.[0] || 'AUTHENTICATED',
        userMessage: `You need ${finalPermission.roles?.join(' or ')} privileges to access this page.`
      });
      setAuthError(authError);
      showAuthError('permission', authError.userMessage);
    }
  };

  // Check authentication requirement
  if (finalPermission.requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError && showLoginPrompt) {
      return (
        <AuthErrorBoundary>
          <UnauthenticatedError
            onLogin={() => {
              if (redirectTo) {
                handleRedirect('unauthenticated');
              } else {
                setShowAuthModal(true);
              }
            }}
            className={className}
          />
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        </AuthErrorBoundary>
      );
    }

    if (redirectTo) {
      handleRedirect('unauthenticated');
    }
    return null;
  }

  // Check role permissions
  if (requiredRole && user) {
    const userRole = (user as any).role;
    
    // Role hierarchy: ADMIN > INSTRUCTOR > MENTOR > STUDENT
    const roleHierarchy = {
      STUDENT: 0,
      MENTOR: 1,
      INSTRUCTOR: 2,
      ADMIN: 3,
    };

    const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] ?? 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full"
          >
            <GlassCard className="p-8 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Access Denied
              </h2>
              
              <p className="text-gray-400 mb-4">
                You don't have permission to access this page.
              </p>
              
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Your Role:</span>
                  <RoleBadge role={userRole} />
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Required:</span>
                  <RoleBadge role={requiredRole} />
                </div>
              </div>
              
              <button
                onClick={() => window.history.back()}
                className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Go Back
              </button>
            </GlassCard>
          </motion.div>
        </div>
      );
    }
  }

  // Authenticated and authorized
  return <>{children}</>;
};

// Role Badge Component
interface RoleBadgeProps {
  role: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const roleConfig = {
    STUDENT: { color: 'bg-blue-500/20 text-blue-300', icon: User },
    MENTOR: { color: 'bg-cyan-500/20 text-cyan-300', icon: User },
    INSTRUCTOR: { color: 'bg-green-500/20 text-green-300', icon: Shield },
    ADMIN: { color: 'bg-purple-500/20 text-purple-300', icon: Crown },
  };

  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.STUDENT;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${config.color}`}>
      <Icon className="w-3 h-3" />
      <span className="capitalize">{role.toLowerCase()}</span>
    </span>
  );
};

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = { permission: { requireAuth: true } }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Enhanced error components
function UnauthenticatedError({
  onLogin,
  className
}: {
  onLogin: () => void;
  className?: string;
}) {
  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Authentication Required
          </h1>

          <p className="text-gray-300 mb-6">
            You need to sign in to access this page. Please log in to continue your Solidity learning journey.
          </p>

          <EnhancedButton
            onClick={onLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            touchTarget
            tooltip="Sign in to access this page"
          >
            <Shield className="w-4 h-4 mr-2" />
            Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </EnhancedButton>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// NOTE: This component was replaced by inline error rendering
// Keeping for reference if needed in the future
/*
function _UnauthorizedError({
  permission,
  currentRole,
  onRequestAccess,
  className
}: {
  permission: RoutePermission;
  currentRole?: UserRole;
  onRequestAccess: () => void;
  className?: string;
}) {
  const requiredRoles = permission.roles || [];
  const requiredPermissions = permission.permissions || [];

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <GlassCard className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Access Denied
          </h1>

          <p className="text-gray-300 mb-4">
            You don't have permission to access this page.
          </p>

          <div className="bg-black/20 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Required Access:</h3>

            {requiredRoles.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-gray-400">Roles: </span>
                <span className="text-sm text-white">
                  {requiredRoles.join(' or ')}
                </span>
              </div>
            )}

            {requiredPermissions.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-gray-400">Permissions: </span>
                <span className="text-sm text-white">
                  {requiredPermissions.join(', ')}
                </span>
              </div>
            )}

            <div>
              <span className="text-xs text-gray-400">Your Role: </span>
              <span className="text-sm text-yellow-400">
                {currentRole || 'Not assigned'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <EnhancedButton
              onClick={onRequestAccess}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              touchTarget
              tooltip="Request access to this feature"
            >
              <Shield className="w-4 h-4 mr-2" />
              Request Access
            </EnhancedButton>

            <EnhancedButton
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
              touchTarget
            >
              Go Back
            </EnhancedButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
*/

// Hook for checking route permissions
export function useRouteProtection(pathname: string) {
  const { user, isAuthenticated, checkPermission } = useAuth();

  const getRoutePermission = (path: string): RoutePermission | null => {
    // Check exact matches first
    if (ROUTE_PERMISSIONS[path]) {
      return ROUTE_PERMISSIONS[path];
    }

    // Check pattern matches
    for (const [pattern, permission] of Object.entries(ROUTE_PERMISSIONS)) {
      if (path.startsWith(pattern)) {
        return permission;
      }
    }

    return null;
  };

  const permission = getRoutePermission(pathname);

  if (!permission) {
    return { isAllowed: true, permission: null, reason: null };
  }

  // Check authentication
  if (permission.requireAuth && !isAuthenticated) {
    return { isAllowed: false, permission, reason: 'unauthenticated' };
  }

  // Check roles
  if (permission.roles && user && !permission.roles.includes(user.role)) {
    return { isAllowed: false, permission, reason: 'insufficient_role' };
  }

  // Check permissions
  if (permission.permissions && user) {
    const hasAllPermissions = permission.permissions.every(perm =>
      checkPermission(perm)
    );
    if (!hasAllPermissions) {
      return { isAllowed: false, permission, reason: 'insufficient_permissions' };
    }
  }

  return { isAllowed: true, permission, reason: null };
}

// Hook for checking authentication status (legacy compatibility)
export function useAuthGuard(requiredRole?: string) {
  const { user, isAuthenticated, isLoading } = useAuth();

  const userRole = user?.role;

  const hasRequiredRole = !requiredRole || userRole === requiredRole ||
    (requiredRole === 'STUDENT' && ['MENTOR', 'INSTRUCTOR', 'ADMIN'].includes(userRole || '')) ||
    (requiredRole === 'MENTOR' && ['INSTRUCTOR', 'ADMIN'].includes(userRole || '')) ||
    (requiredRole === 'INSTRUCTOR' && userRole === 'ADMIN');

  return {
    isAuthenticated,
    isLoading,
    hasRequiredRole,
    userRole,
    user,
  };
}
