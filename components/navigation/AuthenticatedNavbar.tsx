'use client';

import { ReactElement, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/stores/userStore';
import { NAVIGATION_ITEMS, APP_NAME } from '@/constants';
import { Menu, X, User, LogOut, Trophy, BookOpen } from 'lucide-react';

export const AuthenticatedNavbar = (): ReactElement => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUserStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = (): void => {
    logout();
    router.push('/');
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (): void => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" onClick={handleNavClick}>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">{APP_NAME}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {NAVIGATION_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-300 hover:text-purple-400 transition-colors duration-200 flex items-center space-x-1"
              >
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* User XP Display */}
                <div className="hidden sm:flex items-center space-x-2 text-sm">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-gray-300">{user.xp} XP</span>
                  <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs">
                    Level {user.level}
                  </div>
                </div>

                {/* User Menu */}
                <div className="relative group">
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 text-gray-300 hover:text-white"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.name || 'User'}</span>
                  </Button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-2">
                      <Link
                        href="/profile"
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-slate-700 rounded"
                        onClick={handleNavClick}
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        href="/achievements"
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-slate-700 rounded"
                        onClick={handleNavClick}
                      >
                        <Trophy className="h-4 w-4" />
                        <span>Achievements</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-slate-700 rounded"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {NAVIGATION_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-gray-300 hover:text-purple-400 hover:bg-slate-800 rounded transition-colors duration-200"
                  onClick={handleNavClick}
                >
                  {item.name}
                </Link>
              ))}
              
              {isAuthenticated && user && (
                <div className="border-t border-slate-700 mt-4 pt-4">
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <User className="h-6 w-6 text-gray-400" />
                    <div>
                      <div className="text-white font-medium">{user.name || 'User'}</div>
                      <div className="text-sm text-gray-400 flex items-center space-x-2">
                        <Trophy className="h-3 w-3 text-yellow-500" />
                        <span>{user.xp} XP • Level {user.level}</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-slate-800 rounded"
                    onClick={handleNavClick}
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-slate-800 rounded"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AuthenticatedNavbar;