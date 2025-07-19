'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '@/lib/socket/SocketProvider';
import { NotificationSocketService } from '@/lib/socket/NotificationSocketService';
import { useNotifications } from '@/components/ui/NotificationSystem';
import { useSession } from 'next-auth/react';

/**
 * Hook for managing real-time notification events via Socket.io
 */
export function useNotificationSocket() {
  const { socket, isConnected } = useSocket();
  const { data: session } = useSession();
  const notificationService = useRef<NotificationSocketService | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
  });

  const {
    addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAchievement,
    showXPGain,
    showLevelUp,
    showCollaboration
  } = useNotifications();

  // Initialize notification service
  useEffect(() => {
    if (socket) {
      notificationService.current = new NotificationSocketService(socket);
      
      // Set up event handlers
      const unsubscribers: (() => void)[] = [];

      // Connection events
      unsubscribers.push(
        notificationService.current.on('connection:established', () => {
          setConnectionStatus(prev => ({ ...prev, isConnected: true, reconnectAttempts: 0 }));
          showSuccess('Connected', 'Real-time notifications are now active', {
            duration: 3000,
            metadata: { category: 'connection', priority: 'low' }
          });
        })
      );

      unsubscribers.push(
        notificationService.current.on('connection:lost', (_data: any) => {
          setConnectionStatus(prev => ({ ...prev, isConnected: false }));
          showWarning('Connection Lost', 'Attempting to reconnect...', {
            duration: 5000,
            metadata: { category: 'connection', priority: 'medium' }
          });
        })
      );

      unsubscribers.push(
        notificationService.current.on('connection:error', (_data: any) => {
          showError('Connection Error', 'Failed to connect to real-time services', {
            metadata: { category: 'connection', priority: 'high' }
          });
        })
      );

      unsubscribers.push(
        notificationService.current.on('connection:max_retries_reached', () => {
          showError(
            'Connection Failed', 
            'Unable to establish real-time connection. Some features may not work properly.',
            {
              persistent: true,
              metadata: { category: 'connection', priority: 'high' },
              action: {
                label: 'Retry',
                onClick: () => {
                  if (socket) {
                    socket.connect();
                  }
                }
              }
            }
          );
        })
      );

      // Notification events
      unsubscribers.push(
        notificationService.current.on('notification:received', (data: any) => {
          addNotification({
            type: data.type,
            title: data.title,
            message: data.message,
            metadata: {
              ...data.metadata,
              source: 'socket',
              priority: data.metadata?.priority || 'medium'
            }
          });
        })
      );

      unsubscribers.push(
        notificationService.current.on('notification:personal', (data: any) => {
          // Only show if it's for the current user
          if (session?.user?.id === data.userId) {
            addNotification({
              type: data.type,
              title: data.title,
              message: data.message,
              metadata: {
                ...data.metadata,
                source: 'socket-personal',
                priority: 'high'
              }
            });
          }
        })
      );

      // Collaboration events
      unsubscribers.push(
        notificationService.current.on('collaboration:user_joined', (data: any) => {
          if (data.userId !== session?.user?.id) {
            showCollaboration(`${data.userName} joined the session`, data.userName);
          }
        })
      );

      unsubscribers.push(
        notificationService.current.on('collaboration:user_left', (data: any) => {
          if (data.userId !== session?.user?.id) {
            showCollaboration(`${data.userName} left the session`, data.userName);
          }
        })
      );

      unsubscribers.push(
        notificationService.current.on('collaboration:code_changed', (data: any) => {
          if (data.userId !== session?.user?.id) {
            showInfo(
              'Code Updated',
              `${data.userName} made changes to the code`,
              {
                duration: 3000,
                metadata: {
                  category: 'collaboration',
                  user: data.userName,
                  priority: 'low'
                }
              }
            );
          }
        })
      );

      unsubscribers.push(
        notificationService.current.on('collaboration:chat_message', (data: any) => {
          if (data.userId !== session?.user?.id) {
            showInfo(
              'New Message',
              `${data.userName}: ${data.metadata?.message || 'sent a message'}`,
              {
                duration: 5000,
                metadata: {
                  category: 'chat',
                  user: data.userName,
                  priority: 'medium'
                }
              }
            );
          }
        })
      );

      // Gamification events
      unsubscribers.push(
        notificationService.current.on('gamification:xp_gained', (data: any) => {
          if (data.userId === session?.user?.id) {
            showXPGain(data.xp, 'Great job! Keep learning!');
          }
        })
      );

      unsubscribers.push(
        notificationService.current.on('gamification:level_up', (data: any) => {
          if (data.userId === session?.user?.id) {
            showLevelUp(data.level, `Congratulations! You've reached level ${data.level}!`);
          }
        })
      );

      unsubscribers.push(
        notificationService.current.on('gamification:achievement_unlocked', (data: any) => {
          if (data.userId === session?.user?.id) {
            showAchievement(
              data.achievement?.title || 'Achievement Unlocked!',
              data.achievement?.description || 'You\'ve unlocked a new achievement!',
              {
                achievement: data.achievement?.id,
                category: 'achievement',
                priority: 'high'
              }
            );
          }
        })
      );

      unsubscribers.push(
        notificationService.current.on('gamification:streak_updated', (data: any) => {
          if (data.userId === session?.user?.id && data.streak && data.streak % 7 === 0) {
            showSuccess(
              'Streak Milestone!',
              `Amazing! You've maintained a ${data.streak}-day learning streak!`,
              {
                duration: 8000,
                metadata: {
                  category: 'streak',
                  priority: 'high'
                }
              }
            );
          }
        })
      );

      // System events
      unsubscribers.push(
        notificationService.current.on('system:maintenance', (data: any) => {
          showWarning(data.title, data.message, {
            persistent: true,
            metadata: {
              category: 'system',
              priority: 'high'
            }
          });
        })
      );

      unsubscribers.push(
        notificationService.current.on('system:update', (data: any) => {
          showInfo(data.title, data.message, {
            duration: 10000,
            metadata: {
              category: 'system',
              priority: 'medium'
            }
          });
        })
      );

      unsubscribers.push(
        notificationService.current.on('system:announcement', (data: any) => {
          addNotification({
            type: 'info',
            variant: 'banner',
            title: data.title,
            message: data.message,
            persistent: true,
            metadata: {
              category: 'announcement',
              priority: 'high'
            }
          });
        })
      );

      unsubscribers.push(
        notificationService.current.on('system:alert', (data: any) => {
          const notificationType = data.severity === 'error' ? 'error' : 
                                  data.severity === 'warning' ? 'warning' : 'info';
          
          addNotification({
            type: notificationType,
            variant: 'banner',
            title: data.title,
            message: data.message,
            persistent: data.severity === 'error',
            metadata: {
              category: 'alert',
              priority: data.severity === 'error' ? 'critical' : 'high'
            }
          });
        })
      );

      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
        notificationService.current?.destroy();
      };
    }
  }, [
    socket,
    session?.user?.id,
    addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAchievement,
    showXPGain,
    showLevelUp,
    showCollaboration
  ]);

  // Update connection status when socket connection changes
  useEffect(() => {
    if (notificationService.current) {
      const status = notificationService.current.getConnectionStatus();
      setConnectionStatus(status);
    }
  }, [isConnected]);

  // Service methods
  const sendNotificationToRoom = useCallback((roomId: string, notification: any) => {
    notificationService.current?.sendNotificationToRoom(roomId, notification);
  }, []);

  const sendPersonalNotification = useCallback((userId: string, notification: any) => {
    notificationService.current?.sendPersonalNotification(userId, notification);
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    notificationService.current?.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    notificationService.current?.leaveRoom(roomId);
  }, []);

  const sendCollaborationEvent = useCallback((action: string, data: any) => {
    notificationService.current?.sendCollaborationEvent(action as any, data);
  }, []);

  const sendGamificationEvent = useCallback((action: string, data: any) => {
    notificationService.current?.sendGamificationEvent(action as any, data);
  }, []);

  return {
    connectionStatus,
    sendNotificationToRoom,
    sendPersonalNotification,
    joinRoom,
    leaveRoom,
    sendCollaborationEvent,
    sendGamificationEvent,
    isConnected: connectionStatus.isConnected
  };
}
