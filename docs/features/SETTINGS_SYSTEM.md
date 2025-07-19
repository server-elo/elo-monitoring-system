# Settings System Documentation

## Overview

The Settings System is a comprehensive user preference management solution for the Solidity Learning Platform. It provides a complete interface for users to manage their profile, security, learning preferences, notifications, accessibility options, and privacy settings.

## Architecture

### Core Components

1. **SettingsPage** - Main container component with navigation and layout
2. **ProfileSection** - User profile management with avatar upload
3. **SecuritySection** - Password, 2FA, and session management
4. **LearningPreferencesSection** - Learning and editor preferences
5. **NotificationSection** - Email, push, and in-app notifications
6. **AccessibilitySection** - Accessibility features and accommodations
7. **PrivacySection** - Privacy controls and data management

### Data Management

- **useSettings Hook** - Central state management for all settings
- **TypeScript Interfaces** - Comprehensive type definitions
- **Auto-save** - Automatic saving with debouncing
- **Validation** - Real-time form validation with error handling

## Features

### Profile Management
- ✅ Personal information editing
- ✅ Avatar upload with drag & drop
- ✅ Social media links
- ✅ Real-time validation
- ✅ Auto-save functionality

### Security Features
- ✅ Password change with validation
- ✅ Two-factor authentication setup/management
- ✅ Active session monitoring
- ✅ Session revocation
- ✅ Security audit logging
- ✅ Login notifications
- ✅ Suspicious activity alerts

### Learning Preferences
- ✅ Difficulty level selection
- ✅ Study reminder configuration
- ✅ Progress tracking settings
- ✅ Content preferences (video speed, hints)
- ✅ Code editor customization
- ✅ Collaboration preferences

### Notification Management
- ✅ Email notification preferences
- ✅ Push notification settings
- ✅ In-app notification controls
- ✅ Granular category controls
- ✅ Notification frequency settings

### Accessibility Support
- ✅ Visual accessibility (font size, contrast)
- ✅ Motor accessibility (keyboard navigation)
- ✅ Cognitive accessibility (reduced motion)
- ✅ Screen reader support
- ✅ WCAG 2.1 AA compliance

### Privacy & Data Management
- ✅ Profile visibility controls
- ✅ Data retention settings
- ✅ GDPR-compliant data export
- ✅ Account deletion with confirmation
- ✅ Data sharing preferences

## Usage

### Basic Implementation

```tsx
import { SettingsPage } from '@/components/settings/SettingsPage';

export default function Settings() {
  return <SettingsPage />;
}
```

### Using Individual Components

```tsx
import { ProfileSection } from '@/components/settings/ProfileSection';
import { useSettings } from '@/lib/hooks/useSettings';

function MyProfilePage() {
  const { settings, updateSettings } = useSettings();
  
  return (
    <ProfileSection
      profile={settings?.profile}
      onUpdate={(data) => updateSettings('profile', data, true)}
    />
  );
}
```

### Custom Hook Usage

```tsx
import { useSettings } from '@/lib/hooks/useSettings';

function MyComponent() {
  const {
    settings,
    isLoading,
    hasUnsavedChanges,
    updateSettings,
    saveAllChanges
  } = useSettings();
  
  // Use settings data and methods
}
```

## API Reference

### useSettings Hook

#### Returns
- `settings` - Current user settings object
- `isLoading` - Loading state for initial data fetch
- `isSaving` - Saving state for updates
- `hasUnsavedChanges` - Whether there are pending changes
- `validationErrors` - Validation errors by section
- `updateSettings(section, data, immediate?)` - Update settings
- `saveAllChanges()` - Save all pending changes
- `resetSection(section)` - Reset section to original values
- `refreshSettings()` - Refresh from server
- Security methods (changePassword, setupTwoFactor, etc.)
- Session management methods
- Data management methods

### Component Props

#### ProfileSection
```tsx
interface ProfileSectionProps {
  profile: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => Promise<UpdateResult>;
  validationErrors?: SettingsValidationError[];
  className?: string;
}
```

#### SecuritySection
```tsx
interface SecuritySectionProps {
  security: SecuritySettings;
  activeSessions: ActiveSession[];
  onUpdateSecurity: (data: Partial<SecuritySettings>) => Promise<UpdateResult>;
  onChangePassword: (current: string, new: string) => Promise<PasswordResult>;
  // ... other security methods
}
```

## Keyboard Shortcuts

- `Ctrl+S` / `Cmd+S` - Save all changes
- `Ctrl+R` / `Cmd+R` - Refresh settings
- `Alt+←` / `Alt+→` - Navigate between tabs
- `Tab` / `Shift+Tab` - Navigate form fields
- `Enter` - Submit forms
- `Escape` - Cancel edit mode

## Accessibility Features

### Visual
- Adjustable font sizes (12px - 24px)
- High contrast mode
- Color blind support with patterns
- Enhanced focus indicators

### Motor
- Full keyboard navigation
- Sticky keys support
- Adjustable click delays (0-1000ms)
- Large click targets option

### Cognitive
- Reduced motion option
- Simple language mode
- Reading guide
- Auto-pause media
- Session timeout warnings

## Testing

### Unit Tests
- Component rendering and interaction
- Hook functionality and state management
- Form validation and error handling
- Accessibility compliance

### Test Files
- `ProfileSection.test.tsx`
- `SecuritySection.test.tsx`
- `useSettings.test.ts`
- `SettingsPage.test.tsx`

### Running Tests
```bash
npm test components/settings
npm test lib/hooks/useSettings
```

## Styling

### Design System
- Glassmorphism UI with backdrop blur effects
- Consistent color scheme with semantic colors
- Responsive design for all screen sizes
- Dark theme optimized

### CSS Classes
- Glass container effects
- Form styling with validation states
- Button variants and states
- Animation and transition classes

## Performance

### Optimizations
- Auto-save with 2-second debouncing
- Lazy loading of heavy components
- Memoized callbacks and computations
- Efficient re-rendering with React.memo

### Bundle Size
- Tree-shakeable components
- Optimized icon imports
- Minimal external dependencies

## Security Considerations

### Data Protection
- Client-side validation only for UX
- Server-side validation required
- Secure password handling
- 2FA implementation with backup codes

### Privacy Compliance
- GDPR-compliant data export
- Right to be forgotten (account deletion)
- Granular privacy controls
- Audit logging for security events

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

### Planned Features
- [ ] Bulk settings import/export
- [ ] Settings synchronization across devices
- [ ] Advanced theme customization
- [ ] Integration with external services
- [ ] Mobile app settings sync

### API Integration
- Replace mock data with real API calls
- Implement proper error handling
- Add retry mechanisms
- Implement optimistic updates

## Troubleshooting

### Common Issues

1. **Settings not saving**
   - Check network connectivity
   - Verify API endpoints
   - Check browser console for errors

2. **Validation errors**
   - Ensure all required fields are filled
   - Check field format requirements
   - Verify server-side validation

3. **Performance issues**
   - Check for memory leaks
   - Optimize re-rendering
   - Review auto-save frequency

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('settings-debug', 'true');
```

## Integration Examples

### Backend Integration

```typescript
// API service example
export class SettingsAPI {
  async updateProfile(data: Partial<UserProfile>) {
    const response = await fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await fetch('/api/settings/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return response.json();
  }
}
```

### Database Schema

```sql
-- Users table with settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  profile_data JSONB,
  security_settings JSONB,
  learning_preferences JSONB,
  notification_settings JSONB,
  accessibility_settings JSONB,
  privacy_settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit log for security events
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Contributing

### Development Setup
1. Install dependencies: `npm install`
2. Run tests: `npm test`
3. Start development server: `npm run dev`

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Jest testing framework

### Pull Request Guidelines
- Include tests for new features
- Update documentation
- Follow existing code patterns
- Ensure accessibility compliance
