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
  const { state: learningState, addXP, triggerAchievementEvent: _triggerAchievementEvent } = useLearning(_);
  const { triggerEvent } = useAchievements(_);
  const { triggerXPGain } = useXPNotifications(_);
  const { triggerLevelUp } = useLevelUp(_);
  
  const [previousXP, setPreviousXP] = useState<number>(_learningState.xp);
  const [sessionXP, setSessionXP] = useState<SessionXPData>({
    totalXP: 0,
    breakdown: {},
    startTime: new Date(_),
    lastUpdate: new Date(_)
  });
  const [pendingUpdates, setPendingUpdates] = useState<XPUpdate[]>([]);
  const [isProcessing, setIsProcessing] = useState(_false);
  
  const updateQueueRef = useRef<XPUpdate[]>([]);
  const processingTimeoutRef = useRef<NodeJS.Timeout>(_);

  // Get current level information
  const getLevelData = useCallback((xp: number): LevelInfo => {
    const levelInfo = getLevelInfo(_xp);
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
  const processXPUpdates = useCallback( async () => {
    if (_updateQueueRef.current.length === 0 || isProcessing) return;

    setIsProcessing(_true);
    const updates = [...updateQueueRef.current];
    updateQueueRef.current = [];

    try {
      // Calculate total XP to add
      const totalXPToAdd = updates.reduce( (sum, update) => sum + update.amount, 0);
      const oldXP = learningState.xp;
      const newXP = oldXP + totalXPToAdd;
      
      // Get level information
      const oldLevelInfo = getLevelData(_oldXP);
      const newLevelInfo = getLevelData(_newXP);
      
      // Update XP in learning context
      await addXP(_totalXPToAdd);
      
      // Update session XP tracking
      setSessionXP(prev => {
        const newBreakdown = { ...prev.breakdown };
        updates.forEach(update => {
          newBreakdown[update.source] = (_newBreakdown[update.source] || 0) + update.amount;
        });
        
        return {
          ...prev,
          totalXP: prev.totalXP + totalXPToAdd,
          breakdown: newBreakdown,
          lastUpdate: new Date(_)
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
      if (_newLevelInfo.currentLevel > oldLevelInfo.currentLevel) {
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
              xp: Math.floor(_newLevelInfo.currentLevel * 50), // Bonus XP
              badges: [`level_${newLevelInfo.currentLevel}`],
              titles: [newLevelInfo.title]
            }
          });
        }, 1000); // Delay to let XP animations finish
      }

      // Trigger achievement events
      for (_const update of updates) {
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
      setPreviousXP(_oldXP);

    } catch (_error) {
      console.error('Error processing XP updates:', error);
    } finally {
      setIsProcessing(_false);
    }
  }, [learningState.xp, addXP, triggerXPGain, triggerLevelUp, triggerEvent, getLevelData, isProcessing]);

  // Debounced XP update processing
  useEffect(() => {
    if (_processingTimeoutRef.current) {
      clearTimeout(_processingTimeoutRef.current);
    }

    processingTimeoutRef.current = setTimeout(() => {
      processXPUpdates(_);
    }, 200); // 200ms debounce

    return (_) => {
      if (_processingTimeoutRef.current) {
        clearTimeout(_processingTimeoutRef.current);
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
      timestamp: new Date(_)
    };

    // Add to queue
    updateQueueRef.current.push(_update);
    setPendingUpdates( prev => [...prev, update]);
  }, []);

  // Convenience methods for different XP sources
  const addLessonXP = useCallback( (amount: number, lessonId: string, position?: { x: number; y: number }) => {
    addXPWithFeedback( amount, 'lesson', `Lesson Completed: ${lessonId}`, position);
  }, [addXPWithFeedback]);

  const addQuizXP = useCallback( (amount: number, score: number, position?: { x: number; y: number }) => {
    const description = score === 100 ? 'Perfect Quiz Score!' : `Quiz Score: ${score}%`;
    addXPWithFeedback( amount, 'quiz', description, position);
  }, [addXPWithFeedback]);

  const addProjectXP = useCallback( (amount: number, projectName: string, position?: { x: number; y: number }) => {
    addXPWithFeedback( amount, 'project', `Project Submitted: ${projectName}`, position);
  }, [addXPWithFeedback]);

  const addStreakXP = useCallback( (amount: number, streakDays: number, position?: { x: number; y: number }) => {
    addXPWithFeedback( amount, 'streak', `${streakDays} Day Streak!`, position);
  }, [addXPWithFeedback]);

  const addAchievementXP = useCallback( (amount: number, achievementName: string, position?: { x: number; y: number }) => {
    addXPWithFeedback( amount, 'achievement', `Achievement: ${achievementName}`, position);
  }, [addXPWithFeedback]);

  // Get current level information
  const currentLevelInfo = getLevelData(_learningState.xp);

  // Reset session XP
  const resetSessionXP = useCallback(() => {
    setSessionXP({
      totalXP: 0,
      breakdown: {},
      startTime: new Date(_),
      lastUpdate: new Date(_)
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
  const { currentXP, previousXP, levelInfo, sessionXP } = useRealTimeXP(_);
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
      id: `${type}_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      progress,
      previousProgress,
      timestamp: new Date(_)
    };

    setProgressUpdates(_prev => [...prev.slice(-9), update]); // Keep last 10 updates
  }, []);

  // Get progress for specific items
  const getProgressData = useCallback( (currentValue: number, maxValue: number, previousValue?: number) => {
    const progress = maxValue > 0 ? (_currentValue / maxValue) * 100 : 0;
    const previousProgress = previousValue !== undefined && maxValue > 0 ? (_previousValue / maxValue) * 100 : undefined;
    
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
    formatXP: (_xp: number) => xp.toLocaleString(_),
    formatProgress: (progress: number) => `${Math.round(progress)}%`,
    getTimeInSession: (_) => {
      const now = new Date(_);
      const diff = now.getTime() - sessionXP.startTime.getTime(_);
      const minutes = Math.floor(_diff / (1000 * 60));
      const hours = Math.floor(_minutes / 60);
      
      if (_hours > 0) {
        return `${hours}h ${minutes % 60}m`;
      }
      return `${minutes}m`;
    }
  };
}

// Hook for cross-component XP updates
export function useXPSync() {
  const [xpListeners, setXPListeners] = useState<Set<( xp: number, previousXP: number) => void>>(_new Set());
  const [levelListeners, setLevelListeners] = useState<Set<(_levelInfo: LevelInfo) => void>>(_new Set());

  const addXPListener = useCallback( (listener: (xp: number, previousXP: number) => void) => {
    setXPListeners( prev => new Set([...prev, listener]));
    
    return (_) => {
      setXPListeners(prev => {
        const newSet = new Set(_prev);
        newSet.delete(_listener);
        return newSet;
      });
    };
  }, []);

  const addLevelListener = useCallback((listener: (levelInfo: LevelInfo) => void) => {
    setLevelListeners( prev => new Set([...prev, listener]));
    
    return (_) => {
      setLevelListeners(prev => {
        const newSet = new Set(_prev);
        newSet.delete(_listener);
        return newSet;
      });
    };
  }, []);

  const notifyXPChange = useCallback( (xp: number, previousXP: number) => {
    xpListeners.forEach(listener => {
      try {
        listener( xp, previousXP);
      } catch (_error) {
        console.error('Error in XP listener:', error);
      }
    });
  }, [xpListeners]);

  const notifyLevelChange = useCallback((levelInfo: LevelInfo) => {
    levelListeners.forEach(listener => {
      try {
        listener(_levelInfo);
      } catch (_error) {
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
