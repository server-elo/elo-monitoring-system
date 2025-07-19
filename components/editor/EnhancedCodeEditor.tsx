/**
 * Enhanced Code Editor Component
 * 
 * Integrates Monaco Editor with real-time security analysis and gas optimization
 * visualization for a comprehensive Solidity development experience.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { useSecurityAnalysis } from '@/hooks/useSecurityAnalysis';
import { useGasAnalysis } from '@/hooks/useGasAnalysis';
import { SecurityOverlay } from './SecurityOverlay';
import { GasOptimizationPanel } from './GasOptimizationPanel';

interface EnhancedCodeEditorProps {
  initialCode?: string;
  userId: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  height?: string;
  theme?: 'vs-dark' | 'vs-light';
  enableSecurity?: boolean;
  enableGasAnalysis?: boolean;
  enableRealtime?: boolean;
}

export const EnhancedCodeEditor: React.FC<EnhancedCodeEditorProps> = ({
  initialCode = '',
  userId,
  onCodeChange,
  className = '',
  height = '600px',
  theme = 'vs-dark',
  enableSecurity = true,
  enableGasAnalysis = true,
  enableRealtime = true
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [activePanel, setActivePanel] = useState<'security' | 'gas' | 'both'>('both');
  const [code, setCode] = useState(initialCode);

  // Security analysis hook
  const {
    scanResult: securityResult,
    isScanning: isSecurityScanning,
    performAnalysis: performSecurityAnalysis,
    autoFixIssue,
    jumpToIssue
  } = useSecurityAnalysis(editorInstance, userId, {
    enableRealtime,
    enableAIAnalysis: true,
    enablePatternMatching: true,
    severityThreshold: 'low'
  });

  // Gas analysis hook
  const {
    analysisResult: gasResult,
    isAnalyzing: isGasAnalyzing,
    performAnalysis: performGasAnalysis,
    toggleHeatmap,
    applyOptimization,
    jumpToOptimization,
    getGasMetrics
  } = useGasAnalysis(editorInstance, userId, {
    enableRealtime,
    enableHeatmap: false,
    autoAnalyze: true
  });

  // Initialize Monaco Editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Configure Solidity language support
    monaco.languages.register({ id: 'solidity' });
    monaco.languages.setMonarchTokensProvider('solidity', {
      tokenizer: {
        root: [
          [/pragma\b/, 'keyword'],
          [/contract\b/, 'keyword'],
          [/function\b/, 'keyword'],
          [/modifier\b/, 'keyword'],
          [/event\b/, 'keyword'],
          [/struct\b/, 'keyword'],
          [/enum\b/, 'keyword'],
          [/mapping\b/, 'keyword'],
          [/uint\d*\b/, 'type'],
          [/int\d*\b/, 'type'],
          [/address\b/, 'type'],
          [/bool\b/, 'type'],
          [/string\b/, 'type'],
          [/bytes\d*\b/, 'type'],
          [/public\b/, 'keyword'],
          [/private\b/, 'keyword'],
          [/internal\b/, 'keyword'],
          [/external\b/, 'keyword'],
          [/view\b/, 'keyword'],
          [/pure\b/, 'keyword'],
          [/payable\b/, 'keyword'],
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          [/\d+/, 'number']
        ],
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop']
        ]
      }
    });

    // Create editor instance
    if (!editorRef.current) return;
    const newEditorInstance = monaco.editor.create(editorRef.current, {
      value: initialCode,
      language: 'solidity',
      theme,
      automaticLayout: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      suggest: {
        showKeywords: true,
        showSnippets: true
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      }
    });

    // Setup change listener
    const disposable = newEditorInstance.onDidChangeModelContent(() => {
      const newCode = newEditorInstance.getValue();
      setCode(newCode);
      onCodeChange?.(newCode);
    });

    setEditorInstance(newEditorInstance);

    return () => {
      disposable.dispose();
      newEditorInstance.dispose();
    };
  }, [initialCode, theme, onCodeChange]);

  // Manual analysis triggers
  const handleSecurityAnalysis = useCallback(async () => {
    try {
      await performSecurityAnalysis();
    } catch (error) {
      console.error('Security analysis failed:', error);
    }
  }, [performSecurityAnalysis]);

  const handleGasAnalysis = useCallback(async () => {
    try {
      await performGasAnalysis();
    } catch (error) {
      console.error('Gas analysis failed:', error);
    }
  }, [performGasAnalysis]);

  const handleRunAllAnalysis = useCallback(async () => {
    await Promise.all([
      handleSecurityAnalysis(),
      handleGasAnalysis()
    ]);
  }, [handleSecurityAnalysis, handleGasAnalysis]);

  // Get analysis metrics
  const securityMetrics = securityResult ? {
    totalIssues: securityResult.issues.length,
    criticalIssues: securityResult.issues.filter(i => i.severity === 'critical').length,
    securityScore: securityResult.overallScore
  } : null;

  const gasMetrics = getGasMetrics();

  return (
    <div className={`enhanced-code-editor ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Solidity Editor</h3>
          
          {/* Analysis Status */}
          <div className="flex items-center space-x-2 text-sm">
            {enableSecurity && (
              <div className={`px-2 py-1 rounded ${
                isSecurityScanning ? 'bg-blue-100 text-blue-700' :
                securityMetrics ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                🛡️ Security: {isSecurityScanning ? 'Analyzing...' : 
                  securityMetrics ? `${securityMetrics.securityScore}/100` : 'Ready'}
              </div>
            )}
            
            {enableGasAnalysis && (
              <div className={`px-2 py-1 rounded ${
                isGasAnalyzing ? 'bg-blue-100 text-blue-700' :
                gasMetrics.totalCost > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                ⛽ Gas: {isGasAnalyzing ? 'Analyzing...' : 
                  gasMetrics.totalCost > 0 ? `${Math.round(gasMetrics.totalCost / 1000)}K` : 'Ready'}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Panel Toggle */}
          <select
            value={activePanel}
            onChange={(e) => setActivePanel(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="both">Both Panels</option>
            <option value="security">Security Only</option>
            <option value="gas">Gas Only</option>
          </select>

          {/* Analysis Buttons */}
          <button
            onClick={handleSecurityAnalysis}
            disabled={isSecurityScanning || !enableSecurity}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            🛡️ Security
          </button>
          
          <button
            onClick={handleGasAnalysis}
            disabled={isGasAnalyzing || !enableGasAnalysis}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            ⛽ Gas
          </button>
          
          <button
            onClick={handleRunAllAnalysis}
            disabled={isSecurityScanning || isGasAnalyzing}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            🚀 Analyze All
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Editor */}
        <div className="flex-1" style={{ height }}>
          <div ref={editorRef} className="w-full h-full" />
        </div>

        {/* Analysis Panels */}
        <div className="w-96 border-l bg-white overflow-y-auto" style={{ height }}>
          {(activePanel === 'both' || activePanel === 'security') && enableSecurity && (
            <div className="border-b">
              <div className="p-3 bg-gray-50 border-b">
                <h4 className="font-semibold text-gray-800">🛡️ Security Analysis</h4>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <SecurityOverlay
                  scanResult={securityResult}
                  isScanning={isSecurityScanning}
                  onIssueClick={jumpToIssue}
                  onAutoFix={autoFixIssue}
                  className="p-3"
                />
              </div>
            </div>
          )}

          {(activePanel === 'both' || activePanel === 'gas') && enableGasAnalysis && (
            <div>
              <div className="p-3 bg-gray-50 border-b">
                <h4 className="font-semibold text-gray-800">⛽ Gas Optimization</h4>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <GasOptimizationPanel
                  analysisResult={gasResult}
                  isAnalyzing={isGasAnalyzing}
                  onOptimizationClick={jumpToOptimization}
                  onApplyOptimization={applyOptimization}
                  onToggleHeatmap={toggleHeatmap}
                  className="p-3"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-t text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
          {securityMetrics && (
            <span>Security Issues: {securityMetrics.totalIssues}</span>
          )}
          {gasMetrics.optimizationCount > 0 && (
            <span>Gas Optimizations: {gasMetrics.optimizationCount}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {enableRealtime && (
            <span className="text-green-600">● Real-time Analysis</span>
          )}
          <span>Solidity</span>
        </div>
      </div>
    </div>
  );
};
