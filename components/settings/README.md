# Settings Components

This directory contains all components for the comprehensive settings system of the Solidity Learning Platform.

## Components Overview

### Core Components

#### SettingsPage.tsx
Main container component that provides:
- Collapsible sidebar navigation
- Tab-based content switching
- Keyboard shortcuts (Ctrl+S, Alt+arrows)
- Auto-save status indicators
- Glassmorphism design

#### ProfileSection.tsx
User profile management with:
- Personal information editing
- Avatar upload with drag & drop
- Social media links integration
- Real-time validation
- Edit mode toggle

#### SecuritySection.tsx
Security and privacy features:
- Password change functionality
- Two-factor authentication setup
- Active session monitoring
- Security audit logging
- Session management

#### LearningPreferencesSection.tsx
Learning customization options:
- Difficulty level selection
- Study reminder configuration
- Progress tracking preferences
- Code editor customization
- Collaboration settings

#### NotificationSection.tsx
Notification management:
- Email notification preferences
- Push notification settings
- In-app notification controls
- Category-based controls

#### AccessibilitySection.tsx
Accessibility features:
- Visual accessibility options
- Motor accessibility support
- Cognitive accessibility features
- WCAG 2.1 AA compliance

#### PrivacySection.tsx
Privacy and data management:
- Profile visibility controls
- Data retention settings
- GDPR-compliant data export
- Account deletion
- Data sharing preferences

## Usage Examples

### Basic Usage

```tsx
import { SettingsPage } from '@/components/settings/SettingsPage';

export default function Settings() {
  return <SettingsPage />;
}
```

### Individual Component Usage

```tsx
import { ProfileSection } from '@/components/settings/ProfileSection';
import { useSettings } from '@/lib/hooks/useSettings';

function ProfilePage() {
  const { settings, updateSettings } = useSettings();
  
  return (
    <ProfileSection
      profile={settings?.profile}
      onUpdate={(data) => updateSettings('profile', data, true)}
      validationErrors={[]}
    />
  );
}
```

### Custom Integration

```tsx
import { SecuritySection } from '@/components/settings/SecuritySection';

function SecurityPage() {
  const {
    settings,
    activeSessions,
    updateSettings,
    changePassword,
    setupTwoFactor,
    revokeSession
  } = useSettings();
  
  return (
    <SecuritySection
      security={settings?.security}
      activeSessions={activeSessions}
      onUpdateSecurity={(data) => updateSettings('security', data)}
      onChangePassword={changePassword}
      onSetupTwoFactor={setupTwoFactor}
      onRevokeSession={revokeSession}
      // ... other props
    />
  );
}
```

## Component Props

### Common Props Pattern

All section components follow a similar props pattern:

```tsx
interface SectionProps {
  // Data
  [sectionName]: SectionDataType;
  
  // Update handler
  onUpdate: (data: Partial<SectionDataType>) => Promise<UpdateResult>;
  
  // Optional props
  validationErrors?: SettingsValidationError[];
  className?: string;
}
```

### Specific Props

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
  onSetupTwoFactor: () => Promise<TwoFactorSetupResult>;
  onEnableTwoFactor: (code: string, secret: string) => Promise<TwoFactorResult>;
  onDisableTwoFactor: (code: string) => Promise<TwoFactorResult>;
  onRevokeSession: (sessionId: string) => Promise<SessionResult>;
  onRefreshSessions: () => Promise<void>;
}
```

## Features

### Auto-save
- Debounced auto-save (2-second delay)
- Manual save with Ctrl+S
- Visual save status indicators
- Optimistic updates

### Validation
- Real-time client-side validation
- Server-side validation error display
- Field-specific error messages
- Form submission prevention on errors

### Accessibility
- Full keyboard navigation
- ARIA labels and descriptions
- Screen reader support
- Focus management
- High contrast support

### Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile
- Touch-friendly interactions
- Adaptive layouts

## Styling

### Design System
- Glassmorphism effects with backdrop blur
- Consistent spacing and typography
- Semantic color usage
- Dark theme optimized

### CSS Classes
```css
/* Glass container effects */
.glass-container {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Form validation states */
.field-error {
  border-color: #ef4444;
}

.field-success {
  border-color: #10b981;
}
```

## Testing

### Test Files
- `__tests__/SettingsPage.test.tsx`
- `__tests__/ProfileSection.test.tsx`
- `__tests__/SecuritySection.test.tsx`

### Test Coverage
- Component rendering
- User interactions
- Form validation
- Error handling
- Accessibility compliance

### Running Tests
```bash
# Run all settings tests
npm test components/settings

# Run specific component tests
npm test ProfileSection
npm test SecuritySection

# Run with coverage
npm test -- --coverage components/settings
```

## Performance

### Optimizations
- React.memo for expensive components
- useCallback for event handlers
- Debounced auto-save
- Lazy loading for heavy sections

### Bundle Analysis
```bash
# Analyze bundle size
npm run build:analyze
```

## Customization

### Theming
Components use CSS custom properties for theming:

```css
:root {
  --settings-bg-primary: rgba(17, 24, 39, 0.8);
  --settings-bg-secondary: rgba(31, 41, 55, 0.6);
  --settings-border: rgba(75, 85, 99, 0.3);
  --settings-text-primary: #ffffff;
  --settings-text-secondary: #9ca3af;
}
```

### Custom Validation
```tsx
const customValidation = (data: UserProfile): SettingsValidationError[] => {
  const errors: SettingsValidationError[] = [];
  
  if (!data.firstName) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }
  
  return errors;
};
```

## Troubleshooting

### Common Issues

1. **Components not rendering**
   - Check if useSettings hook is properly initialized
   - Verify all required props are passed
   - Check console for TypeScript errors

2. **Auto-save not working**
   - Verify updateSettings function is called
   - Check network requests in dev tools
   - Ensure proper debouncing

3. **Validation errors not showing**
   - Check validationErrors prop
   - Verify error field names match form fields
   - Check error message rendering

### Debug Mode
```tsx
// Enable debug logging
localStorage.setItem('settings-debug', 'true');
```

## Migration Guide

### From v1 to v2
- Update prop names for consistency
- Replace deprecated validation props
- Update CSS class names

### Breaking Changes
- `onSave` prop renamed to `onUpdate`
- Validation errors now use array format
- CSS classes prefixed with `settings-`

## Contributing

### Adding New Sections
1. Create component in this directory
2. Add to SettingsPage navigation
3. Update useSettings hook
4. Add TypeScript interfaces
5. Write comprehensive tests
6. Update documentation

### Code Standards
- Follow existing component patterns
- Use TypeScript strict mode
- Include comprehensive prop types
- Add accessibility attributes
- Write unit tests
