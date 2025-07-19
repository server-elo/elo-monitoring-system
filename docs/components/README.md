# Component Documentation

This directory contains comprehensive documentation for all components in the Solidity Learning Platform.

## 📚 Component Categories

### 🎨 UI Components (`/components/ui/`)
- **Button**: Accessible button component with multiple variants
- **Input**: Form input components with validation
- **Modal**: Accessible modal dialogs with focus management
- **Tooltip**: Contextual help tooltips
- **Card**: Content container with glassmorphism styling

### ♿ Accessibility Components (`/components/accessibility/`)
- **SkipLink**: Navigation skip links for keyboard users
- **ScreenReaderOnly**: Content visible only to screen readers
- **FocusManager**: Focus management utilities
- **AccessibilityTester**: Development tool for accessibility testing

### 🚀 Performance Components (`/components/performance/`)
- **PerformanceOptimizer**: Wrapper for performance optimizations
- **ServiceWorkerManager**: Service worker registration and management
- **LazyComponent**: Lazy loading wrapper with loading states

### 📖 Help & Documentation (`/components/help/`)
- **HelpSystem**: Comprehensive help and documentation system
- **ContextualTooltip**: Smart tooltips with accessibility support
- **KeyboardShortcuts**: Keyboard shortcut reference guide

### 🎯 Onboarding (`/components/onboarding/`)
- **OnboardingFlow**: Multi-step onboarding with role-based paths
- **InteractiveTutorial**: Feature-specific interactive tutorials

### 🔍 Discovery (`/components/discovery/`)
- **FeatureSpotlight**: Smart feature discovery system
- **SmartTooltip**: Adaptive tooltips based on user behavior

## 🛠️ Component Standards

### Accessibility Requirements
All components must meet WCAG 2.1 AA standards:

```typescript
// Required accessibility props
interface AccessibleComponentProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  role?: string;
  tabIndex?: number;
}

// Example implementation
export const AccessibleButton: React.FC<ButtonProps & AccessibleComponentProps> = ({
  children,
  'aria-label': ariaLabel,
  ...props
}) => {
  return (
    <button
      {...props}
      aria-label={ariaLabel}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </button>
  );
};
```

### Performance Requirements
Components should be optimized for performance:

```typescript
// Lazy loading for heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Memoization for expensive calculations
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => processData(data), [data]);
  return <div>{processedData}</div>;
});

// Virtualization for large lists
import { FixedSizeList as List } from 'react-window';
```

### TypeScript Requirements
All components must have proper TypeScript definitions:

```typescript
// Component props interface
interface ComponentProps {
  /** Primary content */
  children: React.ReactNode;
  /** Component variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Disabled state */
  disabled?: boolean;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Additional CSS classes */
  className?: string;
}

// Component with proper typing
export const Component: React.FC<ComponentProps> = ({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
  className = '',
}) => {
  // Implementation
};
```

### Styling Standards
Components use Tailwind CSS with glassmorphism utilities:

```typescript
// Glassmorphism base classes
const glassClasses = 'glass border border-white/10 backdrop-blur-lg';

// Color variants
const variants = {
  primary: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  secondary: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
  success: 'bg-green-500/10 border-green-500/30 text-green-400',
  danger: 'bg-red-500/10 border-red-500/30 text-red-400',
};

// Responsive design
const responsiveClasses = 'w-full md:w-auto px-4 py-2 md:px-6 md:py-3';
```

## 📝 Documentation Template

Use this template for documenting new components:

```markdown
# ComponentName

Brief description of what the component does.

## Usage

\`\`\`typescript
import { ComponentName } from '@/components/path/ComponentName';

function Example() {
  return (
    <ComponentName
      prop1="value1"
      prop2={value2}
      onAction={handleAction}
    >
      Content
    </ComponentName>
  );
}
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description of prop1 |
| prop2 | boolean | false | Description of prop2 |

## Accessibility

- Supports keyboard navigation
- Screen reader compatible
- ARIA labels provided
- Focus management included

## Examples

### Basic Usage
\`\`\`typescript
<ComponentName>Basic example</ComponentName>
\`\`\`

### Advanced Usage
\`\`\`typescript
<ComponentName
  variant="primary"
  disabled={false}
  onClick={handleClick}
>
  Advanced example
</ComponentName>
\`\`\`

## Testing

\`\`\`typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

test('renders component correctly', () => {
  render(<ComponentName>Test content</ComponentName>);
  expect(screen.getByText('Test content')).toBeInTheDocument();
});
\`\`\`
```

## 🧪 Testing Standards

### Unit Tests
All components must have unit tests:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  test('renders correctly', () => {
    render(<ComponentName>Test</ComponentName>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick}>Click me</ComponentName>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('supports keyboard navigation', () => {
    render(<ComponentName>Keyboard test</ComponentName>);
    const element = screen.getByText('Keyboard test');
    
    element.focus();
    expect(element).toHaveFocus();
    
    fireEvent.keyDown(element, { key: 'Enter' });
    // Assert expected behavior
  });
});
```

### Accessibility Tests
Components must pass accessibility tests:

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ComponentName } from './ComponentName';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<ComponentName>Accessible content</ComponentName>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 🔧 Development Tools

### Storybook
Components should have Storybook stories:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Components/ComponentName',
  component: ComponentName,
  parameters: {
    docs: {
      description: {
        component: 'Component description for Storybook',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default component',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary variant',
    variant: 'primary',
  },
};
```

## 📋 Component Checklist

Before submitting a new component, ensure:

- [ ] TypeScript interfaces defined
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] Performance optimized (memoization, lazy loading)
- [ ] Responsive design implemented
- [ ] Unit tests written (>90% coverage)
- [ ] Accessibility tests passing
- [ ] Storybook story created
- [ ] Documentation written
- [ ] Peer review completed
- [ ] Integration tests passing

## 🤝 Contributing

1. Create a new branch for your component
2. Follow the component standards above
3. Write comprehensive tests
4. Add Storybook stories
5. Update documentation
6. Submit a pull request

For questions or help, please refer to the [Contributing Guide](../CONTRIBUTING.md).
