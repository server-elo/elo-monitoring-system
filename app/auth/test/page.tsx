'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  User,
  Lock,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Server
} from 'lucide-react';
import { useAuth, usePermissions, useAuthStatus } from '@/lib/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GlassCard } from '@/components/ui/Glassmorphism';

export default function AuthTestPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, isAuthenticated, isLoading, error, logout } = useAuth();
  const { hasPermission, hasMinimumRole } = usePermissions();
  const { isLoading: statusLoading } = useAuthStatus();

  const testPermissions = [
    'read:lessons',
    'write:lessons', 
    'read:students',
    'write:feedback',
    'read:analytics',
    'write:courses'
  ];

  const testRoles = ['STUDENT', 'MENTOR', 'INSTRUCTOR', 'ADMIN'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Authentication System Test
          </h1>
          <p className="text-xl text-gray-300">
            Test all authentication features and components
          </p>
        </motion.div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                isAuthenticated ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {isAuthenticated ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Authentication</h3>
              <p className={`text-sm ${isAuthenticated ? 'text-green-400' : 'text-red-400'}`}>
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                isLoading || statusLoading ? 'bg-yellow-500/20' : 'bg-blue-500/20'
              }`}>
                {isLoading || statusLoading ? (
                  <Clock className="w-6 h-6 text-yellow-400 animate-spin" />
                ) : (
                  <Server className="w-6 h-6 text-blue-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Loading State</h3>
              <p className={`text-sm ${isLoading || statusLoading ? 'text-yellow-400' : 'text-blue-400'}`}>
                {isLoading || statusLoading ? 'Loading...' : 'Ready'}
              </p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                user ? 'bg-purple-500/20' : 'bg-gray-500/20'
              }`}>
                <User className={`w-6 h-6 ${user ? 'text-purple-400' : 'text-gray-400'}`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">User Role</h3>
              <p className={`text-sm ${user ? 'text-purple-400' : 'text-gray-400'}`}>
                {user?.role || 'No Role'}
              </p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                error ? 'bg-red-500/20' : 'bg-green-500/20'
              }`}>
                {error ? (
                  <XCircle className="w-6 h-6 text-red-400" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Error State</h3>
              <p className={`text-sm ${error ? 'text-red-400' : 'text-green-400'}`}>
                {error || 'No Errors'}
              </p>
            </GlassCard>
          </motion.div>
        </div>

        {/* User Information */}
        {isAuthenticated && user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <GlassCard className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <User className="w-6 h-6 mr-2" />
                User Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Basic Info</h3>
                  <div className="space-y-2">
                    <p className="text-gray-300"><span className="font-medium">ID:</span> {user.id}</p>
                    <p className="text-gray-300"><span className="font-medium">Name:</span> {user.name}</p>
                    <p className="text-gray-300"><span className="font-medium">Email:</span> {user.email}</p>
                    <p className="text-gray-300"><span className="font-medium">Role:</span> {user.role}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Avatar</h3>
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-16 h-16 rounded-full border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Permission Testing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Shield className="w-6 h-6 mr-2" />
              Permission Testing
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Permissions */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Permissions</h3>
                <div className="space-y-2">
                  {testPermissions.map((permission) => {
                    const hasAccess = hasPermission(permission);
                    return (
                      <div key={permission} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                        <span className="text-gray-300">{permission}</span>
                        <div className={`w-4 h-4 rounded-full ${hasAccess ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Roles */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Role Access</h3>
                <div className="space-y-2">
                  {testRoles.map((role) => {
                    const hasAccess = hasMinimumRole(role);
                    return (
                      <div key={role} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                        <span className="text-gray-300">{role}</span>
                        <div className={`w-4 h-4 rounded-full ${hasAccess ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Key className="w-6 h-6 mr-2" />
              Authentication Actions
            </h2>
            
            <div className="flex flex-wrap gap-4">
              {!isAuthenticated ? (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Open Auth Modal
                </button>
              ) : (
                <button
                  onClick={logout}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Protected Content Test */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Lock className="w-6 h-6 mr-2" />
              Protected Content Test
            </h2>
            
            <div className="space-y-4">
              <ProtectedRoute permission={{ requireAuth: true }}>
                <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-300">✅ This content is only visible to authenticated users!</p>
                </div>
              </ProtectedRoute>

              <ProtectedRoute permission={{ requireAuth: true, roles: ['INSTRUCTOR'] }}>
                <div className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                  <p className="text-purple-300">✅ This content is only visible to Instructors and Admins!</p>
                </div>
              </ProtectedRoute>

              <ProtectedRoute permission={{ requireAuth: true, roles: ['ADMIN'] }}>
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300">✅ This content is only visible to Admins!</p>
                </div>
              </ProtectedRoute>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
