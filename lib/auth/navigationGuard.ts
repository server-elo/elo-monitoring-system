// Navigation guard system for route protection and smart redirects

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { ReadonlyURLSearchParams } from 'next/navigation';

export interface NavigationGuardConfig {
  requireAuth?: boolean;
  roles?: string[];
  permissions?: string[];
  redirectTo?: string;
  allowGuest?: boolean;
  onUnauthorized?: (reason: string, context: NavigationContext) => void;
  onSessionExpired?: (context: NavigationContext) => void;
}

export interface NavigationContext {
  pathname: string;
  searchParams: ReadonlyURLSearchParams;
  user?: {
    id: string;
    role: string;
    email: string;
    name: string;
  };
  isAuthenticated: boolean;
  router: AppRouterInstance;
}

export interface RedirectOptions {
  returnUrl?: string;
  reason?: string;
  message?: string;
  preserveQuery?: boolean;
}

export class NavigationGuard {
  private static instance: NavigationGuard;
  private guards: Map<string, NavigationGuardConfig> = new Map();
  private redirectHistory: string[] = [];
  private maxRedirectHistory = 10;

  private constructor() {
    this.setupDefaultGuards();
  }

  static getInstance(): NavigationGuard {
    if (!this.instance) {
      this.instance = new NavigationGuard();
    }
    return this.instance;
  }

  // Setup default route guards
  private setupDefaultGuards(): void {
    // Admin routes
    this.addGuard('/admin', {
      requireAuth: true,
      roles: ['ADMIN'],
      redirectTo: '/unauthorized'
    });

    // Profile routes
    this.addGuard('/profile', {
      requireAuth: true,
      redirectTo: '/auth'
    });

    // Settings routes
    this.addGuard('/settings', {
      requireAuth: true,
      redirectTo: '/auth'
    });

    // Instructor routes
    this.addGuard('/instructor', {
      requireAuth: true,
      roles: ['INSTRUCTOR', 'ADMIN'],
      redirectTo: '/unauthorized'
    });

    // Mentor routes
    this.addGuard('/mentor', {
      requireAuth: true,
      roles: ['MENTOR', 'INSTRUCTOR', 'ADMIN'],
      redirectTo: '/unauthorized'
    });

    // Dashboard
    this.addGuard('/dashboard', {
      requireAuth: true,
      redirectTo: '/auth'
    });

    // Course management
    this.addGuard('/courses/create', {
      requireAuth: true,
      roles: ['INSTRUCTOR', 'ADMIN'],
      permissions: ['write:courses'],
      redirectTo: '/unauthorized'
    });

    this.addGuard('/courses/manage', {
      requireAuth: true,
      roles: ['INSTRUCTOR', 'ADMIN'],
      permissions: ['write:courses', 'read:analytics'],
      redirectTo: '/unauthorized'
    });
  }

  // Add a route guard
  addGuard(pattern: string, config: NavigationGuardConfig): void {
    this.guards.set(pattern, config);
  }

  // Remove a route guard
  removeGuard(pattern: string): void {
    this.guards.delete(pattern);
  }

  // Check if navigation is allowed
  async checkNavigation(context: NavigationContext): Promise<{
    allowed: boolean;
    reason?: string;
    redirectTo?: string;
    config?: NavigationGuardConfig;
  }> {
    const guard = this.findMatchingGuard(context.pathname);
    
    if (!guard) {
      return { allowed: true };
    }

    // Check authentication requirement
    if (guard.requireAuth && !context.isAuthenticated) {
      return {
        allowed: false,
        reason: 'unauthenticated',
        redirectTo: guard.redirectTo || '/auth',
        config: guard
      };
    }

    // Check role requirements
    if (guard.roles && guard.roles.length > 0 && context.user) {
      if (!guard.roles.includes(context.user.role)) {
        return {
          allowed: false,
          reason: 'insufficient_role',
          redirectTo: guard.redirectTo || '/unauthorized',
          config: guard
        };
      }
    }

    // Check permission requirements (if implemented)
    if (guard.permissions && guard.permissions.length > 0 && context.user) {
      // This would integrate with your permission checking system
      const hasPermissions = await this.checkPermissions(
        context.user,
        guard.permissions
      );
      
      if (!hasPermissions) {
        return {
          allowed: false,
          reason: 'insufficient_permissions',
          redirectTo: guard.redirectTo || '/unauthorized',
          config: guard
        };
      }
    }

    return { allowed: true, config: guard };
  }

  // Perform navigation with guard checks
  async navigate(
    context: NavigationContext,
    destination: string,
    options: RedirectOptions = {}
  ): Promise<boolean> {
    const newContext = {
      ...context,
      pathname: destination
    };

    const result = await this.checkNavigation(newContext);

    if (!result.allowed) {
      await this.handleUnauthorizedNavigation(context, result, options);
      return false;
    }

    // Navigation allowed, proceed
    this.addToHistory(destination);
    context.router.push(destination);
    return true;
  }

  // Handle unauthorized navigation attempts
  private async handleUnauthorizedNavigation(
    context: NavigationContext,
    result: { reason?: string; redirectTo?: string; config?: NavigationGuardConfig },
    options: RedirectOptions
  ): Promise<void> {
    const { reason, redirectTo, config } = result;

    // Call custom handlers
    if (reason === 'unauthenticated' && config?.onSessionExpired) {
      config.onSessionExpired(context);
    } else if (config?.onUnauthorized) {
      config.onUnauthorized(reason || 'unknown', context);
    }

    // Prepare redirect URL
    const redirectUrl = this.buildRedirectUrl(
      redirectTo || '/unauthorized',
      context,
      { ...options, reason }
    );

    // Add to history and redirect
    this.addToHistory(redirectUrl);
    context.router.push(redirectUrl);
  }

  // Build redirect URL with parameters
  private buildRedirectUrl(
    baseUrl: string,
    context: NavigationContext,
    options: RedirectOptions
  ): string {
    const url = new URL(baseUrl, window.location.origin);

    // Add return URL
    if (options.returnUrl !== false) {
      const returnUrl = options.returnUrl || 
        `${context.pathname}${options.preserveQuery ? context.searchParams.toString() : ''}`;
      url.searchParams.set('returnUrl', encodeURIComponent(returnUrl));
    }

    // Add reason
    if (options.reason) {
      url.searchParams.set('reason', options.reason);
    }

    // Add message
    if (options.message) {
      url.searchParams.set('message', encodeURIComponent(options.message));
    }

    return url.pathname + url.search;
  }

  // Find matching guard for a path
  private findMatchingGuard(pathname: string): NavigationGuardConfig | null {
    // Check exact matches first
    if (this.guards.has(pathname)) {
      return this.guards.get(pathname)!;
    }

    // Check pattern matches
    for (const [pattern, config] of this.guards.entries()) {
      if (this.matchesPattern(pathname, pattern)) {
        return config;
      }
    }

    return null;
  }

  // Check if pathname matches a pattern
  private matchesPattern(pathname: string, pattern: string): boolean {
    // Simple pattern matching - can be enhanced with regex
    if (pattern.endsWith('/*')) {
      const basePattern = pattern.slice(0, -2);
      return pathname.startsWith(basePattern + '/') || pathname === basePattern;
    }
    
    return pathname === pattern;
  }

  // Check user permissions (placeholder - integrate with your permission system)
  private async checkPermissions(
    user: { id: string; role: string },
    _permissions: string[]
  ): Promise<boolean> {
    // This would integrate with your actual permission checking logic
    // For now, return true for admin, false for others requiring specific permissions
    if (user.role === 'ADMIN') return true;
    
    // Add your permission checking logic here
    return false;
  }

  // Add URL to navigation history
  private addToHistory(url: string): void {
    this.redirectHistory.push(url);
    
    // Keep history size manageable
    if (this.redirectHistory.length > this.maxRedirectHistory) {
      this.redirectHistory.shift();
    }
  }

  // Get navigation history
  getHistory(): string[] {
    return [...this.redirectHistory];
  }

  // Clear navigation history
  clearHistory(): void {
    this.redirectHistory = [];
  }

  // Get the last safe URL (for fallback navigation)
  getLastSafeUrl(): string {
    // Return the last URL that wasn't an error page
    const safeUrls = this.redirectHistory.filter(url => 
      !url.includes('/unauthorized') && 
      !url.includes('/session-expired') &&
      !url.includes('/auth')
    );
    
    return safeUrls[safeUrls.length - 1] || '/dashboard';
  }

  // Check if a URL is safe to redirect to
  isSafeRedirectUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url, window.location.origin);
      
      // Only allow same-origin redirects
      if (parsedUrl.origin !== window.location.origin) {
        return false;
      }

      // Block redirects to auth/error pages to prevent loops
      const blockedPaths = ['/auth', '/unauthorized', '/session-expired'];
      return !blockedPaths.some(path => parsedUrl.pathname.startsWith(path));
    } catch {
      return false;
    }
  }

  // Smart redirect that avoids loops and chooses best destination
  smartRedirect(
    context: NavigationContext,
    fallbackUrl: string = '/dashboard'
  ): void {
    const returnUrl = context.searchParams.get('returnUrl');
    
    if (returnUrl) {
      const decodedUrl = decodeURIComponent(returnUrl);
      if (this.isSafeRedirectUrl(decodedUrl)) {
        context.router.push(decodedUrl);
        return;
      }
    }

    // Try last safe URL
    const lastSafe = this.getLastSafeUrl();
    if (lastSafe && this.isSafeRedirectUrl(lastSafe)) {
      context.router.push(lastSafe);
      return;
    }

    // Fallback to provided URL
    context.router.push(fallbackUrl);
  }
}

// Hook for using navigation guard
export function useNavigationGuard() {
  const guard = NavigationGuard.getInstance();
  
  return {
    checkNavigation: guard.checkNavigation.bind(guard),
    navigate: guard.navigate.bind(guard),
    addGuard: guard.addGuard.bind(guard),
    removeGuard: guard.removeGuard.bind(guard),
    getHistory: guard.getHistory.bind(guard),
    clearHistory: guard.clearHistory.bind(guard),
    smartRedirect: guard.smartRedirect.bind(guard),
    isSafeRedirectUrl: guard.isSafeRedirectUrl.bind(guard)
  };
}

// Utility function to create navigation context
export function createNavigationContext(
  pathname: string,
  searchParams: ReadonlyURLSearchParams,
  router: AppRouterInstance,
  user?: any,
  isAuthenticated: boolean = false
): NavigationContext {
  return {
    pathname,
    searchParams,
    router,
    user,
    isAuthenticated
  };
}
