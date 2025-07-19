import React from 'react';

/**
 * Default Error Boundary Fallback Component
 * Used when React components encounter errors
 */

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  resetError,
}) => {
  return (
    <div className="error-boundary min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
          Something went wrong
        </h2>
        
        <p className="text-gray-600 text-center mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Try again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Reload page
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error details (development only)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundaryFallback;
