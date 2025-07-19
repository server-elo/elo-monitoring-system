'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, LogOut, Settings, Crown, Star } from 'lucide-react';

interface ExtendedUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR' | 'ADMIN';
}


interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR' | 'ADMIN';
  level: 'beginner' | 'intermediate' | 'advanced';
  xp: number;
  streak: number;
  achievements: string[];
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    language: string;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (provider?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  getRoleColor: () => string;
  getXPProgress: () => { current: number; next: number; percentage: number };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface EnhancedAuthProviderProps {
  children: ReactNode;
}

export const EnhancedAuthProvider: React.FC<EnhancedAuthProviderProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status === 'loading') {
        setIsLoading(true);
        return;
      }

      if (session?.user) {
        try {
          // Fetch complete user profile from database
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const profileData = await response.json();

            // Transform database profile to UserProfile interface
            const userProfile: UserProfile = {
              id: session.user.id || '',
              name: session.user.name || '',
              email: session.user.email || '',
              image: session.user.image || undefined,
              role: (session.user as ExtendedUser).role || 'STUDENT',
              level: mapSkillLevelToLevel(profileData.profile?.skillLevel || 'BEGINNER'),
              xp: profileData.profile?.totalXP || 0,
              streak: profileData.profile?.streak || 0,
              achievements: profileData.achievements?.map((a: { achievement: { title: string } }) => a.achievement.title) || [],
              preferences: {
                theme: profileData.profile?.preferences?.theme || 'auto',
                notifications: profileData.profile?.preferences?.notifications ?? true,
                language: profileData.profile?.preferences?.language || 'en'
              }
            };
            setUser(userProfile);
          } else {
            // Fallback to session data if profile fetch fails
            const userProfile: UserProfile = {
              id: session.user.id || '',
              name: session.user.name || '',
              email: session.user.email || '',
              image: session.user.image || undefined,
              role: (session.user as ExtendedUser).role || 'STUDENT',
              level: 'beginner',
              xp: 0,
              streak: 0,
              achievements: [],
              preferences: {
                theme: 'auto',
                notifications: true,
                language: 'en'
              }
            };
            setUser(userProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to session data
          const userProfile: UserProfile = {
            id: session.user.id || '',
            name: session.user.name || '',
            email: session.user.email || '',
            image: session.user.image || undefined,
            role: (session.user as ExtendedUser).role || 'STUDENT',
            level: 'beginner',
            xp: 0,
            streak: 0,
            achievements: [],
            preferences: {
              theme: 'auto',
              notifications: true,
              language: 'en'
            }
          };
          setUser(userProfile);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    };

    fetchUserProfile();
  }, [session, status]);

  // Helper function to map Prisma SkillLevel to component level
  const mapSkillLevelToLevel = (skillLevel: string): 'beginner' | 'intermediate' | 'advanced' => {
    switch (skillLevel) {
      case 'INTERMEDIATE': return 'intermediate';
      case 'ADVANCED': return 'advanced';
      case 'EXPERT': return 'advanced';
      default: return 'beginner';
    }
  };

  const login = async (provider: string = 'github') => {
    try {
      await signIn(provider, { callbackUrl: '/' });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      // Transform updates to match database schema
      const profileUpdates = {
        bio: updates.name !== user.name ? `Updated profile for ${updates.name}` : undefined,
        skillLevel: updates.level ? mapLevelToSkillLevel(updates.level) : undefined,
        preferences: updates.preferences ? {
          ...user.preferences,
          ...updates.preferences
        } : undefined,
      };

      // Make real API call to update profile
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileUpdates)
      });

      if (response.ok) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Helper function to map component level to Prisma SkillLevel
  const mapLevelToSkillLevel = (level: string): string => {
    switch (level) {
      case 'intermediate': return 'INTERMEDIATE';
      case 'advanced': return 'ADVANCED';
      default: return 'BEGINNER';
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const permissions = {
      STUDENT: ['read:lessons', 'write:progress', 'read:profile', 'write:submissions'],
      MENTOR: ['read:lessons', 'write:progress', 'read:profile', 'write:submissions', 'read:students', 'write:mentorship'],
      INSTRUCTOR: ['read:lessons', 'write:lessons', 'read:students', 'write:feedback', 'write:courses', 'read:analytics'],
      ADMIN: ['*'] // All permissions
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  const getRoleColor = (): string => {
    if (!user) return 'text-gray-400';

    const colors = {
      STUDENT: 'text-blue-400',
      MENTOR: 'text-cyan-400',
      INSTRUCTOR: 'text-green-400',
      ADMIN: 'text-purple-400'
    };

    return colors[user.role] || 'text-gray-400';
  };

  const getXPProgress = () => {
    if (!user) return { current: 0, next: 100, percentage: 0 };
    
    const level = user.level;
    const xp = user.xp;
    
    // XP thresholds for each level
    const thresholds = {
      beginner: { min: 0, max: 1000 },
      intermediate: { min: 1000, max: 5000 },
      advanced: { min: 5000, max: 10000 }
    };
    
    const threshold = thresholds[level];
    const current = xp - threshold.min;
    const next = threshold.max - threshold.min;
    const percentage = Math.min((current / next) * 100, 100);
    
    return { current, next, percentage };
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateProfile,
    hasPermission,
    getRoleColor,
    getXPProgress
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an EnhancedAuthProvider');
  }
  return context;
};

// Enhanced User Profile Component
interface UserProfileCardProps {
  className?: string;
  showDetails?: boolean;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ 
  className = '', 
  showDetails = true 
}) => {
  const { user, getRoleColor, getXPProgress, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const xpProgress = getXPProgress();
  const roleColor = getRoleColor();

  return (
    <div className={`relative ${className}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 cursor-pointer"
        onClick={() => setShowMenu(!showMenu)}
      >
        {/* Avatar */}
        <div className="relative">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-10 h-10 rounded-full border-2 border-white/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
          
          {/* Role Badge */}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
            user.role === 'ADMIN' ? 'bg-purple-500' :
            user.role === 'INSTRUCTOR' ? 'bg-green-500' :
            user.role === 'MENTOR' ? 'bg-cyan-500' : 'bg-blue-500'
          }`}>
            {user.role === 'ADMIN' ? <Crown className="w-2 h-2 text-white" /> :
             user.role === 'INSTRUCTOR' ? <Star className="w-2 h-2 text-white" /> :
             user.role === 'MENTOR' ? <User className="w-2 h-2 text-white" /> :
             <Shield className="w-2 h-2 text-white" />}
          </div>
        </div>

        {/* User Info */}
        {showDetails && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${roleColor}`}>
                {user.role}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${xpProgress.percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{user.xp} XP</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-white/10">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{user.xp}</div>
                  <div className="text-xs text-gray-400">XP</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{user.streak}</div>
                  <div className="text-xs text-gray-400">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">{user.achievements.length}</div>
                  <div className="text-xs text-gray-400">Badges</div>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={() => {/* Navigate to profile */}}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Profile Settings</span>
              </button>
              
              <button
                onClick={() => {
                  logout();
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Permission Guard Component
interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null
}) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Role Badge Component
interface RoleBadgeProps {
  role: UserProfile['role'];
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const roleConfig = {
    STUDENT: { color: 'bg-blue-500/20 text-blue-300', icon: Shield },
    MENTOR: { color: 'bg-cyan-500/20 text-cyan-300', icon: User },
    INSTRUCTOR: { color: 'bg-green-500/20 text-green-300', icon: Star },
    ADMIN: { color: 'bg-purple-500/20 text-purple-300', icon: Crown }
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center space-x-1 rounded-full ${config.color} ${sizeClasses[size]}`}>
      <Icon className="w-3 h-3" />
      <span className="capitalize">{role}</span>
    </span>
  );
};

export default EnhancedAuthProvider;
