'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Star, Trophy, Target, Clock, BookOpen } from 'lucide-react';
import { Card } from '../ui/card';
import { useLearning } from '@/lib/context/LearningContext';
import { logger } from '@/lib/api/logger';
import { cn } from '@/lib/utils';

interface LessonStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  xpReward: number;
  estimatedTime: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface LessonProgressTrackerProps {
  lessonId: string;
  steps: LessonStep[];
  currentStepId?: string;
  onStepComplete?: (stepId: string, xpEarned: number) => void;
  onLessonComplete?: (lessonId: string, totalXp: number) => void;
  className?: string;
  compact?: boolean;
}

export function LessonProgressTracker({
  lessonId,
  steps,
  currentStepId,
  // onStepComplete,
  // onLessonComplete,
  className,
  compact = false
}: LessonProgressTrackerProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<string | null>(currentStepId || null);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [showCelebration] = useState(false);
  
  const { state: _state } = useLearning();

  // Calculate progress metrics
  const completedCount = completedSteps.size;
  const totalSteps = steps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;
  const isLessonComplete = completedCount === totalSteps;
  const totalPossibleXp = steps.reduce((sum, step) => sum + step.xpReward, 0);
  const estimatedTotalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);

  // Load saved progress
  useEffect(() => {
    const savedProgress = localStorage.getItem(`lesson_progress_${lessonId}`);
    if (savedProgress) {
      try {
        const { completed, xp, currentStepId: savedCurrentStep } = JSON.parse(savedProgress);
        setCompletedSteps(new Set(completed));
        setTotalXpEarned(xp);
        setCurrentStep(savedCurrentStep);
      } catch (error) {
        logger.error('Failed to load lesson progress:', {}, error as Error);
      }
    }
  }, [lessonId]);

  // Save progress to localStorage
  const _saveProgress = (completed: Set<string>, xp: number, currentStepId: string | null) => {
    try {
      const progressData = {
        completed: Array.from(completed),
        xp,
        currentStepId,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`lesson_progress_${lessonId}`, JSON.stringify(progressData));
    } catch (error) {
      logger.error('Failed to save lesson progress:', {}, error as Error);
    }
  };

  // Step completion is handled by parent component
  // const _completeStep = async (stepId: string) => {
  //   const step = steps.find(s => s.id === stepId);
  //   if (!step || completedSteps.has(stepId)) return;
  //
  //   const newCompletedSteps = new Set(completedSteps);
  //   newCompletedSteps.add(stepId);
  //   setCompletedSteps(newCompletedSteps);
  //
  //   const newTotalXp = totalXpEarned + step.xpReward;
  //   setTotalXpEarned(newTotalXp);
  //
  //   // Add XP to learning context
  //   addXP(step.xpReward);

  //   // Find next step
  //   const currentIndex = steps.findIndex(s => s.id === stepId);
  //   const nextStep = steps[currentIndex + 1];
  //   setCurrentStep(nextStep?.id || null);
  //
  //   // Save progress
  //   saveProgress(newCompletedSteps, newTotalXp, nextStep?.id || null);
  //
  //   // Trigger callbacks
  //   onStepComplete?.(stepId, step.xpReward);
  //
  //   // Check if lesson is complete
  //   if (newCompletedSteps.size === totalSteps) {
  //     setShowCelebration(true);
  //     setTimeout(() => setShowCelebration(false), 3000);
  //     
  //     await completeLesson(lessonId, totalPossibleXp);
  //     onLessonComplete?.(lessonId, newTotalXp);
  //   }
  // };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-400 bg-green-500/10 border-green-400/30';
      case 'intermediate':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-400/30';
      case 'advanced':
        return 'text-red-400 bg-red-500/10 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-400/30';
    }
  };

  if (compact) {
    return (
      <Card className={cn('p-4 bg-white/10 backdrop-blur-md border border-white/20', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">{Math.round(progressPercentage)}%</span>
              </div>
              {isLessonComplete && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <div>
              <div className="font-medium text-white">
                {completedCount} of {totalSteps} steps completed
              </div>
              <div className="text-sm text-gray-400">
                {totalXpEarned} / {totalPossibleXp} XP earned
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-sm text-gray-400">Est. Time</div>
              <div className="text-white">{estimatedTotalTime}m</div>
            </div>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6 bg-white/10 backdrop-blur-md border border-white/20', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Lesson Progress</h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Total XP</div>
            <div className="text-lg font-bold text-yellow-400">{totalXpEarned}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Progress</div>
            <div className="text-lg font-bold text-blue-400">{Math.round(progressPercentage)}%</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{completedCount} of {totalSteps} steps</span>
          <span>{estimatedTotalTime} minutes total</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isActive = currentStep === step.id;
          const isAccessible = index === 0 || completedSteps.has(steps[index - 1]?.id);

          return (
            <motion.div
              key={step.id}
              className={cn(
                'flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200',
                isCompleted && 'bg-green-500/10 border-green-400/30',
                isActive && !isCompleted && 'bg-blue-500/10 border-blue-400/30',
                !isCompleted && !isActive && isAccessible && 'bg-white/5 border-white/20 hover:bg-white/10',
                !isAccessible && 'bg-gray-500/5 border-gray-500/20 opacity-50'
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : isActive ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Target className="w-6 h-6 text-blue-400" />
                  </motion.div>
                ) : (
                  <Circle className="w-6 h-6 text-gray-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    'font-medium',
                    isCompleted && 'text-green-400',
                    isActive && !isCompleted && 'text-blue-400',
                    !isCompleted && !isActive && 'text-white'
                  )}>
                    {step.title}
                  </h4>
                  
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs border',
                      getDifficultyColor(step.difficulty)
                    )}>
                      {step.difficulty}
                    </span>
                    
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Star className="w-4 h-4" />
                      <span className="text-sm">{step.xpReward}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{step.estimatedTime}m</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 mt-1">{step.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-2xl text-center"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: 3, duration: 0.5 }}
            >
              <Trophy className="w-16 h-16 text-white mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Lesson Complete!</h2>
              <p className="text-white/90">You earned {totalPossibleXp} XP!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
