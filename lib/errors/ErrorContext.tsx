'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { AppError, ErrorFactory } from './types';
import { ErrorToast, ErrorBanner } from '@/components/ui/ErrorMessage';

interface ErrorState {
  errors: AppError[];
  toastErrors: AppError[];
  bannerErrors: AppError[];
  isOnline: boolean;
  retryQueue: Array<{ error: AppError; retryFn: () => Promise<void> }>;
}

type ErrorAction =
  | { type: 'ADD_ERROR'; payload: AppError }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'ADD_TO_RETRY_QUEUE'; payload: { error: AppError; retryFn: () => Promise<void> } }
  | { type: 'REMOVE_FROM_RETRY_QUEUE'; payload: string }
  | { type: 'UPDATE_ERROR'; payload: { id: string; updates: Partial<AppError> } };

const initialState: ErrorState = {
  errors: [],
  toastErrors: [],
  bannerErrors: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  retryQueue: []
};

function errorReducer(state: ErrorState, action: ErrorAction): ErrorState {
  switch (action.type) {
    case 'ADD_ERROR': {
      const error = action.payload;
      const newErrors = [...state.errors, error];
      
      return {
        ...state,
        errors: newErrors,
        toastErrors: error.context === 'toast' ? [...state.toastErrors, error] : state.toastErrors,
        bannerErrors: error.context === 'banner' ? [...state.bannerErrors, error] : state.bannerErrors
      };
    }
    
    case 'REMOVE_ERROR': {
      const errorId = action.payload;
      return {
        ...state,
        errors: state.errors.filter(e => e.id !== errorId),
        toastErrors: state.toastErrors.filter(e => e.id !== errorId),
        bannerErrors: state.bannerErrors.filter(e => e.id !== errorId)
      };
    }
    
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
        toastErrors: [],
        bannerErrors: []
      };
    
    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload
      };
    
    case 'ADD_TO_RETRY_QUEUE':
      return {
        ...state,
        retryQueue: [...state.retryQueue, action.payload]
      };
    
    case 'REMOVE_FROM_RETRY_QUEUE':
      return {
        ...state,
        retryQueue: state.retryQueue.filter(item => item.error.id !== action.payload)
      };
    
    case 'UPDATE_ERROR': {
      const { id, updates } = action.payload;
      const updatedErrors = state.errors.map(error =>
        error.id === id ? { ...error, ...updates } : error
      );
      
      return {
        ...state,
        errors: updatedErrors,
        toastErrors: state.toastErrors.map(error =>
          error.id === id ? { ...error, ...updates } : error
        ),
        bannerErrors: state.bannerErrors.map(error =>
          error.id === id ? { ...error, ...updates } : error
        )
      };
    }
    
    default:
      return state;
  }
}

interface ErrorContextValue {
  state: ErrorState;
  addError: (error: AppError) => void;
  removeError: (errorId: string) => void;
  clearErrors: () => void;
  retryError: (errorId: string) => Promise<void>;
  reportError: (error: Error, context?: Partial<AppError>) => void;
  
  // Convenience methods for creating specific error types
  showApiError: (message: string, options?: any) => void;
  showFormError: (field: string, message: string, options?: any) => void;
  showNetworkError: (isOffline?: boolean) => void;
  showAuthError: (type: 'login' | 'register' | 'permission' | 'refresh', message?: string) => void;
  showUploadError: (fileName: string, reason: string, options?: any) => void;
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
      
      // Process retry queue when coming back online
      state.retryQueue.forEach(async ({ error, retryFn }) => {
        try {
          await retryFn();
          dispatch({ type: 'REMOVE_FROM_RETRY_QUEUE', payload: error.id });
          dispatch({ type: 'REMOVE_ERROR', payload: error.id });
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      });
    };

    const handleOffline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
      
      // Show offline banner
      const offlineError = ErrorFactory.createNetworkError({
        message: 'Network connection lost',
        isOffline: true,
        userMessage: 'You\'re currently offline. Some features may not be available.'
      });
      
      dispatch({ type: 'ADD_ERROR', payload: offlineError });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.retryQueue]);

  const addError = useCallback((error: AppError) => {
    dispatch({ type: 'ADD_ERROR', payload: error });
    
    // Log error for monitoring
    console.error('Error added:', error);
    
    // Send to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error monitoring service (Sentry, LogRocket, etc.)
    }
  }, []);

  const removeError = useCallback((errorId: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: errorId });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const retryError = useCallback(async (errorId: string) => {
    const error = state.errors.find(e => e.id === errorId);
    if (!error || !error.retryable) return;

    // Update retry count
    const retryCount = (error.retryCount || 0) + 1;
    const maxRetries = error.maxRetries || 3;

    if (retryCount > maxRetries) {
      dispatch({ 
        type: 'UPDATE_ERROR', 
        payload: { 
          id: errorId, 
          updates: { 
            retryable: false,
            userMessage: 'Maximum retry attempts reached. Please try again later.'
          }
        }
      });
      return;
    }

    dispatch({ 
      type: 'UPDATE_ERROR', 
      payload: { 
        id: errorId, 
        updates: { retryCount }
      }
    });

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));

    // The actual retry logic should be handled by the component that created the error
    // This is just updating the error state
  }, [state.errors]);

  const reportError = useCallback((error: Error, context: Partial<AppError> = {}) => {
    const appError = ErrorFactory.createApiError({
      message: error.message,
      userMessage: context.userMessage || 'An unexpected error occurred',
      severity: context.severity || 'critical',
      ...context
    });

    addError(appError);
  }, [addError]);

  // Convenience methods
  const showApiError = useCallback((message: string, options: any = {}) => {
    const error = ErrorFactory.createApiError({
      message,
      ...options
    });
    addError(error);
  }, [addError]);

  const showFormError = useCallback((field: string, message: string, options: any = {}) => {
    const error = ErrorFactory.createFormError({
      field,
      message,
      ...options
    });
    addError(error);
  }, [addError]);

  const showNetworkError = useCallback((isOffline: boolean = false) => {
    const error = ErrorFactory.createNetworkError({
      message: isOffline ? 'Network connection lost' : 'Network error occurred',
      isOffline
    });
    addError(error);
  }, [addError]);

  const showAuthError = useCallback((type: 'login' | 'register' | 'permission' | 'refresh', message?: string) => {
    const error = ErrorFactory.createAuthError({
      authType: type,
      message: message || `Authentication ${type} error`
    });
    addError(error);
  }, [addError]);

  const showUploadError = useCallback((fileName: string, reason: string, options: any = {}) => {
    const error = ErrorFactory.createUploadError({
      fileName,
      message: reason,
      ...options
    });
    addError(error);
  }, [addError]);

  const contextValue: ErrorContextValue = {
    state,
    addError,
    removeError,
    clearErrors,
    retryError,
    reportError,
    showApiError,
    showFormError,
    showNetworkError,
    showAuthError,
    showUploadError
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      
      {/* Render toast errors */}
      {state.toastErrors.map(error => (
        <ErrorToast
          key={error.id}
          error={error}
          onDismiss={() => removeError(error.id)}
          onRetry={() => retryError(error.id)}
        />
      ))}
      
      {/* Render banner errors */}
      {state.bannerErrors.map(error => (
        <ErrorBanner
          key={error.id}
          error={error}
          onDismiss={() => removeError(error.id)}
          onRetry={() => retryError(error.id)}
        />
      ))}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

// Hook for handling async operations with error management
export function useAsyncError() {
  const { reportError, showApiError } = useError();

  const handleAsyncError = useCallback(<T extends any>(
    asyncFn: () => Promise<T>,
    errorContext?: Partial<AppError>
  ): Promise<T | null> => {
    return (async () => {
      try {
        return await asyncFn();
      } catch (error) {
        if (error instanceof Error) {
          reportError(error, errorContext);
        } else {
          showApiError('An unexpected error occurred', errorContext);
        }
        return null;
      }
    })();
  }, [reportError, showApiError]);

  return { handleAsyncError };
}
