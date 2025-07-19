'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  CheckCircle, 
  Play, 
  Clock, 
  Trophy, 
  Star,
  ChevronRight,
  BookOpen,
  Target,
  Zap
} from 'lucide-react';
import { Module, ModuleProgress, ModuleStatus } from '@/lib/curriculum/types';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { ProgressBar } from '@/components/xp/ProgressBar';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { cn } from '@/lib/utils';

interface ModuleCardProps {
  module: Module;
  progress: ModuleProgress;
  isUnlocked: boolean;
  unmetPrerequisites?: string[];
  onClick?: () => void;
  onStart?: () => void;
  className?: string;
}

export function ModuleCard({
  module,
  progress,
  isUnlocked,
  unmetPrerequisites = [],
  onClick,
  onStart,
  className
}: ModuleCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusInfo = () => {
    if (!isUnlocked) {
      return {
        status: 'locked' as ModuleStatus,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        borderColor: 'border-gray-500/30',
        icon: Lock
      };
    }

    switch (progress.status) {
      case 'completed':
        return {
          status: 'completed' as ModuleStatus,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          icon: CheckCircle
        };
      case 'in_progress':
        return {
          status: 'in_progress' as ModuleStatus,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          icon: Play
        };
      default:
        return {
          status: 'available' as ModuleStatus,
          color: 'text-white',
          bgColor: 'bg-white/10',
          borderColor: 'border-white/20',
          icon: BookOpen
        };
    }
  };

  const getDifficultyColor = () => {
    switch (module.difficulty) {
      case 'beginner':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'intermediate':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'advanced':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'expert':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isCompleted = progress.status === 'completed';
  const progressPercentage = progress.progress || 0;

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
          statusInfo.borderColor,
          isUnlocked ? 'hover:shadow-lg' : 'opacity-60',
          isHovered && isUnlocked && 'shadow-xl'
        )}
        onClick={isUnlocked ? onClick : undefined}
      >
        {/* Background Pattern */}
        <div className={cn(
          'absolute inset-0 opacity-5 transition-opacity duration-300',
          isHovered && 'opacity-10',
          statusInfo.bgColor
        )} />

        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            {/* Module Icon and Title */}
            <div className="flex items-start space-x-3 flex-1">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300',
                statusInfo.bgColor,
                statusInfo.borderColor,
                'border-2',
                !isUnlocked && 'grayscale'
              )}>
                {module.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  'text-lg font-semibold mb-1 transition-colors duration-300',
                  isUnlocked ? 'text-white' : 'text-gray-400'
                )}>
                  {module.title}
                </h3>
                
                <p className={cn(
                  'text-sm leading-relaxed line-clamp-2',
                  isUnlocked ? 'text-gray-300' : 'text-gray-500'
                )}>
                  {module.description}
                </p>
              </div>
            </div>

            {/* Status Icon */}
            <div className="flex flex-col items-end space-y-2">
              <StatusIcon className={cn('w-5 h-5', statusInfo.color)} />
              
              {/* Difficulty Badge */}
              <div className={cn(
                'px-2 py-1 rounded-full text-xs font-medium border',
                getDifficultyColor()
              )}>
                {module.difficulty}
              </div>
            </div>
          </div>

          {/* Progress Section */}
          {isUnlocked && (
            <div className="mb-4">
              {progress.status !== 'available' && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Progress</span>
                    <span className="text-xs text-gray-300 font-mono">
                      {progress.lessonsCompleted || 0}/{module.lessons.length} lessons
                    </span>
                  </div>
                  
                  <ProgressBar
                    progress={progressPercentage}
                    color={isCompleted ? 'green' : 'blue'}
                    size="sm"
                    animated={true}
                    showPercentage={false}
                  />
                </div>
              )}

              {/* Completion Date */}
              {isCompleted && progress.completedAt && (
                <div className="flex items-center space-x-2 text-xs text-green-400 mb-2">
                  <CheckCircle className="w-3 h-3" />
                  <span>Completed {progress.completedAt.toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Prerequisites Warning */}
          {!isUnlocked && unmetPrerequisites.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Lock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">Prerequisites Required</span>
              </div>
              <div className="text-xs text-yellow-200">
                Complete: {unmetPrerequisites.slice(0, 2).join(', ')}
                {unmetPrerequisites.length > 2 && ` +${unmetPrerequisites.length - 2} more`}
              </div>
            </div>
          )}

          {/* Module Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Duration</span>
              </div>
              <span className="text-sm font-medium text-white">
                {module.estimatedDuration}h
              </span>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <BookOpen className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Lessons</span>
              </div>
              <span className="text-sm font-medium text-white">
                {module.lessons.length}
              </span>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-gray-400">XP</span>
              </div>
              <span className="text-sm font-medium text-yellow-300">
                {module.totalXPReward}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between">
            {isUnlocked ? (
              <EnhancedButton
                onClick={(e) => {
                  e.stopPropagation();
                  onStart?.();
                }}
                className={cn(
                  'flex-1 text-sm',
                  isCompleted 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : progress.status === 'in_progress'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                )}
                touchTarget
              >
                {isCompleted ? (
                  <>
                    <Trophy className="w-4 h-4 mr-2" />
                    Review Module
                  </>
                ) : progress.status === 'in_progress' ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Continue Learning
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Start Module
                  </>
                )}
              </EnhancedButton>
            ) : (
              <div className="flex-1 text-center py-2 text-gray-500 text-sm">
                <Lock className="w-4 h-4 mx-auto mb-1" />
                Locked
              </div>
            )}

            {/* Expand Arrow */}
            {isUnlocked && (
              <motion.div
                animate={{ x: isHovered ? 5 : 0 }}
                transition={{ duration: 0.2 }}
                className="ml-3"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </motion.div>
            )}
          </div>

          {/* Core Module Badge */}
          {module.isCore && (
            <div className="absolute top-2 right-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-2 py-1">
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-blue-300 font-medium">Core</span>
              </div>
            </div>
          )}

          {/* Completion Glow Effect */}
          {isCompleted && isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-transparent rounded-xl pointer-events-none"
            />
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
