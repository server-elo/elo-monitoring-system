'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, Github, Chrome, ArrowRight, User, UserPlus, CheckCircle, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { AsyncSubmitButton } from '@/components/ui/EnhancedButton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { registrationSchema, type RegistrationData } from '@/lib/auth/password';
import { cn } from '@/lib/utils';
import { withAuthErrorBoundary } from '@/lib/components/ErrorBoundaryHOCs';

function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Form setup
  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange'
  });

  // Check if user is already authenticated
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        if (session) {
          router.replace(returnUrl);
          return;
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [router, returnUrl]);

  const handleSubmit = async (data: RegistrationData) => {
    setIsLoading(true);
    setAuthError(null);
    setSuccess(null);

    try {
      // Create account
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setAuthError(result.message || 'Registration failed. Please try again.');
        return;
      }

      setSuccess('Account created successfully! You can now sign in.');
      
      // Auto-redirect to login after a short delay
      setTimeout(() => {
        router.push(`/auth/login${returnUrl !== '/dashboard' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`);
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      await signIn(provider, { callbackUrl: returnUrl });
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
      setAuthError(`${provider} sign-in failed. Please try again.`);
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <Loader2 className="w-full h-full text-blue-400" />
          </motion.div>
          <p className="text-white text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-300">Join thousands learning Solidity development</p>
          </div>

          <GlassCard className="p-8">
            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center space-x-3"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-400 text-sm">{success}</p>
              </motion.div>
            )}

            {/* Error Display */}
            {authError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6"
              >
                <ErrorMessage
                  error={{
                    id: 'auth-error',
                    code: 'AUTH_ERROR',
                    message: authError,
                    severity: 'critical',
                    category: 'auth',
                    context: 'inline',
                    timestamp: new Date(),
                    userMessage: authError,
                    actionable: false,
                    retryable: false
                  }}
                  className="bg-red-500/10 border-red-500/20 text-red-400"
                />
              </motion.div>
            )}

            {/* OAuth Providers */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleOAuthSignIn('github')}
                disabled={isLoading || !!success}
                className={cn(
                  "w-full flex items-center justify-center space-x-3 p-4 rounded-lg",
                  "bg-gray-800 hover:bg-gray-700 text-white font-medium",
                  "transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                  "border border-gray-600 hover:border-gray-500"
                )}
              >
                <Github className="w-5 h-5" />
                <span>Continue with GitHub</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoading || !!success}
                className={cn(
                  "w-full flex items-center justify-center space-x-3 p-4 rounded-lg",
                  "bg-white hover:bg-gray-50 text-gray-900 font-medium",
                  "transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                  "border border-gray-300 hover:border-gray-400"
                )}
              >
                <Chrome className="w-5 h-5" />
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/5 text-gray-400">Or create account with email</span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...form.register('name')}
                    type="text"
                    id="name"
                    autoComplete="name"
                    disabled={isLoading || !!success}
                    className={cn(
                      "w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-all duration-200 disabled:opacity-50",
                      form.formState.errors.name ? "border-red-500" : "border-white/20"
                    )}
                    placeholder="Enter your full name"
                  />
                </div>
                {form.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-400">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...form.register('email')}
                    type="email"
                    id="email"
                    autoComplete="email"
                    disabled={isLoading || !!success}
                    className={cn(
                      "w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-all duration-200 disabled:opacity-50",
                      form.formState.errors.email ? "border-red-500" : "border-white/20"
                    )}
                    placeholder="Enter your email"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-400">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...form.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
                    disabled={isLoading || !!success}
                    className={cn(
                      "w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-all duration-200 disabled:opacity-50",
                      form.formState.errors.password ? "border-red-500" : "border-white/20"
                    )}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || !!success}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-400">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...form.register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    autoComplete="new-password"
                    disabled={isLoading || !!success}
                    className={cn(
                      "w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-all duration-200 disabled:opacity-50",
                      form.formState.errors.confirmPassword ? "border-red-500" : "border-white/20"
                    )}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading || !!success}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 disabled:opacity-50"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <AsyncSubmitButton
                onSubmit={async () => {
                  const data = form.getValues();
                  await handleSubmit(data);
                }}
                submitText="Create Account"
                loadingText="Creating Account..."
                disabled={isLoading || !form.formState.isValid || !!success}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                touchTarget
                asyncOptions={{
                  debounceMs: 300,
                  successDuration: 1000,
                  errorDuration: 3000
                }}
              />
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => router.push(`/auth/login${returnUrl !== '/dashboard' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`)}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

// Wrap with auth error boundary for specialized authentication error handling
export default withAuthErrorBoundary(RegisterPage, {
  name: 'RegisterPage',
  enableRetry: true,
  maxRetries: 1,
  showErrorDetails: process.env.NODE_ENV === 'development'
});
