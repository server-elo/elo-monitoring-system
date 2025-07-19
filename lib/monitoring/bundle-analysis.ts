/**
 * Automated Bundle Analysis and Performance Budgets
 * 
 * Provides comprehensive bundle analysis, performance budgets,
 * and CI/CD integration for maintaining optimal application performance.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from './simple-logger';
import { env } from '@/lib/config/environment';

/**
 * Bundle analysis data structure
 */
interface BundleAnalysis {
  timestamp: string;
  commit?: string;
  branch?: string;
  buildId?: string;
  bundles: BundleInfo[];
  chunks: ChunkInfo[];
  assets: AssetInfo[];
  dependencies: DependencyInfo[];
  performance: PerformanceMetrics;
  budget: BudgetCheck;
}

/**
 * Individual bundle information
 */
interface BundleInfo {
  name: string;
  path: string;
  size: number;
  gzipSize: number;
  brotliSize?: number;
  type: 'js' | 'css' | 'html' | 'other';
  isEntry: boolean;
  isChunk: boolean;
  imports: string[];
  exports: string[];
  modules: ModuleInfo[];
}

/**
 * Chunk information
 */
interface ChunkInfo {
  id: string;
  name: string;
  size: number;
  files: string[];
  parents: string[];
  children: string[];
  modules: string[];
  reason: string;
  rendered: boolean;
}

/**
 * Asset information
 */
interface AssetInfo {
  name: string;
  size: number;
  type: 'js' | 'css' | 'image' | 'font' | 'other';
  compression?: {
    gzip: number;
    brotli?: number;
  };
  cached: boolean;
  prefetched: boolean;
  preloaded: boolean;
}

/**
 * Module information
 */
interface ModuleInfo {
  id: string;
  name: string;
  size: number;
  source?: string;
  reasons: string[];
  chunks: string[];
  issuer?: string;
  failed: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Dependency analysis
 */
interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  type: 'dependency' | 'devDependency' | 'peerDependency';
  license: string;
  vulnerabilities: VulnerabilityInfo[];
  bundled: boolean;
  treeshaken: boolean;
  usagePercentage: number;
}

/**
 * Vulnerability information
 */
interface VulnerabilityInfo {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  reference: string;
}

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  buildTime: number;
  totalSize: number;
  totalGzipSize: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
  chunkCount: number;
  moduleCount: number;
  duplicatedModules: string[];
  largestBundles: Array<{ name: string; size: number }>;
  unusedExports: string[];
  circularDependencies: string[][];
}

/**
 * Budget configuration
 */
interface BudgetConfig {
  maximumFileSizeBudget: number;
  maximumChunkSizeBudget: number;
  maximumAssetSizeBudget: number;
  maximumEntrypointSizeBudget: number;
  performance: {
    maxInitialChunkSize: number;
    maxAsyncChunkSize: number;
    maxOverallSize: number;
  };
  limits: {
    javascript: number;
    css: number;
    images: number;
    fonts: number;
    other: number;
  };
}

/**
 * Budget check results
 */
interface BudgetCheck {
  passed: boolean;
  violations: BudgetViolation[];
  warnings: BudgetWarning[];
  summary: {
    totalViolations: number;
    totalWarnings: number;
    budgetUtilization: number;
  };
}

/**
 * Budget violation
 */
interface BudgetViolation {
  type: 'file' | 'chunk' | 'asset' | 'entrypoint' | 'overall';
  name: string;
  actual: number;
  budget: number;
  excess: number;
  severity: 'warning' | 'error';
  suggestion?: string;
}

/**
 * Budget warning
 */
interface BudgetWarning {
  type: 'approaching_limit' | 'duplicate_module' | 'unused_export' | 'circular_dependency';
  message: string;
  details: any;
}

/**
 * Comparison with previous build
 */
interface BundleComparison {
  previous?: BundleAnalysis;
  current: BundleAnalysis;
  changes: {
    sizeDelta: number;
    gzipSizeDelta: number;
    newFiles: string[];
    removedFiles: string[];
    modifiedFiles: Array<{
      name: string;
      sizeDelta: number;
      gzipSizeDelta: number;
    }>;
  };
  regressions: BudgetViolation[];
  improvements: Array<{
    name: string;
    improvement: number;
    type: 'size' | 'performance';
  }>;
}

/**
 * Bundle analyzer class
 */
class BundleAnalyzer {
  private budgetConfig: BudgetConfig;
  private analysisHistory: BundleAnalysis[] = [];
  private maxHistoryEntries = 50;

  constructor() {
    this.budgetConfig = this.loadBudgetConfig();
    this.loadAnalysisHistory();
  }

  /**
   * Load budget configuration
   */
  private loadBudgetConfig(): BudgetConfig {
    const defaultConfig: BudgetConfig = {
      maximumFileSizeBudget: 250 * 1024, // 250KB
      maximumChunkSizeBudget: 500 * 1024, // 500KB
      maximumAssetSizeBudget: 100 * 1024, // 100KB
      maximumEntrypointSizeBudget: 1024 * 1024, // 1MB
      performance: {
        maxInitialChunkSize: 512 * 1024, // 512KB
        maxAsyncChunkSize: 256 * 1024, // 256KB
        maxOverallSize: 5 * 1024 * 1024, // 5MB
      },
      limits: {
        javascript: 2 * 1024 * 1024, // 2MB
        css: 200 * 1024, // 200KB
        images: 1024 * 1024, // 1MB
        fonts: 500 * 1024, // 500KB
        other: 300 * 1024, // 300KB
      },
    };

    try {
      const configPath = join(process.cwd(), 'performance-budget.json');
      if (existsSync(configPath)) {
        const userConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
        return { ...defaultConfig, ...userConfig };
      }
    } catch (error) {
      logger.warn('Failed to load custom budget config, using defaults', { error });
    }

    return defaultConfig;
  }

  /**
   * Load analysis history
   */
  private loadAnalysisHistory(): void {
    try {
      const historyPath = join(process.cwd(), '.next/bundle-analysis-history.json');
      if (existsSync(historyPath)) {
        const history = JSON.parse(readFileSync(historyPath, 'utf-8'));
        this.analysisHistory = history.slice(-this.maxHistoryEntries);
      }
    } catch (error) {
      logger.warn('Failed to load bundle analysis history', { error });
    }
  }

  /**
   * Save analysis history
   */
  private saveAnalysisHistory(): void {
    try {
      const historyPath = join(process.cwd(), '.next/bundle-analysis-history.json');
      writeFileSync(historyPath, JSON.stringify(this.analysisHistory, null, 2));
    } catch (error) {
      logger.error('Failed to save bundle analysis history', { error });
    }
  }

  /**
   * Analyze Next.js build output
   */
  public async analyzeBuild(buildOutputPath: string = '.next'): Promise<BundleAnalysis> {
    const startTime = Date.now();
    
    logger.info('Starting bundle analysis', { buildOutputPath });

    try {
      const analysis: BundleAnalysis = {
        timestamp: new Date().toISOString(),
        commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA,
        branch: process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME,
        buildId: process.env.VERCEL_BUILD_ID || process.env.GITHUB_RUN_ID,
        bundles: [],
        chunks: [],
        assets: [],
        dependencies: [],
        performance: this.initializePerformanceMetrics(),
        budget: this.initializeBudgetCheck()
      };

      // Analyze build manifest
      await this.analyzeBuildManifest(buildOutputPath, analysis);
      
      // Analyze static assets
      await this.analyzeStaticAssets(buildOutputPath, analysis);
      
      // Analyze dependencies
      await this.analyzeDependencies(analysis);
      
      // Calculate performance metrics
      this.calculatePerformanceMetrics(analysis);
      
      // Check budget compliance
      this.checkBudgets(analysis);
      
      // Add to history
      this.analysisHistory.push(analysis);
      this.analysisHistory = this.analysisHistory.slice(-this.maxHistoryEntries);
      this.saveAnalysisHistory();

      const duration = Date.now() - startTime;
      logger.info('Bundle analysis completed', {
        duration,
        totalSize: analysis.performance.totalSize,
        budgetPassed: analysis.budget.passed,
        violations: analysis.budget.violations.length
      });

      return analysis;

    } catch (error) {
      logger.error('Bundle analysis failed', { error });
      throw error;
    }
  }

  /**
   * Initialize performance metrics
   */
  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      buildTime: 0,
      totalSize: 0,
      totalGzipSize: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      chunkCount: 0,
      moduleCount: 0,
      duplicatedModules: [],
      largestBundles: [],
      unusedExports: [],
      circularDependencies: []
    };
  }

  /**
   * Initialize budget check
   */
  private initializeBudgetCheck(): BudgetCheck {
    return {
      passed: true,
      violations: [],
      warnings: [],
      summary: {
        totalViolations: 0,
        totalWarnings: 0,
        budgetUtilization: 0
      }
    };
  }

  /**
   * Analyze build manifest
   */
  private async analyzeBuildManifest(buildPath: string, analysis: BundleAnalysis): Promise<void> {
    try {
      // Next.js build manifest
      const manifestPath = join(buildPath, 'build-manifest.json');
      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        await this.processBuildManifest(manifest, analysis);
      }

      // Webpack stats (if available)
      const statsPath = join(buildPath, 'webpack-stats.json');
      if (existsSync(statsPath)) {
        const stats = JSON.parse(readFileSync(statsPath, 'utf-8'));
        await this.processWebpackStats(stats, analysis);
      }

    } catch (error) {
      logger.error('Failed to analyze build manifest', { error });
    }
  }

  /**
   * Process build manifest
   */
  private async processBuildManifest(manifest: any, analysis: BundleAnalysis): Promise<void> {
    // Process pages and their dependencies
    for (const [page, files] of Object.entries(manifest.pages || {})) {
      if (Array.isArray(files)) {
        for (const file of files) {
          const filePath = join('.next/static', file);
          if (existsSync(filePath)) {
            const bundle = await this.analyzeBundleFile(filePath, file, page);
            analysis.bundles.push(bundle);
          }
        }
      }
    }
  }

  /**
   * Process webpack stats
   */
  private async processWebpackStats(stats: any, analysis: BundleAnalysis): Promise<void> {
    if (stats.chunks) {
      for (const chunk of stats.chunks) {
        const chunkInfo: ChunkInfo = {
          id: chunk.id,
          name: chunk.names?.[0] || `chunk-${chunk.id}`,
          size: chunk.size || 0,
          files: chunk.files || [],
          parents: chunk.parents || [],
          children: chunk.children || [],
          modules: chunk.modules?.map((m: any) => m.id) || [],
          reason: chunk.reason || 'unknown',
          rendered: chunk.rendered !== false
        };
        analysis.chunks.push(chunkInfo);
      }
    }

    if (stats.modules) {
      analysis.performance.moduleCount = stats.modules.length;
      
      // Find duplicated modules
      const moduleNames = new Map<string, number>();
      for (const module of stats.modules) {
        const count = moduleNames.get(module.name) || 0;
        moduleNames.set(module.name, count + 1);
      }
      
      analysis.performance.duplicatedModules = Array.from(moduleNames.entries())
        .filter(([, count]) => count > 1)
        .map(([name]) => name);
    }
  }

  /**
   * Analyze individual bundle file
   */
  private async analyzeBundleFile(filePath: string, fileName: string, entryPoint: string): Promise<BundleInfo> {
    const stats = require('fs').statSync(filePath);
    const content = readFileSync(filePath);
    
    // Simulate gzip compression calculation
    const gzipSize = Math.floor(stats.size * 0.3); // Rough estimate
    
    return {
      name: fileName,
      path: filePath,
      size: stats.size,
      gzipSize,
      type: this.getFileType(fileName),
      isEntry: entryPoint !== 'unknown',
      isChunk: fileName.includes('chunks/'),
      imports: this.extractImports(content.toString()),
      exports: this.extractExports(content.toString()),
      modules: []
    };
  }

  /**
   * Get file type from extension
   */
  private getFileType(fileName: string): 'js' | 'css' | 'html' | 'other' {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return 'js';
      case 'css':
      case 'scss':
      case 'sass':
        return 'css';
      case 'html':
        return 'html';
      default:
        return 'other';
    }
  }

  /**
   * Extract imports from code (simplified)
   */
  private extractImports(content: string): string[] {
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  /**
   * Extract exports from code (simplified)
   */
  private extractExports(content: string): string[] {
    const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    const exports: string[] = [];
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }

  /**
   * Analyze static assets
   */
  private async analyzeStaticAssets(buildPath: string, analysis: BundleAnalysis): Promise<void> {
    try {
      const staticPath = join(buildPath, 'static');
      if (existsSync(staticPath)) {
        await this.processStaticDirectory(staticPath, analysis);
      }
    } catch (error) {
      logger.error('Failed to analyze static assets', { error });
    }
  }

  /**
   * Process static directory
   */
  private async processStaticDirectory(dirPath: string, analysis: BundleAnalysis): Promise<void> {
    const fs = require('fs');
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isFile()) {
        const asset: AssetInfo = {
          name: item,
          size: stats.size,
          type: this.getAssetType(item),
          cached: true,
          prefetched: false,
          preloaded: false
        };
        
        analysis.assets.push(asset);
      } else if (stats.isDirectory()) {
        await this.processStaticDirectory(itemPath, analysis);
      }
    }
  }

  /**
   * Get asset type
   */
  private getAssetType(fileName: string): 'js' | 'css' | 'image' | 'font' | 'other' {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext || '')) return 'js';
    if (['css', 'scss', 'sass'].includes(ext || '')) return 'css';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
    if (['woff', 'woff2', 'ttf', 'eot', 'otf'].includes(ext || '')) return 'font';
    
    return 'other';
  }

  /**
   * Analyze dependencies
   */
  private async analyzeDependencies(analysis: BundleAnalysis): Promise<void> {
    try {
      const packageJsonPath = join(process.cwd(), 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        
        // Process dependencies
        await this.processDependencies(packageJson.dependencies || {}, 'dependency', analysis);
        await this.processDependencies(packageJson.devDependencies || {}, 'devDependency', analysis);
        await this.processDependencies(packageJson.peerDependencies || {}, 'peerDependency', analysis);
      }
    } catch (error) {
      logger.error('Failed to analyze dependencies', { error });
    }
  }

  /**
   * Process dependencies
   */
  private async processDependencies(
    deps: Record<string, string>,
    type: 'dependency' | 'devDependency' | 'peerDependency',
    analysis: BundleAnalysis
  ): Promise<void> {
    for (const [name, version] of Object.entries(deps)) {
      const depInfo: DependencyInfo = {
        name,
        version,
        size: 0, // Would need actual size calculation
        type,
        license: 'unknown',
        vulnerabilities: [],
        bundled: type === 'dependency',
        treeshaken: false,
        usagePercentage: 0
      };
      
      analysis.dependencies.push(depInfo);
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(analysis: BundleAnalysis): void {
    const { bundles, assets } = analysis;
    
    // Calculate total sizes
    analysis.performance.totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
    analysis.performance.totalGzipSize = bundles.reduce((sum, bundle) => sum + bundle.gzipSize, 0);
    
    // Calculate by type
    analysis.performance.jsSize = bundles
      .filter(b => b.type === 'js')
      .reduce((sum, bundle) => sum + bundle.size, 0);
    
    analysis.performance.cssSize = bundles
      .filter(b => b.type === 'css')
      .reduce((sum, bundle) => sum + bundle.size, 0);
    
    analysis.performance.imageSize = assets
      .filter(a => a.type === 'image')
      .reduce((sum, asset) => sum + asset.size, 0);
    
    // Other metrics
    analysis.performance.chunkCount = analysis.chunks.length;
    
    // Largest bundles
    analysis.performance.largestBundles = bundles
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .map(bundle => ({ name: bundle.name, size: bundle.size }));
  }

  /**
   * Check budget compliance
   */
  private checkBudgets(analysis: BundleAnalysis): void {
    const violations: BudgetViolation[] = [];
    const warnings: BudgetWarning[] = [];

    // Check file size budgets
    for (const bundle of analysis.bundles) {
      if (bundle.size > this.budgetConfig.maximumFileSizeBudget) {
        violations.push({
          type: 'file',
          name: bundle.name,
          actual: bundle.size,
          budget: this.budgetConfig.maximumFileSizeBudget,
          excess: bundle.size - this.budgetConfig.maximumFileSizeBudget,
          severity: 'error',
          suggestion: 'Consider code splitting or lazy loading'
        });
      }
    }

    // Check chunk size budgets
    for (const chunk of analysis.chunks) {
      if (chunk.size > this.budgetConfig.maximumChunkSizeBudget) {
        violations.push({
          type: 'chunk',
          name: chunk.name,
          actual: chunk.size,
          budget: this.budgetConfig.maximumChunkSizeBudget,
          excess: chunk.size - this.budgetConfig.maximumChunkSizeBudget,
          severity: 'error',
          suggestion: 'Split large chunks into smaller pieces'
        });
      }
    }

    // Check overall size budget
    if (analysis.performance.totalSize > this.budgetConfig.performance.maxOverallSize) {
      violations.push({
        type: 'overall',
        name: 'Total bundle size',
        actual: analysis.performance.totalSize,
        budget: this.budgetConfig.performance.maxOverallSize,
        excess: analysis.performance.totalSize - this.budgetConfig.performance.maxOverallSize,
        severity: 'error',
        suggestion: 'Reduce overall bundle size through optimization'
      });
    }

    // Check type-specific limits
    if (analysis.performance.jsSize > this.budgetConfig.limits.javascript) {
      violations.push({
        type: 'asset',
        name: 'JavaScript size',
        actual: analysis.performance.jsSize,
        budget: this.budgetConfig.limits.javascript,
        excess: analysis.performance.jsSize - this.budgetConfig.limits.javascript,
        severity: 'warning',
        suggestion: 'Optimize JavaScript bundles'
      });
    }

    // Check for warnings
    if (analysis.performance.duplicatedModules.length > 0) {
      warnings.push({
        type: 'duplicate_module',
        message: 'Duplicated modules found',
        details: analysis.performance.duplicatedModules
      });
    }

    analysis.budget = {
      passed: violations.filter(v => v.severity === 'error').length === 0,
      violations,
      warnings,
      summary: {
        totalViolations: violations.length,
        totalWarnings: warnings.length,
        budgetUtilization: analysis.performance.totalSize / this.budgetConfig.performance.maxOverallSize
      }
    };
  }

  /**
   * Compare with previous build
   */
  public compareWithPrevious(current: BundleAnalysis): BundleComparison | null {
    const previous = this.analysisHistory[this.analysisHistory.length - 2];
    if (!previous) return null;

    const comparison: BundleComparison = {
      previous,
      current,
      changes: {
        sizeDelta: current.performance.totalSize - previous.performance.totalSize,
        gzipSizeDelta: current.performance.totalGzipSize - previous.performance.totalGzipSize,
        newFiles: [],
        removedFiles: [],
        modifiedFiles: []
      },
      regressions: [],
      improvements: []
    };

    // Find file changes
    const currentFiles = new Set(current.bundles.map(b => b.name));
    const previousFiles = new Set(previous.bundles.map(b => b.name));
    
    comparison.changes.newFiles = Array.from(currentFiles).filter(f => !previousFiles.has(f));
    comparison.changes.removedFiles = Array.from(previousFiles).filter(f => !currentFiles.has(f));

    // Find modified files
    for (const currentBundle of current.bundles) {
      const previousBundle = previous.bundles.find(b => b.name === currentBundle.name);
      if (previousBundle && currentBundle.size !== previousBundle.size) {
        comparison.changes.modifiedFiles.push({
          name: currentBundle.name,
          sizeDelta: currentBundle.size - previousBundle.size,
          gzipSizeDelta: currentBundle.gzipSize - previousBundle.gzipSize
        });
      }
    }

    // Find regressions and improvements
    if (comparison.changes.sizeDelta > 0) {
      comparison.regressions.push({
        type: 'overall',
        name: 'Total bundle size increased',
        actual: current.performance.totalSize,
        budget: previous.performance.totalSize,
        excess: comparison.changes.sizeDelta,
        severity: 'warning'
      });
    } else if (comparison.changes.sizeDelta < 0) {
      comparison.improvements.push({
        name: 'Total bundle size decreased',
        improvement: Math.abs(comparison.changes.sizeDelta),
        type: 'size'
      });
    }

    return comparison;
  }

  /**
   * Generate CI/CD report
   */
  public generateCIReport(analysis: BundleAnalysis): string {
    const comparison = this.compareWithPrevious(analysis);
    
    let report = '# Bundle Analysis Report\n\n';
    
    // Summary
    report += '## Summary\n';
    report += `- **Total Size**: ${this.formatSize(analysis.performance.totalSize)}\n`;
    report += `- **Gzip Size**: ${this.formatSize(analysis.performance.totalGzipSize)}\n`;
    report += `- **Bundles**: ${analysis.bundles.length}\n`;
    report += `- **Budget Status**: ${analysis.budget.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;

    // Budget violations
    if (analysis.budget.violations.length > 0) {
      report += '## Budget Violations\n';
      for (const violation of analysis.budget.violations) {
        const emoji = violation.severity === 'error' ? '🚨' : '⚠️';
        report += `${emoji} **${violation.name}**: ${this.formatSize(violation.actual)} (budget: ${this.formatSize(violation.budget)}, excess: ${this.formatSize(violation.excess)})\n`;
        if (violation.suggestion) {
          report += `   *Suggestion: ${violation.suggestion}*\n`;
        }
      }
      report += '\n';
    }

    // Comparison with previous build
    if (comparison) {
      report += '## Changes from Previous Build\n';
      const sizeDelta = comparison.changes.sizeDelta;
      const emoji = sizeDelta > 0 ? '📈' : sizeDelta < 0 ? '📉' : '➡️';
      report += `${emoji} **Size Change**: ${this.formatSizeDelta(sizeDelta)}\n`;
      
      if (comparison.changes.newFiles.length > 0) {
        report += `📄 **New Files**: ${comparison.changes.newFiles.length}\n`;
      }
      
      if (comparison.changes.removedFiles.length > 0) {
        report += `🗑️ **Removed Files**: ${comparison.changes.removedFiles.length}\n`;
      }
      
      if (comparison.regressions.length > 0) {
        report += `⚠️ **Regressions**: ${comparison.regressions.length}\n`;
      }
      
      if (comparison.improvements.length > 0) {
        report += `✨ **Improvements**: ${comparison.improvements.length}\n`;
      }
      
      report += '\n';
    }

    // Largest bundles
    report += '## Largest Bundles\n';
    for (const bundle of analysis.performance.largestBundles.slice(0, 5)) {
      report += `- **${bundle.name}**: ${this.formatSize(bundle.size)}\n`;
    }

    return report;
  }

  /**
   * Format file size
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Format size delta
   */
  private formatSizeDelta(delta: number): string {
    const sign = delta > 0 ? '+' : '';
    return `${sign}${this.formatSize(Math.abs(delta))}`;
  }

  /**
   * Get latest analysis
   */
  public getLatestAnalysis(): BundleAnalysis | null {
    return this.analysisHistory[this.analysisHistory.length - 1] || null;
  }

  /**
   * Get analysis history
   */
  public getAnalysisHistory(): BundleAnalysis[] {
    return [...this.analysisHistory];
  }

  /**
   * Export data for external tools
   */
  public exportData(): {
    latest: BundleAnalysis | null;
    history: BundleAnalysis[];
    budget: BudgetConfig;
  } {
    return {
      latest: this.getLatestAnalysis(),
      history: this.getAnalysisHistory(),
      budget: this.budgetConfig
    };
  }
}

// Create singleton instance
export const bundleAnalyzer = new BundleAnalyzer();

// Export types
export type {
  BundleAnalysis,
  BundleInfo,
  BudgetConfig,
  BudgetCheck,
  BudgetViolation,
  BundleComparison,
  PerformanceMetrics
};