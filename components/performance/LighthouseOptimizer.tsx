'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Gauge, 
 
  Code, 
  Wifi, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Smartphone,
  Monitor
} from 'lucide-react';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface LighthouseMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

interface OptimizationSuggestion {
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  implemented: boolean;
}

export const LighthouseOptimizer: React.FC = () => {
  const [metrics, _setMetrics] = useState<LighthouseMetrics>({
    performance: 92,
    accessibility: 95,
    bestPractices: 88,
    seo: 94,
    pwa: 85
  });

  const [suggestions] = useState<OptimizationSuggestion[]>([
    {
      category: 'Performance',
      title: 'Enable text compression',
      description: 'Text-based resources should be served with compression (gzip, deflate or brotli)',
      impact: 'high',
      implemented: true
    },
    {
      category: 'Performance',
      title: 'Properly size images',
      description: 'Serve images that are appropriately-sized to save cellular data and improve load time',
      impact: 'medium',
      implemented: true
    },
    {
      category: 'Performance',
      title: 'Use next-gen image formats',
      description: 'Image formats like WebP and AVIF often provide better compression than PNG or JPEG',
      impact: 'medium',
      implemented: false
    },
    {
      category: 'Accessibility',
      title: 'Color contrast is sufficient',
      description: 'Background and foreground colors have a sufficient contrast ratio',
      impact: 'high',
      implemented: true
    },
    {
      category: 'Best Practices',
      title: 'Uses HTTPS',
      description: 'All origins are served over HTTPS',
      impact: 'high',
      implemented: true
    },
    {
      category: 'SEO',
      title: 'Document has a meta description',
      description: 'Meta descriptions may be included in search results',
      impact: 'medium',
      implemented: true
    }
  ]);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (score >= 70) return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <AlertTriangle className="w-5 h-5 text-red-400" />;
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const overallScore = Math.round(
    (metrics.performance + metrics.accessibility + metrics.bestPractices + metrics.seo + metrics.pwa) / 5
  );

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Gauge className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Lighthouse Performance</h2>
              <p className="text-gray-400">Real-time optimization monitoring</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </div>
            <div className="text-sm text-gray-400">Overall Score</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(metrics).map(([key, value]) => (
            <motion.div
              key={key}
              className="text-center p-4 bg-white/5 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-center mb-2">
                {getScoreIcon(value)}
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(value)}`}>
                {value}
              </div>
              <div className="text-sm text-gray-400 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <Progress 
                value={value} 
                className="mt-2 h-2"
              />
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Web Vitals */}
        <GlassCard className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Core Web Vitals</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">Largest Contentful Paint</span>
              </div>
              <div className="text-green-400 font-medium">1.2s</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">First Input Delay</span>
              </div>
              <div className="text-green-400 font-medium">8ms</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Gauge className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">Cumulative Layout Shift</span>
              </div>
              <div className="text-green-400 font-medium">0.05</div>
            </div>
          </div>
        </GlassCard>

        {/* Device Performance */}
        <GlassCard className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Smartphone className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Device Performance</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Desktop</span>
              </div>
              <div className="text-green-400 font-medium">95</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">Mobile</span>
              </div>
              <div className="text-yellow-400 font-medium">78</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">Slow 3G</span>
              </div>
              <div className="text-yellow-400 font-medium">65</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Optimization Suggestions */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Code className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Optimization Opportunities</h3>
        </div>
        
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              className="flex items-start space-x-4 p-4 bg-white/5 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex-shrink-0 mt-1">
                {suggestion.implemented ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-white">{suggestion.title}</h4>
                  <Badge variant={getImpactColor(suggestion.impact) as any}>
                    {suggestion.impact} impact
                  </Badge>
                </div>
                <p className="text-sm text-gray-400">{suggestion.description}</p>
                <div className="text-xs text-gray-500 mt-1">
                  Category: {suggestion.category}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
