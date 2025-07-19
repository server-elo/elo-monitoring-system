'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Clock, 
  Wifi, 
  WifiOff,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecurityStatusIndicatorProps {
  isScanning?: boolean;
  lastScanTime?: Date | null;
  securityScore?: number;
  issueCount?: number;
  llmStatus?: 'connected' | 'disconnected' | 'checking';
  scanSource?: 'local-llm' | 'fallback' | 'pattern-only';
  responseTime?: number;
  className?: string;
}

export const SecurityStatusIndicator: React.FC<SecurityStatusIndicatorProps> = ({
  isScanning = false,
  lastScanTime = null,
  securityScore = 100,
  issueCount = 0,
  llmStatus = 'checking',
  scanSource = 'pattern-only',
  responseTime = 0,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-collapse after 5 seconds
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => setIsExpanded(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const getSecurityIcon = () => {
    if (isScanning) return Activity;
    if (securityScore >= 90) return ShieldCheck;
    if (securityScore >= 70) return Shield;
    return ShieldAlert;
  };

  const getSecurityColor = () => {
    if (isScanning) return 'text-blue-400';
    if (securityScore >= 90) return 'text-green-400';
    if (securityScore >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getLLMStatusIcon = () => {
    switch (llmStatus) {
      case 'connected': return Wifi;
      case 'disconnected': return WifiOff;
      default: return Activity;
    }
  };

  const getLLMStatusColor = () => {
    switch (llmStatus) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getScanSourceLabel = () => {
    switch (scanSource) {
      case 'local-llm': return 'Local AI';
      case 'fallback': return 'Cloud AI';
      default: return 'Pattern';
    }
  };

  const SecurityIcon = getSecurityIcon();
  const LLMIcon = getLLMStatusIcon();

  return (
    <div className={cn('relative', className)}>
      {/* Main Status Indicator */}
      <motion.div
        className="flex items-center space-x-2 px-3 py-2 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Security Status */}
        <motion.div
          className={cn('flex items-center space-x-1', getSecurityColor())}
          animate={isScanning ? { rotate: 360 } : {}}
          transition={{ duration: 2, repeat: isScanning ? Infinity : 0, ease: 'linear' }}
        >
          <SecurityIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{securityScore}</span>
        </motion.div>

        {/* Issue Count */}
        {issueCount > 0 && (
          <motion.div
            className="flex items-center space-x-1 text-red-400"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs">{issueCount}</span>
          </motion.div>
        )}

        {/* LLM Status */}
        <motion.div
          className={cn('flex items-center', getLLMStatusColor())}
          animate={llmStatus === 'checking' ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 1.5, repeat: llmStatus === 'checking' ? Infinity : 0 }}
        >
          <LLMIcon className="w-3 h-3" />
        </motion.div>

        {/* Response Time */}
        {responseTime > 0 && (
          <div className="flex items-center space-x-1 text-gray-400">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{responseTime}ms</span>
          </div>
        )}
      </motion.div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="absolute top-full left-0 mt-2 p-4 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 shadow-xl z-50 min-w-64"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-3">
              {/* Security Score */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Security Score</span>
                <div className={cn('flex items-center space-x-1', getSecurityColor())}>
                  <SecurityIcon className="w-4 h-4" />
                  <span className="font-medium">{securityScore}/100</span>
                </div>
              </div>

              {/* Issues */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Issues Found</span>
                <div className="flex items-center space-x-1">
                  {issueCount > 0 ? (
                    <XCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  <span className="text-sm">{issueCount}</span>
                </div>
              </div>

              {/* LLM Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">AI Engine</span>
                <div className={cn('flex items-center space-x-1', getLLMStatusColor())}>
                  <LLMIcon className="w-4 h-4" />
                  <span className="text-sm">{getScanSourceLabel()}</span>
                </div>
              </div>

              {/* Last Scan */}
              {lastScanTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Last Scan</span>
                  <span className="text-sm text-gray-400">
                    {new Date(lastScanTime).toLocaleTimeString()}
                  </span>
                </div>
              )}

              {/* Performance */}
              {responseTime > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Response Time</span>
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-sm">{responseTime}ms</span>
                  </div>
                </div>
              )}

              {/* Status Message */}
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-gray-400">
                  {isScanning ? (
                    'Scanning code for security issues...'
                  ) : llmStatus === 'connected' ? (
                    'Real-time AI security analysis active'
                  ) : llmStatus === 'disconnected' ? (
                    'Using pattern-based analysis (AI offline)'
                  ) : (
                    'Checking AI connection...'
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
