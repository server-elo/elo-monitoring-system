'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;
}

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  context?: string;
}

export const HelpSystem: React.FC<HelpSystemProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  context: _context,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const categories = [
    { id: 'all', name: 'All Topics', icon: '📚' },
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'code-editor', name: 'Code Editor', icon: '💻' },
    { id: 'gamification', name: 'Gamification', icon: '🏆' },
    { id: 'collaboration', name: 'Collaboration', icon: '👥' },
    { id: 'accessibility', name: 'Accessibility', icon: '♿' },
    { id: 'performance', name: 'Performance', icon: '⚡' },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' },
  ];

  const helpArticles: HelpArticle[] = [
    {
      id: 'getting-started-basics',
      title: 'Getting Started with Solidity Learning',
      content: `
# Getting Started with Solidity Learning

Welcome to the Solidity Learning Platform! This guide will help you get started with your blockchain development journey.

## First Steps
1. **Create an Account**: Sign up using Google or GitHub
2. **Complete Your Profile**: Add your experience level and learning goals
3. **Take the Assessment**: Help us personalize your learning path
4. **Start Your First Lesson**: Begin with Solidity basics

## Navigation
- Use **Tab** to navigate between elements
- Press **Enter** or **Space** to activate buttons
- Use **Escape** to close modals and menus
- Press **?** to open this help system

## Learning Features
- **Interactive Code Editor**: Write and test Solidity code
- **AI Tutor**: Get personalized help and explanations
- **Progress Tracking**: Monitor your learning journey
- **Achievements**: Earn badges and XP for completing tasks
      `,
      category: 'getting-started',
      tags: ['basics', 'navigation', 'account'],
      difficulty: 'beginner',
      lastUpdated: '2024-01-15',
    },
    {
      id: 'code-editor-features',
      title: 'Using the Monaco Code Editor',
      content: `
# Monaco Code Editor Features

Our integrated Monaco editor provides a powerful coding experience with Solidity-specific features.

## Key Features
- **Syntax Highlighting**: Solidity-specific syntax coloring
- **Auto-completion**: IntelliSense for Solidity keywords and functions
- **Error Detection**: Real-time compilation and error highlighting
- **Code Formatting**: Automatic code formatting and indentation

## Keyboard Shortcuts
- **Ctrl/Cmd + S**: Save code
- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Y**: Redo
- **Ctrl/Cmd + F**: Find
- **Ctrl/Cmd + H**: Find and replace
- **F1**: Command palette

## Accessibility Features
- **Screen Reader Support**: Full compatibility with NVDA, JAWS, VoiceOver
- **Keyboard Navigation**: Navigate code using arrow keys and shortcuts
- **High Contrast**: Supports high contrast themes
- **Font Scaling**: Adjust font size with Ctrl/Cmd + Plus/Minus
      `,
      category: 'code-editor',
      tags: ['monaco', 'shortcuts', 'accessibility'],
      difficulty: 'beginner',
      lastUpdated: '2024-01-15',
    },
    {
      id: 'accessibility-features',
      title: 'Accessibility Features and Support',
      content: `
# Accessibility Features

Our platform is designed to be accessible to all users, following WCAG 2.1 AA guidelines.

## Screen Reader Support
- **Compatible Readers**: NVDA, JAWS, VoiceOver, Dragon
- **Semantic Markup**: Proper headings, landmarks, and labels
- **Live Regions**: Dynamic content announcements
- **Skip Links**: Quick navigation to main content

## Keyboard Navigation
- **Tab Order**: Logical tab sequence throughout the platform
- **Focus Indicators**: Clear visual focus indicators
- **Keyboard Shortcuts**: Comprehensive shortcut system
- **Modal Management**: Proper focus trapping in dialogs

## Visual Accessibility
- **High Contrast**: Toggle high contrast mode
- **Font Scaling**: Zoom up to 200% without horizontal scrolling
- **Color Independence**: Information not conveyed by color alone
- **Reduced Motion**: Respects prefers-reduced-motion setting

## Getting Help
- Press **Alt + H** to open accessibility help
- Contact support for accessibility assistance
- Report accessibility issues through our feedback system
      `,
      category: 'accessibility',
      tags: ['wcag', 'screen-reader', 'keyboard'],
      difficulty: 'beginner',
      lastUpdated: '2024-01-15',
    },
    {
      id: 'performance-tips',
      title: 'Performance Tips and Optimization',
      content: `
# Performance Tips

Learn how to get the best performance from the platform.

## Browser Optimization
- **Modern Browser**: Use Chrome 90+, Firefox 88+, Safari 14+
- **Hardware Acceleration**: Enable GPU acceleration in browser settings
- **Memory Management**: Close unused tabs to free up memory
- **Cache Management**: Clear browser cache if experiencing issues

## Platform Features
- **Service Worker**: Enables offline functionality and faster loading
- **Lazy Loading**: Components load as needed for better performance
- **Image Optimization**: Images are automatically optimized for your device
- **Code Splitting**: JavaScript bundles are split for faster initial load

## Troubleshooting Performance
- **Slow Loading**: Check network connection and clear cache
- **High Memory Usage**: Restart browser or close other applications
- **Laggy Interactions**: Disable browser extensions temporarily
- **Compilation Errors**: Check code syntax and try refreshing

## Performance Monitoring
- View real-time performance metrics in development mode
- Monitor Core Web Vitals for optimal experience
- Report performance issues through our feedback system
      `,
      category: 'performance',
      tags: ['optimization', 'browser', 'troubleshooting'],
      difficulty: 'intermediate',
      lastUpdated: '2024-01-15',
    },
  ];

  useEffect(() => {
    filterArticles();
  }, [searchQuery, selectedCategory]);

  const filterArticles = () => {
    let filtered = helpArticles;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredArticles(filtered);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (selectedArticle) {
        setSelectedArticle(null);
      } else {
        onClose();
      }
    }
  };

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
        aria-labelledby="help-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-6xl h-[80vh] glass border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <QuestionMarkCircleIcon className="w-8 h-8 text-blue-400" />
              <h1 id="help-title" className="text-2xl font-bold text-white">
                Help & Documentation
              </h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close help system"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-80 border-r border-white/10 p-6 overflow-y-auto">
              {/* Search */}
              <div className="relative mb-6">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Search help articles"
                />
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Categories
                </h3>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                      selectedCategory === category.id
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </button>
                ))}
              </div>

              {/* Articles List */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Articles ({filteredArticles.length})
                </h3>
                <div className="space-y-2">
                  {filteredArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg transition-colors',
                        selectedArticle?.id === article.id
                          ? 'bg-blue-600/20 border border-blue-500/30'
                          : 'hover:bg-white/5'
                      )}
                    >
                      <h4 className="font-medium text-white text-sm mb-1">
                        {article.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span className={cn(
                          'px-2 py-1 rounded',
                          article.difficulty === 'beginner' && 'bg-green-500/20 text-green-400',
                          article.difficulty === 'intermediate' && 'bg-yellow-500/20 text-yellow-400',
                          article.difficulty === 'advanced' && 'bg-red-500/20 text-red-400'
                        )}>
                          {article.difficulty}
                        </span>
                        <span>{article.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {selectedArticle ? (
                <div className="prose prose-invert max-w-none">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {selectedArticle.title}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className={cn(
                        'px-3 py-1 rounded-full',
                        selectedArticle.difficulty === 'beginner' && 'bg-green-500/20 text-green-400',
                        selectedArticle.difficulty === 'intermediate' && 'bg-yellow-500/20 text-yellow-400',
                        selectedArticle.difficulty === 'advanced' && 'bg-red-500/20 text-red-400'
                      )}>
                        {selectedArticle.difficulty}
                      </span>
                      <span>Last updated: {selectedArticle.lastUpdated}</span>
                    </div>
                  </div>
                  <div 
                    className="text-gray-300 leading-relaxed whitespace-pre-line"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedArticle.content.replace(/\n/g, '<br />') 
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <QuestionMarkCircleIcon className="w-24 h-24 text-gray-400 mb-6" />
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Welcome to Help & Documentation
                  </h2>
                  <p className="text-gray-400 max-w-md">
                    Search for help articles or browse categories to find answers to your questions.
                    Select an article from the sidebar to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HelpSystem;
