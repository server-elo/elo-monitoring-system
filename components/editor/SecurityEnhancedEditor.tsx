// Security-Enhanced Monaco Editor with Real-time AI Analysis
// Integrates SecurityScanner with Monaco Editor for live vulnerability detection

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { editor } from 'monaco-editor';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useAuth } from '../auth/EnhancedAuthProvider';
import { useToast } from '../ui/use-toast';
import { SecurityScanner, SecurityScanResult, SecurityIssue, createSecurityScanner } from '@/lib/security/SecurityScanner';
import { SecurityStatusIndicator } from './SecurityStatusIndicator';

interface SecurityEnhancedEditorProps {
  initialCode?: string;
  language?: string;
  theme?: 'vs-dark' | 'vs-light';
  height?: string;
  onChange?: (code: string) => void;
  onSecurityScan?: (result: SecurityScanResult) => void;
  className?: string;
  readOnly?: boolean;
  showSecurityPanel?: boolean;
}

interface SecurityStats {
  totalIssues: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
  securityScore: number;
  lastScanTime: Date | null;
}

export const SecurityEnhancedEditor: React.FC<SecurityEnhancedEditorProps> = ({
  initialCode = '',
  language = 'solidity',
  theme = 'vs-dark',
  height = '400px',
  onChange,
  onSecurityScan,
  className = '',
  readOnly = false,
  showSecurityPanel = true
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const securityScannerRef = useRef<SecurityScanner | null>(null);
  
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [securityStats, setSecurityStats] = useState<SecurityStats>({
    totalIssues: 0,
    criticalIssues: 0,
    warningIssues: 0,
    infoIssues: 0,
    securityScore: 100,
    lastScanTime: null
  });
  const [currentIssues, setCurrentIssues] = useState<SecurityIssue[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<SecurityIssue | null>(null);
  const [llmStatus, setLlmStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [scanSource, setScanSource] = useState<'local-llm' | 'fallback' | 'pattern-only'>('pattern-only');
  const [responseTime, setResponseTime] = useState<number>(0);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!editorRef.current || !user) return;

    const editor = monaco.editor.create(editorRef.current, {
      value: initialCode,
      language,
      theme,
      readOnly,
      automaticLayout: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      glyphMargin: true,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: 'all',
      contextmenu: true,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      wordBasedSuggestions: 'currentDocument',
      // Security-specific settings
      rulers: [80, 120],
      renderWhitespace: 'boundary',
      showFoldingControls: 'always'
    });

    editorInstanceRef.current = editor;

    // Initialize security scanner
    const scanner = createSecurityScanner(editor, user.id);
    securityScannerRef.current = scanner;

    // Listen for content changes
    editor.onDidChangeModelContent(() => {
      const code = editor.getValue();
      onChange?.(code);
      setIsScanning(true);
    });

    // Listen for security scan results
    const handleScanComplete = (event: CustomEvent<SecurityScanResult>) => {
      const result = event.detail;
      updateSecurityStats(result);
      setCurrentIssues(result.issues);
      setIsScanning(false);
      onSecurityScan?.(result);
    };

    document.addEventListener('securityScanComplete', handleScanComplete as EventListener);
    setIsEditorReady(true);

    return () => {
      document.removeEventListener('securityScanComplete', handleScanComplete as EventListener);
      scanner.dispose();
      editor.dispose();
    };
  }, [user]);

  // Check LLM status periodically
  useEffect(() => {
    const checkLLMStatus = async () => {
      try {
        const response = await fetch('http://localhost:1234/v1/models', {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });

        if (response.ok) {
          setLlmStatus('connected');
          setScanSource('local-llm');
        } else {
          setLlmStatus('disconnected');
          setScanSource('fallback');
        }
      } catch (error) {
        setLlmStatus('disconnected');
        setScanSource('pattern-only');
      }
    };

    // Initial check
    checkLLMStatus();

    // Check every 30 seconds
    const interval = setInterval(checkLLMStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const updateSecurityStats = useCallback((result: SecurityScanResult) => {
    const stats: SecurityStats = {
      totalIssues: result.issues.length,
      criticalIssues: result.issues.filter(i => i.severity === 'critical').length,
      warningIssues: result.issues.filter(i => i.severity === 'high' || i.severity === 'medium').length,
      infoIssues: result.issues.filter(i => i.severity === 'low').length,
      securityScore: result.overallScore,
      lastScanTime: new Date()
    };

    setSecurityStats(stats);

    // Update response time and scan source from the first AI issue
    const aiIssue = result.issues.find(issue => issue.source);
    if (aiIssue) {
      setResponseTime(aiIssue.analysisTime || 0);
      setScanSource(aiIssue.source as 'local-llm' | 'fallback' | 'pattern-only');
    }

    // Show toast for critical issues
    if (stats.criticalIssues > 0) {
      toast({
        title: '🚨 Critical Security Issues Found',
        description: `Found ${stats.criticalIssues} critical security issues that need immediate attention.`,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const handleIssueClick = useCallback((issue: SecurityIssue) => {
    if (!editorInstanceRef.current) return;

    // Navigate to issue location
    editorInstanceRef.current.setPosition({
      lineNumber: issue.line,
      column: issue.column
    });
    
    // Focus editor
    editorInstanceRef.current.focus();
    
    // Select the problematic code
    editorInstanceRef.current.setSelection({
      startLineNumber: issue.line,
      startColumn: issue.column,
      endLineNumber: issue.endLine,
      endColumn: issue.endColumn
    });

    setSelectedIssue(issue);
  }, []);

  const handleManualScan = useCallback(async () => {
    if (!securityScannerRef.current) return;
    
    setIsScanning(true);
    try {
      const result = await securityScannerRef.current.scanNow();
      updateSecurityStats(result);
      setCurrentIssues(result.issues);
      
      toast({
        title: '🔍 Security Scan Complete',
        description: `Found ${result.issues.length} issues. Security score: ${result.overallScore}/100`,
        variant: result.overallScore > 80 ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Scan Failed',
        description: 'Failed to perform security scan. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
    }
  }, [toast, updateSecurityStats]);

  // Score visualization helpers - replaced by inline logic
  // const _getScoreColor = (score: number): string => {
  //   if (score >= 90) return 'text-green-500';
  //   if (score >= 70) return 'text-yellow-500';
  //   return 'text-red-500';
  // };

  // const _getScoreIcon = (score: number) => {
  //   if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-500" />;
  //   if (score >= 70) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  //   return <XCircle className="w-5 h-5 text-red-500" />;
  // };

  const getSeverityIcon = (severity: SecurityIssue['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityBadgeVariant = (severity: SecurityIssue['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
    }
  };

  return (
    <div className={`security-enhanced-editor ${className}`}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Editor */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">Security-Enhanced Editor</span>
              </div>
              
              {isEditorReady && (
                <SecurityStatusIndicator
                  isScanning={isScanning}
                  lastScanTime={securityStats.lastScanTime}
                  securityScore={securityStats.securityScore}
                  issueCount={securityStats.totalIssues}
                  llmStatus={llmStatus}
                  scanSource={scanSource}
                  responseTime={responseTime}
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleManualScan}
                disabled={isScanning}
                size="sm"
                variant="outline"
              >
                {isScanning ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Scan Now
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Security Score Bar */}
          {isEditorReady && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Security Score</span>
                <span className="text-sm text-gray-500">
                  {securityStats.lastScanTime?.toLocaleTimeString() || 'Not scanned'}
                </span>
              </div>
              <Progress 
                value={securityStats.securityScore} 
                className="h-2"
                // Custom color based on score
                style={{
                  '--progress-background': securityStats.securityScore >= 90 ? '#10b981' : 
                                         securityStats.securityScore >= 70 ? '#f59e0b' : '#ef4444'
                } as React.CSSProperties}
              />
            </div>
          )}

          {/* Monaco Editor Container */}
          <div 
            ref={editorRef} 
            style={{ height }}
            className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden"
          />
        </div>

        {/* Security Panel */}
        {showSecurityPanel && isEditorReady && (
          <div className="w-full lg:w-80">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Security Analysis</h3>
              </div>

              {/* Security Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <div className="text-lg font-bold text-red-600">{securityStats.criticalIssues}</div>
                  <div className="text-xs text-red-500">Critical</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <div className="text-lg font-bold text-yellow-600">{securityStats.warningIssues}</div>
                  <div className="text-xs text-yellow-500">Warnings</div>
                </div>
              </div>

              {/* Issues List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {currentIssues.map((issue, index) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          selectedIssue?.id === issue.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleIssueClick(issue)}
                      >
                        <div className="flex items-start gap-2">
                          {getSeverityIcon(issue.severity)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getSeverityBadgeVariant(issue.severity)} className="text-xs">
                                {issue.severity.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-gray-500">Line {issue.line}</span>
                            </div>
                            <p className="text-sm font-medium mb-1">{issue.message}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              💡 {issue.suggestion}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {currentIssues.length === 0 && !isScanning && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p className="font-medium">No security issues found!</p>
                    <p className="text-sm">Your code looks secure.</p>
                  </div>
                )}

                {isScanning && (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Analyzing code security...</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityEnhancedEditor;
