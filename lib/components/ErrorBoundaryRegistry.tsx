/**
 * Error Boundary Registry
 * 
 * Centralized registry for managing error boundaries across the application.
 * Provides automatic error boundary application based on route patterns and component types.
 */

'use client';

import { ComponentType } from 'react';
import { 
  withPageErrorBoundary,
  withFeatureErrorBoundary,
  withComponentErrorBoundary,
  withCodeEditorErrorBoundary,
  withLearningModuleErrorBoundary,
  withAuthErrorBoundary,
  withAsyncErrorBoundary,
  ErrorBoundaryConfig
} from './ErrorBoundaryHOCs';

/**
 * Route-based error boundary configuration
 */
interface RouteErrorBoundaryConfig {
  /** Route pattern to match (regex or string) */
  pattern: string | RegExp;
  /** Type of error boundary to apply */
  type: 'page' | 'feature' | 'component' | 'code-editor' | 'learning-module' | 'auth' | 'async';
  /** Component/page name */
  name?: string;
  /** Enable retry functionality */
  enableRetry?: boolean;
  /** Maximum number of retries */
  maxRetries?: number;
  /** Show error details to user */
  showErrorDetails?: boolean;
  /** Additional configuration */
  config?: ErrorBoundaryConfig & {
    moduleId?: string;
    lessonId?: string;
    operationType?: 'api' | 'upload' | 'processing' | 'authentication';
    onRetry?: () => Promise<void>;
  };
}

/**
 * Predefined route configurations for automatic error boundary application
 */
const ROUTE_CONFIGURATIONS: RouteErrorBoundaryConfig[] = [
  // Authentication routes
  {
    pattern: /^\/auth\/(login|register|reset-password)/,
    type: 'auth',
    name: 'AuthPage',
    enableRetry: true,
    maxRetries: 1,
    showErrorDetails: process.env.NODE_ENV === 'development'
  },
  
  // Code editor routes
  {
    pattern: /^\/code/,
    type: 'code-editor',
    name: 'CodeEditorPage',
    enableRetry: true,
    maxRetries: 2,
    showErrorDetails: process.env.NODE_ENV === 'development'
  },
  
  // Learning module routes
  {
    pattern: /^\/learn|\/tutorials|\/courses/,
    type: 'learning-module',
    name: 'LearningPage',
    enableRetry: true,
    maxRetries: 2,
    showErrorDetails: process.env.NODE_ENV === 'development'
  },
  
  // Dashboard and main app routes
  {
    pattern: /^\/dashboard|\/profile|\/settings|\/achievements/,
    type: 'page',
    name: 'AppPage',
    enableRetry: false,
    showErrorDetails: process.env.NODE_ENV === 'development'
  },
  
  // Admin routes
  {
    pattern: /^\/admin/,
    type: 'page',
    name: 'AdminPage',
    enableRetry: false,
    showErrorDetails: process.env.NODE_ENV === 'development'
  },
  
  // API and async operation routes
  {
    pattern: /^\/api|\/upload|\/collaborate/,
    type: 'async',
    name: 'AsyncPage',
    enableRetry: true,
    maxRetries: 3,
    showErrorDetails: process.env.NODE_ENV === 'development',
    config: {
      operationType: 'api'
    }
  }
];

/**
 * Component type-based configurations
 */
const COMPONENT_TYPE_CONFIGURATIONS: Record<string, RouteErrorBoundaryConfig> = {
  // Feature components
  'Dashboard': {
    pattern: '',
    type: 'feature',
    name: 'Dashboard',
    enableRetry: true,
    maxRetries: 2
  },
  
  'CodeEditor': {
    pattern: '',
    type: 'code-editor',
    name: 'CodeEditor',
    enableRetry: true,
    maxRetries: 2
  },
  
  'LearningModule': {
    pattern: '',
    type: 'learning-module',
    name: 'LearningModule',
    enableRetry: true,
    maxRetries: 2
  },
  
  'AuthForm': {
    pattern: '',
    type: 'auth',
    name: 'AuthForm',
    enableRetry: true,
    maxRetries: 1
  },
  
  'AsyncComponent': {
    pattern: '',
    type: 'async',
    name: 'AsyncComponent',
    enableRetry: true,
    maxRetries: 3,
    config: {
      operationType: 'processing'
    }
  }
};

/**
 * Error Boundary Registry class
 */
export class ErrorBoundaryRegistry {
  private static instance: ErrorBoundaryRegistry;
  
  private constructor() {}
  
  public static getInstance(): ErrorBoundaryRegistry {
    if (!ErrorBoundaryRegistry.instance) {
      ErrorBoundaryRegistry.instance = new ErrorBoundaryRegistry();
    }
    return ErrorBoundaryRegistry.instance;
  }
  
  /**
   * Automatically wrap a component with the appropriate error boundary based on route
   */
  public wrapByRoute<P extends object>(
    Component: ComponentType<P>,
    route: string,
    customConfig?: ErrorBoundaryConfig
  ): ComponentType<P> {
    const config = this.getRouteConfiguration(route);
    
    if (!config) {
      // Default to page-level error boundary
      return withPageErrorBoundary(Component, {
        name: Component.displayName || Component.name,
        ...customConfig
      }) as ComponentType<P>;
    }
    
    const finalConfig = { ...config, ...customConfig };
    
    switch (config.type) {
      case 'auth':
        return withAuthErrorBoundary(Component, finalConfig) as ComponentType<P>;
      case 'code-editor':
        return withCodeEditorErrorBoundary(Component, finalConfig) as ComponentType<P>;
      case 'learning-module':
        return withLearningModuleErrorBoundary(Component, finalConfig) as ComponentType<P>;
      case 'async':
        return withAsyncErrorBoundary(Component, finalConfig) as ComponentType<P>;
      case 'feature':
        return withFeatureErrorBoundary(Component, finalConfig) as ComponentType<P>;
      case 'component':
        return withComponentErrorBoundary(Component, finalConfig) as ComponentType<P>;
      default:
        return withPageErrorBoundary(Component, finalConfig) as ComponentType<P>;
    }
  }
  
  /**
   * Automatically wrap a component with error boundary based on component type
   */
  public wrapByType<P extends object>(
    Component: ComponentType<P>,
    componentType: string,
    customConfig?: ErrorBoundaryConfig
  ): ComponentType<P> {
    const config = COMPONENT_TYPE_CONFIGURATIONS[componentType];
    
    if (!config) {
      return withComponentErrorBoundary(Component, {
        name: Component.displayName || Component.name,
        ...customConfig
      }) as ComponentType<P>;
    }
    
    const finalConfig = { ...config, ...customConfig };
    
    switch (config.type) {
      case 'auth':
        return withAuthErrorBoundary(Component, finalConfig) as ComponentType<P>;
      case 'code-editor':
        return withCodeEditorErrorBoundary(Component, finalConfig) as ComponentType<P>;
      case 'learning-module':
        return withLearningModuleErrorBoundary(Component, finalConfig) as ComponentType<P>;
      case 'async':
        return withAsyncErrorBoundary(Component, finalConfig) as ComponentType<P>;
      case 'feature':
        return withFeatureErrorBoundary(Component, finalConfig) as ComponentType<P>;
      case 'component':
        return withComponentErrorBoundary(Component, finalConfig) as ComponentType<P>;
      default:
        return withComponentErrorBoundary(Component, finalConfig) as ComponentType<P>;
    }
  }
  
  /**
   * Get configuration for a specific route
   */
  private getRouteConfiguration(route: string): RouteErrorBoundaryConfig | null {
    return ROUTE_CONFIGURATIONS.find(config => {
      if (typeof config.pattern === 'string') {
        return route.includes(config.pattern);
      } else {
        return config.pattern.test(route);
      }
    }) || null;
  }
  
  /**
   * Register a new route configuration
   */
  public registerRoute(config: RouteErrorBoundaryConfig): void {
    ROUTE_CONFIGURATIONS.push(config);
  }
  
  /**
   * Register a new component type configuration
   */
  public registerComponentType(type: string, config: RouteErrorBoundaryConfig): void {
    COMPONENT_TYPE_CONFIGURATIONS[type] = config;
  }
  
  /**
   * Get all registered route configurations
   */
  public getRouteConfigurations(): RouteErrorBoundaryConfig[] {
    return [...ROUTE_CONFIGURATIONS];
  }
  
  /**
   * Get all registered component type configurations
   */
  public getComponentTypeConfigurations(): Record<string, RouteErrorBoundaryConfig> {
    return { ...COMPONENT_TYPE_CONFIGURATIONS };
  }
}

/**
 * Utility functions for easy access
 */
export const errorBoundaryRegistry = ErrorBoundaryRegistry.getInstance();

/**
 * Decorator for automatic error boundary application based on route
 */
export function WithErrorBoundaryByRoute(route: string, config?: ErrorBoundaryConfig) {
  return function <T extends ComponentType<any>>(target: T): T {
    return errorBoundaryRegistry.wrapByRoute(target, route, config) as T;
  };
}

/**
 * Decorator for automatic error boundary application based on component type
 */
export function WithErrorBoundaryByType(componentType: string, config?: ErrorBoundaryConfig) {
  return function <T extends ComponentType<any>>(target: T): T {
    return errorBoundaryRegistry.wrapByType(target, componentType, config) as T;
  };
}

/**
 * Hook to get the appropriate error boundary wrapper for current route
 */
export function useErrorBoundaryForRoute(route: string) {
  const registry = ErrorBoundaryRegistry.getInstance();
  
  return function wrapComponent<P extends object>(
    Component: ComponentType<P>,
    config?: ErrorBoundaryConfig
  ) {
    return registry.wrapByRoute(Component, route, config);
  };
}

// Export singleton instance for global access
export default errorBoundaryRegistry;