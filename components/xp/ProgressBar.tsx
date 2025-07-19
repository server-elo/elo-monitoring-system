'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  previousProgress?: number;
  label?: string;
  showPercentage?: boolean;
  showValues?: boolean;
  currentValue?: number;
  maxValue?: number;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  glowEffect?: boolean;
  className?: string;
  onComplete?: () => void;
}

export function ProgressBar({
  progress,
  previousProgress,
  label,
  showPercentage = true,
  showValues = false,
  currentValue,
  maxValue,
  color = 'blue',
  size = 'md',
  animated = true,
  glowEffect = false,
  className,
  onComplete
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(previousProgress || progress);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate progress changes
  useEffect(() => {
    if (previousProgress !== undefined && previousProgress !== progress) {
      setIsAnimating(true);
      
      const startTime = Date.now();
      const startProgress = previousProgress;
      const targetProgress = progress;
      const difference = targetProgress - startProgress;
      const duration = Math.abs(difference) * 20; // 20ms per percentage point

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const animationProgress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutCubic = 1 - Math.pow(1 - animationProgress, 3);
        const currentValue = startProgress + (difference * easeOutCubic);
        
        setDisplayProgress(currentValue);
        
        if (animationProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          if (progress >= 100 && onComplete) {
            onComplete();
          }
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, previousProgress, onComplete]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-2',
          text: 'text-xs'
        };
      case 'md':
        return {
          container: 'h-3',
          text: 'text-sm'
        };
      case 'lg':
        return {
          container: 'h-4',
          text: 'text-base'
        };
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
          glow: 'shadow-blue-500/50',
          text: 'text-blue-300'
        };
      case 'green':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-green-600',
          glow: 'shadow-green-500/50',
          text: 'text-green-300'
        };
      case 'yellow':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          glow: 'shadow-yellow-500/50',
          text: 'text-yellow-300'
        };
      case 'purple':
        return {
          bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
          glow: 'shadow-purple-500/50',
          text: 'text-purple-300'
        };
      case 'red':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-red-600',
          glow: 'shadow-red-500/50',
          text: 'text-red-300'
        };
      case 'orange':
        return {
          bg: 'bg-gradient-to-r from-orange-500 to-red-500',
          glow: 'shadow-orange-500/50',
          text: 'text-orange-300'
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const colorClasses = getColorClasses();
  const clampedProgress = Math.max(0, Math.min(100, displayProgress));

  return (
    <div className={cn('w-full', className)}>
      {/* Label and Values */}
      {(label || showPercentage || showValues) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className={cn('font-medium text-gray-300', sizeClasses.text)}>
              {label}
            </span>
          )}
          
          <div className="flex items-center space-x-2">
            {showValues && currentValue !== undefined && maxValue !== undefined && (
              <span className={cn('font-mono text-gray-400', sizeClasses.text)}>
                {currentValue}/{maxValue}
              </span>
            )}
            
            {showPercentage && (
              <motion.span
                key={Math.round(clampedProgress)}
                initial={isAnimating ? { scale: 1.1 } : false}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className={cn('font-mono font-semibold', colorClasses.text, sizeClasses.text)}
              >
                {Math.round(clampedProgress)}%
              </motion.span>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar Container */}
      <div className={cn(
        'relative w-full bg-gray-700 rounded-full overflow-hidden',
        sizeClasses.container
      )}>
        {/* Background Glow */}
        {glowEffect && isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className={cn(
              'absolute inset-0 rounded-full blur-sm',
              colorClasses.glow
            )}
          />
        )}

        {/* Progress Fill */}
        <motion.div
          className={cn(
            'h-full rounded-full relative overflow-hidden',
            colorClasses.bg
          )}
          initial={{ width: `${previousProgress || 0}%` }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            type: animated ? 'spring' : 'tween',
            stiffness: 100,
            damping: 20,
            duration: animated ? undefined : 0.5
          }}
        >
          {/* Shine Effect */}
          {animated && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.5,
                repeat: isAnimating ? Infinity : 0,
                repeatDelay: 2,
                ease: 'easeInOut'
              }}
              className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
            />
          )}

          {/* Pulse Effect for Completion */}
          {clampedProgress >= 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: 0.8, repeat: 3 }}
              className="absolute inset-0 bg-white/20 rounded-full"
            />
          )}
        </motion.div>

        {/* Completion Sparkles */}
        {clampedProgress >= 100 && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: `${20 + i * 15}%`,
                  y: '50%'
                }}
                animate={{ 
                  opacity: [0, 1, 0], 
                  scale: [0, 1, 0],
                  y: ['50%', '20%', '50%']
                }}
                transition={{ 
                  duration: 1,
                  delay: i * 0.1,
                  ease: 'easeOut'
                }}
                className="absolute w-1 h-1 bg-white rounded-full"
              />
            ))}
          </div>
        )}
      </div>

      {/* Progress Indicator Text */}
      {isAnimating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-2 text-center"
        >
          <span className={cn('text-xs font-medium', colorClasses.text)}>
            {clampedProgress >= 100 ? 'Complete!' : 'In Progress...'}
          </span>
        </motion.div>
      )}
    </div>
  );
}

// Level Progress Bar with XP Display
interface LevelProgressBarProps {
  currentLevel: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  previousXP?: number;
  className?: string;
}

export function LevelProgressBar({
  currentLevel,
  currentXP,
  xpForCurrentLevel,
  xpForNextLevel,
  previousXP,
  className
}: LevelProgressBarProps) {
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = (xpInCurrentLevel / xpNeededForNextLevel) * 100;
  
  const previousXPInLevel = previousXP ? Math.max(0, previousXP - xpForCurrentLevel) : undefined;
  const previousProgressPercentage = previousXPInLevel ? (previousXPInLevel / xpNeededForNextLevel) * 100 : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-300">
          Level {currentLevel}
        </span>
        <span className="text-sm font-medium text-gray-300">
          Level {currentLevel + 1}
        </span>
      </div>
      
      <ProgressBar
        progress={progressPercentage}
        previousProgress={previousProgressPercentage}
        currentValue={xpInCurrentLevel}
        maxValue={xpNeededForNextLevel}
        showValues={true}
        showPercentage={false}
        color="yellow"
        size="md"
        animated={true}
        glowEffect={true}
      />
      
      <div className="text-center">
        <span className="text-xs text-gray-400">
          {xpNeededForNextLevel - xpInCurrentLevel} XP to next level
        </span>
      </div>
    </div>
  );
}
