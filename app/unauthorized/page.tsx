'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, ArrowLeft, Mail, User, Crown, Lock } from 'lucide-react';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { useAuth } from '@/lib/hooks/useAuth';
import { AuthErrorBoundary } from '@/components/errors/SpecializedErrorBoundaries';
import { cn } from '@/lib/utils';

export default function UnauthorizedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);

  const reason = searchParams.get('reason') || 'insufficient_permissions';
  const requiredRoles = searchParams.get('required')?.split(',') || [];
  const currentRole = searchParams.get('current') || user?.role || 'none';
  const returnUrl = searchParams.get('returnUrl');

  // Role information
  const roleInfo = {
    STUDENT: {
      icon: User,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      description: 'Access to learning materials and progress tracking'
    },
    MENTOR: {
      icon: User,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      description: 'Mentorship capabilities and student guidance'
    },
    INSTRUCTOR: {
      icon: Shield,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      description: 'Course creation and student management'
    },
    ADMIN: {
      icon: Crown,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      description: 'Full platform administration and management'
    }
  };

  const handleRequestAccess = async () => {
    setIsRequestingAccess(true);
    
    try {
      // Simulate access request
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would send a request to the backend
      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          requestedRoles: requiredRoles,
          currentRole,
          reason: `Access request for ${returnUrl || 'protected resource'}`,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        // Show success message
        alert('Access request submitted successfully! You will be notified when reviewed.');
      } else {
        throw new Error('Failed to submit access request');
      }
    } catch (error) {
      console.error('Access request failed:', error);
      alert('Failed to submit access request. Please try again or contact support.');
    } finally {
      setIsRequestingAccess(false);
    }
  };

  const getReasonMessage = () => {
    switch (reason) {
      case 'insufficient_permissions':
        return 'You don\'t have the required permissions to access this resource.';
      case 'insufficient_role':
        return 'Your current role doesn\'t have access to this feature.';
      case 'session_expired':
        return 'Your session has expired. Please log in again.';
      case 'account_suspended':
        return 'Your account has been suspended. Please contact support.';
      default:
        return 'Access to this resource is restricted.';
    }
  };

  const getActionButtons = () => {
    if (reason === 'session_expired' || !isAuthenticated) {
      return (
        <div className="space-y-3">
          <EnhancedButton
            onClick={() => router.push('/auth')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            touchTarget
          >
            <Lock className="w-4 h-4 mr-2" />
            Sign In
          </EnhancedButton>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {requiredRoles.length > 0 && (
          <EnhancedButton
            onClick={handleRequestAccess}
            loading={isRequestingAccess}
            loadingText="Submitting Request..."
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            touchTarget
            tooltip="Request access to this feature"
          >
            <Mail className="w-4 h-4 mr-2" />
            Request Access
          </EnhancedButton>
        )}
        
        <EnhancedButton
          onClick={() => router.back()}
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10"
          touchTarget
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </EnhancedButton>
        
        <EnhancedButton
          onClick={() => router.push('/dashboard')}
          variant="ghost"
          className="w-full text-gray-400 hover:text-white"
          touchTarget
        >
          Return to Dashboard
        </EnhancedButton>
      </div>
    );
  };

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <GlassCard className="p-8">
            {/* Error Icon */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                Access Denied
              </h1>
              
              <p className="text-gray-300">
                {getReasonMessage()}
              </p>
            </div>

            {/* Permission Details */}
            {requiredRoles.length > 0 && (
              <div className="bg-black/20 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Access Requirements:</h3>
                
                <div className="space-y-3">
                  {/* Required Roles */}
                  <div>
                    <span className="text-xs text-gray-400 block mb-2">Required Role(s):</span>
                    <div className="flex flex-wrap gap-2">
                      {requiredRoles.map((role) => {
                        const info = roleInfo[role as keyof typeof roleInfo];
                        const Icon = info?.icon || Shield;
                        
                        return (
                          <div
                            key={role}
                            className={cn(
                              'flex items-center space-x-2 px-3 py-1 rounded-full text-sm',
                              info?.bgColor || 'bg-gray-500/20'
                            )}
                          >
                            <Icon className={cn('w-3 h-3', info?.color || 'text-gray-400')} />
                            <span className="text-white font-medium">{role}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Current Role */}
                  <div>
                    <span className="text-xs text-gray-400 block mb-2">Your Current Role:</span>
                    <div className="flex items-center space-x-2">
                      {currentRole !== 'none' ? (
                        <>
                          {(() => {
                            const info = roleInfo[currentRole as keyof typeof roleInfo];
                            const Icon = info?.icon || User;
                            
                            return (
                              <div className={cn(
                                'flex items-center space-x-2 px-3 py-1 rounded-full text-sm',
                                info?.bgColor || 'bg-gray-500/20'
                              )}>
                                <Icon className={cn('w-3 h-3', info?.color || 'text-gray-400')} />
                                <span className="text-white font-medium">{currentRole}</span>
                              </div>
                            );
                          })()}
                          <div className="text-xs text-gray-400 ml-2">
                            {roleInfo[currentRole as keyof typeof roleInfo]?.description || 'Basic access'}
                          </div>
                        </>
                      ) : (
                        <span className="text-yellow-400 text-sm">No role assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {getActionButtons()}

            {/* Help Text */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-400 text-center">
                Need help? Contact our support team at{' '}
                <a 
                  href="mailto:support@soliditylearn.com" 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  support@soliditylearn.com
                </a>
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AuthErrorBoundary>
  );
}
