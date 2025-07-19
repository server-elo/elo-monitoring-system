'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star, Trophy, Target, BookOpen, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface XPGain {
  id: string;
  amount: number;
  source: string;
  description: string;
  timestamp: Date;
  position?: { x: number; y: number };
  color?: string;
  icon?: React.ComponentType<any>;
}

interface XPNotificationProps {
  xpGain: XPGain;
  onComplete: () => void;
  duration?: number;
  className?: string;
}

export function XPNotification({ 
  xpGain, 
  onComplete, 
  duration = 3000,
  className 
}: XPNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const getSourceIcon = () => {
    switch (xpGain.source) {
      case 'lesson':
        return BookOpen;
      case 'quiz':
        return Target;
      case 'project':
        return Code;
      case 'achievement':
        return Trophy;
      case 'streak':
        return Star;
      default:
        return Zap;
    }
  };

  const getSourceColor = () => {
    if (xpGain.color) return xpGain.color;
    
    switch (xpGain.source) {
      case 'lesson':
        return 'text-blue-400';
      case 'quiz':
        return 'text-green-400';
      case 'project':
        return 'text-purple-400';
      case 'achievement':
        return 'text-yellow-400';
      case 'streak':
        return 'text-orange-400';
      default:
        return 'text-yellow-400';
    }
  };

  const SourceIcon = xpGain.icon || getSourceIcon();
  const colorClass = getSourceColor();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ 
            opacity: 0, 
            scale: 0.5, 
            y: 20,
            x: xpGain.position?.x || 0,
            y: xpGain.position?.y || 0
          }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: -50,
            x: (xpGain.position?.x || 0) + (Math.random() - 0.5) * 40
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.8, 
            y: -100 
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            duration: 0.6
          }}
          className={cn(
            'fixed z-50 pointer-events-none',
            className
          )}
          style={{
            left: xpGain.position?.x || '50%',
            top: xpGain.position?.y || '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="relative">
            {/* Glow Effect */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, times: [0, 0.6, 1] }}
              className={cn(
                'absolute inset-0 rounded-full blur-md opacity-60',
                colorClass.replace('text-', 'bg-')
              )}
            />
            
            {/* Main Notification */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: 'spring', 
                stiffness: 400, 
                damping: 20,
                delay: 0.1
              }}
              className="relative bg-black/80 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 flex items-center space-x-3 shadow-2xl"
            >
              {/* Icon */}
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 20,
                  delay: 0.2
                }}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  colorClass.replace('text-', 'bg-').replace('400', '500/20'),
                  'border border-current'
                )}
              >
                <SourceIcon className={cn('w-4 h-4', colorClass)} />
              </motion.div>

              {/* XP Amount */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center space-x-2"
              >
                <span className={cn('text-2xl font-bold', colorClass)}>
                  +{xpGain.amount}
                </span>
                <span className="text-sm font-medium text-white">XP</span>
              </motion.div>

              {/* Description */}
              {xpGain.description && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-gray-300 max-w-32 truncate"
                >
                  {xpGain.description}
                </motion.div>
              )}
            </motion.div>

            {/* Sparkle Effects */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{ 
                  opacity: [0, 1, 0], 
                  scale: [0, 1, 0],
                  x: (Math.random() - 0.5) * 80,
                  y: (Math.random() - 0.5) * 80
                }}
                transition={{ 
                  duration: 1.5,
                  delay: 0.5 + i * 0.1,
                  ease: 'easeOut'
                }}
                className={cn(
                  'absolute w-2 h-2 rounded-full',
                  colorClass.replace('text-', 'bg-')
                )}
                style={{
                  left: '50%',
                  top: '50%'
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// XP Notification Manager Component
interface XPNotificationManagerProps {
  className?: string;
}

export function XPNotificationManager({ className }: XPNotificationManagerProps) {
  const [notifications, setNotifications] = useState<XPGain[]>([]);

  // Function to add new XP notification
  const addXPNotification = (xpGain: Omit<XPGain, 'id' | 'timestamp'>) => {
    const notification: XPGain = {
      ...xpGain,
      id: `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
  };

  // Function to remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Expose addXPNotification globally for easy access
  useEffect(() => {
    (window as any).addXPNotification = addXPNotification;
    
    return () => {
      delete (window as any).addXPNotification;
    };
  }, []);

  return (
    <div className={cn('fixed inset-0 pointer-events-none z-50', className)}>
      {notifications.map(notification => (
        <XPNotification
          key={notification.id}
          xpGain={notification}
          onComplete={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

// Hook for triggering XP notifications
export function useXPNotifications() {
  const triggerXPNotification = (xpGain: Omit<XPGain, 'id' | 'timestamp'>) => {
    if (typeof window !== 'undefined' && (window as any).addXPNotification) {
      (window as any).addXPNotification(xpGain);
    }
  };

  const triggerXPGain = (
    amount: number, 
    source: string, 
    description: string, 
    position?: { x: number; y: number },
    options?: { color?: string; icon?: React.ComponentType<any> }
  ) => {
    triggerXPNotification({
      amount,
      source,
      description,
      position,
      ...options
    });
  };

  return {
    triggerXPNotification,
    triggerXPGain
  };
}
