'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  SolidityCodeAnalyzer, 
  AnalysisResult, 
  AnalysisIssue, 
  OptimizationSuggestion, 
  SecurityVulnerability 
} from '../analysis/SolidityCodeAnalyzer';
import { useNotifications } from '@/components/ui/NotificationSystem';

export interface AnalyzerState {
  isAnalyzing: boolean;
  lastAnalysis: AnalysisResult | null;
  error: string | null;
  analysisHistory: AnalysisResult[];
}

export interface UseAnalyzerOptions {
  autoAnalyze?: boolean;
  debounceMs?: number;
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onVulnerabilityFound?: (vulnerability: SecurityVulnerability) => void;
  onOptimizationFound?: (optimization: OptimizationSuggestion) => void;
}

/**
 * Hook for analyzing Solidity code for security, gas optimization, and quality
 */
export function useSolidityAnalyzer(options: UseAnalyzerOptions = {}) {
  const {
    autoAnalyze = true,
    debounceMs = 1000,
    onAnalysisComplete,
    onVulnerabilityFound,
    onOptimizationFound
  } = options;

  const analyzerRef = useRef<SolidityCodeAnalyzer | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const { showWarning, showError, showInfo, showSuccess } = useNotifications();

  const [state, setState] = useState<AnalyzerState>({
    isAnalyzing: false,
    lastAnalysis: null,
    error: null,
    analysisHistory: []
  });

  // Initialize analyzer
  useEffect(() => {
    analyzerRef.current = new SolidityCodeAnalyzer();
  }, []);

  // Analyze code
  const analyzeCode = useCallback(async (code: string): Promise<AnalysisResult | null> => {
    if (!analyzerRef.current || !code.trim()) {
      return null;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const result = await new Promise<AnalysisResult>((resolve) => {
        // Simulate async analysis (in real implementation, this might involve web workers)
        setTimeout(() => {
          const analysisResult = analyzerRef.current!.analyze(code);
          resolve(analysisResult);
        }, 100);
      });

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        lastAnalysis: result,
        analysisHistory: [result, ...prev.analysisHistory.slice(0, 9)] // Keep last 10 analyses
      }));

      // Trigger callbacks
      onAnalysisComplete?.(result);

      // Notify about critical vulnerabilities
      const criticalVulnerabilities = result.vulnerabilities.filter(v => v.severity === 'critical');
      if (criticalVulnerabilities.length > 0) {
        showError(
          'Critical Security Issues Found',
          `Found ${criticalVulnerabilities.length} critical security vulnerability(ies)`,
          {
            persistent: true,
            metadata: {
              category: 'security',
              priority: 'critical'
            }
          }
        );
        criticalVulnerabilities.forEach(onVulnerabilityFound);
      }

      // Notify about high-impact optimizations
      const highImpactOptimizations = result.optimizations.filter(o => o.impact === 'high');
      if (highImpactOptimizations.length > 0) {
        showInfo(
          'Gas Optimization Opportunities',
          `Found ${highImpactOptimizations.length} high-impact optimization(s)`,
          {
            duration: 8000,
            metadata: {
              category: 'optimization',
              priority: 'medium'
            }
          }
        );
        highImpactOptimizations.forEach(onOptimizationFound);
      }

      // Show quality score notification
      if (result.quality.score >= 80) {
        showSuccess('Excellent Code Quality', `Quality score: ${result.quality.score}/100`);
      } else if (result.quality.score >= 60) {
        showInfo('Good Code Quality', `Quality score: ${result.quality.score}/100`);
      } else {
        showWarning('Code Quality Needs Improvement', `Quality score: ${result.quality.score}/100`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }));
      showError('Analysis Failed', errorMessage);
      return null;
    }
  }, [onAnalysisComplete, onVulnerabilityFound, onOptimizationFound, showError, showWarning, showInfo, showSuccess]);

  // Debounced analyze function
  const debouncedAnalyze = useCallback((code: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      analyzeCode(code);
    }, debounceMs);
  }, [analyzeCode, debounceMs]);

  // Auto-analyze when enabled
  const autoAnalyzeCode = useCallback((code: string) => {
    if (autoAnalyze) {
      debouncedAnalyze(code);
    }
  }, [autoAnalyze, debouncedAnalyze]);

  // Manual analyze (immediate)
  const manualAnalyze = useCallback((code: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    return analyzeCode(code);
  }, [analyzeCode]);

  // Get issues by severity
  const getIssuesBySeverity = useCallback((severity: AnalysisIssue['severity']) => {
    return state.lastAnalysis?.issues.filter(issue => issue.severity === severity) || [];
  }, [state.lastAnalysis]);

  // Get vulnerabilities by type
  const getVulnerabilitiesByType = useCallback((type: SecurityVulnerability['type']) => {
    return state.lastAnalysis?.vulnerabilities.filter(vuln => vuln.type === type) || [];
  }, [state.lastAnalysis]);

  // Get optimizations by impact
  const getOptimizationsByImpact = useCallback((impact: OptimizationSuggestion['impact']) => {
    return state.lastAnalysis?.optimizations.filter(opt => opt.impact === impact) || [];
  }, [state.lastAnalysis]);

  // Get total gas savings potential
  const getTotalGasSavings = useCallback(() => {
    return state.lastAnalysis?.optimizations.reduce((total, opt) => 
      total + (opt.estimatedSavings || 0), 0
    ) || 0;
  }, [state.lastAnalysis]);

  // Get security score
  const getSecurityScore = useCallback(() => {
    if (!state.lastAnalysis) return 0;
    
    const { vulnerabilities } = state.lastAnalysis;
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;
    
    // Calculate score based on vulnerability severity
    const score = Math.max(0, 100 - (criticalCount * 40 + highCount * 20 + mediumCount * 10 + lowCount * 5));
    return Math.round(score);
  }, [state.lastAnalysis]);

  // Get gas efficiency score
  const getGasEfficiencyScore = useCallback(() => {
    if (!state.lastAnalysis) return 0;
    
    const { optimizations } = state.lastAnalysis;
    const highImpactCount = optimizations.filter(o => o.impact === 'high').length;
    const mediumImpactCount = optimizations.filter(o => o.impact === 'medium').length;
    const lowImpactCount = optimizations.filter(o => o.impact === 'low').length;
    
    // Calculate score based on optimization opportunities
    const score = Math.max(0, 100 - (highImpactCount * 20 + mediumImpactCount * 10 + lowImpactCount * 5));
    return Math.round(score);
  }, [state.lastAnalysis]);

  // Compare with previous analysis
  const compareWithPrevious = useCallback(() => {
    if (state.analysisHistory.length < 2) return null;
    
    const current = state.analysisHistory[0];
    const previous = state.analysisHistory[1];
    
    return {
      issues: {
        added: current.issues.length - previous.issues.length,
        resolved: Math.max(0, previous.issues.length - current.issues.length)
      },
      vulnerabilities: {
        added: current.vulnerabilities.length - previous.vulnerabilities.length,
        resolved: Math.max(0, previous.vulnerabilities.length - current.vulnerabilities.length)
      },
      optimizations: {
        added: current.optimizations.length - previous.optimizations.length,
        resolved: Math.max(0, previous.optimizations.length - current.optimizations.length)
      },
      quality: {
        change: current.quality.score - previous.quality.score
      },
      gasEstimate: {
        change: current.gasEstimate.total - previous.gasEstimate.total
      }
    };
  }, [state.analysisHistory]);

  // Export analysis report
  const exportReport = useCallback((format: 'json' | 'csv' | 'markdown' = 'json') => {
    if (!state.lastAnalysis) return null;
    
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      analysis: state.lastAnalysis,
      summary: {
        totalIssues: state.lastAnalysis.issues.length,
        totalVulnerabilities: state.lastAnalysis.vulnerabilities.length,
        totalOptimizations: state.lastAnalysis.optimizations.length,
        qualityScore: state.lastAnalysis.quality.score,
        securityScore: getSecurityScore(),
        gasEfficiencyScore: getGasEfficiencyScore(),
        estimatedGasSavings: getTotalGasSavings()
      }
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'csv':
        // Simple CSV export (would need more sophisticated implementation)
        return 'Type,Severity,Title,Line,Description\n' +
          state.lastAnalysis.issues.map(issue => 
            `${issue.type},${issue.severity},${issue.title},${issue.line},"${issue.description}"`
          ).join('\n');
      case 'markdown':
        return `# Code Analysis Report\n\n**Generated:** ${timestamp}\n\n## Summary\n\n- **Quality Score:** ${report.summary.qualityScore}/100\n- **Security Score:** ${report.summary.securityScore}/100\n- **Gas Efficiency Score:** ${report.summary.gasEfficiencyScore}/100\n\n## Issues (${report.summary.totalIssues})\n\n${state.lastAnalysis.issues.map(issue => `- **${issue.title}** (Line ${issue.line}): ${issue.description}`).join('\n')}`;
      default:
        return JSON.stringify(report, null, 2);
    }
  }, [state.lastAnalysis, getSecurityScore, getGasEfficiencyScore, getTotalGasSavings]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    ...state,
    
    // Analysis functions
    analyzeCode: manualAnalyze,
    autoAnalyzeCode,
    
    // Query functions
    getIssuesBySeverity,
    getVulnerabilitiesByType,
    getOptimizationsByImpact,
    getTotalGasSavings,
    getSecurityScore,
    getGasEfficiencyScore,
    compareWithPrevious,
    exportReport,
    
    // Computed values
    hasAnalysis: !!state.lastAnalysis,
    totalIssues: state.lastAnalysis?.issues.length || 0,
    totalVulnerabilities: state.lastAnalysis?.vulnerabilities.length || 0,
    totalOptimizations: state.lastAnalysis?.optimizations.length || 0,
    criticalIssues: getIssuesBySeverity('critical').length,
    highIssues: getIssuesBySeverity('high').length,
    qualityScore: state.lastAnalysis?.quality.score || 0,
    complexityScore: state.lastAnalysis?.complexity.cyclomatic || 0,
    gasEstimate: state.lastAnalysis?.gasEstimate.total || 0
  };
}
