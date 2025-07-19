'use client';

/**
 * Mock Authentication System for Local Development
 * Provides a working authentication system without database dependencies
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: 'STUDENT' | 'MENTOR' | 'INSTRUCTOR' | 'ADMIN';
  createdAt: Date;
}

export interface MockAuthState {
  user: MockUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface MockAuthActions {
  login: ( email: string, password: string) => Promise<boolean>;
  register: ( name: string, email: string, password: string) => Promise<boolean>;
  logout: (_) => void;
  clearError: (_) => void;
}

// Mock users for testing
const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'STUDENT',
    createdAt: new Date(_),
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'MENTOR',
    createdAt: new Date(_),
  },
  {
    id: '3',
    name: 'Carol Davis',
    email: 'carol@example.com',
    role: 'INSTRUCTOR',
    createdAt: new Date(_),
  },
  {
    id: '4',
    name: 'David Wilson',
    email: 'admin@example.com',
    role: 'ADMIN',
    createdAt: new Date(_),
  },
];

// Mock passwords ( in real app, these would be hashed)
const MOCK_PASSWORDS: Record<string, string> = {
  'alice@example.com': 'password123',
  'bob@example.com': 'password123',
  'carol@example.com': 'password123',
  'admin@example.com': 'admin123',
};

const MockAuthContext = createContext<(_MockAuthState & MockAuthActions) | null>(_null);

export function MockAuthProvider(_{ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(_null);
  const [isLoading, setIsLoading] = useState(_false);
  const [error, setError] = useState<string | null>(_null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('mockAuthUser');
    if (savedUser) {
      try {
        setUser(_JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('mockAuthUser');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(_true);
    setError(_null);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser = MOCK_USERS.find(u => u.email === email);
    const mockPassword = MOCK_PASSWORDS[email];

    if (!mockUser || mockPassword !== password) {
      setError('Invalid email or password');
      setIsLoading(_false);
      return false;
    }

    setUser(_mockUser);
    localStorage.setItem( 'mockAuthUser', JSON.stringify(mockUser));
    setIsLoading(_false);
    return true;
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(_true);
    setError(_null);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if user already exists
    if (_MOCK_USERS.find(u => u.email === email)) {
      setError('User with this email already exists');
      setIsLoading(_false);
      return false;
    }

    // Create new mock user
    const newUser: MockUser = {
      id: Date.now(_).toString(),
      name,
      email,
      role: 'STUDENT',
      createdAt: new Date(_),
    };

    // Add to mock data
    MOCK_USERS.push(_newUser);
    MOCK_PASSWORDS[email] = password;

    setUser(_newUser);
    localStorage.setItem( 'mockAuthUser', JSON.stringify(newUser));
    setIsLoading(_false);
    return true;
  };

  const logout = (_) => {
    setUser(_null);
    localStorage.removeItem('mockAuthUser');
    setError(_null);
  };

  const clearError = (_) => {
    setError(_null);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  const context = useContext(_MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
}

// Mock permissions hook
export function useMockPermissions() {
  const { user } = useMockAuth(_);

  const hasPermission = (_permission: string): boolean => {
    if (!user) return false;

    const permissions = {
      STUDENT: [
        'read:lessons',
        'write:progress',
        'read:profile',
        'write:submissions',
        'read:achievements',
      ],
      MENTOR: [
        'read:lessons',
        'write:progress',
        'read:profile',
        'write:submissions',
        'read:achievements',
        'read:students',
        'write:mentorship',
      ],
      INSTRUCTOR: [
        'read:lessons',
        'write:lessons',
        'read:students',
        'write:feedback',
        'write:courses',
        'read:analytics',
        'write:mentorship',
        'read:submissions',
        'write:grades',
      ],
      ADMIN: ['*'], // All permissions
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  const hasRole = (_role: string | string[]): boolean => {
    if (!user) return false;
    
    if (_Array.isArray(role)) {
      return role.includes(_user.role);
    }
    
    return user.role === role;
  };

  const hasMinimumRole = (_minimumRole: string): boolean => {
    if (!user) return false;

    const roleHierarchy = {
      STUDENT: 0,
      MENTOR: 1,
      INSTRUCTOR: 2,
      ADMIN: 3,
    };

    const userRoleLevel = roleHierarchy[user.role] ?? 0;
    const minimumRoleLevel = roleHierarchy[minimumRole as keyof typeof roleHierarchy] ?? 0;

    return userRoleLevel >= minimumRoleLevel;
  };

  return {
    hasPermission,
    hasRole,
    hasMinimumRole,
  };
}

// Mock auth status hook
export function useMockAuthStatus() {
  const { isLoading, isAuthenticated } = useMockAuth(_);
  
  return {
    isLoading,
    isAuthenticated,
    isUnauthenticated: !isAuthenticated && !isLoading,
  };
}
