'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle, User, BookOpen, Code, Trophy, Users, Settings, Sparkles, Target, X, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSettings } from '@/lib/hooks/useSettings';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { errorTracker } from '@/lib/monitoring/error-tracking';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  href?: string;
  action?: () => void | Promise<void>;
  canSkip?: boolean;
  isCompleted?: boolean;
  estimatedTime?: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  userRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  steps: OnboardingStep[];
  priority: 'high' | 'medium' | 'low';
}

export function GuidedOnboarding({
  className,
  flowId,
  onComplete,
  onSkip
}: {
  className?: string;
  flowId?: string;
  onComplete?: () => void;
  onSkip?: () => void;
}) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const shouldAnimate = !settings?.accessibility?.reducedMotion;

  const [currentFlow, setCurrentFlow] = useState<OnboardingFlow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const onboardingFlows: OnboardingFlow[] = [
    {
      id: 'student-welcome',
      name: 'Welcome to Solidity Learning',
      description: 'Get started with your learning journey',
      userRole: 'STUDENT',
      priority: 'high',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome!',
          description: 'Let\'s get you started on your Solidity learning journey',
          icon: Sparkles,
          estimatedTime: 1,
          content: (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Welcome to Solidity Learning Platform!</h3>
              <p className="text-gray-300">
                You're about to embark on an exciting journey to master smart contract development. 
                Let's set up your profile and get you started with your first lesson.
              </p>
            </div>
          )
        },
        {
          id: 'profile-setup',
          title: 'Set Up Your Profile',
          description: 'Tell us about your learning goals',
          icon: User,
          estimatedTime: 3,
          href: '/profile/setup',
          content: (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Complete Your Profile</h3>
              <p className="text-gray-300">
                Setting up your profile helps us personalize your learning experience and track your progress.
              </p>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Learning goals and skill level</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Preferred learning pace</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Notification preferences</span>
                </div>
              </div>
            </div>
          )
        },
        {
          id: 'first-lesson',
          title: 'Start Your First Lesson',
          description: 'Begin with Solidity fundamentals',
          icon: BookOpen,
          estimatedTime: 30,
          href: '/learn/solidity-basics',
          content: (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Ready to Learn?</h3>
              <p className="text-gray-300">
                Your first lesson covers the fundamentals of Solidity and smart contracts. 
                It's designed to be beginner-friendly with interactive examples.
              </p>
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">Solidity Basics</div>
                    <div className="text-gray-400 text-sm">Introduction to smart contracts</div>
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          id: 'explore-features',
          title: 'Explore Platform Features',
          description: 'Discover what you can do',
          icon: Target,
          estimatedTime: 5,
          content: (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Explore the Platform</h3>
              <p className="text-gray-300">
                Take a moment to explore the different features available to enhance your learning.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <Code className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium">Code Lab</div>
                  <div className="text-gray-400 text-xs">Practice coding</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium">Collaborate</div>
                  <div className="text-gray-400 text-xs">Join study groups</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium">Achievements</div>
                  <div className="text-gray-400 text-xs">Track progress</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <Settings className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium">Settings</div>
                  <div className="text-gray-400 text-xs">Customize experience</div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'instructor-setup',
      name: 'Instructor Onboarding',
      description: 'Set up your instructor account',
      userRole: 'INSTRUCTOR',
      priority: 'high',
      steps: [
        {
          id: 'instructor-welcome',
          title: 'Welcome, Instructor!',
          description: 'Let\'s set up your teaching environment',
          icon: Sparkles,
          estimatedTime: 1,
          content: (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Welcome, Instructor!</h3>
              <p className="text-gray-300">
                Thank you for joining our platform. Let's set up your instructor profile and 
                get you ready to create amazing learning experiences.
              </p>
            </div>
          )
        },
        {
          id: 'instructor-verification',
          title: 'Verify Your Credentials',
          description: 'Submit your teaching credentials',
          icon: CheckCircle,
          estimatedTime: 10,
          href: '/instructor/verification',
          content: (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Credential Verification</h3>
              <p className="text-gray-300">
                To maintain the quality of our platform, we need to verify your teaching credentials.
              </p>
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-medium">Required Documents</span>
                </div>
                <ul className="mt-2 text-sm text-gray-300 space-y-1">
                  <li>• Teaching certificate or degree</li>
                  <li>• Professional experience documentation</li>
                  <li>• Identity verification</li>
                </ul>
              </div>
            </div>
          )
        }
      ]
    }
  ];

  useEffect(() => {
    // Determine which flow to show
    let targetFlow: OnboardingFlow | null = null;
    
    if (flowId) {
      targetFlow = onboardingFlows.find(flow => flow.id === flowId) || null;
    } else if (user?.role) {
      targetFlow = onboardingFlows.find(flow => flow.userRole === user.role) || null;
    }
    
    if (targetFlow) {
      setCurrentFlow(targetFlow);
      setIsVisible(true);
      
      // Track onboarding start
      errorTracker.addBreadcrumb(
        `Onboarding started: ${targetFlow.id}`,
        'onboarding',
        'info',
        { userRole: user?.role, flowId: targetFlow.id }
      );
    }
  }, [flowId, user?.role]);

  const handleNext = useCallback(async () => {
    if (!currentFlow) return;
    
    const currentStep = currentFlow.steps[currentStepIndex];
    
    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep.id]));
    
    // Execute step action if any
    if (currentStep.action) {
      try {
        await currentStep.action();
      } catch (error) {
        console.error('Onboarding step action failed:', error);
      }
    }
    
    // Navigate to step href if provided
    if (currentStep.href) {
      router.push(currentStep.href);
    }
    
    // Move to next step or complete
    if (currentStepIndex < currentFlow.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentFlow, currentStepIndex, router]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const handleComplete = useCallback(() => {
    if (!currentFlow) return;
    
    // Track onboarding completion
    errorTracker.addBreadcrumb(
      `Onboarding completed: ${currentFlow.id}`,
      'onboarding',
      'info',
      { completedSteps: completedSteps.size, totalSteps: currentFlow.steps.length }
    );
    
    setIsVisible(false);
    onComplete?.();
  }, [currentFlow, completedSteps.size, onComplete]);

  const handleSkip = useCallback(() => {
    if (!currentFlow) return;
    
    // Track onboarding skip
    errorTracker.addBreadcrumb(
      `Onboarding skipped: ${currentFlow.id}`,
      'onboarding',
      'info',
      { currentStep: currentStepIndex, totalSteps: currentFlow.steps.length }
    );
    
    setIsVisible(false);
    onSkip?.();
  }, [currentFlow, currentStepIndex, onSkip]);

  if (!isVisible || !currentFlow) return null;

  const currentStep = currentFlow.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / currentFlow.steps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: shouldAnimate ? 0.3 : 0 }}
          className={cn("relative max-w-2xl w-full", className)}
        >
          <GlassContainer intensity="heavy" className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{currentFlow.name}</h2>
                <p className="text-gray-400 text-sm">{currentFlow.description}</p>
              </div>
              <button
                onClick={handleSkip}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Skip onboarding"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Step {currentStepIndex + 1} of {currentFlow.steps.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: shouldAnimate ? 0.5 : 0 }}
                />
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <currentStep.icon className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{currentStep.title}</h3>
                  <p className="text-gray-400 text-sm">{currentStep.description}</p>
                  {currentStep.estimatedTime && (
                    <p className="text-gray-500 text-xs mt-1">
                      Estimated time: {currentStep.estimatedTime} min
                    </p>
                  )}
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-6">
                {currentStep.content}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-2">
                {currentStep.canSkip && (
                  <button
                    onClick={() => setCurrentStepIndex(prev => prev + 1)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Skip
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <span>
                    {currentStepIndex === currentFlow.steps.length - 1 ? 'Complete' : 'Next'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
