'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star, Trophy, Target } from 'lucide-react';
// Using custom progress implementation instead of base Progress component
import { progressVariants } from '@/lib/animations/micro-interactions';
import { cn } from '@/lib/utils';

interface EnhancedProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  showAnimation?: boolean;
  showMilestones?: boolean;
  milestones?: number[];
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
  showXP?: boolean;
  xpGained?: number;
  showLevelUp?: boolean;
  level?: number;
  animated?: boolean;
  glowEffect?: boolean;
  showParticles?: boolean;
  className?: string;
}

const colorVariants = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  yellow: 'from-yellow-500 to-yellow-600',
  red: 'from-red-500 to-red-600',
};

const sizeVariants = {
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
};

export function EnhancedProgress({
  value,
  max = 100,
  label,
  showPercentage = true,
  showAnimation = true,
  showMilestones = false,
  milestones = [25, 50, 75],
  color = 'blue',
  size = 'md',
  showXP = false,
  xpGained = 0,
  showLevelUp = false,
  level = 1,
  animated = true,
  glowEffect = false,
  showParticles = false,
  className,
}: EnhancedProgressProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);

  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated]);

  useEffect(() => {
    if (xpGained > 0) {
      setShowXPAnimation(true);
      const timer = setTimeout(() => setShowXPAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [xpGained]);

  useEffect(() => {
    if (showLevelUp) {
      setShowLevelUpAnimation(true);
      const timer = setTimeout(() => setShowLevelUpAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showLevelUp]);

  const getMilestoneIcon = (milestone: number) => {
    if (milestone <= 25) return <Target className="w-3 h-3" />;
    if (milestone <= 50) return <Star className="w-3 h-3" />;
    if (milestone <= 75) return <Zap className="w-3 h-3" />;
    return <Trophy className="w-3 h-3" />;
  };

  return (
    <div className={cn('relative w-full', className)}>
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-300">{label}</span>
          )}
          {showPercentage && (
            <motion.span
              key={percentage}
              initial={{ scale: 1.2, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-sm font-semibold text-white"
            >
              {Math.round(percentage)}%
            </motion.span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div className="relative">
        <div
          className={cn(
            'w-full bg-gray-700 rounded-full overflow-hidden',
            sizeVariants[size]
          )}
        >
          {/* Progress bar */}
          <motion.div
            className={cn(
              'h-full bg-gradient-to-r rounded-full relative',
              colorVariants[color],
              glowEffect && 'shadow-lg filter drop-shadow-sm'
            )}
            variants={progressVariants}
            initial="initial"
            animate="animate"
            custom={animated ? percentage : 100}
            style={{ width: animated ? `${percentage}%` : `${percentage}%` }}
          >
            {/* Animated shine effect */}
            {showAnimation && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: 'easeInOut',
                }}
                style={{ width: '50%' }}
              />
            )}

            {/* Glow effect */}
            {glowEffect && (
              <motion.div
                className={cn(
                  'absolute inset-0 bg-gradient-to-r rounded-full opacity-50 blur-sm',
                  colorVariants[color]
                )}
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </motion.div>
        </div>

        {/* Milestones */}
        {showMilestones && (
          <div className="absolute inset-0 flex items-center">
            {milestones.map((milestone) => (
              <motion.div
                key={milestone}
                className="absolute flex items-center justify-center"
                style={{ left: `${milestone}%` }}
                initial={{ scale: 0 }}
                animate={{ scale: percentage >= milestone ? 1.2 : 1 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                    percentage >= milestone
                      ? 'bg-white border-white text-gray-800'
                      : 'bg-gray-700 border-gray-500 text-gray-400'
                  )}
                >
                  {getMilestoneIcon(milestone)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* XP and level display */}
      {showXP && (
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>{displayValue} / {max} XP</span>
          {level && <span>Level {level}</span>}
        </div>
      )}

      {/* XP gain animation */}
      <AnimatePresence>
        {showXPAnimation && xpGained > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [0, -30, -60, -100],
              scale: [0.5, 1.2, 1, 0.8],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              times: [0, 0.2, 0.8, 1],
              ease: 'easeOut',
            }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none"
          >
            <div className="flex items-center space-x-1 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
              <Zap className="w-3 h-3" />
              <span>+{xpGained} XP</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level up animation */}
      <AnimatePresence>
        {showLevelUpAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: 3,
                ease: 'easeInOut',
              }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>LEVEL UP!</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle effects */}
      <AnimatePresence>
        {showParticles && showLevelUpAnimation && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  scale: 0,
                  x: 0,
                  y: 0,
                  opacity: 1,
                }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 12) * 50,
                  y: Math.sin((i * Math.PI * 2) / 12) * 50,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: 'easeOut',
                }}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full pointer-events-none"
                style={{ transform: 'translate(-50%, -50%)' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Preset progress variants
export function XPProgress(props: Omit<EnhancedProgressProps, 'showXP' | 'color'>) {
  return (
    <EnhancedProgress
      {...props}
      showXP
      color="purple"
      showAnimation
      glowEffect
      showParticles
    />
  );
}

export function LearningProgress(props: Omit<EnhancedProgressProps, 'showMilestones' | 'color'>) {
  return (
    <EnhancedProgress
      {...props}
      showMilestones
      color="blue"
      showAnimation
      milestones={[25, 50, 75, 100]}
    />
  );
}

export function AchievementProgress(props: Omit<EnhancedProgressProps, 'color' | 'glowEffect'>) {
  return (
    <EnhancedProgress
      {...props}
      color="yellow"
      glowEffect
      showAnimation
      showParticles
    />
  );
}
