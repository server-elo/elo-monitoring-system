/**
 * Gas Optimization Panel Component
 * 
 * Displays gas analysis results, optimization suggestions,
 * and interactive heatmap controls for the Monaco Editor.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { GasAnalysisResult, GasOptimization } from '@/lib/gas/GasOptimizationAnalyzer';

interface GasOptimizationPanelProps {
  analysisResult: GasAnalysisResult | null;
  isAnalyzing: boolean;
  onOptimizationClick?: (optimization: GasOptimization) => void;
  onApplyOptimization?: (optimization: GasOptimization) => void;
  onToggleHeatmap?: (enabled: boolean) => void;
  className?: string;
}

export const GasOptimizationPanel: React.FC<GasOptimizationPanelProps> = ({
  analysisResult,
  isAnalyzing,
  onOptimizationClick,
  onApplyOptimization,
  onToggleHeatmap,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'optimizations' | 'breakdown' | 'heatmap'>('overview');
  const [sortBy, setSortBy] = useState<'savings' | 'difficulty' | 'impact'>('savings');
  const [filterBy, setFilterBy] = useState<'all' | 'easy' | 'medium' | 'high'>('all');
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  // Memoized calculations
  const sortedOptimizations = useMemo(() => {
    if (!analysisResult?.optimizations) return [];
    
    let filtered = analysisResult.optimizations;
    
    // Apply filters
    if (filterBy !== 'all') {
      filtered = filtered.filter(opt => {
        switch (filterBy) {
          case 'easy': return opt.difficulty === 'easy';
          case 'medium': return opt.difficulty === 'medium';
          case 'high': return opt.difficulty === 'hard';
          default: return true;
        }
      });
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'savings': return b.savings - a.savings;
        case 'difficulty': 
          const diffOrder = { easy: 1, medium: 2, hard: 3 };
          return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        case 'impact':
          const impactOrder = { low: 1, medium: 2, high: 3 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        default: return 0;
      }
    });
  }, [analysisResult?.optimizations, sortBy, filterBy]);

  const gasBreakdown = useMemo(() => {
    if (!analysisResult?.estimates) return [];
    
    const breakdown = analysisResult.estimates.reduce((acc, estimate) => {
      if (!acc[estimate.category]) {
        acc[estimate.category] = { count: 0, totalCost: 0 };
      }
      acc[estimate.category].count++;
      acc[estimate.category].totalCost += estimate.totalCost;
      return acc;
    }, {} as Record<string, { count: number; totalCost: number }>);

    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      count: data.count,
      totalCost: data.totalCost,
      percentage: (data.totalCost / analysisResult.totalGasCost) * 100
    }));
  }, [analysisResult]);

  const handleToggleHeatmap = useCallback(() => {
    const newState = !heatmapEnabled;
    setHeatmapEnabled(newState);
    onToggleHeatmap?.(newState);
  }, [heatmapEnabled, onToggleHeatmap]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-purple-600 bg-purple-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'storage': return '💾';
      case 'computation': return '🧮';
      case 'memory': return '🧠';
      case 'call': return '📞';
      case 'deployment': return '🚀';
      default: return '⚡';
    }
  };

  const formatGas = (gas: number) => {
    if (gas >= 1000000) return `${(gas / 1000000).toFixed(1)}M`;
    if (gas >= 1000) return `${(gas / 1000).toFixed(1)}K`;
    return gas.toString();
  };

  if (isAnalyzing) {
    return (
      <div className={`gas-optimization-panel ${className}`}>
        <div className="flex items-center justify-center p-8 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
          <span className="text-blue-700 font-medium">Analyzing gas usage...</span>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className={`gas-optimization-panel ${className}`}>
        <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <span className="text-gray-500">No gas analysis available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`gas-optimization-panel ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'optimizations', label: 'Optimizations', icon: '⚡' },
            { id: 'breakdown', label: 'Breakdown', icon: '📈' },
            { id: 'heatmap', label: 'Heatmap', icon: '🔥' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{formatGas(analysisResult.totalGasCost)}</div>
              <div className="text-sm text-gray-500">Total Gas Cost</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{formatGas(analysisResult.totalSavings)}</div>
              <div className="text-sm text-gray-500">Potential Savings</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{analysisResult.optimizations.length}</div>
              <div className="text-sm text-gray-500">Optimizations</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((analysisResult.totalSavings / analysisResult.totalGasCost) * 100)}%
              </div>
              <div className="text-sm text-gray-500">Savings Rate</div>
            </div>
          </div>

          {/* Top Optimizations Preview */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-3">Top Optimization Opportunities</h3>
            <div className="space-y-2">
              {sortedOptimizations.slice(0, 3).map(opt => (
                <div
                  key={opt.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => onOptimizationClick?.(opt)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getCategoryIcon(opt.category)}</span>
                    <div>
                      <div className="font-medium">{opt.title}</div>
                      <div className="text-sm text-gray-500">Line {opt.line}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">-{formatGas(opt.savings)} gas</div>
                    <div className="text-sm text-gray-500">{opt.savingsPercentage}% savings</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Optimizations Tab */}
      {activeTab === 'optimizations' && (
        <div className="space-y-4">
          {/* Filters and Sorting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="savings">Sort by Savings</option>
                <option value="difficulty">Sort by Difficulty</option>
                <option value="impact">Sort by Impact</option>
              </select>
              
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="high">Hard</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-500">
              {sortedOptimizations.length} optimization{sortedOptimizations.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Optimizations List */}
          <div className="space-y-3">
            {sortedOptimizations.map(opt => (
              <div key={opt.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => onOptimizationClick?.(opt)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg">{getCategoryIcon(opt.category)}</span>
                        <span className="font-semibold">{opt.title}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">Line {opt.line}</span>
                        <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(opt.difficulty)}`}>
                          {opt.difficulty}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getImpactColor(opt.impact)}`}>
                          {opt.impact} impact
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{opt.description}</p>
                      <div className="text-xs text-gray-500">{opt.explanation}</div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-green-600">-{formatGas(opt.savings)}</div>
                      <div className="text-sm text-gray-500">{opt.savingsPercentage}% savings</div>
                      {opt.autoFixAvailable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyOptimization?.(opt);
                          }}
                          className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          🔧 Auto Fix
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown Tab */}
      {activeTab === 'breakdown' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Gas Usage by Category</h3>
            <div className="space-y-3">
              {gasBreakdown.map(item => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getCategoryIcon(item.category)}</span>
                    <span className="font-medium capitalize">{item.category}</span>
                    <span className="text-sm text-gray-500">({item.count} operations)</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatGas(item.totalCost)}</div>
                    <div className="text-sm text-gray-500">{item.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Function Breakdown */}
          {Object.keys(analysisResult.functionBreakdown).length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Gas Usage by Function</h3>
              <div className="space-y-2">
                {Object.entries(analysisResult.functionBreakdown).map(([func, cost]) => (
                  <div key={func} className="flex items-center justify-between">
                    <span className="font-mono text-sm">{func}()</span>
                    <span className="font-bold">{formatGas(cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Heatmap Tab */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Gas Cost Heatmap</h3>
              <button
                onClick={handleToggleHeatmap}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  heatmapEnabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {heatmapEnabled ? '🔥 Disable Heatmap' : '🔥 Enable Heatmap'}
              </button>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              The heatmap visualizes gas costs directly in the code editor. 
              Red areas indicate high gas costs, while green areas indicate low costs.
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center space-x-4 text-xs">
              <span>Gas Cost:</span>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-green-400 rounded"></div>
                <span>Low</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-orange-400 rounded"></div>
                <span>High</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span>Very High</span>
              </div>
            </div>
          </div>

          {/* Heatmap Statistics */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold mb-3">Heatmap Statistics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Hot Spots:</span>
                <span className="ml-2 font-medium">{analysisResult.heatmapData.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Highest Cost:</span>
                <span className="ml-2 font-medium">
                  {formatGas(Math.max(...analysisResult.heatmapData.map(h => h.gasCost)))}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Average Cost:</span>
                <span className="ml-2 font-medium">
                  {formatGas(Math.round(analysisResult.heatmapData.reduce((sum, h) => sum + h.gasCost, 0) / analysisResult.heatmapData.length))}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Analysis Time:</span>
                <span className="ml-2 font-medium">{analysisResult.analysisTime}ms</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
