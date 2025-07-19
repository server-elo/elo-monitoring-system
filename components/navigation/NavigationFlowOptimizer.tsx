'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Route, AlertTriangle, CheckCircle, ArrowRight, ExternalLink, Target, Users, BookOpen, Code, Trophy, Home, Search, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSettings } from '@/lib/hooks/useSettings';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { errorTracker } from '@/lib/monitoring/error-tracking';

// Navigation flow analyzer
interface NavigationFlow {
  id: string;
  name: string;
  description: string;
  steps: NavigationStep[];
  userRole?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'blocked' | 'completed' | 'error';
}

interface NavigationStep {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isCompleted: boolean;
  isBlocked: boolean;
  requirements?: string[];
  estimatedTime?: number;
}

export function NavigationFlowOptimizer({
  className,
  showOnlyRelevant = true
}: {
  className?: string;
  showOnlyRelevant?: boolean;
}) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const shouldAnimate = !settings?.accessibility?.reduceMotion;

  const [flows, setFlows] = useState<NavigationFlow[]>([]);
  const [currentFlow, setCurrentFlow] = useState<NavigationFlow | null>(null);
  const [deadEnds, setDeadEnds] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{
    type: 'shortcut' | 'alternative' | 'next-step';
    title: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }>>([]);

  useEffect(() => {
    initializeFlows();
    analyzeCurrentPath();
    detectDeadEnds();
    generateSuggestions();
  }, [pathname, user]);

  const initializeFlows = useCallback(() => {
    const allFlows: NavigationFlow[] = [
      {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Complete your onboarding and start learning',
        priority: 'high',
        status: 'active',
        userRole: 'STUDENT',
        steps: [
          {
            id: 'profile-setup',
            title: 'Complete Profile',
            description: 'Set up your learning profile',
            href: '/profile/setup',
            icon: Users,
            isCompleted: !!(user?.profile?.displayName && user?.profile?.bio),
            isBlocked: false,
            estimatedTime: 5
          },
          {
            id: 'first-lesson',
            title: 'Start First Lesson',
            description: 'Begin with Solidity basics',
            href: '/learn/solidity-basics',
            icon: BookOpen,
            isCompleted: false,
            isBlocked: !(user?.profile?.displayName && user?.profile?.bio),
            requirements: ['Complete Profile'],
            estimatedTime: 30
          },
          {
            id: 'code-practice',
            title: 'Try Code Lab',
            description: 'Practice with interactive coding',
            href: '/code',
            icon: Code,
            isCompleted: false,
            isBlocked: false,
            estimatedTime: 15
          }
        ]
      },
      {
        id: 'course-completion',
        name: 'Course Mastery',
        description: 'Complete your current course and earn achievements',
        priority: 'medium',
        status: 'active',
        userRole: 'STUDENT',
        steps: [
          {
            id: 'complete-lessons',
            title: 'Finish All Lessons',
            description: 'Complete remaining lessons in your course',
            href: '/learn',
            icon: BookOpen,
            isCompleted: false,
            isBlocked: false,
            estimatedTime: 120
          },
          {
            id: 'final-project',
            title: 'Final Project',
            description: 'Build a complete smart contract',
            href: '/projects/final',
            icon: Target,
            isCompleted: false,
            isBlocked: true,
            requirements: ['Finish All Lessons'],
            estimatedTime: 180
          },
          {
            id: 'earn-certificate',
            title: 'Earn Certificate',
            description: 'Get your completion certificate',
            href: '/achievements/certificate',
            icon: Trophy,
            isCompleted: false,
            isBlocked: true,
            requirements: ['Final Project'],
            estimatedTime: 5
          }
        ]
      },
      {
        id: 'instructor-setup',
        name: 'Instructor Onboarding',
        description: 'Set up your instructor account and create content',
        priority: 'high',
        status: 'active',
        userRole: 'INSTRUCTOR',
        steps: [
          {
            id: 'instructor-verification',
            title: 'Verify Credentials',
            description: 'Submit your teaching credentials',
            href: '/instructor/verification',
            icon: CheckCircle,
            isCompleted: false,
            isBlocked: false,
            estimatedTime: 15
          },
          {
            id: 'create-first-course',
            title: 'Create First Course',
            description: 'Design your first course curriculum',
            href: '/instructor/courses/new',
            icon: BookOpen,
            isCompleted: false,
            isBlocked: true,
            requirements: ['Verify Credentials'],
            estimatedTime: 120
          }
        ]
      }
    ];

    // Filter flows based on user role if showOnlyRelevant is true
    const relevantFlows = showOnlyRelevant 
      ? allFlows.filter(flow => !flow.userRole || flow.userRole === user?.role)
      : allFlows;

    setFlows(relevantFlows);
  }, [user, showOnlyRelevant]);

  const analyzeCurrentPath = useCallback(() => {
    // Find which flow the current path belongs to
    const currentFlowMatch = flows.find(flow =>
      flow.steps.some(step => step.href === pathname)
    );
    
    setCurrentFlow(currentFlowMatch || null);
    
    // Track navigation analytics
    errorTracker.addBreadcrumb(
      `Navigation flow analysis: ${pathname}`,
      'navigation',
      'info',
      { currentFlow: currentFlowMatch?.id, totalFlows: flows.length }
    );
  }, [pathname, flows]);

  const detectDeadEnds = useCallback(() => {
    // Detect pages that might be dead ends
    const potentialDeadEnds = [
      '/404',
      '/error',
      '/maintenance',
      '/coming-soon'
    ];
    
    const currentDeadEnds = potentialDeadEnds.filter(path => 
      pathname.includes(path) || pathname.endsWith('/complete')
    );
    
    setDeadEnds(currentDeadEnds);
  }, [pathname]);

  const generateSuggestions = useCallback(() => {
    const newSuggestions = [];
    
    // Shortcut suggestions based on current path
    if (pathname.includes('/learn')) {
      newSuggestions.push({
        type: 'shortcut' as const,
        title: 'Quick Practice',
        description: 'Jump to Code Lab for hands-on practice',
        href: '/code',
        icon: Code
      });
    }
    
    if (pathname.includes('/code')) {
      newSuggestions.push({
        type: 'alternative' as const,
        title: 'Get Help',
        description: 'Join a study group for collaboration',
        href: '/collaborate',
        icon: Users
      });
    }
    
    // Next step suggestions based on current flow
    if (currentFlow) {
      const currentStepIndex = currentFlow.steps.findIndex(step => step.href === pathname);
      const nextStep = currentFlow.steps[currentStepIndex + 1];
      
      if (nextStep && !nextStep.isBlocked) {
        newSuggestions.push({
          type: 'next-step' as const,
          title: `Next: ${nextStep.title}`,
          description: nextStep.description,
          href: nextStep.href,
          icon: nextStep.icon
        });
      }
    }
    
    // General helpful suggestions
    if (newSuggestions.length === 0) {
      newSuggestions.push({
        type: 'alternative' as const,
        title: 'Explore Achievements',
        description: 'See what you can unlock',
        href: '/achievements',
        icon: Trophy
      });
    }
    
    setSuggestions(newSuggestions);
  }, [pathname, currentFlow]);

  const handleFlowStepClick = (step: NavigationStep) => {
    if (step.isBlocked) {
      // Show requirements modal or toast
      return;
    }
    
    errorTracker.addBreadcrumb(
      `Navigation flow step clicked: ${step.title}`,
      'navigation',
      'info',
      { stepId: step.id, href: step.href }
    );
    
    router.push(step.href);
  };

  const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
    errorTracker.addBreadcrumb(
      `Navigation suggestion clicked: ${suggestion.title}`,
      'navigation',
      'info',
      { type: suggestion.type, href: suggestion.href }
    );
    
    router.push(suggestion.href);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Current Flow Progress */}
      {currentFlow && (
        <GlassContainer intensity="medium" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Route className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-white font-semibold">{currentFlow.name}</h3>
                <p className="text-gray-400 text-sm">{currentFlow.description}</p>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {currentFlow.steps.filter(s => s.isCompleted).length} / {currentFlow.steps.length} completed
            </div>
          </div>
          
          <div className="space-y-3">
            {currentFlow.steps.map((step, _index) => (
              <motion.button
                key={step.id}
                onClick={() => handleFlowStepClick(step)}
                disabled={step.isBlocked}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left",
                  step.isCompleted ? 'bg-green-500/20 border border-green-500/30' :
                  step.isBlocked ? 'bg-gray-500/20 border border-gray-500/30 cursor-not-allowed opacity-50' :
                  pathname === step.href ? 'bg-blue-500/20 border border-blue-500/30' :
                  'bg-white/5 hover:bg-white/10 border border-white/10'
                )}
                whileHover={shouldAnimate && !step.isBlocked ? { scale: 1.02 } : {}}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    step.isCompleted ? 'bg-green-500/20 text-green-400' :
                    step.isBlocked ? 'bg-gray-500/20 text-gray-400' :
                    'bg-blue-500/20 text-blue-400'
                  )}>
                    {step.isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{step.title}</div>
                    <div className="text-gray-400 text-xs">{step.description}</div>
                    {step.requirements && step.isBlocked && (
                      <div className="text-yellow-400 text-xs mt-1">
                        Requires: {step.requirements.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {step.estimatedTime && (
                    <div className="text-xs text-gray-400">{step.estimatedTime}m</div>
                  )}
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </motion.button>
            ))}
          </div>
        </GlassContainer>
      )}

      {/* Navigation Suggestions */}
      {suggestions.length > 0 && (
        <GlassContainer intensity="medium" className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white font-semibold">Suggested Next Steps</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
                whileHover={shouldAnimate ? { scale: 1.02 } : {}}
                whileTap={shouldAnimate ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    suggestion.type === 'next-step' ? 'bg-green-500/20 text-green-400' :
                    suggestion.type === 'shortcut' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  )}>
                    <suggestion.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{suggestion.title}</div>
                    <div className="text-gray-400 text-xs">{suggestion.description}</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </motion.button>
            ))}
          </div>
        </GlassContainer>
      )}

      {/* Dead End Detection */}
      {deadEnds.length > 0 && (
        <GlassContainer intensity="medium" className="p-6 border border-red-500/30">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-white font-semibold">Navigation Issue Detected</h3>
          </div>
          
          <p className="text-gray-400 text-sm mb-4">
            It looks like you've reached a page with limited navigation options. Here are some ways to continue:
          </p>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <Home className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </button>
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Go Back</span>
            </button>
            <button
              onClick={() => router.push('/search')}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </GlassContainer>
      )}
    </div>
  );
}
