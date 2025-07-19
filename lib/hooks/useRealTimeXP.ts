'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLearning } from '@/lib/context/LearningContext';
import { useAchievements } from './useAchievements';
import { getLevelInfo } from '@/lib/achievements/data';
import { useXPNotifications } from '@/components/xp/XPNotification';
import { useLevelUp } from '@/components/xp/LevelUpCelebration';

export interface XPUpdate {
  amount: number;
  source: string;
  description: string;
  position?: { x: number; y: number };
  timestamp: Date;
}

export interface LevelInfo {
  currentLevel: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressToNext: number;
  title: string;
  description: string;
}

export interface SessionXPData {
  totalXP: number;
  breakdown: Record<string, number>;
  startTime: Date;
  lastUpdate: Date;
}

export function useRealTimeXP() {
  const { state: learningState, addXP, triggerAchievementEvent: _triggerAchievementEvent } = useLearning();
  const { triggerEvent } = useAchievements();
  const { triggerXPGain } = useXPNotifications();
  const { triggerLevelUp } = useLevelUp();
  
  const [previousXP, setPreviousXP] = useState<number>(learningState.xp);
  const [sessionXP, setSessionXP] = useState<SessionXPData>({
    totalXP: 0,
    breakdown: {},
    startTime: new Date(),
    lastUpdate: new Date()
  });
  const [pendingUpdates, setPendingUpdates] = useState<XPUpdate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const updateQueueRef = useRef<XPUpdate[]>([]);
  const processingTimeoutRef = useRef<NodeJS.Timeout>();

  // Get current level information
  const getLevelData = useCallback((xp: number): LevelInfo => {
    const levelInfo = getLevelInfo(xp);
    return {
      currentLevel: levelInfo.currentLevel,
      currentXP: xp,
      xpForCurrentLevel: levelInfo.currentLevelInfo?.xpRequired || 0,
      xpForNextLevel: levelInfo.nextLevelXP,
      progressToNext: levelInfo.progressToNext,
      title: levelInfo.currentLevelInfo?.title || 'Learner',
      description: levelInfo.currentLevelInfo?.description || 'Keep learning!'
    };
  }, []);

  // Process XP updates with debouncing
  const processXPUpdates = useCallback(async () => {
    if (updateQueueRef.current.length === 0 || isProcessing) return;

    setIsProcessing(true);
    const updates = [...updateQueueRef.current];
    updateQueueRef.current = [];

    try {
      // Calculate total XP to add
      const totalXPToAdd = updates.reduce((sum, update) => sum + update.amount, 0);
      const oldXP = learningState.xp;
      const newXP = oldXP + totalXPToAdd;
      
      // Get level information
      const oldLevelInfo = getLevelData(oldXP);
      const newLevelInfo = getLevelData(newXP);
      
      // Update XP in learning context
      await addXP(totalXPToAdd);
      
      // Update session XP tracking
      setSessionXP(prev => {
        const newBreakdown = { ...prev.breakdown };
        updates.forEach(update => {
          newBreakdown[update.source] = (newBreakdown[update.source] || 0) + update.amount;
        });
        
        return {
          ...prev,
          totalXP: prev.totalXP + totalXPToAdd,
          breakdown: newBreakdown,
          lastUpdate: new Date()
        };
      });

      // Trigger XP notifications for each update
      updates.forEach(update => {
        triggerXPGain(
          update.amount,
          update.source,
          update.description,
          update.position
        );
      });

      // Check for level up
      if (newLevelInfo.currentLevel > oldLevelInfo.currentLevel) {
        // Trigger level up celebration
        setTimeout(() => {
          triggerLevelUp({
            newLevel: newLevelInfo.currentLevel,
            previousLevel: oldLevelInfo.currentLevel,
            xpGained: totalXPToAdd,
            totalXP: newXP,
            levelInfo: {
              title: newLevelInfo.title,
              description: newLevelInfo.description,
              color: 'yellow'
            },
            rewards: {
              xp: Math.floor(newLevelInfo.currentLevel * 50), // Bonus XP
              badges: [`level_${newLevelInfo.currentLevel}`],
              titles: [newLevelInfo.title]
            }
          });
        }, 1000); // Delay to let XP animations finish
      }

      // Trigger achievement events
      for (const update of updates) {
        await triggerEvent({
          type: 'xp_gain',
          data: {
            amount: update.amount,
            source: update.source,
            totalXP: newXP
          }
        });
      }

      // Update previous XP for animations
      setPreviousXP(oldXP);

    } catch (error) {
      console.error('Error processing XP updates:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [learningState.xp, addXP, triggerXPGain, triggerLevelUp, triggerEvent, getLevelData, isProcessing]);

  // Debounced XP update processing
  useEffect(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    processingTimeoutRef.current = setTimeout(() => {
      processXPUpdates();
    }, 200); // 200ms debounce

    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [pendingUpdates, processXPUpdates]);

  // Add XP with real-time feedback
  const addXPWithFeedback = useCallback((
    amount: number,
    source: string,
    description: string,
    position?: { x: number; y: number }
  ) => {
    const update: XPUpdate = {
      amount,
      source,
      description,
      position,
      timestamp: new Date()
    };

    // Add to queue
    updateQueueRef.current.push(update);
    setPendingUpdates(prev => [...prev, update]);
  }, []);

  // Convenience methods for different XP sources
  const addLessonXP = useCallback((amount: number, lessonId: string, position?: { x: number; y: number }) => {
    addXPWithFeedback(amount, 'lesson', `Lesson Completed: ${lessonId}`, position);
  }, [addXPWithFeedback]);

  const addQuizXP = useCallback((amount: number, score: number, position?: { x: number; y: number }) => {
    const description = score === 100 ? 'Perfect Quiz Score!' : `Quiz Score: ${score}%`;
    addXPWithFeedback(amount, 'quiz', description, position);
  }, [addXPWithFeedback]);

  const addProjectXP = useCallback((amount: number, projectName: string, position?: { x: number; y: number }) => {
    addXPWithFeedback(amount, 'project', `Project Submitted: ${projectName}`, position);
  }, [addXPWithFeedback]);

  const addStreakXP = useCallback((amount: number, streakDays: number, position?: { x: number; y: number }) => {
    addXPWithFeedback(amount, 'streak', `${streakDays} Day Streak!`, position);
  }, [addXPWithFeedback]);

  const addAchievementXP = useCallback((amount: number, achievementName: string, position?: { x: number; y: number }) => {
    addXPWithFeedback(amount, 'achievement', `Achievement: ${achievementName}`, position);
  }, [addXPWithFeedback]);

  // Get current level information
  const currentLevelInfo = getLevelData(learningState.xp);

  // Reset session XP
  const resetSessionXP = useCallback(() => {
    setSessionXP({
      totalXP: 0,
      breakdown: {},
      startTime: new Date(),
      lastUpdate: new Date()
    });
  }, []);

  return {
    // Current state
    currentXP: learningState.xp,
    previousXP,
    levelInfo: currentLevelInfo,
    sessionXP,
    isProcessing,

    // XP addition methods
    addXPWithFeedback,
    addLessonXP,
    addQuizXP,
    addProjectXP,
    addStreakXP,
    addAchievementXP,

    // Utility methods
    resetSessionXP,
    getLevelData
  };
}

// Hook for real-time progress tracking
export function useRealTimeProgress() {
  const { currentXP, previousXP, levelInfo, sessionXP } = useRealTimeXP();
  const [progressUpdates, setProgressUpdates] = useState<Array<{
    id: string;
    type: 'lesson' | 'quiz' | 'project' | 'achievement';
    progress: number;
    previousProgress: number;
    timestamp: Date;
  }>>([]);

  // Track progress changes
  const updateProgress = useCallback((
    type: 'lesson' | 'quiz' | 'project' | 'achievement',
    progress: number,
    previousProgress: number = 0
  ) => {
    const update = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      progress,
      previousProgress,
      timestamp: new Date()
    };

    setProgressUpdates(prev => [...prev.slice(-9), update]); // Keep last 10 updates
  }, []);

  // Get progress for specific items
  const getProgressData = useCallback((currentValue: number, maxValue: number, previousValue?: number) => {
    const progress = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;
    const previousProgress = previousValue !== undefined && maxValue > 0 ? (previousValue / maxValue) * 100 : undefined;
    
    return {
      progress: Math.min(100, Math.max(0, progress)),
      previousProgress,
      isComplete: progress >= 100,
      remaining: Math.max(0, maxValue - currentValue)
    };
  }, []);

  return {
    // XP and level data
    currentXP,
    previousXP,
    levelInfo,
    sessionXP,

    // Progress tracking
    progressUpdates,
    updateProgress,
    getProgressData,

    // Utility functions
    formatXP: (xp: number) => xp.toLocaleString(),
    formatProgress: (progress: number) => `${Math.round(progress)}%`,
    getTimeInSession: () => {
      const now = new Date();
      const diff = now.getTime() - sessionXP.startTime.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
      }
      return `${minutes}m`;
    }
  };
}

// Hook for cross-component XP updates
export function useXPSync() {
  const [xpListeners, setXPListeners] = useState<Set<(xp: number, previousXP: number) => void>>(new Set());
  const [levelListeners, setLevelListeners] = useState<Set<(levelInfo: LevelInfo) => void>>(new Set());

  const addXPListener = useCallback((listener: (xp: number, previousXP: number) => void) => {
    setXPListeners(prev => new Set([...prev, listener]));
    
    return () => {
      setXPListeners(prev => {
        const newSet = new Set(prev);
        newSet.delete(listener);
        return newSet;
      });
    };
  }, []);

  const addLevelListener = useCallback((listener: (levelInfo: LevelInfo) => void) => {
    setLevelListeners(prev => new Set([...prev, listener]));
    
    return () => {
      setLevelListeners(prev => {
        const newSet = new Set(prev);
        newSet.delete(listener);
        return newSet;
      });
    };
  }, []);

  const notifyXPChange = useCallback((xp: number, previousXP: number) => {
    xpListeners.forEach(listener => {
      try {
        listener(xp, previousXP);
      } catch (error) {
        console.error('Error in XP listener:', error);
      }
    });
  }, [xpListeners]);

  const notifyLevelChange = useCallback((levelInfo: LevelInfo) => {
    levelListeners.forEach(listener => {
      try {
        listener(levelInfo);
      } catch (error) {
        console.error('Error in level listener:', error);
      }
    });
  }, [levelListeners]);

  return {
    addXPListener,
    addLevelListener,
    notifyXPChange,
    notifyLevelChange
  };
}
