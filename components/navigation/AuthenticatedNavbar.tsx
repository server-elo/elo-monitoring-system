'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  BookOpen,
  Code,
  Users,
  Trophy,
  Bell,
  Search,
  Briefcase,
  Award
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import Link from 'next/link';

export const AuthenticatedNavbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigationItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Learn', href: '/learn', icon: BookOpen },
    { name: 'Code Lab', href: '/code', icon: Code },
    { name: 'Collaborate', href: '/collaborate', icon: Users },
    { name: 'Achievements', href: '/achievements', icon: Trophy },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Certificates', href: '/certificates', icon: Award },
  ];

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SolidityLearn</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Search className="w-5 h-5" />
              </button>

              {/* Notifications */}
              {isAuthenticated && (
                <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              )}

              {/* User Menu */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-8 h-8 rounded-full border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="hidden sm:block text-white font-medium">{user.name}</span>
                  </button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full right-0 mt-2 w-64 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden"
                      >
                        {/* User Info */}
                        <div className="p-4 border-b border-white/10">
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                          <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                            user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' :
                            user.role === 'INSTRUCTOR' ? 'bg-green-500/20 text-green-300' :
                            user.role === 'MENTOR' ? 'bg-cyan-500/20 text-cyan-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {user.role}
                          </span>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <Link
                            href="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>
                          
                          <Link
                            href="/settings"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                          
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Sign In
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
                aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
                aria-expanded={showMobileMenu}
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden bg-black/90 backdrop-blur-md border-t border-white/10"
            >
              <div className="px-4 py-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-white/10 rounded-lg transition-colors min-h-[44px] touch-manipulation active:bg-white/20"
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};
