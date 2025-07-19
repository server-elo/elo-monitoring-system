'use client';

import { useEffect } from 'react';
import {
  useErrorNotifications,
  useAuthNotifications,
  useGamificationNotifications,
  useCollaborationNotifications,
  useAITutoringNotifications,
  useSystemNotifications
} from '@/lib/hooks/useNotificationIntegrations';
import { useSocket } from '@/lib/socket/SocketProvider';
import { useNotifications } from '@/components/ui/NotificationSystem';

/**
 * Component that sets up all notification system integrations
 * This should be included in the main app layout to enable all integrations
 */
export function NotificationIntegrations() {
  // Initialize all integration hooks
  useErrorNotifications();
  useAuthNotifications();
  
  const gamificationNotifications = useGamificationNotifications();
  const collaborationNotifications = useCollaborationNotifications();
  const aiTutoringNotifications = useAITutoringNotifications();
  const systemNotifications = useSystemNotifications();
  
  const { socket, isConnected } = useSocket();
  const { showInfo, showError, showSuccess } = useNotifications();

  // Socket.io integration for real-time notifications
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Collaboration events
    socket.on('user:joined', (data: { userName: string; roomName?: string }) => {
      collaborationNotifications.notifyUserJoined(data.userName, data.roomName);
    });

    socket.on('user:left', (data: { userName: string; roomName?: string }) => {
      collaborationNotifications.notifyUserLeft(data.userName, data.roomName);
    });

    socket.on('code:changed', (data: { userName: string; fileName?: string }) => {
      collaborationNotifications.notifyCodeChange(data.userName, data.fileName);
    });

    socket.on('mentor:available', (data: { mentorName: string }) => {
      collaborationNotifications.notifyMentorAvailable(data.mentorName);
    });

    // Gamification events
    socket.on('xp:gained', (data: { xp: number; source?: string }) => {
      gamificationNotifications.notifyXPGain(data.xp, data.source);
    });

    socket.on('level:up', (data: { newLevel: number; oldLevel: number }) => {
      gamificationNotifications.notifyLevelUp(data.newLevel, data.oldLevel);
    });

    socket.on('achievement:unlocked', (data: { title: string; description: string; achievementData?: any }) => {
      gamificationNotifications.notifyAchievement(data.title, data.description, data.achievementData);
    });

    socket.on('streak:milestone', (data: { streakCount: number }) => {
      gamificationNotifications.notifyStreak(data.streakCount);
    });

    // AI Tutoring events
    socket.on('ai:response', (data: { message: string; confidence?: number }) => {
      aiTutoringNotifications.notifyAIResponse(data.message, data.confidence);
    });

    socket.on('ai:analysis', (data: { issues: number; suggestions: number; fileName?: string }) => {
      aiTutoringNotifications.notifyCodeAnalysis(data.issues, data.suggestions, data.fileName);
    });

    socket.on('ai:recommendation', (data: { topic: string; reason: string }) => {
      aiTutoringNotifications.notifyLearningRecommendation(data.topic, data.reason);
    });

    // System events
    socket.on('system:maintenance', (data: { startTime: string; duration: number; description?: string }) => {
      systemNotifications.notifyMaintenance(new Date(data.startTime), data.duration, data.description);
    });

    socket.on('system:update', (data: { version: string; features: string[] }) => {
      systemNotifications.notifySystemUpdate(data.version, data.features);
    });

    // Generic notification events
    socket.on('notification:info', (data: { title: string; message: string; options?: any }) => {
      showInfo(data.title, data.message, data.options);
    });

    socket.on('notification:success', (data: { title: string; message: string; options?: any }) => {
      showSuccess(data.title, data.message, data.options);
    });

    socket.on('notification:error', (data: { title: string; message: string; options?: any }) => {
      showError(data.title, data.message, data.options);
    });

    // Cleanup listeners
    return () => {
      socket.off('user:joined');
      socket.off('user:left');
      socket.off('code:changed');
      socket.off('mentor:available');
      socket.off('xp:gained');
      socket.off('level:up');
      socket.off('achievement:unlocked');
      socket.off('streak:milestone');
      socket.off('ai:response');
      socket.off('ai:analysis');
      socket.off('ai:recommendation');
      socket.off('system:maintenance');
      socket.off('system:update');
      socket.off('notification:info');
      socket.off('notification:success');
      socket.off('notification:error');
    };
  }, [
    socket,
    isConnected,
    collaborationNotifications,
    gamificationNotifications,
    aiTutoringNotifications,
    systemNotifications,
    showInfo,
    showSuccess,
    showError
  ]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => systemNotifications.notifyNetworkIssue(true);
    const handleOffline = () => systemNotifications.notifyNetworkIssue(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [systemNotifications]);

  // Page visibility change notifications
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to the page - could show summary of missed notifications
        const missedCount = 0; // This would be calculated based on notifications received while away
        if (missedCount > 0) {
          showInfo(
            'Welcome Back!',
            `You have ${missedCount} new notification${missedCount > 1 ? 's' : ''} while you were away.`,
            {
              duration: 6000,
              metadata: {
                category: 'system',
                priority: 'low'
              }
            }
          );
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [showInfo]);

  // Performance monitoring notifications
  useEffect(() => {
    // Monitor page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          // Notify about slow operations
          if (entry.duration > 5000) { // 5 seconds
            showError(
              'Performance Issue',
              'The application is running slowly. Please check your connection.',
              {
                metadata: {
                  category: 'performance',
                  priority: 'medium'
                }
              }
            );
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'measure'] });

      return () => observer.disconnect();
    }
  }, [showError]);

  // Browser compatibility notifications
  useEffect(() => {
    const checkBrowserSupport = () => {
      const isSupported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      if (!isSupported) {
        showInfo(
          'Limited Browser Support',
          'Some features may not work properly in your browser. Consider updating to the latest version.',
          {
            persistent: true,
            metadata: {
              category: 'compatibility',
              priority: 'medium'
            }
          }
        );
      }
    };

    checkBrowserSupport();
  }, [showInfo]);

  // Storage quota monitoring
  useEffect(() => {
    const checkStorageQuota = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          const usagePercentage = estimate.usage && estimate.quota 
            ? (estimate.usage / estimate.quota) * 100 
            : 0;

          if (usagePercentage > 80) {
            showError(
              'Storage Almost Full',
              'Your browser storage is almost full. Some features may not work properly.',
              {
                metadata: {
                  category: 'storage',
                  priority: 'high'
                },
                action: {
                  label: 'Clear Data',
                  onClick: () => {
                    // Clear non-essential data
                    localStorage.removeItem('notification-history');
                    showSuccess('Storage Cleared', 'Non-essential data has been cleared.');
                  }
                }
              }
            );
          }
        } catch (error) {
          console.warn('Could not check storage quota:', error);
        }
      }
    };

    checkStorageQuota();
    
    // Check storage quota periodically
    const interval = setInterval(checkStorageQuota, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [showError, showSuccess]);

  // This component doesn't render anything - it just sets up integrations
  return null;
}

/**
 * Hook for manually triggering notification integrations
 * Useful for testing or manual event triggering
 */
export function useManualNotificationTriggers() {
  const gamificationNotifications = useGamificationNotifications();
  const collaborationNotifications = useCollaborationNotifications();
  const aiTutoringNotifications = useAITutoringNotifications();
  const systemNotifications = useSystemNotifications();

  return {
    // Gamification triggers
    triggerXPGain: (xp: number, source?: string) => 
      gamificationNotifications.notifyXPGain(xp, source),
    
    triggerLevelUp: (newLevel: number, oldLevel: number) => 
      gamificationNotifications.notifyLevelUp(newLevel, oldLevel),
    
    triggerAchievement: (title: string, description: string, data?: any) => 
      gamificationNotifications.notifyAchievement(title, description, data),
    
    // Collaboration triggers
    triggerUserJoined: (userName: string, roomName?: string) => 
      collaborationNotifications.notifyUserJoined(userName, roomName),
    
    triggerCodeChange: (userName: string, fileName?: string) => 
      collaborationNotifications.notifyCodeChange(userName, fileName),
    
    // AI Tutoring triggers
    triggerAIResponse: (message: string, confidence?: number) => 
      aiTutoringNotifications.notifyAIResponse(message, confidence),
    
    triggerCodeAnalysis: (issues: number, suggestions: number, fileName?: string) => 
      aiTutoringNotifications.notifyCodeAnalysis(issues, suggestions, fileName),
    
    // System triggers
    triggerMaintenance: (startTime: Date, duration: number, description?: string) => 
      systemNotifications.notifyMaintenance(startTime, duration, description),
    
    triggerSystemUpdate: (version: string, features: string[]) => 
      systemNotifications.notifySystemUpdate(version, features),
  };
}
