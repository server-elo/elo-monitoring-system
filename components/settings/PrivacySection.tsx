'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Eye, Download, Trash2, Users, Globe, Lock, AlertTriangle, Info, Clock, Settings, Share } from 'lucide-react';
import { PrivacySettings, SettingsValidationError } from '@/types/settings';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

export interface PrivacySectionProps {
  privacy: PrivacySettings;
  onUpdate: (data: Partial<PrivacySettings>) => Promise<{ success: boolean; errors?: SettingsValidationError[] }>;
  onRequestDataExport: () => Promise<{ success: boolean; downloadUrl?: string }>;
  onRequestAccountDeletion: () => Promise<{ success: boolean }>;
  validationErrors?: SettingsValidationError[];
  className?: string;
}

export function PrivacySection({
  privacy,
  onUpdate,
  onRequestDataExport,
  onRequestAccountDeletion,
  validationErrors = [],
  className
}: PrivacySectionProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'data' | 'sharing'>('profile');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle privacy updates
  const handlePrivacyUpdate = useCallback(async (field: keyof PrivacySettings, value: any) => {
    await onUpdate({ [field]: value });
  }, [onUpdate]);

  // Handle data export
  const handleDataExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await onRequestDataExport();
      if (result.success && result.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = 'my-data-export.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setIsExporting(false);
    }
  }, [onRequestDataExport]);

  // Handle account deletion
  const handleAccountDeletion = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onRequestAccountDeletion();
      setShowDeleteConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  }, [onRequestAccountDeletion]);

  // Get validation error for a specific field
  // Validation errors are displayed inline
  const getFieldError = useCallback((field: string) => {
    return validationErrors.find(error => error.field === field);
  }, [validationErrors]);

  return (
    <GlassContainer
      intensity="medium"
      tint="neutral"
      border
      className={cn('p-6', className)}
    >
      <div className="flex items-center space-x-3 mb-6">
        <Database className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Privacy & Data Management</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600 mb-6">
        {[
          { id: 'profile', label: 'Profile Privacy', icon: Eye },
          { id: 'data', label: 'Data Management', icon: Database },
          { id: 'sharing', label: 'Data Sharing', icon: Share },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 text-sm transition-colors',
                activeTab === tab.id
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500'
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
          {/* Profile Privacy Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium mb-2">Profile Privacy</h4>
                    <p className="text-gray-300 text-sm">
                      Control who can see your profile information and learning progress.
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Visibility */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <span>Profile Visibility</span>
                  </h3>
                  <p className="text-gray-400 text-sm">Choose who can view your profile</p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'public', label: 'Public', desc: 'Anyone can view', icon: Globe },
                    { value: 'friends', label: 'Friends Only', desc: 'Only connections', icon: Users },
                    { value: 'private', label: 'Private', desc: 'Only you', icon: Lock }
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handlePrivacyUpdate('profileVisibility', option.value)}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-colors',
                          privacy.profileVisibility === option.value
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                        )}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <Icon className="w-4 h-4" />
                          <div className="font-medium">{option.label}</div>
                        </div>
                        <div className="text-xs text-gray-400">{option.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Show Progress */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Eye className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Show Learning Progress</h4>
                    <p className="text-gray-400 text-sm">Display your course progress and completion status</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePrivacyUpdate('showProgress', !privacy.showProgress)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    privacy.showProgress ? 'bg-blue-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      privacy.showProgress ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Show Achievements */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Eye className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Show Achievements</h4>
                    <p className="text-gray-400 text-sm">Display your earned badges and achievements</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePrivacyUpdate('showAchievements', !privacy.showAchievements)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    privacy.showAchievements ? 'bg-blue-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      privacy.showAchievements ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Allow Collaboration */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Allow Collaboration Invites</h4>
                    <p className="text-gray-400 text-sm">Let others invite you to collaborate on projects</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePrivacyUpdate('allowCollaboration', !privacy.allowCollaboration)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    privacy.allowCollaboration ? 'bg-blue-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      privacy.allowCollaboration ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Show Online Status */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Show Online Status</h4>
                    <p className="text-gray-400 text-sm">Let others see when you're online and active</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePrivacyUpdate('showOnlineStatus', !privacy.showOnlineStatus)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    privacy.showOnlineStatus ? 'bg-blue-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      privacy.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="p-4 bg-green-600/10 border border-green-600/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium mb-2">Data Management</h4>
                    <p className="text-gray-300 text-sm">
                      Manage your personal data, including export and deletion options.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Export */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3 mb-4">
                  <Download className="w-5 h-5 text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-2">Export Your Data</h4>
                    <p className="text-gray-400 text-sm mb-4">
                      Download a copy of all your data including profile information, progress, and achievements.
                    </p>
                    
                    <button
                      onClick={handleDataExport}
                      disabled={isExporting}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      {isExporting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>{isExporting ? 'Preparing Export...' : 'Export Data'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Retention */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="mb-4">
                  <h3 className="text-white font-medium flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-green-400" />
                    <span>Data Retention</span>
                  </h3>
                  <p className="text-gray-400 text-sm">How long to keep your inactive data</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 30, label: '30 Days' },
                    { value: 90, label: '90 Days' },
                    { value: 365, label: '1 Year' },
                    { value: -1, label: 'Forever' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePrivacyUpdate('dataRetentionDays', option.value)}
                      className={cn(
                        'p-3 rounded-lg border text-center transition-colors',
                        privacy.dataRetentionDays === option.value
                          ? 'bg-green-600/20 border-green-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                      )}
                    >
                      <div className="font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Deletion */}
              <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-2">Delete Account</h4>
                    <p className="text-gray-300 text-sm mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    
                    <button
                      onClick={() => setShowDeleteConfirmation(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Sharing Tab */}
          {activeTab === 'sharing' && (
            <div className="space-y-6">
              <div className="p-4 bg-purple-600/10 border border-purple-600/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium mb-2">Data Sharing</h4>
                    <p className="text-gray-300 text-sm">
                      Control how your data is used for analytics and platform improvement.
                    </p>
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Settings className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Usage Analytics</h4>
                    <p className="text-gray-400 text-sm">Help improve the platform with anonymous usage data</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePrivacyUpdate('allowAnalytics', !privacy.allowAnalytics)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    privacy.allowAnalytics ? 'bg-purple-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      privacy.allowAnalytics ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Personalization */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Personalization</h4>
                    <p className="text-gray-400 text-sm">Use your data to personalize your learning experience</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePrivacyUpdate('allowPersonalization', !privacy.allowPersonalization)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    privacy.allowPersonalization ? 'bg-purple-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      privacy.allowPersonalization ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Marketing Communications */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Share className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Marketing Communications</h4>
                    <p className="text-gray-400 text-sm">Receive personalized course recommendations and offers</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePrivacyUpdate('allowMarketing', !privacy.allowMarketing)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    privacy.allowMarketing ? 'bg-purple-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      privacy.allowMarketing ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Third-party Integrations */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <Globe className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Third-party Integrations</h4>
                    <p className="text-gray-400 text-sm">Allow data sharing with integrated services and tools</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePrivacyUpdate('allowThirdParty', !privacy.allowThirdParty)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    privacy.allowThirdParty ? 'bg-purple-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      privacy.allowThirdParty ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Account Deletion Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowDeleteConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 p-6 rounded-lg border border-gray-600 w-96 max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Delete Account</h3>
                  <p className="text-gray-300 text-sm">
                    Are you sure you want to permanently delete your account? This action cannot be undone and will remove:
                  </p>
                  <ul className="mt-2 text-sm text-gray-400 list-disc list-inside space-y-1">
                    <li>All your profile information</li>
                    <li>Learning progress and achievements</li>
                    <li>Saved projects and code</li>
                    <li>Collaboration history</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleAccountDeletion}
                  disabled={isDeleting}
                  className="flex items-center space-x-2 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassContainer>
  );
}
