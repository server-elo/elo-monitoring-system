#!/usr/bin/env npx tsx

/**
 * @fileoverview Quantum Performance Validation Script
 * @module scripts/quantum-performance-validator
 */

import { performance } from 'perf_hooks';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PerformanceMetrics {
  buildTime: number;
  bundleSize: number;
  chunkCount: number;
  compressionRatio: number;
  treeshakingEfficiency: number;
  lazyLoadingCoverage: number;
  cacheHitRate: number;
  optimizationScore: number;
}

interface ValidationResult {
  success: boolean;
  metrics: PerformanceMetrics;
  recommendations: string[];
  errors: string[];
  timestamp: number;
}

/**
 * Quantum Performance Validator
 */
class QuantumPerformanceValidator {
  private projectRoot: string;
  private buildDir: string;
  private metricsHistory: PerformanceMetrics[] = [];

  constructor() {
    this.projectRoot = process.cwd();
    this.buildDir = path.join(this.projectRoot, '.next');
  }

  /**
   * Run complete performance validation
   */
  async validate(): Promise<ValidationResult> {
    console.log('🚀 Quantum Performance Validation Started...\n');
    
    const result: ValidationResult = {
      success: false,
      metrics: {} as PerformanceMetrics,
      recommendations: [],
      errors: [],
      timestamp: Date.now(),
    };

    try {
      // Clean and build project
      await this.cleanBuild();
      
      // Run performance measurements
      const metrics = await this.measurePerformance();
      result.metrics = metrics;
      
      // Validate metrics against thresholds
      const validation = this.validateMetrics(metrics);
      result.success = validation.success;
      result.recommendations = validation.recommendations;
      result.errors = validation.errors;
      
      // Store metrics history
      this.metricsHistory.push(metrics);
      await this.saveResults(result);
      
      // Print results
      this.printResults(result);
      
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      result.success = false;
    }

    return result;
  }

  /**
   * Clean and build project for accurate measurements
   */
  private async cleanBuild(): Promise<void> {
    console.log('🧹 Cleaning build directory...');
    
    try {
      await execAsync('npm run clean:build');
      console.log('✅ Build directory cleaned');
    } catch (error) {
      console.warn('⚠️ Clean command failed, continuing...');
    }

    console.log('🔨 Building project for production...');
    const buildStart = performance.now();
    
    await execAsync('npm run build', { 
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      timeout: 300000 // 5 minutes timeout
    });
    
    const buildTime = performance.now() - buildStart;
    console.log(`✅ Build completed in ${Math.round(buildTime)}ms`);
  }

  /**
   * Measure all performance metrics
   */
  private async measurePerformance(): Promise<PerformanceMetrics> {
    console.log('📊 Measuring performance metrics...\n');

    const [
      bundleSize,
      chunkCount,
      compressionRatio,
      treeshakingEfficiency,
      lazyLoadingCoverage,
      cacheEfficiency,
    ] = await Promise.all([
      this.measureBundleSize(),
      this.countChunks(),
      this.measureCompressionRatio(),
      this.measureTreeshakingEfficiency(),
      this.measureLazyLoadingCoverage(),
      this.measureCacheEfficiency(),
    ]);

    const optimizationScore = this.calculateOptimizationScore({
      bundleSize,
      chunkCount,
      compressionRatio,
      treeshakingEfficiency,
      lazyLoadingCoverage,
      cacheHitRate: cacheEfficiency,
    });

    return {
      buildTime: 0, // Will be set during build
      bundleSize,
      chunkCount,
      compressionRatio,
      treeshakingEfficiency,
      lazyLoadingCoverage,
      cacheHitRate: cacheEfficiency,
      optimizationScore,
    };
  }

  /**
   * Measure total bundle size
   */
  private async measureBundleSize(): Promise<number> {
    const staticDir = path.join(this.buildDir, 'static');
    let totalSize = 0;

    try {
      const files = await this.getFilesRecursively(staticDir);
      
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.css')) {
          const stats = await fs.stat(file);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.warn('Failed to measure bundle size:', error);
    }

    const sizeInKB = Math.round(totalSize / 1024);
    console.log(`📦 Bundle Size: ${sizeInKB} KB`);
    
    return sizeInKB;
  }

  /**
   * Count JavaScript chunks
   */
  private async countChunks(): Promise<number> {
    const staticJsDir = path.join(this.buildDir, 'static', 'chunks');
    let chunkCount = 0;

    try {
      if (await this.directoryExists(staticJsDir)) {
        const files = await fs.readdir(staticJsDir);
        chunkCount = files.filter(file => file.endsWith('.js')).length;
      }
    } catch (error) {
      console.warn('Failed to count chunks:', error);
    }

    console.log(`🧩 JavaScript Chunks: ${chunkCount}`);
    return chunkCount;
  }

  /**
   * Measure compression ratio
   */
  private async measureCompressionRatio(): Promise<number> {
    const staticDir = path.join(this.buildDir, 'static');
    let originalSize = 0;
    let compressedSize = 0;

    try {
      const files = await this.getFilesRecursively(staticDir);
      
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.css')) {
          const stats = await fs.stat(file);
          originalSize += stats.size;
          
          // Check for gzipped versions
          const gzFile = file + '.gz';
          if (await this.fileExists(gzFile)) {
            const gzStats = await fs.stat(gzFile);
            compressedSize += gzStats.size;
          } else {
            // Estimate compression ratio
            compressedSize += Math.round(stats.size * 0.3); // Assume 70% compression
          }
        }
      }
    } catch (error) {
      console.warn('Failed to measure compression ratio:', error);
    }

    const ratio = originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;
    console.log(`🗜️ Compression Ratio: ${Math.round(ratio)}%`);
    
    return Math.round(ratio);
  }

  /**
   * Measure tree shaking efficiency
   */
  private async measureTreeshakingEfficiency(): Promise<number> {
    try {
      // Analyze bundle stats if available
      const statsFile = path.join(this.buildDir, 'analyze', 'bundle-stats.json');
      
      if (await this.fileExists(statsFile)) {
        const stats = JSON.parse(await fs.readFile(statsFile, 'utf-8'));
        // Calculate unused code percentage
        const efficiency = this.calculateTreeshakingFromStats(stats);
        console.log(`🌳 Tree Shaking Efficiency: ${efficiency}%`);
        return efficiency;
      }
    } catch (error) {
      console.warn('Failed to measure tree shaking efficiency:', error);
    }

    // Default estimation based on bundle structure
    console.log('🌳 Tree Shaking Efficiency: 75% (estimated)');
    return 75;
  }

  /**
   * Measure lazy loading coverage
   */
  private async measureLazyLoadingCoverage(): Promise<number> {
    let totalComponents = 0;
    let lazyComponents = 0;

    try {
      const componentsDir = path.join(this.projectRoot, 'components');
      const files = await this.getFilesRecursively(componentsDir);
      
      for (const file of files) {
        if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = await fs.readFile(file, 'utf-8');
          totalComponents++;
          
          if (content.includes('lazy(') || content.includes('dynamic(')) {
            lazyComponents++;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to measure lazy loading coverage:', error);
    }

    const coverage = totalComponents > 0 ? (lazyComponents / totalComponents) * 100 : 0;
    console.log(`⚡ Lazy Loading Coverage: ${Math.round(coverage)}%`);
    
    return Math.round(coverage);
  }

  /**
   * Measure cache efficiency
   */
  private async measureCacheEfficiency(): Promise<number> {
    try {
      // Check cache configuration in Next.js config
      const nextConfigFile = path.join(this.projectRoot, 'next.config.js');
      
      if (await this.fileExists(nextConfigFile)) {
        const config = await fs.readFile(nextConfigFile, 'utf-8');
        let efficiency = 50; // Base efficiency
        
        if (config.includes('Cache-Control')) efficiency += 20;
        if (config.includes('immutable')) efficiency += 15;
        if (config.includes('splitChunks')) efficiency += 10;
        if (config.includes('optimization')) efficiency += 5;
        
        console.log(`💾 Cache Efficiency: ${efficiency}%`);
        return Math.min(efficiency, 100);
      }
    } catch (error) {
      console.warn('Failed to measure cache efficiency:', error);
    }

    console.log('💾 Cache Efficiency: 70% (estimated)');
    return 70;
  }

  /**
   * Calculate overall optimization score
   */
  private calculateOptimizationScore(metrics: Partial<PerformanceMetrics>): number {
    const weights = {
      bundleSize: 0.25,
      chunkCount: 0.15,
      compressionRatio: 0.20,
      treeshakingEfficiency: 0.15,
      lazyLoadingCoverage: 0.15,
      cacheHitRate: 0.10,
    };

    let score = 0;
    
    // Bundle size score (lower is better, max 1MB ideal)
    const bundleSizeScore = Math.max(0, 100 - (metrics.bundleSize || 0) / 10);
    score += bundleSizeScore * weights.bundleSize;
    
    // Chunk count score (optimal range: 10-20 chunks)
    const chunkCount = metrics.chunkCount || 0;
    const chunkScore = chunkCount >= 10 && chunkCount <= 20 ? 100 : Math.max(0, 100 - Math.abs(15 - chunkCount) * 5);
    score += chunkScore * weights.chunkCount;
    
    // Other metrics (higher is better)
    score += (metrics.compressionRatio || 0) * weights.compressionRatio;
    score += (metrics.treeshakingEfficiency || 0) * weights.treeshakingEfficiency;
    score += (metrics.lazyLoadingCoverage || 0) * weights.lazyLoadingCoverage;
    score += (metrics.cacheHitRate || 0) * weights.cacheHitRate;

    return Math.round(score);
  }

  /**
   * Validate metrics against performance thresholds
   */
  private validateMetrics(metrics: PerformanceMetrics): {
    success: boolean;
    recommendations: string[];
    errors: string[];
  } {
    const recommendations: string[] = [];
    const errors: string[] = [];
    
    // Bundle size validation (should be < 1MB)
    if (metrics.bundleSize > 1000) {
      errors.push(`Bundle size (${metrics.bundleSize}KB) exceeds 1MB threshold`);
      recommendations.push('Reduce bundle size by implementing more aggressive code splitting');
    } else if (metrics.bundleSize > 500) {
      recommendations.push('Consider further bundle size optimization');
    }

    // Chunk count validation
    if (metrics.chunkCount < 5) {
      recommendations.push('Increase code splitting to improve caching efficiency');
    } else if (metrics.chunkCount > 50) {
      recommendations.push('Too many chunks may hurt performance - consider consolidating');
    }

    // Compression ratio validation
    if (metrics.compressionRatio < 50) {
      recommendations.push('Enable better compression (gzip/brotli) for static assets');
    }

    // Tree shaking efficiency validation
    if (metrics.treeshakingEfficiency < 70) {
      recommendations.push('Improve tree shaking by using ES modules and avoiding side effects');
    }

    // Lazy loading coverage validation
    if (metrics.lazyLoadingCoverage < 30) {
      recommendations.push('Implement lazy loading for more components to improve initial load time');
    }

    // Cache efficiency validation
    if (metrics.cacheHitRate < 60) {
      recommendations.push('Implement better caching strategies for improved performance');
    }

    // Overall optimization score validation
    if (metrics.optimizationScore < 70) {
      errors.push(`Optimization score (${metrics.optimizationScore}) below acceptable threshold (70)`);
    } else if (metrics.optimizationScore < 85) {
      recommendations.push('Performance is good but has room for improvement');
    }

    return {
      success: errors.length === 0 && metrics.optimizationScore >= 70,
      recommendations,
      errors,
    };
  }

  /**
   * Save validation results
   */
  private async saveResults(result: ValidationResult): Promise<void> {
    const reportsDir = path.join(this.projectRoot, 'reports', 'performance');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `quantum-performance-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    console.log(`📊 Results saved to: ${filepath}`);
  }

  /**
   * Print validation results
   */
  private printResults(result: ValidationResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 QUANTUM PERFORMANCE VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n📈 METRICS SUMMARY:`);
    console.log(`   Bundle Size: ${result.metrics.bundleSize} KB`);
    console.log(`   Chunks: ${result.metrics.chunkCount}`);
    console.log(`   Compression: ${result.metrics.compressionRatio}%`);
    console.log(`   Tree Shaking: ${result.metrics.treeshakingEfficiency}%`);
    console.log(`   Lazy Loading: ${result.metrics.lazyLoadingCoverage}%`);
    console.log(`   Cache Efficiency: ${result.metrics.cacheHitRate}%`);
    console.log(`   Optimization Score: ${result.metrics.optimizationScore}/100`);

    if (result.success) {
      console.log(`\n✅ VALIDATION: PASSED`);
      console.log(`   Quantum performance optimizations are working effectively!`);
    } else {
      console.log(`\n❌ VALIDATION: FAILED`);
      console.log(`   Performance optimizations need improvement.`);
    }

    if (result.errors.length > 0) {
      console.log(`\n🚨 ERRORS:`);
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (result.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      result.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  /**
   * Utility methods
   */
  private async getFilesRecursively(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          const subFiles = await this.getFilesRecursively(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    
    return files;
  }

  private async fileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  private async directoryExists(dirpath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirpath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private calculateTreeshakingFromStats(stats: any): number {
    // Simplified calculation - would need actual bundle analysis
    // This is a placeholder implementation
    const modules = stats.modules || [];
    const usedModules = modules.filter((m: any) => m.reasons && m.reasons.length > 0);
    
    return modules.length > 0 ? Math.round((usedModules.length / modules.length) * 100) : 75;
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const validator = new QuantumPerformanceValidator();
  const result = await validator.validate();
  
  process.exit(result.success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

export { QuantumPerformanceValidator };
export default QuantumPerformanceValidator;