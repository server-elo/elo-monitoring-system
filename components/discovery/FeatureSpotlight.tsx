'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  XMarkIcon, 
  LightBulbIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Feature {
  id: string;
  title: string;
  description: string;
  category: 'new' | 'updated' | 'tip' | 'accessibility' | 'performance';
  target?: string; // CSS selector for the feature
  action?: {
    label: string;
    onClick: (_) => void;
  };
  dismissible?: boolean;
  priority: 'high' | 'medium' | 'low';
  showAfter?: Date; // Show after this date
  hideAfter?: Date; // Hide after this date
  userRoles?: string[]; // Show only to specific user roles
  conditions?: {
    visitCount?: number; // Show after X visits
    featureUsed?: string; // Show after using another feature
    timeSpent?: number; // Show after X minutes on platform
  };
}

interface FeatureSpotlightProps {
  features: Feature[];
  userRole?: string;
  visitCount?: number;
  timeSpent?: number;
  usedFeatures?: string[];
  onFeatureDismissed?: (_featureId: string) => void;
  onFeatureInteracted?: ( featureId: string, action: string) => void;
}

export const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({
  features,
  userRole = 'student',
  visitCount = 1,
  timeSpent = 0,
  usedFeatures = [],
  onFeatureDismissed,
  onFeatureInteracted,
}) => {
  const [activeFeature, setActiveFeature] = useState<Feature | null>(_null);
  const [dismissedFeatures, setDismissedFeatures] = useState<string[]>([]);
  const [spotlightPosition, setSpotlightPosition] = useState({ x: 0, y: 0 });

  // Filter features based on conditions
  const eligibleFeatures = features.filter(feature => {
    // Check if already dismissed
    if (_dismissedFeatures.includes(feature.id)) return false;

    // Check user role
    if (_feature.userRoles && !feature.userRoles.includes(userRole)) return false;

    // Check date conditions
    const now = new Date();
    if (_feature.showAfter && now < feature.showAfter) return false;
    if (_feature.hideAfter && now > feature.hideAfter) return false;

    // Check usage conditions
    if (_feature.conditions) {
      const { visitCount: requiredVisits, featureUsed, timeSpent: requiredTime } = feature.conditions;
      
      if (requiredVisits && visitCount < requiredVisits) return false;
      if (featureUsed && !usedFeatures.includes(featureUsed)) return false;
      if (requiredTime && timeSpent < requiredTime) return false;
    }

    return true;
  });

  // Sort by priority and show the highest priority feature
  useEffect(() => {
    if (_eligibleFeatures.length === 0) return;

    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const sortedFeatures = eligibleFeatures.sort( (a, b) => 
      priorityOrder[b.priority] - priorityOrder[a.priority]
    );

    const nextFeature = sortedFeatures[0];
    if (nextFeature && nextFeature.id !== activeFeature?.id) {
      setActiveFeature(_nextFeature);
      
      if (_nextFeature.target) {
        calculateSpotlightPosition(_nextFeature.target);
      }
    }
  }, [eligibleFeatures, activeFeature]);

  const calculateSpotlightPosition = (_target: string) => {
    const element = document.querySelector(_target) as HTMLElement;
    if (!element) return;

    const rect = element.getBoundingClientRect(_);
    setSpotlightPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });

    // Scroll element into view
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'center'
    });
  };

  const handleDismiss = (_featureId: string) => {
    setDismissedFeatures( prev => [...prev, featureId]);
    setActiveFeature(_null);
    onFeatureDismissed?.(_featureId);
    
    // Store in localStorage
    const dismissed = JSON.parse(_localStorage.getItem('dismissedFeatures') || '[]');
    localStorage.setItem( 'dismissedFeatures', JSON.stringify([...dismissed, featureId]));
  };

  const handleAction = (_feature: Feature) => {
    if (_feature.action) {
      feature.action.onClick(_);
      onFeatureInteracted?.( feature.id, 'action');
    }
    handleDismiss(_feature.id);
  };

  // Load dismissed features from localStorage
  useEffect(() => {
    const dismissed = JSON.parse(_localStorage.getItem('dismissedFeatures') || '[]');
    setDismissedFeatures(_dismissed);
  }, []);

  const getCategoryIcon = (_category: Feature['category']) => {
    switch (_category) {
      case 'new':
        return <SparklesIcon className="w-5 h-5" />;
      case 'updated':
        return <ArrowRightIcon className="w-5 h-5" />;
      case 'tip':
        return <LightBulbIcon className="w-5 h-5" />;
      case 'accessibility':
        return <span className="text-lg">♿</span>;
      case 'performance':
        return <span className="text-lg">⚡</span>;
      default:
        return <SparklesIcon className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (_category: Feature['category']) => {
    switch (_category) {
      case 'new':
        return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'updated':
        return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'tip':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'accessibility':
        return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'performance':
        return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      default:
        return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  const getCategoryLabel = (_category: Feature['category']) => {
    switch (_category) {
      case 'new':
        return 'New Feature';
      case 'updated':
        return 'Updated';
      case 'tip':
        return 'Pro Tip';
      case 'accessibility':
        return 'Accessibility';
      case 'performance':
        return 'Performance';
      default:
        return 'Feature';
    }
  };

  if (!activeFeature) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 pointer-events-none"
      >
        {/* Spotlight overlay */}
        {activeFeature.target && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50"
            style={{
              background: `radial-gradient( circle 150px at ${spotlightPosition.x}px ${spotlightPosition.y}px, transparent 0%, rgba(0,0,0,0.5) 100%)`,
            }}
          />
        )}

        {/* Feature card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="absolute top-4 right-4 w-80 pointer-events-auto"
        >
          <div className={cn(
            'glass border rounded-xl p-6 shadow-xl',
            getCategoryColor(_activeFeature.category)
          )}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(_activeFeature.category)}
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {getCategoryLabel(_activeFeature.category)}
                </span>
              </div>
              {activeFeature.dismissible !== false && (
                <button
                  onClick={(_) => handleDismiss(_activeFeature.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Dismiss feature spotlight"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Content */}
            <h3 className="font-semibold text-white text-lg mb-2">
              {activeFeature.title}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {activeFeature.description}
            </p>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {activeFeature.action && (
                <button
                  onClick={(_) => handleAction(_activeFeature)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <span>{activeFeature.action.label}</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              )}
              {activeFeature.dismissible !== false && (
                <button
                  onClick={(_) => handleDismiss(_activeFeature.id)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Maybe Later
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Pulse animation for targeted element */}
        {activeFeature.target && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute pointer-events-none"
            style={{
              left: spotlightPosition.x - 75,
              top: spotlightPosition.y - 75,
              width: 150,
              height: 150,
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-full h-full border-2 border-white/50 rounded-full"
            />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Predefined features for the platform
export const PLATFORM_FEATURES: Feature[] = [
  {
    id: 'ai-tutor-intro',
    title: 'Meet Your AI Tutor',
    description: 'Get personalized help and explanations powered by Google Gemini AI. Ask questions about your code or Solidity concepts anytime.',
    category: 'new',
    target: '[data-testid="ai-tutor-button"]',
    action: {
      label: 'Try AI Tutor',
      onClick: (_) => {
        // This would open the AI tutor
        console.log('Opening AI tutor');
      },
    },
    priority: 'high',
    conditions: {
      visitCount: 1,
    },
  },
  {
    id: 'accessibility-features',
    title: 'Accessibility Features Available',
    description: 'This platform supports screen readers, keyboard navigation, and follows WCAG 2.1 AA guidelines. Press Alt+H for accessibility help.',
    category: 'accessibility',
    priority: 'medium',
    userRoles: ['student', 'instructor'],
    conditions: {
      visitCount: 2,
    },
  },
  {
    id: 'performance-optimized',
    title: 'Lightning Fast Performance',
    description: 'This platform is optimized for speed with lazy loading, caching, and service workers for offline functionality.',
    category: 'performance',
    priority: 'low',
    conditions: {
      timeSpent: 300, // 5 minutes
    },
  },
  {
    id: 'collaboration-feature',
    title: 'Real-time Collaboration',
    description: 'Code together with classmates or get help from instructors in real-time collaborative sessions.',
    category: 'new',
    target: '[data-testid="collaboration-button"]',
    action: {
      label: 'Start Collaborating',
      onClick: (_) => {
        console.log('Starting collaboration');
      },
    },
    priority: 'high',
    conditions: {
      featureUsed: 'code-editor',
      visitCount: 3,
    },
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts Available',
    description: 'Navigate faster with keyboard shortcuts. Press Ctrl+Shift+? to see all available shortcuts.',
    category: 'tip',
    priority: 'medium',
    conditions: {
      timeSpent: 600, // 10 minutes
    },
  },
];

export default FeatureSpotlight;
