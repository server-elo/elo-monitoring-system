'use client';

import React, { Suspense, lazy } from 'react';
import { MonacoEditorSkeleton } from '@/components/ui/LoadingSkeletons';
import { useIntersectionObserver } from '@/lib/hooks/useLazyLoading';
import { ErrorBoundary } from 'react-error-boundary';

// Lazy load the Monaco Editor component
const MonacoCollaborativeEditor = lazy(() => 
  import('@/components/collaboration/MonacoCollaborativeEditor').then(module => ({
    default: module.MonacoCollaborativeEditor
  }))
);

interface LazyMonacoEditorProps {
  code?: string;
  language?: string;
  onChange?: (value: string) => void;
  onMount?: (editor: any, monaco: any) => void;
  readOnly?: boolean;
  className?: string;
  height?: string;
  theme?: string;
  options?: any;
  // Lazy loading options
  threshold?: number;
  rootMargin?: string;
  fallbackInView?: boolean;
}

// Error fallback component
const EditorErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
}) => (
  <div className="w-full h-96 glass border border-red-400/20 rounded-lg p-6 flex flex-col items-center justify-center">
    <div className="text-red-400 mb-4">
      <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">Editor Failed to Load</h3>
    <p className="text-gray-400 text-center mb-4 max-w-md">
      The code editor encountered an error while loading. This might be due to a network issue or browser compatibility.
    </p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
    >
      Try Again
    </button>
    {process.env.NODE_ENV === 'development' && (
      <details className="mt-4 text-xs text-gray-500">
        <summary className="cursor-pointer">Error Details</summary>
        <pre className="mt-2 p-2 bg-gray-800 rounded text-red-400 overflow-auto max-w-md">
          {error.message}
        </pre>
      </details>
    )}
  </div>
);

// Loading component with progress indication
const EditorLoadingComponent: React.FC<{ progress?: number }> = ({ progress }) => (
  <div className="relative">
    <MonacoEditorSkeleton />
    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-white text-sm">Loading Code Editor...</p>
        {progress !== undefined && (
          <div className="mt-2 w-32 bg-gray-700 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  </div>
);

export const LazyMonacoEditor: React.FC<LazyMonacoEditorProps> = ({
  threshold = 0.1,
  rootMargin = '100px',
  fallbackInView = false,
  ...editorProps
}) => {
  const { ref, isInView } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
    fallbackInView,
  });

  return (
    <div ref={ref} className={editorProps.className}>
      {isInView ? (
        <ErrorBoundary
          FallbackComponent={EditorErrorFallback}
          onReset={() => window.location.reload()}
        >
          <Suspense fallback={<EditorLoadingComponent />}>
            <MonacoCollaborativeEditor sessionId="default-session" {...editorProps} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <MonacoEditorSkeleton className={editorProps.className} />
      )}
    </div>
  );
};

// Preload function for critical paths
export const preloadMonacoEditor = () => {
  if (typeof window !== 'undefined') {
    // Preload the Monaco Editor module
    import('@/components/collaboration/MonacoCollaborativeEditor');
    
    // Preload Monaco Editor assets
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = '/_next/static/chunks/monaco-editor.js';
    document.head.appendChild(link);
  }
};

// Hook for programmatic loading
export const useMonacoEditor = () => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadEditor = React.useCallback(async () => {
    try {
      await import('@/components/collaboration/MonacoCollaborativeEditor');
      setIsLoaded(true);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  return { isLoaded, error, loadEditor };
};

export default LazyMonacoEditor;
