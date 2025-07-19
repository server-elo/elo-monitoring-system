'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPCounterProps {
  currentXP: number;
  previousXP?: number;
  showIncrease?: boolean;
  duration?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  showLabel?: boolean;
  color?: 'yellow' | 'blue' | 'green' | 'purple';
}

export function XPCounter({
  currentXP,
  previousXP,
  showIncrease = true,
  duration = 1000,
  className,
  size = 'md',
  showIcon = true,
  showLabel = true,
  color = 'yellow'
}: XPCounterProps) {
  const [displayXP, setDisplayXP] = useState(previousXP || currentXP);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();

  // Animate XP counter
  useEffect(() => {
    if (previousXP !== undefined && previousXP !== currentXP) {
      setIsAnimating(true);
      
      const startTime = Date.now();
      const startXP = previousXP;
      const targetXP = currentXP;
      const difference = targetXP - startXP;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = startXP + (difference * easeOutCubic);
        
        setDisplayXP(Math.round(currentValue));
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      setDisplayXP(currentXP);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentXP, previousXP, duration]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'text-sm',
          icon: 'w-3 h-3',
          number: 'text-lg font-semibold',
          label: 'text-xs'
        };
      case 'md':
        return {
          container: 'text-base',
          icon: 'w-4 h-4',
          number: 'text-xl font-bold',
          label: 'text-sm'
        };
      case 'lg':
        return {
          container: 'text-lg',
          icon: 'w-5 h-5',
          number: 'text-2xl font-bold',
          label: 'text-base'
        };
      case 'xl':
        return {
          container: 'text-xl',
          icon: 'w-6 h-6',
          number: 'text-3xl font-bold',
          label: 'text-lg'
        };
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'yellow':
        return {
          icon: 'text-yellow-400',
          number: 'text-yellow-300',
          label: 'text-yellow-200',
          glow: 'shadow-yellow-500/20'
        };
      case 'blue':
        return {
          icon: 'text-blue-400',
          number: 'text-blue-300',
          label: 'text-blue-200',
          glow: 'shadow-blue-500/20'
        };
      case 'green':
        return {
          icon: 'text-green-400',
          number: 'text-green-300',
          label: 'text-green-200',
          glow: 'shadow-green-500/20'
        };
      case 'purple':
        return {
          icon: 'text-purple-400',
          number: 'text-purple-300',
          label: 'text-purple-200',
          glow: 'shadow-purple-500/20'
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const colorClasses = getColorClasses();
  const xpIncrease = previousXP !== undefined ? currentXP - previousXP : 0;

  return (
    <div className={cn('flex items-center space-x-2', sizeClasses.container, className)}>
      {/* XP Icon */}
      {showIcon && (
        <motion.div
          animate={isAnimating ? { 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          } : {}}
          transition={{ duration: 0.6 }}
          className={cn(
            'rounded-full p-1 bg-gradient-to-br from-yellow-400/20 to-orange-500/20',
            'border border-yellow-400/30'
          )}
        >
          <Zap className={cn(sizeClasses.icon, colorClasses.icon)} />
        </motion.div>
      )}

      {/* XP Counter */}
      <div className="flex items-center space-x-1">
        <motion.span
          key={displayXP}
          initial={isAnimating ? { scale: 1.1, opacity: 0.8 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            sizeClasses.number,
            colorClasses.number,
            'font-mono tabular-nums',
            isAnimating && 'drop-shadow-lg'
          )}
        >
          {displayXP.toLocaleString()}
        </motion.span>
        
        {showLabel && (
          <span className={cn(sizeClasses.label, colorClasses.label, 'font-medium')}>
            XP
          </span>
        )}
      </div>

      {/* XP Increase Indicator */}
      {showIncrease && xpIncrease > 0 && isAnimating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-1"
        >
          <TrendingUp className={cn('w-3 h-3', colorClasses.icon)} />
          <span className={cn('text-sm font-semibold', colorClasses.number)}>
            +{xpIncrease}
          </span>
        </motion.div>
      )}

      {/* Glow Effect */}
      {isAnimating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 1, repeat: 2 }}
          className={cn(
            'absolute inset-0 rounded-lg blur-sm -z-10',
            colorClasses.glow
          )}
        />
      )}
    </div>
  );
}

// Session XP Summary Component
interface SessionXPSummaryProps {
  sessionXP: number;
  breakdown: Record<string, number>;
  className?: string;
}

export function SessionXPSummary({ sessionXP, breakdown, className }: SessionXPSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (sessionXP === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-gradient-to-r from-yellow-500/10 to-orange-500/10',
        'backdrop-blur-md border border-yellow-500/20 rounded-xl p-4',
        className
      )}
    >
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h4 className="text-white font-medium">Session XP</h4>
            <p className="text-yellow-300 text-sm font-mono">+{sessionXP} XP earned</p>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <TrendingUp className="w-4 h-4 text-gray-400" />
        </motion.div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="pt-4 space-y-2">
          {Object.entries(breakdown).map(([source, amount]) => (
            <div key={source} className="flex justify-between items-center text-sm">
              <span className="text-gray-300 capitalize">{source.replace('_', ' ')}</span>
              <span className="text-yellow-300 font-mono">+{amount} XP</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Compact XP Display for Navigation
interface CompactXPDisplayProps {
  currentXP: number;
  previousXP?: number;
  className?: string;
}

export function CompactXPDisplay({ currentXP, previousXP, className }: CompactXPDisplayProps) {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <Zap className="w-3 h-3 text-yellow-400" />
      <XPCounter
        currentXP={currentXP}
        previousXP={previousXP}
        size="sm"
        showIcon={false}
        showLabel={false}
        showIncrease={false}
        className="text-yellow-300"
      />
    </div>
  );
}
