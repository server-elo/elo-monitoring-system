'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLearning } from '@/lib/context/LearningContext';

interface LessonStep {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  requirements?: string[];
  codeTemplate?: string;
  expectedOutput?: string;
}

interface LessonProgress {
  lessonId: string;
  completedSteps: string[];
  currentStepId: string | null;
  totalXpEarned: number;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number; // in seconds
  attempts: number;
  lastActivity: Date;
}

interface LessonProgressHookReturn {
  progress: LessonProgress | null;
  isStepCompleted: (stepId: string) => boolean;
  isStepAccessible: (stepId: string, steps: LessonStep[]) => boolean;
  getCurrentStep: (steps: LessonStep[]) => LessonStep | null;
  getNextStep: (steps: LessonStep[]) => LessonStep | null;
  completeStep: (stepId: string, steps: LessonStep[]) => Promise<void>;
  resetProgress: () => Promise<void>;
  updateTimeSpent: (seconds: number) => void;
  incrementAttempts: () => void;
  getProgressStats: (steps: LessonStep[]) => {
    completedCount: number;
    totalSteps: number;
    progressPercentage: number;
    totalXpEarned: number;
    totalPossibleXp: number;
    estimatedTimeRemaining: number;
  };
}

export function useLessonProgress(lessonId: string): LessonProgressHookReturn {
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [timeTracker, setTimeTracker] = useState<{
    startTime: Date | null;
    totalTime: number;
  }>({ startTime: null, totalTime: 0 });

  const { addXP, completeLesson, triggerAchievementEvent } = useLearning();

  // Load progress from localStorage
  useEffect(() => {
    const loadProgress = () => {
      try {
        const saved = localStorage.getItem(`lesson_progress_${lessonId}`);
        if (saved) {
          const data = JSON.parse(saved);
          const progressData: LessonProgress = {
            ...data,
            startedAt: new Date(data.startedAt),
            completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
            lastActivity: new Date(data.lastActivity)
          };
          setProgress(progressData);
          setTimeTracker({ startTime: new Date(), totalTime: progressData.timeSpent });
        } else {
          // Initialize new progress
          const newProgress: LessonProgress = {
            lessonId,
            completedSteps: [],
            currentStepId: null,
            totalXpEarned: 0,
            startedAt: new Date(),
            timeSpent: 0,
            attempts: 0,
            lastActivity: new Date()
          };
          setProgress(newProgress);
          setTimeTracker({ startTime: new Date(), totalTime: 0 });
          saveProgress(newProgress);
        }
      } catch (error) {
        console.error('Failed to load lesson progress:', error);
      }
    };

    loadProgress();
  }, [lessonId]);

  // Auto-save progress periodically
  useEffect(() => {
    if (!progress) return;

    const interval = setInterval(() => {
      updateTimeSpent(0); // This will trigger a save with updated time
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [progress]);

  // Save progress to localStorage
  const saveProgress = useCallback((progressData: LessonProgress) => {
    try {
      localStorage.setItem(`lesson_progress_${lessonId}`, JSON.stringify(progressData));
    } catch (error) {
      console.error('Failed to save lesson progress:', error);
    }
  }, [lessonId]);

  const updateTimeSpent = useCallback((additionalSeconds: number) => {
    if (!progress) return;

    const now = new Date();
    const sessionTime = timeTracker.startTime ? 
      Math.floor((now.getTime() - timeTracker.startTime.getTime()) / 1000) : 0;
    
    const newTotalTime = timeTracker.totalTime + sessionTime + additionalSeconds;
    
    const updatedProgress = {
      ...progress,
      timeSpent: newTotalTime,
      lastActivity: now
    };

    setProgress(updatedProgress);
    setTimeTracker({ startTime: now, totalTime: newTotalTime });
    saveProgress(updatedProgress);
  }, [progress, timeTracker, saveProgress]);

  const incrementAttempts = useCallback(() => {
    if (!progress) return;

    const updatedProgress = {
      ...progress,
      attempts: progress.attempts + 1,
      lastActivity: new Date()
    };

    setProgress(updatedProgress);
    saveProgress(updatedProgress);
  }, [progress, saveProgress]);

  const isStepCompleted = useCallback((stepId: string): boolean => {
    return progress?.completedSteps.includes(stepId) || false;
  }, [progress]);

  const isStepAccessible = useCallback((stepId: string, steps: LessonStep[]): boolean => {
    if (!progress) return false;

    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex === 0) return true; // First step is always accessible

    // Check if previous step is completed
    const previousStep = steps[stepIndex - 1];
    return previousStep ? isStepCompleted(previousStep.id) : false;
  }, [progress, isStepCompleted]);

  const getCurrentStep = useCallback((steps: LessonStep[]): LessonStep | null => {
    if (!progress) return steps[0] || null;

    if (progress.currentStepId) {
      return steps.find(step => step.id === progress.currentStepId) || null;
    }

    // Find first incomplete step
    return steps.find(step => !isStepCompleted(step.id)) || null;
  }, [progress, isStepCompleted]);

  const getNextStep = useCallback((steps: LessonStep[]): LessonStep | null => {
    const currentStep = getCurrentStep(steps);
    if (!currentStep) return null;

    const currentIndex = steps.findIndex(step => step.id === currentStep.id);
    return steps[currentIndex + 1] || null;
  }, [getCurrentStep]);

  const completeStep = useCallback(async (stepId: string, steps: LessonStep[]) => {
    if (!progress) return;

    const step = steps.find(s => s.id === stepId);
    if (!step || isStepCompleted(stepId)) return;

    const newCompletedSteps = [...progress.completedSteps, stepId];
    const nextStep = getNextStep(steps);
    const isLessonComplete = newCompletedSteps.length === steps.length;

    const updatedProgress: LessonProgress = {
      ...progress,
      completedSteps: newCompletedSteps,
      currentStepId: nextStep?.id || null,
      totalXpEarned: progress.totalXpEarned + step.xpReward,
      lastActivity: new Date(),
      completedAt: isLessonComplete ? new Date() : undefined
    };

    setProgress(updatedProgress);
    saveProgress(updatedProgress);

    // Add XP to learning context
    addXP(step.xpReward);

    // Trigger achievement events - using xp_gain for step completion
    await triggerAchievementEvent({
      type: 'xp_gain',
      data: {
        lessonId,
        stepId,
        xpAmount: step.xpReward,
        difficulty: step.difficulty,
        timeSpent: updatedProgress.timeSpent
      }
    });

    // Complete lesson if all steps are done
    if (isLessonComplete) {
      const totalXp = steps.reduce((sum, s) => sum + s.xpReward, 0);
      await completeLesson(lessonId, totalXp);
      
      await triggerAchievementEvent({
        type: 'lesson_complete',
        data: {
          lessonId,
          totalXp,
          timeSpent: updatedProgress.timeSpent,
          attempts: updatedProgress.attempts,
          completedSteps: newCompletedSteps.length
        }
      });
    }
  }, [progress, isStepCompleted, getNextStep, saveProgress, addXP, triggerAchievementEvent, completeLesson, lessonId]);

  const resetProgress = useCallback(async () => {
    const newProgress: LessonProgress = {
      lessonId,
      completedSteps: [],
      currentStepId: null,
      totalXpEarned: 0,
      startedAt: new Date(),
      timeSpent: 0,
      attempts: 0,
      lastActivity: new Date()
    };

    setProgress(newProgress);
    setTimeTracker({ startTime: new Date(), totalTime: 0 });
    saveProgress(newProgress);
  }, [lessonId, saveProgress]);

  const getProgressStats = useCallback((steps: LessonStep[]) => {
    if (!progress) {
      return {
        completedCount: 0,
        totalSteps: steps.length,
        progressPercentage: 0,
        totalXpEarned: 0,
        totalPossibleXp: steps.reduce((sum, step) => sum + step.xpReward, 0),
        estimatedTimeRemaining: steps.reduce((sum, step) => sum + step.estimatedTime, 0)
      };
    }

    const completedCount = progress.completedSteps.length;
    const totalSteps = steps.length;
    const progressPercentage = (completedCount / totalSteps) * 100;
    const totalPossibleXp = steps.reduce((sum, step) => sum + step.xpReward, 0);
    
    const remainingSteps = steps.filter(step => !isStepCompleted(step.id));
    const estimatedTimeRemaining = remainingSteps.reduce((sum, step) => sum + step.estimatedTime, 0);

    return {
      completedCount,
      totalSteps,
      progressPercentage,
      totalXpEarned: progress.totalXpEarned,
      totalPossibleXp,
      estimatedTimeRemaining
    };
  }, [progress, isStepCompleted]);

  return {
    progress,
    isStepCompleted,
    isStepAccessible,
    getCurrentStep,
    getNextStep,
    completeStep,
    resetProgress,
    updateTimeSpent,
    incrementAttempts,
    getProgressStats
  };
}
