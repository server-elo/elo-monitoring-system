/**
 * React Hook for Gas Analysis Integration
 * 
 * Provides easy integration of the GasOptimizationAnalyzer with React components
 * and Monaco Editor instances for real-time gas cost visualization.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { editor, Range } from 'monaco-editor';
import { 
  GasOptimizationAnalyzer, 
  GasAnalysisResult, 
  GasOptimization 
} from '@/lib/gas/GasOptimizationAnalyzer';

interface UseGasAnalysisOptions {
  enableRealtime?: boolean;
  enableHeatmap?: boolean;
  debounceMs?: number;
  autoAnalyze?: boolean;
}

interface UseGasAnalysisReturn {
  analysisResult: GasAnalysisResult | null;
  isAnalyzing: boolean;
  lastError: Error | null;
  analyzer: GasOptimizationAnalyzer | null;
  performAnalysis: () => Promise<void>;
  clearResults: () => void;
  toggleHeatmap: (enabled: boolean) => void;
  applyOptimization: (optimization: GasOptimization) => Promise<boolean>;
  jumpToOptimization: (optimization: GasOptimization) => void;
  getGasMetrics: () => GasMetrics;
}

interface GasMetrics {
  totalCost: number;
  potentialSavings: number;
  savingsPercentage: number;
  optimizationCount: number;
  easyOptimizations: number;
  mediumOptimizations: number;
  hardOptimizations: number;
  highImpactOptimizations: number;
  averageSavingsPerOptimization: number;
}

export function useGasAnalysis(
  editorInstance: editorInstance.IStandaloneCodeEditor | null,
  userId: string,
  options: UseGasAnalysisOptions = {}
): UseGasAnalysisReturn {
  const [analysisResult, setAnalysisResult] = useState<GasAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [analyzer, setAnalyzer] = useState<GasOptimizationAnalyzer | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(options.enableHeatmap ?? false);
  
  const analyzerRef = useRef<GasOptimizationAnalyzer | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize analyzer when editor is available
  useEffect(() => {
    if (!editorInstance) {
      return;
    }

    try {
      const newAnalyzer = new GasOptimizationAnalyzer(editorInstance);
      setAnalyzer(newAnalyzer);
      analyzerRef.current = newAnalyzer;

      // Setup auto-analysis if enabled
      if (options.autoAnalyze) {
        const model = editorInstance.getModel();
        if (model) {
          const disposable = model.onDidChangeContent(() => {
            scheduleAnalysis();
          });

          return () => {
            disposable.dispose();
            newAnalyzer.dispose();
            analyzerRef.current = null;
          };
        }
      }

      return () => {
        newAnalyzer.dispose();
        analyzerRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize gas analyzer:', error);
      setLastError(error instanceof Error ? error : new Error('Analyzer initialization failed'));
    }
  }, [editorInstance, options.autoAnalyze]);

  // Schedule analysis with debouncing
  const scheduleAnalysis = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performAnalysis().catch(console.error);
    }, options.debounceMs ?? 3000); // 3 second debounce for gas analysis
  }, [options.debounceMs]);

  // Perform gas analysis
  const performAnalysis = useCallback(async () => {
    if (!analyzerRef.current || !userId) {
      throw new Error('Analyzer not initialized or user ID missing');
    }

    if (isAnalyzing) {
      return; // Prevent concurrent analyses
    }

    try {
      setIsAnalyzing(true);
      setLastError(null);

      const result = await analyzerRef.current.analyzeGasUsage(userId);
      setAnalysisResult(result);

      // Apply heatmap if enabled
      if (heatmapEnabled) {
        analyzerRef.current.applyHeatmapVisualization(result);
      }

      console.log(`✅ Gas analysis completed: ${result.optimizations.length} optimizations found`);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Gas analysis failed');
      setLastError(errorObj);
      console.error('Gas analysis failed:', errorObj);
      throw errorObj;
    } finally {
      setIsAnalyzing(false);
    }
  }, [userId, isAnalyzing, heatmapEnabled]);

  // Clear analysis results
  const clearResults = useCallback(() => {
    setAnalysisResult(null);
    setLastError(null);
    setIsAnalyzing(false);
    
    if (analyzerRef.current) {
      analyzerRef.current.clearCache();
    }
  }, []);

  // Toggle heatmap visualization
  const toggleHeatmap = useCallback((enabled: boolean) => {
    setHeatmapEnabled(enabled);
    
    if (analyzerRef.current && analysisResult) {
      if (enabled) {
        analyzerRef.current.applyHeatmapVisualization(analysisResult);
      } else {
        // Clear heatmap decorations
        analyzerRef.current.dispose();
        // Reinitialize without heatmap
        if (editorInstance) {
          const newAnalyzer = new GasOptimizationAnalyzer(editorInstance);
          setAnalyzer(newAnalyzer);
          analyzerRef.current = newAnalyzer;
        }
      }
    }
  }, [analysisResult, editor]);

  // Apply a gas optimization
  const applyOptimization = useCallback(async (optimization: GasOptimization): Promise<boolean> => {
    if (!editor || !optimization.autoFixAvailable) {
      return false;
    }

    try {
      const model = editorInstance.getModel();
      if (!model) return false;

      // Apply the optimization
      const range = new Range(
        optimization.line,
        optimization.column,
        optimization.endLine,
        optimization.endColumn
      );

      editorInstance.executeEdits('gas-optimization', [{
        range,
        text: optimization.afterCode,
        forceMoveMarkers: true
      }]);

      // Trigger re-analysis after a short delay
      setTimeout(() => {
        performAnalysis().catch(console.error);
      }, 1000);

      return true;
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      return false;
    }
  }, [editorInstance, performAnalysis]);

  // Jump to optimization location in editor
  const jumpToOptimization = useCallback((optimization: GasOptimization) => {
    if (!editorInstance) return;

    const range = new Range(
      optimization.line,
      optimization.column,
      optimization.endLine,
      optimization.endColumn
    );

    editorInstance.setSelection(range);
    editorInstance.revealRangeInCenter(range);
    editorInstance.focus();
  }, [editor]);

  // Calculate gas metrics
  const getGasMetrics = useCallback((): GasMetrics => {
    if (!analysisResult) {
      return {
        totalCost: 0,
        potentialSavings: 0,
        savingsPercentage: 0,
        optimizationCount: 0,
        easyOptimizations: 0,
        mediumOptimizations: 0,
        hardOptimizations: 0,
        highImpactOptimizations: 0,
        averageSavingsPerOptimization: 0
      };
    }

    const optimizations = analysisResult.optimizations;
    const totalCost = analysisResult.totalGasCost;
    const potentialSavings = analysisResult.totalSavings;
    const savingsPercentage = totalCost > 0 ? (potentialSavings / totalCost) * 100 : 0;

    const easyOptimizations = optimizations.filter(opt => opt.difficulty === 'easy').length;
    const mediumOptimizations = optimizations.filter(opt => opt.difficulty === 'medium').length;
    const hardOptimizations = optimizations.filter(opt => opt.difficulty === 'hard').length;
    const highImpactOptimizations = optimizations.filter(opt => opt.impact === 'high').length;

    const averageSavingsPerOptimization = optimizations.length > 0 
      ? potentialSavings / optimizations.length 
      : 0;

    return {
      totalCost,
      potentialSavings,
      savingsPercentage,
      optimizationCount: optimizations.length,
      easyOptimizations,
      mediumOptimizations,
      hardOptimizations,
      highImpactOptimizations,
      averageSavingsPerOptimization
    };
  }, [analysisResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    analysisResult,
    isAnalyzing,
    lastError,
    analyzer,
    performAnalysis,
    clearResults,
    toggleHeatmap,
    applyOptimization,
    jumpToOptimization,
    getGasMetrics
  };
}

// Custom hook for gas optimization recommendations
export function useGasOptimizationRecommendations(analysisResult: GasAnalysisResult | null) {
  const recommendations = [];

  if (!analysisResult) {
    return recommendations;
  }

  const metrics = {
    totalCost: analysisResult.totalGasCost,
    savings: analysisResult.totalSavings,
    optimizations: analysisResult.optimizations
  };

  // High gas cost warning
  if (metrics.totalCost > 1000000) {
    recommendations.push({
      type: 'warning',
      title: 'High Gas Cost Detected',
      message: `Total gas cost of ${(metrics.totalCost / 1000000).toFixed(1)}M is very high. Consider major optimizations.`,
      priority: 'high'
    });
  }

  // Easy wins available
  const easyOptimizations = metrics.optimizations.filter(opt => opt.difficulty === 'easy');
  if (easyOptimizations.length > 0) {
    recommendations.push({
      type: 'success',
      title: 'Easy Optimizations Available',
      message: `${easyOptimizations.length} easy optimization${easyOptimizations.length !== 1 ? 's' : ''} can save ${easyOptimizations.reduce((sum, opt) => sum + opt.savings, 0)} gas.`,
      priority: 'medium'
    });
  }

  // High impact optimizations
  const highImpactOptimizations = metrics.optimizations.filter(opt => opt.impact === 'high');
  if (highImpactOptimizations.length > 0) {
    recommendations.push({
      type: 'info',
      title: 'High Impact Optimizations',
      message: `${highImpactOptimizations.length} high-impact optimization${highImpactOptimizations.length !== 1 ? 's' : ''} available for significant gas savings.`,
      priority: 'high'
    });
  }

  // Storage optimization focus
  const storageOptimizations = metrics.optimizations.filter(opt => opt.category === 'storage');
  if (storageOptimizations.length > 2) {
    recommendations.push({
      type: 'info',
      title: 'Storage Optimization Focus',
      message: 'Multiple storage optimizations available. Focus on storage packing and access patterns.',
      priority: 'medium'
    });
  }

  // Good optimization coverage
  if (metrics.savings > 0 && (metrics.savings / metrics.totalCost) > 0.2) {
    recommendations.push({
      type: 'success',
      title: 'Good Optimization Potential',
      message: `Potential to save ${Math.round((metrics.savings / metrics.totalCost) * 100)}% of gas costs through optimizations.`,
      priority: 'low'
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}
