'use client'
import { ReactElement, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FaGoogle,
  FaGithub,
  FaEnvelope,
  FaLock,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'
// Form schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character',
      ),
    confirmPassword: z.string(),
  })
  .refine((data: unknown) => (data.password = data.confirmPassword), {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>
interface AuthenticationModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}
export function AuthenticationModal({
  isOpen,
  onClose,
  initialMode = 'login',
}: AuthenticationModalProps): ReactElement {
  const router = useRouter()
  const { toast } = useToast()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })
  // Handle social login
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true)
      const result = await signIn(provider, {
        callbackUrl: '/learn',
        redirect: false,
      })
      if (result?.error) {
        toast({
          title: 'Login Failed',
          description: result.error,
          variant: 'destructive',
        })
      } else if (result?.url) {
        router.push(result.url)
        onClose()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to login with social provider',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  // Handle login
  const handleLogin = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Welcome Back!',
          description: 'Successfully logged in',
        })
        router.push('/learn')
        onClose()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  // Handle registration
  const handleRegister = async (data: RegisterFormData) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }
      // Auto-login after successful registration
      const loginResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (loginResult?.ok) {
        toast({
          title: 'Welcome to Solidity Learn!',
          description: 'Your account has been created successfully',
        })
        router.push('/learn')
        onClose()
      }
    } catch (error: unknown) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className=",
    sm:max-w-[500px] p-0 overflow-hidden bg-gray-900/95 backdrop-blur-xl border-gray-800"
      >
        <div className="relative">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
          <div className="relative p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={mode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"
                  >
                    {(mode = 'login' ? 'Welcome Back' : 'Create Account')}
                  </motion.span>
                </AnimatePresence>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-6 space-y-4">
              {/* Social login buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                  className="relative bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                >
                  <FaGoogle className="mr-2" />
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin('github')}
                  disabled={isLoading}
                  className="relative bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                >
                  <FaGithub className="mr-2" />
                  GitHub
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-900 px-2 text-gray-400">
                    Or continue with email
                  </span>
                </div>
              </div>
              {/* Forms */}
              <AnimatePresence mode="wait">
                {
                  (mode = 'login' ? (
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={loginForm.handleSubmit(handleLogin)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300">
                          Email
                        </Label>
                        <div className="relative">
                          <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <Input
                            {...loginForm.register('email')}
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                            disabled={isLoading}
                          />
                        </div>
                        {loginForm.formState.errors.email && (
                          <p className="text-sm text-red-400">
                            {loginForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-300">
                          Password
                        </Label>
                        <div className="relative">
                          <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <Input
                            {...loginForm.register('password')}
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-400">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="register"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={registerForm.handleSubmit(handleRegister)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-300">
                          Name
                        </Label>
                        <div className="relative">
                          <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <Input
                            {...registerForm.register('name')}
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                            disabled={isLoading}
                          />
                        </div>
                        {registerForm.formState.errors.name && (
                          <p className="text-sm text-red-400">
                            {registerForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="register-email"
                          className="text-gray-300"
                        >
                          Email
                        </Label>
                        <div className="relative">
                          <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <Input
                            {...registerForm.register('email')}
                            id="register-email"
                            type="email"
                            placeholder="you@example.com"
                            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                            disabled={isLoading}
                          />
                        </div>
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-red-400">
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="register-password"
                          className="text-gray-300"
                        >
                          Password
                        </Label>
                        <div className="relative">
                          <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <Input
                            {...registerForm.register('password')}
                            id="register-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        {registerForm.watch('password') && (
                          <PasswordStrengthIndicator
                            password={registerForm.watch('password')}
                          />
                        )}
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-red-400">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-gray-300"
                        >
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <Input
                            {...registerForm.register('confirmPassword')}
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-400">
                            {
                              registerForm.formState.errors.confirmPassword
                                .message
                            }
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                      </Button>
                    </motion.form>
                  ))
                }
              </AnimatePresence>
              {/* Mode switcher */}
              <div className="text-center text-sm">
                <span className="text-gray-400">
                  {
                    (mode = 'login'
                      ? "Don't have an account? "
                      : 'Already have an account? ')
                  }
                </span>
                <button
                  onClick={() => {
                    setMode((mode = 'login' ? 'register' : 'login'))
                    loginForm.reset()
                    registerForm.reset()
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                  disabled={isLoading}
                >
                  {(mode = 'login' ? 'Sign up' : 'Sign in')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
