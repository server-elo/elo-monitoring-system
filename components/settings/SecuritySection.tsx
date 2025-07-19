'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Smartphone, Eye, EyeOff, Check, X, Clock, Monitor, MapPin, Trash2, RefreshCw, Globe } from 'lucide-react';
import { SecuritySettings, ActiveSession, TwoFactorSetup, PasswordRequirements } from '@/types/settings';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

export interface SecuritySectionProps {
  security: SecuritySettings;
  activeSessions: ActiveSession[];
  onUpdateSecurity: (data: Partial<SecuritySettings>) => Promise<{ success: boolean; errors?: any[] }>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; errors?: any[] }>;
  onSetupTwoFactor: () => Promise<TwoFactorSetup | null>;
  onEnableTwoFactor: (code: string) => Promise<boolean>;
  onDisableTwoFactor: (code: string) => Promise<boolean>;
  onRevokeSession: (sessionId: string) => Promise<boolean>;
  onRefreshSessions: () => Promise<void>;
  className?: string;
}

const PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventPersonalInfo: true
};

export function SecuritySection({
  security,
  activeSessions,
  onUpdateSecurity,
  onChangePassword,
  onSetupTwoFactor,
  onEnableTwoFactor,
  onDisableTwoFactor,
  onRevokeSession,
  onRefreshSessions,
  className
}: SecuritySectionProps) {
  const [activeTab, setActiveTab] = useState<'password' | 'twoFactor' | 'sessions' | 'settings'>('password');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [_showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [_twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculation
  const calculatePasswordStrength = useCallback((password: string) => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= PASSWORD_REQUIREMENTS.minLength) {
      score += 20;
    } else {
      feedback.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters`);
    }

    if (/[A-Z]/.test(password)) {
      score += 20;
    } else {
      feedback.push('One uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      score += 20;
    } else {
      feedback.push('One lowercase letter');
    }

    if (/\d/.test(password)) {
      score += 20;
    } else {
      feedback.push('One number');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 20;
    } else {
      feedback.push('One special character');
    }

    return { score, feedback };
  }, []);

  const passwordStrength = calculatePasswordStrength(passwordForm.newPassword);

  // Handle password change
  const handlePasswordChange = useCallback(async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return;
    }

    if (passwordStrength.score < 100) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await onChangePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (result.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [passwordForm, passwordStrength.score, onChangePassword]);

  // Handle 2FA setup
  const handleSetupTwoFactor = useCallback(async () => {
    setIsLoading(true);
    try {
      const setup = await onSetupTwoFactor();
      if (setup) {
        setTwoFactorSetup(setup);
        setShowTwoFactorSetup(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onSetupTwoFactor]);

  // 2FA handling moved to modal components
  // const _handleEnableTwoFactor = useCallback(async () => {
  //   if (!twoFactorCode.trim()) return;
  //
  //   setIsLoading(true);
  //   try {
  //     const success = await onEnableTwoFactor(twoFactorCode);
  //     if (success) {
  //       setShowTwoFactorSetup(false);
  //       setTwoFactorSetup(null);
  //       setTwoFactorCode('');
  //     }
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [twoFactorCode, onEnableTwoFactor]);
  //
  // // Handle 2FA disable
  // const _handleDisableTwoFactor = useCallback(async () => {
  //   if (!twoFactorCode.trim()) return;
  //
  //   setIsLoading(true);
  //   try {
  //     const success = await onDisableTwoFactor(twoFactorCode);
  //     if (success) {
  //       setTwoFactorCode('');
  //     }
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [twoFactorCode, onDisableTwoFactor]);
  //
  // // Copy to clipboard
  // const _copyToClipboard = useCallback(async (text: string) => {
  //   try {
  //     await navigator.clipboard.writeText(text);
  //   } catch (error) {
  //     console.error('Failed to copy to clipboard:', error);
  //   }
  // }, []);

  return (
    <GlassContainer
      intensity="medium"
      tint="neutral"
      border
      className={cn('p-6', className)}
    >
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-semibold text-white">Account Security</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600 mb-6">
        {[
          { id: 'password', label: 'Password', icon: Key },
          { id: 'twoFactor', label: 'Two-Factor Auth', icon: Smartphone },
          { id: 'sessions', label: 'Active Sessions', icon: Monitor },
          { id: 'settings', label: 'Security Settings', icon: Shield },
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
          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">Password</h3>
                  <p className="text-gray-400 text-sm">
                    Last changed: {new Date(security.passwordLastChanged).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Key className="w-4 h-4" />
                  <span>Change Password</span>
                </button>
              </div>

              <AnimatePresence>
                {showPasswordForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600"
                  >
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password Strength */}
                      {passwordForm.newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex-1 bg-gray-600 rounded-full h-2">
                              <div
                                className={cn(
                                  'h-2 rounded-full transition-all duration-300',
                                  passwordStrength.score < 40 ? 'bg-red-500' :
                                  passwordStrength.score < 80 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                )}
                                style={{ width: `${passwordStrength.score}%` }}
                              />
                            </div>
                            <span className={cn(
                              'text-xs font-medium',
                              passwordStrength.score < 40 ? 'text-red-400' :
                              passwordStrength.score < 80 ? 'text-yellow-400' :
                              'text-green-400'
                            )}>
                              {passwordStrength.score < 40 ? 'Weak' :
                               passwordStrength.score < 80 ? 'Medium' :
                               'Strong'}
                            </span>
                          </div>

                          {passwordStrength.feedback.length > 0 && (
                            <div className="text-xs text-gray-400">
                              Missing: {passwordStrength.feedback.join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className={cn(
                            'w-full px-3 py-2 pr-10 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2',
                            passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-600 focus:ring-blue-500'
                          )}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                        <p className="mt-1 text-sm text-red-400">Passwords do not match</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handlePasswordChange}
                        disabled={
                          !passwordForm.currentPassword ||
                          !passwordForm.newPassword ||
                          !passwordForm.confirmPassword ||
                          passwordForm.newPassword !== passwordForm.confirmPassword ||
                          passwordStrength.score < 100 ||
                          isLoading
                        }
                        className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Key className="w-4 h-4" />
                        )}
                        <span>{isLoading ? 'Changing...' : 'Change Password'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Two-Factor Authentication Tab */}
          {activeTab === 'twoFactor' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
                  <p className="text-gray-400 text-sm">
                    Add an extra layer of security to your account
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {security.twoFactorEnabled ? (
                    <span className="flex items-center space-x-2 px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                      <Check className="w-4 h-4" />
                      <span>Enabled</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2 px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm">
                      <X className="w-4 h-4" />
                      <span>Disabled</span>
                    </span>
                  )}
                </div>
              </div>

              {!security.twoFactorEnabled ? (
                <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Smartphone className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-2">Enable Two-Factor Authentication</h4>
                      <p className="text-gray-300 text-sm mb-4">
                        Protect your account with an additional security layer. You'll need an authenticator app like Google Authenticator or Authy.
                      </p>

                      <button
                        onClick={handleSetupTwoFactor}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                        <span>{isLoading ? 'Setting up...' : 'Setup 2FA'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-600/10 border border-green-600/30 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-2">Two-Factor Authentication Enabled</h4>
                        <p className="text-gray-300 text-sm mb-4">
                          Your account is protected with two-factor authentication. You have {security.backupCodes.length} backup codes remaining.
                        </p>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => setShowTwoFactorSetup(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>View Backup Codes</span>
                          </button>

                          <button
                            onClick={() => setShowTwoFactorSetup(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Disable 2FA</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">Active Sessions</h3>
                  <p className="text-gray-400 text-sm">
                    Manage devices that are currently signed in to your account
                  </p>
                </div>

                <button
                  onClick={onRefreshSessions}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      'p-4 rounded-lg border',
                      session.isCurrentSession
                        ? 'bg-green-600/10 border-green-600/30'
                        : 'bg-gray-800/50 border-gray-600'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          session.isCurrentSession ? 'bg-green-600/20' : 'bg-gray-700'
                        )}>
                          <Monitor className="w-5 h-5 text-white" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-white font-medium">
                              {session.deviceInfo.browser} on {session.deviceInfo.os}
                            </h4>
                            {session.isCurrentSession && (
                              <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                                Current
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{session.location.city}, {session.location.country}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Last active: {new Date(session.lastActivity).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Globe className="w-3 h-3" />
                              <span>IP: {session.location.ip}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {!session.isCurrentSession && (
                        <button
                          onClick={() => onRevokeSession(session.id)}
                          className="flex items-center space-x-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {activeSessions.length === 0 && (
                  <div className="text-center py-8">
                    <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No active sessions found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Security Settings</h3>

              <div className="space-y-4">
                {/* Login Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div>
                    <h4 className="text-white font-medium">Login Notifications</h4>
                    <p className="text-gray-400 text-sm">Get notified when someone signs in to your account</p>
                  </div>

                  <button
                    onClick={() => onUpdateSecurity({ loginNotifications: !security.loginNotifications })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      security.loginNotifications ? 'bg-green-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        security.loginNotifications ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Suspicious Activity Alerts */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div>
                    <h4 className="text-white font-medium">Suspicious Activity Alerts</h4>
                    <p className="text-gray-400 text-sm">Get alerted about unusual account activity</p>
                  </div>

                  <button
                    onClick={() => onUpdateSecurity({ suspiciousActivityAlerts: !security.suspiciousActivityAlerts })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      security.suspiciousActivityAlerts ? 'bg-green-600' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        security.suspiciousActivityAlerts ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Session Timeout */}
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="mb-4">
                    <h4 className="text-white font-medium">Session Timeout</h4>
                    <p className="text-gray-400 text-sm">Automatically sign out after period of inactivity</p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <select
                      value={security.sessionTimeout}
                      onChange={(e) => onUpdateSecurity({ sessionTimeout: parseInt(e.target.value) })}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                      <option value={240}>4 hours</option>
                      <option value={480}>8 hours</option>
                      <option value={720}>12 hours</option>
                      <option value={1440}>24 hours</option>
                    </select>

                    <span className="text-gray-400 text-sm">
                      Current: {Math.floor(security.sessionTimeout / 60)}h {security.sessionTimeout % 60}m
                    </span>
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