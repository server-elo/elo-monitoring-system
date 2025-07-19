'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CollaborationUser } from '@/lib/collaboration/CollaborationClient';

interface PresenceState {
  users: CollaborationUser[];
  currentUser: CollaborationUser | null;
  onlineCount: number;
  typingUsers: string[];
  sessionDuration: number;
}

interface PresenceHookReturn extends PresenceState {
  updateUserStatus: (userId: string, status: 'online' | 'idle' | 'offline') => void;
  addUser: (user: CollaborationUser) => void;
  removeUser: (userId: string) => void;
  updateUserCursor: (userId: string, cursor: { line: number; column: number; selection?: { start: { line: number; column: number }; end: { line: number; column: number } } }) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
  updateUserRole: (userId: string, role: 'instructor' | 'student' | 'observer') => void;
  getUserById: (userId: string) => CollaborationUser | undefined;
  getInstructors: () => CollaborationUser[];
  getStudents: () => CollaborationUser[];
  resetSession: () => void;
}

interface PresenceOptions {
  currentUserId: string;
  idleTimeout?: number; // milliseconds
  offlineTimeout?: number; // milliseconds
  onUserJoined?: (user: CollaborationUser) => void;
  onUserLeft?: (userId: string) => void;
  onUserStatusChanged?: (userId: string, status: string) => void;
  onTypingChanged?: (userId: string, isTyping: boolean) => void;
}

export function useUserPresence({
  currentUserId,
  idleTimeout = 300000, // 5 minutes
  offlineTimeout = 600000, // 10 minutes
  onUserJoined,
  onUserLeft,
  onUserStatusChanged,
  onTypingChanged
}: PresenceOptions): PresenceHookReturn {
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [sessionStartTime] = useState<Date>(new Date());
  const [sessionDuration, setSessionDuration] = useState(0);

  const activityTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const typingTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Update session duration every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStartTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      activityTimers.current.forEach(timer => clearTimeout(timer));
      typingTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const updateUserActivity = useCallback((userId: string) => {
    // Clear existing timer
    const existingTimer = activityTimers.current.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Update last activity
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, lastActivity: new Date(), status: 'online' }
        : user
    ));

    // Set idle timer
    const idleTimer = setTimeout(() => {
      setUsers(prev => prev.map(user => 
        user.id === userId && user.status === 'online'
          ? { ...user, status: 'idle' }
          : user
      ));
      onUserStatusChanged?.(userId, 'idle');

      // Set offline timer
      const offlineTimer = setTimeout(() => {
        setUsers(prev => prev.map(user => 
          user.id === userId && user.status === 'idle'
            ? { ...user, status: 'offline' }
            : user
        ));
        onUserStatusChanged?.(userId, 'offline');
      }, offlineTimeout - idleTimeout);

      activityTimers.current.set(userId, offlineTimer);
    }, idleTimeout);

    activityTimers.current.set(userId, idleTimer);
  }, [idleTimeout, offlineTimeout, onUserStatusChanged]);

  const updateUserStatus = useCallback((userId: string, status: 'online' | 'idle' | 'offline') => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status, lastActivity: new Date() }
        : user
    ));

    onUserStatusChanged?.(userId, status);

    // Reset activity timer if coming back online
    if (status === 'online') {
      updateUserActivity(userId);
    }
  }, [updateUserActivity, onUserStatusChanged]);

  const addUser = useCallback((user: CollaborationUser) => {
    setUsers(prev => {
      // Check if user already exists
      const existingIndex = prev.findIndex(u => u.id === user.id);
      if (existingIndex >= 0) {
        // Update existing user
        const updated = [...prev];
        updated[existingIndex] = { ...user, lastActivity: new Date() };
        return updated;
      } else {
        // Add new user
        onUserJoined?.(user);
        return [...prev, { ...user, lastActivity: new Date() }];
      }
    });

    // Start activity tracking for new user
    if (user.status === 'online') {
      updateUserActivity(user.id);
    }
  }, [onUserJoined, updateUserActivity]);

  const removeUser = useCallback((userId: string) => {
    setUsers(prev => {
      const filtered = prev.filter(user => user.id !== userId);
      if (filtered.length !== prev.length) {
        onUserLeft?.(userId);
      }
      return filtered;
    });

    // Clear timers for removed user
    const timer = activityTimers.current.get(userId);
    if (timer) {
      clearTimeout(timer);
      activityTimers.current.delete(userId);
    }

    const typingTimer = typingTimers.current.get(userId);
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimers.current.delete(userId);
    }

    // Remove from typing users
    setTypingUsers(prev => prev.filter(id => id !== userId));
  }, [onUserLeft]);

  const updateUserCursor = useCallback((userId: string, cursor: { line: number; column: number; selection?: { start: { line: number; column: number }; end: { line: number; column: number } } }) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, cursor, lastActivity: new Date() }
        : user
    ));

    // Update activity
    updateUserActivity(userId);
  }, [updateUserActivity]);

  const setTyping = useCallback((userId: string, isTyping: boolean) => {
    if (isTyping) {
      setTypingUsers(prev => {
        if (!prev.includes(userId)) {
          onTypingChanged?.(userId, true);
          return [...prev, userId];
        }
        return prev;
      });

      // Clear existing typing timer
      const existingTimer = typingTimers.current.get(userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set timer to auto-remove typing indicator
      const timer = setTimeout(() => {
        setTypingUsers(prev => {
          const filtered = prev.filter(id => id !== userId);
          if (filtered.length !== prev.length) {
            onTypingChanged?.(userId, false);
          }
          return filtered;
        });
        typingTimers.current.delete(userId);
      }, 3000); // Remove after 3 seconds of inactivity

      typingTimers.current.set(userId, timer);
    } else {
      setTypingUsers(prev => {
        const filtered = prev.filter(id => id !== userId);
        if (filtered.length !== prev.length) {
          onTypingChanged?.(userId, false);
        }
        return filtered;
      });

      // Clear typing timer
      const timer = typingTimers.current.get(userId);
      if (timer) {
        clearTimeout(timer);
        typingTimers.current.delete(userId);
      }
    }

    // Update activity
    updateUserActivity(userId);
  }, [updateUserActivity, onTypingChanged]);

  const updateUserRole = useCallback((userId: string, role: 'instructor' | 'student' | 'observer') => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, role }
        : user
    ));
  }, []);

  const getUserById = useCallback((userId: string): CollaborationUser | undefined => {
    return users.find(user => user.id === userId);
  }, [users]);

  const getInstructors = useCallback((): CollaborationUser[] => {
    return users.filter(user => user.role === 'instructor');
  }, [users]);

  const getStudents = useCallback((): CollaborationUser[] => {
    return users.filter(user => user.role === 'student');
  }, [users]);

  const resetSession = useCallback(() => {
    setUsers([]);
    setTypingUsers([]);
    setSessionDuration(0);
    
    // Clear all timers
    activityTimers.current.forEach(timer => clearTimeout(timer));
    typingTimers.current.forEach(timer => clearTimeout(timer));
    activityTimers.current.clear();
    typingTimers.current.clear();
  }, []);

  // Computed values
  const currentUser = users.find(user => user.id === currentUserId) || null;
  const onlineCount = users.filter(user => user.status === 'online').length;

  return {
    users,
    currentUser,
    onlineCount,
    typingUsers,
    sessionDuration,
    updateUserStatus,
    addUser,
    removeUser,
    updateUserCursor,
    setTyping,
    updateUserRole,
    getUserById,
    getInstructors,
    getStudents,
    resetSession
  };
}

// Hook for managing user colors
export function useUserColors() {
  const [assignedColors, setAssignedColors] = useState<Map<string, string>>(new Map());
  
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];

  const assignColor = useCallback((userId: string): string => {
    if (assignedColors.has(userId)) {
      return assignedColors.get(userId)!;
    }

    // Find an unused color
    const usedColors = new Set(assignedColors.values());
    const availableColors = colors.filter(color => !usedColors.has(color));
    
    const color = availableColors.length > 0 
      ? availableColors[0] 
      : colors[assignedColors.size % colors.length];

    setAssignedColors(prev => new Map(prev).set(userId, color));
    return color;
  }, [assignedColors]);

  const removeColor = useCallback((userId: string) => {
    setAssignedColors(prev => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  }, []);

  const resetColors = useCallback(() => {
    setAssignedColors(new Map());
  }, []);

  return {
    assignColor,
    removeColor,
    resetColors,
    assignedColors: Object.fromEntries(assignedColors)
  };
}
