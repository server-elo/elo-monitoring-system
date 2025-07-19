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
  performAnalysis: () => Promise<void>;
  clearResults: () => void;
  updateConfig: (config: Partial<UseSecurityAnalysisOptions>) => void;
  autoFixIssue: (issue: SecurityIssue) => Promise<boolean>;
  jumpToIssue: (issue: SecurityIssue) => void;
}

export function useSecurityAnalysis(
  editorInstance: editor.IStandaloneCodeEditor | null,
  userId: string,
  options: UseSecurityAnalysisOptions = {}
): UseSecurityAnalysisReturn {
  const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [scanner, setScanner] = useState<SecurityScanner | null>(null);
  
  const scannerRef = useRef<SecurityScanner | null>(null);
  const optionsRef = useRef(options);

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
      const handleScanResult = (result: SecurityScanResult | null) => {
        setScanResult(result);
        setIsScanning(false);
        setLastError(null);
      };

      newScanner.addListener(handleScanResult);

      // The SecurityScanner performs automatic analysis on content changes
      // Set initial scanning state
      setIsScanning(false);

      setScanner(newScanner);
      scannerRef.current = newScanner;

      return () => {
        newScanner.removeListener(handleScanResult);
        newScanner.dispose();
        scannerRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize security scanner:', error);
      setLastError(error instanceof Error ? error : new Error('Scanner initialization failed'));
    }
  }, [editorInstance, userId]);

  // Perform manual analysis
  const performAnalysis = useCallback(async () => {
    if (!scannerRef.current) {
      throw new Error('Scanner not initialized');
    }

    try {
      setIsScanning(true);
      setLastError(null);
      // SecurityScanner automatically analyzes on content changes
      // Force trigger by simulating a minor content change
      if (editorInstance && editorInstance.getModel()) {
        const model = editorInstance.getModel();
        const value = model.getValue();
        // Trigger analysis by updating the model
        model.setValue(value);
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Analysis failed');
      setLastError(errorObj);
      setIsScanning(false);
      throw errorObj;
    }
  }, []);

  // Clear results
  const clearResults = useCallback(() => {
    setScanResult(null);
    setLastError(null);
    setIsScanning(false);
  }, []);

  // Update scanner configuration
  const updateConfig = useCallback((newConfig: Partial<UseSecurityAnalysisOptions>) => {
    if (scannerRef.current) {
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
  const autoFixIssue = useCallback(async (issue: SecurityIssue): Promise<boolean> => {
    if (!editorInstance || !issue.autoFixAvailable) {
      return false;
    }

    try {
      const model = editorInstance.getModel();
      if (!model) return false;

      // Generate auto-fix based on issue type
      const fix = generateAutoFix(issue);
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
        performAnalysis().catch(console.error);
      }, 500);

      return true;
    } catch (error) {
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

    editorInstance.setSelection(range);
    editorInstance.revealRangeInCenter(range);
    editorInstance.focus();
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
function generateAutoFix(issue: SecurityIssue): string | null {
  switch (issue.type) {
    case 'vulnerability':
      if (issue.title.includes('tx.origin')) {
        return 'msg.sender';
      }
      break;
      
    case 'gas-optimization':
      if (issue.title.includes('Function Visibility')) {
        return issue.suggestion.includes('external') ? 'external' : 'public';
      }
      break;
      
    case 'best-practice':
      if (issue.title.includes('Error Message')) {
        // Extract the condition from require statement
        const match = issue.message.match(/require\s*\(\s*([^)]+)\s*\)/);
        if (match) {
          return `require(${match[1]}, "Condition failed")`;
        }
      }
      break;
  }

  return null;
}

// Custom hook for security metrics
export function useSecurityMetrics(scanResult: SecurityScanResult | null) {
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  };

  return {
    ...metrics,
    getScoreColor,
    getScoreLabel
  };
}
