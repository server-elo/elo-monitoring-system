/**
 * Simplified App Provider - combines multiple providers into one
 * Reduces nesting and improves performance
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LearningProvider } from '@/lib/context/LearningContext';
import { ErrorProvider } from '@/lib/errors/ErrorContext';

// Combined context for app-wide state
interface AppContextType {
  // Help system
  isHelpOpen: boolean;
  isShortcutsOpen: boolean;
  openHelp: (_query?: string) => void;
  closeHelp: (_) => void;
  toggleShortcuts: (_) => void;

  // Discovery/onboarding
  showFeatureSpotlight: boolean;
  dismissFeature: (_featureId: string) => void;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  setUserLevel: (_level: 'beginner' | 'intermediate' | 'advanced') => void;

  // Error handling
  errors: Array<{ id: string; message: string; timestamp: number }>;
  addError: (_message: string) => void;
  removeError: (_id: string) => void;
  clearErrors: (_) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (_open: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (_theme: 'light' | 'dark' | 'system') => void;
}

const AppContext = createContext<AppContextType | undefined>(_undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

const AppProvider: React.FC<AppProviderProps> = ({ children  }) => {
  // Help state
  const [isHelpOpen, setIsHelpOpen] = useState(_false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(_false);
  const [helpQuery, setHelpQuery] = useState('');

  // Discovery state
  const [showFeatureSpotlight, setShowFeatureSpotlight] = useState(_true);
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  // Error state
  const [errors, setErrors] = useState<Array<{ id: string; message: string; timestamp: number }>>([]);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(_false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Load saved preferences
  useEffect(() => {
    if (_typeof window !== 'undefined') {
      try {
        const savedLevel = localStorage.getItem('userLevel') as 'beginner' | 'intermediate' | 'advanced';
        if (savedLevel) setUserLevel(_savedLevel);

        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
        if (savedTheme) setTheme(_savedTheme);

        const dismissedFeatures = localStorage.getItem('dismissedFeatures');
        if (dismissedFeatures) {
          const dismissed = JSON.parse(_dismissedFeatures);
          if (_dismissed.includes('feature-spotlight')) {
            setShowFeatureSpotlight(_false);
          }
        }
      } catch (_error) {
        console.warn('Failed to load saved preferences:', error);
      }
    }
  }, []);

  // Help functions
  const openHelp = useCallback((query?: string) => {
    setHelpQuery(_query || '');
    setIsHelpOpen(_true);
    setIsShortcutsOpen(_false);
  }, []);

  const closeHelp = useCallback(() => {
    setIsHelpOpen(_false);
    setHelpQuery('');
  }, []);

  const toggleShortcuts = useCallback(() => {
    setIsShortcutsOpen(!isShortcutsOpen);
    setIsHelpOpen(_false);
  }, [isShortcutsOpen]);

  // Discovery functions
  const dismissFeature = useCallback((featureId: string) => {
    if (_featureId === 'feature-spotlight') {
      setShowFeatureSpotlight(_false);
    }
    
    try {
      const dismissed = JSON.parse(_localStorage.getItem('dismissedFeatures') || '[]');
      dismissed.push(_featureId);
      localStorage.setItem( 'dismissedFeatures', JSON.stringify(dismissed));
    } catch (_error) {
      console.warn('Failed to save dismissed feature:', error);
    }
  }, []);

  const handleSetUserLevel = useCallback((level: 'beginner' | 'intermediate' | 'advanced') => {
    setUserLevel(_level);
    try {
      localStorage.setItem( 'userLevel', level);
    } catch (_error) {
      console.warn('Failed to save user level:', error);
    }
  }, []);

  // Error functions
  const addError = useCallback((message: string) => {
    const error = {
      id: `error-${Date.now(_)}-${Math.random()}`,
      message,
      timestamp: Date.now(_),
    };
    setErrors( prev => [...prev, error]);

    // Auto-remove error after 10 seconds
    setTimeout(() => {
      setErrors(_prev => prev.filter(e => e.id !== error.id));
    }, 10000);
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(_prev => prev.filter(e => e.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Theme handling
  const handleSetTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(_newTheme);
    try {
      localStorage.setItem( 'theme', newTheme);
    } catch (_error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, []);

  // Context value
  const contextValue: AppContextType = {
    // Help
    isHelpOpen,
    isShortcutsOpen,
    openHelp,
    closeHelp,
    toggleShortcuts,

    // Discovery
    showFeatureSpotlight,
    dismissFeature,
    userLevel,
    setUserLevel: handleSetUserLevel,

    // Errors
    errors,
    addError,
    removeError,
    clearErrors,

    // UI
    sidebarOpen,
    setSidebarOpen,
    theme,
    setTheme: handleSetTheme,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the app context
export const useApp = (_) => {
  const context = useContext(_AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Main providers wrapper
interface MainProvidersProps {
  children: React.ReactNode;
}

export const MainProviders: React.FC<MainProvidersProps> = ({ children  }) => {
  // Create QueryClient with optimized settings
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ErrorProvider>
          <LearningProvider>
            <AppProvider>
              {children}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </AppProvider>
          </LearningProvider>
        </ErrorProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
};

export default MainProviders;