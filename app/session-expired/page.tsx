'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Clock, 
  RefreshCw, 
  Shield, 
  ArrowRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { useAuth } from '@/lib/hooks/useAuth';
import { SessionManager } from '@/lib/auth/sessionManager';
import { AuthErrorBoundary } from '@/components/errors/SpecializedErrorBoundaries';
import { AuthModal } from '@/components/auth/AuthModal';

export default function SessionExpiredPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, refreshSession } = useAuth();
  const [sessionManager] = useState(() => SessionManager.getInstance());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);

  const returnUrl = searchParams.get('returnUrl');
  const reason = searchParams.get('reason') || 'expired';

  // Auto-redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && !refreshAttempted) {
      const redirectUrl = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
      router.push(redirectUrl);
    }
  }, [isAuthenticated, returnUrl, router, refreshAttempted]);

  // Attempt automatic session refresh on mount
  useEffect(() => {
    const attemptRefresh = async () => {
      if (refreshAttempted) return;
      
      setRefreshAttempted(true);
      setIsRefreshing(true);

      try {
        // Check if we have a stored session that might be refreshable
        const hasStoredSession = sessionManager.loadFromStorage();
        
        if (hasStoredSession) {
          const success = await refreshSession();
          if (success) {
            // Session refreshed successfully, redirect
            const redirectUrl = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
            router.push(redirectUrl);
            return;
          }
        }
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    attemptRefresh();
  }, [sessionManager, refreshSession, returnUrl, router, refreshAttempted]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      const success = await refreshSession();
      if (success) {
        const redirectUrl = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
        router.push(redirectUrl);
      } else {
        // Refresh failed, show login modal
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error('Manual refresh failed:', error);
      setShowAuthModal(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const getReasonMessage = () => {
    switch (reason) {
      case 'expired':
        return 'Your session has expired for security reasons.';
      case 'inactive':
        return 'Your session expired due to inactivity.';
      case 'invalid':
        return 'Your session is no longer valid.';
      case 'refresh_failed':
        return 'Unable to refresh your session automatically.';
      default:
        return 'Your session has expired.';
    }
  };

  const getReasonIcon = () => {
    switch (reason) {
      case 'inactive':
        return Clock;
      case 'invalid':
        return AlertTriangle;
      case 'refresh_failed':
        return RefreshCw;
      default:
        return Clock;
    }
  };

  if (isRefreshing && !refreshAttempted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Refreshing Session
          </h2>
          <p className="text-gray-300">
            Attempting to restore your session...
          </p>
        </motion.div>
      </div>
    );
  }

  const ReasonIcon = getReasonIcon();

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-orange-500/20 rounded-full flex items-center justify-center">
              <ReasonIcon className="w-10 h-10 text-orange-400" />
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-4">
              Session Expired
            </h1>
            
            {/* Message */}
            <p className="text-gray-300 mb-6">
              {getReasonMessage()} Please sign in again to continue your Solidity learning journey.
            </p>

            {/* Session Info */}
            <div className="bg-black/20 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Session Details:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Reason:</span>
                  <span className="text-white capitalize">{reason.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time:</span>
                  <span className="text-white">{new Date().toLocaleTimeString()}</span>
                </div>
                {returnUrl && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Destination:</span>
                    <span className="text-white text-xs truncate ml-2">
                      {decodeURIComponent(returnUrl)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Try Refresh Button */}
              <EnhancedButton
                onClick={handleManualRefresh}
                loading={isRefreshing}
                loadingText="Refreshing..."
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                touchTarget
                tooltip="Attempt to refresh your session"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Refresh
              </EnhancedButton>

              {/* Sign In Button */}
              <EnhancedButton
                onClick={handleSignIn}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                touchTarget
                tooltip="Sign in with your credentials"
              >
                <Shield className="w-4 h-4 mr-2" />
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </EnhancedButton>

              {/* Go Home Button */}
              <EnhancedButton
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
                touchTarget
              >
                Return to Home
              </EnhancedButton>
            </div>

            {/* Security Notice */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                <CheckCircle className="w-3 h-3" />
                <span>Your data is secure and will be restored after sign-in</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode="login"
        />
      </div>
    </AuthErrorBoundary>
  );
}
