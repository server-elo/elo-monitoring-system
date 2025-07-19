'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  X, 
  Mail, 
  ArrowLeft, 
  CheckCircle,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { AsyncSubmitButton } from '@/components/ui/EnhancedButton';
import { ErrorMessage, InlineFormError } from '@/components/ui/ErrorMessage';
import { AuthErrorBoundary } from '@/components/errors/SpecializedErrorBoundaries';
import { ErrorFactory, AppError } from '@/lib/errors/types';
import { useError } from '@/lib/errors/ErrorContext';
import { useFormErrorHandler } from '@/lib/hooks/useErrorRecovery';

// Validation schemas
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

const resetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  resetToken?: string;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  resetToken
}) => {
  const [step, setStep] = useState<'email' | 'sent' | 'reset' | 'success'>(
    resetToken ? 'reset' : 'email'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [currentError, setCurrentError] = useState<AppError | null>(null);

  // Enhanced error handling
  const { showAuthError } = useError();
  const { handleFieldError, handleSubmissionError } = useFormErrorHandler();
  

  // Form setup
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: 'onChange'
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
    defaultValues: {
      token: resetToken || ''
    }
  });

  // Handle email submission for password reset request
  const handleEmailSubmit = async (data: EmailFormData) => {
    setCurrentError(null);
    setEmail(data.email);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          const authError = ErrorFactory.createAuthError({
            message: 'Email not found',
            authType: 'login',
            userMessage: 'No account found with this email address. Please check your email or create a new account.'
          });
          setCurrentError(authError);
          showAuthError('login', authError.userMessage);
          return;
        }

        if (response.status === 429) {
          const authError = ErrorFactory.createAuthError({
            message: 'Too many requests',
            authType: 'login',
            userMessage: 'Too many password reset requests. Please wait 15 minutes before trying again.'
          });
          setCurrentError(authError);
          showAuthError('login', authError.userMessage);
          return;
        }

        throw new Error(result.error || 'Failed to send reset email');
      }

      setStep('sent');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to send reset email');
      handleSubmissionError(err, data);
    }
  };

  // Handle password reset with token
  const handlePasswordReset = async (data: ResetFormData) => {
    setCurrentError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: data.token,
          password: data.password
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          const authError = ErrorFactory.createAuthError({
            message: 'Invalid or expired token',
            authType: 'login',
            userMessage: 'This password reset link is invalid or has expired. Please request a new one.'
          });
          setCurrentError(authError);
          showAuthError('login', authError.userMessage);
          return;
        }

        if (response.status === 422 && result.details) {
          // Handle validation errors
          result.details.forEach((detail: { path: string[]; message: string }) => {
            handleFieldError(detail.path[0], detail.message);
          });
          return;
        }

        throw new Error(result.error || 'Failed to reset password');
      }

      setStep('success');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to reset password');
      handleSubmissionError(err, data);
    }
  };

  const handleClose = () => {
    setStep(resetToken ? 'reset' : 'email');
    setCurrentError(null);
    emailForm.reset();
    resetForm.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AuthErrorBoundary>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {step !== 'email' && step !== 'success' && (
                    <button
                      onClick={() => setStep('email')}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      aria-label="Go back"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <h2 className="text-xl font-semibold text-white">
                    {step === 'email' && 'Reset Password'}
                    {step === 'sent' && 'Check Your Email'}
                    {step === 'reset' && 'Create New Password'}
                    {step === 'success' && 'Password Reset Complete'}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Enhanced Error Display */}
              {currentError && (
                <div className="mb-4">
                  <ErrorMessage
                    error={currentError}
                    onDismiss={() => setCurrentError(null)}
                    compact
                    showActions={false}
                  />
                </div>
              )}

              {/* Step 1: Email Input */}
              {step === 'email' && (
                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                  <p className="text-gray-300 text-sm mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...emailForm.register('email')}
                        type="email"
                        id="email"
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email"
                        autoComplete="email"
                      />
                    </div>
                    {emailForm.formState.errors.email && (
                      <InlineFormError
                        error={ErrorFactory.createFormError({
                          message: emailForm.formState.errors.email.message || 'Invalid email',
                          field: 'email',
                          validationRule: 'email',
                          expectedFormat: 'user@example.com',
                          userMessage: emailForm.formState.errors.email.message || 'Please enter a valid email address'
                        })}
                        className="mt-1"
                      />
                    )}
                  </div>

                  <AsyncSubmitButton
                    onSubmit={async () => {
                      const data = emailForm.getValues();
                      await handleEmailSubmit(data);
                    }}
                    submitText="Send Reset Link"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    touchTarget
                    asyncOptions={{
                      debounceMs: 500,
                      successDuration: 2000,
                      errorDuration: 4000
                    }}
                  />
                </form>
              )}

              {/* Step 2: Email Sent Confirmation */}
              {step === 'sent' && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Check your email</h3>
                    <p className="text-gray-300 text-sm">
                      We've sent a password reset link to <strong>{email}</strong>
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      Didn't receive the email? Check your spam folder or try again.
                    </p>
                  </div>
                  <button
                    onClick={() => setStep('email')}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    Try a different email
                  </button>
                </div>
              )}

              {/* Step 3: Password Reset Form */}
              {step === 'reset' && (
                <form onSubmit={resetForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                  <p className="text-gray-300 text-sm mb-4">
                    Enter your new password below.
                  </p>

                  {/* New Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...resetForm.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter new password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {resetForm.formState.errors.password && (
                      <InlineFormError
                        error={ErrorFactory.createFormError({
                          message: resetForm.formState.errors.password.message || 'Invalid password',
                          field: 'password',
                          validationRule: 'minLength',
                          expectedFormat: 'At least 8 characters with uppercase, lowercase, number, and special character',
                          userMessage: resetForm.formState.errors.password.message || 'Password must meet security requirements'
                        })}
                        className="mt-1"
                      />
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...resetForm.register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {resetForm.formState.errors.confirmPassword && (
                      <InlineFormError
                        error={ErrorFactory.createFormError({
                          message: resetForm.formState.errors.confirmPassword.message || 'Passwords do not match',
                          field: 'confirmPassword',
                          validationRule: 'match',
                          userMessage: resetForm.formState.errors.confirmPassword.message || 'Please ensure both passwords match'
                        })}
                        className="mt-1"
                      />
                    )}
                  </div>

                  <AsyncSubmitButton
                    onSubmit={async () => {
                      const data = resetForm.getValues();
                      await handlePasswordReset(data);
                    }}
                    submitText="Reset Password"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    touchTarget
                    asyncOptions={{
                      debounceMs: 500,
                      successDuration: 2000,
                      errorDuration: 4000
                    }}
                  />
                </form>
              )}

              {/* Step 4: Success */}
              {step === 'success' && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Password Reset Complete</h3>
                    <p className="text-gray-300 text-sm">
                      Your password has been successfully reset. You can now sign in with your new password.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Continue to Sign In
                  </button>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </AuthErrorBoundary>
  );
};
