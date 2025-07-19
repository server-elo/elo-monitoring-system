'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MoreVertical, Edit, Trash2, Ban, CheckCircle, XCircle, Clock, Shield, Eye, Download, Upload, UserPlus, Settings, AlertTriangle, Calendar, Activity, Award, BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { AdminUser, AdminFilter, AdminSort, AdminPagination } from '@/lib/admin/types';
import { adminAuth, ADMIN_PERMISSIONS } from '@/lib/admin/auth';

interface UserManagementProps {
  className?: string;
}

interface UserTableProps {
  users: AdminUser[];
  selectedUsers: Set<string>;
  onSelectUser: (userId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onUserAction: (userId: string, action: string) => void;
  loading?: boolean;
}

function UserTable({ users, selectedUsers, onSelectUser, onSelectAll, onUserAction, loading }: UserTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10';
      case 'suspended': return 'text-yellow-400 bg-yellow-500/10';
      case 'banned': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-400 bg-purple-500/10';
      case 'instructor': return 'text-blue-400 bg-blue-500/10';
      case 'student': return 'text-green-400 bg-green-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-gray-600 animate-pulse rounded" />
                <div className="w-10 h-10 bg-gray-600 animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="w-1/3 h-4 bg-gray-600 animate-pulse rounded" />
                  <div className="w-1/4 h-3 bg-gray-600 animate-pulse rounded" />
                </div>
                <div className="w-20 h-6 bg-gray-600 animate-pulse rounded" />
                <div className="w-16 h-6 bg-gray-600 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-black/20 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === users.length && users.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Role</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Activity</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Progress</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Joined</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map((user) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => onSelectUser(user.id)}
                    className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-medium text-sm">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white">{user.name}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                      {!user.emailVerified && (
                        <div className="flex items-center space-x-1 mt-1">
                          <AlertTriangle className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-yellow-400">Unverified</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getRoleColor(user.role)
                  )}>
                    {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(user.status)
                  )}>
                    {user.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {user.status === 'suspended' && <Clock className="w-3 h-3 mr-1" />}
                    {user.status === 'banned' && <XCircle className="w-3 h-3 mr-1" />}
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">
                    {user.lastActivity ? (
                      <div>
                        <div className="flex items-center space-x-1">
                          <Activity className="w-3 h-3 text-green-400" />
                          <span>{formatDate(user.lastActivity)}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {user.loginCount} logins
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Never</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <BookOpen className="w-3 h-3" />
                      <span>{user.lessonsCompleted} lessons</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300 mt-1">
                      <Award className="w-3 h-3" />
                      <span>{user.xpTotal} XP</span>
                    </div>
                    {user.averageScore > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Avg: {user.averageScore}%
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      onClick={() => onUserAction(user.id, 'view')}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {adminAuth.hasPermission(ADMIN_PERMISSIONS.USERS_WRITE) && (
                      <Button
                        onClick={() => onUserAction(user.id, 'edit')}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function UserManagement({ className }: UserManagementProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filters] = useState<AdminFilter[]>([]);
  const [sort] = useState<AdminSort>({ field: 'createdAt', direction: 'desc' });
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [searchQuery, filters, sort, pagination.page]);

  const loadUsers = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock users data
    const mockUsers: AdminUser[] = [
      {
        id: '1',
        email: 'john.doe@example.com',
        name: 'John Doe',
        role: 'student',
        status: 'active',
        createdAt: new Date('2023-01-15'),
        lastLoginAt: new Date('2024-01-10'),
        lastActivity: new Date('2024-01-10'),
        loginCount: 45,
        xpTotal: 1250,
        lessonsCompleted: 12,
        averageScore: 87,
        timeSpent: 2340,
        emailVerified: true,
        twoFactorEnabled: false
      },
      {
        id: '2',
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        role: 'instructor',
        status: 'active',
        createdAt: new Date('2023-02-20'),
        lastLoginAt: new Date('2024-01-09'),
        lastActivity: new Date('2024-01-09'),
        loginCount: 123,
        xpTotal: 3450,
        lessonsCompleted: 28,
        averageScore: 94,
        timeSpent: 5670,
        emailVerified: true,
        twoFactorEnabled: true
      },
      {
        id: '3',
        email: 'bob.wilson@example.com',
        name: 'Bob Wilson',
        role: 'student',
        status: 'suspended',
        createdAt: new Date('2023-03-10'),
        lastLoginAt: new Date('2023-12-15'),
        lastActivity: new Date('2023-12-15'),
        loginCount: 23,
        xpTotal: 680,
        lessonsCompleted: 5,
        averageScore: 72,
        timeSpent: 890,
        suspensionReason: 'Violation of community guidelines',
        suspensionExpiresAt: new Date('2024-02-15'),
        emailVerified: false,
        twoFactorEnabled: false
      }
    ];

    setUsers(mockUsers);
    setPagination(prev => ({
      ...prev,
      total: mockUsers.length,
      totalPages: Math.ceil(mockUsers.length / prev.limit)
    }));
    setLoading(false);
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(new Set(users.map(user => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleUserAction = (userId: string, action: string) => {
    console.log(`Action ${action} on user ${userId}`);
    // Implement user actions
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action ${action} on users:`, Array.from(selectedUsers));
    // Implement bulk actions
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">Manage users, roles, and permissions</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          {adminAuth.hasPermission(ADMIN_PERMISSIONS.USERS_WRITE) && (
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Settings className="w-4 h-4 mr-2" />
            Columns
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-medium">
                {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleBulkAction('activate')}
                  size="sm"
                  variant="outline"
                  className="border-green-400/30 text-green-400 hover:bg-green-500/10"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Activate
                </Button>
                <Button
                  onClick={() => handleBulkAction('suspend')}
                  size="sm"
                  variant="outline"
                  className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Suspend
                </Button>
                <Button
                  onClick={() => handleBulkAction('ban')}
                  size="sm"
                  variant="outline"
                  className="border-red-400/30 text-red-400 hover:bg-red-500/10"
                >
                  <Ban className="w-4 h-4 mr-1" />
                  Ban
                </Button>
                <Button
                  onClick={() => handleBulkAction('delete')}
                  size="sm"
                  variant="outline"
                  className="border-red-400/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Users Table */}
      <UserTable
        users={users}
        selectedUsers={selectedUsers}
        onSelectUser={handleSelectUser}
        onSelectAll={handleSelectAll}
        onUserAction={handleUserAction}
        loading={loading}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            Previous
          </Button>
          <Button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
