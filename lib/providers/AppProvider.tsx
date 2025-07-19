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

// Combined context for app-wide state
interface AppContextType {
  // Help system
  isHelpOpen: boolean;
  isShortcutsOpen: boolean;
  openHelp: (query?: string) => void;
  closeHelp: () => void;
  toggleShortcuts: () => void;

  // Discovery/onboarding
  showFeatureSpotlight: boolean;
  dismissFeature: (featureId: string) => void;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  setUserLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void;

  // Error handling
  errors: Array<{ id: string; message: string; timestamp: number }>;
  addError: (message: string) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Help state
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [helpQuery, setHelpQuery] = useState('');

  // Discovery state
  const [showFeatureSpotlight, setShowFeatureSpotlight] = useState(true);
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  // Error state
  const [errors, setErrors] = useState<Array<{ id: string; message: string; timestamp: number }>>([]);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Load saved preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedLevel = localStorage.getItem('userLevel') as 'beginner' | 'intermediate' | 'advanced';
        if (savedLevel) setUserLevel(savedLevel);

        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
        if (savedTheme) setTheme(savedTheme);

        const dismissedFeatures = localStorage.getItem('dismissedFeatures');
        if (dismissedFeatures) {
          const dismissed = JSON.parse(dismissedFeatures);
          if (dismissed.includes('feature-spotlight')) {
            setShowFeatureSpotlight(false);
          }
        }
      } catch (error) {
        console.warn('Failed to load saved preferences:', error);
      }
    }
  }, []);

  // Help functions
  const openHelp = useCallback((query?: string) => {
    setHelpQuery(query || '');
    setIsHelpOpen(true);
    setIsShortcutsOpen(false);
  }, []);

  const closeHelp = useCallback(() => {
    setIsHelpOpen(false);
    setHelpQuery('');
  }, []);

  const toggleShortcuts = useCallback(() => {
    setIsShortcutsOpen(!isShortcutsOpen);
    setIsHelpOpen(false);
  }, [isShortcutsOpen]);

  // Discovery functions
  const dismissFeature = useCallback((featureId: string) => {
    if (featureId === 'feature-spotlight') {
      setShowFeatureSpotlight(false);
    }
    
    try {
      const dismissed = JSON.parse(localStorage.getItem('dismissedFeatures') || '[]');
      dismissed.push(featureId);
      localStorage.setItem('dismissedFeatures', JSON.stringify(dismissed));
    } catch (error) {
      console.warn('Failed to save dismissed feature:', error);
    }
  }, []);

  const handleSetUserLevel = useCallback((level: 'beginner' | 'intermediate' | 'advanced') => {
    setUserLevel(level);
    try {
      localStorage.setItem('userLevel', level);
    } catch (error) {
      console.warn('Failed to save user level:', error);
    }
  }, []);

  // Error functions
  const addError = useCallback((message: string) => {
    const error = {
      id: `error-${Date.now()}-${Math.random()}`,
      message,
      timestamp: Date.now(),
    };
    setErrors(prev => [...prev, error]);

    // Auto-remove error after 10 seconds
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.id !== error.id));
    }, 10000);
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Theme handling
  const handleSetTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
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
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Main providers wrapper
interface MainProvidersProps {
  children: React.ReactNode;
}

export const MainProviders: React.FC<MainProvidersProps> = ({ children }) => {
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
        <LearningProvider>
          <AppProvider>
            {children}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </AppProvider>
        </LearningProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
};

export default MainProviders;