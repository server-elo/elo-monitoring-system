'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Target, Bell, Play, TrendingUp, Settings, Code, Palette, Type, Users, MessageSquare, Zap } from 'lucide-react';
import { 
  LearningPreferences, 
  EditorPreferences, 
  CollaborationPreferences,
  SettingsValidationError 
} from '@/types/settings';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

export interface LearningPreferencesSectionProps {
  learning: LearningPreferences;
  editor: EditorPreferences;
  collaboration: CollaborationPreferences;
  onUpdateLearning: (data: Partial<LearningPreferences>) => Promise<{ success: boolean; errors?: SettingsValidationError[] }>;
  onUpdateEditor: (data: Partial<EditorPreferences>) => Promise<{ success: boolean; errors?: SettingsValidationError[] }>;
  onUpdateCollaboration: (data: Partial<CollaborationPreferences>) => Promise<{ success: boolean; errors?: SettingsValidationError[] }>;
  className?: string;
}

export function LearningPreferencesSection({
  learning,
  editor,
  collaboration,
  onUpdateLearning,
  onUpdateEditor,
  onUpdateCollaboration,
  className
}: LearningPreferencesSectionProps) {
  const [activeTab, setActiveTab] = useState<'learning' | 'editor' | 'collaboration'>('learning');

  // Handle learning preference updates
  const handleLearningUpdate = useCallback(async (field: keyof LearningPreferences, value: any) => {
    if (field === 'studyReminders' || field === 'progressTracking' || field === 'contentPreferences') {
      await onUpdateLearning({ [field]: { ...learning[field], ...value } });
    } else {
      await onUpdateLearning({ [field]: value });
    }
  }, [learning, onUpdateLearning]);

  // Handle editor preference updates
  const handleEditorUpdate = useCallback(async (field: keyof EditorPreferences, value: any) => {
    await onUpdateEditor({ [field]: value });
  }, [onUpdateEditor]);

  // Handle collaboration preference updates
  const handleCollaborationUpdate = useCallback(async (field: keyof CollaborationPreferences, value: any) => {
    await onUpdateCollaboration({ [field]: value });
  }, [onUpdateCollaboration]);

  return (
    <GlassContainer
      intensity="medium"
      tint="neutral"
      border
      className={cn('p-6', className)}
    >
      <div className="flex items-center space-x-3 mb-6">
        <BookOpen className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-semibold text-white">Learning & Editor Preferences</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600 mb-6">
        {[
          { id: 'learning', label: 'Learning', icon: BookOpen },
          { id: 'editor', label: 'Code Editor', icon: Code },
          { id: 'collaboration', label: 'Collaboration', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 text-sm transition-colors',
                activeTab === tab.id
                  ? 'bg-gray-700 text-white border-b-2 border-purple-500'
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
          {/* Learning Preferences Tab */}
          {activeTab === 'learning' && (
            <div className="space-y-6">
              {/* Difficulty Level */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    <span>Difficulty Level</span>
                  </h3>
                  <p className="text-gray-400 text-sm">Choose your current skill level</p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'beginner', label: 'Beginner', desc: 'New to Solidity' },
                    { value: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
                    { value: 'advanced', label: 'Advanced', desc: 'Experienced developer' }
                  ].map((level) => (
                    <button
                      key={level.value}
                      onClick={() => handleLearningUpdate('difficulty', level.value)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-colors',
                        learning.difficulty === level.value
                          ? 'bg-purple-600/20 border-purple-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                      )}
                    >
                      <div className="font-medium">{level.label}</div>
                      <div className="text-xs text-gray-400">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Study Reminders */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-medium flex items-center space-x-2">
                      <Bell className="w-5 h-5 text-purple-400" />
                      <span>Study Reminders</span>
                    </h3>
                    <p className="text-gray-400 text-sm">Get reminded to continue your learning</p>
                  </div>
                  
                  <button
                    onClick={() => handleLearningUpdate('studyReminders', { enabled: !learning.studyReminders.enabled })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      learning.studyReminders.enabled ? 'bg-purple-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        learning.studyReminders.enabled ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {learning.studyReminders.enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Frequency
                        </label>
                        <select
                          value={learning.studyReminders.frequency}
                          onChange={(e) => handleLearningUpdate('studyReminders', { frequency: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Time
                        </label>
                        <input
                          type="time"
                          value={learning.studyReminders.time}
                          onChange={(e) => handleLearningUpdate('studyReminders', { time: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Tracking */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <span>Progress Tracking</span>
                  </h3>
                  <p className="text-gray-400 text-sm">Customize how your progress is tracked and displayed</p>
                </div>
                
                <div className="space-y-4">
                  {/* Show Detailed Stats */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Show Detailed Statistics</h4>
                      <p className="text-gray-400 text-sm">Display comprehensive learning analytics</p>
                    </div>
                    
                    <button
                      onClick={() => handleLearningUpdate('progressTracking', { showDetailedStats: !learning.progressTracking.showDetailedStats })}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        learning.progressTracking.showDetailedStats ? 'bg-purple-600' : 'bg-gray-600'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          learning.progressTracking.showDetailedStats ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {/* Share Progress */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Share Progress</h4>
                      <p className="text-gray-400 text-sm">Allow others to see your learning progress</p>
                    </div>
                    
                    <button
                      onClick={() => handleLearningUpdate('progressTracking', { shareProgress: !learning.progressTracking.shareProgress })}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        learning.progressTracking.shareProgress ? 'bg-purple-600' : 'bg-gray-600'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          learning.progressTracking.shareProgress ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {/* Weekly Goals */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Weekly Learning Goal (hours)
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="1"
                        max="40"
                        value={learning.progressTracking.weeklyGoals}
                        onChange={(e) => handleLearningUpdate('progressTracking', { weeklyGoals: parseInt(e.target.value) })}
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-white font-medium w-12 text-center">
                        {learning.progressTracking.weeklyGoals}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Preferences */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <Play className="w-5 h-5 text-purple-400" />
                    <span>Content Preferences</span>
                  </h3>
                  <p className="text-gray-400 text-sm">Customize your learning experience</p>
                </div>
                
                <div className="space-y-4">
                  {/* Video Speed */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Video Playback Speed
                    </label>
                    <select
                      value={learning.contentPreferences.videoSpeed}
                      onChange={(e) => handleLearningUpdate('contentPreferences', { videoSpeed: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1.0}>1.0x (Normal)</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2.0}>2.0x</option>
                    </select>
                  </div>

                  {/* Autoplay Videos */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Autoplay Videos</h4>
                      <p className="text-gray-400 text-sm">Automatically play next video in sequence</p>
                    </div>
                    
                    <button
                      onClick={() => handleLearningUpdate('contentPreferences', { autoplayVideos: !learning.contentPreferences.autoplayVideos })}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        learning.contentPreferences.autoplayVideos ? 'bg-purple-600' : 'bg-gray-600'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          learning.contentPreferences.autoplayVideos ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {/* Show Hints */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Show Hints</h4>
                      <p className="text-gray-400 text-sm">Display helpful hints during exercises</p>
                    </div>
                    
                    <button
                      onClick={() => handleLearningUpdate('contentPreferences', { showHints: !learning.contentPreferences.showHints })}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        learning.contentPreferences.showHints ? 'bg-purple-600' : 'bg-gray-600'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          learning.contentPreferences.showHints ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {/* Skip Introductions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Skip Introductions</h4>
                      <p className="text-gray-400 text-sm">Skip intro sections for familiar topics</p>
                    </div>
                    
                    <button
                      onClick={() => handleLearningUpdate('contentPreferences', { skipIntroductions: !learning.contentPreferences.skipIntroductions })}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        learning.contentPreferences.skipIntroductions ? 'bg-purple-600' : 'bg-gray-600'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          learning.contentPreferences.skipIntroductions ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Editor Preferences Tab */}
          {activeTab === 'editor' && (
            <div className="space-y-6">
              {/* Theme */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <Palette className="w-5 h-5 text-blue-400" />
                    <span>Theme & Appearance</span>
                  </h3>
                  <p className="text-gray-400 text-sm">Customize the editor's visual appearance</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'dark', label: 'Dark', desc: 'Dark theme' },
                    { value: 'light', label: 'Light', desc: 'Light theme' },
                    { value: 'high-contrast', label: 'High Contrast', desc: 'Accessibility' },
                    { value: 'auto', label: 'Auto', desc: 'System preference' }
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => handleEditorUpdate('theme', theme.value)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-colors',
                        editor.theme === theme.value
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                      )}
                    >
                      <div className="font-medium">{theme.label}</div>
                      <div className="text-xs text-gray-400">{theme.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <Type className="w-5 h-5 text-blue-400" />
                    <span>Typography</span>
                  </h3>
                  <p className="text-gray-400 text-sm">Configure font settings for optimal readability</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Font Size
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="8"
                        max="32"
                        value={editor.fontSize}
                        onChange={(e) => handleEditorUpdate('fontSize', parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-white font-medium w-12 text-center">
                        {editor.fontSize}px
                      </span>
                    </div>
                  </div>

                  {/* Line Height */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Line Height
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="1.0"
                        max="2.0"
                        step="0.1"
                        value={editor.lineHeight}
                        onChange={(e) => handleEditorUpdate('lineHeight', parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-white font-medium w-12 text-center">
                        {editor.lineHeight}
                      </span>
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Font Family
                    </label>
                    <select
                      value={editor.fontFamily}
                      onChange={(e) => handleEditorUpdate('fontFamily', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="JetBrains Mono, Consolas, Monaco, monospace">JetBrains Mono</option>
                      <option value="Fira Code, Consolas, Monaco, monospace">Fira Code</option>
                      <option value="Source Code Pro, Consolas, Monaco, monospace">Source Code Pro</option>
                      <option value="Consolas, Monaco, monospace">Consolas</option>
                      <option value="Monaco, Consolas, monospace">Monaco</option>
                      <option value="Courier New, monospace">Courier New</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Editor Behavior */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-blue-400" />
                    <span>Editor Behavior</span>
                  </h3>
                  <p className="text-gray-400 text-sm">Configure how the editor behaves</p>
                </div>

                <div className="space-y-4">
                  {/* Tab Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tab Size
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={editor.tabSize}
                        onChange={(e) => handleEditorUpdate('tabSize', parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-white font-medium w-12 text-center">
                        {editor.tabSize}
                      </span>
                    </div>
                  </div>

                  {/* Auto Save Interval */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Auto Save Interval (seconds)
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={editor.autoSaveInterval / 1000}
                        onChange={(e) => handleEditorUpdate('autoSaveInterval', parseInt(e.target.value) * 1000)}
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-white font-medium w-12 text-center">
                        {editor.autoSaveInterval / 1000}s
                      </span>
                    </div>
                  </div>

                  {/* Toggle Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'wordWrap', label: 'Word Wrap', desc: 'Wrap long lines' },
                      { key: 'minimap', label: 'Minimap', desc: 'Show code overview' },
                      { key: 'lineNumbers', label: 'Line Numbers', desc: 'Show line numbers' },
                      { key: 'autoSave', label: 'Auto Save', desc: 'Save automatically' },
                      { key: 'formatOnSave', label: 'Format on Save', desc: 'Auto-format when saving' },
                      { key: 'formatOnType', label: 'Format on Type', desc: 'Auto-format while typing' }
                    ].map((option) => (
                      <div key={option.key} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div>
                          <h4 className="text-white font-medium">{option.label}</h4>
                          <p className="text-gray-400 text-xs">{option.desc}</p>
                        </div>

                        <button
                          onClick={() => handleEditorUpdate(option.key as keyof EditorPreferences, !editor[option.key as keyof EditorPreferences])}
                          className={cn(
                            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                            editor[option.key as keyof EditorPreferences] ? 'bg-blue-600' : 'bg-gray-600'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                              editor[option.key as keyof EditorPreferences] ? 'translate-x-5' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collaboration Preferences Tab */}
          {activeTab === 'collaboration' && (
            <div className="space-y-6">
              {/* Real-time Features */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <Users className="w-5 h-5 text-green-400" />
                    <span>Real-time Features</span>
                  </h3>
                  <p className="text-gray-400 text-sm">Configure collaborative editing features</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'showCursors', label: 'Show Other Users\' Cursors', desc: 'Display cursors of other collaborators' },
                    { key: 'showSelections', label: 'Show Selections', desc: 'Highlight text selections from others' },
                    { key: 'showUserNames', label: 'Show User Names', desc: 'Display names next to cursors' },
                    { key: 'sharePresence', label: 'Share Presence', desc: 'Let others see when you\'re active' }
                  ].map((option) => (
                    <div key={option.key} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{option.label}</h4>
                        <p className="text-gray-400 text-sm">{option.desc}</p>
                      </div>

                      <button
                        onClick={() => handleCollaborationUpdate(option.key as keyof CollaborationPreferences, !collaboration[option.key as keyof CollaborationPreferences])}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          collaboration[option.key as keyof CollaborationPreferences] ? 'bg-green-600' : 'bg-gray-600'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                            collaboration[option.key as keyof CollaborationPreferences] ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Communication */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-green-400" />
                    <span>Communication</span>
                  </h3>
                  <p className="text-gray-400 text-sm">Configure communication preferences</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'enableRealTimeChat', label: 'Real-time Chat', desc: 'Enable chat during collaboration' },
                    { key: 'notificationSound', label: 'Notification Sounds', desc: 'Play sounds for collaboration events' },
                    { key: 'allowInvitations', label: 'Allow Invitations', desc: 'Let others invite you to collaborate' },
                    { key: 'autoJoinSessions', label: 'Auto-join Sessions', desc: 'Automatically join when invited' }
                  ].map((option) => (
                    <div key={option.key} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{option.label}</h4>
                        <p className="text-gray-400 text-sm">{option.desc}</p>
                      </div>

                      <button
                        onClick={() => handleCollaborationUpdate(option.key as keyof CollaborationPreferences, !collaboration[option.key as keyof CollaborationPreferences])}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          collaboration[option.key as keyof CollaborationPreferences] ? 'bg-green-600' : 'bg-gray-600'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                            collaboration[option.key as keyof CollaborationPreferences] ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Default Permissions */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-green-400" />
                    <span>Default Permissions</span>
                  </h3>
                  <p className="text-gray-400 text-sm">Set default permissions for new collaborators</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'read', label: 'Read Only', desc: 'View only access' },
                    { value: 'write', label: 'Read & Write', desc: 'Can edit content' },
                    { value: 'admin', label: 'Admin', desc: 'Full control' }
                  ].map((permission) => (
                    <button
                      key={permission.value}
                      onClick={() => handleCollaborationUpdate('defaultPermissions', permission.value)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-colors',
                        collaboration.defaultPermissions === permission.value
                          ? 'bg-green-600/20 border-green-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                      )}
                    >
                      <div className="font-medium">{permission.label}</div>
                      <div className="text-xs text-gray-400">{permission.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </GlassContainer>
  );
}
