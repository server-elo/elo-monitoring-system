'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
  context?: string;
}

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');

  const shortcuts: Shortcut[] = [
    // General Navigation
    { keys: ['Tab'], description: 'Navigate to next element', category: 'general' },
    { keys: ['Shift', 'Tab'], description: 'Navigate to previous element', category: 'general' },
    { keys: ['Enter'], description: 'Activate button or link', category: 'general' },
    { keys: ['Space'], description: 'Activate button or checkbox', category: 'general' },
    { keys: ['Escape'], description: 'Close modal or cancel action', category: 'general' },
    { keys: ['?'], description: 'Open help system', category: 'general' },
    { keys: ['Alt', 'H'], description: 'Open accessibility help', category: 'general' },
    
    // Code Editor
    { keys: ['Ctrl', 'S'], description: 'Save code', category: 'editor', context: 'Code Editor' },
    { keys: ['Cmd', 'S'], description: 'Save code (Mac)', category: 'editor', context: 'Code Editor' },
    { keys: ['Ctrl', 'Z'], description: 'Undo', category: 'editor', context: 'Code Editor' },
    { keys: ['Ctrl', 'Y'], description: 'Redo', category: 'editor', context: 'Code Editor' },
    { keys: ['Ctrl', 'F'], description: 'Find in code', category: 'editor', context: 'Code Editor' },
    { keys: ['Ctrl', 'H'], description: 'Find and replace', category: 'editor', context: 'Code Editor' },
    { keys: ['Ctrl', 'D'], description: 'Select next occurrence', category: 'editor', context: 'Code Editor' },
    { keys: ['Ctrl', 'Shift', 'L'], description: 'Select all occurrences', category: 'editor', context: 'Code Editor' },
    { keys: ['F1'], description: 'Command palette', category: 'editor', context: 'Code Editor' },
    { keys: ['Ctrl', 'Space'], description: 'Trigger auto-completion', category: 'editor', context: 'Code Editor' },
    { keys: ['Ctrl', '/'], description: 'Toggle comment', category: 'editor', context: 'Code Editor' },
    { keys: ['Alt', 'Up'], description: 'Move line up', category: 'editor', context: 'Code Editor' },
    { keys: ['Alt', 'Down'], description: 'Move line down', category: 'editor', context: 'Code Editor' },
    
    // AI Features
    { keys: ['Ctrl', 'Shift', 'A'], description: 'Open AI tutor', category: 'ai' },
    { keys: ['Ctrl', 'Shift', 'E'], description: 'Explain selected code', category: 'ai', context: 'Code Editor' },
    { keys: ['Ctrl', 'Shift', 'R'], description: 'Review code', category: 'ai', context: 'Code Editor' },
    
    // Navigation
    { keys: ['G', 'H'], description: 'Go to home', category: 'navigation' },
    { keys: ['G', 'L'], description: 'Go to learn', category: 'navigation' },
    { keys: ['G', 'C'], description: 'Go to code playground', category: 'navigation' },
    { keys: ['G', 'D'], description: 'Go to dashboard', category: 'navigation' },
    { keys: ['G', 'P'], description: 'Go to profile', category: 'navigation' },
    
    // Accessibility
    { keys: ['Alt', 'S'], description: 'Skip to main content', category: 'accessibility' },
    { keys: ['Alt', 'N'], description: 'Skip to navigation', category: 'accessibility' },
    { keys: ['Alt', 'C'], description: 'Toggle high contrast', category: 'accessibility' },
    { keys: ['Alt', 'R'], description: 'Toggle reduced motion', category: 'accessibility' },
    { keys: ['Ctrl', '+'], description: 'Increase font size', category: 'accessibility' },
    { keys: ['Ctrl', '-'], description: 'Decrease font size', category: 'accessibility' },
    
    // Collaboration
    { keys: ['Ctrl', 'Shift', 'C'], description: 'Start collaboration session', category: 'collaboration' },
    { keys: ['Ctrl', 'Shift', 'V'], description: 'Toggle video call', category: 'collaboration' },
    { keys: ['Ctrl', 'Shift', 'M'], description: 'Toggle microphone', category: 'collaboration' },
    
    // Performance
    { keys: ['Ctrl', 'Shift', 'P'], description: 'Open performance monitor', category: 'performance' },
    { keys: ['Ctrl', 'Shift', 'R'], description: 'Hard refresh (clear cache)', category: 'performance' },
  ];

  const categories = [
    { id: 'general', name: 'General', icon: '⌨️' },
    { id: 'editor', name: 'Code Editor', icon: '💻' },
    { id: 'ai', name: 'AI Features', icon: '🤖' },
    { id: 'navigation', name: 'Navigation', icon: '🧭' },
    { id: 'accessibility', name: 'Accessibility', icon: '♿' },
    { id: 'collaboration', name: 'Collaboration', icon: '👥' },
    { id: 'performance', name: 'Performance', icon: '⚡' },
  ];

  const filteredShortcuts = shortcuts.filter(shortcut => {
    const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.keys.some(key => key.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const formatKeys = (keys: string[]) => {
    return keys.map((key, index) => (
      <React.Fragment key={key}>
        <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs font-mono">
          {key}
        </kbd>
        {index < keys.length - 1 && <span className="mx-1 text-gray-400">+</span>}
      </React.Fragment>
    ));
  };

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Global shortcut to open keyboard shortcuts (Ctrl+Shift+?)
      if (event.ctrlKey && event.shiftKey && event.key === '?') {
        event.preventDefault();
        if (!isOpen) {
          // This would be handled by the parent component
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

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
        aria-labelledby="shortcuts-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-4xl h-[80vh] glass border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <CommandLineIcon className="w-8 h-8 text-blue-400" />
              <h1 id="shortcuts-title" className="text-2xl font-bold text-white">
                Keyboard Shortcuts
              </h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close keyboard shortcuts"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 p-6 overflow-y-auto">
              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search shortcuts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 glass border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Search keyboard shortcuts"
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
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">
                  {categories.find(c => c.id === selectedCategory)?.name || 'All'} Shortcuts
                </h2>
                <p className="text-gray-400">
                  {filteredShortcuts.length} shortcuts available
                </p>
              </div>

              <div className="space-y-4">
                {filteredShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 glass border border-white/10 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">
                        {shortcut.description}
                      </p>
                      {shortcut.context && (
                        <p className="text-sm text-gray-400">
                          Context: {shortcut.context}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      {formatKeys(shortcut.keys)}
                    </div>
                  </div>
                ))}
              </div>

              {filteredShortcuts.length === 0 && (
                <div className="text-center py-12">
                  <CommandLineIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No shortcuts found
                  </h3>
                  <p className="text-gray-400">
                    Try adjusting your search or selecting a different category.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 p-4 bg-black/20">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>
                Press <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs">Escape</kbd> to close
              </span>
              <span>
                Press <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs">Ctrl+Shift+?</kbd> to open shortcuts
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default KeyboardShortcuts;
