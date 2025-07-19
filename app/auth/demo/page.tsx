'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  User,
  Lock,
  CheckCircle,
  Key,
  Server,
  Database,
  Eye,
  EyeOff,
  Github,
  Chrome,
  Wallet,
  Mail
} from 'lucide-react';
import { GlassCard } from '@/components/ui/Glassmorphism';

export default function AuthDemoPage() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const demoFeatures = [
    {
      title: 'Email/Password Authentication',
      description: 'Traditional signup and login with secure password hashing',
      icon: Mail,
      status: 'implemented',
      color: 'green'
    },
    {
      title: 'OAuth Integration',
      description: 'GitHub and Google OAuth for seamless authentication',
      icon: Github,
      status: 'implemented',
      color: 'blue'
    },
    {
      title: 'Role-Based Access Control',
      description: 'STUDENT, MENTOR, INSTRUCTOR, ADMIN roles with permissions',
      icon: Shield,
      status: 'implemented',
      color: 'purple'
    },
    {
      title: 'Protected Routes',
      description: 'Route protection with authentication and role requirements',
      icon: Lock,
      status: 'implemented',
      color: 'orange'
    },
    {
      title: 'Password Security',
      description: 'Strong password requirements with real-time validation',
      icon: Key,
      status: 'implemented',
      color: 'cyan'
    },
    {
      title: 'Session Management',
      description: 'Secure JWT tokens with NextAuth.js integration',
      icon: Server,
      status: 'implemented',
      color: 'indigo'
    }
  ];

  const demoUsers = [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'STUDENT',
      avatar: '👩‍🎓',
      permissions: ['read:lessons', 'write:progress', 'read:achievements']
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'MENTOR',
      avatar: '👨‍🏫',
      permissions: ['read:lessons', 'write:progress', 'read:students', 'write:mentorship']
    },
    {
      name: 'Carol Davis',
      email: 'carol@example.com',
      role: 'INSTRUCTOR',
      avatar: '👩‍💼',
      permissions: ['read:lessons', 'write:lessons', 'read:analytics', 'write:courses']
    },
    {
      name: 'David Wilson',
      email: 'david@example.com',
      role: 'ADMIN',
      avatar: '👨‍💻',
      permissions: ['*'] // All permissions
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            🔐 Authentication System Demo
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Complete authentication system for the Solidity Learning Platform with 
            email/password, OAuth, role-based access control, and beautiful UI components.
          </p>
        </motion.div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">UI Components</h3>
              <p className="text-green-400 text-sm">100% Complete</p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                <Server className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">API Endpoints</h3>
              <p className="text-blue-400 text-sm">Ready for Database</p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
                <Database className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Database</h3>
              <p className="text-yellow-400 text-sm">Setup Required</p>
            </GlassCard>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <GlassCard className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              🚀 Implemented Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-6 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-${feature.color}-500/20 flex items-center justify-center mr-3`}>
                      <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full bg-${feature.color}-500/20 text-${feature.color}-300`}>
                        {feature.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Demo Authentication Modal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <GlassCard className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              🎨 Authentication UI Demo
            </h2>
            
            <div className="max-w-md mx-auto">
              {/* Mode Toggle */}
              <div className="flex bg-white/10 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    authMode === 'login' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    authMode === 'register' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-3 mb-6">
                <button className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors">
                  <Github className="w-5 h-5" />
                  <span>Continue with GitHub</span>
                </button>
                
                <button className="w-full flex items-center justify-center space-x-2 p-3 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 rounded-lg transition-colors">
                  <Chrome className="w-5 h-5" />
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">Or continue with email</span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </div>

              {/* MetaMask Option */}
              <div className="mt-4">
                <button className="w-full flex items-center justify-center space-x-2 p-3 bg-orange-600 hover:bg-orange-700 border border-orange-500 rounded-lg transition-colors">
                  <Wallet className="w-5 h-5" />
                  <span>Connect with MetaMask</span>
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Demo Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <GlassCard className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              👥 User Roles & Permissions Demo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {demoUsers.map((user, index) => (
                <motion.div
                  key={user.email}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="p-6 bg-white/5 rounded-lg border border-white/10 text-center"
                >
                  <div className="text-4xl mb-3">{user.avatar}</div>
                  <h3 className="text-lg font-semibold text-white mb-1">{user.name}</h3>
                  <p className="text-gray-400 text-sm mb-3">{user.email}</p>
                  <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                    user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' :
                    user.role === 'INSTRUCTOR' ? 'bg-green-500/20 text-green-300' :
                    user.role === 'MENTOR' ? 'bg-cyan-500/20 text-cyan-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {user.role}
                  </span>
                  <div className="mt-3 text-xs text-gray-400">
                    <p className="font-medium mb-1">Permissions:</p>
                    {user.permissions.slice(0, 2).map((perm, i) => (
                      <p key={i}>• {perm}</p>
                    ))}
                    {user.permissions.length > 2 && (
                      <p>• +{user.permissions.length - 2} more</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-12 text-center"
        >
          <GlassCard className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">
              🚀 Ready to Test with Database?
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              The authentication system is fully implemented and ready for testing. 
              Set up a database connection to test user registration, login, and all features.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/docs/DATABASE_SETUP.md"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                📊 Database Setup Guide
              </a>
              <a
                href="/docs/AUTHENTICATION_SETUP.md"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                🔐 Authentication Guide
              </a>
              <a
                href="/auth/test"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                🧪 Test Authentication
              </a>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
