/**
 * @fileoverview Quantum Lazy Loading Configuration
 * @module lib/performance/LazyLoadingConfig
 */

import { lazy, ComponentType, ReactElement } from 'react'

/**
 * Lazy loading configuration for heavy components with quantum optimization.
 * Implements intelligent preloading and performance monitoring.
 */

// Core lazy-loaded components
export const LazyComponents = {
  // AI Components (Heavy)
  AICodeAnalyzer: lazy(() => import('@/components/ai/AICodeAnalyzer')),
  AIContractGenerator: lazy(
    () => import('@/components/ai/AIContractGenerator'),
  ),
  EnhancedAITutor: lazy(() => import('@/components/ai/EnhancedAITutor')),
  EnhancedAIAssistant: lazy(
    () => import('@/components/ai/EnhancedAIAssistant'),
  ),
  AILearningPath: lazy(() => import('@/components/ai/AILearningPath')),

  // Editor Components (Very Heavy)
  MonacoCollaborativeEditor: lazy(
    () => import('@/components/collaboration/MonacoCollaborativeEditor'),
  ),
  AdvancedCollaborativeMonacoEditor: lazy(
    () => import('@/components/editor/AdvancedCollaborativeMonacoEditor'),
  ),
  SolidityDebuggerInterface: lazy(
    () => import('@/components/debugging/SolidityDebuggerInterface'),
  ),
  EnhancedCodeEditor: lazy(
    () => import('@/components/editor/EnhancedCodeEditor'),
  ),
  SecurityEnhancedEditor: lazy(
    () => import('@/components/editor/SecurityEnhancedEditor'),
  ),

  // Blockchain Components (Heavy)
  BlockchainIntegration: lazy(
    () => import('@/components/blockchain/BlockchainIntegration'),
  ),
  ContractDeployer: lazy(
    () => import('@/components/blockchain/ContractDeployer'),
  ),
  WalletConnect: lazy(() => import('@/components/blockchain/WalletConnect')),

  // Collaboration Components (Heavy)
  RealTimeCodeEditor: lazy(
    () => import('@/components/collaboration/RealTimeCodeEditor'),
  ),
  CollaborativeEditor: lazy(
    () => import('@/components/collaboration/CollaborativeEditor'),
  ),
  LiveChatSystem: lazy(
    () => import('@/components/collaboration/LiveChatSystem'),
  ),
  ComprehensiveCollaborationDashboard: lazy(
    () =>
      import('@/components/collaboration/ComprehensiveCollaborationDashboard'),
  ),

  // Learning Components (Medium)
  LearningDashboard: lazy(
    () => import('@/components/learning/LearningDashboard'),
  ),
  PersonalizedLearningDashboard: lazy(
    () => import('@/components/learning/PersonalizedLearningDashboard'),
  ),
  ProjectBasedLearning: lazy(
    () => import('@/components/learning/ProjectBasedLearning'),
  ),
  InteractiveCodeEditor: lazy(
    () => import('@/components/learning/InteractiveCodeEditor'),
  ),

  // Community Components (Medium)
  CommunityHub: lazy(() => import('@/components/community/CommunityHub')),
  Leaderboards: lazy(() => import('@/components/community/Leaderboards')),

  // Performance Monitoring Components
  PerformanceMonitor: lazy(
    () => import('@/components/monitoring/PerformanceMonitor'),
  ),
  LighthouseOptimizer: lazy(
    () => import('@/components/performance/LighthouseOptimizer'),
  ),
}

/**
 * Route-based lazy loading configuration
 */
export const LazyRoutes = {
  Dashboard: lazy(() => import('@/app/dashboard/page')),
  CodeLab: lazy(() => import('@/app/code/page')),
  Collaborate: lazy(() => import('@/app/collaborate/page')),
  Learn: lazy(() => import('@/app/learn/page')),
  Profile: lazy(() => import('@/app/profile/page')),
  Jobs: lazy(() => import('@/app/jobs/page')),
  Certificates: lazy(() => import('@/app/certificates/page')),
  Achievements: lazy(() => import('@/app/achievements/page')),
}

/**
 * Loading priorities for quantum optimization
 */
export enum LoadingPriority {
  CRITICAL = 'critical', // Load immediately
  HIGH = 'high', // Load on interaction
  MEDIUM = 'medium', // Load on scroll/hover
  LOW = 'low', // Load on idle
  LAZY = 'lazy', // Load on demand
}

/**
 * Component loading configuration with priorities
 */
export const ComponentLoadingConfig = {
  // Critical components (loaded immediately)
  [LoadingPriority.CRITICAL]: ['Navigation', 'ErrorBoundary', 'AuthProvider'],

  // High priority (loaded on interaction)
  [LoadingPriority.HIGH]: [
    'EnhancedCodeEditor',
    'MonacoCollaborativeEditor',
    'AICodeAnalyzer',
  ],

  // Medium priority (loaded on scroll/hover)
  [LoadingPriority.MEDIUM]: [
    'LearningDashboard',
    'CommunityHub',
    'BlockchainIntegration',
  ],

  // Low priority (loaded on idle)
  [LoadingPriority.LOW]: [
    'PerformanceMonitor',
    'LighthouseOptimizer',
    'Leaderboards',
  ],

  // Lazy priority (loaded on demand)
  [LoadingPriority.LAZY]: [
    'SolidityDebuggerInterface',
    'ProjectBasedLearning',
    'ComprehensiveCollaborationDashboard',
  ],
}

/**
 * Quantum preloading strategy
 */
export class QuantumPreloader {
  private static instance: QuantumPreloader
  private loadedComponents = new Set<string>()
  private loadingQueue = new Map<string, Promise<ComponentType<any>>>()

  static getInstance(): QuantumPreloader {
    if (!QuantumPreloader.instance) {
      QuantumPreloader.instance = new QuantumPreloader()
    }
    return QuantumPreloader.instance
  }

  /**
   * Intelligent preloading based on user behavior
   */
  async preloadByPriority(priority: LoadingPriority): Promise<void> {
    const components = ComponentLoadingConfig[priority] || []

    for (const componentName of components) {
      if (!this.loadedComponents.has(componentName)) {
        this.preloadComponent(componentName)
      }
    }
  }

  /**
   * Preload component with caching
   */
  private async preloadComponent(componentName: string): Promise<void> {
    if (this.loadingQueue.has(componentName)) {
      return this.loadingQueue.get(componentName)
    }

    const lazyComponent = this.getComponentByName(componentName)
    if (lazyComponent) {
      const loadPromise = this.loadComponentWithRetry(lazyComponent)
      this.loadingQueue.set(componentName, loadPromise)

      try {
        await loadPromise
        this.loadedComponents.add(componentName)
      } catch (error) {
        console.warn(`Failed to preload component: ${componentName}`, error)
        this.loadingQueue.delete(componentName)
      }
    }
  }

  /**
   * Load component with retry mechanism
   */
  private async loadComponentWithRetry(
    lazyComponent: React.LazyExoticComponent<ComponentType<any>>,
    retries = 3,
  ): Promise<ComponentType<any>> {
    for (let i = 0; i < retries; i++) {
      try {
        return await lazyComponent._init()
      } catch (error) {
        if (i === retries - 1) throw error
        await this.delay(Math.pow(2, i) * 1000) // Exponential backoff
      }
    }
    throw new Error('Max retries exceeded')
  }

  /**
   * Get lazy component by name
   */
  private getComponentByName(
    componentName: string,
  ): React.LazyExoticComponent<ComponentType<any>> | null {
    const componentMap: Record<
      string,
      React.LazyExoticComponent<ComponentType<any>>
    > = {
      EnhancedCodeEditor: LazyComponents.EnhancedCodeEditor,
      MonacoCollaborativeEditor: LazyComponents.MonacoCollaborativeEditor,
      AICodeAnalyzer: LazyComponents.AICodeAnalyzer,
      LearningDashboard: LazyComponents.LearningDashboard,
      CommunityHub: LazyComponents.CommunityHub,
      BlockchainIntegration: LazyComponents.BlockchainIntegration,
      PerformanceMonitor: LazyComponents.PerformanceMonitor,
      LighthouseOptimizer: LazyComponents.LighthouseOptimizer,
      Leaderboards: LazyComponents.Leaderboards,
      SolidityDebuggerInterface: LazyComponents.SolidityDebuggerInterface,
      ProjectBasedLearning: LazyComponents.ProjectBasedLearning,
      ComprehensiveCollaborationDashboard:
        LazyComponents.ComprehensiveCollaborationDashboard,
    }

    return componentMap[componentName] || null
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Intersection Observer for lazy loading
 */
export class QuantumIntersectionObserver {
  private observer: IntersectionObserver | null = null
  private preloader = QuantumPreloader.getInstance()

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupObserver()
    }
  }

  private setupObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const componentName = entry.target.getAttribute(
              'data-lazy-component',
            )
            if (componentName) {
              this.preloader.preloadByPriority(LoadingPriority.MEDIUM)
            }
          }
        })
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      },
    )
  }

  observe(element: Element): void {
    if (this.observer) {
      this.observer.observe(element)
    }
  }

  unobserve(element: Element): void {
    if (this.observer) {
      this.observer.unobserve(element)
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

/**
 * Hook for using quantum lazy loading
 */
export function useQuantumLazyLoading() {
  const preloader = QuantumPreloader.getInstance()

  return {
    preloadByPriority: preloader.preloadByPriority.bind(preloader),
    LazyComponents,
    LazyRoutes,
  }
}

export default LazyComponents
