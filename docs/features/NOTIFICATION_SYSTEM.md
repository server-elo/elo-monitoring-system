# 🔔 Comprehensive Notification System

## Overview

The Solidity Learning Platform features a comprehensive notification system that provides real-time feedback, accessibility compliance, smart management, and seamless integration with all platform features.

## ✨ Features

### Core Features
- **Multiple Notification Types**: Toast, banner, and in-app notifications
- **Smart Grouping**: Automatically groups similar notifications to prevent spam
- **Throttling**: Limits notification frequency (max 5 per minute per type)
- **Persistence**: Important notifications persist until dismissed
- **History**: Complete notification history with search and filtering
- **User Preferences**: Customizable notification settings per type

### Accessibility Features
- **WCAG 2.1 AA Compliant**: Full accessibility compliance
- **Screen Reader Support**: ARIA live regions with appropriate politeness levels
- **Keyboard Navigation**: Full keyboard accessibility with Tab, Enter, Escape support
- **Reduced Motion**: Respects user's motion preferences
- **High Contrast**: Proper contrast ratios for all notification types
- **Focus Management**: Proper focus handling and restoration

### Performance Features
- **React.memo Optimization**: Efficient re-rendering prevention
- **Intersection Observer**: Lazy loading for notification history
- **60fps Animations**: Smooth animations with reduced motion support
- **Efficient State Management**: Optimized context and state updates
- **Memory Management**: Automatic cleanup and garbage collection

### Integration Features
- **Error System Integration**: Automatic error notifications
- **Gamification Integration**: XP, level-up, and achievement notifications
- **Collaboration Integration**: Real-time collaboration events
- **AI Tutoring Integration**: AI response and analysis notifications
- **Authentication Integration**: Session and security notifications
- **Socket.io Integration**: Real-time notifications across users

## 🚀 Quick Start

### Basic Setup

```tsx
import { NotificationProvider } from '@/components/ui/NotificationSystem';
import { NotificationIntegrations } from '@/components/notifications/NotificationIntegrations';

function App() {
  return (
    <NotificationProvider>
      <YourAppContent />
      <NotificationIntegrations />
    </NotificationProvider>
  );
}
```

### Basic Usage

```tsx
import { useNotifications } from '@/components/ui/NotificationSystem';

function MyComponent() {
  const { showSuccess, showError, showInfo, showWarning } = useNotifications();

  const handleSuccess = () => {
    showSuccess('Success!', 'Operation completed successfully');
  };

  const handleError = () => {
    showError('Error!', 'Something went wrong', {
      persistent: true,
      action: {
        label: 'Retry',
        onClick: () => console.log('Retrying...')
      }
    });
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

## 📋 API Reference

### NotificationProvider

The main provider component that manages notification state and provides context.

```tsx
<NotificationProvider>
  {children}
</NotificationProvider>
```

### useNotifications Hook

Main hook for interacting with the notification system.

```tsx
const {
  // Core state
  notifications,
  groups,
  history,
  unreadCount,
  
  // Actions
  addNotification,
  removeNotification,
  markAsRead,
  markAllAsRead,
  clearAll,
  clearHistory,
  
  // Quick methods
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showAchievement,
  showXPGain,
  showLevelUp,
  showCollaboration,
  showBanner,
  
  // Preferences
  preferences,
  updatePreferences,
  
  // State management
  isPaused,
  togglePause,
  isHistoryOpen,
  toggleHistory,
  isPreferencesOpen,
  togglePreferences
} = useNotifications();
```

### Notification Types

```typescript
type NotificationType = 
  | 'success' 
  | 'error' 
  | 'info' 
  | 'warning' 
  | 'achievement' 
  | 'collaboration' 
  | 'xp' 
  | 'level-up'
  | 'system'
  | 'security';

interface Notification {
  id: string;
  type: NotificationType;
  variant?: 'toast' | 'banner' | 'inline';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  dismissible?: boolean;
  action?: NotificationAction;
  actions?: NotificationAction[];
  metadata?: NotificationMetadata;
  timestamp: number;
  read?: boolean;
  archived?: boolean;
}
```

### Quick Notification Methods

```tsx
// Basic notifications
showSuccess(title: string, message: string, options?: Partial<Notification>)
showError(title: string, message: string, options?: Partial<Notification>)
showInfo(title: string, message: string, options?: Partial<Notification>)
showWarning(title: string, message: string, options?: Partial<Notification>)

// Specialized notifications
showAchievement(title: string, message: string, metadata?: NotificationMetadata)
showXPGain(xp: number, message?: string)
showLevelUp(level: number, message?: string)
showCollaboration(message: string, user?: string)
showBanner(title: string, message: string, type?: NotificationType)
```

## 🎨 Customization

### Notification Preferences

Users can customize notification behavior through the preferences system:

```tsx
const { preferences, updatePreferences } = useNotifications();

// Update global settings
updatePreferences({
  enabled: true,
  soundEnabled: false,
  position: 'top-left',
  maxVisible: 3,
  groupSimilar: true
});

// Update type-specific settings
updatePreferences({
  types: {
    error: {
      enabled: true,
      sound: true,
      vibration: true,
      duration: 0 // Persistent
    }
  }
});
```

### Custom Notification Actions

```tsx
showError('Upload Failed', 'The file could not be uploaded', {
  actions: [
    {
      label: 'Retry',
      onClick: () => retryUpload(),
      variant: 'primary'
    },
    {
      label: 'Choose Different File',
      onClick: () => openFileDialog(),
      variant: 'secondary'
    }
  ]
});
```

### Banner Notifications

```tsx
// System-wide banner notification
showBanner(
  'Maintenance Notice',
  'System maintenance scheduled for tonight at 2 AM EST',
  'warning'
);
```

## 🔌 Integration Examples

### Error System Integration

```tsx
import { useErrorNotifications } from '@/lib/hooks/useNotificationIntegrations';

function MyComponent() {
  useErrorNotifications(); // Automatically shows notifications for errors
  
  // Errors from ErrorContext will automatically trigger notifications
}
```

### Gamification Integration

```tsx
import { useGamificationNotifications } from '@/lib/hooks/useNotificationIntegrations';

function GameComponent() {
  const { notifyXPGain, notifyLevelUp, notifyAchievement } = useGamificationNotifications();
  
  const handleLessonComplete = () => {
    notifyXPGain(50, 'Lesson completion');
  };
  
  const handleLevelUp = () => {
    notifyLevelUp(5, 4);
  };
}
```

### Real-time Socket Integration

```tsx
import { useNotificationSocket } from '@/lib/hooks/useNotificationSocket';

function CollaborationComponent() {
  const { 
    sendNotificationToRoom,
    joinRoom,
    leaveRoom,
    sendCollaborationEvent 
  } = useNotificationSocket();
  
  useEffect(() => {
    joinRoom('lesson-123');
    return () => leaveRoom('lesson-123');
  }, []);
  
  const handleCodeChange = () => {
    sendCollaborationEvent('code_changed', {
      userId: user.id,
      userName: user.name,
      roomId: 'lesson-123',
      fileName: 'contract.sol'
    });
  };
}
```

## ♿ Accessibility Features

### Screen Reader Support

The notification system provides comprehensive screen reader support:

- **ARIA Live Regions**: Automatic announcements with appropriate politeness levels
- **Semantic HTML**: Proper roles and labels for all interactive elements
- **Context Information**: Clear descriptions of notification content and actions

### Keyboard Navigation

Full keyboard accessibility:

- **Tab Navigation**: Navigate through notifications and controls
- **Enter/Space**: Activate buttons and toggle states
- **Escape**: Close notifications and modals
- **Arrow Keys**: Navigate within notification lists
- **Delete/Backspace**: Remove focused notifications

### Reduced Motion

Respects user's motion preferences:

```tsx
// Automatically detects and respects prefers-reduced-motion
const reducedMotion = respectsReducedMotion();

// Animations are automatically simplified or disabled
```

## 🧪 Testing

### Manual Testing Checklist

#### Basic Functionality
- [ ] Notifications appear and disappear correctly
- [ ] Different notification types display with correct styling
- [ ] Actions work as expected
- [ ] Persistent notifications remain until dismissed
- [ ] Auto-dismiss works for timed notifications

#### Accessibility Testing
- [ ] Screen reader announces notifications appropriately
- [ ] Keyboard navigation works throughout the system
- [ ] Focus management is correct
- [ ] High contrast mode works properly
- [ ] Reduced motion is respected

#### Performance Testing
- [ ] No memory leaks with many notifications
- [ ] Smooth animations at 60fps
- [ ] Efficient rendering with large notification lists
- [ ] Intersection observer works correctly

#### Integration Testing
- [ ] Error system integration works
- [ ] Gamification events trigger notifications
- [ ] Real-time collaboration notifications work
- [ ] Socket.io integration is stable

### Automated Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationProvider, useNotifications } from '@/components/ui/NotificationSystem';

describe('Notification System', () => {
  test('shows success notification', () => {
    const TestComponent = () => {
      const { showSuccess } = useNotifications();
      return (
        <button onClick={() => showSuccess('Test', 'Success message')}>
          Show Success
        </button>
      );
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });
});
```

## 🔧 Troubleshooting

### Common Issues

#### Notifications Not Appearing
1. Check if NotificationProvider is wrapping your app
2. Verify notification preferences are enabled
3. Check if notifications are paused
4. Ensure proper notification type is being used

#### Performance Issues
1. Check for memory leaks in notification history
2. Verify intersection observer is working
3. Ensure proper cleanup of event listeners
4. Check for excessive re-renders

#### Accessibility Issues
1. Test with screen readers (NVDA, JAWS, VoiceOver)
2. Verify keyboard navigation works
3. Check ARIA attributes are correct
4. Test with high contrast mode

#### Socket Integration Issues
1. Verify socket connection is established
2. Check event listeners are properly set up
3. Ensure proper cleanup on unmount
4. Test reconnection logic

### Debug Mode

Enable debug mode for detailed logging:

```tsx
// Add to your app's environment variables
NEXT_PUBLIC_NOTIFICATION_DEBUG=true
```

This will log all notification events, state changes, and integration activities to the console.

## 📈 Performance Considerations

### Memory Management
- Notification history is limited to 100 items
- Automatic cleanup of expired notifications
- Efficient event listener management
- Proper component unmounting

### Rendering Optimization
- React.memo for all notification components
- Intersection Observer for lazy loading
- Efficient state updates with proper dependencies
- Minimal re-renders through optimized context

### Animation Performance
- 60fps animations with hardware acceleration
- Reduced motion support for accessibility
- Efficient animation cleanup
- GPU-optimized transforms

## 🚀 Future Enhancements

### Planned Features
- [ ] Push notification support for PWA
- [ ] Email notification integration
- [ ] Advanced notification scheduling
- [ ] Machine learning for notification optimization
- [ ] Advanced analytics and insights
- [ ] Multi-language support
- [ ] Custom notification templates
- [ ] Notification workflows and automation

### Contributing

To contribute to the notification system:

1. Follow the existing code patterns
2. Ensure accessibility compliance
3. Add comprehensive tests
4. Update documentation
5. Test with real users for usability

For detailed contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).
