# 🔗 Notification System Integration Guide

## Quick Integration Checklist

### ✅ Step 1: Add to Main Layout

Update your main layout file (e.g., `app/layout.tsx` or `pages/_app.tsx`):

```tsx
import { NotificationProvider } from '@/components/ui/NotificationSystem';
import { NotificationIntegrations } from '@/components/notifications/NotificationIntegrations';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          {/* Your existing providers */}
          <SocketProvider>
            <SessionProvider>
              {children}
              
              {/* Add notification integrations */}
              <NotificationIntegrations />
            </SessionProvider>
          </SocketProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
```

### ✅ Step 2: Update Error Handling

Enhance your existing error components to use notifications:

```tsx
// In your ErrorBoundary or error handling components
import { useNotifications } from '@/components/ui/NotificationSystem';

export function EnhancedErrorBoundary({ children }: { children: React.ReactNode }) {
  const { showError } = useNotifications();
  
  // Your existing error boundary logic
  // Add notification calls when errors occur
  
  const handleError = (error: Error) => {
    showError(
      'Application Error',
      'Something went wrong. Please try refreshing the page.',
      {
        persistent: true,
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload()
        }
      }
    );
  };
  
  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}
```

### ✅ Step 3: Integrate with Gamification

Update your gamification components:

```tsx
// In your XP/Level components
import { useGamificationNotifications } from '@/lib/hooks/useNotificationIntegrations';

export function XPSystem() {
  const { notifyXPGain, notifyLevelUp } = useGamificationNotifications();
  
  const handleXPGain = (xp: number, source: string) => {
    // Update XP in your state/database
    updateUserXP(xp);
    
    // Show notification
    notifyXPGain(xp, source);
  };
  
  const handleLevelUp = (newLevel: number, oldLevel: number) => {
    // Update level in your state/database
    updateUserLevel(newLevel);
    
    // Show notification
    notifyLevelUp(newLevel, oldLevel);
  };
  
  return (
    // Your XP component JSX
  );
}
```

### ✅ Step 4: Add to Code Editor

Integrate with your code editor for real-time collaboration:

```tsx
// In your code editor component
import { useNotificationSocket } from '@/lib/hooks/useNotificationSocket';

export function CodeEditor() {
  const { sendCollaborationEvent, joinRoom, leaveRoom } = useNotificationSocket();
  
  useEffect(() => {
    // Join room when component mounts
    joinRoom(`lesson-${lessonId}`);
    
    return () => {
      // Leave room when component unmounts
      leaveRoom(`lesson-${lessonId}`);
    };
  }, [lessonId]);
  
  const handleCodeChange = (newCode: string) => {
    // Update code in your state
    setCode(newCode);
    
    // Notify other users
    sendCollaborationEvent('code_changed', {
      userId: user.id,
      userName: user.name,
      roomId: `lesson-${lessonId}`,
      fileName: currentFile
    });
  };
  
  return (
    // Your code editor JSX
  );
}
```

### ✅ Step 5: Add Testing Page (Development Only)

Add the testing page to your development routes:

```tsx
// In your development routes or admin panel
import { NotificationTestingPage } from '@/components/testing/NotificationTestingPage';

// Add route for /admin/notifications/test or similar
export default function NotificationTestPage() {
  return <NotificationTestingPage />;
}
```

## 🎯 Integration Examples by Feature

### Authentication Integration

```tsx
// In your auth components
import { useAuthNotifications } from '@/lib/hooks/useNotificationIntegrations';

export function LoginForm() {
  useAuthNotifications(); // Automatically handles auth notifications
  
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      await signIn(credentials);
      // Welcome notification will be shown automatically
    } catch (error) {
      // Error notification will be shown automatically
    }
  };
}
```

### AI Tutoring Integration

```tsx
// In your AI tutoring components
import { useAITutoringNotifications } from '@/lib/hooks/useNotificationIntegrations';

export function AITutor() {
  const { notifyAIResponse, notifyCodeAnalysis } = useAITutoringNotifications();
  
  const handleAIResponse = (response: string, confidence: number) => {
    notifyAIResponse(response, confidence);
  };
  
  const handleCodeAnalysis = (results: AnalysisResults) => {
    notifyCodeAnalysis(
      results.issues.length,
      results.suggestions.length,
      results.fileName
    );
  };
}
```

### Learning Progress Integration

```tsx
// In your lesson components
import { useNotifications } from '@/components/ui/NotificationSystem';

export function LessonComponent() {
  const { showSuccess, showAchievement } = useNotifications();
  
  const handleLessonComplete = async () => {
    // Update progress in database
    await updateLessonProgress(lessonId, 'completed');
    
    // Show completion notification
    showSuccess(
      'Lesson Complete!',
      'Great job! You\'ve completed this lesson.',
      {
        duration: 6000,
        metadata: {
          category: 'learning',
          priority: 'medium'
        }
      }
    );
    
    // Check for achievements
    const newAchievements = await checkForAchievements();
    newAchievements.forEach(achievement => {
      showAchievement(achievement.title, achievement.description);
    });
  };
}
```

## 🔧 Configuration Options

### Environment Variables

Add these to your `.env.local`:

```bash
# Notification system configuration
NEXT_PUBLIC_NOTIFICATION_DEBUG=false
NEXT_PUBLIC_NOTIFICATION_MAX_HISTORY=100
NEXT_PUBLIC_NOTIFICATION_THROTTLE_LIMIT=5
NEXT_PUBLIC_NOTIFICATION_SOUND_ENABLED=true
NEXT_PUBLIC_NOTIFICATION_VIBRATION_ENABLED=true

# Socket.io configuration for real-time notifications
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_PATH=/socket.io
```

### Default Preferences Override

```tsx
// Create a custom preferences configuration
const customNotificationPreferences = {
  enabled: true,
  soundEnabled: false, // Disable sound by default
  vibrationEnabled: true,
  position: 'bottom-right' as const,
  maxVisible: 3, // Show fewer notifications
  groupSimilar: true,
  showBanners: true,
  types: {
    // Customize per type
    error: {
      enabled: true,
      sound: true,
      vibration: true,
      duration: 0 // Make errors persistent
    },
    success: {
      enabled: true,
      sound: false,
      vibration: false,
      duration: 3000 // Shorter duration for success
    }
    // ... other types
  }
};

// Use in your NotificationProvider
<NotificationProvider defaultPreferences={customNotificationPreferences}>
  {children}
</NotificationProvider>
```

## 🚀 Performance Optimization

### Lazy Loading

```tsx
// Lazy load notification components for better performance
import { lazy, Suspense } from 'react';

const NotificationCenter = lazy(() => import('@/components/ui/NotificationCenter'));
const NotificationHistory = lazy(() => import('@/components/ui/NotificationHistory'));

export function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <NotificationCenter />
        <NotificationHistory />
      </Suspense>
    </div>
  );
}
```

### Memory Management

```tsx
// Implement cleanup in your components
useEffect(() => {
  // Set up notification listeners
  const cleanup = setupNotificationListeners();
  
  return () => {
    // Always clean up to prevent memory leaks
    cleanup();
  };
}, []);
```

## 🧪 Testing Integration

### Unit Tests

```tsx
// Example test for notification integration
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationProvider } from '@/components/ui/NotificationSystem';
import { YourComponent } from './YourComponent';

describe('Notification Integration', () => {
  test('shows success notification on action', async () => {
    render(
      <NotificationProvider>
        <YourComponent />
      </NotificationProvider>
    );
    
    fireEvent.click(screen.getByText('Complete Action'));
    
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

```tsx
// Example Playwright test
import { test, expect } from '@playwright/test';

test('notification system works end-to-end', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Trigger an action that should show a notification
  await page.click('[data-testid="complete-lesson"]');
  
  // Check that notification appears
  await expect(page.locator('[role="alert"]')).toBeVisible();
  await expect(page.locator('text=Lesson Complete!')).toBeVisible();
  
  // Check that notification can be dismissed
  await page.click('[aria-label="Dismiss notification"]');
  await expect(page.locator('[role="alert"]')).not.toBeVisible();
});
```

## 🔍 Monitoring and Analytics

### Notification Analytics

```tsx
// Track notification engagement
import { useNotifications } from '@/components/ui/NotificationSystem';
import { analytics } from '@/lib/analytics';

export function useNotificationAnalytics() {
  const { addNotification } = useNotifications();
  
  const trackNotification = (type: string, action: string, metadata?: any) => {
    analytics.track('notification_interaction', {
      type,
      action,
      timestamp: Date.now(),
      ...metadata
    });
  };
  
  const showTrackedNotification = (notification: any) => {
    const id = addNotification(notification);
    
    trackNotification(notification.type, 'shown', {
      notificationId: id,
      title: notification.title
    });
    
    return id;
  };
  
  return { showTrackedNotification, trackNotification };
}
```

### Performance Monitoring

```tsx
// Monitor notification performance
useEffect(() => {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (entry.name.includes('notification')) {
        console.log(`Notification performance: ${entry.duration}ms`);
        
        // Track slow notifications
        if (entry.duration > 100) {
          analytics.track('notification_performance_slow', {
            duration: entry.duration,
            name: entry.name
          });
        }
      }
    });
  });
  
  observer.observe({ entryTypes: ['measure'] });
  
  return () => observer.disconnect();
}, []);
```

## 🚨 Troubleshooting Common Issues

### Issue: Notifications Not Appearing

**Solution:**
1. Check if `NotificationProvider` wraps your app
2. Verify notifications aren't paused
3. Check user preferences
4. Ensure proper notification type

### Issue: Performance Problems

**Solution:**
1. Limit notification history size
2. Use React.memo for custom components
3. Implement proper cleanup
4. Check for memory leaks

### Issue: Accessibility Problems

**Solution:**
1. Test with screen readers
2. Verify keyboard navigation
3. Check ARIA attributes
4. Test with high contrast mode

### Issue: Socket Integration Not Working

**Solution:**
1. Verify socket connection
2. Check event listeners setup
3. Ensure proper room joining/leaving
4. Test reconnection logic

## 📋 Deployment Checklist

- [ ] NotificationProvider added to main layout
- [ ] All integrations properly configured
- [ ] Environment variables set
- [ ] Testing page removed from production
- [ ] Performance optimizations applied
- [ ] Accessibility tested
- [ ] Socket.io server configured
- [ ] Analytics tracking implemented
- [ ] Error monitoring set up
- [ ] Documentation updated

## 🎉 Success Metrics

Track these metrics to measure notification system success:

- **User Engagement**: Click-through rates on notification actions
- **Performance**: Notification render times < 100ms
- **Accessibility**: Zero accessibility violations
- **User Satisfaction**: Notification preference usage
- **System Health**: Error rates < 1%
- **Real-time Performance**: Socket connection uptime > 99%

The notification system is now fully integrated and ready for production use! 🚀
