'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  X, 
  Eye, 
  EyeOff, 
  Github, 
  Chrome, 
  Wallet, 
  Mail, 
  Lock, 
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { AsyncSubmitButton } from '@/components/ui/EnhancedButton';
import { ErrorMessage, InlineFormError } from '@/components/ui/ErrorMessage';
import { AuthErrorBoundary } from '@/components/errors/SpecializedErrorBoundaries';
import { useError } from '@/lib/errors/ErrorContext';
import { useFormErrorHandler } from '@/lib/hooks/useErrorRecovery';
import { ErrorFactory, AuthError } from '@/lib/errors/types';
import { loginSchema, registrationSchema, PasswordUtils } from '@/lib/auth/password';
import type { LoginData, RegistrationData } from '@/lib/auth/password';
;

// Check if we're in development mode without database
const isDevelopmentMode = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentError, setCurrentError] = useState<AuthError | null>(null);

  // Enhanced error handling
  const { showAuthError } = useError();
  const { handleFieldError, handleSubmissionError } = useFormErrorHandler();

  // Login form
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Registration form
  const registerForm = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const currentForm = mode === 'login' ? loginForm : registerForm;

  // Enhanced form submission with comprehensive error handling
  const handleSubmit = async (data: LoginData | RegistrationData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setCurrentError(null);

    try {
      if (mode === 'register') {
        // Register new user
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          // Handle specific registration errors
          if (response.status === 409) {
            const authError = ErrorFactory.createAuthError({
              message: 'User already exists',
              authType: 'register',
              userMessage: 'An account with this email already exists. Would you like to sign in instead?'
            });
            setCurrentError(authError);
            showAuthError('register', authError.userMessage);
            return;
          }

          if (response.status === 400 && result.details) {
            // Handle validation errors
            result.details.forEach((detail: any) => {
              handleFieldError(detail.path[0], detail.message);
            });
            return;
          }

          throw new Error(result.error || 'Registration failed');
        }

        setSuccess('Account created successfully! You can now sign in.');
        setMode('login');
        registerForm.reset();
      } else {
        // Sign in existing user
        const result = await signIn('credentials', {
          email: (data as LoginData).email,
          password: (data as LoginData).password,
          redirect: false,
        });

        if (result?.error) {
          // Handle specific login errors
          const authError = ErrorFactory.createAuthError({
            message: 'Authentication failed',
            authType: 'login',
            userMessage: result.error === 'CredentialsSignin'
              ? 'Invalid email or password. Please check your credentials and try again.'
              : 'Login failed. Please try again or contact support if the problem persists.'
          });
          setCurrentError(authError);
          showAuthError('login', authError.userMessage);
          return;
        }

        if (result?.ok) {
          setSuccess('Signed in successfully!');
          setTimeout(() => {
            onClose();
            window.location.reload(); // Refresh to update auth state
          }, 1000);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unexpected error occurred');
      handleSubmissionError(error, data);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced OAuth sign in with error handling
  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentError(null);

    try {
      const result = await signIn(provider, {
        callbackUrl: '/',
        redirect: false
      });

      if (result?.error) {
        const authError = ErrorFactory.createAuthError({
          message: `${provider} OAuth failed`,
          authType: 'login',
          userMessage: `Failed to sign in with ${provider}. Please try again or use a different method.`
        });
        setCurrentError(authError);
        showAuthError('login', authError.userMessage);
      } else if (result?.ok) {
        setSuccess(`Successfully signed in with ${provider}!`);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`${provider} OAuth sign in failed`);
      const authError = ErrorFactory.createAuthError({
        message: error.message,
        authType: 'login',
        userMessage: `Unable to connect to ${provider}. Please check your internet connection and try again.`
      });
      setCurrentError(authError);
      showAuthError('login', authError.userMessage);
      setError(authError.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator for registration
  const passwordValue = registerForm.watch('password');
  const passwordStrength = passwordValue ? PasswordUtils.checkPasswordStrength(passwordValue) : null;

  if (!isOpen) return null;

  return (
    <AuthErrorBoundary>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <GlassCard className="p-6 relative">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-gray-400">
                {mode === 'login'
                  ? 'Sign in to continue your Solidity journey'
                  : 'Join thousands of developers learning Solidity'
                }
              </p>
              {isDevelopmentMode && (
                <div className="mt-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    🧪 Development Mode: Database authentication disabled.
                    <br />
                    Visit <span className="font-mono">/auth/local-test</span> for full testing.
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced Error/Success Messages */}
            {currentError && (
              <div className="mb-4">
                <ErrorMessage
                  error={currentError}
                  onDismiss={() => {
                    setCurrentError(null);
                    setError(null);
                  }}
                  onRetry={() => {
                    setCurrentError(null);
                    setError(null);
                    // Retry logic handled by AsyncSubmitButton
                  }}
                  compact
                  showActions={'retryable' in currentError ? currentError.retryable : false}
                />
              </div>
            )}

            {error && !currentError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-300 text-sm">{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm">{success}</span>
              </motion.div>
            )}

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleOAuthSignIn('github')}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <Github className="w-5 h-5" />
                <span>Continue with GitHub</span>
              </button>
              
              <button
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 rounded-lg transition-colors disabled:opacity-50"
              >
                <Chrome className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">Or continue with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={currentForm.handleSubmit(handleSubmit)} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                    <input
                      {...registerForm.register('name')}
                      type="text"
                      id="register-name"
                      autoComplete="name"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      aria-describedby={registerForm.formState.errors.name ? 'name-error' : undefined}
                      aria-invalid={!!registerForm.formState.errors.name}
                    />
                  </div>
                  {registerForm.formState.errors.name && (
                    <InlineFormError
                      error={ErrorFactory.createFormError({
                        message: registerForm.formState.errors.name.message || 'Name is required',
                        field: 'name',
                        validationRule: 'required',
                        userMessage: registerForm.formState.errors.name.message || 'Please enter your full name'
                      })}
                      className="mt-1"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                  <input
                    {...(mode === 'login' ? loginForm.register('email') : registerForm.register('email'))}
                    type="email"
                    id={`${mode}-email`}
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    aria-describedby={currentForm.formState.errors.email ? 'email-error' : undefined}
                    aria-invalid={!!currentForm.formState.errors.email}
                  />
                </div>
                {currentForm.formState.errors.email && (
                  <InlineFormError
                    error={ErrorFactory.createFormError({
                      message: currentForm.formState.errors.email.message || 'Invalid email',
                      field: 'email',
                      validationRule: 'email',
                      expectedFormat: 'user@example.com',
                      userMessage: currentForm.formState.errors.email.message || 'Please enter a valid email address'
                    })}
                    className="mt-1"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...(mode === 'login' ? loginForm.register('password') : registerForm.register('password'))}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {currentForm.formState.errors.password && (
                  <InlineFormError
                    error={ErrorFactory.createFormError({
                      message: currentForm.formState.errors.password.message || 'Invalid password',
                      field: 'password',
                      validationRule: 'minLength',
                      expectedFormat: 'At least 8 characters with uppercase, lowercase, number, and special character',
                      userMessage: currentForm.formState.errors.password.message || 'Password must meet security requirements'
                    })}
                    className="mt-1"
                  />
                )}
              </div>

              {mode === 'register' && (
                <>
                  {/* Password Strength Indicator */}
                  {passwordStrength && passwordValue && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.score <= 2 ? 'bg-red-500' :
                              passwordStrength.score <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs ${
                          passwordStrength.score <= 2 ? 'text-red-400' :
                          passwordStrength.score <= 4 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {passwordStrength.score <= 2 ? 'Weak' :
                           passwordStrength.score <= 4 ? 'Medium' : 'Strong'}
                        </span>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <ul className="text-xs text-gray-400 space-y-1">
                          {passwordStrength.feedback.map((feedback, index) => (
                            <li key={index}>• {feedback}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...registerForm.register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <InlineFormError
                        error={ErrorFactory.createFormError({
                          message: registerForm.formState.errors.confirmPassword.message || 'Passwords do not match',
                          field: 'confirmPassword',
                          validationRule: 'match',
                          userMessage: registerForm.formState.errors.confirmPassword.message || 'Please ensure both passwords match'
                        })}
                        className="mt-1"
                      />
                    )}
                  </div>
                </>
              )}

              {/* Submit Button */}
              <AsyncSubmitButton
                onSubmit={async () => {
                  const data = currentForm.getValues();
                  await handleSubmit(data);
                }}
                submitText={mode === 'login' ? 'Sign In' : 'Create Account'}
                className="w-full"
                touchTarget
                tooltip={mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
                asyncOptions={{
                  debounceMs: 500,
                  successDuration: 2000,
                  errorDuration: 4000,
                  onSuccess: () => {
                    if (mode === 'login') {
                      setTimeout(() => {
                        onClose();
                        window.location.reload();
                      }, 1000);
                    }
                  },
                  onError: (error: Error) => {
                    setError(error.message);
                  }
                }}
              />
            </form>

            {/* Mode Toggle */}
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                {' '}
                <button
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError(null);
                    setSuccess(null);
                    currentForm.reset();
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

            {/* MetaMask Option */}
            <div className="mt-4">
              <button
                onClick={() => handleOAuthSignIn('metamask')}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-orange-600 hover:bg-orange-700 border border-orange-500 rounded-lg transition-colors disabled:opacity-50"
              >
                <Wallet className="w-5 h-5" />
                <span>Connect with MetaMask</span>
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
    </AuthErrorBoundary>
  );
};
