'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Type, Palette, Volume2, MousePointer, Keyboard, Monitor, Settings, Info, AlertCircle, Contrast, Move, Focus } from 'lucide-react';
import { AccessibilitySettings, SettingsValidationError } from '@/types/settings';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

export interface AccessibilitySectionProps {
  accessibility: AccessibilitySettings;
  onUpdate: (data: Partial<AccessibilitySettings>) => Promise<{ success: boolean; errors?: SettingsValidationError[] }>;
  validationErrors?: SettingsValidationError[];
  className?: string;
}

export function AccessibilitySection({
  accessibility,
  onUpdate,
  // validationErrors = [],
  className
}: AccessibilitySectionProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'motor' | 'cognitive'>('visual');

  // Handle accessibility updates
  const handleAccessibilityUpdate = useCallback(async (field: keyof AccessibilitySettings, value: any) => {
    await onUpdate({ [field]: value });
  }, [onUpdate]);

  // Validation errors are displayed inline
  // const getFieldError = useCallback((field: string) => {
  //   return validationErrors.find(error => error.field === field);
  // }, [validationErrors]);

  return (
    <GlassContainer
      intensity="medium"
      tint="neutral"
      border
      className={cn('p-6', className)}
    >
      <div className="flex items-center space-x-3 mb-6">
        <Eye className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-semibold text-white">Accessibility Settings</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600 mb-6">
        {[
          { id: 'visual', label: 'Visual', icon: Eye },
          { id: 'motor', label: 'Motor', icon: MousePointer },
          { id: 'cognitive', label: 'Cognitive', icon: Focus },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 text-sm transition-colors',
                activeTab === tab.id
                  ? 'bg-gray-700 text-white border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {/* Visual Accessibility Tab */}
          {activeTab === 'visual' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium mb-2">Visual Accessibility</h4>
                    <p className="text-gray-300 text-sm">
                      Customize visual elements to improve readability and reduce eye strain.
                    </p>
                  </div>
                </div>
              </div>

              {/* Font Size */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <Type className="w-5 h-5 text-green-400" />
                    <span>Font Size</span>
                  </h3>
                  <p className="text-gray-400 text-sm">Adjust text size for better readability</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={accessibility.fontSize}
                      onChange={(e) => handleAccessibilityUpdate('fontSize', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-white font-medium w-16 text-center">
                      {accessibility.fontSize}px
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Small (12px)</span>
                    <span>Medium (16px)</span>
                    <span>Large (20px)</span>
                    <span>Extra Large (24px)</span>
                  </div>
                </div>
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Contrast className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">High Contrast Mode</h4>
                    <p className="text-gray-400 text-sm">Increase contrast for better visibility</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAccessibilityUpdate('highContrast', !accessibility.highContrast)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    accessibility.highContrast ? 'bg-green-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      accessibility.highContrast ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Color Blind Support */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Palette className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Color Blind Support</h4>
                    <p className="text-gray-400 text-sm">Use patterns and shapes in addition to colors</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAccessibilityUpdate('colorBlindSupport', !accessibility.colorBlindSupport)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    accessibility.colorBlindSupport ? 'bg-green-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      accessibility.colorBlindSupport ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Screen Reader Support */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Volume2 className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Screen Reader Support</h4>
                    <p className="text-gray-400 text-sm">Enhanced support for screen reading software</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAccessibilityUpdate('screenReader', !accessibility.screenReader)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    accessibility.screenReader ? 'bg-green-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      accessibility.screenReader ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Focus Indicators */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Focus className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Enhanced Focus Indicators</h4>
                    <p className="text-gray-400 text-sm">More visible focus outlines for keyboard navigation</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAccessibilityUpdate('focusIndicators', !accessibility.focusIndicators)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    accessibility.focusIndicators ? 'bg-green-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      accessibility.focusIndicators ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Motor Accessibility Tab */}
          {activeTab === 'motor' && (
            <div className="space-y-6">
              <div className="p-4 bg-purple-600/10 border border-purple-600/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium mb-2">Motor Accessibility</h4>
                    <p className="text-gray-300 text-sm">
                      Customize interaction methods to accommodate different motor abilities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Keyboard Navigation */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Keyboard className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Enhanced Keyboard Navigation</h4>
                    <p className="text-gray-400 text-sm">Improved keyboard shortcuts and navigation</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAccessibilityUpdate('keyboardNavigation', !accessibility.keyboardNavigation)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    accessibility.keyboardNavigation ? 'bg-purple-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      accessibility.keyboardNavigation ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Sticky Keys */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Settings className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Sticky Keys Support</h4>
                    <p className="text-gray-400 text-sm">Support for sticky keys and modifier key combinations</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAccessibilityUpdate('stickyKeys', !accessibility.stickyKeys)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    accessibility.stickyKeys ? 'bg-purple-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      accessibility.stickyKeys ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Click Delay */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <MousePointer className="w-5 h-5 text-purple-400" />
                    <span>Click Delay</span>
                  </h3>
                  <p className="text-gray-400 text-sm">Delay before click actions are registered</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="100"
                      value={accessibility.clickDelay}
                      onChange={(e) => handleAccessibilityUpdate('clickDelay', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-white font-medium w-16 text-center">
                      {accessibility.clickDelay}ms
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>None (0ms)</span>
                    <span>Short (300ms)</span>
                    <span>Medium (600ms)</span>
                    <span>Long (1000ms)</span>
                  </div>
                </div>
              </div>

              {/* Large Click Targets */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <MousePointer className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Large Click Targets</h4>
                    <p className="text-gray-400 text-sm">Increase the size of clickable elements</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAccessibilityUpdate('largeClickTargets', !accessibility.largeClickTargets)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    accessibility.largeClickTargets ? 'bg-purple-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      accessibility.largeClickTargets ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Cognitive Accessibility Tab */}
          {activeTab === 'cognitive' && (
            <div className="space-y-6">
              <div className="p-4 bg-orange-600/10 border border-orange-600/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium mb-2">Cognitive Accessibility</h4>
                    <p className="text-gray-300 text-sm">
                      Reduce cognitive load and improve comprehension with simplified interfaces.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reduce Motion */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Move className="w-5 h-5 text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Reduce Motion</h4>
                    <p className="text-gray-400 text-sm">Minimize animations and transitions</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAccessibilityUpdate('reduceMotion', !accessibility.reduceMotion)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    accessibility.reduceMotion ? 'bg-orange-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      accessibility.reduceMotion ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Simple Language */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Type className="w-5 h-5 text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Simple Language Mode</h4>
                    <p className="text-gray-400 text-sm">Use simpler language and shorter sentences</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAccessibilityUpdate('simpleLanguage', !accessibility.simpleLanguage)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    accessibility.simpleLanguage ? 'bg-orange-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      accessibility.simpleLanguage ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Reading Guide */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Eye className="w-5 h-5 text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Reading Guide</h4>
                    <p className="text-gray-400 text-sm">Highlight current line while reading</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAccessibilityUpdate('readingGuide', !accessibility.readingGuide)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    accessibility.readingGuide ? 'bg-orange-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      accessibility.readingGuide ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Auto-pause Media */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Monitor className="w-5 h-5 text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Auto-pause Media</h4>
                    <p className="text-gray-400 text-sm">Automatically pause videos and animations</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAccessibilityUpdate('autoPauseMedia', !accessibility.autoPauseMedia)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    accessibility.autoPauseMedia ? 'bg-orange-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      accessibility.autoPauseMedia ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Session Timeout Warning */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    <span>Session Timeout Warning</span>
                  </h3>
                  <p className="text-gray-400 text-sm">How long before session timeout to show warning</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={accessibility.sessionTimeoutWarning}
                      onChange={(e) => handleAccessibilityUpdate('sessionTimeoutWarning', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-white font-medium w-16 text-center">
                      {accessibility.sessionTimeoutWarning} min
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>1 minute</span>
                    <span>5 minutes</span>
                    <span>10 minutes</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </GlassContainer>
  );
}
