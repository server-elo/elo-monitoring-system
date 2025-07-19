'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Sparkles, CheckCircle, Target, Award, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/hooks/useSettings';
import { GlassContainer } from '@/components/ui/Glassmorphism';

// Confetti particle component
interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

export function ConfettiExplosion({ 
  trigger, 
  particleCount = 50,
  colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
  duration = 3000,
  className
}: {
  trigger: boolean;
  particleCount?: number;
  colors?: string[];
  duration?: number;
  className?: string;
}) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [isActive, setIsActive] = useState(false);
  // Animation ref removed - not needed with current implementation
  const { settings } = useSettings();
  const shouldAnimate = !settings?.accessibility?.reduceMotion;

  useEffect(() => {
    if (trigger && shouldAnimate) {
      // Create particles
      const newParticles: ConfettiParticle[] = [];
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10
        });
      }
      
      setParticles(newParticles);
      setIsActive(true);

      // Auto-cleanup after duration
      setTimeout(() => {
        setIsActive(false);
        setParticles([]);
      }, duration);
    }
  }, [trigger, particleCount, colors, duration, shouldAnimate]);

  if (!isActive || !shouldAnimate) return null;

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-50", className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: particle.color,
            width: particle.size,
            height: particle.size
          }}
          initial={{
            x: `${particle.x}%`,
            y: `${particle.y}%`,
            rotate: particle.rotation,
            opacity: 1
          }}
          animate={{
            x: `${particle.x + particle.vx * 10}%`,
            y: `${particle.y + particle.vy * 10}%`,
            rotate: particle.rotation + particle.rotationSpeed * 10,
            opacity: 0
          }}
          transition={{
            duration: duration / 1000,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
}

// Celebration modal for major achievements
export function CelebrationModal({
  isOpen,
  onClose,
  type = 'achievement',
  title,
  description,
  xp,
  level,
  badge,
  autoClose = true,
  autoCloseDelay = 5000
}: {
  isOpen: boolean;
  onClose: () => void;
  type?: 'achievement' | 'level-up' | 'course-complete' | 'streak' | 'milestone';
  title: string;
  description?: string;
  xp?: number;
  level?: number;
  badge?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}) {
  const { settings } = useSettings();
  const shouldAnimate = !settings?.accessibility?.reduceMotion;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      if (autoClose) {
        const timer = setTimeout(onClose, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  const getTypeConfig = () => {
    switch (type) {
      case 'level-up':
        return {
          icon: Crown,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          title: title || `Level ${level} Reached!`,
          emoji: '👑'
        };
      case 'course-complete':
        return {
          icon: Trophy,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          title: title || 'Course Completed!',
          emoji: '🏆'
        };
      case 'streak':
        return {
          icon: Flame,
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-500/30',
          title: title || 'Streak Achievement!',
          emoji: '🔥'
        };
      case 'milestone':
        return {
          icon: Target,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/30',
          title: title || 'Milestone Reached!',
          emoji: '🎯'
        };
      default:
        return {
          icon: Award,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          title: title || 'Achievement Unlocked!',
          emoji: '🏅'
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <ConfettiExplosion trigger={showConfetti} />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ 
                type: "spring", 
                damping: 20, 
                stiffness: 300,
                duration: shouldAnimate ? 0.6 : 0
              }}
              onClick={(e) => e.stopPropagation()}
              className="relative"
            >
              <GlassContainer 
                intensity="heavy" 
                className={cn(
                  "p-8 max-w-md w-full text-center border-2",
                  config.bgColor,
                  config.borderColor
                )}
              >
                {/* Floating particles around the icon */}
                <div className="relative mb-6">
                  <motion.div
                    animate={shouldAnimate ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className={cn(
                      "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4",
                      config.bgColor,
                      config.borderColor,
                      "border-2"
                    )}
                  >
                    <Icon className={cn("w-10 h-10", config.color)} />
                  </motion.div>
                  
                  {/* Floating sparkles */}
                  {shouldAnimate && [1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        top: `${20 + i * 15}%`,
                        left: `${10 + i * 20}%`
                      }}
                      animate={{
                        y: [-10, -20, -10],
                        opacity: [0.5, 1, 0.5],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    >
                      <Sparkles className={cn("w-4 h-4", config.color)} />
                    </motion.div>
                  ))}
                </div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shouldAnimate ? 0.2 : 0 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  {config.title}
                </motion.h2>

                {description && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: shouldAnimate ? 0.3 : 0 }}
                    className="text-gray-300 mb-4"
                  >
                    {description}
                  </motion.p>
                )}

                {/* XP and Level display */}
                <div className="flex justify-center space-x-4 mb-6">
                  {xp && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: shouldAnimate ? 0.4 : 0 }}
                      className="bg-white/10 rounded-lg px-4 py-2"
                    >
                      <div className="text-yellow-400 font-bold text-lg">+{xp} XP</div>
                      <div className="text-gray-400 text-sm">Experience</div>
                    </motion.div>
                  )}
                  
                  {level && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: shouldAnimate ? 0.5 : 0 }}
                      className="bg-white/10 rounded-lg px-4 py-2"
                    >
                      <div className="text-purple-400 font-bold text-lg">Level {level}</div>
                      <div className="text-gray-400 text-sm">Achieved</div>
                    </motion.div>
                  )}
                </div>

                {badge && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: shouldAnimate ? 0.6 : 0 }}
                    className="mb-6"
                  >
                    <div className="text-4xl mb-2">{badge}</div>
                    <div className="text-gray-400 text-sm">Badge Earned</div>
                  </motion.div>
                )}

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shouldAnimate ? 0.7 : 0 }}
                  onClick={onClose}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Continue Learning
                </motion.button>
              </GlassContainer>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Quick success animation for small actions
export function QuickSuccessAnimation({
  trigger,
  message = "Success!",
  icon: CustomIcon,
  position = 'center',
  duration = 2000
}: {
  trigger: boolean;
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
  position?: 'center' | 'top' | 'bottom';
  duration?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const { settings } = useSettings();
  const shouldAnimate = !settings?.accessibility?.reduceMotion;

  useEffect(() => {
    if (trigger) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  const Icon = CustomIcon || CheckCircle;

  const positionClasses = {
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    top: 'top-20 left-1/2 -translate-x-1/2',
    bottom: 'bottom-20 left-1/2 -translate-x-1/2'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -20 }}
          transition={{ 
            duration: shouldAnimate ? 0.3 : 0,
            ease: "easeOut"
          }}
          className={cn(
            "fixed z-50 pointer-events-none",
            positionClasses[position]
          )}
        >
          <GlassContainer intensity="medium" className="p-4 flex items-center space-x-3">
            <motion.div
              animate={shouldAnimate ? {
                scale: [1, 1.2, 1],
                rotate: [0, 360]
              } : {}}
              transition={{
                duration: 0.6,
                ease: "easeInOut"
              }}
            >
              <Icon className="w-6 h-6 text-green-400" />
            </motion.div>
            <span className="text-white font-medium">{message}</span>
          </GlassContainer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Progress celebration for incremental achievements
export function ProgressCelebration({
  progress,
  milestone,
  label = "Progress",
  showParticles = true
}: {
  progress: number;
  milestone: number;
  label?: string;
  showParticles?: boolean;
}) {
  const [showCelebration, setShowCelebration] = useState(false);
  const { settings } = useSettings();
  const shouldAnimate = !settings?.accessibility?.reduceMotion;

  useEffect(() => {
    if (progress >= milestone && progress > 0) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [progress, milestone]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{label}</span>
        <span className="text-white text-sm font-medium">{progress}%</span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
        <motion.div
          className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 relative"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: shouldAnimate ? 0.8 : 0, ease: "easeOut" }}
        >
          {showCelebration && shouldAnimate && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: 1, repeat: 2 }}
            />
          )}
        </motion.div>
        
        {/* Milestone marker */}
        <div 
          className="absolute top-0 h-3 w-1 bg-yellow-400"
          style={{ left: `${milestone}%` }}
        />
      </div>
      
      {showCelebration && showParticles && (
        <ConfettiExplosion 
          trigger={showCelebration} 
          particleCount={20}
          duration={2000}
        />
      )}
    </div>
  );
}
