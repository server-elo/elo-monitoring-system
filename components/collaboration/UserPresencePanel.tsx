'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Eye, GraduationCap, Clock, Wifi, WifiOff, MessageCircle, MoreVertical, UserMinus, UserPlus, VolumeX } from 'lucide-react';
import { CollaborationUser } from '@/lib/collaboration/CollaborationClient';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface UserPresencePanelProps {
  users: CollaborationUser[];
  currentUserId: string;
  sessionDuration: number; // in seconds
  isConnected: boolean;
  onUserAction?: (userId: string, action: 'kick' | 'mute' | 'promote') => void;
  onInviteUser?: () => void;
  className?: string;
  compact?: boolean;
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

export function UserPresencePanel({
  users,
  currentUserId,
  sessionDuration,
  isConnected,
  onUserAction,
  onInviteUser,
  className,
  compact = false
}: UserPresencePanelProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // Clean up old typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(user => now - user.timestamp < 5000) // Remove after 5 seconds
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'instructor':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'student':
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case 'observer':
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const currentUser = users.find(user => user.id === currentUserId);
  const otherUsers = users.filter(user => user.id !== currentUserId);
  const onlineUsers = users.filter(user => user.status === 'online');

  // NOTE: Typing indicators handled by parent component
  // These functions kept for potential future use
  /*
  const _addTypingUser = (userId: string, userName: string) => {
    setTypingUsers(prev => {
      const filtered = prev.filter(user => user.userId !== userId);
      return [...filtered, { userId, userName, timestamp: Date.now() }];
    });
  };

  const _removeTypingUser = (userId: string) => {
    setTypingUsers(prev => prev.filter(user => user.userId !== userId));
  };
  */

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  if (compact) {
    return (
      <Card className={cn('p-3 bg-white/10 backdrop-blur-md border border-white/20', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">{onlineUsers.length}</span>
            </div>
            
            <div className="flex -space-x-1">
              {users.slice(0, 3).map(user => (
                <div
                  key={user.id}
                  className="relative w-6 h-6 rounded-full border-2 border-white/20 overflow-hidden"
                  title={user.name}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div 
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white',
                      getStatusColor(user.status)
                    )}
                  />
                </div>
              ))}
              {users.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-600 border-2 border-white/20 flex items-center justify-center">
                  <span className="text-xs text-white">+{users.length - 3}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(sessionDuration)}</span>
          </div>
        </div>

        {/* Typing indicators */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 text-xs text-gray-400"
            >
              {typingUsers.length === 1 ? (
                <span>{typingUsers[0].userName} is typing...</span>
              ) : (
                <span>{typingUsers.length} users are typing...</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  }

  return (
    <Card className={cn('p-4 bg-white/10 backdrop-blur-md border border-white/20', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Participants</h3>
          <span className="text-sm text-gray-400">({onlineUsers.length} online)</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(sessionDuration)}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
          </div>

          {onInviteUser && (
            <Button
              onClick={onInviteUser}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="Invite user"
            >
              <UserPlus className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Current User */}
      {currentUser && (
        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-400/30">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {currentUser.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div 
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white',
                  getStatusColor(currentUser.status)
                )}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-white">{currentUser.name}</span>
                <span className="text-xs text-blue-400">(You)</span>
                {getRoleIcon(currentUser.role)}
              </div>
              <div className="text-xs text-gray-400 capitalize">{currentUser.status}</div>
            </div>
          </div>
        </div>
      )}

      {/* Other Users */}
      <div className="space-y-2">
        <AnimatePresence>
          {otherUsers.map(user => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div 
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white',
                      getStatusColor(user.status)
                    )}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white">{user.name}</span>
                    {getRoleIcon(user.role)}
                    {typingUsers.some(tu => tu.userId === user.id) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex space-x-1"
                      >
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </motion.div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{user.status}</div>
                  {expandedUsers.has(user.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 text-xs text-gray-400"
                    >
                      Last active: {new Date(user.lastActivity).toLocaleTimeString()}
                    </motion.div>
                  )}
                </div>

                {onUserAction && currentUser?.role === 'instructor' && (
                  <div className="flex items-center space-x-1">
                    <Button
                      onClick={() => toggleUserExpanded(user.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* User actions for instructors */}
              <AnimatePresence>
                {expandedUsers.has(user.id) && currentUser?.role === 'instructor' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 flex space-x-2"
                  >
                    <Button
                      onClick={() => onUserAction?.(user.id, 'mute')}
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                    >
                      <VolumeX className="w-3 h-3 mr-1" />
                      Mute
                    </Button>
                    <Button
                      onClick={() => onUserAction?.(user.id, 'promote')}
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      Promote
                    </Button>
                    <Button
                      onClick={() => onUserAction?.(user.id, 'kick')}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      <UserMinus className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Typing indicators */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-2 rounded-lg bg-blue-500/10 border border-blue-400/30"
          >
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">
                {typingUsers.length === 1 ? (
                  `${typingUsers[0].userName} is typing...`
                ) : typingUsers.length === 2 ? (
                  `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`
                ) : (
                  `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing...`
                )}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {otherUsers.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No other participants</p>
          {onInviteUser && (
            <Button
              onClick={onInviteUser}
              variant="ghost"
              size="sm"
              className="mt-2"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite someone
            </Button>
          )}
        </div>
      )}
    </Card>
  );

  // Note: If you need to expose methods, use forwardRef and pass ref as a prop
}
