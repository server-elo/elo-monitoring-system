import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Circle, 
  Eye, 
  MessageCircle, 
  Code, 
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/lib/socket/client';
import { useAuth } from '@/components/auth/EnhancedAuthProvider';

interface UserPresenceIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

interface UserActivity {
  userId: string;
  userName: string;
  userImage?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentActivity?: 'coding' | 'chatting' | 'viewing' | 'idle';
  isTyping: boolean;
  typingLocation?: 'chat' | 'code';
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'bg-green-400';
    case 'away': return 'bg-yellow-400';
    case 'offline': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};

const getActivityIcon = (activity?: string) => {
  switch (activity) {
    case 'coding': return <Code className="w-3 h-3" />;
    case 'chatting': return <MessageCircle className="w-3 h-3" />;
    case 'viewing': return <Eye className="w-3 h-3" />;
    default: return <Circle className="w-3 h-3" />;
  }
};

const formatLastSeen = (lastSeen: Date) => {
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

export const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  showDetails = false,
  compact = false,
  className = ''
}) => {
  const { user } = useAuth();
  const { 
    isConnected, 
    presence, 
    participants, 
    typingUsers,
    updateUserStatus 
  } = useSocket();

  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Transform presence data into user activities
  useEffect(() => {
    const activities: UserActivity[] = participants.map(participant => {
      const userPresence = presence.find(p => p.userId === participant.id);
      const typingUser = typingUsers.find(t => t.userId === participant.id);
      
      // Determine current activity
      let currentActivity: UserActivity['currentActivity'] = 'idle';
      if (typingUser?.isTyping) {
        currentActivity = typingUser.typingLocation === 'code' ? 'coding' : 'chatting';
      } else if (userPresence?.cursor) {
        currentActivity = 'coding';
      } else if (userPresence?.lastSeen && 
                 new Date().getTime() - userPresence.lastSeen.getTime() < 30000) {
        currentActivity = 'viewing';
      }

      return {
        userId: participant.id,
        userName: participant.name || 'Anonymous',
        userImage: participant.image,
        status: userPresence?.status || 'offline',
        lastSeen: userPresence?.lastSeen || new Date(),
        currentActivity,
        isTyping: typingUser?.isTyping || false,
        typingLocation: typingUser?.typingLocation
      };
    });

    setUserActivities(activities);
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

  const onlineUsers = userActivities.filter(u => u.status === 'online');
  const displayUsers = showAllUsers ? userActivities : userActivities.slice(0, compact ? 3 : 6);

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`flex items-center space-x-1 ${!isConnected ? 'opacity-50' : ''}`}>
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
              className="relative"
              title={`${activity.userName} - ${activity.status}`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-slate-800">
                {activity.userName.charAt(0)}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-800 ${getStatusColor(activity.status)}`} />
              {activity.isTyping && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <div className="w-1 h-1 bg-white rounded-full" />
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
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">
              Active Users ({onlineUsers.length})
            </h3>
            <div className={`flex items-center space-x-1 ${!isConnected ? 'opacity-50' : ''}`}>
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
          
          {userActivities.length > 6 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAllUsers(!showAllUsers)}
              className="text-xs"
            >
              {showAllUsers ? 'Show Less' : `+${userActivities.length - 6} more`}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {displayUsers.map((activity) => (
              <motion.div
                key={activity.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {activity.userImage ? (
                      <img
                        src={activity.userImage}
                        alt={activity.userName}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                        {activity.userName.charAt(0)}
                      </div>
                    )}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-700 ${getStatusColor(activity.status)}`} />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">
                        {activity.userName}
                        {activity.userId === user?.id && (
                          <span className="text-xs text-gray-400 ml-1">(You)</span>
                        )}
                      </span>
                      {activity.isTyping && (
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="flex items-center space-x-1"
                        >
                          <div className="w-1 h-1 bg-blue-400 rounded-full" />
                          <div className="w-1 h-1 bg-blue-400 rounded-full" />
                          <div className="w-1 h-1 bg-blue-400 rounded-full" />
                        </motion.div>
                      )}
                    </div>
                    
                    {showDetails && (
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        {getActivityIcon(activity.currentActivity)}
                        <span>
                          {activity.isTyping 
                            ? `Typing in ${activity.typingLocation}...`
                            : activity.currentActivity || 'Idle'
                          }
                        </span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatLastSeen(activity.lastSeen)}</span>
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
                        : 'border-gray-400 text-gray-400'
                    }`}
                  >
                    {activity.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

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

export default UserPresenceIndicator;
