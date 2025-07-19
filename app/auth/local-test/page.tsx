'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Server,
  LogIn,
  LogOut,
  UserPlus
} from 'lucide-react';
import { MockAuthProvider, useMockAuth, useMockPermissions, useMockAuthStatus } from '@/lib/auth/mock-auth';
import { GlassCard } from '@/components/ui/Glassmorphism';

function AuthTestContent() {
  const { user, isAuthenticated, isLoading, error, login, register, logout, clearError } = useMockAuth();
  const { hasPermission, hasMinimumRole } = useMockPermissions();
  const { isLoading: statusLoading } = useMockAuthStatus();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const testPermissions = [
    'read:lessons',
    'write:lessons', 
    'read:students',
    'write:feedback',
    'read:analytics',
    'write:courses'
  ];

  const testRoles = ['STUDENT', 'MENTOR', 'INSTRUCTOR', 'ADMIN'];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(loginForm.email, loginForm.password);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await register(registerForm.name, registerForm.email, registerForm.password);
  };

  const quickLoginUsers = [
    { email: 'alice@example.com', password: 'password123', role: 'STUDENT' },
    { email: 'bob@example.com', password: 'password123', role: 'MENTOR' },
    { email: 'carol@example.com', password: 'password123', role: 'INSTRUCTOR' },
    { email: 'admin@example.com', password: 'admin123', role: 'ADMIN' },
  ];

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
            🧪 Local Authentication Testing
          </h1>
          <p className="text-xl text-gray-300">
            Test all authentication features locally with mock data
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <User className="w-6 h-6 mr-2" />
                  User Information
                </h2>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
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
                  <h3 className="text-lg font-semibold text-white mb-3">Session Info</h3>
                  <div className="space-y-2">
                    <p className="text-gray-300"><span className="font-medium">Created:</span> {user.createdAt.toLocaleString()}</p>
                    <p className="text-gray-300"><span className="font-medium">Status:</span> Active</p>
                    <p className="text-gray-300"><span className="font-medium">Storage:</span> LocalStorage</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Authentication Forms */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <GlassCard className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Key className="w-6 h-6 mr-2" />
                Authentication Testing
              </h2>

              {/* Quick Login Buttons */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Quick Login (Test Users)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {quickLoginUsers.map((testUser) => (
                    <button
                      key={testUser.email}
                      onClick={() => login(testUser.email, testUser.password)}
                      disabled={isLoading}
                      className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors text-sm"
                    >
                      {testUser.role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex bg-white/10 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2 ${
                    activeTab === 'login' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2 ${
                    activeTab === 'register' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </button>
              </div>

              {/* Forms */}
              <div className="max-w-md mx-auto">
                {activeTab === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter email"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                      <input
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors"
                    >
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                      <input
                        type="text"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter email"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                      <input
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium rounded-lg transition-colors"
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </form>
                )}
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
      </div>
    </div>
  );
}

export default function LocalAuthTestPage() {
  return (
    <MockAuthProvider>
      <AuthTestContent />
    </MockAuthProvider>
  );
}
