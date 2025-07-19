'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Eye, EyeOff, Clock, CheckCircle, RotateCcw, Trash2, Ban, Archive, Users, FileText, BookOpen, FileQuestion } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { AdminConfirmation, AdminUndo } from '@/lib/admin/types';

interface SafetyConfirmationProps {
  isOpen: boolean;
  confirmation: AdminConfirmation;
  onConfirm: (password?: string, twoFactorCode?: string) => Promise<void>;
  onCancel: () => void;
}

interface UndoManagerProps {
  className?: string;
}

/*
function TwoFactorVerification({ isOpen, onVerify, onCancel }: TwoFactorVerificationProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const success = await onVerify(code);
      if (!success) {
        setError('Invalid verification code');
      }
    } catch (error) {
      setError('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-lg border border-white/20 w-full max-w-md"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Two-Factor Authentication</h3>
            <p className="text-gray-400">Enter the 6-digit code from your authenticator app</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="mb-6">
            <input
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="000000"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-blue-400"
              maxLength={6}
            />
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={code.length !== 6 || isVerifying}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isVerifying ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify'
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
*/

export function SafetyConfirmation({ isOpen, confirmation, onConfirm, onCancel }: SafetyConfirmationProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [_showTwoFactor, _setShowTwoFactor] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'password' | 'twofactor' | 'final'>('password');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setTwoFactorCode('');
      setError('');
      setStep(confirmation.requirePassword ? 'password' : confirmation.requireTwoFactor ? 'twofactor' : 'final');
    }
  }, [isOpen, confirmation]);

  const getIconForType = () => {
    switch (confirmation.type) {
      case 'danger': return <AlertTriangle className="w-8 h-8 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
      default: return <Shield className="w-8 h-8 text-blue-400" />;
    }
  };

  const getColorForType = () => {
    switch (confirmation.type) {
      case 'danger': return 'border-red-400/30 bg-red-500/10';
      case 'warning': return 'border-yellow-400/30 bg-yellow-500/10';
      default: return 'border-blue-400/30 bg-blue-500/10';
    }
  };

  const handlePasswordSubmit = () => {
    if (confirmation.requireTwoFactor) {
      setStep('twofactor');
    } else {
      setStep('final');
    }
  };

  const handleTwoFactorSubmit = () => {
    setStep('final');
  };

  const handleFinalConfirm = async () => {
    setIsConfirming(true);
    setError('');

    try {
      await onConfirm(
        confirmation.requirePassword ? password : undefined,
        confirmation.requireTwoFactor ? twoFactorCode : undefined
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Confirmation failed');
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-lg border border-white/20 w-full max-w-lg"
        >
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4', getColorForType())}>
                {getIconForType()}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{confirmation.title}</h3>
              <p className="text-gray-400">{confirmation.message}</p>
            </div>

            {/* Consequences */}
            {confirmation.consequences && confirmation.consequences.length > 0 && (
              <div className={cn('mb-6 p-4 rounded-lg border', getColorForType())}>
                <h4 className="font-medium text-white mb-2">This action will:</h4>
                <ul className="space-y-1">
                  {confirmation.consequences.map((consequence, index) => (
                    <li key={index} className="text-sm text-gray-300 flex items-start space-x-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{consequence}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Affected Items */}
            {confirmation.affectedItems && confirmation.affectedItems > 0 && (
              <div className="mb-6 p-3 bg-orange-500/10 border border-orange-400/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 font-medium">
                    {confirmation.affectedItems} item{confirmation.affectedItems > 1 ? 's' : ''} will be affected
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Password Step */}
            {step === 'password' && confirmation.requirePassword && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm your password to continue
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Two-Factor Step */}
            {step === 'twofactor' && confirmation.requireTwoFactor && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter your two-factor authentication code
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-xl tracking-widest font-mono focus:outline-none focus:border-blue-400"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
            )}

            {/* Final Confirmation */}
            {step === 'final' && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-400/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-400 mb-1">Final Warning</h4>
                    <p className="text-sm text-red-300">
                      This action cannot be undone. Are you absolutely sure you want to proceed?
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                {confirmation.cancelText}
              </Button>
              
              {step === 'password' && confirmation.requirePassword ? (
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={!password}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue
                </Button>
              ) : step === 'twofactor' && confirmation.requireTwoFactor ? (
                <Button
                  onClick={handleTwoFactorSubmit}
                  disabled={twoFactorCode.length !== 6}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleFinalConfirm}
                  disabled={isConfirming}
                  className={cn(
                    'flex-1',
                    confirmation.destructive
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700',
                    'disabled:opacity-50'
                  )}
                >
                  {isConfirming ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    confirmation.confirmText
                  )}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Soft Delete Manager for 30-day recovery period
interface SoftDeleteManagerProps {
  className?: string;
}

interface SoftDeletedItem {
  id: string;
  type: 'user' | 'content' | 'lesson' | 'quiz';
  name: string;
  deletedAt: Date;
  deletedBy: string;
  expiresAt: Date;
  canRestore: boolean;
  metadata: Record<string, any>;
}

export function SoftDeleteManager({ className }: SoftDeleteManagerProps) {
  const [deletedItems, setDeletedItems] = useState<SoftDeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'user' | 'content'>('all');

  useEffect(() => {
    loadDeletedItems();
  }, [filter]);

  const loadDeletedItems = async () => {
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock deleted items
    const mockItems: SoftDeletedItem[] = [
      {
        id: 'del1',
        type: 'user',
        name: 'john.doe@example.com',
        deletedAt: new Date(Date.now() - 86400000), // 1 day ago
        deletedBy: 'admin@example.com',
        expiresAt: new Date(Date.now() + 25 * 86400000), // 25 days from now
        canRestore: true,
        metadata: { reason: 'Account violation', userId: 'user123' }
      },
      {
        id: 'del2',
        type: 'content',
        name: 'Outdated Solidity Tutorial',
        deletedAt: new Date(Date.now() - 604800000), // 7 days ago
        deletedBy: 'instructor@example.com',
        expiresAt: new Date(Date.now() + 23 * 86400000), // 23 days from now
        canRestore: true,
        metadata: { reason: 'Content outdated', contentId: 'lesson456' }
      }
    ];

    const filtered = filter === 'all' ? mockItems : mockItems.filter(item => item.type === filter);
    setDeletedItems(filtered);
    setLoading(false);
  };

  const handleRestore = async (itemId: string) => {
    console.log('Restoring item:', itemId);
    setDeletedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handlePermanentDelete = async (itemId: string) => {
    console.log('Permanently deleting item:', itemId);
    setDeletedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const getDaysRemaining = (expiresAt: Date): number => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return Users;
      case 'content': return FileText;
      case 'lesson': return BookOpen;
      case 'quiz': return FileQuestion;
      default: return Trash2;
    }
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-white/10 backdrop-blur-md border-white/20 p-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-600 animate-pulse rounded" />
              <div className="flex-1 space-y-2">
                <div className="w-2/3 h-4 bg-gray-600 animate-pulse rounded" />
                <div className="w-1/2 h-3 bg-gray-600 animate-pulse rounded" />
              </div>
              <div className="w-20 h-8 bg-gray-600 animate-pulse rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Soft Delete Manager</h2>
          <p className="text-gray-400 mt-1">Items in 30-day recovery period</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
        >
          <option value="all">All Items</option>
          <option value="user">Users</option>
          <option value="content">Content</option>
        </select>
      </div>

      {deletedItems.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Deleted Items</h3>
          <p className="text-gray-400">No items are currently in the recovery period.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {deletedItems.map((item) => {
            const Icon = getTypeIcon(item.type);
            const daysRemaining = getDaysRemaining(item.expiresAt);
            const isExpiringSoon = daysRemaining <= 7;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-red-400" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium text-white">{item.name}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                        <span className="capitalize">{item.type}</span>
                        <span>•</span>
                        <span>Deleted by {item.deletedBy}</span>
                        <span>•</span>
                        <span>{item.deletedAt.toLocaleDateString()}</span>
                      </div>
                      {item.metadata.reason && (
                        <p className="text-xs text-gray-500 mt-1">Reason: {item.metadata.reason}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className={cn(
                        'text-sm font-medium',
                        isExpiringSoon ? 'text-red-400' : 'text-yellow-400'
                      )}>
                        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Expires {item.expiresAt.toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.canRestore && (
                        <Button
                          onClick={() => handleRestore(item.id)}
                          variant="outline"
                          size="sm"
                          className="border-green-400/30 text-green-400 hover:bg-green-500/10"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Restore
                        </Button>
                      )}
                      <Button
                        onClick={() => handlePermanentDelete(item.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-400/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Forever
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function UndoManager({ className }: UndoManagerProps) {
  const [undoActions, setUndoActions] = useState<AdminUndo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUndoActions();
  }, []);

  const loadUndoActions = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock undo actions
    const mockActions: AdminUndo[] = [
      {
        id: 'undo1',
        action: 'user_suspension',
        description: 'Suspended user john.doe@example.com',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        expiresAt: new Date(Date.now() + 86100000), // 23 hours 55 minutes from now
        canUndo: true,
        undoData: { userId: 'user123', previousStatus: 'active' },
        affectedResources: ['user:user123']
      },
      {
        id: 'undo2',
        action: 'content_deletion',
        description: 'Deleted lesson "Advanced Solidity Patterns"',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        expiresAt: new Date(Date.now() + 84600000), // 23 hours 30 minutes from now
        canUndo: true,
        undoData: { contentId: 'lesson456', contentData: '...' },
        affectedResources: ['content:lesson456']
      },
      {
        id: 'undo3',
        action: 'bulk_user_update',
        description: 'Updated roles for 15 users',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        expiresAt: new Date(Date.now() + 82800000), // 23 hours from now
        canUndo: false, // Too complex to undo
        undoData: {},
        affectedResources: ['user:multiple']
      }
    ];

    setUndoActions(mockActions);
    setLoading(false);
  };

  const handleUndo = async (undoId: string) => {
    console.log('Undoing action:', undoId);
    // Implement undo logic
    setUndoActions(prev => prev.filter(action => action.id !== undoId));
  };

  const getTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_suspension': return Ban;
      case 'user_deletion': return Trash2;
      case 'content_deletion': return Trash2;
      case 'content_archival': return Archive;
      default: return RotateCcw;
    }
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-white/10 backdrop-blur-md border-white/20 p-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-600 animate-pulse rounded" />
              <div className="flex-1 space-y-2">
                <div className="w-2/3 h-4 bg-gray-600 animate-pulse rounded" />
                <div className="w-1/2 h-3 bg-gray-600 animate-pulse rounded" />
              </div>
              <div className="w-20 h-8 bg-gray-600 animate-pulse rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h2 className="text-2xl font-bold text-white">Undo Manager</h2>
        <p className="text-gray-400 mt-1">Recent actions that can be undone within 24 hours</p>
      </div>

      {undoActions.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Recent Actions</h3>
          <p className="text-gray-400">All recent administrative actions have been finalized.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {undoActions.map((action) => {
            const Icon = getActionIcon(action.action);
            const timeRemaining = getTimeRemaining(action.expiresAt);
            const isExpired = new Date() > action.expiresAt;
            
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className={cn(
                  'bg-white/10 backdrop-blur-md border-white/20 p-4',
                  isExpired && 'opacity-50'
                )}>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-orange-400" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{action.description}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{action.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <span>•</span>
                        <span className={cn(
                          isExpired ? 'text-red-400' : 'text-yellow-400'
                        )}>
                          {timeRemaining}
                        </span>
                        <span>•</span>
                        <span>{action.affectedResources.length} resource{action.affectedResources.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {action.canUndo && !isExpired ? (
                        <Button
                          onClick={() => handleUndo(action.id)}
                          variant="outline"
                          size="sm"
                          className="border-orange-400/30 text-orange-400 hover:bg-orange-500/10"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Undo
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-500 px-3 py-1 bg-gray-600/20 rounded">
                          {isExpired ? 'Expired' : 'Cannot undo'}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
