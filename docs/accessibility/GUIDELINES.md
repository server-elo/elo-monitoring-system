# Accessibility Guidelines

This document outlines the accessibility standards and implementation guidelines for the Solidity Learning Platform.

## 🎯 Accessibility Goals

- **WCAG 2.1 AA Compliance**: Meet or exceed all Level AA success criteria
- **Screen Reader Support**: Full compatibility with NVDA, JAWS, VoiceOver
- **Keyboard Navigation**: Complete keyboard accessibility for all features
- **Inclusive Design**: Usable by people with diverse abilities and needs
- **Performance**: Accessibility features must not impact performance

## 📋 WCAG 2.1 AA Compliance Checklist

### Perceivable

#### 1.1 Text Alternatives
- [ ] All images have appropriate alt text
- [ ] Decorative images use empty alt attributes (`alt=""`)
- [ ] Complex images have detailed descriptions
- [ ] Icons have accessible names

```typescript
// ✅ Good: Meaningful alt text
<img src="chart.png" alt="User progress chart showing 75% completion" />

// ✅ Good: Decorative image
<img src="decoration.svg" alt="" role="presentation" />

// ❌ Bad: Missing or generic alt text
<img src="chart.png" alt="chart" />
```

#### 1.2 Time-based Media
- [ ] Video content has captions
- [ ] Audio content has transcripts
- [ ] Auto-playing media can be paused

#### 1.3 Adaptable
- [ ] Content structure is logical without CSS
- [ ] Information is not conveyed by color alone
- [ ] Text can be resized up to 200% without horizontal scrolling

```typescript
// ✅ Good: Multiple indicators
<div className={cn(
  'status-indicator',
  status === 'success' && 'bg-green-500 text-green-900',
  status === 'error' && 'bg-red-500 text-red-900'
)}>
  {status === 'success' && <CheckIcon />}
  {status === 'error' && <XIcon />}
  {status}
</div>
```

#### 1.4 Distinguishable
- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Color contrast ratio ≥ 3:1 for large text
- [ ] Text can be resized up to 200%
- [ ] Images of text are avoided when possible

### Operable

#### 2.1 Keyboard Accessible
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Logical tab order

```typescript
// ✅ Good: Keyboard event handling
const handleKeyDown = (event: React.KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      onClick();
      break;
    case 'Escape':
      onClose();
      break;
  }
};

<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={onClick}
>
  Interactive element
</div>
```

#### 2.2 Enough Time
- [ ] Time limits can be extended or disabled
- [ ] Auto-updating content can be paused
- [ ] No content flashes more than 3 times per second

#### 2.3 Seizures and Physical Reactions
- [ ] No content causes seizures
- [ ] Motion can be disabled

#### 2.4 Navigable
- [ ] Skip links provided
- [ ] Page titles are descriptive
- [ ] Link purposes are clear
- [ ] Multiple navigation methods available

```typescript
// ✅ Good: Skip links
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
  >
    {children}
  </a>
);
```

### Understandable

#### 3.1 Readable
- [ ] Page language is identified
- [ ] Language changes are identified
- [ ] Unusual words are defined

#### 3.2 Predictable
- [ ] Navigation is consistent
- [ ] Identification is consistent
- [ ] Changes are initiated by user request

#### 3.3 Input Assistance
- [ ] Error messages are clear and helpful
- [ ] Labels and instructions are provided
- [ ] Error prevention for important actions

```typescript
// ✅ Good: Form validation with clear errors
interface FormErrors {
  email?: string;
  password?: string;
}

const validateForm = (data: FormData): FormErrors => {
  const errors: FormErrors = {};
  
  if (!data.email) {
    errors.email = 'Email address is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  return errors;
};
```

### Robust

#### 4.1 Compatible
- [ ] Valid HTML markup
- [ ] Proper ARIA usage
- [ ] Compatible with assistive technologies

## 🛠️ Implementation Guidelines

### ARIA Best Practices

#### Landmarks
```typescript
// ✅ Good: Semantic landmarks
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    {/* Navigation content */}
  </nav>
</header>

<main role="main" id="main-content">
  {/* Main content */}
</main>

<aside role="complementary" aria-label="Related links">
  {/* Sidebar content */}
</aside>

<footer role="contentinfo">
  {/* Footer content */}
</footer>
```

#### Form Labels
```typescript
// ✅ Good: Proper form labeling
<div>
  <label htmlFor="email" className="block text-sm font-medium">
    Email Address *
  </label>
  <input
    id="email"
    type="email"
    required
    aria-describedby="email-error email-help"
    aria-invalid={!!errors.email}
  />
  <div id="email-help" className="text-sm text-gray-600">
    We'll never share your email address
  </div>
  {errors.email && (
    <div id="email-error" className="text-sm text-red-600" role="alert">
      {errors.email}
    </div>
  )}
</div>
```

#### Interactive Elements
```typescript
// ✅ Good: Button with proper ARIA
<button
  type="button"
  aria-expanded={isOpen}
  aria-controls="dropdown-menu"
  aria-haspopup="true"
  onClick={toggleDropdown}
>
  Menu
</button>

<div
  id="dropdown-menu"
  role="menu"
  aria-hidden={!isOpen}
  className={isOpen ? 'block' : 'hidden'}
>
  <a href="/profile" role="menuitem">Profile</a>
  <a href="/settings" role="menuitem">Settings</a>
</div>
```

### Focus Management

#### Focus Indicators
```css
/* ✅ Good: Visible focus indicators */
.focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Custom focus styles for specific components */
.button:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}
```

#### Focus Trapping
```typescript
// ✅ Good: Focus trap for modals
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
};
```

### Screen Reader Support

#### Live Regions
```typescript
// ✅ Good: Live region for dynamic content
export const LiveRegion: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
}> = ({ message, priority = 'polite' }) => (
  <div
    aria-live={priority}
    aria-atomic="true"
    className="sr-only"
  >
    {message}
  </div>
);

// Usage
const [statusMessage, setStatusMessage] = useState('');

const handleSave = async () => {
  try {
    await saveData();
    setStatusMessage('Data saved successfully');
  } catch (error) {
    setStatusMessage('Error saving data. Please try again.');
  }
};

return (
  <>
    <button onClick={handleSave}>Save</button>
    <LiveRegion message={statusMessage} />
  </>
);
```

#### Screen Reader Only Content
```typescript
// ✅ Good: Screen reader only content
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <span className="sr-only">{children}</span>
);

// Usage
<button>
  <TrashIcon />
  <ScreenReaderOnly>Delete item</ScreenReaderOnly>
</button>
```

## 🧪 Testing Guidelines

### Automated Testing

#### axe-core Integration
```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### Keyboard Testing
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('supports keyboard navigation', async () => {
  const user = userEvent.setup();
  render(<InteractiveComponent />);
  
  const button = screen.getByRole('button');
  
  // Test focus
  await user.tab();
  expect(button).toHaveFocus();
  
  // Test activation
  await user.keyboard('{Enter}');
  expect(mockHandler).toHaveBeenCalled();
});
```

### Manual Testing

#### Screen Reader Testing
1. **NVDA (Windows)**: Free, most commonly used
2. **JAWS (Windows)**: Commercial, widely used in enterprise
3. **VoiceOver (macOS)**: Built-in, activate with Cmd+F5
4. **Orca (Linux)**: Free, built into GNOME

#### Testing Checklist
- [ ] Navigate entire app using only keyboard
- [ ] Test with screen reader enabled
- [ ] Verify color contrast in different lighting
- [ ] Test with 200% zoom
- [ ] Verify with reduced motion enabled
- [ ] Test with high contrast mode

### Testing Tools

#### Browser Extensions
- **axe DevTools**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation
- **Lighthouse**: Accessibility audit included
- **Color Oracle**: Color blindness simulator

#### Command Line Tools
```bash
# Install accessibility testing tools
npm install -D @axe-core/cli pa11y

# Run accessibility tests
npx axe-cli http://localhost:3000
npx pa11y http://localhost:3000

# Generate accessibility report
npm run test:accessibility
```

## 📚 Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

### Testing Tools
- [axe-core](https://github.com/dequelabs/axe-core)
- [WAVE](https://wave.webaim.org/)
- [Pa11y](https://pa11y.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Screen Readers
- [NVDA](https://www.nvaccess.org/download/) (Free)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver](https://support.apple.com/guide/voiceover/) (Built-in macOS)

## 🤝 Getting Help

For accessibility questions or issues:
1. Check this documentation first
2. Review WCAG 2.1 guidelines
3. Test with actual assistive technologies
4. Consult with accessibility experts
5. Engage with the disability community

Remember: Accessibility is not a checklist—it's about creating inclusive experiences for all users.
