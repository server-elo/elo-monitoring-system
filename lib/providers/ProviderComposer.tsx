/**
 * Provider Composer for Optimal Context Hierarchy
 * 
 * Provides efficient composition of React context providers with automatic
 * optimization and dependency ordering to minimize re-renders.
 */

'use client';

import React, { ComponentType, ReactNode, useMemo } from 'react';

/**
 * Provider configuration for composition
 */
interface ProviderConfig {
  /** Provider component */
  Provider: ComponentType<any>;
  /** Props to pass to the provider */
  props?: Record<string, any>;
  /** Dependencies that trigger provider re-creation */
  dependencies?: React.DependencyList;
  /** Whether this provider should be memoized */
  memoize?: boolean;
  /** Priority order (_lower numbers = higher priority = closer to root) */
  priority?: number;
}

/**
 * Compose multiple providers with automatic optimization
 */
export function composeProviders(_configs: ProviderConfig[]) {
  // Sort providers by priority (_lower priority number = closer to root)
  const sortedConfigs = [...configs].sort( (a, b) => (_a.priority || 50) - (_b.priority || 50));

  return function ComposedProviders(_{ children }: { children: ReactNode }) {
    // Build provider tree from inside out (_reverse order)
    const providerTree = useMemo(() => {
      return sortedConfigs.reduceRight( (acc: ReactNode, config) => {
        const { Provider, props = {}, dependencies = [], memoize = true } = config;
        
        if (memoize) {
          // Create memoized provider wrapper
          const MemoizedProvider = React.memo( ({ children, ...providerProps }: any) => (
            <Provider {...providerProps}>
              {children}
            </Provider>
          ));
          
          return <MemoizedProvider {...props}>{acc}</MemoizedProvider>;
        } else {
          return <Provider {...props}>{acc}</Provider>;
        }
      }, children);
    }, [children, ...sortedConfigs.flatMap(_config => config.dependencies || [])]);

    return <>{providerTree}</>;
  };
}

/**
 * Optimized provider composition with dependency injection
 */
export class ProviderComposer {
  private providers: Map<string, ProviderConfig> = new Map(_);
  private dependencyGraph: Map<string, string[]> = new Map(_);

  /**
   * Register a provider with the composer
   */
  register( name: string, config: ProviderConfig, dependencies: string[] = []): void {
    this.providers.set( name, config);
    this.dependencyGraph.set( name, dependencies);
  }

  /**
   * Build the optimal provider tree based on dependencies
   */
  compose(_): ComponentType<{ children: ReactNode }> {
    const orderedProviders = this.topologicalSort(_);
    const configs = orderedProviders.map(name => this.providers.get(name)!);
    
    return composeProviders(_configs);
  }

  /**
   * Topological sort to resolve provider dependencies
   */
  private topologicalSort(_): string[] {
    const visited = new Set<string>(_);
    const visiting = new Set<string>(_);
    const result: string[] = [];

    const visit = (_name: string) => {
      if (_visiting.has(name)) {
        throw new Error(_`Circular dependency detected involving provider: ${name}`);
      }
      
      if (_visited.has(name)) {
        return;
      }

      visiting.add(_name);
      
      const dependencies = this.dependencyGraph.get(_name) || [];
      for (_const dep of dependencies) {
        if (_this.providers.has(dep)) {
          visit(_dep);
        }
      }
      
      visiting.delete(_name);
      visited.add(_name);
      result.push(_name);
    };

    for (_const [name] of this.providers) {
      visit(_name);
    }

    return result;
  }

  /**
   * Get all registered providers
   */
  getProviders(_): string[] {
    return Array.from(_this.providers.keys());
  }

  /**
   * Remove a provider
   */
  unregister(_name: string): void {
    this.providers.delete(_name);
    this.dependencyGraph.delete(_name);
  }

  /**
   * Clear all providers
   */
  clear(_): void {
    this.providers.clear(_);
    this.dependencyGraph.clear(_);
  }
}

/**
 * HOC to create a lazy-loaded provider
 */
export function withLazyProvider<P extends object>(
  importProvider: (_) => Promise<{ default: ComponentType<P> }>,
  fallback: ReactNode = null
) {
  const LazyProvider = React.lazy(_importProvider);
  
  return function LazyProviderWrapper(_props: P) {
    return (
      <React.Suspense fallback={fallback}>
        <LazyProvider {...props} />
      </React.Suspense>
    );
  };
}

/**
 * Provider with conditional rendering based on feature flags
 */
export function ConditionalProvider<P extends object>({
  condition,
  Provider,
  children,
  ...props
}: {
  condition: boolean;
  Provider: ComponentType<P>;
  children: ReactNode;
} & P) {
  if (!condition) {
    return <>{children}</>;
  }
  
  return <Provider {...props as P}>{children}</Provider>;
}

/**
 * Smart provider that only renders when dependencies change
 */
export function SmartProvider<P extends object>({
  Provider,
  children,
  dependencies = [],
  ...props
}: {
  Provider: ComponentType<P>;
  children: ReactNode;
  dependencies?: React.DependencyList;
} & P) {
  const MemoizedProvider = useMemo(() => {
    return React.memo( ({ children, ...providerProps }: any) => (
      <Provider {...providerProps}>{children}</Provider>
    ));
  }, [Provider]);

  const memoizedProps = useMemo(() => props, dependencies);

  return <MemoizedProvider {...memoizedProps}>{children}</MemoizedProvider>;
}

/**
 * Utility to analyze provider performance
 */
export function analyzeProviderPerformance(_providerName: string) {
  const startTime = performance.now(_);
  
  return {
    start: (_) => {
      console.time(_`Provider: ${providerName}`);
    },
    end: (_) => {
      console.timeEnd(_`Provider: ${providerName}`);
      const endTime = performance.now(_);
      const duration = endTime - startTime;
      
      if (_duration > 10) {
        console.warn(_`Provider ${providerName} took ${duration.toFixed(2)}ms to initialize`);
      }
    }
  };
}

// Create global composer instance
export const globalProviderComposer = new ProviderComposer(_);

// Convenience function for simple provider composition
export function createProviderStack(_providers: Array<ComponentType<{ children: ReactNode }>>) {
  return function ProviderStack(_{ children }: { children: ReactNode }) {
    return providers.reduceRight(
      ( acc, Provider) => <Provider>{acc}</Provider>,
      children
    );
  };
}