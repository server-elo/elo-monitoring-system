'use client';

import { useEffect, useCallback } from 'react';
import { useNotifications } from '@/components/ui/NotificationSystem';
import { useError } from '@/lib/errors/ErrorContext';
import { useSession } from 'next-auth/react';

/**
 * Hook for integrating notifications with error handling system
 */
export function useErrorNotifications() {
  const { showError, showWarning, showInfo } = useNotifications();
  const { state: errorState } = useError();

  useEffect(() => {
    // Listen for new errors and show notifications
    const latestError = errorState.errors[errorState.errors.length - 1];
    
    if (latestError && !latestError.notified) {
      const { severity, userMessage, message, code: _code, component } = latestError;
      
      switch (severity) {
        case 'critical':
        case 'high':
          showError(
            'Error Occurred',
            userMessage || message,
            {
              persistent: severity === 'critical',
              metadata: {
                category: 'error',
                source: component,
                priority: severity === 'critical' ? 'critical' : 'high'
              },
              action: latestError.retryable ? {
                label: 'Retry',
                onClick: () => {
                  // Trigger retry logic
                  console.log('Retrying operation...');
                }
              } : undefined
            }
          );
          break;
          
        case 'medium':
          showWarning(
            'Warning',
            userMessage || message,
            {
              metadata: {
                category: 'warning',
                source: component,
                priority: 'medium'
              }
            }
          );
          break;
          
        case 'low':
          showInfo(
            'Notice',
            userMessage || message,
            {
              metadata: {
                category: 'info',
                source: component,
                priority: 'low'
              }
            }
          );
          break;
      }
      
      // Mark error as notified to prevent duplicate notifications
      latestError.notified = true;
    }
  }, [errorState.errors, showError, showWarning, showInfo]);
}

/**
 * Hook for integrating notifications with authentication system
 */
export function useAuthNotifications() {
  const { showSuccess, showError: _showError, showWarning, showInfo: _showInfo } = useNotifications();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Welcome notification for new sessions
      const lastLogin = localStorage.getItem('lastLoginNotification');
      const now = Date.now();
      
      if (!lastLogin || now - parseInt(lastLogin) > 24 * 60 * 60 * 1000) {
        showSuccess(
          'Welcome Back!',
          `Hello ${session.user.name || 'there'}! Ready to continue learning?`,
          {
            duration: 6000,
            metadata: {
              category: 'auth',
              source: 'authentication',
              priority: 'medium'
            }
          }
        );
        localStorage.setItem('lastLoginNotification', now.toString());
      }
    }
  }, [status, session, showSuccess]);

  // Session expiry warnings
  useEffect(() => {
    if (status === 'authenticated' && session?.expires) {
      const expiryTime = new Date(session.expires).getTime();
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;
      
      // Warn 5 minutes before expiry
      if (timeUntilExpiry > 0 && timeUntilExpiry <= 5 * 60 * 1000) {
        showWarning(
          'Session Expiring Soon',
          'Your session will expire in 5 minutes. Please save your work.',
          {
            persistent: true,
            metadata: {
              category: 'auth',
              source: 'session',
              priority: 'high'
            },
            action: {
              label: 'Extend Session',
              onClick: () => {
                // Trigger session refresh
                window.location.reload();
              }
            }
          }
        );
      }
    }
  }, [status, session, showWarning]);
}

/**
 * Hook for integrating notifications with gamification system
 */
export function useGamificationNotifications() {
  const { showAchievement, showXPGain, showLevelUp, showSuccess } = useNotifications();

  const notifyXPGain = useCallback((xp: number, source?: string) => {
    showXPGain(xp, `Great job! You earned ${xp} XP${source ? ` from ${source}` : ''}.`);
  }, [showXPGain]);

  const notifyLevelUp = useCallback((newLevel: number, oldLevel: number) => {
    showLevelUp(
      newLevel,
      `Congratulations! You've advanced from level ${oldLevel} to level ${newLevel}!`
    );
  }, [showLevelUp]);

  const notifyAchievement = useCallback((
    title: string,
    description: string,
    achievementData?: any
  ) => {
    showAchievement(title, description, {
      achievement: achievementData?.id,
      category: 'achievement',
      priority: 'high'
    });
  }, [showAchievement]);

  const notifyStreak = useCallback((streakCount: number) => {
    if (streakCount > 0 && streakCount % 7 === 0) {
      showSuccess(
        'Streak Milestone!',
        `Amazing! You've maintained a ${streakCount}-day learning streak!`,
        {
          duration: 8000,
          metadata: {
            category: 'streak',
            priority: 'high'
          }
        }
      );
    }
  }, [showSuccess]);

  return {
    notifyXPGain,
    notifyLevelUp,
    notifyAchievement,
    notifyStreak
  };
}

/**
 * Hook for integrating notifications with collaboration system
 */
export function useCollaborationNotifications() {
  const { showCollaboration, showInfo, showSuccess } = useNotifications();

  const notifyUserJoined = useCallback((userName: string, roomName?: string) => {
    showCollaboration(
      `${userName} joined${roomName ? ` ${roomName}` : ' the session'}`,
      userName
    );
  }, [showCollaboration]);

  const notifyUserLeft = useCallback((userName: string, roomName?: string) => {
    showCollaboration(
      `${userName} left${roomName ? ` ${roomName}` : ' the session'}`,
      userName
    );
  }, [showCollaboration]);

  const notifyCodeChange = useCallback((userName: string, fileName?: string) => {
    showInfo(
      'Code Updated',
      `${userName} made changes${fileName ? ` to ${fileName}` : ''}`,
      {
        duration: 3000,
        metadata: {
          category: 'collaboration',
          user: userName,
          priority: 'low'
        }
      }
    );
  }, [showInfo]);

  const notifyMentorAvailable = useCallback((mentorName: string) => {
    showSuccess(
      'Mentor Available',
      `${mentorName} is now available for help!`,
      {
        duration: 10000,
        metadata: {
          category: 'collaboration',
          user: mentorName,
          priority: 'medium'
        },
        action: {
          label: 'Connect',
          onClick: () => {
            // Navigate to mentor chat or video call
            console.log('Connecting to mentor...');
          }
        }
      }
    );
  }, [showSuccess]);

  return {
    notifyUserJoined,
    notifyUserLeft,
    notifyCodeChange,
    notifyMentorAvailable
  };
}

/**
 * Hook for integrating notifications with AI tutoring system
 */
export function useAITutoringNotifications() {
  const { showInfo, showSuccess, showWarning } = useNotifications();

  const notifyAIResponse = useCallback((message: string, confidence?: number) => {
    const isHighConfidence = confidence && confidence > 0.8;
    
    showInfo(
      'AI Tutor Response',
      message,
      {
        duration: isHighConfidence ? 8000 : 6000,
        metadata: {
          category: 'ai-tutor',
          priority: isHighConfidence ? 'medium' : 'low'
        }
      }
    );
  }, [showInfo]);

  const notifyCodeAnalysis = useCallback((
    issues: number,
    suggestions: number,
    fileName?: string
  ) => {
    if (issues > 0) {
      showWarning(
        'Code Analysis Complete',
        `Found ${issues} issue${issues > 1 ? 's' : ''} and ${suggestions} suggestion${suggestions > 1 ? 's' : ''}${fileName ? ` in ${fileName}` : ''}`,
        {
          metadata: {
            category: 'ai-analysis',
            priority: 'medium'
          },
          action: {
            label: 'View Details',
            onClick: () => {
              // Navigate to code analysis results
              console.log('Viewing analysis details...');
            }
          }
        }
      );
    } else {
      showSuccess(
        'Code Analysis Complete',
        `Great job! No issues found${fileName ? ` in ${fileName}` : ''}`,
        {
          metadata: {
            category: 'ai-analysis',
            priority: 'low'
          }
        }
      );
    }
  }, [showWarning, showSuccess]);

  const notifyLearningRecommendation = useCallback((
    topic: string,
    reason: string
  ) => {
    showInfo(
      'Learning Recommendation',
      `Consider studying ${topic}. ${reason}`,
      {
        duration: 10000,
        metadata: {
          category: 'ai-recommendation',
          priority: 'medium'
        },
        action: {
          label: 'Start Learning',
          onClick: () => {
            // Navigate to recommended topic
            console.log(`Starting ${topic} lesson...`);
          }
        }
      }
    );
  }, [showInfo]);

  return {
    notifyAIResponse,
    notifyCodeAnalysis,
    notifyLearningRecommendation
  };
}

/**
 * Hook for integrating notifications with system events
 */
export function useSystemNotifications() {
  const { showInfo, showWarning: _showWarning, showError, showBanner } = useNotifications();

  const notifyMaintenance = useCallback((
    startTime: Date,
    duration: number,
    description?: string
  ) => {
    showBanner(
      'Scheduled Maintenance',
      `System maintenance scheduled for ${startTime.toLocaleString()}. Expected duration: ${duration} minutes.${description ? ` ${description}` : ''}`,
      'warning'
    );
  }, [showBanner]);

  const notifySystemUpdate = useCallback((version: string, features: string[]) => {
    showInfo(
      'System Updated',
      `Platform updated to version ${version}. New features: ${features.join(', ')}`,
      {
        duration: 12000,
        metadata: {
          category: 'system',
          priority: 'medium'
        }
      }
    );
  }, [showInfo]);

  const notifyNetworkIssue = useCallback((isOnline: boolean) => {
    if (!isOnline) {
      showError(
        'Connection Lost',
        'You appear to be offline. Some features may not work properly.',
        {
          persistent: true,
          metadata: {
            category: 'network',
            priority: 'high'
          }
        }
      );
    } else {
      showInfo(
        'Connection Restored',
        'You are back online. All features are now available.',
        {
          metadata: {
            category: 'network',
            priority: 'medium'
          }
        }
      );
    }
  }, [showError, showInfo]);

  return {
    notifyMaintenance,
    notifySystemUpdate,
    notifyNetworkIssue
  };
}
