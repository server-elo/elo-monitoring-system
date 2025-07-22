/**
 * React Hook for Gas Analysis Integration
 * 
 * Provides easy integration of the GasOptimizationAnalyzer with React components
 * and Monaco Editor instances for real-time gas cost visualization.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { GasOptimizationAnalyzer, GasAnalysisResult, GasOptimization } from '@/lib/gas/GasOptimizationAnalyzer';

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
  editorInstance: monaco.editor.IStandaloneCodeEditor | null,
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

  // Initialize analyzer when editor instance changes
  useEffect(() => {
    if (!editorInstance) {
      return;
    }

    try {
      const newAnalyzer = new GasOptimizationAnalyzer(editorInstance);
      setAnalyzer(newAnalyzer);
      analyzerRef.current = newAnalyzer;

      // Set up auto-analysis if enabled
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
    }, options.debounceMs ?? 3000);
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
    
    if (analyzerRef.current) {
      analyzerRef.current.clearDecorations();
    }
  }, []);

  // Toggle heatmap visualization
  const toggleHeatmap = useCallback((enabled: boolean) => {
    setHeatmapEnabled(enabled);
    
    if (analyzerRef.current && analysisResult) {
      if (enabled) {
        analyzerRef.current.applyHeatmapVisualization(analysisResult);
      } else {
        analyzerRef.current.clearDecorations();
      }
    }
  }, [analysisResult]);

  // Apply a specific optimization
  const applyOptimization = useCallback(async (optimization: GasOptimization): Promise<boolean> => {
    if (!analyzerRef.current) {
      throw new Error('Analyzer not initialized');
    }

    try {
      const applied = await analyzerRef.current.applyOptimization(optimization);
      
      if (applied) {
        // Re-analyze after applying optimization
        await performAnalysis();
      }
      
      return applied;
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      return false;
    }
  }, [performAnalysis]);

  // Jump to optimization location in editor
  const jumpToOptimization = useCallback((optimization: GasOptimization) => {
    if (!editorInstance) {
      return;
    }

    editorInstance.revealLineInCenter(optimization.range.startLineNumber);
    editorInstance.setSelection({
      startLineNumber: optimization.range.startLineNumber,
      startColumn: optimization.range.startColumn,
      endLineNumber: optimization.range.endLineNumber,
      endColumn: optimization.range.endColumn
    });
    editorInstance.focus();
  }, [editorInstance]);

  // Get aggregated gas metrics
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
    const potentialSavings = optimizations.reduce((sum, opt) => sum + opt.gasSavings, 0);
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