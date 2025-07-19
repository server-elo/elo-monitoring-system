'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Shield, BookOpen, Bell, Eye, Database, Save, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSettings } from '@/lib/hooks/useSettings';
import { ProfileSection } from './ProfileSection';
import { SecuritySection } from './SecuritySection';
import { LearningPreferencesSection } from './LearningPreferencesSection';
import { NotificationSection } from './NotificationSection';
import { AccessibilitySection } from './AccessibilitySection';
import { PrivacySection } from './PrivacySection';
;
import { cn } from '@/lib/utils';

export interface SettingsPageProps {
  className?: string;
}

type SettingsTab = 'profile' | 'security' | 'learning' | 'notifications' | 'accessibility' | 'privacy';

const SETTINGS_TABS = [
  {
    id: 'profile' as const,
    label: 'Profile',
    icon: User,
    description: 'Manage your personal information and avatar'
  },
  {
    id: 'security' as const,
    label: 'Security',
    icon: Shield,
    description: 'Password, 2FA, and account security settings'
  },
  {
    id: 'learning' as const,
    label: 'Learning & Editor',
    icon: BookOpen,
    description: 'Learning preferences and code editor settings'
  },
  {
    id: 'notifications' as const,
    label: 'Notifications',
    icon: Bell,
    description: 'Email, push, and in-app notification preferences'
  },
  {
    id: 'accessibility' as const,
    label: 'Accessibility',
    icon: Eye,
    description: 'Accessibility features and accommodations'
  },
  {
    id: 'privacy' as const,
    label: 'Privacy & Data',
    icon: Database,
    description: 'Privacy settings and data management'
  }
];

export function SettingsPage({ className }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const {
    settings,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    validationErrors,
    updateSettings,
    saveAllChanges,
    resetSection,
    refreshSettings,
    changePassword,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
    activeSessions,
    revokeSession,
    refreshSessions,
    auditLog: _auditLog,
    refreshAuditLog,
    requestDataExport,
    requestAccountDeletion
  } = useSettings();

  // Wrapper functions to match expected signatures
  const wrappedRequestDataExport = useCallback(async () => {
    const result = await requestDataExport('all', 'json');
    return {
      success: result !== null,
      downloadUrl: result?.downloadUrl
    };
  }, [requestDataExport]);

  const wrappedRequestAccountDeletion = useCallback(async () => {
    const result = await requestAccountDeletion();
    return {
      success: result !== null
    };
  }, [requestAccountDeletion]);

  // Load sessions and audit log when security tab is active
  useEffect(() => {
    if (activeTab === 'security') {
      refreshSessions();
      refreshAuditLog();
    }
  }, [activeTab, refreshSessions, refreshAuditLog]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            if (hasUnsavedChanges) {
              saveAllChanges();
            }
            break;
          case 'r':
            e.preventDefault();
            refreshSettings();
            break;
        }
      }

      // Tab navigation with arrow keys
      if (e.altKey) {
        const currentIndex = SETTINGS_TABS.findIndex(tab => tab.id === activeTab);

        if (e.key === 'ArrowLeft' && currentIndex > 0) {
          e.preventDefault();
          setActiveTab(SETTINGS_TABS[currentIndex - 1].id);
        } else if (e.key === 'ArrowRight' && currentIndex < SETTINGS_TABS.length - 1) {
          e.preventDefault();
          setActiveTab(SETTINGS_TABS[currentIndex + 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, hasUnsavedChanges, saveAllChanges, refreshSettings]);

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  const currentTab = SETTINGS_TABS.find(tab => tab.id === activeTab);

  return (
    <div className={cn('flex h-screen bg-gray-900', className)}>
      {/* Sidebar */}
      <div className={cn(
        'flex flex-col border-r border-gray-700 bg-gray-800/50 transition-all duration-300',
        isSidebarCollapsed ? 'w-16' : 'w-80'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!isSidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-semibold text-white">Settings</h1>
            </div>
          )}

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const hasErrors = validationErrors[tab.id]?.length > 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left',
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                )}
                title={isSidebarCollapsed ? tab.label : undefined}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {hasErrors && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>

                {!isSidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs text-gray-400 truncate">{tab.description}</div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Changes</span>
              <div className="flex items-center space-x-2">
                {hasUnsavedChanges && (
                  <span className="flex items-center space-x-1 text-xs text-yellow-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>Unsaved</span>
                  </span>
                )}
                {isSaving && (
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={saveAllChanges}
                disabled={!hasUnsavedChanges || isSaving}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save All</span>
              </button>

              <button
                onClick={refreshSettings}
                disabled={isSaving}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Refresh settings"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              <div>Ctrl+S to save • Ctrl+R to refresh</div>
              <div>Alt+← → to navigate tabs</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-white">{currentTab?.label}</h2>
            <p className="text-gray-400 text-sm mt-1">{currentTab?.description}</p>
          </div>

          <div className="flex items-center space-x-3">
            {validationErrors[activeTab]?.length > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-red-600/20 text-red-400 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{validationErrors[activeTab].length} error{validationErrors[activeTab].length !== 1 ? 's' : ''}</span>
              </div>
            )}

            <button
              onClick={() => resetSection(activeTab)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && (
                <ProfileSection
                  profile={settings.profile}
                  onUpdate={(data) => updateSettings('profile', data, true)}
                  validationErrors={validationErrors.profile || []}
                />
              )}

              {activeTab === 'security' && (
                <SecuritySection
                  security={settings.security}
                  activeSessions={activeSessions}
                  onUpdateSecurity={(data) => updateSettings('security', data, true)}
                  onChangePassword={changePassword}
                  onSetupTwoFactor={setupTwoFactor}
                  onEnableTwoFactor={enableTwoFactor}
                  onDisableTwoFactor={disableTwoFactor}
                  onRevokeSession={revokeSession}
                  onRefreshSessions={refreshSessions}
                />
              )}

              {activeTab === 'learning' && (
                <LearningPreferencesSection
                  learning={settings.learning}
                  editor={settings.editor}
                  collaboration={settings.collaboration}
                  onUpdateLearning={(data) => updateSettings('learning', data)}
                  onUpdateEditor={(data) => updateSettings('editor', data)}
                  onUpdateCollaboration={(data) => updateSettings('collaboration', data)}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationSection
                  notifications={settings.notifications}
                  onUpdate={(data) => updateSettings('notifications', data)}
                  validationErrors={validationErrors.notifications || []}
                />
              )}

              {activeTab === 'accessibility' && (
                <AccessibilitySection
                  accessibility={settings.accessibility}
                  onUpdate={(data) => updateSettings('accessibility', data)}
                  validationErrors={validationErrors.accessibility || []}
                />
              )}

              {activeTab === 'privacy' && (
                <PrivacySection
                  privacy={settings.privacy}
                  onUpdate={(data) => updateSettings('privacy', data)}
                  onRequestDataExport={wrappedRequestDataExport}
                  onRequestAccountDeletion={wrappedRequestAccountDeletion}
                  validationErrors={validationErrors.privacy || []}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}




