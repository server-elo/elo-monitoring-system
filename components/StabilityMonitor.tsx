'use client'

import React, { useState, useEffect, useRef } from 'react'

interface StabilityMetrics {
  uptime: number
  errorCount: number
  lastError: string | null
  memoryUsage: number
  performanceScore: number
}

interface StabilityMonitorProps {
  onCriticalError?: (error: Error) => void
  maxErrors?: number
  children?: React.ReactNode
}

export function StabilityMonitor({
  onCriticalError,
  maxErrors = 10,
  children,
}: StabilityMonitorProps): React.ReactElement {
  const [metrics, setMetrics] = useState<StabilityMetrics>({
    uptime: 0,
    errorCount: 0,
    lastError: null,
    memoryUsage: 0,
    performanceScore: 100,
  })

  const [isStable, setIsStable] = useState(true)
  const [showMetrics, setShowMetrics] = useState(false)
  const startTimeRef = useRef(Date.now())
  const errorCountRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Start monitoring
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const uptime = Math.floor((now - startTimeRef.current) / 1000)

      // Basic memory monitoring
      let memoryUsage = 0
      if ('memory' in performance) {
        // @ts-ignore - memory API might not be available in all environments
        const memory = (performance as any).memory
        if (memory) {
          memoryUsage = Math.round(
            (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
          )
        }
      }

      // Performance score (simplified)
      const performanceScore = Math.max(
        0,
        100 - errorCountRef.current * 10 - Math.min(memoryUsage, 50),
      )

      setMetrics((prev) => ({
        ...prev,
        uptime,
        memoryUsage,
        performanceScore,
        errorCount: errorCountRef.current,
      }))

      // Check stability
      const stable = errorCountRef.current < maxErrors && performanceScore > 30
      setIsStable(stable)

      if (!stable && onCriticalError) {
        onCriticalError(
          new Error(
            `System unstable: ${errorCountRef.current} errors, performance: ${performanceScore}`,
          ),
        )
      }
    }, 1000)

    // Global error handler
    const handleError = (event: ErrorEvent) => {
      errorCountRef.current++
      setMetrics((prev) => ({
        ...prev,
        lastError: event.message || 'Unknown error',
        errorCount: errorCountRef.current,
      }))
      console.warn('StabilityMonitor: Error detected', event.error)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorCountRef.current++
      setMetrics((prev) => ({
        ...prev,
        lastError: event.reason?.toString() || 'Promise rejection',
        errorCount: errorCountRef.current,
      }))
      console.warn('StabilityMonitor: Promise rejection detected', event.reason)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [maxErrors, onCriticalError])

  const getStabilityColor = () => {
    if (metrics.performanceScore > 80) return 'text-green-400'
    if (metrics.performanceScore > 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatUptime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const hrs = Math.floor(minutes / 60)
    if (hrs > 0) return `${hrs}h ${minutes % 60}m`
    return `${minutes}m ${seconds % 60}s`
  }

  return (
    <div className="relative">
      {/* Stability Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div
          className="flex items-center space-x-2 bg-gray-900/90 backdrop-blur border border-gray-700 rounded-lg px-3 py-2 cursor-pointer"
          onClick={() => setShowMetrics(!showMetrics)}
        >
          <div
            className={`w-2 h-2 rounded-full ${isStable ? 'bg-green-500' : 'bg-red-500'} ${isStable ? 'animate-pulse' : 'animate-bounce'}`}
          />
          <span className="text-xs text-gray-300">
            {formatUptime(metrics.uptime)}
          </span>
        </div>

        {showMetrics && (
          <div className="absolute top-full right-0 mt-2 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg p-4 min-w-[200px] text-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={isStable ? 'text-green-400' : 'text-red-400'}>
                  {isStable ? 'STABLE' : 'UNSTABLE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Uptime:</span>
                <span className="text-white">
                  {formatUptime(metrics.uptime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Errors:</span>
                <span
                  className={
                    metrics.errorCount > 0
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }
                >
                  {metrics.errorCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Performance:</span>
                <span className={getStabilityColor()}>
                  {metrics.performanceScore}%
                </span>
              </div>
              {metrics.memoryUsage > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Memory:</span>
                  <span
                    className={
                      metrics.memoryUsage > 80
                        ? 'text-red-400'
                        : 'text-gray-300'
                    }
                  >
                    {metrics.memoryUsage}%
                  </span>
                </div>
              )}
              {metrics.lastError && (
                <div className="pt-2 border-t border-gray-700">
                  <div className="text-gray-400 mb-1">Last Error:</div>
                  <div className="text-red-400 text-[10px] break-all">
                    {metrics.lastError.substring(0, 50)}...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      {children}

      {/* Critical Error Overlay */}
      {!isStable && (
        <div className="fixed inset-0 bg-red-900/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-red-900/90 border border-red-700 rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-red-400 text-xl mb-2">⚠️</div>
              <h3 className="text-red-200 font-semibold mb-2">
                System Unstable
              </h3>
              <p className="text-red-300 text-sm mb-4">
                Performance degraded. {metrics.errorCount} errors detected.
              </p>
              <div className="flex space-x-2 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Restart
                </button>
                <button
                  onClick={() => setIsStable(true)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
