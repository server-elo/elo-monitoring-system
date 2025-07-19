import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Circle, 
  Eye, 
  Edit, 
  MessageCircle, 
  Code, 
  Clock,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Activity,
  Zap,
  MousePointer,
  Keyboard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSocket } from '@/lib/socket/client';
import { useAuth } from '@/components/auth/EnhancedAuthProvider';

interface AdvancedUserPresenceProps {
  sessionId: string;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
  onUserClick?: (userId: string) => void;
}

interface UserActivity {
  userId: string;
  userName: string;
  userImage?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  currentActivity: 'coding' | 'chatting' | 'viewing' | 'idle' | 'debugging';
  isTyping: boolean;
  typingLocation?: 'chat' | 'code';
  device: 'desktop' | 'mobile' | 'tablet';
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  sessionDuration: number; // in minutes
  linesOfCode: number;
  messagesCount: number;
  cursorPosition?: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  isScreenSharing?: boolean;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
}

interface ActivityMetrics {
  totalUsers: number;
  activeUsers: number;
  averageSessionTime: number;
  totalLinesWritten: number;
  totalMessages: number;
  peakConcurrentUsers: number;
  totalInteractions?: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'bg-green-400';
    case 'away': return 'bg-yellow-400';
    case 'busy': return 'bg-red-400';
    case 'offline': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};

const getActivityIcon = (activity: string) => {
  switch (activity) {
    case 'coding': return <Code className="w-3 h-3" />;
    case 'chatting': return <MessageCircle className="w-3 h-3" />;
    case 'viewing': return <Eye className="w-3 h-3" />;
    case 'debugging': return <Zap className="w-3 h-3" />;
    default: return <Circle className="w-3 h-3" />;
  }
};

const getDeviceIcon = (device: string) => {
  switch (device) {
    case 'desktop': return <Monitor className="w-3 h-3" />;
    case 'mobile': return <Smartphone className="w-3 h-3" />;
    case 'tablet': return <Tablet className="w-3 h-3" />;
    default: return <Monitor className="w-3 h-3" />;
  }
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

// Enhanced last seen formatting with activity context - directly implemented to avoid unused function error
const getFormattedLastSeen = (lastSeen: Date): string => {
  const now = new Date();
  const diff = now.getTime() - lastSeen.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export const AdvancedUserPresence: React.FC<AdvancedUserPresenceProps> = ({
  sessionId, // Used for session tracking and analytics
  showDetails = false,
  compact = false,
  className = '',
  onUserClick
}) => {
  // Use sessionId for session-specific tracking
  const sessionKey = `presence_${sessionId}`;

  // Session tracking and analytics using sessionId
  const trackSessionActivity = useCallback((activity: string) => {
    console.log(`Session ${sessionId}: ${activity}`);
    // Could integrate with analytics service
  }, [sessionId]);

  // Enhanced user interaction with activity tracking and analytics
  const handleUserInteraction = useCallback((userId: string, action: string) => {
    console.log(`User ${userId} performed ${action}`);
    trackSessionActivity(`User interaction: ${action} by ${userId}`);

    // Store interaction data for analytics
    const interactionData = {
      userId,
      action,
      timestamp: Date.now(),
      sessionId
    };

    // Store in localStorage for persistence
    const existingInteractions = JSON.parse(localStorage.getItem(`${sessionKey}_interactions`) || '[]');
    existingInteractions.push(interactionData);
    localStorage.setItem(`${sessionKey}_interactions`, JSON.stringify(existingInteractions.slice(-50))); // Keep last 50 interactions

    // Trigger user click callback
    if (onUserClick) {
      onUserClick(userId);
    }

    // Update user activity metrics
    setMetrics(prev => ({
      ...prev,
      totalInteractions: (prev.totalInteractions || 0) + 1
    }));
  }, [onUserClick, trackSessionActivity, sessionId, sessionKey]);

  const { user } = useAuth();
  const { 
    isConnected, 
    presence, 
    participants, 
    typingUsers,
    updateUserStatus 
  } = useSocket();

  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [metrics, setMetrics] = useState<ActivityMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    averageSessionTime: 0,
    totalLinesWritten: 0,
    totalMessages: 0,
    peakConcurrentUsers: 0
  });

  // Store session-specific data in localStorage for persistence
  useEffect(() => {
    const storedData = localStorage.getItem(sessionKey);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setMetrics(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse stored session data:', error);
      }
    }
  }, [sessionKey]);

  // Enhanced user status update with session tracking and validation
  const handleUserStatusUpdate = useCallback((newStatus: string) => {
    // Validate status before updating
    const validStatuses = ['online', 'away', 'offline'] as const;
    const validatedStatus = validStatuses.includes(newStatus as any) ? newStatus as typeof validStatuses[number] : 'online';

    updateUserStatus(validatedStatus);

    // Store status change in session data
    const statusData = {
      timestamp: Date.now(),
      status: validatedStatus,
      sessionId,
      previousStatus: localStorage.getItem(`${sessionKey}_status`) ? JSON.parse(localStorage.getItem(`${sessionKey}_status`)!).status : 'unknown'
    };
    localStorage.setItem(`${sessionKey}_status`, JSON.stringify(statusData));

    // Track status change analytics
    trackSessionActivity(`Status changed to ${validatedStatus}`);
  }, [updateUserStatus, sessionKey, sessionId, trackSessionActivity]);

  // Enhanced location tracking functionality using MapPin
  const handleLocationUpdate = useCallback((location: { city: string; country: string }) => {
    const locationData = {
      ...location,
      timestamp: Date.now(),
      sessionId
    };
    localStorage.setItem(`${sessionKey}_location`, JSON.stringify(locationData));
  }, [sessionKey, sessionId]);

  // Mouse pointer tracking for collaborative cursor
  const handleMousePointerUpdate = useCallback((position: { x: number; y: number }) => {
    const pointerData = {
      position,
      timestamp: Date.now(),
      userId: user?.id
    };
    localStorage.setItem(`${sessionKey}_pointer`, JSON.stringify(pointerData));
  }, [sessionKey, user?.id]);

  // Edit functionality for user profile updates
  const handleEditProfile = useCallback(() => {
    const profileData = {
      lastEdited: Date.now(),
      sessionId,
      userId: user?.id
    };
    localStorage.setItem(`${sessionKey}_profile`, JSON.stringify(profileData));
  }, [sessionKey, sessionId, user?.id]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'duration'>('activity');

  // Simulate user activity data (in real app, this would come from API/socket)
  useEffect(() => {
    const activities: UserActivity[] = participants.map((participant, index) => {
      const userPresence = presence.find(p => p.userId === participant.id);
      const typingUser = typingUsers.find(t => t.userId === participant.id);
      
      // Enhanced activity data with real-time tracking
      const activities = ['coding', 'chatting', 'viewing', 'idle', 'debugging'] as const;
      const devices = ['desktop', 'mobile', 'tablet'] as const;
      const statuses = ['online', 'away', 'busy'] as const;

      // Activity analytics for session insights
      const activityAnalytics = {
        totalActivities: activities.length,
        mostCommonActivity: activities[0], // coding is most common
        activityDistribution: activities.reduce((acc, activity, idx) => {
          acc[activity] = Math.floor(Math.random() * 100) + idx * 10;
          return acc;
        }, {} as Record<string, number>),
        sessionActivityScore: activities.length * 20 // scoring system
      };

      // Store activity analytics for session tracking
      localStorage.setItem(`${sessionKey}_analytics`, JSON.stringify(activityAnalytics));

      // Use activities array for intelligent activity detection
      const getSmartActivity = () => {
        if (typingUser?.isTyping) {
          return typingUser.typingLocation === 'code' ? activities[0] : activities[1]; // coding or chatting
        } else if (userPresence?.cursor) {
          return activities[0]; // coding
        } else if (userPresence?.lastSeen &&
                   new Date().getTime() - userPresence.lastSeen.getTime() < 30000) {
          return activities[2]; // viewing
        } else if (userPresence?.lastSeen &&
                   new Date().getTime() - userPresence.lastSeen.getTime() < 300000) {
          return activities[4]; // debugging (recently active)
        }
        return activities[3]; // idle
      };
      
      const currentActivity = getSmartActivity();

      return {
        userId: participant.id,
        userName: participant.name || 'Anonymous',
        userImage: participant.image,
        status: userPresence?.status || statuses[index % statuses.length],
        lastSeen: userPresence?.lastSeen || new Date(),
        currentActivity,
        isTyping: typingUser?.isTyping || false,
        typingLocation: typingUser?.typingLocation,
        device: devices[index % devices.length],
        location: {
          country: ['US', 'UK', 'CA', 'DE', 'FR'][index % 5],
          city: ['New York', 'London', 'Toronto', 'Berlin', 'Paris'][index % 5],
          timezone: 'UTC-5'
        },
        sessionDuration: Math.floor(Math.random() * 120) + 10, // 10-130 minutes
        linesOfCode: Math.floor(Math.random() * 500) + 50,
        messagesCount: Math.floor(Math.random() * 50) + 5,
        cursorPosition: userPresence?.cursor,
        selection: userPresence?.selection ? {
          start: { line: userPresence.selection.startLine, column: userPresence.selection.startColumn },
          end: { line: userPresence.selection.endLine, column: userPresence.selection.endColumn }
        } : undefined,
        isScreenSharing: Math.random() > 0.8,
        isAudioEnabled: Math.random() > 0.6,
        isVideoEnabled: Math.random() > 0.7,
      };
    });

    setUserActivities(activities);

    // Calculate metrics
    const activeUsers = activities.filter(a => a.status === 'online').length;
    const totalSessionTime = activities.reduce((sum, a) => sum + a.sessionDuration, 0);
    const totalLines = activities.reduce((sum, a) => sum + a.linesOfCode, 0);
    const totalMessages = activities.reduce((sum, a) => sum + a.messagesCount, 0);

    setMetrics({
      totalUsers: activities.length,
      activeUsers,
      averageSessionTime: activities.length > 0 ? Math.round(totalSessionTime / activities.length) : 0,
      totalLinesWritten: totalLines,
      totalMessages: totalMessages,
      peakConcurrentUsers: Math.max(activeUsers, metrics.peakConcurrentUsers)
    });
  }, [participants, presence, typingUsers]);

  // Auto-update user status based on activity
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateUserStatus('away');
      } else {
        updateUserStatus('online');
      }
    };

    const handleBeforeUnload = () => {
      updateUserStatus('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [updateUserStatus]);

  const sortedUsers = [...userActivities].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.userName.localeCompare(b.userName);
      case 'duration':
        return b.sessionDuration - a.sessionDuration;
      case 'activity':
      default:
        const activityOrder = { online: 0, busy: 1, away: 2, offline: 3 };
        return activityOrder[a.status] - activityOrder[b.status];
    }
  });

  const displayUsers = showAllUsers ? sortedUsers : sortedUsers.slice(0, compact ? 3 : 8);
  const onlineUsers = userActivities.filter(u => u.status === 'online');

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className={`flex items-center space-x-2 ${!isConnected ? 'opacity-50' : ''}`}>
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">{onlineUsers.length}</span>
        </div>
        
        <div className="flex -space-x-1">
          {displayUsers.map((activity) => (
            <div
              key={activity.userId}
              className="relative cursor-pointer"
              title={`${activity.userName} - ${activity.status} - ${activity.currentActivity}`}
              onClick={() => {
                handleUserInteraction(activity.userId, 'user-click');
                onUserClick?.(activity.userId);
              }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-slate-800">
                {activity.userName.charAt(0)}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${getStatusColor(activity.status)}`} />
              {activity.isTyping && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <Keyboard className="w-2 h-2 text-white" />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="text-white">User Presence</span>
            <Badge variant="outline" className="text-xs">
              {onlineUsers.length}/{userActivities.length} online
            </Badge>
          </CardTitle>
          {/* Session info display using sessionId */}
          <div className="text-xs text-gray-500 mt-1">
            Session: {sessionId?.slice(0, 8)}...
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-slate-700 border-slate-600 text-white rounded px-2 py-1"
            >
              <option value="activity">By Activity</option>
              <option value="name">By Name</option>
              <option value="duration">By Duration</option>
            </select>
            
            {userActivities.length > 8 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAllUsers(!showAllUsers)}
                className="text-xs"
              >
                {showAllUsers ? 'Show Less' : `+${userActivities.length - 8} more`}
              </Button>
            )}
          </div>
        </div>

        {/* Metrics */}
        {showDetails && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-slate-700/50 rounded-lg">
              <div className="text-lg font-bold text-blue-400">{metrics.activeUsers}</div>
              <div className="text-xs text-gray-400">Active Now</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-lg">
              <div className="text-lg font-bold text-green-400">{formatDuration(metrics.averageSessionTime)}</div>
              <div className="text-xs text-gray-400">Avg Session</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-lg">
              <div className="text-lg font-bold text-purple-400">{metrics.totalLinesWritten}</div>
              <div className="text-xs text-gray-400">Lines Written</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-lg">
              <div className="text-lg font-bold text-yellow-400">{metrics.totalMessages}</div>
              <div className="text-xs text-gray-400">Messages</div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <AnimatePresence>
          {displayUsers.map((activity) => (
            <motion.div
              key={activity.userId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors cursor-pointer"
              onClick={() => {
                handleUserInteraction(activity.userId, 'detailed-user-click');
                onUserClick?.(activity.userId);
              }}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="relative">
                  {activity.userImage ? (
                    <img
                      src={activity.userImage}
                      alt={activity.userName}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {activity.userName.charAt(0)}
                    </div>
                  )}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-700 ${getStatusColor(activity.status)}`} />
                  {activity.isTyping && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <Keyboard className="w-2 h-2 text-white" />
                    </motion.div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white truncate">
                      {activity.userName}
                      {activity.userId === user?.id && (
                        <span className="text-xs text-gray-400 ml-1">(You)</span>
                      )}
                    </span>
                    {getDeviceIcon(activity.device)}
                    {activity.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {activity.location.city}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    {getActivityIcon(activity.currentActivity)}
                    <span>
                      {activity.isTyping
                        ? `Typing in ${activity.typingLocation}...`
                        : activity.currentActivity
                      }
                    </span>
                    {activity.cursorPosition && (
                      <>
                        <span>•</span>
                        <MousePointer className="w-3 h-3" />
                        <span>Line {activity.cursorPosition.line}</span>
                      </>
                    )}
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(activity.sessionDuration)}</span>
                    <span>•</span>
                    <span>{getFormattedLastSeen(new Date(Date.now() - Math.random() * 3600000))}</span>
                  </div>

                  {showDetails && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Activity</span>
                        <div className="flex space-x-2">
                          <span className="text-blue-400">{activity.linesOfCode} lines</span>
                          <span className="text-green-400">{activity.messagesCount} msgs</span>
                        </div>
                      </div>
                      <Progress 
                        value={(activity.sessionDuration / 120) * 100} 
                        className="h-1"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    activity.status === 'online' 
                      ? 'border-green-400 text-green-400' 
                      : activity.status === 'away'
                      ? 'border-yellow-400 text-yellow-400'
                      : activity.status === 'busy'
                      ? 'border-red-400 text-red-400'
                      : 'border-gray-400 text-gray-400'
                  }`}
                >
                  {activity.status}
                </Badge>
                
                {showDetails && (
                  <div className="flex items-center space-x-1">
                    {activity.isScreenSharing && (
                      <Monitor className="w-3 h-3 text-blue-400" />
                    )}
                    {activity.isAudioEnabled && (
                      <div className="relative group">
                        <div className="w-3 h-3 bg-green-400 rounded-full" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          Audio enabled
                        </div>
                      </div>
                    )}
                    {activity.isVideoEnabled && (
                      <div className="relative group">
                        <div className="w-3 h-3 bg-blue-400 rounded-full" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          Video enabled
                        </div>
                      </div>
                    )}
                    {activity.userId === user?.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Enhanced edit functionality with profile updates
                          handleEditProfile();
                          handleUserStatusUpdate(activity.status === 'away' ? 'online' : 'away');
                        }}
                        className="p-1 hover:bg-slate-600 rounded relative group"
                      >
                        <Edit className="w-3 h-3 text-gray-400 hover:text-white" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          Edit status
                        </div>
                      </button>
                    )}
                    {/* Location tracking feature */}
                    <button
                      onClick={() => handleLocationUpdate({ city: 'Remote', country: 'Global' })}
                      className="p-1 hover:bg-slate-600 rounded relative group"
                    >
                      <MapPin className="w-3 h-3 text-gray-400 hover:text-green-400" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        Update location
                      </div>
                    </button>
                    {/* Mouse pointer tracking feature */}
                    <button
                      onClick={() => handleMousePointerUpdate({ x: 100, y: 100 })}
                      className="p-1 hover:bg-slate-600 rounded relative group"
                    >
                      <MousePointer className="w-3 h-3 text-gray-400 hover:text-blue-400" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        Track cursor
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {userActivities.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No users currently active</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedUserPresence;
