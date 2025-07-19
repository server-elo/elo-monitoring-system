'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { codePersistence, SaveStatus, CodeSession } from '@/lib/storage/CodePersistence';

interface AutoSaveOptions {
  sessionId: string;
  lessonId?: string;
  language?: string;
  enabled?: boolean;
  debounceMs?: number;
  onSaveStatusChange?: (status: SaveStatus) => void;
}

interface AutoSaveReturn {
  saveStatus: SaveStatus;
  saveCode: (code: string, force?: boolean) => Promise<void>;
  loadCode: () => Promise<string | null>;
  resetCode: () => Promise<void>;
  isAutoSaveEnabled: boolean;
  toggleAutoSave: () => void;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

export function useAutoSave({
  sessionId,
  lessonId,
  language = 'solidity',
  enabled = true,
  debounceMs = 2500,
  onSaveStatusChange
}: AutoSaveOptions): AutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ status: 'idle' });
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(enabled);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCodeRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  // Subscribe to save status changes from persistence manager
  useEffect(() => {
    const unsubscribe = codePersistence.onSaveStatusChange((status) => {
      setSaveStatus(status);
      if (status.status === 'saved' && status.lastSaved) {
        setLastSaved(status.lastSaved);
        setHasUnsavedChanges(false);
      }
      onSaveStatusChange?.(status);
    });

    return unsubscribe;
  }, [onSaveStatusChange]);

  // Load existing code on mount
  useEffect(() => {
    const loadExistingCode = async () => {
      try {
        const session = await codePersistence.loadCodeSession(sessionId);
        if (session) {
          lastCodeRef.current = session.code;
          setLastSaved(session.lastModified);
          setIsAutoSaveEnabled(session.autoSaveEnabled);
        }
        isInitializedRef.current = true;
      } catch (error) {
        console.error('Failed to load existing code:', error);
        isInitializedRef.current = true;
      }
    };

    loadExistingCode();
  }, [sessionId]);

  const saveCode = useCallback(async (code: string, force = false) => {
    // Don't save if not initialized or if code hasn't changed (unless forced)
    if (!isInitializedRef.current || (!force && code === lastCodeRef.current)) {
      return;
    }

    try {
      const session: Omit<CodeSession, 'lastModified'> = {
        id: sessionId,
        lessonId,
        code,
        language,
        autoSaveEnabled: isAutoSaveEnabled,
        metadata: {
          lineCount: code.split('\n').length,
          characterCount: code.length
        }
      };

      await codePersistence.saveCodeSession(session);
      lastCodeRef.current = code;
    } catch (error) {
      console.error('Auto-save failed:', error);
      // The error status will be handled by the persistence manager callback
    }
  }, [sessionId, lessonId, language, isAutoSaveEnabled]);

  const debouncedSave = useCallback((code: string) => {
    if (!isAutoSaveEnabled) return;

    // Mark as having unsaved changes
    if (code !== lastCodeRef.current) {
      setHasUnsavedChanges(true);
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      saveCode(code);
    }, debounceMs);
  }, [saveCode, isAutoSaveEnabled, debounceMs]);

  const loadCode = useCallback(async (): Promise<string | null> => {
    try {
      const session = await codePersistence.loadCodeSession(sessionId);
      if (session) {
        lastCodeRef.current = session.code;
        setLastSaved(session.lastModified);
        setHasUnsavedChanges(false);
        return session.code;
      }
      return null;
    } catch (error) {
      console.error('Failed to load code:', error);
      return null;
    }
  }, [sessionId]);

  const resetCode = useCallback(async () => {
    try {
      await codePersistence.deleteSession(sessionId);
      lastCodeRef.current = '';
      setLastSaved(null);
      setHasUnsavedChanges(false);
      setSaveStatus({ status: 'idle' });
    } catch (error) {
      console.error('Failed to reset code:', error);
    }
  }, [sessionId]);

  const toggleAutoSave = useCallback(() => {
    setIsAutoSaveEnabled(prev => {
      const newValue = !prev;
      
      // If enabling auto-save and there are unsaved changes, save immediately
      if (newValue && hasUnsavedChanges && lastCodeRef.current) {
        saveCode(lastCodeRef.current, true);
      }
      
      return newValue;
    });
  }, [hasUnsavedChanges, saveCode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save when component unmounts or page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges && lastCodeRef.current) {
        // Use synchronous localStorage as fallback for page unload
        try {
          const session = {
            id: sessionId,
            lessonId,
            code: lastCodeRef.current,
            language,
            autoSaveEnabled: isAutoSaveEnabled,
            lastModified: new Date(),
            metadata: {
              lineCount: lastCodeRef.current.split('\n').length,
              characterCount: lastCodeRef.current.length
            }
          };
          localStorage.setItem(`emergency_save_${sessionId}`, JSON.stringify(session));
        } catch (error) {
          console.error('Emergency save failed:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, lessonId, language, isAutoSaveEnabled, hasUnsavedChanges]);

  // Wrap debouncedSave to match the expected signature
  const saveCodeAsync = useCallback(async (code: string, force = false): Promise<void> => {
    if (force) {
      await saveCode(code, force);
    } else {
      debouncedSave(code);
    }
  }, [saveCode, debouncedSave]);

  return {
    saveStatus,
    saveCode: saveCodeAsync,
    loadCode,
    resetCode,
    isAutoSaveEnabled,
    toggleAutoSave,
    lastSaved,
    hasUnsavedChanges
  };
}

// Hook for managing multiple code sessions
export function useCodeSessions() {
  const [sessions, setSessions] = useState<CodeSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllSessions = useCallback(async () => {
    try {
      setLoading(true);
      const allSessions = await codePersistence.getAllSessions();
      setSessions(allSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await codePersistence.deleteSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }, []);

  const cleanupOldSessions = useCallback(async () => {
    try {
      await codePersistence.cleanupOldSessions();
      await loadAllSessions(); // Refresh the list
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }, [loadAllSessions]);

  useEffect(() => {
    loadAllSessions();
  }, [loadAllSessions]);

  return {
    sessions,
    loading,
    loadAllSessions,
    deleteSession,
    cleanupOldSessions
  };
}
