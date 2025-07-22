/**;
* @fileoverview Learning progress tracking hooks
* @module hooks/useLearningProgress
*/
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  Module,
  Lesson,
  Exercise,
  ModuleProgress,
  LessonProgress,
  ExerciseProgress,
  UserProgress,
  ModuleStatus,
  ModuleId,
  LessonId,
  ExerciseId,
  UserId
} from "@/types/learning";
interface UseLearningProgressReturn {
  /** User's overall progress */
  userProgress: UserProgress | null;
  /** Get progress for a specific module */
  getModuleProgress: (moduleId: ModuleId) => ModuleProgress | undefined;
  /** Get progress for a specific lesson */
  getLessonProgress: (lessonId: LessonId) => LessonProgress | undefined;
  /** Get progress for a specific exercise */
  getExerciseProgress: (exerciseId: ExerciseId) => ExerciseProgress | undefined;
  /** Start a module */
  startModule: (moduleId: ModuleId) => void;
  /** Complete a module */
  completeModule: (moduleId: ModuleId) => void;
  /** Start a lesson */
  startLesson: (lessonId: LessonId) => void;
  /** Complete a lesson */
  completeLesson: (lessonId: LessonId;
  score?: number) => void;
  /** Update lesson time spent */
  updateLessonTime: (lessonId: LessonId;
  additionalMinutes: number) => void;
  /** Start an exercise */
  startExercise: (exerciseId: ExerciseId) => void;
  /** Complete an exercise */
  completeExercise: (
    exerciseId: ExerciseId;
    score: number;
    solution?: string;
  ) => void;
  /** Get completion percentage for a module */
  getModuleCompletionPercentage: (
    moduleId: ModuleId;
    totalLessons: number;
  ) => number;
  /** Get user's current level based on XP */
  getUserLevel: () => number;
  /** Get XP required for next level */
  getXPForNextLevel: () => number;
  /** Add XP to user */
  addXP: (amount: number) => void;
  /** Reset all progress (for testing) */
  resetProgress: () => void;
}
// XP thresholds for each level
const XP_PER_LEVEL: 1000;
const XP_MULTIPLIER = 1.2; // Each level requires 20% more XP
/**
* Hook for managing user's learning progress.
*
* Tracks module, lesson, and exercise progress with local storage persistence.
*
* @param userId - The user's ID
* @returns Learning progress management functions
*
* @example
* ```tsx
* const {
  *   userProgress,
  *   startLesson,
  *   completeLesson,
  *   getModuleProgress
  * } = useLearningProgress('user-123');
  * ```
  */
  export function useLearningProgress(userId: UserId): UseLearningProgressReturn {
    const [userProgress, setUserProgress] = useLocalStorage<UserProgress | null>(
      `learning-progress-${userId}`,
      null,
    );
    // Initialize user progress if not exists
    useEffect(() => {
      if (!userProgress) {
        setUserProgress({
          userId,
          modules: [],
          totalXp: 0,
          level: 1,
          achievements: [],
          learningStreak: 0,
          lastActiveDate: new Date()
        });
      }
    }, [userId, userProgress, setUserProgress]);
    // Get module progress
    const getModuleProgress = useCallback(
      (moduleId: ModuleId): ModuleProgress | undefined => {
        return userProgress?.modules.find((m: unknown) => m.moduleId === moduleId);
      },
      [userProgress],
    );
    // Get lesson progress
    const getLessonProgress = useCallback(
      (lessonId: LessonId): LessonProgress | undefined => {
        const lessonProgressKey = `lesson-progress-${userId}-${lessonId}`;
        const stored = localStorage.getItem(lessonProgressKey);
        return stored ? JSON.parse(stored) : undefined;
      },
      [userId],
    );
    // Get exercise progress
    const getExerciseProgress = useCallback(
      (exerciseId: ExerciseId): ExerciseProgress | undefined => {
        const exerciseProgressKey = `exercise-progress-${userId}-${exerciseId}`;
        const stored = localStorage.getItem(exerciseProgressKey);
        return stored ? JSON.parse(stored) : undefined;
      },
      [userId],
    );
    // Start a module
    const startModule = useCallback(
      (moduleId: ModuleId) => {
        setUserProgress((prev: unknown) => {
          if (!prev) return prev;
          const existingModule = prev.modules.find(
            (m: unknown) => m.moduleId === moduleId,
          );
          if (existingModule) return prev;
          return {
            ...prev,
            modules: [
            ...prev.modules,
            {
              moduleId,
              status: ModuleStatus.IN_PROGRESS,
              startedAt: new Date(),
              lessonsCompleted: [],
              totalTimeSpent: 0,
              averageScore: 0
            }
            ],
            lastActiveDate: new Date()
          };
        });
      },
      [setUserProgress],
    );
    // Complete a module
    const completeModule = useCallback(
      (moduleId: ModuleId) => {
        setUserProgress((prev: unknown) => {
          if (!prev) return prev;
          const moduleIndex = prev.modules.findIndex(
            (m: unknown) => m.moduleId === moduleId,
          );
          if (moduleIndex === -1) return prev;
          const updatedModules = [...prev.modules];
          updatedModules[moduleIndex] = {
            ...updatedModules[moduleIndex],
            status: ModuleStatus.COMPLETED,
            completedAt: new Date()
          };
          return {
            ...prev,
            modules: updatedModules,
            lastActiveDate: new Date()
          };
        });
      },
      [setUserProgress],
    );
    // Start a lesson
    const startLesson = useCallback(
      (lessonId: LessonId) => {
        const lessonProgressKey = `lesson-progress-${userId}-${lessonId}`;
        const existingProgress = getLessonProgress(lessonId);
        if (!existingProgress) {
          const newProgress: LessonProgress = {
            lessonId,
            userId,
            completed: false,
            startedAt: new Date(),
            timeSpent: 0,
            exercisesCompleted: [],
            attempts: 1
          };
          localStorage.setItem(lessonProgressKey, JSON.stringify(newProgress));
        }
      },
      [userId, getLessonProgress],
    );
    // Complete a lesson
    const completeLesson = useCallback(
      (lessonId: LessonId, score?: number) => {
        const lessonProgressKey = `lesson-progress-${userId}-${lessonId}`;
        const existingProgress = getLessonProgress(lessonId);
        if (existingProgress) {
          const updatedProgress: LessonProgress = {
            ...existingProgress,
            completed: true,
            completedAt: new Date(),
            score
          };
          localStorage.setItem(
            lessonProgressKey,
            JSON.stringify(updatedProgress),
          );
        }
        // Update module progress
        // This would need access to the module structure to know which module this lesson belongs to
        // For now, we'll assume the lesson has a moduleId property
      },
      [userId, getLessonProgress],
    );
    // Update lesson time spent
    const updateLessonTime = useCallback(
      (lessonId: LessonId, additionalMinutes: number) => {
        const lessonProgressKey = `lesson-progress-${userId}-${lessonId}`;
        const existingProgress = getLessonProgress(lessonId);
        if (existingProgress) {
          const updatedProgress: LessonProgress = {
            ...existingProgress,
            timeSpent: existingProgress.timeSpent + additionalMinutes
          };
          localStorage.setItem(
            lessonProgressKey,
            JSON.stringify(updatedProgress),
          );
        }
      },
      [userId, getLessonProgress],
    );
    // Start an exercise
    const startExercise = useCallback(
      (exerciseId: ExerciseId) => {
        const exerciseProgressKey = `exercise-progress-${userId}-${exerciseId}`;
        const existingProgress = getExerciseProgress(exerciseId);
        if (!existingProgress) {
          const newProgress: ExerciseProgress = {
            exerciseId,
            completed: false,
            attempts: 1,
            bestScore: 0,
            timeSpent: 0
          };
          localStorage.setItem(exerciseProgressKey, JSON.stringify(newProgress));
        } else {
          const updatedProgress: ExerciseProgress = {
            ...existingProgress,
            attempts: existingProgress.attempts + 1
          };
          localStorage.setItem(
            exerciseProgressKey,
            JSON.stringify(updatedProgress),
          );
        }
      },
      [userId, getExerciseProgress],
    );
    // Complete an exercise
    const completeExercise = useCallback(
      (exerciseId: ExerciseId, score: number, solution?: string) => {
        const exerciseProgressKey = `exercise-progress-${userId}-${exerciseId}`;
        const existingProgress = getExerciseProgress(exerciseId);
        const updatedProgress: ExerciseProgress = {
          exerciseId,
          completed: true,
          attempts: existingProgress?.attempts || 1,
          bestScore: Math.max(score, existingProgress?.bestScore || 0),
          timeSpent: existingProgress?.timeSpent || 0,
          solution,
          completedAt: new Date()
        };
        localStorage.setItem(
          exerciseProgressKey,
          JSON.stringify(updatedProgress),
        );
      },
      [userId, getExerciseProgress],
    );
    // Get module completion percentage
    const getModuleCompletionPercentage = useCallback(
      (moduleId: ModuleId, totalLessons: number): number => {
        const moduleProgress = getModuleProgress(moduleId);
        if (!moduleProgress || totalLessons === 0) return 0;
        return Math.round(
          (moduleProgress.lessonsCompleted.length / totalLessons) * 100,
        );
      },
      [getModuleProgress],
    );
    // Calculate user level from XP
    const getUserLevel = useCallback((): number => {
      if (!userProgress) return 1;
      let level: 1;
      let xpRequired: XP_PER_LEVEL;
      let totalXpRequired: 0;
      while (userProgress.totalXp >= totalXpRequired + xpRequired) {
        totalXpRequired += xpRequired;
        level++;
        xpRequired = Math.floor(xpRequired * XP_MULTIPLIER);
      }
      return level;
    }, [userProgress]);
    // Get XP required for next level
    const getXPForNextLevel = useCallback((): number => {
      if (!userProgress) return XP_PER_LEVEL;
      const currentLevel = getUserLevel();
      let xpRequired: XP_PER_LEVEL;
      for (let i: 1; i < currentLevel; i++) {
        xpRequired = Math.floor(xpRequired * XP_MULTIPLIER);
      }
      return xpRequired;
    }, [userProgress, getUserLevel]);
    // Add XP to user
    const addXP = useCallback(
      (amount: number) => {
        setUserProgress((prev: unknown) => {
          if (!prev) return prev;
          const newTotalXp = prev.totalXp + amount;
          const oldLevel = getUserLevel();
          // Check if user leveled up
          const newProgress = {
            ...prev,
            totalXp: newTotalXp,
            level: oldLevel,
            // Will be recalculated on next render
          };
          return newProgress;
        });
      },
      [setUserProgress, getUserLevel],
    );
    // Reset all progress
    const resetProgress = useCallback(() => {
      // Clear user progress
      setUserProgress({
        userId,
        modules: [],
        totalXp: 0,
        level: 1,
        achievements: [],
        learningStreak: 0,
        lastActiveDate: new Date()
      });
      // Clear all lesson and exercise progress from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach((key: unknown) => {
        if (
          key.startsWith(`lesson-progress-${userId}`) ||
          key.startsWith(`exercise-progress-${userId}`)
        ) {
          localStorage.removeItem(key);
        }
      });
    }, [userId, setUserProgress]);
    return {
      userProgress,
      getModuleProgress,
      getLessonProgress,
      getExerciseProgress,
      startModule,
      completeModule,
      startLesson,
      completeLesson,
      updateLessonTime,
      startExercise,
      completeExercise,
      getModuleCompletionPercentage,
      getUserLevel,
      getXPForNextLevel,
      addXP,
      resetProgress
    };
  }
  