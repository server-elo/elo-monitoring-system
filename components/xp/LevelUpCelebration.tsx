'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  Star, 
  Sparkles, 
  Trophy, 
  Gift, 
  Zap,
  ChevronRight,
  X
} from 'lucide-react';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/utils';

export interface LevelUpData {
  newLevel: number;
  previousLevel: number;
  xpGained: number;
  totalXP: number;
  rewards?: {
    xp?: number;
    badges?: string[];
    titles?: string[];
    unlocks?: string[];
    features?: string[];
  };
  levelInfo?: {
    title: string;
    description: string;
    color: string;
  };
}

interface LevelUpCelebrationProps {
  levelUpData: LevelUpData;
  onClose: () => void;
  onContinue?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function LevelUpCelebration({
  levelUpData,
  onClose,
  onContinue,
  autoClose = false,
  autoCloseDelay = 8000
}: LevelUpCelebrationProps) {
  const [showRewards, setShowRewards] = useState(false);
  const [_celebrationPhase, setCelebrationPhase] = useState<'entrance' | 'celebration' | 'rewards'>('entrance');

  useEffect(() => {
    // Celebration sequence
    const timer1 = setTimeout(() => setCelebrationPhase('celebration'), 500);
    const timer2 = setTimeout(() => {
      setCelebrationPhase('rewards');
      setShowRewards(true);
    }, 2000);

    // Auto close
    let autoCloseTimer: NodeJS.Timeout;
    if (autoClose) {
      autoCloseTimer = setTimeout(onClose, autoCloseDelay);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };
  }, [autoClose, autoCloseDelay, onClose]);

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        {/* Confetti Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0,
                y: -100,
                x: Math.random() * window.innerWidth,
                rotate: 0,
                scale: 0
              }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                y: window.innerHeight + 100,
                rotate: Math.random() * 720,
                scale: [0, 1, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                ease: 'easeOut'
              }}
              className={cn(
                'absolute w-3 h-3 rounded-full',
                [
                  'bg-yellow-400',
                  'bg-blue-400', 
                  'bg-green-400',
                  'bg-purple-400',
                  'bg-red-400',
                  'bg-orange-400'
                ][Math.floor(Math.random() * 6)]
              )}
            />
          ))}
        </div>

        {/* Main Celebration Modal */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 25,
            delay: 0.2
          }}
          className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <GlassCard className="p-8 border-2 border-yellow-500/30 relative overflow-hidden">
            {/* Close Button */}
            <EnhancedButton
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 w-8 h-8 p-0 text-gray-400 hover:text-white z-10"
              aria-label="Close celebration"
            >
              <X className="w-4 h-4" />
            </EnhancedButton>

            {/* Golden Glow Background */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.3, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-500/20 to-yellow-600/20 rounded-xl"
            />

            {/* Level Up Header */}
            <div className="relative z-10 text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 200, 
                  damping: 15,
                  delay: 0.3
                }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/50"
              >
                <Crown className="w-12 h-12 text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-4xl font-bold text-white mb-2"
              >
                Level Up!
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center space-x-4 mb-4"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-300">
                    Level {levelUpData.previousLevel}
                  </div>
                  <div className="text-sm text-gray-400">Previous</div>
                </div>
                
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 1 }}
                >
                  <ChevronRight className="w-8 h-8 text-yellow-400" />
                </motion.div>
                
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 1.2 }}
                    className="text-4xl font-bold text-yellow-400"
                  >
                    Level {levelUpData.newLevel}
                  </motion.div>
                  <div className="text-sm text-yellow-300">New Level!</div>
                </div>
              </motion.div>

              {levelUpData.levelInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="text-center"
                >
                  <h2 className="text-xl font-semibold text-white mb-1">
                    {levelUpData.levelInfo.title}
                  </h2>
                  <p className="text-gray-300">
                    {levelUpData.levelInfo.description}
                  </p>
                </motion.div>
              )}
            </div>

            {/* XP Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mb-8"
            >
              <div className="text-center mb-4">
                <span className="text-lg font-semibold text-yellow-300">
                  +{levelUpData.xpGained} XP Gained
                </span>
              </div>
              
              <ProgressBar
                progress={100}
                previousProgress={0}
                label="Level Progress"
                color="yellow"
                size="lg"
                animated={true}
                glowEffect={true}
                onComplete={() => {
                  // Trigger confetti or other effects
                }}
              />
            </motion.div>

            {/* Rewards Section */}
            <AnimatePresence>
              {showRewards && levelUpData.rewards && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
                      <Gift className="w-6 h-6 mr-2 text-green-400" />
                      Rewards Unlocked!
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* XP Bonus */}
                    {levelUpData.rewards.xp && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 text-center"
                      >
                        <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <div className="text-lg font-bold text-yellow-300">
                          +{levelUpData.rewards.xp} Bonus XP
                        </div>
                        <div className="text-sm text-gray-400">Level up bonus</div>
                      </motion.div>
                    )}

                    {/* Badges */}
                    {levelUpData.rewards.badges && levelUpData.rewards.badges.length > 0 && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 text-center"
                      >
                        <Trophy className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <div className="text-lg font-bold text-purple-300">
                          {levelUpData.rewards.badges.length} New Badge{levelUpData.rewards.badges.length > 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-400">
                          {levelUpData.rewards.badges.join(', ')}
                        </div>
                      </motion.div>
                    )}

                    {/* Titles */}
                    {levelUpData.rewards.titles && levelUpData.rewards.titles.length > 0 && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center"
                      >
                        <Star className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <div className="text-lg font-bold text-blue-300">
                          New Title{levelUpData.rewards.titles.length > 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-400">
                          {levelUpData.rewards.titles.join(', ')}
                        </div>
                      </motion.div>
                    )}

                    {/* Unlocks */}
                    {levelUpData.rewards.unlocks && levelUpData.rewards.unlocks.length > 0 && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center"
                      >
                        <Sparkles className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <div className="text-lg font-bold text-green-300">
                          Content Unlocked
                        </div>
                        <div className="text-sm text-gray-400">
                          {levelUpData.rewards.unlocks.join(', ')}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: showRewards ? 1.5 : 1 }}
              className="flex justify-center space-x-4 mt-8"
            >
              <EnhancedButton
                onClick={handleContinue}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-3 text-lg font-semibold"
                touchTarget
              >
                <Crown className="w-5 h-5 mr-2" />
                Continue Learning
              </EnhancedButton>
            </motion.div>

            {/* Sparkle Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0,
                    scale: 0,
                    x: Math.random() * 100 + '%',
                    y: Math.random() * 100 + '%'
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    rotate: 360
                  }}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 3,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 5
                  }}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                />
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Level Up Manager Component
interface LevelUpManagerProps {
  className?: string;
}

export function LevelUpManager({ className }: LevelUpManagerProps) {
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);

  // Function to trigger level up celebration
  const triggerLevelUp = (data: LevelUpData) => {
    setLevelUpData(data);
  };

  // Function to close celebration
  const closeLevelUp = () => {
    setLevelUpData(null);
  };

  // Expose triggerLevelUp globally for easy access
  useEffect(() => {
    (window as any).triggerLevelUp = triggerLevelUp;
    
    return () => {
      delete (window as any).triggerLevelUp;
    };
  }, []);

  return (
    <div className={className}>
      {levelUpData && (
        <LevelUpCelebration
          levelUpData={levelUpData}
          onClose={closeLevelUp}
        />
      )}
    </div>
  );
}

// Hook for triggering level up celebrations
export function useLevelUp() {
  const triggerLevelUp = (data: LevelUpData) => {
    if (typeof window !== 'undefined' && (window as any).triggerLevelUp) {
      (window as any).triggerLevelUp(data);
    }
  };

  return { triggerLevelUp };
}
