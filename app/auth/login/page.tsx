'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, Github, Chrome, ArrowRight, Shield, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { AsyncSubmitButton } from '@/components/ui/EnhancedButton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { loginSchema, type LoginData } from '@/lib/auth/password';
import { cn } from '@/lib/utils';
import { withAuthErrorBoundary } from '@/lib/components/ErrorBoundaryHOCs';

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  const error = searchParams.get('error');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Form setup
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
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

  // Handle URL error parameter
  useEffect(() => {
    if (error) {
      switch (error) {
        case 'CredentialsSignin':
          setAuthError('Invalid email or password. Please check your credentials and try again.');
          break;
        case 'OAuthSignin':
        case 'OAuthCallback':
        case 'OAuthCreateAccount':
          setAuthError('OAuth authentication failed. Please try again.');
          break;
        case 'EmailCreateAccount':
          setAuthError('Could not create account with this email.');
          break;
        case 'Callback':
          setAuthError('Authentication callback failed.');
          break;
        case 'OAuthAccountNotLinked':
          setAuthError('This email is already associated with another account.');
          break;
        case 'EmailSignin':
          setAuthError('Email sign-in failed.');
          break;
        case 'SessionRequired':
          setAuthError('Please sign in to access this page.');
          break;
        default:
          setAuthError('Authentication failed. Please try again.');
      }
    }
  }, [error]);

  const handleSubmit = async (data: LoginData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setAuthError(
          result.error === 'CredentialsSignin'
            ? 'Invalid email or password. Please check your credentials and try again.'
            : 'Login failed. Please try again or contact support if the problem persists.'
        );
        return;
      }

      if (result?.ok) {
        // Get the updated session to check user role
        const updatedSession = await getSession();

        // Role-based redirect logic
        if (updatedSession?.user?.role === 'ADMIN') {
          router.replace('/admin');
        } else if (updatedSession?.user?.role === 'INSTRUCTOR') {
          router.replace('/instructor');
        } else {
          router.replace(returnUrl);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
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
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-300">Sign in to continue your Solidity learning journey</p>
          </div>

          <GlassCard className="p-8">
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                <span className="px-2 bg-white/5 text-gray-400">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                    className={cn(
                      "w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-all duration-200",
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
                    autoComplete="current-password"
                    className={cn(
                      "w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-all duration-200",
                      form.formState.errors.password ? "border-red-500" : "border-white/20"
                    )}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
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

              {/* Submit Button */}
              <AsyncSubmitButton
                onSubmit={async () => {
                  const data = form.getValues();
                  await handleSubmit(data);
                }}
                submitText="Sign In"
                loadingText="Signing In..."
                disabled={isLoading || !form.formState.isValid}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                touchTarget
                asyncOptions={{
                  debounceMs: 300,
                  successDuration: 1000,
                  errorDuration: 3000
                }}
              />
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => router.push(`/auth/register${returnUrl !== '/dashboard' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`)}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Sign up
                </button>
              </p>
              <p className="text-gray-400 text-sm">
                <button
                  onClick={() => router.push('/auth/forgot-password')}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Forgot your password?
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
export default withAuthErrorBoundary(LoginPage, {
  name: 'LoginPage',
  enableRetry: true,
  maxRetries: 1,
  showErrorDetails: process.env.NODE_ENV === 'development'
});
