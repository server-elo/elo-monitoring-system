'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { SessionStatusIndicator, SessionStatusBadge } from '@/components/ui/SessionStatusIndicator';
import { CompactXPDisplay } from '@/components/xp/XPCounter';
import { XPNotificationManager } from '@/components/xp/XPNotification';
import { LevelUpManager } from '@/components/xp/LevelUpCelebration';
import { BookOpen, Code, Users, Trophy, Menu, X, Zap, Brain, Shield, Palette, Briefcase, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {  } from '@/components/ui/dropdown-menu';
import { useLearning } from '@/lib/context/LearningContext';
import { useSwipeGesture, useOutsideClick } from '@/lib/hooks/useSwipeGesture';
import { useAuth } from '@/lib/hooks/useAuth';

// Check if we're in static export mode
const isStaticExport = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

export function Navigation() {
  // Always call hooks at the top level
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { data: session } = useSession();
  const { state: learningState } = useLearning();
  const { isAuthenticated } = useAuth();

  // Swipe gesture support for mobile
  const swipeRef = useSwipeGesture({
    onSwipeUp: () => setIsOpen(false),
    onSwipeLeft: () => setIsOpen(false),
    threshold: 50
  });

  // Close menu when clicking outside
  const outsideClickRef = useOutsideClick(() => setIsOpen(false));

  // For static export, use simplified navigation without hooks
  if (isStaticExport) {
    return <StaticNavigation />;
  }

  const navigationItems = [
    { href: '/learn', label: 'Learn', icon: BookOpen },
    { href: '/code', label: 'Code Lab', icon: Code },
    { href: '/collaborate', label: 'Collaborate', icon: Users },
    { href: '/achievements', label: 'Achievements', icon: Trophy },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/certificates', label: 'Certificates', icon: Award },
  ];

  // Development-only navigation items
  const devNavigationItems = process.env.NODE_ENV === 'development' ? [
    { href: '/auth/local-test', label: 'Auth Test', icon: Shield },
    { href: '/auth/demo', label: 'Auth Demo', icon: Palette },
  ] : [];

  const allNavigationItems = [...navigationItems, ...devNavigationItems];

  return (
    <nav
      id="navigation"
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2"
            aria-label="SolanaLearn home page"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2"
            >
              <div
                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
                aria-hidden="true"
              >
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">SolanaLearn</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div
            className="hidden md:flex items-center space-x-8"
            role="menubar"
            aria-label="Main menu"
          >
            {allNavigationItems.map((item, _index) => (
              <motion.div key={item.href} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={item.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10"
                  role="menuitem"
                  tabIndex={0}
                  aria-label={`${item.label} - ${
                    item.href === '/learn' ? 'Interactive lessons' :
                    item.href === '/code' ? 'Code playground' :
                    item.href === '/collaborate' ? 'Real-time collaboration' :
                    item.href === '/achievements' ? 'View achievements' :
                    item.href === '/jobs' ? 'Browse job opportunities' :
                    item.href === '/certificates' ? 'View certificates' :
                    item.label
                  }`}
                >
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* XP and Level Display */}
                <div className="hidden sm:flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Brain className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">Level {learningState.level}</span>
                  </div>
                  <CompactXPDisplay
                    currentXP={learningState.xp}
                    previousXP={learningState.previousXP}
                    className="text-gray-300"
                  />
                </div>

                {/* Session Status Badge */}
                <SessionStatusBadge className="hidden sm:block" />

                {/* Enhanced User Avatar with Session Status */}
                <UserAvatar
                  showSessionStatus={true}
                  showDropdown={true}
                  className="relative"
                />
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => setShowAuthModal(true)}>
                  Sign In
                </Button>
                <Button onClick={() => setShowAuthModal(true)}>
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-300 hover:text-white p-2 min-h-[44px] min-w-[44px] touch-manipulation"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation-menu"
              aria-haspopup="menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-navigation-menu"
            ref={(el) => {
              swipeRef.current = el;
              outsideClickRef.current = el;
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden"
            role="menu"
            aria-label="Mobile navigation menu"
            aria-orientation="vertical"
          >
            <div className="glass border-t border-white/10">
              <div
                className="px-4 py-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto"
                role="none"
              >
              {allNavigationItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 min-h-[44px] touch-manipulation active:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10"
                    onClick={() => setIsOpen(false)}
                    role="menuitem"
                    tabIndex={0}
                    aria-label={`${item.label} - ${
                      item.href === '/learn' ? 'Interactive lessons' :
                      item.href === '/code' ? 'Code playground' :
                      item.href === '/collaborate' ? 'Real-time collaboration' :
                      item.href === '/achievements' ? 'View achievements' :
                      item.href === '/jobs' ? 'Browse job opportunities' :
                      item.href === '/certificates' ? 'View certificates' :
                      item.label
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </motion.div>
              ))}

              {session && (
                <>
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-gray-400 font-medium">Progress</span>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-blue-400 font-medium">Level {learningState.level}</span>
                        <span className="text-purple-400 font-medium">{learningState.xp} XP</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Session Status Indicator */}
      {isAuthenticated && (
        <SessionStatusIndicator
          position="top-right"
          showDetails={true}
          autoHide={true}
          hideDelay={8000}
        />
      )}

      {/* XP Notification Manager */}
      <XPNotificationManager />

      {/* Level Up Manager */}
      <LevelUpManager />
    </nav>
  );
}

// Simplified navigation for static export (no hooks, no interactive elements)
function StaticNavigation() {
  const navigationItems = [
    { href: '/learn', label: 'Learn', icon: BookOpen },
    { href: '/code', label: 'Code Lab', icon: Code },
    { href: '/collaborate', label: 'Collaborate', icon: Users },
    { href: '/achievements', label: 'Achievements', icon: Trophy },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/certificates', label: 'Certificates', icon: Award },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">SolanaLearn</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Static User Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost">
                Sign In
              </Button>
              <Button>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Static Mobile Navigation (always visible on mobile for static export) */}
      <div className="md:hidden glass border-t border-white/10">
        <div className="px-4 py-4 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
