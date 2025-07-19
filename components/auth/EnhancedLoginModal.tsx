import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Github, Mail, Chrome, Shield, Zap, 
  BookOpen, Users, Award, ArrowRight 
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useAuth } from './EnhancedAuthProvider';
import { signIn } from 'next-auth/react';

interface EnhancedLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

const authProviders = [
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    color: 'bg-gray-800 hover:bg-gray-700',
    description: 'Continue with your GitHub account'
  },
  {
    id: 'google',
    name: 'Google',
    icon: Chrome,
    color: 'bg-red-600 hover:bg-red-700',
    description: 'Sign in with Google'
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    color: 'bg-blue-600 hover:bg-blue-700',
    description: 'Sign in with email address'
  }
];

const features = [
  {
    icon: BookOpen,
    title: 'Interactive Learning',
    description: 'Learn Solidity with hands-on coding exercises'
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Connect with other developers and instructors'
  },
  {
    icon: Award,
    title: 'Achievements',
    description: 'Earn badges and track your progress'
  },
  {
    icon: Zap,
    title: 'AI Assistant',
    description: 'Get help from our intelligent coding assistant'
  }
];

export const EnhancedLoginModal: React.FC<EnhancedLoginModalProps> = ({
  isOpen,
  onClose,
  redirectTo = '/'
}) => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    preferredRoute: redirectTo,
    lastVisitedPages: [] as string[],
    loginHistory: [] as { timestamp: string; method: string }[]
  });

  // Navigation and preference handling
  const saveUserPreferences = (loginMethod: string) => {
    const preferences = {
      ...userPreferences,
      loginHistory: [
        ...userPreferences.loginHistory,
        { timestamp: new Date().toISOString(), method: loginMethod }
      ].slice(-10) // Keep last 10 login attempts
    };

    if (rememberMe) {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      localStorage.setItem('preferredRoute', redirectTo);
      localStorage.setItem('rememberLogin', 'true');
    } else {
      sessionStorage.setItem('currentSession', JSON.stringify(preferences));
    }

    setUserPreferences(preferences);
  };

  const handlePostLoginNavigation = () => {
    // Save current page to history before redirecting
    const currentPath = window.location.pathname;
    const updatedHistory = [currentPath, ...userPreferences.lastVisitedPages].slice(0, 5);

    const updatedPreferences = {
      ...userPreferences,
      lastVisitedPages: updatedHistory
    };

    setUserPreferences(updatedPreferences);

    // Determine redirect destination
    let destination = redirectTo;

    // Check for saved preferred route
    const savedRoute = localStorage.getItem('preferredRoute');
    if (savedRoute && savedRoute !== '/') {
      destination = savedRoute;
    }

    // Check for return URL in query params
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');
    if (returnUrl) {
      destination = decodeURIComponent(returnUrl);
    }

    // Navigate to destination
    setTimeout(() => {
      if (destination && destination !== window.location.pathname) {
        window.location.href = destination;
      }
    }, 500); // Small delay for better UX
  };

  const handleProviderLogin = async (providerId: string) => {
    setIsLoading(providerId);
    try {
      // Use NextAuth signIn directly for OAuth providers
      if (providerId === 'github' || providerId === 'google') {
        await signIn(providerId, { callbackUrl: redirectTo });
      } else {
        await login(providerId);
      }

      // Save preferences and handle navigation
      saveUserPreferences(providerId);
      handlePostLoginNavigation();

      // Close modal after successful login
      onClose();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading('email');
    try {
      // In a real app, this would handle email/password login
      await login('email');

      // Save preferences and handle navigation
      saveUserPreferences('email');
      handlePostLoginNavigation();

      // Close modal after successful login
      onClose();
    } catch (error) {
      console.error('Email login failed:', error);
    } finally {
      setIsLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <div className="grid md:grid-cols-2 min-h-[600px]">
              {/* Left Side - Branding & Features */}
              <div className="p-8 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-r border-white/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-8 h-8 text-purple-400" />
                    <h1 className="text-2xl font-bold text-white">SolidityLearn</h1>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Master Solidity Development
                  </h2>
                  <p className="text-gray-300 text-lg">
                    Join thousands of developers learning smart contract development 
                    with our interactive platform.
                  </p>
                </div>

                <div className="space-y-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{feature.title}</h3>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold text-white">Free to Start</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Begin your journey with our free tier. No credit card required.
                  </p>
                </div>
              </div>

              {/* Right Side - Login Form */}
              <div className="p-8">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Welcome Back</h3>
                  <p className="text-gray-400">
                    Sign in to continue your learning journey
                  </p>

                  {/* Redirect Information */}
                  {redirectTo && redirectTo !== '/' && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-blue-400 font-medium">
                          You'll be redirected to: {redirectTo}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Recent Login History */}
                  {userPreferences.loginHistory.length > 0 && (
                    <div className="mt-3 text-xs text-gray-500">
                      Last login: {new Date(userPreferences.loginHistory[userPreferences.loginHistory.length - 1]?.timestamp).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {!showEmailForm ? (
                  <div className="space-y-4">
                    {authProviders.map((provider) => (
                      <motion.button
                        key={provider.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (provider.id === 'email') {
                            setShowEmailForm(true);
                          } else {
                            handleProviderLogin(provider.id);
                          }
                        }}
                        disabled={isLoading === provider.id}
                        className={`w-full flex items-center justify-center space-x-3 p-4 rounded-lg text-white font-medium transition-all ${provider.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isLoading === provider.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        ) : (
                          <provider.icon className="w-5 h-5" />
                        )}
                        <span>{provider.description}</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    ))}

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/20" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-900 text-gray-400">
                          Secure authentication
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-400">
                        By signing in, you agree to our{' '}
                        <a href="#" className="text-purple-400 hover:underline">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-purple-400 hover:underline">
                          Privacy Policy
                        </a>
                      </p>
                    </div>
                  </div>
                ) : (
                  <motion.form
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onSubmit={handleEmailLogin}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-gray-400">Remember me</span>
                      </label>
                      <a href="#" className="text-sm text-purple-400 hover:underline">
                        Forgot password?
                      </a>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading === 'email'}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isLoading === 'email' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      ) : (
                        'Sign In'
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setShowEmailForm(false)}
                      className="w-full text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      ← Back to other options
                    </button>

                    <div className="text-center">
                      <p className="text-sm text-gray-400">
                        Don't have an account?{' '}
                        <a href="#" className="text-purple-400 hover:underline">
                          Sign up for free
                        </a>
                      </p>
                    </div>
                  </motion.form>
                )}

                {/* Security Notice */}
                <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">
                      Secure & Private
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Your data is encrypted and we never share your information with third parties.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedLoginModal;
