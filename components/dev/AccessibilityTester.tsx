'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, X, Eye, Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { accessibilityTester, AccessibilityTestResult } from '@/lib/accessibility/AccessibilityTester';
import { logger } from '@/lib/api/logger';

interface AccessibilityTesterProps {
  enabled?: boolean;
  autoTest?: boolean;
  showFloatingButton?: boolean;
}

export const AccessibilityTester: React.FC<AccessibilityTesterProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  autoTest = false,
  showFloatingButton = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AccessibilityTestResult | null>(null);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  // Auto-test on mount if enabled
  useEffect(() => {
    if (enabled && autoTest) {
      runAccessibilityTest();
    }
  }, [enabled, autoTest]);

  const runAccessibilityTest = async () => {
    setIsLoading(true);
    try {
      const result = await accessibilityTester.testPage({
        wcagLevel: 'AA',
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
      });
      setResults(result);
      setLastTestTime(new Date());
      
      // Log results for developers
      logger.info('Accessibility Test Results', { report: accessibilityTester.generateReport(result) });
      if (result.violations.length > 0) {
        logger.warn('Accessibility violations found', { violations: result.violations });
      }
    } catch (error) {
      logger.error('Accessibility test failed:', {}, error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!results) return;
    
    const report = accessibilityTester.generateReport(results);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'serious': return 'text-orange-500';
      case 'moderate': return 'text-yellow-500';
      case 'minor': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!enabled) return null;

  return (
    <>
      {/* Floating Test Button */}
      {showFloatingButton && (
        <motion.div
          className="fixed bottom-4 right-4 z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1 }}
        >
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg"
            aria-label="Open accessibility tester"
          >
            <Eye className="w-5 h-5" />
          </Button>
        </motion.div>
      )}

      {/* Test Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
          >
            <motion.div
              className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <Eye className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-bold text-white">Accessibility Tester</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={runAccessibilityTest}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? 'Testing...' : 'Run Test'}
                  </Button>
                  {results && (
                    <Button
                      onClick={downloadReport}
                      variant="outline"
                      className="border-gray-600"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-300">Running accessibility tests...</span>
                  </div>
                )}

                {results && !isLoading && (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Overall Score</h3>
                        <div className={`text-3xl font-bold ${getScoreColor(results.score)}`}>
                          {results.score}/100
                        </div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-2">WCAG Level</h3>
                        <div className="text-2xl font-bold text-blue-400">
                          {results.wcagLevel}
                        </div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Last Tested</h3>
                        <div className="text-sm text-gray-300">
                          {lastTestTime?.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Test Results */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-green-400 font-medium">Passed</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {results.summary.passCount}
                        </div>
                      </div>
                      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          <span className="text-red-400 font-medium">Violations</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {results.summary.violationCount}
                        </div>
                      </div>
                      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Settings className="w-5 h-5 text-yellow-500" />
                          <span className="text-yellow-400 font-medium">Incomplete</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {results.summary.incompleteCount}
                        </div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-2">Total Issues</div>
                        <div className="text-2xl font-bold text-white">
                          {results.summary.criticalIssues + results.summary.seriousIssues + 
                           results.summary.moderateIssues + results.summary.minorIssues}
                        </div>
                      </div>
                    </div>

                    {/* Violations Details */}
                    {results.violations.length > 0 && (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Violations</h3>
                        <div className="space-y-4">
                          {results.violations.map((violation: any, index: number) => (
                            <div key={index} className="border border-gray-700 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-white">{violation.description}</h4>
                                <span className={`text-sm px-2 py-1 rounded ${getSeverityColor(violation.impact)}`}>
                                  {violation.impact}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 mb-2">{violation.help}</p>
                              <div className="text-xs text-gray-500">
                                Affects {violation.nodes.length} element(s)
                              </div>
                              <a
                                href={violation.helpUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm"
                              >
                                Learn more →
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!results && !isLoading && (
                  <div className="text-center py-12">
                    <Eye className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Ready to Test Accessibility
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Click "Run Test" to analyze the current page for accessibility issues.
                    </p>
                    <Button onClick={runAccessibilityTest} className="bg-blue-600 hover:bg-blue-700">
                      Run Accessibility Test
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccessibilityTester;
