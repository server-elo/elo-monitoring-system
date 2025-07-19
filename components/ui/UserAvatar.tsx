'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, Clock, Shield, Crown, ChevronDown, RefreshCw, AlertTriangle, CheckCircle, WifiOff } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { SessionManager, SessionStatus } from '@/lib/auth/sessionManager';
import { useLearning } from '@/lib/context/LearningContext';
import { EnhancedButton } from './EnhancedButton';
import { XPCounter } from '@/components/xp/XPCounter';
import { LevelProgressBar } from '@/components/xp/ProgressBar';
import { getLevelInfo } from '@/lib/achievements/data';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  className?: string;
  showSessionStatus?: boolean;
  showDropdown?: boolean;
}

export function UserAvatar({
  className,
  showSessionStatus = true,
  showDropdown = true
}: UserAvatarProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const { state: learningState } = useLearning();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [sessionManager] = useState(() => SessionManager.getInstance());
  const [timeDisplay, setTimeDisplay] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Session status monitoring
  useEffect(() => {
    if (!isAuthenticated) return;

    const updateStatus = () => {
      const status = sessionManager.getSessionStatus();
      setSessionStatus(status);
      
      // Update time display
      if (status.isValid && status.timeUntilExpiry > 0) {
        const minutes = Math.floor(status.timeUntilExpiry / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
          setTimeDisplay(`${hours}h ${minutes % 60}m`);
        } else {
          setTimeDisplay(`${minutes}m`);
        }
      } else {
        setTimeDisplay('Expired');
      }
    };

    // Initial status
    updateStatus();

    // Listen for status changes
    const unsubscribeStatus = sessionManager.addStatusListener(updateStatus);
    
    // Update every minute
    const interval = setInterval(updateStatus, 60000);

    return () => {
      unsubscribeStatus();
      clearInterval(interval);
    };
  }, [isAuthenticated, sessionManager]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  // Get role icon and color
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { icon: Crown, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
      case 'INSTRUCTOR':
        return { icon: Shield, color: 'text-purple-400', bgColor: 'bg-purple-500/20' };
      case 'MENTOR':
        return { icon: User, color: 'text-green-400', bgColor: 'bg-green-500/20' };
      default:
        return { icon: User, color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
    }
  };

  // Get session status color and icon
  const getSessionStatusInfo = () => {
    if (!sessionStatus) {
      return { color: 'text-gray-400', bgColor: 'bg-gray-500/20', icon: WifiOff };
    }

    if (!sessionStatus.isValid) {
      return { color: 'text-red-400', bgColor: 'bg-red-500/20', icon: AlertTriangle };
    }

    if (sessionStatus.refreshInProgress) {
      return { color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: RefreshCw };
    }

    if (sessionStatus.isExpiringSoon) {
      return { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: Clock };
    }

    return { color: 'text-green-400', bgColor: 'bg-green-500/20', icon: CheckCircle };
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const roleInfo = getRoleInfo(user.role);
  const statusInfo = getSessionStatusInfo();
  const RoleIcon = roleInfo.icon;
  const StatusIcon = statusInfo.icon;

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Avatar Button */}
      <motion.button
        onClick={() => showDropdown && setIsOpen(!isOpen)}
        className={cn(
          'flex items-center space-x-3 p-2 rounded-lg transition-all duration-200',
          'bg-white/10 backdrop-blur-md border border-white/20',
          'hover:bg-white/20 hover:border-white/30',
          showDropdown && 'cursor-pointer',
          !showDropdown && 'cursor-default'
        )}
        whileHover={{ scale: showDropdown ? 1.02 : 1 }}
        whileTap={{ scale: showDropdown ? 0.98 : 1 }}
        aria-label={`User menu for ${user.name}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {/* Avatar */}
        <div className="relative">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            roleInfo.bgColor
          )}>
            {user.image ? (
              <img 
                src={user.image} 
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <RoleIcon className={cn('w-5 h-5', roleInfo.color)} />
            )}
          </div>
          
          {/* Session Status Indicator */}
          {showSessionStatus && (
            <div className={cn(
              'absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center',
              'border-2 border-slate-900',
              statusInfo.bgColor
            )}>
              <StatusIcon className={cn('w-2.5 h-2.5', statusInfo.color)} />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium text-white truncate">
            {user.name}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {user.role}
          </div>
        </div>

        {/* Session Time (if expiring soon) */}
        {showSessionStatus && sessionStatus?.isExpiringSoon && (
          <div className="text-xs text-yellow-400 font-mono">
            {timeDisplay}
          </div>
        )}

        {/* Dropdown Arrow */}
        {showDropdown && (
          <ChevronDown className={cn(
            'w-4 h-4 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} />
        )}
      </motion.button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'absolute top-full right-0 mt-2 w-80 z-50',
                'bg-white/10 backdrop-blur-md border border-white/20 rounded-xl',
                'shadow-xl shadow-black/20'
              )}
              role="menu"
              aria-orientation="vertical"
            >
              {/* User Info Section */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    roleInfo.bgColor
                  )}>
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <RoleIcon className={cn('w-6 h-6', roleInfo.color)} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {user.name}
                    </div>
                    <div className="text-gray-400 text-sm truncate">
                      {user.email}
                    </div>
                    <div className={cn(
                      'text-xs font-medium mt-1 px-2 py-1 rounded-full inline-block',
                      roleInfo.bgColor,
                      roleInfo.color
                    )}>
                      {user.role}
                    </div>
                  </div>
                </div>
              </div>

              {/* XP and Level Section */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">Progress</span>
                  <XPCounter
                    currentXP={learningState.xp}
                    previousXP={learningState.previousXP}
                    size="sm"
                    showIcon={true}
                    showLabel={true}
                    color="yellow"
                  />
                </div>

                <LevelProgressBar
                  currentLevel={learningState.level}
                  currentXP={learningState.xp}
                  xpForCurrentLevel={getLevelInfo(learningState.xp).currentLevelInfo?.xpRequired || 0}
                  xpForNextLevel={getLevelInfo(learningState.xp).nextLevelXP}
                  previousXP={learningState.previousXP}
                />

                {learningState.sessionXP > 0 && (
                  <div className="mt-2 text-xs text-gray-400 flex justify-between">
                    <span>Session XP:</span>
                    <span className="text-yellow-400 font-mono">+{learningState.sessionXP}</span>
                  </div>
                )}
              </div>

              {/* Session Status Section */}
              {showSessionStatus && sessionStatus && (
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Session Status</span>
                    <div className="flex items-center space-x-1">
                      <StatusIcon className={cn('w-3 h-3', statusInfo.color)} />
                      <span className={cn('text-xs font-medium', statusInfo.color)}>
                        {sessionStatus.isValid ? 'Active' : 'Expired'}
                      </span>
                    </div>
                  </div>

                  {sessionStatus.isValid && (
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>Expires in:</span>
                        <span className={cn(
                          'font-mono',
                          sessionStatus.isExpiringSoon ? 'text-yellow-400' : 'text-gray-300'
                        )}>
                          {timeDisplay}
                        </span>
                      </div>

                      {sessionStatus.refreshInProgress && (
                        <div className="flex items-center space-x-1 text-blue-400">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Refreshing session...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Menu Items */}
              <div className="p-2">
                <EnhancedButton
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to profile
                  }}
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10"
                  touchTarget
                  role="menuitem"
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </EnhancedButton>
                
                <EnhancedButton
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to settings
                  }}
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10"
                  touchTarget
                  role="menuitem"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </EnhancedButton>
                
                <div className="border-t border-white/10 my-2" />
                
                <EnhancedButton
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:bg-red-500/10"
                  touchTarget
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </EnhancedButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
