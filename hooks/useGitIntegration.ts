'use client';

import { useState, useEffect, useCallback } from 'react';
import { gitIntegration } from '@/lib/git/GitIntegration';

interface GitHookState {
  isGitAvailable: boolean;
  currentBranch: string;
  isCommitting: boolean;
  isPushing: boolean;
  lastCommitTime: Date | null;
  commitQueue: number;
  hasUncommittedChanges: boolean;
}

interface GitHookReturn extends GitHookState {
  commitLessonCompletion: (lessonId: string, code: string) => Promise<void>;
  commitCodeSave: (sessionId: string, description?: string) => Promise<void>;
  commitFeature: (feature: string, files: string[]) => Promise<void>;
  commitBugFix: (issue: string, files: string[]) => Promise<void>;
  commitCleanup: (description: string, files: string[]) => Promise<void>;
  pushChanges: () => Promise<void>;
  checkTypeScript: () => Promise<boolean>;
  getGitStatus: () => Promise<void>;
  createFeatureBranch: (name: string) => Promise<void>;
}

export function useGitIntegration(): GitHookReturn {
  const [state, setState] = useState<GitHookState>({
    isGitAvailable: false,
    currentBranch: 'main',
    isCommitting: false,
    isPushing: false,
    lastCommitTime: null,
    commitQueue: 0,
    hasUncommittedChanges: false
  });

  // Initialize git status
  useEffect(() => {
    const initializeGit = async () => {
      try {
        const isAvailable = gitIntegration.isGitAvailable();
        const currentBranch = gitIntegration.getCurrentBranch();
        
        setState(prev => ({
          ...prev,
          isGitAvailable: isAvailable,
          currentBranch
        }));

        if (isAvailable) {
          await updateGitStatus();
        }
      } catch (error) {
        console.error('Failed to initialize git integration:', error);
      }
    };

    initializeGit();
  }, []);

  const updateGitStatus = useCallback(async () => {
    try {
      const status = await gitIntegration.getGitStatus();
      setState(prev => ({
        ...prev,
        currentBranch: status.currentBranch,
        hasUncommittedChanges: status.hasUncommittedChanges
      }));
    } catch (error) {
      console.error('Failed to get git status:', error);
    }
  }, []);

  const commitLessonCompletion = useCallback(async (lessonId: string, code: string) => {
    if (!state.isGitAvailable) {
      throw new Error('Git is not available');
    }

    setState(prev => ({ ...prev, isCommitting: true, commitQueue: prev.commitQueue + 1 }));
    
    try {
      await gitIntegration.commitLessonCompletion(lessonId, code);
      setState(prev => ({ 
        ...prev, 
        lastCommitTime: new Date(),
        commitQueue: Math.max(0, prev.commitQueue - 1)
      }));
      await updateGitStatus();
    } catch (error) {
      setState(prev => ({ ...prev, commitQueue: Math.max(0, prev.commitQueue - 1) }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isCommitting: false }));
    }
  }, [state.isGitAvailable, updateGitStatus]);

  const commitCodeSave = useCallback(async (sessionId: string, description?: string) => {
    if (!state.isGitAvailable) {
      throw new Error('Git is not available');
    }

    setState(prev => ({ ...prev, isCommitting: true, commitQueue: prev.commitQueue + 1 }));
    
    try {
      await gitIntegration.commitCodeSave(sessionId, description);
      setState(prev => ({ 
        ...prev, 
        lastCommitTime: new Date(),
        commitQueue: Math.max(0, prev.commitQueue - 1)
      }));
      await updateGitStatus();
    } catch (error) {
      setState(prev => ({ ...prev, commitQueue: Math.max(0, prev.commitQueue - 1) }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isCommitting: false }));
    }
  }, [state.isGitAvailable, updateGitStatus]);

  const commitFeature = useCallback(async (feature: string, files: string[]) => {
    if (!state.isGitAvailable) {
      throw new Error('Git is not available');
    }

    setState(prev => ({ ...prev, isCommitting: true, commitQueue: prev.commitQueue + 1 }));
    
    try {
      await gitIntegration.commitFeatureImplementation(feature, files);
      setState(prev => ({ 
        ...prev, 
        lastCommitTime: new Date(),
        commitQueue: Math.max(0, prev.commitQueue - 1)
      }));
      await updateGitStatus();
    } catch (error) {
      setState(prev => ({ ...prev, commitQueue: Math.max(0, prev.commitQueue - 1) }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isCommitting: false }));
    }
  }, [state.isGitAvailable, updateGitStatus]);

  const commitBugFix = useCallback(async (issue: string, files: string[]) => {
    if (!state.isGitAvailable) {
      throw new Error('Git is not available');
    }

    setState(prev => ({ ...prev, isCommitting: true, commitQueue: prev.commitQueue + 1 }));
    
    try {
      await gitIntegration.commitBugFix(issue, files);
      setState(prev => ({ 
        ...prev, 
        lastCommitTime: new Date(),
        commitQueue: Math.max(0, prev.commitQueue - 1)
      }));
      await updateGitStatus();
    } catch (error) {
      setState(prev => ({ ...prev, commitQueue: Math.max(0, prev.commitQueue - 1) }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isCommitting: false }));
    }
  }, [state.isGitAvailable, updateGitStatus]);

  const commitCleanup = useCallback(async (description: string, files: string[]) => {
    if (!state.isGitAvailable) {
      throw new Error('Git is not available');
    }

    setState(prev => ({ ...prev, isCommitting: true, commitQueue: prev.commitQueue + 1 }));
    
    try {
      await gitIntegration.commitCleanup(description, files);
      setState(prev => ({ 
        ...prev, 
        lastCommitTime: new Date(),
        commitQueue: Math.max(0, prev.commitQueue - 1)
      }));
      await updateGitStatus();
    } catch (error) {
      setState(prev => ({ ...prev, commitQueue: Math.max(0, prev.commitQueue - 1) }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isCommitting: false }));
    }
  }, [state.isGitAvailable, updateGitStatus]);

  const pushChanges = useCallback(async () => {
    if (!state.isGitAvailable) {
      throw new Error('Git is not available');
    }

    setState(prev => ({ ...prev, isPushing: true }));
    
    try {
      await gitIntegration.pushChanges();
      await updateGitStatus();
    } catch (error) {
      throw error;
    } finally {
      setState(prev => ({ ...prev, isPushing: false }));
    }
  }, [state.isGitAvailable, updateGitStatus]);

  const checkTypeScript = useCallback(async (): Promise<boolean> => {
    try {
      const result = await gitIntegration.checkTypeScript();
      return result.success;
    } catch (error) {
      console.error('TypeScript check failed:', error);
      return false;
    }
  }, []);

  const createFeatureBranch = useCallback(async (name: string) => {
    if (!state.isGitAvailable) {
      throw new Error('Git is not available');
    }

    try {
      await gitIntegration.createFeatureBranch(name);
      setState(prev => ({ ...prev, currentBranch: `feature/${name}` }));
    } catch (error) {
      throw error;
    }
  }, [state.isGitAvailable]);

  return {
    ...state,
    commitLessonCompletion,
    commitCodeSave,
    commitFeature,
    commitBugFix,
    commitCleanup,
    pushChanges,
    checkTypeScript,
    getGitStatus: updateGitStatus,
    createFeatureBranch
  };
}

// Hook for automatic git operations
export function useAutoGit(options: {
  autoCommitOnSave?: boolean;
  autoCommitOnLessonComplete?: boolean;
  autoPushOnCommit?: boolean;
  commitPrefix?: 'Add' | 'Edit' | 'Del';
} = {}) {
  const git = useGitIntegration();
  const [autoCommitEnabled, setAutoCommitEnabled] = useState(options.autoCommitOnSave ?? false);
  const [autoPushEnabled, setAutoPushEnabled] = useState(options.autoPushOnCommit ?? false);

  const autoCommitSave = useCallback(async (sessionId: string, description?: string) => {
    if (!autoCommitEnabled || !git.isGitAvailable) return;

    try {
      await git.commitCodeSave(sessionId, description);
      
      if (autoPushEnabled) {
        await git.pushChanges();
      }
    } catch (error) {
      console.error('Auto-commit failed:', error);
      // Don't throw - auto-commit failures shouldn't break the app
    }
  }, [autoCommitEnabled, autoPushEnabled, git]);

  const autoCommitLessonComplete = useCallback(async (lessonId: string, code: string) => {
    if (!options.autoCommitOnLessonComplete || !git.isGitAvailable) return;

    try {
      await git.commitLessonCompletion(lessonId, code);
      
      if (autoPushEnabled) {
        await git.pushChanges();
      }
    } catch (error) {
      console.error('Auto-commit lesson completion failed:', error);
      // Don't throw - auto-commit failures shouldn't break the app
    }
  }, [options.autoCommitOnLessonComplete, autoPushEnabled, git]);

  return {
    ...git,
    autoCommitEnabled,
    autoPushEnabled,
    setAutoCommitEnabled,
    setAutoPushEnabled,
    autoCommitSave,
    autoCommitLessonComplete
  };
}
