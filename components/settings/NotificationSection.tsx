'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Mail, Smartphone, Monitor, Clock, Settings, AlertCircle, Info, Zap, Users, BookOpen, Award, Shield } from 'lucide-react';
import { NotificationSettings, SettingsValidationError } from '@/types/settings';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

export interface NotificationSectionProps {
  notifications: NotificationSettings;
  onUpdate: (data: Partial<NotificationSettings>) => Promise<{ success: boolean; errors?: SettingsValidationError[] }>;
  validationErrors?: SettingsValidationError[];
  className?: string;
}

export function NotificationSection({
  notifications,
  onUpdate,
  // validationErrors = [],
  className
}: NotificationSectionProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'push' | 'inApp'>('email');

  // Handle notification updates
  const handleNotificationUpdate = useCallback(async (
    category: keyof NotificationSettings,
    setting: string,
    value: boolean
  ) => {
    await onUpdate({
      [category]: {
        ...notifications[category],
        [setting]: value
      }
    });
  }, [notifications, onUpdate]);

  // Get validation error for a specific field
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
        <Bell className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600 mb-6">
        {[
          { id: 'email', label: 'Email', icon: Mail },
          { id: 'push', label: 'Push', icon: Smartphone },
          { id: 'inApp', label: 'In-App', icon: Monitor },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 text-sm transition-colors',
                activeTab === tab.id
                  ? 'bg-gray-700 text-white border-b-2 border-yellow-500'
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
          {/* Email Notifications Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium mb-2">Email Notifications</h4>
                    <p className="text-gray-300 text-sm">
                      Control which notifications you receive via email. You can unsubscribe from any category at any time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Course Updates */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <BookOpen className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Course Updates</h4>
                      <p className="text-gray-400 text-sm">New lessons, course announcements, and content updates</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('email', 'courseUpdates', !notifications.email.courseUpdates)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.email.courseUpdates ? 'bg-yellow-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.email.courseUpdates ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Achievement Unlocked */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <Award className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Achievement Unlocked</h4>
                      <p className="text-gray-400 text-sm">Notifications when you earn new achievements and badges</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('email', 'achievementUnlocked', !notifications.email.achievementUnlocked)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.email.achievementUnlocked ? 'bg-yellow-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.email.achievementUnlocked ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Weekly Progress */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Weekly Progress</h4>
                      <p className="text-gray-400 text-sm">Weekly summary of your learning progress and goals</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('email', 'weeklyProgress', !notifications.email.weeklyProgress)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.email.weeklyProgress ? 'bg-yellow-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.email.weeklyProgress ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Collaboration Invites */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Collaboration Invites</h4>
                      <p className="text-gray-400 text-sm">Invitations to collaborate on projects and code</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('email', 'collaborationInvites', !notifications.email.collaborationInvites)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.email.collaborationInvites ? 'bg-yellow-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.email.collaborationInvites ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* System Announcements */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-orange-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">System Announcements</h4>
                      <p className="text-gray-400 text-sm">Important platform updates and maintenance notifications</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('email', 'systemAnnouncements', !notifications.email.systemAnnouncements)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.email.systemAnnouncements ? 'bg-yellow-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.email.systemAnnouncements ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Security Alerts */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Security Alerts</h4>
                      <p className="text-gray-400 text-sm">Important security notifications and login alerts</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('email', 'securityAlerts', !notifications.email.securityAlerts)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.email.securityAlerts ? 'bg-yellow-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.email.securityAlerts ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Marketing Emails */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Marketing Emails</h4>
                      <p className="text-gray-400 text-sm">Promotional content, tips, and product updates</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('email', 'marketingEmails', !notifications.email.marketingEmails)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.email.marketingEmails ? 'bg-yellow-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.email.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Push Notifications Tab */}
          {activeTab === 'push' && (
            <div className="space-y-6">
              <div className="p-4 bg-green-600/10 border border-green-600/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Smartphone className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium mb-2">Push Notifications</h4>
                    <p className="text-gray-300 text-sm">
                      Receive instant notifications on your device. You can control these in your browser settings as well.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Course Reminders */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Course Reminders</h4>
                      <p className="text-gray-400 text-sm">Reminders to continue your learning journey</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('push', 'courseReminders', !notifications.push.courseReminders)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.push.courseReminders ? 'bg-green-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.push.courseReminders ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Achievement Unlocked */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <Award className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Achievement Unlocked</h4>
                      <p className="text-gray-400 text-sm">Instant notifications for new achievements</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('push', 'achievementUnlocked', !notifications.push.achievementUnlocked)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.push.achievementUnlocked ? 'bg-green-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.push.achievementUnlocked ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Collaboration Activity */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Collaboration Activity</h4>
                      <p className="text-gray-400 text-sm">Updates from collaborative projects and sessions</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('push', 'collaborationActivity', !notifications.push.collaborationActivity)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.push.collaborationActivity ? 'bg-green-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.push.collaborationActivity ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* System Alerts */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">System Alerts</h4>
                      <p className="text-gray-400 text-sm">Critical system notifications and alerts</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('push', 'systemAlerts', !notifications.push.systemAlerts)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.push.systemAlerts ? 'bg-green-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.push.systemAlerts ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* In-App Notifications Tab */}
          {activeTab === 'inApp' && (
            <div className="space-y-6">
              <div className="p-4 bg-purple-600/10 border border-purple-600/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Monitor className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium mb-2">In-App Notifications</h4>
                    <p className="text-gray-300 text-sm">
                      Control notifications that appear within the application while you're using it.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Real-time Collaboration */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Real-time Collaboration</h4>
                      <p className="text-gray-400 text-sm">Notifications about collaborator activity and changes</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('inApp', 'realTimeCollaboration', !notifications.inApp.realTimeCollaboration)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.inApp.realTimeCollaboration ? 'bg-purple-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.inApp.realTimeCollaboration ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Code Analysis Results */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Code Analysis Results</h4>
                      <p className="text-gray-400 text-sm">Notifications about code analysis and suggestions</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('inApp', 'codeAnalysisResults', !notifications.inApp.codeAnalysisResults)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.inApp.codeAnalysisResults ? 'bg-purple-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.inApp.codeAnalysisResults ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Debugging Alerts */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Debugging Alerts</h4>
                      <p className="text-gray-400 text-sm">Notifications about debugging sessions and breakpoints</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('inApp', 'debuggingAlerts', !notifications.inApp.debuggingAlerts)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.inApp.debuggingAlerts ? 'bg-purple-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.inApp.debuggingAlerts ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Version Control Updates */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <Settings className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Version Control Updates</h4>
                      <p className="text-gray-400 text-sm">Notifications about commits, merges, and VCS activity</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleNotificationUpdate('inApp', 'versionControlUpdates', !notifications.inApp.versionControlUpdates)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.inApp.versionControlUpdates ? 'bg-purple-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.inApp.versionControlUpdates ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </GlassContainer>
  );
}
