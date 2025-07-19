'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  CheckCircle, 
  Play, 
  Clock, 
  BookOpen,
  Target,
  Code,
  HelpCircle,
  FileText,
  Zap,
  Star,
  ChevronRight
} from 'lucide-react';
import { Lesson, LessonProgress, LessonStatus } from '@/lib/curriculum/types';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { ProgressBar } from '@/components/xp/ProgressBar';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { cn } from '@/lib/utils';

interface LessonCardProps {
  lesson: Lesson;
  progress: LessonProgress;
  isUnlocked: boolean;
  unmetPrerequisites?: string[];
  onClick?: () => void;
  onStart?: () => void;
  className?: string;
  compact?: boolean;
}

export function LessonCard({
  lesson,
  progress,
  isUnlocked,
  unmetPrerequisites = [],
  onClick,
  onStart,
  className,
  compact = false
}: LessonCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusInfo = () => {
    if (!isUnlocked) {
      return {
        status: 'locked' as LessonStatus,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        borderColor: 'border-gray-500/30',
        icon: Lock
      };
    }

    switch (progress.status) {
      case 'completed':
        return {
          status: 'completed' as LessonStatus,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          icon: CheckCircle
        };
      case 'in_progress':
        return {
          status: 'in_progress' as LessonStatus,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          icon: Play
        };
      default:
        return {
          status: 'available' as LessonStatus,
          color: 'text-white',
          bgColor: 'bg-white/10',
          borderColor: 'border-white/20',
          icon: BookOpen
        };
    }
  };

  const getTypeIcon = () => {
    switch (lesson.type) {
      case 'theory':
        return BookOpen;
      case 'practical':
        return Code;
      case 'quiz':
        return HelpCircle;
      case 'project':
        return Target;
      case 'assessment':
        return FileText;
      default:
        return BookOpen;
    }
  };

  const getTypeColor = () => {
    switch (lesson.type) {
      case 'theory':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'practical':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'quiz':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'project':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'assessment':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getDifficultyColor = () => {
    switch (lesson.difficulty) {
      case 'beginner':
        return 'text-green-400';
      case 'intermediate':
        return 'text-yellow-400';
      case 'advanced':
        return 'text-orange-400';
      case 'expert':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const TypeIcon = getTypeIcon();
  const isCompleted = progress.status === 'completed';
  const progressPercentage = progress.progress || 0;

  if (compact) {
    return (
      <motion.div
        className={cn('relative group', className)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <GlassCard
          className={cn(
            'p-4 cursor-pointer transition-all duration-300 relative overflow-hidden',
            statusInfo.borderColor,
            isUnlocked ? 'hover:shadow-md' : 'opacity-60'
          )}
          onClick={isUnlocked ? onClick : undefined}
        >
          <div className="flex items-center space-x-3">
            {/* Type Icon */}
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              getTypeColor(),
              'border',
              !isUnlocked && 'grayscale'
            )}>
              <TypeIcon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                'font-medium truncate',
                isUnlocked ? 'text-white' : 'text-gray-400'
              )}>
                {lesson.title}
              </h4>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{lesson.estimatedDuration}min</span>
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-300">{lesson.xpReward} XP</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              {isUnlocked && progress.status !== 'available' && (
                <div className="w-16">
                  <ProgressBar
                    progress={progressPercentage}
                    color={isCompleted ? 'green' : 'blue'}
                    size="sm"
                    showPercentage={false}
                  />
                </div>
              )}
              <StatusIcon className={cn('w-4 h-4', statusInfo.color)} />
            </div>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

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
            {/* Lesson Info */}
            <div className="flex items-start space-x-3 flex-1">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                getTypeColor(),
                'border',
                !isUnlocked && 'grayscale'
              )}>
                <TypeIcon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  'text-lg font-semibold mb-1 transition-colors duration-300',
                  isUnlocked ? 'text-white' : 'text-gray-400'
                )}>
                  {lesson.title}
                </h3>
                
                <p className={cn(
                  'text-sm leading-relaxed line-clamp-2',
                  isUnlocked ? 'text-gray-300' : 'text-gray-500'
                )}>
                  {lesson.description}
                </p>
              </div>
            </div>

            {/* Status and Badges */}
            <div className="flex flex-col items-end space-y-2">
              <StatusIcon className={cn('w-5 h-5', statusInfo.color)} />
              
              {/* Type Badge */}
              <div className={cn(
                'px-2 py-1 rounded-full text-xs font-medium border',
                getTypeColor()
              )}>
                {lesson.type}
              </div>
            </div>
          </div>

          {/* Progress Section */}
          {isUnlocked && progress.status !== 'available' && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Progress</span>
                <span className="text-xs text-gray-300 font-mono">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              
              <ProgressBar
                progress={progressPercentage}
                color={isCompleted ? 'green' : 'blue'}
                size="sm"
                animated={true}
                showPercentage={false}
              />

              {/* Best Score for Quizzes */}
              {lesson.type === 'quiz' && progress.bestScore !== undefined && (
                <div className="mt-2 text-xs text-gray-400">
                  Best Score: <span className="text-green-400 font-medium">{progress.bestScore}%</span>
                </div>
              )}
            </div>
          )}

          {/* Prerequisites Warning */}
          {!isUnlocked && unmetPrerequisites.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Lock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">Prerequisites Required</span>
              </div>
              <div className="text-xs text-yellow-200">
                {unmetPrerequisites.slice(0, 1).join(', ')}
              </div>
            </div>
          )}

          {/* Lesson Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Duration</span>
              </div>
              <span className="text-sm font-medium text-white">
                {lesson.estimatedDuration}min
              </span>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Star className={cn('w-3 h-3', getDifficultyColor())} />
                <span className="text-xs text-gray-400">Difficulty</span>
              </div>
              <span className={cn('text-sm font-medium', getDifficultyColor())}>
                {lesson.difficulty}
              </span>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-gray-400">XP</span>
              </div>
              <span className="text-sm font-medium text-yellow-300">
                {lesson.xpReward}
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
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Review Lesson
                  </>
                ) : progress.status === 'in_progress' ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Continue
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Lesson
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

          {/* Optional Badge */}
          {lesson.isOptional && (
            <div className="absolute top-2 right-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-2 py-1">
              <span className="text-xs text-purple-300 font-medium">Optional</span>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
