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
  /** Priority order (lower numbers = higher priority = closer to root) */
  priority?: number;
}

/**
 * Compose multiple providers with automatic optimization
 */
export function composeProviders(configs: ProviderConfig[]) {
  // Sort providers by priority (lower priority number = closer to root)
  const sortedConfigs = [...configs].sort((a, b) => (a.priority || 50) - (b.priority || 50));

  return function ComposedProviders({ children }: { children: ReactNode }) {
    // Build provider tree from inside out (reverse order)
    const providerTree = useMemo(() => {
      return sortedConfigs.reduceRight((acc: ReactNode, config) => {
        const { Provider, props = {}, dependencies = [], memoize = true } = config;
        
        if (memoize) {
          // Create memoized provider wrapper
          const MemoizedProvider = React.memo(({ children, ...providerProps }: any) => (
            <Provider {...providerProps}>
              {children}
            </Provider>
          ));
          
          return <MemoizedProvider {...props}>{acc}</MemoizedProvider>;
        } else {
          return <Provider {...props}>{acc}</Provider>;
        }
      }, children);
    }, [children, ...sortedConfigs.flatMap(config => config.dependencies || [])]);

    return <>{providerTree}</>;
  };
}

/**
 * Optimized provider composition with dependency injection
 */
export class ProviderComposer {
  private providers: Map<string, ProviderConfig> = new Map();
  private dependencyGraph: Map<string, string[]> = new Map();

  /**
   * Register a provider with the composer
   */
  register(name: string, config: ProviderConfig, dependencies: string[] = []): void {
    this.providers.set(name, config);
    this.dependencyGraph.set(name, dependencies);
  }

  /**
   * Build the optimal provider tree based on dependencies
   */
  compose(): ComponentType<{ children: ReactNode }> {
    const orderedProviders = this.topologicalSort();
    const configs = orderedProviders.map(name => this.providers.get(name)!);
    
    return composeProviders(configs);
  }

  /**
   * Topological sort to resolve provider dependencies
   */
  private topologicalSort(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (name: string) => {
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected involving provider: ${name}`);
      }
      
      if (visited.has(name)) {
        return;
      }

      visiting.add(name);
      
      const dependencies = this.dependencyGraph.get(name) || [];
      for (const dep of dependencies) {
        if (this.providers.has(dep)) {
          visit(dep);
        }
      }
      
      visiting.delete(name);
      visited.add(name);
      result.push(name);
    };

    for (const [name] of this.providers) {
      visit(name);
    }

    return result;
  }

  /**
   * Get all registered providers
   */
  getProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Remove a provider
   */
  unregister(name: string): void {
    this.providers.delete(name);
    this.dependencyGraph.delete(name);
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
    this.dependencyGraph.clear();
  }
}

/**
 * HOC to create a lazy-loaded provider
 */
export function withLazyProvider<P extends object>(
  importProvider: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactNode = null
) {
  const LazyProvider = React.lazy(importProvider);
  
  return function LazyProviderWrapper(props: P) {
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
    return React.memo(({ children, ...providerProps }: any) => (
      <Provider {...providerProps}>{children}</Provider>
    ));
  }, [Provider]);

  const memoizedProps = useMemo(() => props, dependencies);

  return <MemoizedProvider {...memoizedProps}>{children}</MemoizedProvider>;
}

/**
 * Utility to analyze provider performance
 */
export function analyzeProviderPerformance(providerName: string) {
  const startTime = performance.now();
  
  return {
    start: () => {
      console.time(`Provider: ${providerName}`);
    },
    end: () => {
      console.timeEnd(`Provider: ${providerName}`);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 10) {
        console.warn(`Provider ${providerName} took ${duration.toFixed(2)}ms to initialize`);
      }
    }
  };
}

// Create global composer instance
export const globalProviderComposer = new ProviderComposer();

// Convenience function for simple provider composition
export function createProviderStack(providers: Array<ComponentType<{ children: ReactNode }>>) {
  return function ProviderStack({ children }: { children: ReactNode }) {
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children
    );
  };
}