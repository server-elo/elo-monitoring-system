/**
 * Security Overlay Component for Monaco Editor
 * 
 * Provides visual security indicators, issue panels, and real-time feedback
 * for the Solidity code editor with enhanced user experience.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { SecurityScanResult, SecurityIssue } from '@/lib/security/SecurityScanner';

interface SecurityOverlayProps {
  scanResult: SecurityScanResult | null;
  isScanning: boolean;
  onIssueClick?: (issue: SecurityIssue) => void;
  onAutoFix?: (issue: SecurityIssue) => void;
  className?: string;
}

export const SecurityOverlay: React.FC<SecurityOverlayProps> = ({
  scanResult,
  isScanning,
  onIssueClick,
  onAutoFix,
  className = ''
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [showOnlyFixable, setShowOnlyFixable] = useState(false);

  // Filter issues based on selected criteria
  const filteredIssues = scanResult?.issues.filter(issue => {
    const severityMatch = selectedSeverity === 'all' || issue.severity === selectedSeverity;
    const fixableMatch = !showOnlyFixable || issue.autoFixAvailable;
    return severityMatch && fixableMatch;
  }) || [];

  // Group issues by severity
  const issuesBySeverity = filteredIssues.reduce((acc, issue) => {
    if (!acc[issue.severity]) {
      acc[issue.severity] = [];
    }
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<string, SecurityIssue[]>);

  const toggleIssueExpansion = useCallback((issueId: string) => {
    setExpandedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📝';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vulnerability': return '🛡️';
      case 'gas-optimization': return '⛽';
      case 'best-practice': return '✨';
      case 'warning': return '⚠️';
      case 'style': return '🎨';
      default: return '📋';
    }
  };

  if (isScanning) {
    return (
      <div className={`security-overlay ${className}`}>
        <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-700 font-medium">Analyzing code security...</span>
        </div>
      </div>
    );
  }

  if (!scanResult) {
    return (
      <div className={`security-overlay ${className}`}>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <span className="text-gray-500">No security analysis available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`security-overlay ${className}`}>
      {/* Header with overall score and controls */}
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-gray-800">
              Security Score: 
              <span className={`ml-2 ${
                scanResult.overallScore >= 80 ? 'text-green-600' :
                scanResult.overallScore >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {scanResult.overallScore}/100
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {scanResult.issues.length} issue{scanResult.issues.length !== 1 ? 's' : ''} found
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Analysis time: {scanResult.scanTime}ms
            {scanResult.cacheHit && ' (cached)'}
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-4">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyFixable}
              onChange={(e) => setShowOnlyFixable(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-fixable only</span>
          </label>
        </div>
      </div>

      {/* Issues list */}
      <div className="space-y-3">
        {Object.entries(issuesBySeverity)
          .sort(([a], [b]) => {
            const order = ['critical', 'high', 'medium', 'low'];
            return order.indexOf(a) - order.indexOf(b);
          })
          .map(([severity, issues]) => (
            <div key={severity} className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {getSeverityIcon(severity)} {severity} ({issues.length})
              </h3>
              
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`border rounded-lg overflow-hidden ${getSeverityColor(issue.severity)}`}
                >
                  <div
                    className="p-3 cursor-pointer hover:bg-opacity-80 transition-colors"
                    onClick={() => {
                      if (issue.id) {
                        toggleIssueExpansion(issue.id);
                      }
                      onIssueClick?.(issue);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{getTypeIcon(issue.type)}</span>
                          <span className="font-medium">{issue.title}</span>
                          <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded">
                            Line {issue.line}
                          </span>
                          {issue.gasImpact && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                              -{issue.gasImpact} gas
                            </span>
                          )}
                        </div>
                        <p className="text-sm opacity-90">{issue.message}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-3">
                        {issue.autoFixAvailable && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAutoFix?.(issue);
                            }}
                            className="px-2 py-1 bg-white bg-opacity-80 hover:bg-opacity-100 rounded text-xs font-medium transition-colors"
                          >
                            🔧 Fix
                          </button>
                        )}
                        <span className="text-xs">
                          {issue.id && expandedIssues.has(issue.id) ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {issue.id && expandedIssues.has(issue.id) && (
                    <div className="px-3 pb-3 border-t border-current border-opacity-20">
                      <div className="mt-2 space-y-2">
                        <div>
                          <span className="text-xs font-medium">Suggestion:</span>
                          <p className="text-sm mt-1 opacity-90">{issue.suggestion}</p>
                        </div>
                        
                        {issue.codeExample && (
                          <div>
                            <span className="text-xs font-medium">Example:</span>
                            <pre className="text-xs mt-1 p-2 bg-white bg-opacity-50 rounded overflow-x-auto">
                              <code>{issue.codeExample}</code>
                            </pre>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs opacity-75">
                          <span>Category: {issue.category}</span>
                          {issue.confidence && (
                            <span>Confidence: {Math.round(issue.confidence * 100)}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

        {filteredIssues.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {scanResult.issues.length === 0 ? (
              <div>
                <div className="text-4xl mb-2">✅</div>
                <div className="font-medium">No security issues found!</div>
                <div className="text-sm">Your code looks secure.</div>
              </div>
            ) : (
              <div>No issues match the current filters.</div>
            )}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {scanResult.suggestions.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 Suggestions</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            {scanResult.suggestions.slice(0, 3).map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
