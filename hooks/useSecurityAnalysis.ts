/**
 * React Hook for Security Analysis Integration
 * 
 * Provides easy integration of the SecurityScanner with React components
 * and Monaco Editor instances for real-time security vulnerability detection.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { SecurityScanner, SecurityScanResult, SecurityVulnerability } from '@/lib/security/SecurityScanner';

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
  applyAutoFix: (vulnerability: SecurityVulnerability) => Promise<boolean>;
  jumpToVulnerability: (vulnerability: SecurityVulnerability) => void;
  getSecurityMetrics: () => SecurityMetrics;
}

interface SecurityMetrics {
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  autoFixableCount: number;
  patternBasedCount: number;
  aiDetectedCount: number;
  securityScore: number;
}

export function useSecurityAnalysis(
  editorInstance: monaco.editor.IStandaloneCodeEditor | null,
  userId: string,
  options: UseSecurityAnalysisOptions = {}
): UseSecurityAnalysisReturn {
  const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [scanner, setScanner] = useState<SecurityScanner | null>(null);
  const scannerRef = useRef<SecurityScanner | null>(null);

  // Initialize scanner when editor instance changes
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

      // Set up event handler for scan results
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
  }, [editorInstance, userId, options.enableRealtime, options.enableAIAnalysis, options.enablePatternMatching, options.severityThreshold, options.maxCodeLength, options.enableAutoFix]);

  // Perform manual security analysis
  const performAnalysis = useCallback(async () => {
    if (!scannerRef.current) {
      throw new Error('Scanner not initialized');
    }

    try {
      setIsScanning(true);
      setLastError(null);
      
      const result = await scannerRef.current.performFullScan();
      setScanResult(result);
      
      console.log(`✅ Security scan completed: ${result.vulnerabilities.length} vulnerabilities found`);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Security scan failed');
      setLastError(errorObj);
      console.error('Security scan failed:', errorObj);
      throw errorObj;
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Clear scan results
  const clearResults = useCallback(() => {
    setScanResult(null);
    setLastError(null);
    
    if (scannerRef.current) {
      scannerRef.current.clearDecorations();
    }
  }, []);

  // Apply auto-fix for a vulnerability
  const applyAutoFix = useCallback(async (vulnerability: SecurityVulnerability): Promise<boolean> => {
    if (!scannerRef.current) {
      throw new Error('Scanner not initialized');
    }

    if (!vulnerability.autoFixAvailable || !vulnerability.suggestedFix) {
      return false;
    }

    try {
      const applied = await scannerRef.current.applyAutoFix(vulnerability);
      
      if (applied) {
        // Re-scan after applying fix
        await performAnalysis();
      }
      
      return applied;
    } catch (error) {
      console.error('Failed to apply auto-fix:', error);
      return false;
    }
  }, [performAnalysis]);

  // Jump to vulnerability location in editor
  const jumpToVulnerability = useCallback((vulnerability: SecurityVulnerability) => {
    if (!editorInstance) {
      return;
    }

    editorInstance.revealLineInCenter(vulnerability.range.startLineNumber);
    editorInstance.setSelection({
      startLineNumber: vulnerability.range.startLineNumber,
      startColumn: vulnerability.range.startColumn,
      endLineNumber: vulnerability.range.endLineNumber,
      endColumn: vulnerability.range.endColumn
    });
    editorInstance.focus();
  }, [editorInstance]);

  // Get aggregated security metrics
  const getSecurityMetrics = useCallback((): SecurityMetrics => {
    if (!scanResult) {
      return {
        totalVulnerabilities: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        autoFixableCount: 0,
        patternBasedCount: 0,
        aiDetectedCount: 0,
        securityScore: 100
      };
    }

    const vulnerabilities = scanResult.vulnerabilities;
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;
    const autoFixableCount = vulnerabilities.filter(v => v.autoFixAvailable).length;
    const patternBasedCount = vulnerabilities.filter(v => v.detectionMethod === 'pattern').length;
    const aiDetectedCount = vulnerabilities.filter(v => v.detectionMethod === 'ai').length;

    // Calculate security score (100 - weighted vulnerability score)
    const weightedScore = criticalCount * 10 + highCount * 5 + mediumCount * 2 + lowCount * 1;
    const securityScore = Math.max(0, 100 - weightedScore);

    return {
      totalVulnerabilities: vulnerabilities.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      autoFixableCount,
      patternBasedCount,
      aiDetectedCount,
      securityScore
    };
  }, [scanResult]);

  return {
    scanResult,
    isScanning,
    lastError,
    scanner,
    performAnalysis,
    clearResults,
    applyAutoFix,
    jumpToVulnerability,
    getSecurityMetrics
  };
}