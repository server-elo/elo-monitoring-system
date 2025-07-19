'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Trophy, 
  Star, 
  CheckCircle, 
  Target,
  Gift,
  Zap,
  Calendar
} from 'lucide-react';
import { Achievement, UserAchievement } from '@/lib/achievements/types';
import { ACHIEVEMENT_RARITIES } from '@/lib/achievements/data';
import { GlassCard } from '@/components/ui/Glassmorphism';
;
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement: UserAchievement;
  onClick?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function AchievementCard({ 
  achievement, 
  userAchievement, 
  onClick, 
  showDetails = false,
  className 
}: AchievementCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const rarity = ACHIEVEMENT_RARITIES[achievement.rarity];
  const isUnlocked = userAchievement.status === 'unlocked';
  const isInProgress = userAchievement.status === 'in_progress';
  const isLocked = userAchievement.status === 'locked';
  const isFeatured = userAchievement.status === 'featured';

  const getStatusIcon = () => {
    switch (userAchievement.status) {
      case 'unlocked':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'in_progress':
        return <Target className="w-5 h-5 text-blue-400" />;
      case 'featured':
        return <Star className="w-5 h-5 text-yellow-400" />;
      default:
        return <Lock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getProgressColor = () => {
    if (isUnlocked) return 'bg-green-500';
    if (isInProgress) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <motion.div
      className={cn('relative group', className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <GlassCard 
        className={cn(
          'p-6 cursor-pointer transition-all duration-300 relative overflow-hidden',
          rarity.borderColor,
          isUnlocked && 'ring-2 ring-green-500/30',
          isFeatured && 'ring-2 ring-yellow-500/30',
          isLocked && 'opacity-60',
          isHovered && 'shadow-lg',
          isHovered && rarity.glowColor
        )}
        onClick={onClick}
      >
        {/* Rarity Glow Effect */}
        <div 
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity duration-300',
            isHovered && 'opacity-20',
            rarity.bgColor
          )} 
        />

        {/* Achievement Icon */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              'w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-all duration-300',
              rarity.bgColor,
              rarity.borderColor,
              'border-2',
              isLocked && 'grayscale'
            )}>
              {achievement.icon}
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              {getStatusIcon()}
              
              {/* Rarity Badge */}
              <div className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                rarity.bgColor,
                rarity.textColor,
                'border',
                rarity.borderColor
              )}>
                {rarity.name}
              </div>
            </div>
          </div>

          {/* Achievement Title and Description */}
          <div className="mb-4">
            <h3 className={cn(
              'text-lg font-semibold mb-2 transition-colors duration-300',
              isUnlocked ? 'text-white' : 'text-gray-300'
            )}>
              {achievement.title}
            </h3>
            <p className={cn(
              'text-sm leading-relaxed',
              isUnlocked ? 'text-gray-300' : 'text-gray-400'
            )}>
              {achievement.description}
            </p>
          </div>

          {/* Progress Bar */}
          {!isUnlocked && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Progress</span>
                <span className="text-xs text-gray-300 font-mono">
                  {Math.round(userAchievement.progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', getProgressColor())}
                  initial={{ width: 0 }}
                  animate={{ width: `${userAchievement.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Requirements Preview */}
          {!isUnlocked && achievement.requirements.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-2">Requirements:</div>
              <div className="space-y-1">
                {achievement.requirements.slice(0, 2).map((req, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <Target className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-400">
                      {req.type.replace('_', ' ')}: {req.current}/{req.target}
                    </span>
                  </div>
                ))}
                {achievement.requirements.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{achievement.requirements.length - 2} more...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rewards Preview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {achievement.rewards.xp > 0 && (
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-300 font-medium">
                    {achievement.rewards.xp} XP
                  </span>
                </div>
              )}
              
              {achievement.rewards.badge && (
                <div className="flex items-center space-x-1">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-300">Badge</span>
                </div>
              )}
              
              {achievement.rewards.unlocks && achievement.rewards.unlocks.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Gift className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-300">Unlocks</span>
                </div>
              )}
            </div>

            {/* Unlock Date */}
            {isUnlocked && userAchievement.unlockedAt && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">
                  {formatDate(userAchievement.unlockedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Unlock Animation Overlay */}
          <AnimatePresence>
            {isUnlocked && isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-transparent rounded-xl pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Featured Badge */}
          {isFeatured && (
            <div className="absolute top-2 left-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-2 py-1">
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-yellow-300 font-medium">Featured</span>
              </div>
            </div>
          )}

          {/* Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-sm text-gray-400">Locked</span>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Hover Details */}
      <AnimatePresence>
        {showDetails && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <GlassCard className="p-4 border border-white/20">
              <div className="space-y-3">
                {achievement.longDescription && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">Description</h4>
                    <p className="text-xs text-gray-300">{achievement.longDescription}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Requirements</h4>
                  <div className="space-y-1">
                    {achievement.requirements.map((req, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">
                          {req.type.replace('_', ' ')}
                        </span>
                        <span className="text-gray-400 font-mono">
                          {req.current}/{req.target}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Rewards</h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-300">XP</span>
                      <span className="text-yellow-300 font-medium">{achievement.rewards.xp}</span>
                    </div>
                    {achievement.rewards.badge && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">Badge</span>
                        <span className="text-purple-300">{achievement.rewards.badge}</span>
                      </div>
                    )}
                    {achievement.rewards.title && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">Title</span>
                        <span className="text-blue-300">{achievement.rewards.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
