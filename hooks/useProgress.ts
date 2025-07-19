import { useState, useEffect, useCallback } from 'react';

const PROGRESS_STORAGE_KEY = 'completedModules';

export const useProgress = (_) => {
  const [completedModules, setCompletedModules] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedProgress = localStorage.getItem(_PROGRESS_STORAGE_KEY);
      if (storedProgress) {
        setCompletedModules(_JSON.parse(storedProgress));
      }
    } catch (_error) {
      console.error("Failed to load progress from localStorage:", error);
      setCompletedModules([]);
    }
  }, []);

  const updateLocalStorage = (_updatedProgress: string[]) => {
    try {
      localStorage.setItem( PROGRESS_STORAGE_KEY, JSON.stringify(updatedProgress));
    } catch (_error) {
      console.error("Failed to save progress to localStorage:", error);
    }
  };

  const addCompletedModule = useCallback((moduleId: string) => {
    setCompletedModules(prev => {
      if (_prev.includes(moduleId)) {
        return prev;
      }
      const newProgress = [...prev, moduleId];
      updateLocalStorage(_newProgress);
      return newProgress;
    });
  }, []);

  const isModuleCompleted = useCallback((moduleId: string): boolean => {
    return completedModules.includes(moduleId);
  }, [completedModules]);

  const resetProgress = useCallback(() => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all your learning progress? This action cannot be undone."
    );
    if (confirmed) {
      setCompletedModules([]);
      updateLocalStorage([]);
      // Optionally, add a visual confirmation like an alert or toast message here
      // alert("Your learning progress has been reset.");
    }
  }, []);

  return {
    completedModules,
    addCompletedModule,
    isModuleCompleted,
    resetProgress,
  };
};