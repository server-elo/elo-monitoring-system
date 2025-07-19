'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Code, BookOpen, Shield, Upload, Wifi, Settings } from 'lucide-react';
import { FeatureErrorBoundary, ComponentErrorBoundary } from './ErrorBoundary';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { Card } from '@/components/ui/card';

// Code Editor Error Boundary
export function CodeEditorErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <FeatureErrorBoundary
      name="Code Editor"
      onError={(error, errorInfo) => {
        console.error('Code Editor Error:', error, errorInfo);
        // Could save user's code to localStorage before crash
        const currentCode = localStorage.getItem('solidity-code-backup');
        if (currentCode) {
          console.log('Code backup available:', currentCode);
        }
      }}
      fallback={
        <Card className="p-6 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/30">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Code className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Code Editor Unavailable
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                The code editor encountered an error. Your code may have been automatically saved.
              </p>
              <div className="space-y-2">
                <EnhancedButton
                  onClick={() => window.location.reload()}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  touchTarget
                >
                  Reload Editor
                </EnhancedButton>
                <details className="mt-4">
                  <summary className="text-sm text-yellow-600 dark:text-yellow-400 cursor-pointer">
                    Recovery Options
                  </summary>
                  <div className="mt-2 space-y-2">
                    <EnhancedButton
                      onClick={() => {
                        const backup = localStorage.getItem('solidity-code-backup');
                        if (backup) {
                          navigator.clipboard.writeText(backup);
                          alert('Code backup copied to clipboard');
                        } else {
                          alert('No code backup found');
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      Restore Code Backup
                    </EnhancedButton>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </Card>
      }
    >
      {children}
    </FeatureErrorBoundary>
  );
}

// Learning Module Error Boundary
export function LearningModuleErrorBoundary({ 
  children, 
  moduleName 
}: { 
  children: ReactNode;
  moduleName?: string;
}) {
  return (
    <FeatureErrorBoundary
      name={`Learning Module${moduleName ? `: ${moduleName}` : ''}`}
      onError={(error, errorInfo) => {
        console.error('Learning Module Error:', error, errorInfo);
        // Track learning progress before crash
        const progress = localStorage.getItem('learning-progress');
        console.log('Learning progress preserved:', progress);
      }}
      fallback={
        <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Learning Module Error
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mb-4">
                {moduleName ? `The "${moduleName}" module` : 'This learning module'} encountered an error. 
                Your progress has been saved and you can continue with other modules.
              </p>
              <div className="flex flex-wrap gap-2">
                <EnhancedButton
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  touchTarget
                >
                  Retry Module
                </EnhancedButton>
                <EnhancedButton
                  onClick={() => window.location.href = '/learn'}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  touchTarget
                >
                  Browse Other Modules
                </EnhancedButton>
              </div>
            </div>
          </div>
        </Card>
      }
    >
      {children}
    </FeatureErrorBoundary>
  );
}

// Authentication Error Boundary
export function AuthErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <FeatureErrorBoundary
      name="Authentication"
      onError={(error, errorInfo) => {
        console.error('Auth Error:', error, errorInfo);
        // Clear potentially corrupted auth state
        localStorage.removeItem('auth-token');
        sessionStorage.clear();
      }}
      fallback={
        <Card className="p-6 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Authentication Error
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-4">
                There was an error with the authentication system. Please try logging in again.
              </p>
              <div className="flex flex-wrap gap-2">
                <EnhancedButton
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/login';
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  touchTarget
                >
                  Go to Login
                </EnhancedButton>
                <EnhancedButton
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  touchTarget
                >
                  Continue as Guest
                </EnhancedButton>
              </div>
            </div>
          </div>
        </Card>
      }
    >
      {children}
    </FeatureErrorBoundary>
  );
}

// File Upload Error Boundary
export function FileUploadErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ComponentErrorBoundary
      name="File Upload"
      onError={(error, errorInfo) => {
        console.error('File Upload Error:', error, errorInfo);
      }}
      fallback={
        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <Upload className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                Upload Error
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                The file upload component encountered an error. Please try refreshing the page.
              </p>
              <EnhancedButton
                onClick={() => window.location.reload()}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                touchTarget
              >
                Refresh Page
              </EnhancedButton>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ComponentErrorBoundary>
  );
}

// Network-dependent Component Error Boundary
export function NetworkErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ComponentErrorBoundary
      name="Network Component"
      onError={(error, errorInfo) => {
        console.error('Network Component Error:', error, errorInfo);
        // Check if it's a network-related error
        if (error.message.includes('fetch') || error.message.includes('network')) {
          console.log('Network error detected, checking connection...');
        }
      }}
      fallback={
        <div className="p-4 bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <Wifi className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                Connection Error
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                This component requires a network connection. Please check your internet connection and try again.
              </p>
              <div className="flex gap-2">
                <EnhancedButton
                  onClick={() => window.location.reload()}
                  size="sm"
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                  touchTarget
                >
                  Retry
                </EnhancedButton>
                <EnhancedButton
                  onClick={() => {
                    if (navigator.onLine) {
                      alert('You appear to be online. The issue may be with our servers.');
                    } else {
                      alert('You appear to be offline. Please check your internet connection.');
                    }
                  }}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  touchTarget
                >
                  Check Connection
                </EnhancedButton>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ComponentErrorBoundary>
  );
}

// Settings/Configuration Error Boundary
export function SettingsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <FeatureErrorBoundary
      name="Settings"
      onError={(error, errorInfo) => {
        console.error('Settings Error:', error, errorInfo);
        // Reset settings to defaults if corrupted
        const defaultSettings = {
          theme: 'dark',
          language: 'en',
          notifications: true
        };
        localStorage.setItem('app-settings', JSON.stringify(defaultSettings));
      }}
      fallback={
        <Card className="p-6 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/30">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
                Settings Error
              </h3>
              <p className="text-purple-700 dark:text-purple-300 mb-4">
                There was an error loading your settings. Default settings have been restored.
              </p>
              <div className="flex flex-wrap gap-2">
                <EnhancedButton
                  onClick={() => window.location.reload()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  touchTarget
                >
                  Reload Settings
                </EnhancedButton>
                <EnhancedButton
                  onClick={() => {
                    localStorage.removeItem('app-settings');
                    window.location.reload();
                  }}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                  touchTarget
                >
                  Reset to Defaults
                </EnhancedButton>
              </div>
            </div>
          </div>
        </Card>
      }
    >
      {children}
    </FeatureErrorBoundary>
  );
}

// Generic Async Component Error Boundary
export function AsyncComponentErrorBoundary({ 
  children, 
  componentName = 'Component'
}: { 
  children: ReactNode;
  componentName?: string;
}) {
  return (
    <ComponentErrorBoundary
      name={componentName}
      enableRetry
      maxRetries={2}
      fallback={
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {componentName} failed to load
            </span>
            <EnhancedButton
              onClick={() => window.location.reload()}
              size="sm"
              variant="ghost"
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Retry
            </EnhancedButton>
          </div>
        </motion.div>
      }
    >
      {children}
    </ComponentErrorBoundary>
  );
}
