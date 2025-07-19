# Contributing to Solidity Learning Platform

Thank you for your interest in contributing to the Solidity Learning Platform! This guide will help you get started with contributing to our performance-optimized, accessible learning platform.

## 🎯 Project Goals

- **Performance**: Sub-200ms page load times with 90+ Lighthouse scores
- **Accessibility**: WCAG 2.1 AA compliance for inclusive learning
- **Education**: Effective Solidity learning with AI-powered assistance
- **Collaboration**: Real-time collaborative learning environment
- **Innovation**: Cutting-edge web technologies and best practices

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 20.0.0 or higher
- **Git**: Latest version
- **PostgreSQL**: 14.0 or higher (for database features)
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Development Setup

1. **Fork and Clone**:
```bash
git clone https://github.com/your-username/learning_sol.git
cd learning_sol
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Environment Setup**:
```bash
cp .env.example .env.local
# Configure your environment variables
```

4. **Database Setup**:
```bash
npm run db:push
npm run db:seed  # Optional: Add sample data
```

5. **Start Development**:
```bash
npm run dev  # Uses Turbopack for fast development
```

## 📋 Contribution Guidelines

### Code Standards

#### TypeScript
- Use strict TypeScript configuration
- Provide comprehensive type definitions
- Avoid `any` types - use proper typing

```typescript
// ✅ Good: Proper typing
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
  };
}

// ❌ Bad: Using any
const user: any = getUserData();
```

#### Performance Requirements
- Components must be performance-optimized
- Use React.memo() for expensive components
- Implement lazy loading for heavy features
- Maintain bundle size budgets

```typescript
// ✅ Good: Performance optimized component
const ExpensiveComponent = React.memo<Props>(({ data }) => {
  const processedData = useMemo(() => 
    expensiveCalculation(data), [data]
  );
  
  return <div>{processedData}</div>;
});

// Lazy loading for heavy components
const HeavyFeature = React.lazy(() => import('./HeavyFeature'));
```

#### Accessibility Requirements
- All components must meet WCAG 2.1 AA standards
- Provide proper ARIA labels and roles
- Support keyboard navigation
- Include focus management

```typescript
// ✅ Good: Accessible component
export const AccessibleButton: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
  ...props
}) => {
  return (
    <button
      {...props}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {children}
    </button>
  );
};
```

### Testing Requirements

#### Unit Tests
All components and utilities must have unit tests with >90% coverage:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  test('renders correctly', () => {
    render(<Component title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('handles user interactions', () => {
    const handleClick = jest.fn();
    render(<Component onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Accessibility Tests
Components must pass accessibility tests:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### Performance Tests
Critical components should have performance tests:

```typescript
test('renders within performance budget', async () => {
  const startTime = performance.now();
  render(<HeavyComponent data={largeDataset} />);
  const renderTime = performance.now() - startTime;
  
  expect(renderTime).toBeLessThan(100); // 100ms budget
});
```

### Git Workflow

#### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `perf/description` - Performance improvements
- `a11y/description` - Accessibility improvements
- `docs/description` - Documentation updates

#### Commit Messages
Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
```
feat(editor): add syntax highlighting for Solidity
fix(auth): resolve login redirect issue
perf(images): implement WebP format with fallbacks
a11y(navigation): improve keyboard navigation
docs(api): update authentication documentation
```

#### Pull Request Process

1. **Create Feature Branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**:
   - Follow code standards
   - Write tests
   - Update documentation
   - Ensure accessibility compliance

3. **Test Your Changes**:
```bash
npm run test                    # Unit tests
npm run test:e2e               # End-to-end tests
npm run test:accessibility     # Accessibility tests
npm run test:performance       # Performance tests
npm run lint                   # Code linting
npm run type-check             # TypeScript checking
```

4. **Performance Check**:
```bash
npm run build:analyze          # Bundle analysis
npm run lighthouse             # Performance audit
```

5. **Submit Pull Request**:
   - Use descriptive title and description
   - Reference related issues
   - Include screenshots for UI changes
   - Add performance metrics if applicable

### Code Review Checklist

#### Functionality
- [ ] Code works as expected
- [ ] Edge cases are handled
- [ ] Error handling is comprehensive
- [ ] No console errors or warnings

#### Performance
- [ ] Bundle size impact analyzed
- [ ] Lazy loading implemented where appropriate
- [ ] Images optimized and responsive
- [ ] No performance regressions

#### Accessibility
- [ ] WCAG 2.1 AA compliance verified
- [ ] Keyboard navigation tested
- [ ] Screen reader compatibility confirmed
- [ ] Color contrast meets requirements

#### Code Quality
- [ ] TypeScript types are comprehensive
- [ ] Code is well-documented
- [ ] Tests provide adequate coverage
- [ ] No code duplication

#### Security
- [ ] No sensitive data exposed
- [ ] Input validation implemented
- [ ] XSS prevention measures in place
- [ ] Authentication/authorization respected

## 🧪 Testing

### Running Tests

```bash
# All tests
npm test

# Specific test types
npm run test:unit              # Unit tests
npm run test:integration       # Integration tests
npm run test:e2e              # End-to-end tests
npm run test:accessibility    # Accessibility tests
npm run test:performance      # Performance tests

# Test coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Writing Tests

#### Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  test('renders with correct props', () => {
    render(<ComponentName title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('handles user interactions', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<ComponentName onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalled();
  });
});
```

#### E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test('user can complete lesson', async ({ page }) => {
  await page.goto('/learn/lesson-1');
  
  // Complete lesson steps
  await page.fill('[data-testid="code-editor"]', 'contract Example {}');
  await page.click('[data-testid="compile-button"]');
  
  // Verify completion
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

## 📚 Documentation

### Component Documentation
All components should be documented with:

```typescript
/**
 * A reusable button component with accessibility features
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export interface ButtonProps {
  /** Button content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
}
```

### API Documentation
API endpoints should be documented with OpenAPI/Swagger:

```typescript
/**
 * @swagger
 * /api/lessons:
 *   get:
 *     summary: Get all lessons
 *     tags: [Lessons]
 *     responses:
 *       200:
 *         description: List of lessons
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lesson'
 */
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Information**:
   - Browser and version
   - Operating system
   - Node.js version
   - Screen reader (if applicable)

2. **Steps to Reproduce**:
   - Clear, numbered steps
   - Expected vs actual behavior
   - Screenshots or videos

3. **Additional Context**:
   - Console errors
   - Network requests
   - Performance impact

## 💡 Feature Requests

For new features, please provide:

1. **Problem Statement**: What problem does this solve?
2. **Proposed Solution**: How should it work?
3. **Alternatives Considered**: Other approaches considered
4. **Impact Assessment**: Performance, accessibility, security implications

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Annual contributor appreciation

## 📞 Getting Help

- **Documentation**: Check `/docs` directory first
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord server
- **Email**: Contact maintainers at elvizekaj02@gmail.com

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to making Solidity education more accessible and effective for everyone! 🚀
