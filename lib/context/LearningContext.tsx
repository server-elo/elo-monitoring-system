'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { AchievementManager } from '@/lib/achievements/manager';
import { AchievementEvent } from '@/lib/achievements/types';

interface LearningState {
  currentCourse: string | null;
  currentModule: string | null;
  currentLesson: string | null;
  progress: Record<string, number>;
  achievements: string[];
  xp: number;
  previousXP: number; // For animation tracking
  level: number;
  previousLevel: number; // For level up detection
  streak: number;
  completedChallenges: number;
  goalsCompleted: number;
  totalGoals: number;
  sessionXP: number; // XP gained in current session
  sessionStartTime: Date;
  lastXPUpdate: Date;
  isLoading: boolean;
  error: string | null;
}

type LearningAction =
  | { type: 'SET_CURRENT_COURSE'; payload: string }
  | { type: 'SET_CURRENT_MODULE'; payload: string }
  | { type: 'SET_CURRENT_LESSON'; payload: string }
  | { type: 'UPDATE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'ADD_ACHIEVEMENT'; payload: string }
  | { type: 'ADD_XP'; payload: number }
  | { type: 'SET_LEVEL'; payload: number }
  | { type: 'UPDATE_STREAK'; payload: number }
  | { type: 'COMPLETE_CHALLENGE'; payload?: number }
  | { type: 'COMPLETE_GOAL'; payload?: number }
  | { type: 'SET_TOTAL_GOALS'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_SESSION_XP' }
  | { type: 'RESET_STATE' };

const initialState: LearningState = {
  currentCourse: null,
  currentModule: null,
  currentLesson: null,
  progress: {},
  achievements: [],
  xp: 0,
  previousXP: 0,
  level: 1,
  previousLevel: 1,
  streak: 0,
  completedChallenges: 0,
  goalsCompleted: 0,
  totalGoals: 5,
  sessionXP: 0,
  sessionStartTime: new Date(),
  lastXPUpdate: new Date(),
  isLoading: false,
  error: null,
};

function learningReducer(state: LearningState, action: LearningAction): LearningState {
  switch (action.type) {
    case 'SET_CURRENT_COURSE':
      return { ...state, currentCourse: action.payload };
    case 'SET_CURRENT_MODULE':
      return { ...state, currentModule: action.payload };
    case 'SET_CURRENT_LESSON':
      return { ...state, currentLesson: action.payload };
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: { ...state.progress, [action.payload.id]: action.payload.progress },
      };
    case 'ADD_ACHIEVEMENT':
      return {
        ...state,
        achievements: [...state.achievements, action.payload],
      };
    case 'ADD_XP':
      const newXP = state.xp + action.payload;
      const newLevel = Math.floor(newXP / 1000) + 1;
      return {
        ...state,
        previousXP: state.xp,
        xp: newXP,
        previousLevel: state.level,
        level: newLevel,
        sessionXP: state.sessionXP + action.payload,
        lastXPUpdate: new Date()
      };
    case 'SET_LEVEL':
      return { ...state, level: action.payload };
    case 'UPDATE_STREAK':
      return { ...state, streak: action.payload };
    case 'COMPLETE_CHALLENGE':
      return {
        ...state,
        completedChallenges: state.completedChallenges + (action.payload || 1)
      };
    case 'COMPLETE_GOAL':
      return {
        ...state,
        goalsCompleted: Math.min(state.goalsCompleted + (action.payload || 1), state.totalGoals)
      };
    case 'SET_TOTAL_GOALS':
      return { ...state, totalGoals: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_SESSION_XP':
      return {
        ...state,
        sessionXP: 0,
        sessionStartTime: new Date(),
        lastXPUpdate: new Date()
      };
    case 'RESET_STATE':
      return { ...initialState, sessionStartTime: new Date() };
    default:
      return state;
  }
}

interface LearningContextType {
  state: LearningState;
  setCurrentCourse: (courseId: string) => void;
  setCurrentModule: (moduleId: string) => void;
  setCurrentLesson: (lessonId: string) => void;
  updateProgress: (id: string, progress: number) => void;
  addAchievement: (achievementId: string) => void;
  addXP: (amount: number) => void;
  updateStreak: (streak: number) => void;
  completeChallenge: (count?: number) => void;
  completeGoal: (count?: number) => void;
  setTotalGoals: (total: number) => void;
  completeLesson: (lessonId: string, xpReward: number) => void;
  completeQuiz: (quizId: string, score: number, xpReward: number) => void;
  submitProject: (projectId: string, category: string, xpReward: number) => void;
  triggerAchievementEvent: (eventData: Omit<AchievementEvent, 'userId' | 'timestamp'>) => Promise<void>;
  addXPListener: (listener: (xp: number, previousXP: number) => void) => () => void;
  addLevelListener: (listener: (level: number, previousLevel: number) => void) => () => void;
  resetSessionXP: () => void;
  resetLearningState: () => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export const useLearning = () => {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(learningReducer, initialState);
  const { data: session } = useSession();
  const achievementManager = AchievementManager.getInstance();
  const xpListenersRef = useRef<Set<(xp: number, previousXP: number) => void>>(new Set());
  const levelListenersRef = useRef<Set<(level: number, previousLevel: number) => void>>(new Set());

  // Load user progress on mount and track login
  useEffect(() => {
    if (session?.user) {
      loadUserProgress();
      updateLoginStreak();
    }
  }, [session]);

  const loadUserProgress = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // For static export, skip API calls and use local storage or default values
      if (typeof window !== 'undefined') {
        const savedProgress = localStorage.getItem('learning-progress');
        if (savedProgress) {
          const data = JSON.parse(savedProgress);
          dispatch({ type: 'ADD_XP', payload: data.totalXP || 0 });
          dispatch({ type: 'SET_LEVEL', payload: data.currentLevel || 1 });
          dispatch({ type: 'UPDATE_STREAK', payload: data.streak || 0 });
        }
      }
    } catch (error) {
      console.log('Using default progress values for static export');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const setCurrentCourse = (courseId: string) => {
    dispatch({ type: 'SET_CURRENT_COURSE', payload: courseId });
  };

  const setCurrentModule = (moduleId: string) => {
    dispatch({ type: 'SET_CURRENT_MODULE', payload: moduleId });
  };

  const setCurrentLesson = (lessonId: string) => {
    dispatch({ type: 'SET_CURRENT_LESSON', payload: lessonId });
  };

  const updateProgress = async (id: string, progress: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { id, progress } });

    // For static export, save to local storage instead of API
    if (typeof window !== 'undefined') {
      try {
        const savedProgress = localStorage.getItem('learning-progress') || '{}';
        const data = JSON.parse(savedProgress);
        data.progress = { ...data.progress, [id]: progress };
        localStorage.setItem('learning-progress', JSON.stringify(data));
      } catch (error) {
        console.log('Progress saved locally for static export');
      }
    }
  };

  const addAchievement = async (achievementId: string) => {
    dispatch({ type: 'ADD_ACHIEVEMENT', payload: achievementId });

    // For static export, save to local storage instead of API
    if (typeof window !== 'undefined') {
      try {
        const savedProgress = localStorage.getItem('learning-progress') || '{}';
        const data = JSON.parse(savedProgress);
        data.achievements = [...(data.achievements || []), achievementId];
        localStorage.setItem('learning-progress', JSON.stringify(data));
      } catch (error) {
        console.log('Achievement saved locally for static export');
      }
    }
  };

  // Trigger achievement event
  const triggerAchievementEvent = useCallback(async (eventData: Omit<AchievementEvent, 'userId' | 'timestamp'>) => {
    if (!session?.user?.id) return;

    try {
      const event: AchievementEvent = {
        ...eventData,
        userId: session.user.id,
        timestamp: new Date()
      };

      await achievementManager.processEvent(event);
    } catch (error) {
      console.error('Failed to trigger achievement event:', error);
    }
  }, [session?.user?.id, achievementManager]);

  const addXP = async (amount: number) => {
    const previousXP = state.xp;
    const previousLevel = state.level;

    dispatch({ type: 'ADD_XP', payload: amount });

    // Notify XP listeners for real-time updates
    const newXP = previousXP + amount;
    xpListenersRef.current.forEach(listener => {
      try {
        listener(newXP, previousXP);
      } catch (error) {
        console.error('Error in XP listener:', error);
      }
    });

    // Check for level up and notify level listeners
    const newLevel = Math.floor(newXP / 1000) + 1;
    if (newLevel > previousLevel) {
      levelListenersRef.current.forEach(listener => {
        try {
          listener(newLevel, previousLevel);
        } catch (error) {
          console.error('Error in level listener:', error);
        }
      });
    }

    // Trigger XP gain achievement event
    await triggerAchievementEvent({
      type: 'xp_gain',
      data: { amount, totalXP: newXP }
    });

    // For static export, save to local storage instead of API
    if (typeof window !== 'undefined') {
      try {
        const savedProgress = localStorage.getItem('learning-progress') || '{}';
        const data = JSON.parse(savedProgress);
        data.totalXP = newXP;
        data.currentLevel = newLevel;
        data.sessionXP = state.sessionXP + amount;
        localStorage.setItem('learning-progress', JSON.stringify(data));
      } catch (error) {
        console.log('XP saved locally for static export');
      }
    }
  };

  const updateStreak = async (streak: number) => {
    dispatch({ type: 'UPDATE_STREAK', payload: streak });

    // For static export, save to local storage instead of API
    if (typeof window !== 'undefined') {
      try {
        const savedProgress = localStorage.getItem('learning-progress') || '{}';
        const data = JSON.parse(savedProgress);
        data.streak = streak;
        localStorage.setItem('learning-progress', JSON.stringify(data));
      } catch (error) {
        console.log('Streak saved locally for static export');
      }
    }
  };

  const completeLesson = async (lessonId: string, xpReward: number) => {
    updateProgress(lessonId, 100);
    addXP(xpReward);

    // Trigger lesson completion achievement event
    await triggerAchievementEvent({
      type: 'lesson_complete',
      data: {
        lessonId,
        xpReward,
        completedLessons: Object.keys(state.progress).filter(id => state.progress[id] === 100).length + 1
      }
    });
  };

  // Enhanced quiz completion with achievement tracking
  const completeQuiz = async (quizId: string, score: number, xpReward: number) => {
    addXP(xpReward);

    // Trigger quiz completion achievement event
    await triggerAchievementEvent({
      type: 'quiz_complete',
      data: {
        quizId,
        score,
        xpReward,
        isPerfect: score === 100
      }
    });
  };

  // Enhanced project submission with achievement tracking
  const submitProject = async (projectId: string, category: string, xpReward: number) => {
    addXP(xpReward);

    // Trigger project submission achievement event
    await triggerAchievementEvent({
      type: 'project_submit',
      data: {
        projectId,
        category,
        xpReward
      }
    });
  };

  // Daily login streak tracking
  const updateLoginStreak = async () => {
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem('last-login-date');

    if (lastLogin !== today) {
      localStorage.setItem('last-login-date', today);

      // Trigger login achievement event
      await triggerAchievementEvent({
        type: 'login',
        data: { date: today }
      });
    }
  };

  // Real-time XP and level listener management
  const addXPListener = useCallback((listener: (xp: number, previousXP: number) => void) => {
    xpListenersRef.current.add(listener);

    return () => {
      xpListenersRef.current.delete(listener);
    };
  }, []);

  const addLevelListener = useCallback((listener: (level: number, previousLevel: number) => void) => {
    levelListenersRef.current.add(listener);

    return () => {
      levelListenersRef.current.delete(listener);
    };
  }, []);

  // Reset session XP
  const resetSessionXP = useCallback(() => {
    dispatch({ type: 'RESET_SESSION_XP' });
  }, []);

  const completeChallenge = (count: number = 1) => {
    dispatch({ type: 'COMPLETE_CHALLENGE', payload: count });
  };

  const completeGoal = (count: number = 1) => {
    dispatch({ type: 'COMPLETE_GOAL', payload: count });
  };

  const setTotalGoals = (total: number) => {
    dispatch({ type: 'SET_TOTAL_GOALS', payload: total });
  };

  const resetLearningState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    setCurrentCourse,
    setCurrentModule,
    setCurrentLesson,
    updateProgress,
    addAchievement,
    addXP,
    updateStreak,
    completeChallenge,
    completeGoal,
    setTotalGoals,
    completeLesson,
    completeQuiz,
    submitProject,
    triggerAchievementEvent,
    addXPListener,
    addLevelListener,
    resetSessionXP,
    resetLearningState,
  }), [
    state,
    setCurrentCourse,
    setCurrentModule,
    setCurrentLesson,
    updateProgress,
    addAchievement,
    addXP,
    updateStreak,
    completeLesson,
    completeQuiz,
    submitProject,
    triggerAchievementEvent,
    addXPListener,
    addLevelListener,
    resetSessionXP
  ]);

  return (
    <LearningContext.Provider value={contextValue}>
      {children}
    </LearningContext.Provider>
  );
}
