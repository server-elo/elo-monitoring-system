/**
 * Gas Optimization Panel Component
 *
 * Displays gas analysis results, optimization suggestions,
 * and interactive heatmap controls for the Monaco Editor.
 */
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  GasAnalysisResult,
  GasOptimization,
} from '@/lib/gas/GasOptimizationAnalyzer'

interface GasOptimizationPanelProps {
  analysisResult: GasAnalysisResult | null
  isAnalyzing: boolean
  onOptimizationClick?: (optimization: GasOptimization) => void
  onApplyOptimization?: (optimization: GasOptimization) => void
  onToggleHeatmap?: (enabled: boolean) => void
  className?: string
  gasResult?: any
  onJumpToLine?: (line: number) => void
}

export const GasOptimizationPanel: React.FC<GasOptimizationPanelProps> = ({
  analysisResult,
  isAnalyzing,
  onOptimizationClick,
  onApplyOptimization,
  onToggleHeatmap,
  className = '',
  gasResult,
  onJumpToLine,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'optimizations' | 'breakdown' | 'heatmap'
  >('overview')
  const [sortBy, setSortBy] = useState<'savings' | 'difficulty' | 'impact'>(
    'savings',
  )
  const [filterBy, setFilterBy] = useState<'all' | 'easy' | 'medium' | 'high'>(
    'all',
  )
  const [heatmapEnabled, setHeatmapEnabled] = useState(false)

  // Memoized calculations
  const sortedOptimizations = useMemo(() => {
    if (!analysisResult?.optimizations) return []

    let filtered = analysisResult.optimizations

    // Apply filters
    if (filterBy !== 'all') {
      filtered = filtered.filter((opt) => {
        switch (filterBy) {
          case 'easy':
            return opt.difficulty === 'easy'
          case 'medium':
            return opt.difficulty === 'medium'
          case 'high':
            return opt.difficulty === 'hard'
          default:
            return true
        }
      })
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'savings':
          return (b.estimatedGasSavings || 0) - (a.estimatedGasSavings || 0)
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 }
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        case 'impact':
          return (b.impact || 0) - (a.impact || 0)
        default:
          return 0
      }
    })
  }, [analysisResult?.optimizations, filterBy, sortBy])

  // Handle heatmap toggle
  const handleHeatmapToggle = useCallback(() => {
    const newState = !heatmapEnabled
    setHeatmapEnabled(newState)
    onToggleHeatmap?.(newState)
  }, [heatmapEnabled, onToggleHeatmap])

  // Handle optimization click
  const handleOptimizationClick = useCallback(
    (optimization: GasOptimization) => {
      onOptimizationClick?.(optimization)
      if (optimization.lineNumber && onJumpToLine) {
        onJumpToLine(optimization.lineNumber)
      }
    },
    [onOptimizationClick, onJumpToLine],
  )

  if (isAnalyzing) {
    return (
      <div className={`gas-optimization-panel analyzing ${className}`}>
        <div className="analyzing-state">
          <div className="spinner" />
          <p>Analyzing gas usage...</p>
        </div>
      </div>
    )
  }

  if (!analysisResult) {
    return (
      <div className={`gas-optimization-panel empty ${className}`}>
        <div className="empty-state">
          <p>No gas analysis results available</p>
          <button
            onClick={() => {
              /* trigger analysis */
            }}
          >
            Run Gas Analysis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`gas-optimization-panel ${className}`}>
      <div className="panel-header">
        <h3>Gas Optimization</h3>
        <div className="tab-controls">
          <button
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? 'active' : ''}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('optimizations')}
            className={activeTab === 'optimizations' ? 'active' : ''}
          >
            Optimizations ({sortedOptimizations.length})
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={activeTab === 'breakdown' ? 'active' : ''}
          >
            Breakdown
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={activeTab === 'heatmap' ? 'active' : ''}
          >
            Heatmap
          </button>
        </div>
      </div>

      <div className="panel-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="metrics-grid">
              <div className="metric">
                <label>Total Gas Cost</label>
                <value>{analysisResult.totalGasCost || 0}</value>
              </div>
              <div className="metric">
                <label>Potential Savings</label>
                <value>
                  {sortedOptimizations.reduce(
                    (sum, opt) => sum + (opt.estimatedGasSavings || 0),
                    0,
                  )}
                </value>
              </div>
              <div className="metric">
                <label>Efficiency Score</label>
                <value>{analysisResult.efficiencyScore || 0}%</value>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'optimizations' && (
          <div className="optimizations-tab">
            <div className="controls">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="savings">Sort by Savings</option>
                <option value="difficulty">Sort by Difficulty</option>
                <option value="impact">Sort by Impact</option>
              </select>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="optimizations-list">
              {sortedOptimizations.map((optimization, index) => (
                <div
                  key={index}
                  className="optimization-item"
                  onClick={() => handleOptimizationClick(optimization)}
                >
                  <div className="optimization-header">
                    <h4>{optimization.title}</h4>
                    <span className={`difficulty ${optimization.difficulty}`}>
                      {optimization.difficulty}
                    </span>
                  </div>
                  <p className="optimization-description">
                    {optimization.description}
                  </p>
                  <div className="optimization-metrics">
                    <span>
                      Gas Savings: {optimization.estimatedGasSavings || 0}
                    </span>
                    {optimization.lineNumber && (
                      <span>Line: {optimization.lineNumber}</span>
                    )}
                  </div>
                  {onApplyOptimization && (
                    <button
                      className="apply-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onApplyOptimization(optimization)
                      }}
                    >
                      Apply Fix
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div className="breakdown-tab">
            <div className="gas-breakdown">
              {gasResult?.breakdown?.map((item: any, index: number) => (
                <div key={index} className="breakdown-item">
                  <span className="function-name">{item.function}</span>
                  <span className="gas-cost">{item.gas}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="heatmap-tab">
            <div className="heatmap-controls">
              <label>
                <input
                  type="checkbox"
                  checked={heatmapEnabled}
                  onChange={handleHeatmapToggle}
                />
                Enable Gas Heatmap
              </label>
            </div>
            <p className="heatmap-description">
              The heatmap highlights code sections based on gas consumption. Red
              indicates high gas usage, yellow medium, and green low usage.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
