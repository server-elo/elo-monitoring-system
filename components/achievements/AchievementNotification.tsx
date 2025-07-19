'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  X,
  Star,
  Zap,
  Gift,
  Crown,
  CheckCircle
} from 'lucide-react';
import { Achievement, AchievementNotification as IAchievementNotification } from '@/lib/achievements/types';
import { ACHIEVEMENT_RARITIES } from '@/lib/achievements/data';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { cn } from '@/lib/utils';

interface AchievementNotificationProps {
  notification: IAchievementNotification;
  achievement: Achievement;
  onDismiss: () => void;
  onCelebrate?: () => void;
  autoHide?: boolean;
  hideDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
}

export function AchievementNotification({
  notification,
  achievement,
  onDismiss,
  onCelebrate,
  autoHide = true,
  hideDelay = 5000,
  position = 'top-right'
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const rarity = ACHIEVEMENT_RARITIES[achievement.rarity];

  useEffect(() => {
    // Trigger celebration animation
    if (notification.type === 'unlock' && !notification.celebrated) {
      setShowCelebration(true);
      onCelebrate?.();
      
      // Hide celebration after animation
      setTimeout(() => setShowCelebration(false), 2000);
    }

    // Auto-hide notification
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for exit animation
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [notification, autoHide, hideDelay, onDismiss, onCelebrate]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'unlock':
        return achievement.rarity === 'legendary' ? Crown : Trophy;
      case 'progress':
        return Star;
      case 'milestone':
        return CheckCircle;
      default:
        return Trophy;
    }
  };

  const NotificationIcon = getNotificationIcon();

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ 
            opacity: 0, 
            scale: 0.8,
            x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0,
            y: position.includes('top') ? -50 : position.includes('bottom') ? 50 : 0
          }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ 
            opacity: 0, 
            scale: 0.8,
            x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0,
            y: position.includes('top') ? -50 : position.includes('bottom') ? 50 : 0
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
            duration: 0.5
          }}
          className={cn(
            'fixed z-50 max-w-sm',
            getPositionClasses()
          )}
        >
          <GlassCard 
            className={cn(
              'relative p-6 border-2 overflow-hidden',
              rarity.borderColor,
              rarity.glowColor,
              'shadow-2xl'
            )}
          >
            {/* Rarity Glow Background */}
            <div 
              className={cn(
                'absolute inset-0 opacity-20',
                rarity.bgColor
              )} 
            />

            {/* Celebration Particles */}
            <AnimatePresence>
              {showCelebration && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        opacity: 1, 
                        scale: 0,
                        x: '50%',
                        y: '50%'
                      }}
                      animate={{ 
                        opacity: 0, 
                        scale: 1,
                        x: `${50 + (Math.random() - 0.5) * 200}%`,
                        y: `${50 + (Math.random() - 0.5) * 200}%`,
                        rotate: Math.random() * 360
                      }}
                      transition={{ 
                        duration: 2,
                        delay: i * 0.1,
                        ease: 'easeOut'
                      }}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300, 
                      damping: 20,
                      delay: 0.2
                    }}
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      rarity.bgColor,
                      rarity.borderColor,
                      'border-2'
                    )}
                  >
                    <NotificationIcon className={cn('w-6 h-6', rarity.textColor)} />
                  </motion.div>
                  
                  <div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-lg font-bold text-white"
                    >
                      {notification.title}
                    </motion.h3>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium mt-1',
                        rarity.bgColor,
                        rarity.textColor,
                        'border',
                        rarity.borderColor
                      )}
                    >
                      {rarity.name}
                    </motion.div>
                  </div>
                </div>

                <EnhancedButton
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-400 hover:text-white"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </EnhancedButton>
              </div>

              {/* Achievement Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-4"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div>
                    <h4 className="text-xl font-semibold text-white">{achievement.title}</h4>
                    <p className="text-sm text-gray-300">{achievement.description}</p>
                  </div>
                </div>
              </motion.div>

              {/* Rewards */}
              {notification.rewards && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-black/20 rounded-lg p-4 mb-4"
                >
                  <h5 className="text-sm font-medium text-white mb-3 flex items-center">
                    <Gift className="w-4 h-4 mr-2 text-green-400" />
                    Rewards Earned
                  </h5>
                  
                  <div className="space-y-2">
                    {notification.rewards.xp > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-gray-300">Experience Points</span>
                        </div>
                        <span className="text-sm font-bold text-yellow-400">
                          +{notification.rewards.xp} XP
                        </span>
                      </div>
                    )}
                    
                    {notification.rewards.badge && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-gray-300">Badge</span>
                        </div>
                        <span className="text-sm font-medium text-purple-400">
                          {notification.rewards.badge}
                        </span>
                      </div>
                    )}
                    
                    {notification.rewards.title && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Crown className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-300">Title</span>
                        </div>
                        <span className="text-sm font-medium text-blue-400">
                          {notification.rewards.title}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Notification Manager Component
export function AchievementNotificationManager() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    notification: IAchievementNotification;
    achievement: Achievement;
    type: 'full' | 'toast';
  }>>([]);

  // const addNotification = (notification: IAchievementNotification, achievement: Achievement, type: 'full' | 'toast' = 'full') => {
  //   const id = `${notification.id}_${Date.now()}`;
  //   setNotifications(prev => [...prev, { id, notification, achievement, type }]);
  // };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleCelebration = () => {
    // Trigger confetti or other celebration effects
    if (typeof window !== 'undefined' && (window as any).confetti) {
      (window as any).confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {notifications.map(({ id, notification, achievement, type }) => (
        type === 'full' ? (
          <AchievementNotification
            key={id}
            notification={notification}
            achievement={achievement}
            onDismiss={() => removeNotification(id)}
            onCelebrate={handleCelebration}
            position="top-right"
          />
        ) : (
          <AchievementToast
            key={id}
            notification={notification}
            achievement={achievement}
            onDismiss={() => removeNotification(id)}
          />
        )
      ))}
    </div>
  );
}



// Toast notification for quick achievements
export function AchievementToast({
  notification,
  achievement,
  onDismiss,
  autoHide = true,
  hideDelay = 3000
}: Omit<AchievementNotificationProps, 'position'>) {
  const [isVisible, setIsVisible] = useState(true);
  const rarity = ACHIEVEMENT_RARITIES[achievement.rarity];

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <GlassCard 
            className={cn(
              'p-4 border cursor-pointer',
              rarity.borderColor,
              'hover:shadow-lg transition-shadow duration-200'
            )}
            onClick={handleDismiss}
          >
            <div className="flex items-center space-x-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
                rarity.bgColor
              )}>
                {achievement.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">
                  {achievement.title}
                </h4>
                <p className="text-xs text-gray-400 truncate">
                  {notification.message}
                </p>
                {notification.rewards?.xp && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">
                      +{notification.rewards.xp} XP
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {autoHide && (
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: hideDelay / 1000, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
              />
            )}
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
