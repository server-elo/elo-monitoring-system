'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  FileText,
  Shield,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Home,
  Activity,
  Database,
  AlertTriangle,
  Clock,
  Eye,
  Lock
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { adminAuth, ADMIN_PERMISSIONS } from '@/lib/admin/auth';
import { AdminUser, AdminNotification } from '@/lib/admin/types';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  permission?: string;
  badge?: number;
  children?: NavigationItem[];
}

export function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    setCurrentUser(adminAuth.getCurrentUser());
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    // Mock notifications
    const mockNotifications: AdminNotification[] = [
      {
        id: '1',
        type: 'security',
        severity: 'warning',
        title: 'Multiple failed login attempts',
        message: '5 failed login attempts from IP 192.168.1.100',
        timestamp: new Date(),
        read: false,
        actionRequired: true,
        actionUrl: '/admin/security/events'
      },
      {
        id: '2',
        type: 'system',
        severity: 'info',
        title: 'System maintenance scheduled',
        message: 'Scheduled maintenance on Sunday 2AM-4AM UTC',
        timestamp: new Date(Date.now() - 3600000),
        read: false,
        actionRequired: false
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  };

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/admin',
      permission: ADMIN_PERMISSIONS.SYSTEM_READ
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      href: '/admin/users',
      permission: ADMIN_PERMISSIONS.USERS_READ,
      children: [
        { id: 'users-list', label: 'All Users', icon: Users, href: '/admin/users' },
        { id: 'users-roles', label: 'Roles & Permissions', icon: Shield, href: '/admin/users/roles' },
        { id: 'users-analytics', label: 'User Analytics', icon: BarChart3, href: '/admin/users/analytics' }
      ]
    },
    {
      id: 'content',
      label: 'Content Management',
      icon: FileText,
      href: '/admin/content',
      permission: ADMIN_PERMISSIONS.CONTENT_READ,
      children: [
        { id: 'content-lessons', label: 'Lessons', icon: FileText, href: '/admin/content/lessons' },
        { id: 'content-pending', label: 'Pending Approval', icon: Clock, href: '/admin/content/pending', badge: 3 },
        { id: 'content-analytics', label: 'Content Analytics', icon: BarChart3, href: '/admin/content/analytics' }
      ]
    },
    {
      id: 'community',
      label: 'Community',
      icon: Users,
      href: '/admin/community',
      permission: ADMIN_PERMISSIONS.COMMUNITY_READ,
      children: [
        { id: 'community-reports', label: 'Reports', icon: AlertTriangle, href: '/admin/community/reports', badge: 2 },
        { id: 'community-moderation', label: 'Moderation', icon: Shield, href: '/admin/community/moderation' },
        { id: 'community-analytics', label: 'Analytics', icon: BarChart3, href: '/admin/community/analytics' }
      ]
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      href: '/admin/security',
      permission: ADMIN_PERMISSIONS.SECURITY_READ,
      children: [
        { id: 'security-events', label: 'Security Events', icon: AlertTriangle, href: '/admin/security/events' },
        { id: 'security-audit', label: 'Audit Logs', icon: Eye, href: '/admin/security/audit' },
        { id: 'security-access', label: 'Access Control', icon: Lock, href: '/admin/security/access' }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      href: '/admin/analytics',
      permission: ADMIN_PERMISSIONS.ANALYTICS_READ
    },
    {
      id: 'system',
      label: 'System',
      icon: Settings,
      href: '/admin/system',
      permission: ADMIN_PERMISSIONS.SYSTEM_READ,
      children: [
        { id: 'system-health', label: 'System Health', icon: Activity, href: '/admin/system/health' },
        { id: 'system-database', label: 'Database', icon: Database, href: '/admin/system/database' },
        { id: 'system-settings', label: 'Settings', icon: Settings, href: '/admin/system/settings' }
      ]
    }
  ];

  const filteredNavigation = navigationItems.filter(item => 
    !item.permission || adminAuth.hasPermission(item.permission)
  );

  const handleLogout = () => {
    adminAuth.logout();
    window.location.href = '/admin/login';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const isActive = currentPage === item.id;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className={cn('mb-1', level > 0 && 'ml-4')}>
        <a
          href={item.href}
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isActive
              ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
              : 'text-gray-300 hover:bg-white/10 hover:text-white'
          )}
        >
          <div className="flex items-center space-x-3">
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </div>
          {item.badge && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {item.badge}
            </span>
          )}
          {hasChildren && <ChevronDown className="w-4 h-4" />}
        </a>
        
        {hasChildren && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className="fixed left-0 top-0 h-full w-64 z-50"
          >
            <Card className="h-full bg-black/20 backdrop-blur-md border-white/10 rounded-none">
              <div className="p-6">
                {/* Logo */}
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                    <p className="text-xs text-gray-400">Solidity Learning</p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  {filteredNavigation.map(item => renderNavigationItem(item))}
                </nav>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={cn('transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-0')}>
        {/* Header */}
        <Card className="bg-black/20 backdrop-blur-md border-white/10 rounded-none border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={toggleSidebar}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search admin panel..."
                    className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 w-64"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:text-white relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </div>

                {/* User Menu */}
                <div className="relative">
                  <Button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:text-white flex items-center space-x-2"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span>{currentUser?.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 z-50"
                      >
                        <Card className="bg-black/20 backdrop-blur-md border-white/10">
                          <div className="p-2">
                            <div className="px-3 py-2 border-b border-white/10">
                              <p className="text-sm font-medium text-white">{currentUser?.name}</p>
                              <p className="text-xs text-gray-400">{currentUser?.email}</p>
                              <p className="text-xs text-blue-400 capitalize">{currentUser?.role}</p>
                            </div>
                            <div className="mt-2">
                              <Button
                                onClick={handleLogout}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
