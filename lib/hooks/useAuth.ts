'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionManager, SessionStatus } from '@/lib/auth/sessionManager';
;
;
;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: 'STUDENT' | 'MENTOR' | 'INSTRUCTOR' | 'ADMIN';
  profile?: {
    displayName?: string;
    bio?: string;
    location?: string;
    website?: string;
    githubUsername?: string;
    twitterUsername?: string;
    avatar?: string;
    learningPreferences?: any;
    editorPreferences?: any;
  };
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (provider?: string, credentials?: { email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  clearError: () => void;
  refreshSession: () => Promise<boolean>;
  checkPermission: (permission: string) => boolean;
  updateProfile: (data: Partial<AuthUser>) => Promise<boolean>;
}

export function useAuth(): AuthState & AuthActions {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionManager] = useState(() => SessionManager.getInstance());

  // Derived state
  const user: AuthUser | null = session?.user ? {
    id: session.user.id || '',
    name: session.user.name || '',
    email: session.user.email || '',
    image: session.user.image || undefined,
    role: (session.user as any).role || 'STUDENT',
  } : null;

  const isAuthenticated = !!session && !!user;
  const isSessionLoading = status === 'loading';

  // Session management integration
  useEffect(() => {
    if (session && user) {
      sessionManager.setSession({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        lastActivity: new Date(),
        createdAt: new Date(),
        deviceId: '',
        sessionId: ''
      });
    } else {
      sessionManager.clearSession();
    }
  }, [session, user, sessionManager]);

  // Login function
  const login = useCallback(async (
    provider: string = 'credentials',
    credentials?: { email: string; password: string }
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      let result;

      if (provider === 'credentials' && credentials) {
        result = await signIn('credentials', {
          email: credentials.email,
          password: credentials.password,
          redirect: false,
        });
      } else {
        result = await signIn(provider, {
          redirect: false,
          callbackUrl: '/',
        });
      }

      if (result?.error) {
        setError(result.error === 'CredentialsSignin' 
          ? 'Invalid email or password' 
          : 'Authentication failed'
        );
        return false;
      }

      if (result?.ok) {
        // Refresh the session to get updated user data
        await update();
        return true;
      }

      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [update]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/' 
      });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Register function
  const register = useCallback(async (data: {
    name: string;
    email: string;
    password: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Registration failed');
        return false;
      }

      // Auto-login after successful registration
      const loginSuccess = await login('credentials', {
        email: data.email,
        password: data.password,
      });

      return loginSuccess;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Enhanced refresh session function
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      // Try SessionManager refresh first
      const sessionRefreshed = await sessionManager.refreshSession();
      if (sessionRefreshed) {
        await update();
        return true;
      }

      // Fallback to NextAuth update
      await update();
      return true;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }, [update, sessionManager]);

  // Get session status
  const getSessionStatus = useCallback((): SessionStatus => {
    return sessionManager.getSessionStatus();
  }, [sessionManager]);

  // Add session status listener
  const addSessionStatusListener = useCallback((listener: (status: SessionStatus) => void) => {
    return sessionManager.addStatusListener(listener);
  }, [sessionManager]);

  // Add session event listener
  const addSessionEventListener = useCallback((listener: (event: any) => void) => {
    return sessionManager.addEventListener(listener);
  }, [sessionManager]);

  // Forgot password function
  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError('No account found with this email address');
        } else if (response.status === 429) {
          setError('Too many requests. Please wait before trying again');
        } else {
          setError(result.error || 'Failed to send reset email');
        }
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (token: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setError('Invalid or expired reset token');
        } else {
          setError(result.error || 'Failed to reset password');
        }
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check permission function
  const checkPermission = useCallback((permission: string): boolean => {
    if (!user) return false;

    const permissions = {
      STUDENT: [
        'read:lessons',
        'write:progress',
        'read:profile',
        'write:submissions',
        'read:achievements',
        'write:feedback',
      ],
      MENTOR: [
        'read:lessons',
        'write:progress',
        'read:profile',
        'write:submissions',
        'read:achievements',
        'write:feedback',
        'read:students',
        'write:mentorship',
        'read:collaboration',
      ],
      INSTRUCTOR: [
        'read:lessons',
        'write:lessons',
        'read:students',
        'write:feedback',
        'write:courses',
        'read:analytics',
        'write:mentorship',
        'read:collaboration',
        'write:collaboration',
        'read:submissions',
        'write:grades',
      ],
      ADMIN: ['*'], // All permissions
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }, [user]);

  // Update profile function
  const updateProfile = useCallback(async (data: Partial<AuthUser>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to update profile');
        return false;
      }

      // Refresh session to get updated user data
      await update();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [update]);

  return {
    // State
    user,
    isLoading: isLoading || isSessionLoading,
    isAuthenticated,
    error,

    // Actions
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    clearError,
    refreshSession,
    checkPermission,
    updateProfile,
    getSessionStatus,
    addSessionStatusListener,
    addSessionEventListener,
  };
}

// Permission checking hook
export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;

    const permissions = {
      STUDENT: [
        'read:lessons',
        'write:progress',
        'read:profile',
        'write:submissions',
        'read:achievements',
        'write:feedback',
      ],
      MENTOR: [
        'read:lessons',
        'write:progress',
        'read:profile',
        'write:submissions',
        'read:achievements',
        'write:feedback',
        'read:students',
        'write:mentorship',
        'read:collaboration',
      ],
      INSTRUCTOR: [
        'read:lessons',
        'write:lessons',
        'read:students',
        'write:feedback',
        'write:courses',
        'read:analytics',
        'write:mentorship',
        'read:collaboration',
        'write:collaboration',
        'read:submissions',
        'write:grades',
      ],
      ADMIN: ['*'], // All permissions
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }, [user]);

  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  }, [user]);

  const hasMinimumRole = useCallback((minimumRole: string): boolean => {
    if (!user) return false;

    const roleHierarchy = {
      STUDENT: 0,
      MENTOR: 1,
      INSTRUCTOR: 2,
      ADMIN: 3,
    };

    const userRoleLevel = roleHierarchy[user.role] ?? 0;
    const minimumRoleLevel = roleHierarchy[minimumRole as keyof typeof roleHierarchy] ?? 0;

    return userRoleLevel >= minimumRoleLevel;
  }, [user]);

  return {
    hasPermission,
    hasRole,
    hasMinimumRole,
  };
}

// Authentication status hook
export function useAuthStatus() {
  const { status } = useSession();
  
  return {
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',
  };
}
