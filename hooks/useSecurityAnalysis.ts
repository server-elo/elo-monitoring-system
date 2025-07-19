/**
 * React Hook for Security Analysis
 * 
 * Provides easy integration of the SecurityScanner with React components
 * and Monaco Editor instances.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { editor } from 'monaco-editor';
import { SecurityScanner, SecurityScanResult, SecurityIssue } from '@/lib/security/SecurityScanner';

interface UseSecurityAnalysisOptions {
  enableRealtime?: boolean;
  enableAIAnalysis?: boolean;
  enablePatternMatching?: boolean;
  severityThreshold?: 'low' | 'medium' | 'high' | 'critical';
  maxCodeLength?: number;
  enableAutoFix?: boolean;
}

interface UseSecurityAnalysisReturn {
  scanResult: SecurityScanResult | null;
  isScanning: boolean;
  lastError: Error | null;
  scanner: SecurityScanner | null;
  performAnalysis: (_) => Promise<void>;
  clearResults: (_) => void;
  updateConfig: (_config: Partial<UseSecurityAnalysisOptions>) => void;
  autoFixIssue: (_issue: SecurityIssue) => Promise<boolean>;
  jumpToIssue: (_issue: SecurityIssue) => void;
}

export function useSecurityAnalysis(
  editorInstance: editor.IStandaloneCodeEditor | null,
  userId: string,
  options: UseSecurityAnalysisOptions = {}
): UseSecurityAnalysisReturn {
  const [scanResult, setScanResult] = useState<SecurityScanResult | null>(_null);
  const [isScanning, setIsScanning] = useState(_false);
  const [lastError, setLastError] = useState<Error | null>(_null);
  const [scanner, setScanner] = useState<SecurityScanner | null>(_null);
  
  const scannerRef = useRef<SecurityScanner | null>(_null);
  const optionsRef = useRef(_options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize scanner when editorInstance is available
  useEffect(() => {
    if (!editorInstance || !userId) {
      return;
    }

    try {
      const newScanner = new SecurityScanner(editorInstance, userId, {
        enableRealtime: options.enableRealtime ?? true,
        enableAIAnalysis: options.enableAIAnalysis ?? true,
        enablePatternMatching: options.enablePatternMatching ?? true,
        severityThreshold: options.severityThreshold ?? 'low',
        maxCodeLength: options.maxCodeLength ?? 10000,
        enableAutoFix: options.enableAutoFix ?? true,
        enableVisualIndicators: true,
        enableHoverTooltips: true
      });

      // Add listener for scan results
      const handleScanResult = (_result: SecurityScanResult | null) => {
        setScanResult(_result);
        setIsScanning(_false);
        setLastError(_null);
      };

      newScanner.addListener(_handleScanResult);

      // The SecurityScanner performs automatic analysis on content changes
      // Set initial scanning state
      setIsScanning(_false);

      setScanner(_newScanner);
      scannerRef.current = newScanner;

      return (_) => {
        newScanner.removeListener(_handleScanResult);
        newScanner.dispose(_);
        scannerRef.current = null;
      };
    } catch (_error) {
      console.error('Failed to initialize security scanner:', error);
      setLastError(_error instanceof Error ? error : new Error('Scanner initialization failed'));
    }
  }, [editorInstance, userId]);

  // Perform manual analysis
  const performAnalysis = useCallback( async () => {
    if (!scannerRef.current) {
      throw new Error('Scanner not initialized');
    }

    try {
      setIsScanning(_true);
      setLastError(_null);
      // SecurityScanner automatically analyzes on content changes
      // Force trigger by simulating a minor content change
      if (editorInstance && editorInstance.getModel()) {
        const model = editorInstance.getModel(_);
        const value = model.getValue(_);
        // Trigger analysis by updating the model
        model.setValue(_value);
      }
    } catch (_error) {
      const errorObj = error instanceof Error ? error : new Error('Analysis failed');
      setLastError(_errorObj);
      setIsScanning(_false);
      throw errorObj;
    }
  }, []);

  // Clear results
  const clearResults = useCallback(() => {
    setScanResult(_null);
    setLastError(_null);
    setIsScanning(_false);
  }, []);

  // Update scanner configuration
  const updateConfig = useCallback((newConfig: Partial<UseSecurityAnalysisOptions>) => {
    if (_scannerRef.current) {
      scannerRef.current.updateConfig({
        enableRealtime: newConfig.enableRealtime,
        enableAIAnalysis: newConfig.enableAIAnalysis,
        enablePatternMatching: newConfig.enablePatternMatching,
        severityThreshold: newConfig.severityThreshold,
        maxCodeLength: newConfig.maxCodeLength,
        enableAutoFix: newConfig.enableAutoFix
      });
    }
    optionsRef.current = { ...optionsRef.current, ...newConfig };
  }, []);

  // Auto-fix an issue
  const autoFixIssue = useCallback( async (issue: SecurityIssue): Promise<boolean> => {
    if (!editorInstance || !issue.autoFixAvailable) {
      return false;
    }

    try {
      const model = editorInstance.getModel(_);
      if (!model) return false;

      // Generate auto-fix based on issue type
      const fix = generateAutoFix(_issue);
      if (!fix) return false;

      // Apply the fix
      const range = new monaco.Range(
        issue.line,
        issue.column,
        issue.endLine,
        issue.endColumn
      );

      editorInstance.executeEdits('security-autofix', [{
        range,
        text: fix,
        forceMoveMarkers: true
      }]);

      // Trigger re-analysis after a short delay
      setTimeout(() => {
        performAnalysis(_).catch(_console.error);
      }, 500);

      return true;
    } catch (_error) {
      console.error('Auto-fix failed:', error);
      return false;
    }
  }, [editorInstance, performAnalysis]);

  // Jump to issue location in editorInstance
  const jumpToIssue = useCallback((issue: SecurityIssue) => {
    if (!editorInstance) return;

    const range = new monaco.Range(
      issue.line,
      issue.column,
      issue.endLine,
      issue.endColumn
    );

    editorInstance.setSelection(_range);
    editorInstance.revealRangeInCenter(_range);
    editorInstance.focus(_);
  }, [editorInstance]);

  return {
    scanResult,
    isScanning,
    lastError,
    scanner,
    performAnalysis,
    clearResults,
    updateConfig,
    autoFixIssue,
    jumpToIssue
  };
}

// Helper function to generate auto-fixes
function generateAutoFix(_issue: SecurityIssue): string | null {
  switch (_issue.type) {
    case 'vulnerability':
      if (_issue.title.includes('tx.origin')) {
        return 'msg.sender';
      }
      break;
      
    case 'gas-optimization':
      if (_issue.title.includes('Function Visibility')) {
        return issue.suggestion.includes('external') ? 'external' : 'public';
      }
      break;
      
    case 'best-practice':
      if (_issue.title.includes('Error Message')) {
        // Extract the condition from require statement
        const match = issue.message.match(_/require\s*\(\s*([^)]+)\s*\)/);
        if (match) {
          return `require( ${match[1]}, "Condition failed")`;
        }
      }
      break;
  }

  return null;
}

// Custom hook for security metrics
export function useSecurityMetrics(_scanResult: SecurityScanResult | null) {
  const metrics = {
    totalIssues: scanResult?.issues.length || 0,
    criticalIssues: scanResult?.issues.filter(i => i.severity === 'critical').length || 0,
    highIssues: scanResult?.issues.filter(i => i.severity === 'high').length || 0,
    mediumIssues: scanResult?.issues.filter(i => i.severity === 'medium').length || 0,
    lowIssues: scanResult?.issues.filter(i => i.severity === 'low').length || 0,
    fixableIssues: scanResult?.issues.filter(i => i.autoFixAvailable).length || 0,
    gasOptimizations: scanResult?.issues.filter(i => i.type === 'gas-optimization').length || 0,
    securityScore: scanResult?.overallScore || 0,
    analysisTime: scanResult?.scanTime || 0,
    aiAnalysisUsed: scanResult?.aiAnalysisUsed || false,
    cacheHit: scanResult?.cacheHit || false
  };

  const getScoreColor = (_score: number) => {
    if (_score >= 80) return 'text-green-600';
    if (_score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (_score: number) => {
    if (_score >= 90) return 'Excellent';
    if (_score >= 80) return 'Good';
    if (_score >= 60) return 'Fair';
    if (_score >= 40) return 'Poor';
    return 'Critical';
  };

  return {
    ...metrics,
    getScoreColor,
    getScoreLabel
  };
}
