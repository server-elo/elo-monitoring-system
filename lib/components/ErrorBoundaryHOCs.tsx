/**
 * Higher-Order Components for Error Boundary Integration
 * 
 * Provides HOCs to automatically wrap components with appropriate error boundaries
 * for consistent error handling across the application.
 */

'use client';

import React, { ComponentType, forwardRef } from 'react';
import { 
  PageErrorBoundary, 
  FeatureErrorBoundary, 
  ComponentErrorBoundary 
} from '@/components/errors/ErrorBoundary';
import { 
  CodeEditorErrorBoundary,
  LearningModuleErrorBoundary,
  AuthErrorBoundary,
  AsyncComponentErrorBoundary
} from '@/components/errors/SpecializedErrorBoundaries';
import { logger } from '@/lib/api/logger';

/**
 * Configuration for error boundary HOCs
 */
interface ErrorBoundaryConfig {
  /** Name of the component for error reporting */
  name?: string;
  /** Whether to enable retry functionality */
  enableRetry?: boolean;
  /** Maximum number of retries */
  maxRetries?: number;
  /** Custom error handler */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Show error details in development */
  showErrorDetails?: boolean;
}

/**
 * HOC that wraps a component with a page-level error boundary
 */
export function withPageErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  config: ErrorBoundaryConfig = {}
) {
  const WrappedComponent = forwardRef<unknown, P>((props, ref) => {
    // Error handling is done by the specialized error boundary
    // const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      logger.error(`Page Error Boundary: ${config.name || Component.displayName || Component.name}`, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        component: config.name || Component.displayName || Component.name,
        props: process.env.NODE_ENV === 'development' ? props : undefined
      });
      
      config.onError?.(error, errorInfo);
    // };

    return (
      <PageErrorBoundary
        name={config.name || Component.displayName || Component.name}
        onError={handleError}
        showErrorDetails={config.showErrorDetails}
      >
        <Component {...props} ref={ref} />
      </PageErrorBoundary>
    );
  });

  WrappedComponent.displayName = `withPageErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * HOC that wraps a component with a feature-level error boundary
 */
export function withFeatureErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  config: ErrorBoundaryConfig = {}
) {
  const WrappedComponent = forwardRef<unknown, P>((props, ref) => {
    // Error handling is done by the specialized error boundary
    // const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      logger.error(`Feature Error Boundary: ${config.name || Component.displayName || Component.name}`, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        component: config.name || Component.displayName || Component.name,
        props: process.env.NODE_ENV === 'development' ? props : undefined
      });
      
      config.onError?.(error, errorInfo);
    // };

    return (
      <FeatureErrorBoundary
        name={config.name || Component.displayName || Component.name}
        onError={handleError}
        enableRetry={config.enableRetry}
        maxRetries={config.maxRetries}
        showErrorDetails={config.showErrorDetails}
      >
        <Component {...props} ref={ref} />
      </FeatureErrorBoundary>
    );
  });

  WrappedComponent.displayName = `withFeatureErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * HOC that wraps a component with a component-level error boundary
 */
export function withComponentErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  config: ErrorBoundaryConfig = {}
) {
  const WrappedComponent = forwardRef<unknown, P>((props, ref) => {
    // Error handling is done by the specialized error boundary
    // const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      logger.error(`Component Error Boundary: ${config.name || Component.displayName || Component.name}`, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        component: config.name || Component.displayName || Component.name,
        props: process.env.NODE_ENV === 'development' ? props : undefined
      });
      
      config.onError?.(error, errorInfo);
    // };

    return (
      <ComponentErrorBoundary
        name={config.name || Component.displayName || Component.name}
        onError={handleError}
        enableRetry={config.enableRetry}
        maxRetries={config.maxRetries}
        showErrorDetails={config.showErrorDetails}
      >
        <Component {...props} ref={ref} />
      </ComponentErrorBoundary>
    );
  });

  WrappedComponent.displayName = `withComponentErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * HOC that wraps a code editor component with specialized error boundary
 */
export function withCodeEditorErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  config: ErrorBoundaryConfig = {}
) {
  const WrappedComponent = forwardRef<unknown, P>((props, ref) => {
    // Error handling is done by the specialized error boundary
    // const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      logger.error(`Code Editor Error Boundary: ${config.name || Component.displayName || Component.name}`, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        component: config.name || Component.displayName || Component.name,
        props: process.env.NODE_ENV === 'development' ? props : undefined
      });
      
      config.onError?.(error, errorInfo);
    // };

    return (
      <CodeEditorErrorBoundary>
        <Component {...props} ref={ref} />
      </CodeEditorErrorBoundary>
    );
  });

  WrappedComponent.displayName = `withCodeEditorErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * HOC that wraps a learning module component with specialized error boundary
 */
export function withLearningModuleErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  config: ErrorBoundaryConfig & { moduleId?: string; lessonId?: string } = {}
) {
  const WrappedComponent = forwardRef<unknown, P>((props, ref) => {
    // Error handling is done by the specialized error boundary
    // const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      logger.error(`Learning Module Error Boundary: ${config.name || Component.displayName || Component.name}`, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        component: config.name || Component.displayName || Component.name,
        moduleId: config.moduleId,
        lessonId: config.lessonId,
        props: process.env.NODE_ENV === 'development' ? props : undefined
      });
      
      config.onError?.(error, errorInfo);
    // };

    return (
      <LearningModuleErrorBoundary 
        moduleId={config.moduleId} 
        lessonId={config.lessonId}
      >
        <Component {...props} ref={ref} />
      </LearningModuleErrorBoundary>
    );
  });

  WrappedComponent.displayName = `withLearningModuleErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * HOC that wraps an authentication component with specialized error boundary
 */
export function withAuthErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  config: ErrorBoundaryConfig = {}
) {
  const WrappedComponent = forwardRef<unknown, P>((props, ref) => {
    // Error handling is done by the specialized error boundary
    // const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      logger.error(`Auth Error Boundary: ${config.name || Component.displayName || Component.name}`, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        component: config.name || Component.displayName || Component.name,
        props: process.env.NODE_ENV === 'development' ? props : undefined
      });
      
      config.onError?.(error, errorInfo);
    // };

    return (
      <AuthErrorBoundary>
        <Component {...props} ref={ref} />
      </AuthErrorBoundary>
    );
  });

  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * HOC that wraps an async component with specialized error boundary
 */
export function withAsyncErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  config: ErrorBoundaryConfig & { 
    operationType?: 'api' | 'upload' | 'processing' | 'authentication';
    onRetry?: () => Promise<void>;
  } = {}
) {
  const WrappedComponent = forwardRef<unknown, P>((props, ref) => {
    // Error handling is done by the specialized error boundary
    // const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      logger.error(`Async Error Boundary: ${config.name || Component.displayName || Component.name}`, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        component: config.name || Component.displayName || Component.name,
        operationType: config.operationType,
        props: process.env.NODE_ENV === 'development' ? props : undefined
      });
      
      config.onError?.(error, errorInfo);
    // };

    return (
      <AsyncComponentErrorBoundary 
        operationType={config.operationType || 'processing'}
        onRetry={config.onRetry}
      >
        <Component {...props} ref={ref} />
      </AsyncComponentErrorBoundary>
    );
  });

  WrappedComponent.displayName = `withAsyncErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * Utility function to automatically choose the appropriate error boundary HOC
 * based on component type and usage context
 */
export function withSmartErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  context: {
    type: 'page' | 'feature' | 'component' | 'code-editor' | 'learning-module' | 'auth' | 'async';
    config?: ErrorBoundaryConfig & {
      moduleId?: string;
      lessonId?: string;
      operationType?: 'api' | 'upload' | 'processing' | 'authentication';
      onRetry?: () => Promise<void>;
    };
  }
) {
  switch (context.type) {
    case 'page':
      return withPageErrorBoundary(Component, context.config);
    case 'feature':
      return withFeatureErrorBoundary(Component, context.config);
    case 'component':
      return withComponentErrorBoundary(Component, context.config);
    case 'code-editor':
      return withCodeEditorErrorBoundary(Component, context.config);
    case 'learning-module':
      return withLearningModuleErrorBoundary(Component, context.config);
    case 'auth':
      return withAuthErrorBoundary(Component, context.config);
    case 'async':
      return withAsyncErrorBoundary(Component, context.config);
    default:
      return withComponentErrorBoundary(Component, context.config);
  }
}

/**
 * Type-safe decorator for class components
 */
export function ErrorBoundaryDecorator(
  type: 'page' | 'feature' | 'component' | 'code-editor' | 'learning-module' | 'auth' | 'async',
  config?: ErrorBoundaryConfig
) {
  return function <T extends ComponentType<any>>(target: T): T {
    return withSmartErrorBoundary(target, { type, config }) as T;
  };
}

// Export all HOCs for convenience
export {
  withPageErrorBoundary as withPage,
  withFeatureErrorBoundary as withFeature,
  withComponentErrorBoundary as withComponent,
  withCodeEditorErrorBoundary as withCodeEditor,
  withLearningModuleErrorBoundary as withLearningModule,
  withAuthErrorBoundary as withAuth,
  withAsyncErrorBoundary as withAsync
};