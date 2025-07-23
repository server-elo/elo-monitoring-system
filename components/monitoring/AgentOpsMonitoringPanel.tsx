'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Activity, Brain, Shield, Zap, AlertCircle, CheckCircle } from 'lucide-react'

interface MonitoringData {
  sessions: {
    total: number
    active: number
    successful: number
    failed: number
  }
  performance: {
    avgResponseTime: number
    p95ResponseTime: number
    requestsPerMinute: number
  }
  aiUsage: {
    codeGenerations: number
    codeAnalyses: number
    securityScans: number
    gasOptimizations: number
  }
  errors: {
    count: number
    rate: number
    lastError?: string
  }
}

export function AgentOpsMonitoringPanel() {
  const [data, setData] = useState<MonitoringData>({
    sessions: { total: 0, active: 0, successful: 0, failed: 0 },
    performance: { avgResponseTime: 0, p95ResponseTime: 0, requestsPerMinute: 0 },
    aiUsage: { codeGenerations: 0, codeAnalyses: 0, securityScans: 0, gasOptimizations: 0 },
    errors: { count: 0, rate: 0 }
  })
  
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    if (!isLive) return

    // Simulate real-time updates
    const interval = setInterval(() => {
      setData(prev => ({
        sessions: {
          ...prev.sessions,
          total: prev.sessions.total + Math.floor(Math.random() * 3),
          active: Math.floor(Math.random() * 10) + 5,
          successful: prev.sessions.successful + Math.floor(Math.random() * 2),
          failed: prev.sessions.failed + (Math.random() > 0.9 ? 1 : 0)
        },
        performance: {
          avgResponseTime: 200 + Math.random() * 100,
          p95ResponseTime: 400 + Math.random() * 200,
          requestsPerMinute: 20 + Math.floor(Math.random() * 10)
        },
        aiUsage: {
          codeGenerations: prev.aiUsage.codeGenerations + Math.floor(Math.random() * 2),
          codeAnalyses: prev.aiUsage.codeAnalyses + Math.floor(Math.random() * 2),
          securityScans: prev.aiUsage.securityScans + (Math.random() > 0.7 ? 1 : 0),
          gasOptimizations: prev.aiUsage.gasOptimizations + (Math.random() > 0.8 ? 1 : 0)
        },
        errors: {
          count: prev.errors.count + (Math.random() > 0.95 ? 1 : 0),
          rate: Math.random() * 5,
          lastError: Math.random() > 0.98 ? 'Timeout in code analysis' : prev.errors.lastError
        }
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [isLive])

  const successRate = data.sessions.total > 0 
    ? (data.sessions.successful / data.sessions.total * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AgentOps Monitoring</h2>
        <div className="flex items-center gap-2">
          <Badge variant={isLive ? "default" : "secondary"}>
            {isLive ? "Live" : "Paused"}
          </Badge>
          <button
            onClick={() => setIsLive(!isLive)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {isLive ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.sessions.active}</div>
            <p className="text-xs text-muted-foreground">
              {data.sessions.total} total sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <Progress value={parseFloat(successRate)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance.avgResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              P95: {data.performance.p95ResponseTime.toFixed(0)}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.errors.rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {data.errors.count} errors total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Feature Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Code Generations</span>
              <Badge variant="outline">{data.aiUsage.codeGenerations}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Code Analyses</span>
              <Badge variant="outline">{data.aiUsage.codeAnalyses}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Security Scans</span>
              <Badge variant="outline">{data.aiUsage.securityScans}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Gas Optimizations</span>
              <Badge variant="outline">{data.aiUsage.gasOptimizations}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Requests/min</span>
                <span className="text-sm font-medium">{data.performance.requestsPerMinute}</span>
              </div>
              <Progress value={data.performance.requestsPerMinute / 50 * 100} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Response Time</span>
                <span className="text-sm font-medium">{data.performance.avgResponseTime.toFixed(0)}ms</span>
              </div>
              <Progress value={100 - (data.performance.avgResponseTime / 500 * 100)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {data.errors.lastError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{data.errors.lastError}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}