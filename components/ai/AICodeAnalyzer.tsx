import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, CheckCircle,
  TrendingDown, Eye, Target,
  BarChart3, PieChart, Activity, Layers
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { SecurityIssue, GasOptimization } from '../../types/security';


interface CodeQuality {
  score: number;
  readability: number;
  maintainability: number;
  testability: number;
  documentation: number;
}

interface AnalysisResult {
  securityIssues: SecurityIssue[];
  gasOptimizations: GasOptimization[];
  codeQuality: CodeQuality;
  complexity: {
    cyclomatic: number;
    cognitive: number;
    halstead: {
      difficulty: number;
      effort: number;
    };
  };
  suggestions: string[];
  estimatedGasCost: number;
}

interface AICodeAnalyzerProps {
  code: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
  autoAnalyze?: boolean;
  className?: string;
}

export const AICodeAnalyzer: React.FC<AICodeAnalyzerProps> = ({
  code,
  onAnalysisComplete,
  autoAnalyze = false,
  className = ''
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'security' | 'gas' | 'quality' | 'complexity'>('security');

  useEffect(() => {
    if (autoAnalyze && code.trim()) {
      analyzeCode();
    }
  }, [code, autoAnalyze]);

  const analyzeCode = async () => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis with realistic results
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult: AnalysisResult = {
        securityIssues: [
          {
            severity: 'high',
            type: 'Reentrancy',
            title: 'Reentrancy Vulnerability',
            message: 'Potential reentrancy vulnerability detected in withdraw function',
            description: 'Potential reentrancy vulnerability in withdraw function',
            line: 45,
            suggestion: 'Use the checks-effects-interactions pattern or ReentrancyGuard'
          },
          {
            severity: 'medium',
            type: 'Integer Overflow',
            title: 'Integer Overflow Risk',
            message: 'Potential integer overflow detected in arithmetic operations',
            description: 'Potential integer overflow in arithmetic operations',
            line: 23,
            suggestion: 'Use SafeMath library or Solidity 0.8+ built-in overflow protection'
          },
          {
            severity: 'low',
            type: 'Visibility',
            title: 'Visibility Declaration Missing',
            message: 'Function visibility should be explicitly declared',
            description: 'Function visibility not explicitly declared',
            line: 12,
            suggestion: 'Explicitly declare function visibility (public, private, internal, external)'
          }
        ],
        gasOptimizations: [
          {
            type: 'Storage Optimization',
            description: 'Pack struct variables to reduce storage slots',
            currentCost: 20000,
            optimizedCost: 15000,
            savings: 5000,
            line: 8,
            suggestion: 'Reorder struct variables to pack them more efficiently and reduce storage slots'
          },
          {
            type: 'Loop Optimization',
            description: 'Cache array length in loops',
            currentCost: 3000,
            optimizedCost: 2100,
            savings: 900,
            line: 34,
            suggestion: 'Cache array length in a variable before the loop to save gas'
          },
          {
            type: 'Function Modifier',
            description: 'Use function modifiers instead of require statements',
            currentCost: 1500,
            optimizedCost: 1200,
            savings: 300,
            line: 56,
            suggestion: 'Create reusable function modifiers to replace repetitive require statements'
          }
        ],
        codeQuality: {
          score: 78,
          readability: 85,
          maintainability: 72,
          testability: 68,
          documentation: 82
        },
        complexity: {
          cyclomatic: 12,
          cognitive: 8,
          halstead: {
            difficulty: 15.6,
            effort: 2340
          }
        },
        suggestions: [
          'Add comprehensive unit tests for all functions',
          'Implement proper error handling with custom errors',
          'Consider using OpenZeppelin contracts for standard functionality',
          'Add NatSpec documentation for all public functions',
          'Implement access control patterns for sensitive functions'
        ],
        estimatedGasCost: 245678
      };

      setAnalysisResult(mockResult);
      onAnalysisComplete?.(mockResult);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: SecurityIssue['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const tabs = [
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'gas', label: 'Gas', icon: Zap },
    { id: 'quality', label: 'Quality', icon: Eye },
    { id: 'complexity', label: 'Complexity', icon: BarChart3 }
  ] as const;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">AI Code Analyzer</h3>
          </div>
          
          <Button
            onClick={analyzeCode}
            disabled={isAnalyzing || !code.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Analyze Code
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <Card className="bg-white/10 backdrop-blur-md border border-white/20">
          {/* Overview */}
          <div className="p-4 border-b border-white/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {analysisResult.securityIssues.length}
                </div>
                <div className="text-sm text-gray-400">Security Issues</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {analysisResult.gasOptimizations.reduce((sum, opt) => sum + (opt.savings || 0), 0)}
                </div>
                <div className="text-sm text-gray-400">Gas Savings</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${getQualityColor(analysisResult.codeQuality.score)}`}>
                  {analysisResult.codeQuality.score}%
                </div>
                <div className="text-sm text-gray-400">Quality Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {analysisResult.complexity.cyclomatic}
                </div>
                <div className="text-sm text-gray-400">Complexity</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            <AnimatePresence mode="wait">
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  {analysisResult.securityIssues.map((issue, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                            {issue.severity.toUpperCase()}
                          </span>
                          <span className="font-medium text-white">{issue.type}</span>
                          {issue.line && (
                            <span className="text-xs text-gray-400">Line {issue.line}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{issue.description}</p>
                      <p className="text-xs text-blue-300">💡 {issue.suggestion}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'gas' && (
                <motion.div
                  key="gas"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingDown className="w-5 h-5 text-green-400" />
                      <span className="font-medium text-green-400">Total Potential Savings</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {analysisResult.gasOptimizations.reduce((sum, opt) => sum + (opt.savings || 0), 0)} gas
                    </div>
                  </div>

                  {analysisResult.gasOptimizations.map((optimization, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{optimization.type}</span>
                          {optimization.line && (
                            <span className="text-xs text-gray-400">Line {optimization.line}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-400">
                            -{optimization.savings} gas
                          </div>
                          <div className="text-xs text-gray-400">
                            {optimization.currentCost} → {optimization.optimizedCost}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{optimization.description}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'quality' && (
                <motion.div
                  key="quality"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(analysisResult.codeQuality).map(([key, value]) => {
                      if (key === 'score') return null;
                      return (
                        <div key={key} className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white capitalize">
                              {key}
                            </span>
                            <span className={`text-lg font-bold ${getQualityColor(value)}`}>
                              {value}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                value >= 80 ? 'bg-green-500' :
                                value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-white">Suggestions for Improvement</h4>
                    {analysisResult.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'complexity' && (
                <motion.div
                  key="complexity"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        <span className="font-medium text-white">Cyclomatic Complexity</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-400">
                        {analysisResult.complexity.cyclomatic}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {analysisResult.complexity.cyclomatic <= 10 ? 'Good' :
                         analysisResult.complexity.cyclomatic <= 20 ? 'Moderate' : 'High'}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <PieChart className="w-4 h-4 text-purple-400" />
                        <span className="font-medium text-white">Cognitive Complexity</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-400">
                        {analysisResult.complexity.cognitive}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {analysisResult.complexity.cognitive <= 15 ? 'Good' :
                         analysisResult.complexity.cognitive <= 25 ? 'Moderate' : 'High'}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <Layers className="w-4 h-4 text-green-400" />
                        <span className="font-medium text-white">Halstead Difficulty</span>
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        {analysisResult.complexity.halstead.difficulty.toFixed(1)}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {analysisResult.complexity.halstead.difficulty <= 10 ? 'Easy' :
                         analysisResult.complexity.halstead.difficulty <= 20 ? 'Moderate' : 'Difficult'}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <Activity className="w-4 h-4 text-orange-400" />
                        <span className="font-medium text-white">Halstead Effort</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-400">
                        {analysisResult.complexity.halstead.effort.toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Mental effort required</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <Card className="p-8 bg-white/10 backdrop-blur-md border border-white/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-white mb-2">Analyzing Your Code</h3>
            <p className="text-gray-400">AI is examining security, gas efficiency, and code quality...</p>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!analysisResult && !isAnalyzing && (
        <Card className="p-8 bg-white/10 backdrop-blur-md border border-white/20">
          <div className="text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Analyze</h3>
            <p className="text-gray-400 mb-4">
              Paste your Solidity code and click "Analyze Code" to get comprehensive insights.
            </p>
            <Button
              onClick={analyzeCode}
              disabled={!code.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Target className="w-4 h-4 mr-2" />
              Start Analysis
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AICodeAnalyzer;
