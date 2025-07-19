'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, RotateCcw, Save } from 'lucide-react';
import { GlassContainer } from './Glassmorphism';
import { useNotifications, NotificationPreferences, NotificationType } from './NotificationSystem';
import { cn } from '@/lib/utils';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPreferencesModal({ isOpen, onClose }: NotificationPreferencesModalProps) {
  const { preferences, updatePreferences } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleTypePreferenceChange = (
    type: NotificationType, 
    key: keyof NotificationPreferences['types'][NotificationType], 
    value: any
  ) => {
    setLocalPreferences(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: {
          ...prev.types[type],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updatePreferences(localPreferences);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };

  const notificationTypes: { type: NotificationType; label: string; description: string }[] = [
    { type: 'success', label: 'Success', description: 'Completion and success messages' },
    { type: 'error', label: 'Error', description: 'Error and failure notifications' },
    { type: 'warning', label: 'Warning', description: 'Warning and caution messages' },
    { type: 'info', label: 'Information', description: 'General information updates' },
    { type: 'achievement', label: 'Achievements', description: 'Achievement unlocks and badges' },
    { type: 'collaboration', label: 'Collaboration', description: 'Team and collaboration updates' },
    { type: 'xp', label: 'Experience Points', description: 'XP gains and progress updates' },
    { type: 'level-up', label: 'Level Up', description: 'Level progression notifications' },
    { type: 'system', label: 'System', description: 'System and maintenance messages' },
    { type: 'security', label: 'Security', description: 'Security and authentication alerts' },
  ];

  const positions = [
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'bottom-center', label: 'Bottom Center' },
  ] as const;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          <GlassContainer
            intensity="medium"
            tint="neutral"
            border
            shadow="lg"
            rounded="lg"
            className="p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Settings className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">
                  Notification Preferences
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2"
                aria-label="Close preferences"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Global Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Global Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Enable Notifications */}
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-white">
                        Enable Notifications
                      </label>
                      <p className="text-xs text-gray-400">
                        Turn all notifications on or off
                      </p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('enabled', !localPreferences.enabled)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        localPreferences.enabled ? 'bg-blue-600' : 'bg-gray-600'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          localPreferences.enabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {/* Sound Enabled */}
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-white">
                        Sound Effects
                      </label>
                      <p className="text-xs text-gray-400">
                        Play sounds for notifications
                      </p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('soundEnabled', !localPreferences.soundEnabled)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        localPreferences.soundEnabled ? 'bg-blue-600' : 'bg-gray-600'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          localPreferences.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {/* Vibration Enabled */}
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-white">
                        Vibration
                      </label>
                      <p className="text-xs text-gray-400">
                        Vibrate on mobile devices
                      </p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('vibrationEnabled', !localPreferences.vibrationEnabled)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        localPreferences.vibrationEnabled ? 'bg-blue-600' : 'bg-gray-600'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          localPreferences.vibrationEnabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {/* Group Similar */}
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-white">
                        Group Similar
                      </label>
                      <p className="text-xs text-gray-400">
                        Group similar notifications together
                      </p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('groupSimilar', !localPreferences.groupSimilar)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        localPreferences.groupSimilar ? 'bg-blue-600' : 'bg-gray-600'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          localPreferences.groupSimilar ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Notification Position
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {positions.map((position) => (
                      <button
                        key={position.value}
                        onClick={() => handlePreferenceChange('position', position.value)}
                        className={cn(
                          'p-2 text-sm rounded-lg border transition-colors',
                          localPreferences.position === position.value
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                            : 'bg-white/5 border-gray-600 text-gray-300 hover:bg-white/10'
                        )}
                      >
                        {position.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Visible */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Maximum Visible Notifications: {localPreferences.maxVisible}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={localPreferences.maxVisible}
                    onChange={(e) => handlePreferenceChange('maxVisible', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Notification Types</h3>
                <div className="space-y-3">
                  {notificationTypes.map((notifType) => (
                    <div
                      key={notifType.type}
                      className="p-4 bg-white/5 rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-white">
                            {notifType.label}
                          </h4>
                          <p className="text-xs text-gray-400">
                            {notifType.description}
                          </p>
                        </div>
                        <button
                          onClick={() => 
                            handleTypePreferenceChange(
                              notifType.type, 
                              'enabled', 
                              !localPreferences.types[notifType.type].enabled
                            )
                          }
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            localPreferences.types[notifType.type].enabled ? 'bg-blue-600' : 'bg-gray-600'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                              localPreferences.types[notifType.type].enabled ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </div>
                      
                      {localPreferences.types[notifType.type].enabled && (
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={localPreferences.types[notifType.type].sound}
                              onChange={(e) => 
                                handleTypePreferenceChange(notifType.type, 'sound', e.target.checked)
                              }
                              className="rounded border-gray-600 bg-gray-700 text-blue-600"
                            />
                            <span className="text-gray-300">Sound</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={localPreferences.types[notifType.type].vibration}
                              onChange={(e) => 
                                handleTypePreferenceChange(notifType.type, 'vibration', e.target.checked)
                              }
                              className="rounded border-gray-600 bg-gray-700 text-blue-600"
                            />
                            <span className="text-gray-300">Vibration</span>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <button
                onClick={handleReset}
                disabled={!hasChanges}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                  hasChanges
                    ? 'text-gray-300 hover:text-white hover:bg-white/10'
                    : 'text-gray-500 cursor-not-allowed'
                )}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                    hasChanges
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
