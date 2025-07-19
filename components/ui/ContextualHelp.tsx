'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, BookOpen, Play, Code, Lightbulb, ArrowRight, ExternalLink, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

interface HelpItem {
  id: string;
  title: string;
  description: string;
  type: 'tip' | 'guide' | 'tutorial' | 'faq' | 'shortcut';
  content?: string;
  link?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ContextualHelpProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoShow?: boolean;
  showOnFirstVisit?: boolean;
}

// Help content based on current page/context
const HELP_CONTENT: Record<string, HelpItem[]> = {
  '/': [
    {
      id: 'dashboard-overview',
      title: 'Welcome to Your Dashboard',
      description: 'Your learning hub with progress tracking and quick access to courses',
      type: 'guide',
      content: 'The dashboard shows your current progress, recent activities, and recommended next steps. Use the navigation menu to explore different sections.'
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'New to Solidity? Start with our beginner-friendly courses',
      type: 'tip',
      link: '/courses/solidity-fundamentals'
    }
  ],
  
  '/courses': [
    {
      id: 'course-selection',
      title: 'Choosing the Right Course',
      description: 'Filter courses by difficulty level and topic to find what matches your goals',
      type: 'tip',
      content: 'Use the filters on the left to narrow down courses. Green badges indicate beginner-friendly content, while red badges are for advanced learners.'
    },
    {
      id: 'course-progress',
      title: 'Tracking Your Progress',
      description: 'Your progress is automatically saved as you complete lessons',
      type: 'guide',
      content: 'Progress bars show completion percentage. You can resume any course from where you left off.'
    }
  ],
  
  '/playground': [
    {
      id: 'playground-basics',
      title: 'Code Playground Basics',
      description: 'Write, test, and deploy Solidity contracts in a safe environment',
      type: 'tutorial',
      content: 'The playground provides a full Solidity development environment. Your code is automatically saved as you type.'
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'Speed up your coding with these helpful shortcuts',
      type: 'shortcut',
      content: 'Ctrl+S: Save • Ctrl+R: Run • Ctrl+/: Comment • Ctrl+D: Duplicate line • Ctrl+F: Find'
    },
    {
      id: 'deployment-help',
      title: 'Deploying Contracts',
      description: 'Learn how to deploy your contracts to testnets',
      type: 'guide',
      link: '/docs/deployment'
    }
  ],
  
  '/settings': [
    {
      id: 'settings-overview',
      title: 'Customizing Your Experience',
      description: 'Personalize your learning environment and preferences',
      type: 'guide',
      content: 'Use the settings to customize your profile, notification preferences, and learning goals. Changes are saved automatically.'
    },
    {
      id: 'accessibility-features',
      title: 'Accessibility Features',
      description: 'Adjust font size, contrast, and other accessibility options',
      type: 'tip',
      content: 'The accessibility section provides options for visual, motor, and cognitive accessibility needs.'
    }
  ],
  
  '/profile': [
    {
      id: 'profile-completion',
      title: 'Complete Your Profile',
      description: 'A complete profile helps instructors and peers connect with you',
      type: 'tip',
      content: 'Add your bio, skills, and learning goals to get personalized course recommendations.'
    },
    {
      id: 'achievement-system',
      title: 'Earning Achievements',
      description: 'Complete courses and challenges to unlock badges and certificates',
      type: 'guide',
      link: '/achievements'
    }
  ]
};

// FAQ items that appear across all pages
const GLOBAL_FAQ: HelpItem[] = [
  {
    id: 'faq-progress',
    title: 'How is my progress tracked?',
    description: 'Your progress is automatically saved as you complete lessons and exercises',
    type: 'faq',
    content: 'Progress is tracked at the lesson level and aggregated for courses. You can see detailed progress in your dashboard.'
  },
  {
    id: 'faq-certificates',
    title: 'Do I get certificates?',
    description: 'Yes! You receive certificates upon completing courses',
    type: 'faq',
    content: 'Certificates are issued automatically when you complete all lessons in a course with a passing grade.'
  },
  {
    id: 'faq-support',
    title: 'How do I get help?',
    description: 'Multiple support options are available',
    type: 'faq',
    content: 'Use the help button, join our community forum, or contact support directly for assistance.'
  }
];

export function ContextualHelp({
  className,
  position = 'bottom-right',
  autoShow = false,
  showOnFirstVisit = true
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [currentHelp, setCurrentHelp] = useState<HelpItem[]>([]);
  const pathname = usePathname();

  // Load contextual help based on current page
  useEffect(() => {
    const pageHelp = HELP_CONTENT[pathname] || [];
    const combinedHelp = [...pageHelp, ...GLOBAL_FAQ];
    setCurrentHelp(combinedHelp);

    // Auto-show on first visit
    if (showOnFirstVisit) {
      const visitKey = `help-visited-${pathname}`;
      const hasVisited = localStorage.getItem(visitKey);
      
      if (!hasVisited && pageHelp.length > 0) {
        setIsOpen(true);
        localStorage.setItem(visitKey, 'true');
      }
    }

    // Auto-show if requested
    if (autoShow && pageHelp.length > 0) {
      setIsOpen(true);
    }
  }, [pathname, autoShow, showOnFirstVisit]);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getTypeIcon = (type: HelpItem['type']) => {
    switch (type) {
      case 'tip':
        return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      case 'guide':
        return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'tutorial':
        return <Play className="w-4 h-4 text-green-400" />;
      case 'faq':
        return <HelpCircle className="w-4 h-4 text-purple-400" />;
      case 'shortcut':
        return <Code className="w-4 h-4 text-orange-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: HelpItem['type']) => {
    switch (type) {
      case 'tip':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'guide':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'tutorial':
        return 'border-green-500/30 bg-green-500/10';
      case 'faq':
        return 'border-purple-500/30 bg-purple-500/10';
      case 'shortcut':
        return 'border-orange-500/30 bg-orange-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  if (currentHelp.length === 0) {
    return null;
  }

  return (
    <div className={cn('fixed z-50', getPositionClasses(), className)}>
      {/* Help Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            title="Get help for this page"
          >
            <HelpCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Help Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-96 max-w-[90vw] max-h-[80vh] mb-4"
          >
            <GlassContainer intensity="heavy" className="overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Help & Tips</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {currentHelp.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'border rounded-lg overflow-hidden',
                        getTypeColor(item.type)
                      )}
                    >
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(item.type)}
                          <div>
                            <h4 className="text-white font-medium">{item.title}</h4>
                            <p className="text-gray-300 text-sm">{item.description}</p>
                          </div>
                        </div>
                        
                        {item.content && (
                          expandedItems.has(item.id) 
                            ? <ChevronUp className="w-4 h-4 text-gray-400" />
                            : <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedItems.has(item.id) && item.content && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 pt-0 border-t border-white/10">
                              <p className="text-gray-300 text-sm leading-relaxed">
                                {item.content}
                              </p>
                              
                              {item.link && (
                                <a
                                  href={item.link}
                                  className="inline-flex items-center space-x-1 mt-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
                                >
                                  <span>Learn more</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              
                              {item.action && (
                                <button
                                  onClick={item.action.onClick}
                                  className="inline-flex items-center space-x-1 mt-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
                                >
                                  <span>{item.action.label}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Need more help?</span>
                  <div className="flex space-x-3">
                    <a
                      href="/support"
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Contact Support
                    </a>
                    <a
                      href="/community"
                      className="text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Community</span>
                    </a>
                  </div>
                </div>
              </div>
            </GlassContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick Help Tooltip Component
export function QuickHelp({
  content,
  children,
  position = 'top'
}: {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              'absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-xs',
              position === 'top' && 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
              position === 'bottom' && 'top-full left-1/2 transform -translate-x-1/2 mt-2',
              position === 'left' && 'right-full top-1/2 transform -translate-y-1/2 mr-2',
              position === 'right' && 'left-full top-1/2 transform -translate-y-1/2 ml-2'
            )}
          >
            {content}
            <div
              className={cn(
                'absolute w-2 h-2 bg-gray-900 transform rotate-45',
                position === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
                position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
                position === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
                position === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1'
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
