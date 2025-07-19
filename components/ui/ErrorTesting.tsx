'use client';

import React, { useState } from 'react';
;
import { 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Upload, 
  Shield, 
  Code, 
  RefreshCw,
  Bug,
  Zap
} from 'lucide-react';
import { Card } from './card';
import { EnhancedButton } from './EnhancedButton';
import { GlassErrorFeedback, NeumorphismErrorFeedback } from './FeedbackIndicators';
import { ErrorFactory, AppError } from '@/lib/errors/types';
import { useError } from '@/lib/errors/ErrorContext';
import { useRetry, useOfflineDetection, useErrorAnalytics, useErrorReporting } from '@/lib/hooks/useErrorRecovery';
import { cn } from '@/lib/utils';

export function ErrorTesting() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const [showGlassError, setShowGlassError] = useState(false);
  const [showNeumorphismError, setShowNeumorphismError] = useState(false);
  
  const { 
    showApiError, 
    showFormError, 
    showNetworkError, 
    showAuthError, 
    showUploadError,
    state: errorState 
  } = useError();
  
  const { isOnline, forceCheck: _forceCheck } = useOfflineDetection();
  const { trackError: _trackError, getStats } = useErrorAnalytics();
  const { submitBugReport, isSubmitting } = useErrorReporting();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Simulate different types of errors
  const simulateApiError = () => {
    const error = ErrorFactory.createApiError({
      message: 'Failed to fetch user data',
      statusCode: 500,
      endpoint: '/api/users',
      method: 'GET',
      userMessage: 'Unable to load user information. Our servers are experiencing issues.'
    });
    
    setCurrentError(error);
    showApiError(error.userMessage, { 
      statusCode: 500,
      retryable: true 
    });
    addTestResult('API Error simulated');
  };

  const simulateFormError = () => {
    const error = ErrorFactory.createFormError({
      message: 'Email validation failed',
      field: 'email',
      validationRule: 'email',
      currentValue: 'invalid-email',
      expectedFormat: 'user@example.com'
    });
    
    setCurrentError(error);
    showFormError('email', error.userMessage);
    addTestResult('Form Error simulated');
  };

  const simulateNetworkError = () => {
    const error = ErrorFactory.createNetworkError({
      message: 'Network connection lost',
      isOffline: !isOnline,
      userMessage: isOnline ? 'Network request failed' : 'You are currently offline'
    });
    
    setCurrentError(error);
    showNetworkError(!isOnline);
    addTestResult('Network Error simulated');
  };

  const simulateAuthError = () => {
    const error = ErrorFactory.createAuthError({
      message: 'Authentication failed',
      authType: 'permission',
      requiredRole: 'admin',
      userMessage: 'You need administrator privileges to access this feature'
    });
    
    setCurrentError(error);
    showAuthError('permission', error.userMessage);
    addTestResult('Auth Error simulated');
  };

  const simulateUploadError = () => {
    const error = ErrorFactory.createUploadError({
      message: 'File too large',
      fileName: 'large-file.pdf',
      fileSize: 10485760, // 10MB
      maxSize: 5242880, // 5MB
      userMessage: 'File "large-file.pdf" is too large (10 MB). Maximum size allowed is 5 MB.'
    });
    
    setCurrentError(error);
    showUploadError('large-file.pdf', error.userMessage, {
      fileSize: 10485760,
      maxSize: 5242880
    });
    addTestResult('Upload Error simulated');
  };

  const simulateGlassError = () => {
    const error = ErrorFactory.createApiError({
      message: 'Glassmorphism error demo',
      statusCode: 429,
      userMessage: 'Too many requests. Please wait a moment before trying again.',
      severity: 'warning'
    });
    
    setCurrentError(error);
    setShowGlassError(true);
    addTestResult('Glassmorphism Error displayed');
  };

  const simulateNeumorphismError = () => {
    const error = ErrorFactory.createApiError({
      message: 'Neumorphism error demo',
      statusCode: 404,
      userMessage: 'The requested resource was not found.',
      severity: 'warning'
    });
    
    setCurrentError(error);
    setShowNeumorphismError(true);
    addTestResult('Neumorphism Error displayed');
  };

  // Simulate async operation with retry
  const { execute: executeWithRetry, isRetrying, retryCount } = useRetry(
    async () => {
      // Simulate API call that fails 70% of the time
      if (Math.random() < 0.7) {
        throw new Error('Simulated API failure');
      }
      return 'Success!';
    },
    {
      maxRetries: 3,
      onRetry: (attempt) => {
        addTestResult(`Retry attempt ${attempt}/3`);
      },
      onSuccess: (result) => {
        addTestResult(`Operation succeeded: ${result}`);
      },
      onError: (error) => {
        addTestResult(`Operation failed after retries: ${error.message}`);
      }
    }
  );

  // Error boundary testing is handled by dedicated test button
  // const _testErrorBoundary = () => {
  //   // This will trigger an error boundary
  //   throw new Error('Test error boundary');
  // };

  const testBugReport = async () => {
    if (!currentError) {
      addTestResult('No current error to report');
      return;
    }

    try {
      await submitBugReport(
        new Error(currentError.message),
        'This is a test bug report from the error testing component.',
        'test@example.com'
      );
      addTestResult('Bug report submitted successfully');
    } catch (error) {
      addTestResult('Bug report submission failed');
    }
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Error Handling Testing Suite</h1>
          <p className="text-gray-300 text-lg">
            Comprehensive testing of error handling, recovery mechanisms, and user experience standards
          </p>
        </div>

        {/* Status Dashboard */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={cn('w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center',
                isOnline ? 'bg-green-500/20' : 'bg-red-500/20'
              )}>
                {isOnline ? <Wifi className="w-6 h-6 text-green-400" /> : <WifiOff className="w-6 h-6 text-red-400" />}
              </div>
              <p className="text-sm text-gray-300">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-sm text-gray-300">
                {stats.totalErrors} Errors
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-yellow-400" />
              </div>
              <p className="text-sm text-gray-300">
                Retry: {retryCount}/3
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-sm text-gray-300">
                {errorState.toastErrors.length} Active
              </p>
            </div>
          </div>
        </Card>

        {/* Error Simulation Controls */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Error Simulation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <EnhancedButton
              onClick={simulateApiError}
              className="bg-red-600 hover:bg-red-700 text-white"
              touchTarget
              tooltip="Simulate API server error"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              API Error
            </EnhancedButton>
            
            <EnhancedButton
              onClick={simulateFormError}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              touchTarget
              tooltip="Simulate form validation error"
            >
              <Code className="w-4 h-4 mr-2" />
              Form Error
            </EnhancedButton>
            
            <EnhancedButton
              onClick={simulateNetworkError}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              touchTarget
              tooltip="Simulate network connectivity error"
            >
              <Wifi className="w-4 h-4 mr-2" />
              Network Error
            </EnhancedButton>
            
            <EnhancedButton
              onClick={simulateAuthError}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              touchTarget
              tooltip="Simulate authentication/permission error"
            >
              <Shield className="w-4 h-4 mr-2" />
              Auth Error
            </EnhancedButton>
            
            <EnhancedButton
              onClick={simulateUploadError}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              touchTarget
              tooltip="Simulate file upload error"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Error
            </EnhancedButton>
            
            <EnhancedButton
              onClick={simulateGlassError}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              touchTarget
              tooltip="Show glassmorphism error design"
            >
              Glass Error
            </EnhancedButton>
            
            <EnhancedButton
              onClick={simulateNeumorphismError}
              className="bg-pink-600 hover:bg-pink-700 text-white"
              touchTarget
              tooltip="Show neumorphism error design"
            >
              Neumorphism Error
            </EnhancedButton>
            
            <EnhancedButton
              onClick={executeWithRetry}
              loading={isRetrying}
              loadingText="Retrying..."
              className="bg-green-600 hover:bg-green-700 text-white"
              touchTarget
              tooltip="Test retry mechanism with exponential backoff"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Test Retry
            </EnhancedButton>
          </div>
        </Card>

        {/* Design Pattern Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Glassmorphism Error */}
          {showGlassError && currentError && (
            <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Glassmorphism Error Design</h3>
              <GlassErrorFeedback
                error={currentError}
                onRetry={() => {
                  addTestResult('Glassmorphism error retry clicked');
                  setShowGlassError(false);
                }}
                onDismiss={() => {
                  addTestResult('Glassmorphism error dismissed');
                  setShowGlassError(false);
                }}
              />
            </Card>
          )}

          {/* Neumorphism Error */}
          {showNeumorphismError && currentError && (
            <div className="p-6 bg-gray-100 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Neumorphism Error Design</h3>
              <NeumorphismErrorFeedback
                error={currentError}
                colorScheme="light"
                onRetry={() => {
                  addTestResult('Neumorphism error retry clicked');
                  setShowNeumorphismError(false);
                }}
                onDismiss={() => {
                  addTestResult('Neumorphism error dismissed');
                  setShowNeumorphismError(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Test Results */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Test Results</h2>
            <div className="flex gap-2">
              <EnhancedButton
                onClick={testBugReport}
                loading={isSubmitting}
                loadingText="Submitting..."
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!currentError}
                touchTarget
                tooltip="Submit bug report for current error"
              >
                <Bug className="w-3 h-3 mr-1" />
                Test Bug Report
              </EnhancedButton>
              
              <EnhancedButton
                onClick={() => setTestResults([])}
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                touchTarget
              >
                Clear Results
              </EnhancedButton>
            </div>
          </div>
          
          <div className="bg-black/20 rounded-lg p-4 h-48 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">No tests run yet...</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <p key={index} className="text-sm text-gray-300 font-mono">
                    {result}
                  </p>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Error Analytics */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Error Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Errors by Category</h3>
              <div className="space-y-1">
                {Object.entries(stats.errorsByCategory).map(([category, count]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-gray-400 capitalize">{category}</span>
                    <span className="text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Errors by Severity</h3>
              <div className="space-y-1">
                {Object.entries(stats.errorsBySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between text-sm">
                    <span className="text-gray-400 capitalize">{severity}</span>
                    <span className="text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
