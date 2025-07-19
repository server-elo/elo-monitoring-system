'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  XMarkIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CogIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  canSkip?: boolean;
  roles?: UserRole[];
}

type UserRole = 'student' | 'instructor' | 'admin';

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: OnboardingData) => void;
  userRole?: UserRole;
}

interface OnboardingData {
  role: UserRole;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  learningGoals: string[];
  preferences: {
    notifications: boolean;
    accessibility: boolean;
    reducedMotion: boolean;
  };
  completedSteps: string[];
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  isOpen,
  onClose,
  onComplete,
  userRole,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    role: userRole || 'student',
    experienceLevel: 'beginner',
    learningGoals: [],
    preferences: {
      notifications: true,
      accessibility: false,
      reducedMotion: false,
    },
    completedSteps: [],
  });

  const roles = [
    {
      id: 'student' as UserRole,
      name: 'Student',
      description: 'Learn Solidity programming with interactive lessons and AI assistance',
      icon: AcademicCapIcon,
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    },
    {
      id: 'instructor' as UserRole,
      name: 'Instructor',
      description: 'Teach Solidity, create content, and manage student progress',
      icon: UserGroupIcon,
      color: 'text-green-400 border-green-500/30 bg-green-500/10',
    },
    {
      id: 'admin' as UserRole,
      name: 'Administrator',
      description: 'Manage platform settings, users, and system configuration',
      icon: CogIcon,
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    },
  ];

  const learningGoals = [
    'Learn Solidity basics',
    'Build smart contracts',
    'Understand blockchain concepts',
    'Deploy to testnet',
    'Security best practices',
    'DeFi development',
    'NFT creation',
    'Gas optimization',
  ];

  const getStepsForRole = (role: UserRole): OnboardingStep[] => {
    const commonSteps: OnboardingStep[] = [
      {
        id: 'welcome',
        title: 'Welcome to Solidity Learning Platform',
        description: 'Let\'s get you started with your blockchain development journey',
        content: (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
            >
              <AcademicCapIcon className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to the Future of Blockchain Education
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Our platform combines AI-powered tutoring, interactive coding, and comprehensive accessibility 
              features to provide the best Solidity learning experience.
            </p>
          </div>
        ),
        canSkip: false,
      },
      {
        id: 'role-selection',
        title: 'Choose Your Role',
        description: 'Select your primary role to customize your experience',
        content: (
          <div className="py-8">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">
              What best describes your role?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setOnboardingData(prev => ({ ...prev, role: role.id }))}
                  className={cn(
                    'p-6 rounded-xl border-2 transition-all text-left',
                    onboardingData.role === role.id
                      ? role.color
                      : 'border-white/10 hover:border-white/20 text-gray-300'
                  )}
                >
                  <role.icon className="w-8 h-8 mb-4" />
                  <h4 className="font-semibold text-lg mb-2">{role.name}</h4>
                  <p className="text-sm opacity-80">{role.description}</p>
                </button>
              ))}
            </div>
          </div>
        ),
        canSkip: false,
      },
      {
        id: 'experience-level',
        title: 'Experience Level',
        description: 'Help us personalize your learning path',
        content: (
          <div className="py-8">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">
              What's your experience with Solidity?
            </h3>
            <div className="space-y-4">
              {[
                { id: 'beginner', name: 'Beginner', desc: 'New to Solidity and blockchain development' },
                { id: 'intermediate', name: 'Intermediate', desc: 'Some experience with Solidity or smart contracts' },
                { id: 'advanced', name: 'Advanced', desc: 'Experienced with Solidity and blockchain development' },
              ].map((level) => (
                <button
                  key={level.id}
                  onClick={() => setOnboardingData(prev => ({ 
                    ...prev, 
                    experienceLevel: level.id as any 
                  }))}
                  className={cn(
                    'w-full p-4 rounded-lg border text-left transition-all',
                    onboardingData.experienceLevel === level.id
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-white/10 hover:border-white/20 text-gray-300'
                  )}
                >
                  <h4 className="font-semibold mb-1">{level.name}</h4>
                  <p className="text-sm opacity-80">{level.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ),
        canSkip: false,
      },
      {
        id: 'accessibility-preferences',
        title: 'Accessibility Preferences',
        description: 'Configure accessibility features for your needs',
        content: (
          <div className="py-8">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">
              Accessibility & Preferences
            </h3>
            <div className="space-y-6">
              <div className="glass border border-white/10 rounded-lg p-6">
                <h4 className="font-semibold text-white mb-4">Accessibility Features</h4>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={onboardingData.preferences.accessibility}
                      onChange={(e) => setOnboardingData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, accessibility: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-300">
                      Enable enhanced accessibility features (screen reader optimizations, high contrast)
                    </span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={onboardingData.preferences.reducedMotion}
                      onChange={(e) => setOnboardingData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, reducedMotion: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-300">
                      Reduce motion and animations
                    </span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={onboardingData.preferences.notifications}
                      onChange={(e) => setOnboardingData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, notifications: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-300">
                      Enable notifications for progress updates and achievements
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="glass border border-blue-500/30 bg-blue-500/10 rounded-lg p-4">
                <h5 className="font-semibold text-blue-400 mb-2">♿ Accessibility Information</h5>
                <p className="text-sm text-gray-300">
                  This platform is WCAG 2.1 AA compliant and supports screen readers, keyboard navigation, 
                  and other accessibility tools. You can always adjust these settings later in your profile.
                </p>
              </div>
            </div>
          </div>
        ),
        canSkip: true,
      },
    ];

    // Add role-specific steps
    if (role === 'student') {
      commonSteps.splice(3, 0, {
        id: 'learning-goals',
        title: 'Learning Goals',
        description: 'What would you like to learn?',
        content: (
          <div className="py-8">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">
              What are your learning goals?
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {learningGoals.map((goal) => (
                <button
                  key={goal}
                  onClick={() => {
                    const goals = onboardingData.learningGoals.includes(goal)
                      ? onboardingData.learningGoals.filter(g => g !== goal)
                      : [...onboardingData.learningGoals, goal];
                    setOnboardingData(prev => ({ ...prev, learningGoals: goals }));
                  }}
                  className={cn(
                    'p-3 rounded-lg border text-sm transition-all',
                    onboardingData.learningGoals.includes(goal)
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-white/10 hover:border-white/20 text-gray-300'
                  )}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        ),
        canSkip: true,
        roles: ['student'],
      });
    }

    return commonSteps.filter(step => 
      !step.roles || step.roles.includes(role)
    );
  };

  const steps = getStepsForRole(onboardingData.role);
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentStepData.canSkip) {
      handleNext();
    }
  };

  const handleComplete = () => {
    const completedData = {
      ...onboardingData,
      completedSteps: steps.map(step => step.id),
    };
    onComplete(completedData);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
      handleNext();
    } else if (event.key === 'ArrowLeft') {
      handlePrevious();
    }
  };

  // Announce step changes to screen readers
  useEffect(() => {
    if (isOpen && currentStepData) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Step ${currentStep + 1} of ${steps.length}: ${currentStepData.title}. ${currentStepData.description}`;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [currentStep, isOpen, currentStepData, steps.length]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-4xl max-h-[90vh] glass border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h1 id="onboarding-title" className="text-2xl font-bold text-white">
                {currentStepData.title}
              </h1>
              <p className="text-gray-400 mt-1">{currentStepData.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close onboarding"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-400">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-96">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStepData.content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-3">
              {currentStepData.canSkip && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span>{isLastStep ? 'Complete' : 'Next'}</span>
                {isLastStep ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Tutorial system for specific features
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'type' | 'hover';
  content: string;
}

export const FEATURE_TUTORIALS = {
  codeEditor: [
    {
      id: 'editor-intro',
      title: 'Welcome to the Code Editor',
      description: 'This is your Monaco-powered Solidity editor',
      target: '.monaco-editor',
      position: 'top' as const,
      content: 'This professional code editor provides syntax highlighting, auto-completion, and real-time error detection for Solidity.',
    },
    {
      id: 'editor-save',
      title: 'Saving Your Code',
      description: 'Save your work with Ctrl+S',
      target: '.monaco-editor',
      position: 'bottom' as const,
      action: 'type' as const,
      content: 'Your code is automatically saved to local storage, but you can manually save with Ctrl+S or Cmd+S.',
    },
    {
      id: 'editor-compile',
      title: 'Compile and Test',
      description: 'Click the compile button to check your code',
      target: '[data-testid="compile-button"]',
      position: 'left' as const,
      action: 'click' as const,
      content: 'The compiler will check your Solidity code for errors and provide helpful feedback.',
    },
  ],
  gamification: [
    {
      id: 'xp-system',
      title: 'Experience Points (XP)',
      description: 'Earn XP by completing lessons and challenges',
      target: '[data-testid="xp-display"]',
      position: 'bottom' as const,
      content: 'You earn XP for completing lessons, solving challenges, and helping others. Level up to unlock new features!',
    },
    {
      id: 'achievements',
      title: 'Achievements',
      description: 'Unlock badges for your accomplishments',
      target: '[data-testid="achievements"]',
      position: 'top' as const,
      content: 'Achievements recognize your progress and milestones. Click to see all available achievements.',
    },
  ],
  collaboration: [
    {
      id: 'start-session',
      title: 'Start Collaboration',
      description: 'Share your code with others in real-time',
      target: '[data-testid="collaboration-button"]',
      position: 'bottom' as const,
      action: 'click' as const,
      content: 'Start a collaboration session to code together with classmates or get help from instructors.',
    },
    {
      id: 'chat-system',
      title: 'Chat and Communication',
      description: 'Communicate with your collaborators',
      target: '[data-testid="chat-panel"]',
      position: 'left' as const,
      content: 'Use the chat panel to discuss code, ask questions, and share ideas with your collaborators.',
    },
  ],
  accessibility: [
    {
      id: 'keyboard-nav',
      title: 'Keyboard Navigation',
      description: 'Navigate using only your keyboard',
      target: 'body',
      position: 'top' as const,
      content: 'Use Tab to navigate, Enter to activate, and Escape to close dialogs. Press ? for help anytime.',
    },
    {
      id: 'screen-reader',
      title: 'Screen Reader Support',
      description: 'Full compatibility with assistive technologies',
      target: '[role="main"]',
      position: 'top' as const,
      content: 'All content is properly labeled for screen readers. Live regions announce important changes.',
    },
  ],
};

export default OnboardingFlow;
